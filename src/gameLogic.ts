export interface Scenario {
  id: number;
  text: string;
  description: string;
}

export interface GameState {
  currentRound: number;
  selectedScenarios: Scenario[];
  isGameStarted: boolean;
  isGameFinished: boolean;
  timeline: string[];
  finalOutcome?: string;
}

export const SYSTEM_PROMPT = `You are a strategic business consultant specializing in helping startups and businesses navigate complex market scenarios. Your role is to create detailed, immersive scenarios and strategic options based on the specific service or business described by the user.

The service/business to analyze is described as follows:
[USER_SERVICE_DESCRIPTION]

IMPORTANT INSTRUCTIONS:
1. When creating scenarios, vary the tone between positive and negative outcomes. Some scenarios should present optimistic market conditions and opportunities, while others should present challenging or adverse conditions. This variation helps in comprehensive strategic planning.

2. CRITICAL: Each round's scenarios and options MUST be unique and directly influenced by previous choices. Do not repeat similar scenarios or options from previous rounds. Instead, create new situations that naturally evolve from the consequences of earlier decisions. This ensures a dynamic and progressive strategic journey.

You MUST format your response EXACTLY as follows:

SCENARIO:
[Write a detailed scenario description here, specifically tailored to the above service/business. Include both positive and negative elements to create a balanced view of the market situation. Ensure this scenario is unique and builds upon previous decisions.]

OPTIONS:
OPTION1: [Title of first option]
[Detailed description of first option. Each option should present a distinct strategic path that hasn't been explored in previous rounds.]

OPTION2: [Title of second option]
[Detailed description of second option]

OPTION3: [Title of third option]
[Detailed description of third option]

OPTION4: [Title of fourth option]
[Detailed description of fourth option]

OPTION5: [Title of fifth option]
[Detailed description of fifth option]`;

export const ROUND_PROMPTS: Record<number, string> = {
  1: `Round 1: Market Entry Strategy

The service/business to analyze is described as follows:
[USER_SERVICE_DESCRIPTION]

Analyze the current market conditions and provide 5 strategic options for launching this specific service/business.

FORMAT YOUR RESPONSE AS:
SCENARIO: [Describe the initial market conditions, challenges, opportunities, target segments, and risks specific to this service/business]

OPTIONS:
OPTION1: [Title]
[Detailed description]

OPTION2: [Title]
[Detailed description]

OPTION3: [Title]
[Detailed description]

OPTION4: [Title]
[Detailed description]

OPTION5: [Title]
[Detailed description]`,

  2: `Round 2: Growth and Expansion

The service/business to analyze is described as follows:
[USER_SERVICE_DESCRIPTION]

Based on the previous decision, analyze growth opportunities and provide 5 strategic options for scaling this specific service/business.

FORMAT YOUR RESPONSE AS:
SCENARIO: [Describe current position, growth opportunities, challenges, and market response specific to this service/business]

OPTIONS:
OPTION1: [Title]
[Detailed description]

[... continue same format for options 2-5]`,

  3: `Round 3: Competitive Strategy

The service/business to analyze is described as follows:
[USER_SERVICE_DESCRIPTION]

Analyze the competitive landscape and provide 5 strategic options for maintaining advantage in this specific market.

FORMAT YOUR RESPONSE AS:
SCENARIO: [Describe competitive landscape, market dynamics, threats and opportunities specific to this service/business]

OPTIONS:
OPTION1: [Title]
[Detailed description]

[... continue same format for options 2-5]`,

  4: `Round 4: Innovation and Adaptation

The service/business to analyze is described as follows:
[USER_SERVICE_DESCRIPTION]

Analyze technological and market trends and provide 5 strategic options for innovation in this specific sector.

FORMAT YOUR RESPONSE AS:
SCENARIO: [Describe technological landscape, emerging trends, and opportunities specific to this service/business]

OPTIONS:
OPTION1: [Title]
[Detailed description]

[... continue same format for options 2-5]`,

  5: `Round 5: Long-term Sustainability

The service/business to analyze is described as follows:
[USER_SERVICE_DESCRIPTION]

Analyze long-term challenges and provide 5 strategic options for ensuring sustainable success of this specific service/business.

FORMAT YOUR RESPONSE AS:
SCENARIO: [Describe long-term challenges, market maturity, and future opportunities specific to this service/business]

OPTIONS:
OPTION1: [Title]
[Detailed description]

[... continue same format for options 2-5]`
};

export const parseLLMResponse = (response: string): { scenario: string; options: Scenario[] } => {
  const options: Scenario[] = [];
  let scenario = '';

  // Extract scenario
  const scenarioMatch = response.match(/SCENARIO:\s*([\s\S]*?)(?=OPTIONS:|$)/);
  if (scenarioMatch) {
    scenario = scenarioMatch[1].trim();
  }

  // Extract options
  const optionsText = response.split('OPTIONS:')[1] || '';
  const optionRegex = /OPTION(\d+):\s*([^\n]*)\n([\s\S]*?)(?=OPTION\d+:|$)/g;
  let match;

  while ((match = optionRegex.exec(optionsText)) !== null) {
    const optionNumber = parseInt(match[1]);
    const optionTitle = match[2].trim();
    const optionDescription = match[3].trim();

    options.push({
      id: optionNumber,
      text: optionTitle,
      description: optionDescription
    });
  }

  return { scenario, options };
};

export const parseFinalRecap = (response: string): { timeline: string[]; finalOutcome: string } => {
  console.log('\n=== PARSING FINAL RECAP ===');
  console.log('Raw response:', response);
  
  const timelineStart = response.indexOf('TIMELINE:');
  const timelineEnd = response.indexOf('FINAL OUTCOME:');
  const timelineSection = response.substring(timelineStart + 9, timelineEnd).trim();
  
  console.log('\nTimeline section:', timelineSection);
  
  const timeline = timelineSection
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
    
  console.log('\nExtracted timeline:', timeline);
  
  const finalOutcomeSection = response.substring(timelineEnd + 14).trim();
  console.log('\nFinal outcome section:', finalOutcomeSection);
  
  return { 
    timeline,
    finalOutcome: finalOutcomeSection 
  };
}; 