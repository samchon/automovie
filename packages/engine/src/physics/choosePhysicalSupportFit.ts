import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { physicalJointRelativeRotation } from "./physicalJointRelativeRotation";

/**
 * Choose one bounded support fit among candidates fitted from different seeds.
 *
 * A warm seed keeps temporal continuity but can trap the bounded fit in a
 * poor local solution that it then carries into every later replan; an
 * authored seed restarts from the declared posture each time. Candidates are
 * ranked by the fit's own contract: a fit whose largest residual meets the
 * declared tolerance is admissible. Among admissible fits the one closest to
 * the completed reference, summed squared joint rotation angle, wins, so an
 * equally valid solution never jumps. Without an admissible fit the smallest
 * residual wins. Ties keep the earlier candidate, so callers list the
 * authored-seed fit first.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Choose one bounded support fit among candidates fitted from different seeds) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Choose one bounded support fit among candidates fitted from different seeds) directly over its typed inputs (`input`) as nested iteration of depth 2 (map over input.candidates; reduce over input.joints; filter over scored), delegating to `Math.max`, `Object.values`, `angle`, `scored.filter`, `pool.reduce`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 35 lines and 5 top-level statements that reuses `Math.max`, `Object.values`, `angle`, `scored.filter`, `pool.reduce` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (map over input.candidates; reduce over input.joints; filter over scored), performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function choosePhysicalSupportFit<
  Fit extends {
    targets: Readonly<Record<string, P.ITransform>>;
    residuals: Readonly<Record<string, number>>;
  },
>(input: {
  /** Nonempty candidates in tie-break order. */ candidates: readonly Fit[];
  /** The fit's own metre residual tolerance. */ tolerance: number;
  /** Completed fitted placements at the replan boundary, if any. */ reference?: Readonly<
    Record<string, P.ITransform>
  >;
  /** Joints whose rotations measure continuity. */ joints: readonly P.IJoint[];
}): Fit {
  if (!input.candidates.length)
    throw new Error("Missing physical support fit candidates");
  const scored: { fit: Fit; error: number; distance: number }[] =
    input.candidates.map(
      (fit: Fit): { fit: Fit; error: number; distance: number } => ({
        fit,
        error: Math.max(0, ...Object.values(fit.residuals)),
        distance: input.reference
          ? input.joints.reduce(
              (sum: number, joint: P.IJoint): number =>
                sum + angle(fit.targets, input.reference!, joint) ** 2,
              0,
            )
          : 0,
      }),
    );
  const admissible: typeof scored = scored.filter(
    (entry: (typeof scored)[number]): boolean => entry.error <= input.tolerance,
  );
  const pool: typeof scored = admissible.length ? admissible : scored;
  return pool.reduce(
    (
      best: (typeof scored)[number],
      entry: (typeof scored)[number],
    ): (typeof scored)[number] =>
      (
        admissible.length
          ? entry.distance < best.distance
          : entry.error < best.error
      )
        ? entry
        : best,
  ).fit;
}

/** Geodesic angle between one joint's relative rotations in two pose records. */
function angle(
  first: Readonly<Record<string, P.ITransform>>,
  second: Readonly<Record<string, P.ITransform>>,
  joint: P.IJoint,
): number {
  const difference: P.ITransform["rotation"] = Quaternion.multiply(
    physicalJointRelativeRotation(first, joint),
    Quaternion.inverse(physicalJointRelativeRotation(second, joint)),
  );
  return (
    2 *
    Math.atan2(
      Math.hypot(difference.x, difference.y, difference.z),
      Math.abs(difference.w),
    )
  );
}
