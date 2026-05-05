import React from "react";

type State = {
  error: Error | null;
  info: React.ErrorInfo | null;
};

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): State {
    return { error, info: null };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ error, info });
    console.error("React render error", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="error-screen">
        <p className="eyebrow">Runtime error</p>
        <h1>{this.state.error.message}</h1>
        <pre>{this.state.error.stack}</pre>
        {this.state.info?.componentStack && <pre>{this.state.info.componentStack}</pre>}
      </main>
    );
  }
}
