import type { IAutoMovieAuditOutcome } from "@automovie/interface";

/*
 * Audit a declared outcome against measured contacts, failing and never
 * rewriting: every expected contact must be measured between its subjects (and
 * regions, when named) within its window with at least its impulse, and every
 * forbidden contact must be absent. The findings name each mismatch; an empty
 * list means the measurement supports the outcome.
 * Parameter outcome: The outcome's contact expectations.
 * Parameter contacts: The measured contacts, such as physics receipts mapped to
 * subjects.
 * Returns: One finding per mismatch.
 */
export function auditAutoMovieOutcome(
  outcome: IAutoMovieAuditOutcome.IOutcome,
  contacts: readonly IAutoMovieAuditOutcome.IContact[],
): string[] {
  const findings: string[] = [];
  const matches = (
    expectation: IAutoMovieAuditOutcome.IExpectation,
  ): IAutoMovieAuditOutcome.IContact[] =>
    contacts.filter(
      (c: IAutoMovieAuditOutcome.IContact): boolean =>
        c.seconds >= expectation.window.start &&
        c.seconds <= expectation.window.end &&
        [
          [c.a, c.b],
          [c.b, c.a],
        ].some(
          ([x, y]: IAutoMovieAuditOutcome.ISide[]): boolean =>
            x!.subject === expectation.a.subject &&
            y!.subject === expectation.b.subject &&
            (expectation.a.region === undefined ||
              x!.region === expectation.a.region) &&
            (expectation.b.region === undefined ||
              y!.region === expectation.b.region),
        ),
    );
  const name = (e: IAutoMovieAuditOutcome.IExpectation): string =>
    `${e.a.subject}${e.a.region ? `.${e.a.region}` : ""} - ${e.b.subject}${e.b.region ? `.${e.b.region}` : ""} in [${e.window.start}, ${e.window.end}] s`;
  for (const expectation of outcome.required) {
    const found: IAutoMovieAuditOutcome.IContact[] = matches(expectation);
    const impulse: number = Math.max(
      0,
      ...found.map((c: IAutoMovieAuditOutcome.IContact): number => c.impulse),
    );
    if (found.length === 0)
      findings.push(`${outcome.id}: no measured contact ${name(expectation)}`);
    else if (impulse < (expectation.minimumImpulse ?? 0))
      findings.push(
        `${outcome.id}: contact ${name(expectation)} carries ${impulse} N s, below ${expectation.minimumImpulse}`,
      );
  }
  for (const expectation of outcome.forbidden ?? [])
    if (matches(expectation).length > 0)
      findings.push(`${outcome.id}: forbidden contact ${name(expectation)}`);
  return findings;
}
