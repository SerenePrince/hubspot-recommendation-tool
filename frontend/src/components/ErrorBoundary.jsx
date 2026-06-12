import { Component } from "react";

/**
 * Top-level error boundary.
 *
 * Catches render-time errors anywhere in the component tree and shows a
 * friendly fallback instead of React's default behaviour (unmounting the
 * whole app and leaving a blank white page).
 *
 * Class component by necessity — error boundaries are the one React feature
 * that still requires componentDidCatch / getDerivedStateFromError, which
 * have no hook equivalents.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Surface the error for debugging; there is no telemetry backend to
    // report to in this deployment.
    console.error("Unhandled render error:", error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app" role="alert">
          <div className="app__heading">
            <h1>Something went wrong</h1>
            <p>
              The page hit an unexpected error. Reload the page to try again —
              if the problem persists, contact your support contact (see the
              client guide).
            </p>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
