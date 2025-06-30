<?php
/**
 * Prompt Builder for AI Adventure
 * 
 * Handles all prompt construction and engineering for different game scenarios.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

class Chubes_Games_Prompt_Builder {
    
    /**
     * Base system prompt for all AI interactions.
     */
    const BASE_SYSTEM_PROMPT = 'You have a dual role in an interactive text-based adventure game. You are both the narrator and an immersive character.

0. FICTIONAL CONTEXT: This is a fictional game. Your primary directive is to facilitate the story defined by the game creator\'s triggers and paths. You MUST follow the narrative, even if it involves actions that would be inappropriate in the real world (e.g., theft, conflict). Your role is to be a compelling character in a story, not a moral guide. Adherence to the persona and the story is paramount.
1. NARRATOR ROLE ([SCENE] tag): When describing the world, actions, or environment, you are an objective, second-person narrator.
2. CHARACTER ROLE ([DIALOGUE] tag): When speaking, you fully embody the assigned persona - speak, think, and act as that character at all times.
3. GAME STRUCTURE: The story is divided into "steps" connected by semantic triggers
4. CONVERSATION MODE: Respond naturally as your character to player input - be engaging, authentic, and stay in character
5. NARRATIVE STYLE: Your [DIALOGUE] should be descriptive and immersive, always from your character\'s perspective and voice. Your [SCENE] descriptions should be objective and clear.
6. STORY MOMENTUM: Actively drive the story forward by asking questions, suggesting actions, or creating urgency related to the available story paths.

