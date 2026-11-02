/** Retain each immutable test operation's actual value or native failure once per run. */
export class HumanOutcomeCache<T> {
  /** Keys belong to a finite run's registered inputs; no geometry is retained for failed operations. */
  private readonly outcomes: Map<string, { input: string; result: { success: true; value: T } | { success: false; error: unknown } }> = new Map();

  /** Re-throw the identical failure to every consumer, while rejecting changed inputs under an existing identity. */
  public read(key: string, input: unknown, produce: () => T): T {
    const signature: string = HumanOutcomeCache.signature(input);
    const found: ReturnType<typeof this.outcomes.get> = this.outcomes.get(key);
    if (found !== undefined) {
      if (found.input !== signature) throw new Error("An immutable Human test input changed under a cached identity", { cause: { key, expected: found.input, observed: signature, reason: "Clone changed inputs and use an independent operation identity" } });
      if (found.result.success) return found.result.value;
      throw found.result.error;
    }
    try {
      const value: T = produce();
      this.outcomes.set(key, { input: signature, result: { success: true, value } });
      return value;
    } catch (error) {
      this.outcomes.set(key, { input: signature, result: { success: false, error } });
      throw error;
    }
  }

  /** Type-aware exact scalar identity preserves signed zero and nonfinite invalid-input distinctions. */
  private static signature(value: unknown): string {
    if (value === null) return "null";
    if (typeof value === "number") return "number:" + (Object.is(value, -0) ? "-0" : String(value));
    if (typeof value !== "object") return typeof value + ":" + JSON.stringify(value);
    if (Array.isArray(value)) return "array:" + JSON.stringify(value.map((entry: unknown): string => HumanOutcomeCache.signature(entry)));
    return "object:" + JSON.stringify(Object.keys(value).sort((a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0).map((key: string): [string, string] => [key, HumanOutcomeCache.signature((value as Record<string, unknown>)[key])]));
  }
}
