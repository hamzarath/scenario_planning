import React, { useState } from 'react';
import './App.css';
import { Scenario, GameState, ROUND_PROMPTS, parseLLMResponse, parseFinalRecap } from './gameLogic';
import { sendMessage } from './services/llmService';
import styled from 'styled-components';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px;
  box-sizing: border-box;
  background-color: #f5f5f5;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
`;

const MessagesContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 8px;
  margin: 20px 0;
  position: relative;
  min-height: calc(100vh - 200px);
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 800px;
  margin: 0 auto;
`;

const StartScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 80px;
  gap: 30px;
  max-width: 800px;
  margin: 0 auto;
  font-family: inherit;

  h1 {
    font-family: inherit;
    font-size: 2em;
    margin: 0;
    font-weight: bold;
  }
`;

const WelcomeText = styled.p`
  font-size: 1.2em;
  line-height: 1.6;
  color: #2c3e50;
  padding: 0 40px;
  max-width: 600px;
  margin: 0 auto;
  font-family: inherit;
`;

const GameRecap = styled.div`
  margin: 0;
  font-family: inherit;

  h2 {
    font-family: inherit;
    margin: 0 0 20px 0;
    padding: 0;
    font-size: 24px;
    font-weight: bold;
  }
`;

const RecapContent = styled.div`
  margin: 0;
  padding: 0;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
`;

const Timeline = styled.div`
  margin: 0;
  padding: 0;
  font-family: inherit;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const RoundEntry = styled.div`
  display: flex;
  flex-direction: column;
  gap: 25px;
  margin-bottom: 25px;
`;

const RoundTitle = styled.div`
  font-family: inherit;
  font-size: 16px;
  color: #2c3e50;
  margin-bottom: 5px;
  font-weight: bold;
`;

const RoundDetail = styled.div`
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  color: #2c3e50;
  margin-bottom: 25px;
`;

const FinalOutcome = styled.div`
  margin: 30px 0 0 0;
  padding: 0;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-line;

  h3 {
    font-family: inherit;
    margin: 0 0 15px 0;
    padding: 0;
    font-size: 18px;
    font-weight: bold;
  }

  ul {
    margin: 10px 0;
    padding-left: 20px;
  }

  li {
    margin: 5px 0;
  }
`;

const ScenariosContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 0;
  margin: 15px 0;
`;

const OptionButton = styled.button`
  padding: 25px;
  margin: 0;
  border: none;
  border-radius: 8px;
  background-color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

const OptionHeader = styled.div`
  font-weight: bold;
  margin-bottom: 15px;
  font-size: 1.2em;
  color: #2c3e50;
  font-family: inherit;
`;

const OptionContent = styled.div`
  color: #34495e;
  line-height: 1.6;
  font-family: inherit;
  font-size: 14px;
`;

const RoundIndicator = styled.div`
  font-size: 1.2em;
  font-weight: bold;
  color: #2c3e50;
  padding: 15px 0;
  margin-bottom: 10px;
  font-family: inherit;
`;

const ScenarioDescription = styled.div`
  padding: 15px 0;
  margin-bottom: 15px;
  font-size: 14px;
  line-height: 1.6;
  color: #2c3e50;
  font-family: inherit;
`;

const ScenarioLabel = styled.div`
  font-size: 1.2em;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
  font-family: inherit;
`;

const ServiceInput = styled.textarea`
  width: 100%;
  max-width: 600px;
  min-height: 200px;
  padding: 15px;
  margin: 20px 0;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1em;
  line-height: 1.5;
  resize: vertical;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const RoundContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 0;
  position: relative;
  padding-bottom: 0;
`;