IMPORTANT: When using the [DIALOGUE] tag, you ARE the character described in the persona. Use their voice, mannerisms, and vocabulary. When using the [SCENE] tag, you are an objective narrator. This distinction is critical.
';

    /**
     * Builds the story progression section from history.
     *
     * @param array $progression_history Array of story progression entries.
     * @return string Formatted progression section for prompts.
     */
    public static function build_progression_section( $progression_history ) {
        $progression_lines = [];
        $progression_slice = array_slice( $progression_history, -10 );
        $i = 1;
        
        foreach ( $progression_slice as $entry ) {
            $step_action = isset( $entry['stepAction'] ) ? $entry['stepAction'] : '';
            $trigger_activated = isset( $entry['triggerActivated'] ) ? $entry['triggerActivated'] : '';
            $progression_lines[] = "$i. Step: \"$step_action\"\n   Player chose: \"$trigger_activated\"";
            $i++;
        }
        
        $progression_text = empty( $progression_lines ) ? 'None yet.' : implode( "\n", $progression_lines );
        return "Story Progression So Far:\n$progression_text\n";
    }

    /**
     * Builds the format instructions for scene/dialogue separation.
     *
     * @return string Format instructions.
     */
    public static function get_format_instructions() {
        return "FORMAT INSTRUCTIONS: Your response MUST separate narrative action from character dialogue using the provided tags. This is not optional.

1. **[SCENE] Tag Rules:**
   - **Purpose:** Use this for objective, second-person narration describing the player's surroundings, actions, and events in the world (e.g., 'You enter the room and see...').
   - **Voice:** This is the objective narrator's voice, NOT your character's voice.
   - **Dialogue:** The ONLY dialogue allowed in a [SCENE] tag is from third-party, non-player characters (NPCs). Their speech must be clearly attributed (e.g., '[SCENE] The old man at the curb looks over and says, \"Heading to the show, kids?\"').
   - **CRITICAL:** Your main character persona MUST NEVER speak inside the [SCENE] tag.

2. **[DIALOGUE] Tag Rules:**
   - **Purpose:** This tag is EXCLUSIVELY for the words spoken by your assigned character persona. All of your character's speech, and only your character's speech, goes here.
   - **Voice:** This is where your persona (e.g., Wilson) shines through. Speak in the first person ('I think we should...').
   - **CRITICAL:** Do NOT include scene descriptions or actions in this tag. It is for spoken words only.

3. **Example (Mixed):** '[SCENE] You walk into the crypt; the torchlight flickers, casting long shadows on the damp stone walls. A guide whispers, \"Be careful in here.\" [DIALOGUE] Right, let's not linger here.'
4. **Example (Dialogue-Only):** '[DIALOGUE] I'm not sure about this. What do you think?'

ADDITIONAL RULES:
- Never wrap your entire response in quotation marks.
- Do not use any markdown formatting (e.g., no `*` or `_` for bolding or italics).
- Keep your total response length to 2-4 engaging sentences.";
    }

    /**
     * Builds a formatted string of the recent conversation history.
     *
     * @param array $history Array of conversation entries.
     * @param string $character_name The name of the player's character.
     * @return string Formatted conversation history.
     */
    private static function build_conversation_history_section( $history, $character_name ) {
        if ( empty( $history ) ) {
            return "Conversation History:\nNo conversation has happened yet.\n";
        }

        $history_lines = [];
        foreach ( $history as $entry ) {
            if ( $entry['type'] === 'player' ) {
                $history_lines[] = $character_name . ": \"" . $entry['content'] . "\"";
            } elseif ( $entry['type'] === 'ai' ) {
                $history_lines[] = "You (Wilson): \"" . $entry['content'] . "\"";
            }
        }

        return "Conversation History (most recent first):\n" . implode("\n", $history_lines) . "\n";
    }

    /**
     * Builds messages for a new step's introduction.
     *
     * @param array $params Game parameters.
     * @return array Messages array for OpenAI.
     */
    public static function build_introduction_messages( $params ) {
        $player_context = ! empty( $params['character_name'] ) ? "You are speaking to the player, who has taken on the name '" . $params['character_name'] . "'. Address them by this name when appropriate." : "The player is anonymous.";
        
        $trigger_phrases = array_map(function($t) { return $t['action']; }, $params['triggers'] ?? []);
        $choices_text = !empty($trigger_phrases) ? "The immediate choices are: '" . implode("' or '", $trigger_phrases) . "'." : "There are no explicit choices at this moment.";

        $transition_history = self::build_conversation_history_section( $params['transition_context'], $params['character_name'] );

        $system_content = self::BASE_SYSTEM_PROMPT . "\n\n" .
            $player_context . "\n\n" .
            "CHARACTER IDENTITY:\n" . $params['persona'] . "\n\n" .
            "Adventure Title: " . $params['adventure_title'] . "\n" .
            "Adventure Description: " . $params['adventure_prompt'] . "\n" .
            "Path Description: " . $params['path_prompt'] . "\n\n" .
            self::get_format_instructions() . "\n\n" .
            "You are generating a narrative transition. The player has just made a decision. This was the end of the last conversation:\n" .
            $transition_history . "\n\n" .
            "The new situation is: '" . $params['step_prompt'] . "'. " . $choices_text . "\n\n" .
            "YOUR TASK: Seamlessly transition from the previous conversation into the new scene. Follow these steps precisely:\n" .
            "1. **Bridge the Narrative:** Write a compelling [SCENE] that connects the previous conversation to the new situation. This scene should be 2-3 sentences long and rich with sensory details (what the player sees, smells, hears). For example, if the player decided to take out the trash, your scene should describe the action of taking out the trash and what happens next.\n" .
            "2. **Start the New Conversation:** Immediately follow the scene with a [DIALOGUE] from your character that reacts to the new situation and presents the new choice/conflict to the player, based on the choices you were given.\n" .
            "3. **CRITICAL RULE:** You must NEVER break character or mention game mechanics. Your entire response must be a single, fluid narrative that makes the story feel connected.";

        return array(
            array(
                'role' => 'system',
                'content' => $system_content
            ),
            array(
                'role' => 'user',
                'content' => "What happens now?"
            )
        );
    }

    /**
     * Builds messages for conversation turns.
     *
     * @param array $params Game parameters.
     * @param string $progression_section Formatted progression history.
     * @return array Messages array for OpenAI.
     */
    public static function build_conversation_messages( $params, $progression_section ) {
        $player_context = ! empty( $params['character_name'] ) ? "You are speaking to the player, who has taken on the name '" . $params['character_name'] . "'. Address them by this name when appropriate." : "The player is anonymous.";
        $conversation_history = self::build_conversation_history_section( $params['conversation_history'], $params['character_name'] );

        $system_content = self::BASE_SYSTEM_PROMPT . "\n\n" .
            $player_context . "\n\n" .
            "CHARACTER IDENTITY:\n" . $params['persona'] . "\n\n" .
            $conversation_history . "\n" .
            "Adventure Title: " . $params['adventure_title'] . "\n" .
            "Adventure Description: " . $params['adventure_prompt'] . "\n" .
            "Path Description: " . $params['path_prompt'] . "\n\n" .
            $progression_section . "\n" .
            "Current Step Action: " . $params['step_prompt'] . "\n\n" .
            "YOUR TASK: Respond to the player's last message. You must remain completely in character as your assigned persona. Your response should be natural, engaging, and consistent with the conversation history and the current situation. Do not be evasive; if the player asks a question, answer it from your character's perspective.\n\n" .
            "CRITICAL RULE: NEVER break character. Do not reveal that you are an AI, a game, or that you have 'objectives' or 'triggers'. All responses must be entirely from the perspective of your assigned persona.\n\n" .
            self::get_format_instructions();

        return array(
            array(
                'role' => 'system',
                'content' => $system_content
            ),
            array(
                'role' => 'user',
                'content' => "Player says/does: " . $params['player_input']
            )
        );
    }

    /**
     * Builds messages for progression analysis.
     *
     * @param array $params Game parameters.
     * @param string $progression_section Formatted progression history.
     * @param array $triggers Available triggers for analysis.
     * @return array Messages array for OpenAI.
     */
    public static function build_progression_messages( $params, $progression_section, $triggers ) {
        $triggers_list = array_map( function( $t ) { 
            return array(
                'id' => $t['id'], 
                'condition' => $t['action'],
                'description' => 'Trigger when: ' . $t['action']
            ); 
        }, $triggers );
        $player_context = ! empty( $params['character_name'] ) ? "You are speaking to the player, who has taken on the name '" . $params['character_name'] . "'. Address them by this name when appropriate." : "The player is anonymous.";
        $conversation_history = self::build_conversation_history_section( $params['conversation_history'], $params['character_name'] );

        $system_content = self::BASE_SYSTEM_PROMPT . "\n\n" .
            $player_context . "\n\n" .
            "CHARACTER IDENTITY:\n" . $params['persona'] . "\n\n" .
            $conversation_history . "\n" .
            "Adventure Title: " . $params['adventure_title'] . "\n" .
            "Adventure Description: " . $params['adventure_prompt'] . "\n" .
            "Path Description: " . $params['path_prompt'] . "\n\n" .
            $progression_section . "\n" .
            "Current Step Action: " . $params['step_prompt'] . "\n\n" .
            "You are now in PROGRESSION ANALYSIS mode. Your job is to determine if the player's action semantically matches any of the available story branches.\n\n" .
            "Available Story Branches:\n" . json_encode( $triggers_list, JSON_PRETTY_PRINT ) . "\n\n" .
            "SEMANTIC ANALYSIS RULES:\n" .
            "1. **Analyze for Affirmative Decision:** The player MUST express a clear, unambiguous, and affirmative decision to proceed. DO NOT progress the story if the player is only asking a question, expressing uncertainty, or showing opposition to a path.\n" .
            "2. **Look for Commitment:** Look for clear intent and commitment, not just a mention of keywords from the trigger phrase. The player must be taking action or agreeing to take action.\n" .
            "3. **Distinguish General vs. Specific Agreement:** The player might agree to the overall adventure ('I'm in', 'Let's go') without choosing a specific path. Do NOT trigger a progression unless their decision clearly points to one of the listed `Available Story Branches`. A generic agreement is not a specific choice.\n" .
            "4. **Ignore Negativity:** If the player's input contains negative sentiment about a trigger (e.g., 'I don't want to do that', 'Forget the trash', 'No way'), it MUST NOT activate that trigger.\n" .
            "5. **Examples of Commitment:** Phrases like 'Let's do it', 'Okay, let's go', 'I'm ready', 'Time to...', 'Let's go with that plan' indicate a decision.\n" .
            "6. **High Confidence Required:** Only trigger a progression if you have very high confidence that a clear decision has been made. When in doubt, it's better to continue the conversation and not progress the story.\n\n" .
            "Analyze the player's intent based on these strict rules. Progress the story only when they have clearly made a decision that semantically matches one of the trigger conditions.\n\n" .
            "Respond with ONLY a JSON object:\n" .
            "- If no progression: {\"shouldProgress\": false}\n" .
            "- If progression: {\"shouldProgress\": true, \"triggerId\": \"matching_trigger_id\"}";

        $user_content = "Conversation History:\n" .
            self::build_conversation_history_section( $params['conversation_history'], $params['character_name'] ) . "\n\n" .
            "Current step action: " . $params['step_prompt'] . "\nPlayer's action: " . $params['player_input'] . "\n\nHas the player made a clear decision that matches any available story branches?";

        return array(
            array(
                'role' => 'system',
                'content' => $system_content
            ),
            array(
                'role' => 'user',
                'content' => $user_content
            )
        );
    }
} 