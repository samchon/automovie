/** Test-producer outcomes are immutable, including failures, so consumers never regenerate a failed person. */
export class HumanOnce<Value> {
  /** A discriminated state preserves even undefined returned values and thrown errors. */
  private readonly outcomes: Map<string, { success: true; value: Value } | { success: false; error: unknown }> = new Map();
  /** Evaluate a synchronous output producer once per declared immutable input identity. */
  public read(key: string, producer: () => Value): Value {
    const found: { success: true; value: Value } | { success: false; error: unknown } | undefined = this.outcomes.get(key);
    if (found !== undefined) { if (found.success) return found.value; throw found.error; }
    try {
      const value: Value = producer(); this.outcomes.set(key, { success: true, value }); return value;
    } catch (error) { this.outcomes.set(key, { success: false, error }); throw error; }
  }
}
