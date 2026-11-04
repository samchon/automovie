import { ActionClock } from "./ActionClock";
import type { MotionAction } from "./MotionAction";

/**
 * Bounded reproducible variations sampled once for a reusable action instance.
 *
 * @evidence contracts/common.md#implementation-and-ownership A seeded unsigned integer recurrence produces five reproducible values for timing, three aim coordinates and articulation scale. The aim vector is projected into the caller's radius bound. These are deterministic staging deviations, not athlete measurement distributions. Constant work retains no random generator or global state.
 * @evidence contracts/common.md#authoring-interface Bounds are caller supplied; timing and articulation fractions lie in [0,1), aim radius is nonnegative metres, and seed is an unsigned 32-bit integer. Output is independent of sampling order and actor identity.
 */
export namespace ActionVariation {
  /**
   * Actor-independent deviations for independent foot routes and attacks.
   * @evidence contracts/common.md#implementation-and-ownership A common immutable result carries fixed bounded draws without inventing attack or target identities.
   * @evidence contracts/common.md#authoring-interface Timing/amplitude are positive scales and aimOffset is actor-local metres bounded by the requested Euclidean radius.
   */
  export interface Values {
    /** Common positive duration scale. */
    timingScale: number;
    /** Euclidean-bounded actor-local displacement in metres. */
    aimOffset: MotionAction.Vec3;
    /** Positive articulation or distance scale. */
    amplitude: number;
  }
  /**
   * Independently owned parameters fixed before sampling a technique.
   * @evidence contracts/common.md#implementation-and-ownership The admitted action durations and shared bounded draws are materialized once, independently of rendering/seek order.
   * @evidence contracts/common.md#authoring-interface Timing uses local seconds, aimOffset uses actor-local metres and amplitude is a positive multiplier.
   */
  export interface Result {
    /** Every phase scaled by the same sampled positive factor. */
    timing: MotionAction.Timing;
    /** Actor-local aim offset bounded in Euclidean metres. */
    aimOffset: MotionAction.Vec3;
    /** Positive articulation multiplier within the caller's declared bounds. */
    amplitude: number;
  }
  /**
   * Admit an action request and materialize its fixed seeded variations.
   *
   * @evidence contracts/common.md#implementation-and-ownership Input identity, sides, finite direction, phase durations and optional variation limits are validated before arithmetic. The local integer recurrence wraps explicitly through unsigned 32-bit operations; returned timing and aim arrays share no mutable caller data.
   * @evidence contracts/common.md#authoring-interface Omitted variation returns exact durations, zero aim offset and unit amplitude. Invalid identity, zero direction or malformed bounds throw; no anatomical feasibility or collision validity follows from accepted variation.
   */
  export function create(request: MotionAction.Request): Result {
    ActionClock.duration(request.timing);
    if (
      ![request.id, request.actorId, request.targetId].every(
        (id: string): boolean => typeof id === "string" && id.trim().length > 0,
      ) ||
      request.actorId === request.targetId
    )
      throw new Error(
        "Action requires distinct named actor and target identities",
      );
    if (
      ![request.side, request.leadSide].every(
        (side: string): boolean => side === "left" || side === "right",
      )
    )
      throw new Error("Action requires anatomical acting and lead sides");
    if (
      !Array.isArray(request.direction) ||
      request.direction.length !== 3 ||
      !request.direction.every(Number.isFinite) ||
      !Number.isFinite(Math.hypot(...request.direction)) ||
      Math.hypot(...request.direction) === 0
    )
      throw new Error("Action requires a finite nonzero direction");
    const values: Values = sample(request.variation);
    const timing: MotionAction.Timing = {
      preparation: request.timing.preparation * values.timingScale,
      delivery: request.timing.delivery * values.timingScale,
      contact: request.timing.contact * values.timingScale,
      retraction: request.timing.retraction * values.timingScale,
      recovery: request.timing.recovery * values.timingScale,
    };
    ActionClock.duration(timing);
    return { timing, aimOffset: values.aimOffset, amplitude: values.amplitude };
  }
  /**
   * Sample the same bounded variation without inventing actor or attack identities.
   *
   * @evidence contracts/common.md#implementation-and-ownership The same local integer recurrence serves footwork and action creation, so seeded variation has one owner. It returns fixed independent values and retains no generator or identity.
   * @evidence contracts/common.md#authoring-interface Optional bounds have the same units and limits as action variation; omission returns exact unit scales and a zero offset.
   */
  export function sample(variation?: MotionAction.Variation): Values {
    if (!variation)
      return { timingScale: 1, aimOffset: [0, 0, 0], amplitude: 1 };
    if (
      !Number.isInteger(variation.seed) ||
      variation.seed < 0 ||
      variation.seed > 0xffffffff ||
      ![variation.timingFraction, variation.amplitudeFraction].every(
        (bound: number): boolean =>
          Number.isFinite(bound) && bound >= 0 && bound < 1,
      ) ||
      !Number.isFinite(variation.aimMetres) ||
      variation.aimMetres < 0
    )
      throw new Error(
        "Action variation requires an unsigned seed and finite bounded deviations",
      );
    let state: number = variation.seed;
    const next: () => number = (): number => {
      state = (state + 0x6d2b79f5) >>> 0;
      let value: number = Math.imul(state ^ (state >>> 15), state | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return (((value ^ (value >>> 14)) >>> 0) / 4294967296) * 2 - 1;
    };
    const scale: number = 1 + next() * variation.timingFraction;
    const vector: MotionAction.Vec3 = [next(), next(), next()];
    const divisor: number = Math.max(1, Math.hypot(...vector));
    const amplitude: number = 1 + next() * variation.amplitudeFraction;
    return {
      timingScale: scale,
      aimOffset: [
        (vector[0] / divisor) * variation.aimMetres,
        (vector[1] / divisor) * variation.aimMetres,
        (vector[2] / divisor) * variation.aimMetres,
      ],
      amplitude,
    };
  }
}
