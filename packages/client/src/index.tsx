import ReactDOM from 'react-dom/client';
import './styles/tailwind.css';
import App from './App';
import React from 'react';
import Providers from './components/Providers';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      <App />
      <ToastContainer />
    </Providers>
  </React.StrictMode>,
);
