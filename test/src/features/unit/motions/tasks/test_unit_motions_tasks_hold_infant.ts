import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { holdInfantBasis, holdInfantEvents } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** A point. */
const P = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });

/**
 * A held infant's pieces: `holdInfantBasis` turns its `+Y` to its body's line
 * and its `+Z` toward its face, and `holdInfantEvents` times the hold's
 * events.
 *
 * Scenarios:
 *
 * 1. Upright facing +Z it is unturned; upright facing +X it turns `+Z` to `+X` and
 *    keeps `+Y`; a face tilted up toward +Z is made square to the line first.
 * 2. Lying along +X, face up, its `+Y` goes to +X and its `+Z` to +Y.
 * 3. A shoulder hold of 4 s after a 1 s settle patting 1.5 times a second is held
 *    at a fifth, pats six times, at `(1 + k / 1.5) / 5`, and relaxes at the
 *    end; a cradle does not pat.
 */
export function test_unit_motions_tasks_hold_infant(): void {
  const turned = (
    q: IAutoMovieQuaternion,
    v: IAutoMovieVector3,
  ): IAutoMovieVector3 => Quaternion.rotateVector(q, v);
  const upright: IAutoMovieQuaternion = holdInfantBasis(P(0, 1, 0), P(0, 0, 1));
  const aside: IAutoMovieQuaternion = holdInfantBasis(P(0, 1, 0), P(1, 0, 0));
  TestValidator.predicate(
    "upright",
    vclose(turned(upright, P(0, 0, 1)), P(0, 0, 1), 1e-12) &&
      vclose(turned(upright, P(0, 1, 0)), P(0, 1, 0), 1e-12) &&
      vclose(turned(aside, P(0, 0, 1)), P(1, 0, 0), 1e-12) &&
      vclose(turned(aside, P(0, 1, 0)), P(0, 1, 0), 1e-12) &&
      vclose(
        turned(holdInfantBasis(P(0, 1, 0), P(0, 1, 1)), P(0, 0, 1)),
        P(0, 0, 1),
        1e-12,
      ),
  );
  const lying: IAutoMovieQuaternion = holdInfantBasis(P(1, 0, 0), P(0, 1, 0));
  TestValidator.predicate(
    "lying",
    vclose(turned(lying, P(0, 1, 0)), P(1, 0, 0), 1e-12) &&
      vclose(turned(lying, P(0, 0, 1)), P(0, 1, 0), 1e-12),
  );

  const events: IAutoMovieMotionEvent[] = holdInfantEvents(1, 5, 1.5, true);
  TestValidator.predicate(
    "the shoulder hold's events",
    events.length === 8 &&
      events[0]!.name === "held" &&
      events[0]!.share === 0.2 &&
      events
        .slice(1, 7)
        .every(
          (e: IAutoMovieMotionEvent, i: number): boolean =>
            e.name === `pat${i + 1}` &&
            nclose(e.share, (1 + (i + 1) / 1.5) / 5, 1e-12),
        ) &&
      events[7]!.name === "relax" &&
      events[7]!.share === 1,
  );
  TestValidator.equals(
    "a cradle",
    holdInfantEvents(1, 5, 1.5, false).map(
      (e: IAutoMovieMotionEvent): string => e.name,
    ),
    ["held", "relax"],
  );
}
