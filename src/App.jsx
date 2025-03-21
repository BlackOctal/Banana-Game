import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage/HomePage';
import CharacterController from './components/CharacterController/CharacterController';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import CharacterSelection from './components/CharacterSelection/CharacterSelection';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game" element={<CharacterController />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/characters" element={<CharacterSelection />} />
      </Routes>
    </Router>
  );
}

export default App;