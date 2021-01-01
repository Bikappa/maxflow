import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

document.addEventListener('dragover', function (event) {

  // prevent default to allow drop
  event.preventDefault();

}, false);

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

