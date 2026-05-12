import type { Diagnostic } from './Diagnostic.js';

export class DiagnosticBag {
  private readonly diagnostics: Diagnostic[] = [];

  public add(diagnostic: Diagnostic): void {
    this.diagnostics.push(diagnostic);
  }

  public addRange(items: readonly Diagnostic[]): void {
    this.diagnostics.push(...items);
  }

  public hasErrors(): boolean {
    return this.diagnostics.some((item) => item.severity === 'error');
  }

  public toArray(): readonly Diagnostic[] {
    return [...this.diagnostics];
  }
}
