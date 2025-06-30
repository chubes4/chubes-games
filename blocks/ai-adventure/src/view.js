import { createRoot } from 'react-dom/client';
import { StrictMode, useState, useEffect, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import OpeningScreen from './OpeningScreen';

const AIAdventureGame = ( { attributes, innerBlocks } ) => {
	const [storyLog, setStoryLog] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [playerInput, setPlayerInput] = useState('');
	const [gameStarted, setGameStarted] = useState(false);
	const [gameOver, setGameOver] = useState(false);
	const [currentStepId, setCurrentStepId] = useState(null);
	const [previousSteps, setPreviousSteps] = useState([]);
	const [storyProgression, setStoryProgression] = useState([]);
	const storyLogRef = useRef(null);
	
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

	// Opening screen: show title and adventure description
	if (!gameStarted) {
		return (
			<OpeningScreen
				title={attributes.title || 'AI Adventure'}
				description={attributes.adventurePrompt || 'No adventure description provided.'}
				buttonText="Play"
				onButtonClick={() => setGameStarted(true)}
			/>
		);
	}

	// End game screen
	if (gameOver) {
		return (
			<OpeningScreen
				title="Game Over"
				description="Thank you for playing!"
				buttonText="Restart"
				onButtonClick={() => {
					setGameOver(false);
					setGameStarted(false);
					setStoryLog([]);
					setCurrentStepId(null);
					setPreviousSteps([]);
					setStoryProgression([]);
				}}
			/>
		);
	}

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
					conversationHistory: [],
					previousSteps: [],
					storyProgression: [],
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

			// Extract triggers from current step (if any)
			const triggers = (currentStep.attributes.triggers || []).map((trigger, index) => ({
				id: trigger.destinationStep || `trigger-${index}`,
				action: trigger.triggerPhrase,
				destination: trigger.destinationStep,
			}));
			
			// Prepare conversation history and previous steps
			const conversationHistory = storyLog.slice(-10); // last 10 exchanges
			const prevSteps = [...previousSteps, currentStepId];
			const prevStoryProgression = [...storyProgression];
			
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
					conversationHistory,
					previousSteps: prevSteps,
					storyProgression: prevStoryProgression,
				},
			});

			// Add the AI's narrative response to the story log
			setStoryLog(prevLog => [...prevLog, { type: 'ai', content: response.narrative }]);

			if (response.nextStepId) {
				if (response.nextStepId === 'end_game') {
					setGameOver(true);
					return;
				}
				// Find the trigger that was activated
				let activatedTrigger = triggers.find(t => t.destination === response.nextStepId);
				let triggerPhrase = activatedTrigger ? activatedTrigger.action : currentInput;
				setPreviousSteps(prevSteps);
				setCurrentStepId(response.nextStepId);
				setStoryProgression(prev => [
					...prev,
					{
						stepAction: currentStep.attributes.stepPrompt,
						triggerActivated: triggerPhrase
					}
				]);
			}

		} catch (err) {
			setError(err.message || 'An error occurred processing your action.');
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};
	
	// Narrates the current step when `currentStepId` changes (for story progression)
	useEffect(() => {
		if (!currentStepId) return;
		if (storyLog.length === 0) return; // Don't narrate on the initial setup

		const { step: nextStep, path: nextPath } = findStepAndPath(currentStepId);
		if (nextStep && nextPath) {
			const getStepTransition = async () => {
				setIsLoading(true);
				try {
					const response = await apiFetch({
						path: '/chubes-games/v1/adventure',
						method: 'POST',
						data: {
							is_initial_turn: true,
							gameMasterPersona: attributes.gameMasterPersona,
							adventurePrompt: attributes.adventurePrompt,
							pathPrompt: nextPath.attributes.pathPrompt,
							stepPrompt: nextStep.attributes.stepPrompt,
							conversationHistory: storyLog.slice(-10),
							previousSteps: [...previousSteps, currentStepId],
							storyProgression: storyProgression,
						},
					});
					setStoryLog(prevLog => [...prevLog, { type: 'ai', content: response.narrative }]);
				} catch (err) {
					setError(`Error transitioning to new step: ${err.message}`);
					console.error(err);
				} finally {
			setIsLoading(false);
				}
			};
			
			getStepTransition();
		} else {
			setError(`Error: Could not find step with ID: ${currentStepId}`);
			setIsLoading(false);
		}

	}, [currentStepId]);

	// Initialize the game
	useEffect(() => {
		if (!gameStarted) return;
		const allSteps = Array.isArray(innerBlocks)
			? innerBlocks.reduce((acc, path) => {
				if (Array.isArray(path.innerBlocks)) {
					return acc.concat(path.innerBlocks);
				}
				return acc;
			}, [])
			: [];
		
		// Use the first step in the first path as the starting step
		const firstStepBlock = Array.isArray(innerBlocks) && innerBlocks.length > 0 && 
							  Array.isArray(innerBlocks[0].innerBlocks) && innerBlocks[0].innerBlocks.length > 0
							  ? innerBlocks[0].innerBlocks[0]
							  : null;
		
		if (firstStepBlock) {
			const { step, path } = findStepAndPath(firstStepBlock.attributes.stepId);
			if (step && path) {
				setCurrentStepId(step.attributes.stepId);
				setPreviousSteps([]);
				setStoryProgression([]);
				getInitialNarrative(step, path);
			} else {
				setError("Game consistency error. Could not find path for the first step.");
				setIsLoading(false);
			}
		} else {
			setError("Game configuration error: No paths or steps found.");
			setIsLoading(false);
		}
	}, [gameStarted, innerBlocks, attributes]);


	return (
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
	);
};

