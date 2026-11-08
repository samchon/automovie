import type { createDuelCapMotion } from "./createDuelCapMotion";

/** Current live effect reconstruction of the fixed film's recorded rescue. */
interface Current {
  webBreakSeconds: number;
  capReleaseSeconds: number;
  capImpactSeconds: number;
  capSettledSeconds: number;
  capPhysics: ReturnType<typeof createDuelCapMotion>["physics"];
  shieldRaisedAt: number;
  shieldAnchor: number[];
  fragments: { contact: { seconds: number; firstIntersectionSeconds: number; centre: number[]; triangle: number }; floorSeconds: number }[];
}

/**
 * Refuse cached-actor playback when current effect physics differ from its recorded epoch.
 * @evidence contracts/common.md#implementation-and-ownership Exact structured comparison binds current finite-cap/floor assumptions, event times, actual shield anchor and all three reconstructed fragment contacts/stops to the fixed input. The original recorded observations are exposed only after this succeeds; they cannot conceal different live effects. Canonical source/model and immutable bundle checks remain with final capture preflight.
 * @evidence contracts/common.md#authoring-interface Supply original fixed-input rescue observations and the actual effects reconstructed by this runtime. Throws on missing/mismatched fields, unadmitted floor response, causal failures or invalid clearance/recovery chronology. This does not re-solve cached people, renew an old approval or promise external generation compatibility.
 */
export function assertDuelReplayObservations(recorded: Record<string, unknown>, current: Current): void {
  /** Compare JSON-safe physical facts independently of property order. */
  function same(first: unknown, second: unknown): boolean {
    if (first === second) return true;
    if (Array.isArray(first) || Array.isArray(second)) return Array.isArray(first) && Array.isArray(second) && first.length === second.length && first.every((value: unknown, index: number): boolean => same(value, second[index]));
    if (first === null || second === null || typeof first !== "object" || typeof second !== "object") return false;
    const a: Record<string, unknown> = first as Record<string, unknown>;
    const b: Record<string, unknown> = second as Record<string, unknown>;
    const keys: string[] = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every((key: string): boolean => Object.hasOwn(b, key) && same(a[key], b[key]));
  }
  if (recorded.capCleared !== true || !current.capPhysics.floor.admitted || current.fragments.length !== 3 || !Array.isArray(recorded.causalFailures) || recorded.causalFailures.length !== 0) throw new Error("Fixed rescue lacks an admitted complete physical outcome");
  for (const key of Object.keys(current) as (keyof Current)[]) if (!same(recorded[key], current[key])) throw new Error(`Fixed rescue differs from current live effects:${key}`);
  const clearance: unknown = recorded.escapeCompletedAt;
  const recovery: unknown = recorded.recoveryReadyAt;
  const lastOutcome: number = Math.max(current.capSettledSeconds, ...current.fragments.map((fragment: Current["fragments"][number]): number => fragment.floorSeconds));
  if (typeof clearance !== "number" || typeof recovery !== "number" || !Number.isFinite(clearance) || !Number.isFinite(recovery) || clearance > current.shieldRaisedAt || current.shieldRaisedAt > current.webBreakSeconds || recovery < lastOutcome || recovery > 48) throw new Error("Fixed rescue event chronology disagrees with actual clearance and physical outcomes");
}
