import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app'

const style = document.createElement("style");
style.innerHTML = `
  * {
    box-sizing: border-box;
    font-family: Inter, system-ui, sans-serif;
  }

  body {
    margin: 0;
    background: transparent;
    color: #E5E7EB;
  }

  .panel {
    background: #0F172A;
    border: 1px solid #1E293B;
    border-radius: 14px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    animation: fadeIn 0.18s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.96); }
    to { opacity: 1; transform: scale(1); }
  }

  button {
    background: #2563EB;
    border: none;
    border-radius: 8px;
    padding: 8px 12px;
    color: white;
    cursor: pointer;
  }

  button.secondary {
    background: #1E293B;
  }

  @keyframes pulse {
    from { transform: scale(0.95); opacity: 0.5; }
    to { transform: scale(1); opacity: 1; }
  }
 
  @keyframes shimmer {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}
  button.pulse {
    animation: pulse 1s infinite;
  }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
