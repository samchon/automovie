import { AutoMovieComposition } from "@automovie/engine";

import type { Student } from "../../entities/cast/student/Student";

/**
 * Two people bending at once toward a thing between their feet: both plant
 * wider, bend their knees and hinge at the hips from the same second, and
 * each bends exactly as far as the heads meet halfway (contact at the bend's
 * end) before either hand reaches the floor; `until: "lean"` stops both in a
 * forward lean of 0.45 of the full hinge instead, deep enough to read in a
 * full shot. Each then holds
 * an instant and straightens.
 *
 * ```ts
 * sharedReach(carina, harry, note, { start: 34.7 });
 * sharedReach(carina, harry, note, { start: 41.0, until: "lean" });
 * ```
 *
 * @param a One person.
 * @param b The other.
 * @param toward The thing on the floor, or a place.
 * @param options The shared start, and whether the bend meets or stops in a lean.
 * @returns Both bends and straightenings in parallel.
 * @evidence docs/research/everyday/handover.md#pick-up Two heads 0.8-0.9 m apart meet at forehead height before the hands reach the floor.
 * @evidence contracts/development/behaviors.md#relational-goals Each bend's depth is resolved against the other person's actual position.
 * @evidence contracts/development/common.md#meaningful-documentation States what both do and the two variants.
 */
export function sharedReach(
  a: Student,
  b: Student,
  toward: string | { readonly id: string },
  options: { start: number; until?: "contact" | "lean"; hold?: number },
): AutoMovieComposition {
  const lean: boolean = options.until === "lean";
  const bend = (self: Student, other: Student) =>
    self
      .bend(toward, lean ? { depth: "lean", start: options.start } : { meet: other, start: options.start })
      .hold(options.hold ?? 0.3)
      .straighten();
  return AutoMovieComposition.parallel(bend(a, b), bend(b, a));
}
