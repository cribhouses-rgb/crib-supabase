import { Component, type ReactNode } from "react";
import { Home, RefreshCw } from "lucide-react";
import { logError } from "../lib/errorLog";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches any error thrown during rendering anywhere below it in the tree
 * and shows a friendly recovery screen instead of a blank white page —
 * the single worst experience an app can give someone. Also logs the
 * error to Firestore via logError() so it shows up in the Admin Panel.
 *
 * Must be a class component — React's error boundary API doesn't have a
 * hooks equivalent.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    logError(error, `React render crash: ${info.componentStack.slice(0, 300)}`);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-900">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center bg-brand-700 mb-4">
            <Home className="text-white" size={28} />
          </div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Something went wrong
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs">
            We've logged the problem. Try reloading — your data is safe.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 h-12 px-6 rounded-xl bg-brand-700 text-white font-semibold flex items-center gap-2"
          >
            <RefreshCw size={16} /> Reload app
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
