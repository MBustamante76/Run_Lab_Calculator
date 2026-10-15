import { engineDiagnosticsLines } from "../calculation/diagnosticsReport";

export function EngineDiagnostics() {
  return (
    <main className="engine-diagnostics">
      <h1>Calculation engine diagnostics</h1>
      <p>Development only. This page is not part of the WordPress plugin.</p>
      <pre>{engineDiagnosticsLines().join("\n")}</pre>
    </main>
  );
}
