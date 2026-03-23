import React, { useState } from 'react'
import UrlInput from './components/UrlInput'
import UrlReport from './components/UrlReport'

export default function App() {
  const [urlAnalysis, setUrlAnalysis] = useState('');

  const handleAnalysis = (data) => {
    if (data != null) {
      setUrlAnalysis(data);
    }
  };

  return (
    <div className="app">
      <div id='app-heading-main'>
        <h1>HubSpot <span id='highlight'>Marketing</span> Tool</h1>
        <p>Generate a concise report detailing the tech-stack of any given website, highlighting technologies and services that HubSpot offers alternatives for </p>
      </div>

      <div id='url-input-area'>
        <UrlInput
          returnAnalysis = {handleAnalysis}
          onSubmit={(url) => {
            // Example handler: currently just logs. Replace with desired behavior.
            console.log('Submitted URL:', url)
            alert(`Submitted URL:\n${url}`)
          }}
        />
      </div>
      <div id="app-report-area">
          <UrlReport 
              urlAnalysisData = {urlAnalysis}
          />
      </div>
    </div>
  )
}