import { TestValidator } from "@nestia/e2e";

/** Collect every portable geometry-fixture finding before failing its test. */
export class HumanFixtureAudit {
  /** Current fixture address, copied when each finding is recorded. */
  private context: Record<string, unknown> = {};
  /** Complete human-readable findings; successful observations retain no data. */
  private readonly findings: string[] = [];

  /** Own one fixed fixture family and the component its test exercises. */
  public constructor(private readonly fixture: string, private readonly component: string) {}

  /** Set the current chain, interval, parameters, direction and actual coordinates. */
  public scope(context: Record<string, unknown>): void {
    this.context = context;
  }

  /** Run one synchronous independent case; an unexpected exception records its cause and leaves later cases runnable. */
  public run(context: Record<string, unknown>, action: () => void): void {
    this.scope(context);
    try {
      action();
    } catch (error) {
      this.record("case execution", {
        observed: "exception",
        expected: "completed",
        tolerance: 0,
        deviation: "case could not complete",
        units: "category",
        error: error instanceof Error
          ? { category: error.name, reason: error.message, stack: error.stack }
          : { category: typeof error, reason: String(error) },
      });
    }
  }

  /** Compare a finite scalar and retain its actual error with physical units. */
  public measure(label: string, observed: number, expected: number, tolerance: number, units: string): void {
    const deviation: number = Math.abs(observed - expected);
    const validTolerance: boolean = Number.isFinite(tolerance) && tolerance >= 0;
    if (validTolerance && Number.isFinite(observed) && Number.isFinite(expected) && deviation <= tolerance) return;
    this.record(label, { observed, expected, tolerance, deviation, units, reason: validTolerance ? undefined : "Tolerance must be finite and nonnegative." });
  }

  /** Prove that a made numeric defect falls outside the normal shape's allowance. */
  public reject(label: string, observed: number, expected: number, tolerance: number, units: string): void {
    const deviation: number = Math.abs(observed - expected);
    const validTolerance: boolean = Number.isFinite(tolerance) && tolerance >= 0;
    if (validTolerance && Number.isFinite(observed) && Number.isFinite(expected) && deviation > tolerance) return;
    this.record(label, { observed, expected, tolerance, deviation, units, expectation: "made defect must lie outside tolerance", reason: validTolerance ? undefined : "Tolerance must be finite and nonnegative." });
  }

  /** Compare a strict or inclusive physical bound without reducing its error and units to a boolean. */
  public bound(label: string, observed: number, limit: number, relation: "<" | "<=" | ">" | ">=", units: string): void {
    const accepts: boolean = relation === "<" ? observed < limit : relation === "<=" ? observed <= limit : relation === ">" ? observed > limit : observed >= limit;
    if (Number.isFinite(observed) && Number.isFinite(limit) && accepts) return;
    this.record(label, { observed, expected: limit, relation, tolerance: 0, deviation: Math.abs(observed - limit), units });
  }

  /** Compare every component, including array cardinality, without stopping on one coordinate. */
  public vector(label: string, observed: readonly number[], expected: readonly number[], tolerance: number, units: string): void {
    this.measure(label + ".length", observed.length, expected.length, 0, "count");
    for (let i: number = 0; i < Math.max(observed.length, expected.length); i++)
      this.measure(label + ".coordinate[" + i.toString() + "]", observed[i] ?? NaN, expected[i] ?? NaN, tolerance, units);
  }

  /** Record a nonnumeric contract without disguising it as a physical measurement. */
  public check(label: string, observed: boolean): void {
    if (!observed) this.record(label, { observed, expected: true, tolerance: 0, deviation: 1, units: "boolean" });
  }

  /** Compare a categorical output such as the raw deformation method. */
  public category(label: string, observed: string | undefined, expected: string): void {
    if (observed !== expected) this.record(label, { observed: observed ?? "missing", expected, tolerance: 0, deviation: "different category", units: "category" });
  }

  /** Fail once with every finding collected through all fixture cases. */
  public finish(): void {
    TestValidator.predicate(this.findings.length === 0 ? this.fixture : this.findings.join("\n"), this.findings.length === 0);
  }

  /** Serialize non-finite observations explicitly instead of JSON's ambiguous null. */
  private record(label: string, measurement: Record<string, unknown>): void {
    this.findings.push(JSON.stringify({ fixture: this.fixture, component: this.component, ...this.context, observation: label, ...measurement }, (_key: string, value: unknown): unknown => typeof value === "number" && !Number.isFinite(value) ? String(value) : value));
  }
}