const App = ({ attributes, innerBlocks }) => {
	console.log('AI Adventure App - Received data:', { attributes, innerBlocks });
	console.log('InnerBlocks length:', innerBlocks ? innerBlocks.length : 'undefined');
	console.log('InnerBlocks structure:', innerBlocks);
	
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
	console.log('Found AI Adventure blocks:', gameWrappers.length);
	
	gameWrappers.forEach((wrapper, index) => {
		console.log(`Processing block ${index}:`, wrapper);
		
		// Extract attributes from the wrapper
		const attributes = {
			gameMasterPersona: 'You are a helpful and creative text-based adventure game master.', // Default
			title: wrapper.querySelector('.adventure-title')?.textContent || '',
			adventurePrompt: wrapper.querySelector('.adventure-prompt-storage p')?.textContent || ''
		};
		
		// Extract inner blocks from the DOM structure
		const pathElements = wrapper.querySelectorAll('.wp-block-chubes-games-ai-adventure-path');
		const innerBlocks = Array.from(pathElements).map((pathEl, pathIndex) => {
			const pathPrompt = pathEl.querySelector('.ai-adventure-path-prompt')?.textContent || '';
			const pathLabel = pathEl.querySelector('h3')?.textContent || '';
			
			// Get step blocks within this path
			const stepElements = pathEl.querySelectorAll('.wp-block-chubes-games-ai-adventure-step');
			const stepBlocks = Array.from(stepElements).map((stepEl, stepIndex) => {
				const stepPrompt = stepEl.querySelector('.ai-adventure-step-prompt')?.textContent || '';
				const stepLabel = stepEl.querySelector('h4')?.textContent || '';
				const stepId = stepEl.dataset.stepId || `step-${pathIndex}-${stepIndex}`;
				
				// Extract triggers from data attribute
				let triggers = [];
				try {
					const triggersData = stepEl.dataset.triggers;
					if (triggersData) {
						triggers = JSON.parse(triggersData);
					}
				} catch (e) {
					console.warn('Failed to parse triggers for step:', stepId, e);
					triggers = [];
				}
				
				return {
					name: 'chubes-games/ai-adventure-step',
					attributes: {
						stepPrompt,
						label: stepLabel,
						stepId,
						triggers: triggers // Now properly extracted from DOM
					}
				};
			});
			
			return {
				name: 'chubes-games/ai-adventure-path',
				attributes: {
					pathPrompt,
					label: pathLabel
				},
				innerBlocks: stepBlocks
			};
		});
		
		console.log(`Block ${index} - Extracted data:`, { attributes, innerBlocks });
		
		const root = createRoot(wrapper);
		root.render(<App attributes={attributes} innerBlocks={innerBlocks} />);
	});
});

export default App; 