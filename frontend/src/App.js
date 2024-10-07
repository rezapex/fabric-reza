import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://192.168.4.21:5000';

function App() {
  const [patterns, setPatterns] = useState([]);
  const [selectedPattern, setSelectedPattern] = useState('');
  const [params, setParams] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [output, setOutput] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/patterns`)
      .then(response => response.json())
      .then(data => setPatterns(data))
      .catch(error => console.error('Error fetching patterns:', error));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    let fabricCommand = ['fabric'];
    if (selectedPattern) {
      fabricCommand.push('--pattern', selectedPattern);
    }
    if (youtubeUrl) {
      fabricCommand.push('-y', `"${youtubeUrl}"`);
    }
    if (params) {
      fabricCommand = fabricCommand.concat(params.split(' '));
    }

    const requestData = {
      pattern: selectedPattern,
      params: fabricCommand.slice(1) // Remove 'fabric' from the beginning
    };

    fetch(`${API_BASE_URL}/run-pattern`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })
      .then(response => response.json())
      .then(data => {
        setOutput(data.output || data.error);
      })
      .catch(error => {
        setOutput(`Error: ${error.message}`);
        console.error('Error running pattern:', error);
      });
  };

  return (
    <div className="App">
      <h1>Fabric Pattern Runner</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Select Pattern:
          <select value={selectedPattern} onChange={(e) => setSelectedPattern(e.target.value)}>
            <option value="">--Select Pattern--</option>
            {patterns.map((pattern) => (
              <option key={pattern} value={pattern}>{pattern}</option>
            ))}
          </select>
        </label>
        <br />
        <label>
          YouTube URL:
          <input
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="Enter YouTube URL (optional)"
          />
        </label>
        <br />
        <label>
          Additional Parameters:
          <input
            type="text"
            value={params}
            onChange={(e) => setParams(e.target.value)}
            placeholder="Enter additional parameters (separated by space)"
          />
        </label>
        <br />
        <button type="submit">Run Pattern</button>
      </form>
      <div className="output">
        <h2>Output:</h2>
        <pre>{output}</pre>
      </div>
    </div>
  );
}

export default App;
