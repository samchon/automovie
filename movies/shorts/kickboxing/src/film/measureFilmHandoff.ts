import type { LabActor } from "../motion-lab/LabActor";
import { LabActualMotion } from "../motion-lab/LabActualMotion";
import type { LabCase } from "../motion-lab/LabCase";

/**
 * Measure the actual final punch owners before a kick takes their unchanged frame.
 * @evidence contracts/common.md#implementation-and-ownership Three fixed canonical case evaluations provide actual applied body, arm, pad and support values at h/h2. Shared observations keep both owners on the same post-contact branch without adopting new foot anchors.
 * @evidence contracts/common.md#authoring-interface The entry is the actual two-foot handoff selected by the film. Caller restores or resamples the case after these observations; finite one-sided secants are not analytic rates or impact-force measurements.
 */
export function measureFilmHandoff(
  item: LabCase,
  actors: Record<"a" | "b", LabActor>,
  time: number,
  side: "before" | "after",
): {
  attacker: LabActualMotion.Measurement;
  receiver: LabActualMotion.Measurement;
} {
  const cache: Map<
    number,
    { attacker: LabActualMotion.Snapshot; receiver: LabActualMotion.Snapshot }
  > = new Map();
  const released: number = item.recoveryPort().releasedSeconds;
  const h: number = Math.min(1 / 2400, (time - released) / 4);
  if (!Number.isFinite(h) || h <= 0)
    throw new Error(
      "Finishing tangent must remain strictly after the original contact release",
    );
  const sample: (
    seconds: number,
    role: "attacker" | "receiver",
  ) => LabActualMotion.Snapshot = (
    seconds: number,
    role: "attacker" | "receiver",
  ): LabActualMotion.Snapshot => {
    if (seconds <= released)
      throw new Error("Finishing tangent crosses the original contact release");
    if (!cache.has(seconds)) {
      item.evaluate(seconds);
      cache.set(seconds, {
        attacker: LabActualMotion.capture(
          actors.a,
          "left",
          seconds,
          "post-contact",
        ),
        receiver: LabActualMotion.capture(
          actors.b,
          "right",
          seconds,
          "post-contact",
        ),
      });
    }
    return structuredClone(cache.get(seconds)![role]);
  };
  return {
    attacker: LabActualMotion.measure(
      (seconds: number): LabActualMotion.Snapshot =>
        sample(seconds, "attacker"),
      time,
      h,
      side,
    ),
    receiver: LabActualMotion.measure(
      (seconds: number): LabActualMotion.Snapshot =>
        sample(seconds, "receiver"),
      time,
      h,
      side,
    ),
  };
}
