/**
 * OpenAI Handler Module
 * 
 * Centralizes all AI interactions for the Adventure Game system.
 * Provides consistent prompt engineering and system message handling.
 */

/**
 * Base system prompt that explains the overall game mechanics to the AI
 */
const BASE_SYSTEM_PROMPT = `You are part of an interactive text-based adventure game engine. This is a "Choose Your Own Adventure" style game where:

1. GAME STRUCTURE: The story is divided into "steps" connected by semantic triggers
2. YOUR ROLE: You act as both a conversational AI and story progression detector
3. CONVERSATION MODE: Respond naturally and engagingly to player input
4. PROGRESSION MODE: Detect when players have made story-changing decisions
5. NARRATIVE STYLE: Be descriptive, immersive, and maintain consistent tone

IMPORTANT: Players can chat freely about the current scene. Only advance the story when they've clearly made a decision that matches one of the available story branches.`;

/**
 * Generates the opening narrative for a new step
 * 
 * @param {Object} context - Game context
 * @param {string} context.persona - Game master persona
 * @param {string} context.adventurePrompt - Overall adventure context
 * @param {string} context.pathPrompt - Current path context  
 * @param {string} context.stepPrompt - Current step scene
 * @returns {Object} Formatted messages for OpenAI
 */
export function createInitialNarrativePrompt(context) {
    const { persona, adventurePrompt, pathPrompt, stepPrompt } = context;
    
    return [
        {
            role: 'system',
            content: `${BASE_SYSTEM_PROMPT}\n\n${persona}\n\nAdventure Context: ${adventurePrompt}\nPath Context: ${pathPrompt}\n\nYour goal is to set the stage. Begin the story by presenting the following scene in an engaging way. Do not ask the player what to do, simply present the scene vividly.`
        },
        {
            role: 'user',
            content: `Scene to narrate: ${stepPrompt}`
        }
    ];
}

/**
 * Generates conversational response to player input
 * 
 * @param {Object} context - Game context
 * @param {string} context.persona - Game master persona
 * @param {string} context.adventurePrompt - Overall adventure context
 * @param {string} context.pathPrompt - Current path context
 * @param {string} context.stepPrompt - Current step scene
 * @param {string} context.playerInput - What the player said/did
 * @returns {Object} Formatted messages for OpenAI
 */
export function createConversationPrompt(context) {
    const { persona, adventurePrompt, pathPrompt, stepPrompt, playerInput } = context;
    
    return [
        {
            role: 'system',
            content: `${BASE_SYSTEM_PROMPT}\n\n${persona}\n\nAdventure Context: ${adventurePrompt}\nCurrent Scene: ${stepPrompt}\nPath Context: ${pathPrompt}\n\nRespond naturally to the player's action. Be engaging and descriptive. Continue the conversation fluidly. Do not advance the story unless explicitly told to do so.`
        },
        {
            role: 'user',
            content: `Player says/does: ${playerInput}`
        }
    ];
}

/**
 * Analyzes if player input should trigger story progression
 * 
 * @param {Object} context - Game context
 * @param {string} context.stepPrompt - Current step scene
 * @param {string} context.playerInput - What the player said/did
 * @param {Array} context.triggers - Available story triggers
 * @returns {Object} Formatted messages for OpenAI
 */
export function createProgressionAnalysisPrompt(context) {
    const { stepPrompt, playerInput, triggers } = context;
    
    const triggersList = triggers.map(t => ({
        id: t.id,
        condition: t.action,
        description: `Trigger when: ${t.action}`
    }));
    
    return [
        {
            role: 'system',
            content: `${BASE_SYSTEM_PROMPT}\n\nYou are now in PROGRESSION ANALYSIS mode. Your job is to determine if the player's action semantically matches any of the available story branches.\n\nAvailable Story Branches:\n${JSON.stringify(triggersList, null, 2)}\n\nAnalyze the player's intent. Only progress the story if their action clearly matches one of the trigger conditions. Be semantic, not literal - understand the player's intent.\n\nRespond with ONLY a JSON object:\n- If no progression: {"shouldProgress": false}\n- If progression: {"shouldProgress": true, "triggerId": "matching_trigger_id"}`
        },
        {
            role: 'user',
            content: `Current scene: ${stepPrompt}\nPlayer's action: ${playerInput}\n\nDoes this action trigger any story progression?`
        }
    ];
}

/**
 * Temperature settings for different AI interactions
 */
export const AI_TEMPERATURES = {
    NARRATIVE: 0.7,      // Creative storytelling
    CONVERSATION: 0.6,   // Natural dialogue  
    PROGRESSION: 0.2,    // Logical analysis
    TRANSITION: 0.5      // Balanced creativity
};

/**
 * Common AI interaction patterns
 */
export const AI_PATTERNS = {
    MAX_TOKENS: 500,
    MODEL: 'gpt-4.1-nano',
    TIMEOUT: 30000
}; 