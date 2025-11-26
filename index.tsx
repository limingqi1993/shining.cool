import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center', marginTop: '10%' }}>
          <h1 style={{ color: '#002FA7', fontSize: '2rem', marginBottom: '1rem' }}>Something went wrong</h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <div style={{ background: '#f5f5f7', padding: '1rem', borderRadius: '0.5rem', display: 'inline-block', textAlign: 'left' }}>
            <p><strong>Troubleshooting:</strong></p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Check if API_KEY is set in your environment variables.</li>
              <li>Ensure the API Key format is correct (starts with AIza...).</li>
              <li>Redeploy after changing environment variables.</li>
            </ul>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{ display: 'block', margin: '2rem auto', padding: '0.75rem 2rem', background: '#002FA7', color: 'white', border: 'none', borderRadius: '2rem', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);