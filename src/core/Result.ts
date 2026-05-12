import type { Diagnostic } from './Diagnostic.js';

export interface SuccessResult<T> {
  readonly ok: true;
  readonly value: T;
  readonly diagnostics: readonly Diagnostic[];
}

export interface FailureResult {
  readonly ok: false;
  readonly diagnostics: readonly Diagnostic[];
}

export type Result<T> = SuccessResult<T> | FailureResult;

export const ok = <T>(value: T, diagnostics: readonly Diagnostic[] = []): SuccessResult<T> => ({
  ok: true,
  value,
  diagnostics,
});

export const fail = (diagnostics: readonly Diagnostic[] | Diagnostic): FailureResult => ({
  ok: false,
  diagnostics: Array.isArray(diagnostics) ? diagnostics : [diagnostics],
});
