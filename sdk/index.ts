interface ErrorMonitorConfig {
  projectId: string;
  endpoint: string;
}

let config: ErrorMonitorConfig;

export const ErrorMonitor = {
  init(cfg: ErrorMonitorConfig) {
    config = cfg;

    window.onerror = (message, source, lineno, colno, error) => {
      this.capture({
        message: String(message),
        stack: error?.stack || "",
        source: source || "",
        line: lineno || 0,
        column: colno || 0,
        severity: "error",
      });
    };

    window.onunhandledrejection = (event) => {
      this.capture({
        message: String(event.reason),
        stack: event.reason?.stack || "",
        severity: "error",
        type: "unhandled-rejection",
      });
    };
  },

  capture(errorData: Record<string, any>) {
    fetch(`${config.endpoint}/api/errors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...errorData, projectId: config.projectId, timestamp: new Date().toISOString() }),
    }).catch(console.error);
  },
};
