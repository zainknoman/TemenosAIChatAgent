// frontend/src/index.js
import React from "react";
import ReactDOM from "react-dom/client"; // Use createRoot from 'react-dom/client' for React 18
import "./index.css"; // Import the Tailwind CSS file
import App from "./App"; // Import the main App component
import reportWebVitals from "./reportWebVitals"; // For performance monitoring

// Get the root element from public/index.html
const root = ReactDOM.createRoot(document.getElementById("root"));

// Render the App component into the root element
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
