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
 */
export function auditAutoMovieOutcome(
  outcome: auditAutoMovieOutcome.IOutcome,
  contacts: readonly auditAutoMovieOutcome.IContact[],
): string[] {
  const findings: string[] = [];
  const matches = (
    expectation: auditAutoMovieOutcome.IExpectation,
  ): auditAutoMovieOutcome.IContact[] =>
    contacts.filter(
      (c: auditAutoMovieOutcome.IContact): boolean =>
        c.seconds >= expectation.window.start &&
        c.seconds <= expectation.window.end &&
        [
          [c.a, c.b],
          [c.b, c.a],
        ].some(
          ([x, y]: auditAutoMovieOutcome.ISide[]): boolean =>
            x!.subject === expectation.a.subject &&
            y!.subject === expectation.b.subject &&
            (expectation.a.region === undefined ||
              x!.region === expectation.a.region) &&
            (expectation.b.region === undefined ||
              y!.region === expectation.b.region),
        ),
    );
  const name = (e: auditAutoMovieOutcome.IExpectation): string =>
    `${e.a.subject}${e.a.region ? `.${e.a.region}` : ""} - ${e.b.subject}${e.b.region ? `.${e.b.region}` : ""} in [${e.window.start}, ${e.window.end}] s`;
  for (const expectation of outcome.required) {
    const found: auditAutoMovieOutcome.IContact[] = matches(expectation);
    const impulse: number = Math.max(
      0,
      ...found.map((c: auditAutoMovieOutcome.IContact): number => c.impulse),
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
/** Companion types of {@link auditAutoMovieOutcome}. */
export namespace auditAutoMovieOutcome {
  /** One side of a contact. */
  export interface ISide {
    /** Subject id. */
    subject: string;

    /** Region id; optional in an expectation. */
    region?: string;
  }

  /** A measured contact. */
  export interface IContact {
    /** One side. */
    a: ISide;

    /** The other side. */
    b: ISide;

    /** Seconds. */
    seconds: number;

    /** Measured impulse, N s; zero for a geometric touch. */
    impulse: number;
  }

  /** An expected or forbidden contact. */
  export interface IExpectation {
    /** One side. */
    a: ISide;

    /** The other side. */
    b: ISide;

    /** Seconds within which it is read. */
    window: { start: number; end: number };

    /** Least impulse, N s, for a required contact. */
    minimumImpulse?: number;
  }

  /** An outcome's contact expectations. */
  export interface IOutcome {
    /** Outcome id in findings. */
    id: string;

    /** Contacts that must be measured. */
    required: readonly IExpectation[];

    /** Contacts that must not be measured. */
    forbidden?: readonly IExpectation[];
  }
}
