export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface Diagnostic<TData extends Record<string, unknown> = Record<string, unknown>> {
  readonly code: string;
  readonly severity: DiagnosticSeverity;
  readonly message: string;
  readonly data?: TData;
}

export const createDiagnostic = <TData extends Record<string, unknown> = Record<string, unknown>>(
  code: string,
  severity: DiagnosticSeverity,
  message: string,
  data?: TData,
): Diagnostic<TData> => ({
  code,
  severity,
  message,
  data,
});
