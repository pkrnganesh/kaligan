import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AgentInterface from './src/pages/AgentInterface';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AgentInterface />} />
      </Routes>
    </Router>
  );
};

export default App;
