import React, { useState, useEffect } from 'react';

const App = () => {
  const [storyText, setStoryText] = useState("Welcome to the Multi-Ending Story Generator! Click 'Start New Story' to begin your adventure.");
  const [choices, setChoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  const genres = [
    "sci-fi in a space colony",
    "medieval fantasy with dragons",
    "post-apocalyptic survival",
    "a mystery set in a haunted house",
    "a superhero origin story",
    "cyberpunk heist mission",
    "mythical Indian folklore",
    "a pirate treasure hunt",
    "steampunk airship adventure"
  ];

  const startNewStory = () => {
    setStoryText("Generating your story...");
    setChoices([]);
    setIsLoading(true);
    setIsEnding(false);
    setErrorMessage('');
    setChatHistory([]);

    const randomGenre = genres[Math.floor(Math.random() * genres.length)];
    const seed = new Date().getTime();

    const dynamicPrompt = `Start a unique ${randomGenre} story. Add creative and unexpected twists based on this seed: ${seed}. Provide 2-3 distinct choices for the protagonist's next action.`;

    generateStorySegment(dynamicPrompt);
  };

  const handleChoice = (choice) => {
    setStoryText("Continuing your adventure...");
    setChoices([]);
    setIsLoading(true);
    setErrorMessage('');

    const updatedHistory = [...chatHistory, { role: "user", parts: [{ text: `I choose: ${choice}` }] }];
    setChatHistory(updatedHistory);

    const continuationPrompt = `The user chose: "${choice}". Continue the story from this point, leading to new developments. Provide 2-3 distinct choices for the protagonist's next action, or conclude the story if appropriate.`;

    generateStorySegment(continuationPrompt, updatedHistory);
  };

  const generateStorySegment = async (prompt, currentChatHistory = []) => {
    setIsLoading(true);
    setErrorMessage('');

    const responseSchema = {
      type: "OBJECT",
      properties: {
        storySegment: { type: "STRING" },
        choices: {
          type: "ARRAY",
          items: { type: "STRING" }
        },
        isEnding: { type: "BOOLEAN" }
      },
      propertyOrdering: ["storySegment", "choices", "isEnding"]
    };

    try {
      const payload = {
        contents: [...currentChatHistory, { role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      };

      const apiKey = "AIzaSyAgafPNh0jTQ799fZjMSOUchgvExfuYDFw";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${response.status} - ${errorData.error.message || 'Unknown error'}`);
      }

      const result = await response.json();

      if (
        result.candidates &&
        result.candidates.length > 0 &&
        result.candidates[0].content &&
        result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0
      ) {
        const jsonString = result.candidates[0].content.parts[0].text;
        let parsedJson;
        try {
          parsedJson = JSON.parse(jsonString);
        } catch (parseError) {
          throw new Error("Failed to parse AI response as JSON. It might not have followed the schema.");
        }

        setStoryText(parsedJson.storySegment);
        setChoices(parsedJson.choices || []);
        setIsEnding(parsedJson.isEnding || false);

        setChatHistory(prevHistory => [
          ...prevHistory,
          { role: "user", parts: [{ text: prompt }] },
          { role: "model", parts: [{ text: jsonString }] }
        ]);
      } else {
        setErrorMessage("Unexpected API response structure. Please try again.");
      }
    } catch (error) {
      console.error("Error generating story segment:", error);
      setErrorMessage(`Failed to generate story: ${error.message}. Please try again.`);
      setStoryText("An error occurred. Please try starting a new story.");
      setChoices([]);
      setIsEnding(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    startNewStory();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white font-inter flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6 md:p-8 space-y-6">
        <h1 className="text-4xl font-extrabold text-center text-purple-400 mb-6">
          GenAI Story Weaver
        </h1>

        <div className="bg-gray-700 p-6 rounded-lg border border-gray-600 shadow-inner min-h-[200px] flex items-center justify-center text-center">
          {isLoading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
              <p className="mt-4 text-lg text-purple-300">Weaving your tale...</p>
            </div>
          ) : errorMessage ? (
            <p className="text-red-400 text-lg">{errorMessage}</p>
          ) : (
            <p className="text-lg leading-relaxed text-gray-200 whitespace-pre-wrap">{storyText}</p>
          )}
        </div>

        <div className="flex flex-col space-y-4">
          {isEnding ? (
            <div className="text-center text-green-400 text-xl font-semibold mt-4">
              The End of Your Journey!
            </div>
          ) : (
            choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => handleChoice(choice)}
                disabled={isLoading}
                className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out
                           disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75"
              >
                {choice}
              </button>
            ))
          )}
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={startNewStory}
            disabled={isLoading}
            className="py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xl transition-all duration-300 ease-in-out
                       disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
          >
            {isLoading ? 'Generating...' : 'Start New Story'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
