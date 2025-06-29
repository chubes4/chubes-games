import { createRoot } from 'react-dom/client';
import { StrictMode, useState, useEffect, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

const AIAdventureGame = ( { attributes, innerBlocks } ) => {
	const [storyLog, setStoryLog] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const [playerInput, setPlayerInput] = useState('');
	const storyLogRef = useRef(null);
	const [currentStepId, setCurrentStepId] = useState(null);
	
	// Auto-scroll the story log
	useEffect(() => {
		if (storyLogRef.current) {
			storyLogRef.current.scrollTop = storyLogRef.current.scrollHeight;
		}
	}, [storyLog]);
	
	// Helper to find a block and its parent path
	const findStepAndPath = (stepId) => {
		for (const path of innerBlocks) {
			const step = path.innerBlocks.find(s => s.attributes.stepId === stepId);
			if (step) {
				return { step, path };
			}
		}
		return { step: null, path: null };
	};

	// Fetches the initial narrative when the game starts
	const getInitialNarrative = async (step, path) => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await apiFetch({
				path: '/chubes-games/v1/adventure',
				method: 'POST',
				data: {
					is_initial_turn: true,
					gameMasterPersona: attributes.gameMasterPersona,
					adventurePrompt: attributes.adventurePrompt,
					pathPrompt: path.attributes.pathPrompt,
					stepPrompt: step.attributes.stepPrompt,
				},
			});
			setStoryLog([{ type: 'ai', content: response.narrative }]);
		} catch (err) {
			setError(err.message || 'Error fetching initial narrative.');
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	// Handles the player's turn
	const handlePlayerInputSubmit = async (e) => {
		e.preventDefault();
		if (!playerInput.trim() || isLoading) return;

		const currentInput = playerInput;
		setPlayerInput('');
		setStoryLog(prevLog => [...prevLog, { type: 'player', content: currentInput }]);
		setIsLoading(true);
		setError(null);
		
		try {
			const { step: currentStep, path: currentPath } = findStepAndPath(currentStepId);
			if (!currentStep) throw new Error("Current game step could not be found.");

			const triggers = currentStep.attributes.triggers.map((trigger) => ({
				id: trigger.destinationStep, // Use destination as the ID
				action: trigger.triggerPhrase,
				destination: trigger.destinationStep,
			}));
			
			const response = await apiFetch({
				path: '/chubes-games/v1/adventure',
				method: 'POST',
				data: {
					playerInput: currentInput,
					triggers: triggers,
					gameMasterPersona: attributes.gameMasterPersona,
					adventurePrompt: attributes.adventurePrompt,
					pathPrompt: currentPath.attributes.pathPrompt,
					stepPrompt: currentStep.attributes.stepPrompt,
				},
			});

			const nextStepId = response.nextStepId;
			if (!nextStepId) throw new Error("AI did not return a valid next step.");

			setCurrentStepId(nextStepId); // Move to the next step

		} catch (err) {
			setError(err.message || 'An error occurred processing your action.');
			console.error(err);
			setIsLoading(false);
		}
	};
	
	// Narrates the current step when `currentStepId` changes
	useEffect(() => {
		if (!currentStepId) return;
		if (storyLog.length === 0) return; // Don't narrate on the initial setup

		const { step: nextStep } = findStepAndPath(currentStepId);
		if (nextStep) {
			// Here, you could make another API call to get a creative transition.
			// For now, we'll just display the next step's prompt directly.
			setStoryLog(prevLog => [...prevLog, { type: 'ai', content: nextStep.attributes.stepPrompt }]);
			setIsLoading(false);
		} else {
			setError(`Error: Could not find step with ID: ${currentStepId}`);
			setIsLoading(false);
		}

	}, [currentStepId]);

	// Initialize the game
	useEffect(() => {
		const firstStepBlock = innerBlocks.flatMap(path => path.innerBlocks).find(step => step.attributes.isFirstStep);
		if (firstStepBlock) {
			const { step, path } = findStepAndPath(firstStepBlock.attributes.stepId);
			if (step && path) {
				setCurrentStepId(step.attributes.stepId);
				getInitialNarrative(step, path);
			} else {
				setError("Game consistency error. Could not find path for the first step.");
				setIsLoading(false);
			}
		} else {
			setError("Game configuration error: No starting step found.");
			setIsLoading(false);
		}
	}, [innerBlocks, attributes]);


	return (
		<div className="chubes-game-window">
			<div className="ai-adventure-game">
				<div className="story-log" ref={storyLogRef}>
					{storyLog.map((entry, index) => (
						<div key={index} className={`story-entry ${entry.type}`}>{entry.content}</div>
					))}
					{isLoading && <div className="story-entry ai">...</div>}
					{error && <div className="story-entry error">{error}</div>}
				</div>
				<form className="player-input-form" onSubmit={handlePlayerInputSubmit}>
					<input
						type="text"
						value={playerInput}
						onChange={(e) => setPlayerInput(e.target.value)}
						placeholder="What do you do?"
						disabled={isLoading}
					/>
					<button type="submit" disabled={isLoading}>Send</button>
				</form>
			</div>
		</div>
	);
};

const App = ({ attributes, innerBlocks }) => {
	if (!attributes || !innerBlocks || innerBlocks.length === 0) {
		return <p>Loading Adventure...</p>;
	}
	return (
		<StrictMode>
			<AIAdventureGame attributes={attributes} innerBlocks={innerBlocks} />
		</StrictMode>
	);
};

document.addEventListener('DOMContentLoaded', () => {
	const gameWrappers = document.querySelectorAll('.wp-block-chubes-games-ai-adventure');
	gameWrappers.forEach(wrapper => {
		const attributes = JSON.parse(wrapper.dataset.attributes || '{}');
		const innerBlocks = JSON.parse(wrapper.dataset.innerblocks || '[]');
		const root = createRoot(wrapper);
		root.render(<App attributes={attributes} innerBlocks={innerBlocks} />);
	});
});

export default App; 