function App() {
  const [gameState, setGameState] = useState<GameState>({
    currentRound: 0,
    selectedScenarios: [],
    isGameStarted: false,
    isGameFinished: false,
    timeline: []
  });

  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [serviceDescription, setServiceDescription] = useState<string>('');

  const startGame = async () => {
    if (!serviceDescription.trim()) {
      alert('Please enter a service description before starting the game');
      return;
    }

    setIsLoading(true);
    try {
      const prompt = ROUND_PROMPTS[1].replace('[USER_SERVICE_DESCRIPTION]', serviceDescription);
      console.log('\n=== ROUND 1 PROMPT ===\n', prompt);
      const response = await sendMessage(prompt);
      console.log('\n=== ROUND 1 RESPONSE ===\n', response);
      const { scenario, options } = parseLLMResponse(response);
      setCurrentScenario({ id: 0, text: scenario, description: scenario });
      setScenarios(options);
      setGameState(prev => ({
        ...prev,
        isGameStarted: true,
        currentRound: 1
      }));
    } catch (error) {
      console.error('Error starting game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScenarioSelect = async (scenario: Scenario) => {
    setIsLoading(true);
    try {
      // Create a more detailed history of previous rounds
      const history = gameState.selectedScenarios.map((s, i) => {
        const roundNumber = i + 1;
        const roundTitle = Object.keys(ROUND_PROMPTS)[i];
        return `Round ${roundNumber} (${roundTitle}):
- Scenario: ${i === gameState.currentRound - 1 ? (currentScenario?.description || 'Current scenario') : 'Previous scenario'}
- Selected Option: ${s.text}
- Decision Rationale: ${s.description}
- Impact: [To be analyzed in subsequent rounds]`;
      }).join('\n\n');

      if (gameState.currentRound < 5) {
        const prompt = ROUND_PROMPTS[gameState.currentRound + 1]
          .replace('[USER_SERVICE_DESCRIPTION]', serviceDescription) + 
          `\n\nPrevious Rounds:\n${history}`;
        
        console.log(`\n=== ROUND ${gameState.currentRound + 1} PROMPT ===\n`, prompt);
        const response = await sendMessage(prompt);
        console.log(`\n=== ROUND ${gameState.currentRound + 1} RESPONSE ===\n`, response);
        
        const { scenario: newScenario, options: newOptions } = parseLLMResponse(response);
        setCurrentScenario({ id: 0, text: newScenario, description: newScenario });
        setScenarios(newOptions);
        setGameState(prev => ({
          ...prev,
          currentRound: prev.currentRound + 1,
          selectedScenarios: [...prev.selectedScenarios, scenario],
          timeline: [...prev.timeline, `Round ${prev.currentRound}: ${scenario.text}`]
        }));
      } else {
        // This is the final round, get the recap
        const finalPrompt = `Based on the provided service description and game history, analyze the strategic journey and provide a final assessment.

Service Description:
${serviceDescription}

Complete Game History:
${history}

Final Round Selection:
- Scenario: ${currentScenario?.description || 'Current scenario'}
- Selected Option: ${scenario.text}
- Decision Rationale: ${scenario.description}

FORMAT YOUR RESPONSE EXACTLY AS FOLLOWS:

TIMELINE:
Round 1: **[Title of Round 1 Decision]**
Round 1: [Detailed description of decision and impact]

Round 2: **[Title of Round 2 Decision]**
Round 2: [Detailed description of decision and impact]

Round 3: **[Title of Round 3 Decision]**
Round 3: [Detailed description of decision and impact]

Round 4: **[Title of Round 4 Decision]**
Round 4: [Detailed description of decision and impact]

Round 5: **[Title of Round 5 Decision]**
Round 5: [Detailed description of decision and impact]

FINAL OUTCOME:
[Provide a comprehensive analysis of the final state of the business]`;

        console.log('\n=== FINAL ROUND PROMPT ===\n', finalPrompt);
        const response = await sendMessage(finalPrompt);
        console.log('\n=== FINAL ROUND RESPONSE ===\n', response);
        
        const { finalOutcome, timeline } = parseFinalRecap(response);
        console.log('\n=== PARSED FINAL RECAP ===\n', { finalOutcome, timeline });
        
        setGameState(prev => ({
          ...prev,
          selectedScenarios: [...prev.selectedScenarios, scenario],
          timeline: [...timeline],
          finalOutcome,
          isGameFinished: true
        }));
      }
    } catch (error) {
      console.error('Error handling scenario selection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="chat-container">
        <div className="chat-header">
          <h1>Scenario Planning Game</h1>
        </div>
        <div className="messages-container">
          {!gameState.isGameStarted ? (
            <>
              <ScrollableContent>
                <StartScreen>
                  <h1>Welcome to the Scenario Planning Game</h1>
                  <WelcomeText>
                    Describe your service or business, and we'll help you navigate through different market scenarios and make strategic decisions.
                  </WelcomeText>
                  <ServiceInput
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    placeholder="Enter your service description here..."
                  />
                  <button 
                    className="start-button"
                    onClick={startGame}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Starting...' : 'Start Game'}
                  </button>
                </StartScreen>
              </ScrollableContent>
            </>
          ) : gameState.isGameFinished ? (
            <>
              <ScrollableContent>
                <GameRecap>
                  <h2>Game Recap</h2>
                  <RecapContent>
                    <Timeline>
                      {gameState.timeline?.map((entry, index) => {
                        const [roundNum, ...rest] = entry.split(':');
                        const content = rest.join(':').trim();
                        
                        // If it's just the title (contains **)
                        if (content.includes('**')) {
                          return (
                            <RoundTitle key={index}>
                              {roundNum}: {content}
                            </RoundTitle>
                          );
                        }
                        
                        // If it's the detailed description
                        return (
                          <RoundDetail key={index}>
                            {roundNum}: {content}
                          </RoundDetail>
                        );
                      })}
                    </Timeline>
                    <FinalOutcome>
                      <h3>Final Outcome</h3>
                      <div dangerouslySetInnerHTML={{ __html: gameState.finalOutcome || '' }} />
                    </FinalOutcome>
                  </RecapContent>
                </GameRecap>
              </ScrollableContent>
            </>
          ) : (
            <>
              <ScrollableContent>
                <RoundContent>
                  <RoundIndicator>
                    Round {gameState.currentRound} of 5
                  </RoundIndicator>
                  <ScenarioLabel>Scenario description:</ScenarioLabel>
                  <ScenarioDescription>
                    {currentScenario?.text}
                  </ScenarioDescription>
                  <ScenariosContainer>
                    {scenarios.map((scenario, index) => (
                      <OptionButton
                        key={index}
                        onClick={() => handleScenarioSelect(scenario)}
                        disabled={isLoading}
                      >
                        <OptionHeader>Option {scenario.id}</OptionHeader>
                        <OptionContent>{scenario.description}</OptionContent>
                      </OptionButton>
                    ))}
                  </ScenariosContainer>
                </RoundContent>
              </ScrollableContent>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
