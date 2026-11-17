import type { IAutoMovieAuditOutcome } from "@automovie/interface";
/**
 * Audit a declared outcome against measured contacts, failing and never
 * rewriting: every expected contact must be measured between its subjects
 * (and regions, when named) within its window with at least its impulse, and
 * every forbidden contact must be absent. The findings name each mismatch;
 * an empty list means the measurement supports the outcome.
 *
 * @param outcome The outcome's contact expectations.
 * @param contacts The measured contacts, such as physics receipts mapped to subjects.
 * @returns One finding per mismatch.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Audit a declared outcome against measured contacts, failing and never rewriting: every expected contact must be measured between its subjects (and regions, when named) within its window with at least its impulse, and every forbidden contact must be absent) and documents parameters `outcome`, `contacts`, the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Audit a declared outcome against measured contacts, failing and never rewriting: every expected contact must be measured between its subjects (and regions, when named) within its window with at least its impulse, and every forbidden contact must be absent) directly over its typed inputs (`outcome`, `contacts`) as nested iteration of depth 2 (filter over contacts; some over [ [c.a, c.b], [c.b, ; for-of over outcome.required), delegating to `contacts.filter`, `matches`, `Math.max`, `found.map`, `findings.push`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 42 lines and 6 top-level statements that reuses `contacts.filter`, `matches`, `Math.max`, `found.map`, `findings.push` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 4 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `outcome`, `contacts`; the dominant cost is nested iteration of depth 2 (filter over contacts; some over [ [c.a, c.b], [c.b, ; for-of over outcome.required), performed once per call with 5 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 5 allocation sites become the returned value or die with the call, so nothing grows.
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
