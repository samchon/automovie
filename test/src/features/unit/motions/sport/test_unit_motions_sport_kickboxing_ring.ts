import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanKickboxingRing,
  IAutoMovieMotionHumanProp,
  IAutoMovieVector3,
} from "@automovie/interface";
import { KickboxingRing } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/** A contact point of a ring prop, in its own frame. */
const point = (id: string, at: IAutoMovieVector3): IAutoMovieAffordance => ({
  id,
  kind: "surface",
  frame: {
    translation: at,
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  extent: null,
});

/**
 * A 6 m ring as `createRing` declares it: its canvas at 1 m, its top ropes on
 * the four sides and its posts' tops at the corners, `corner1` at `+X +Z`
 * counted round.
 */
const contacts = (half: number): IAutoMovieAffordance[] => [
  point("canvas", { x: 0, y: 1, z: 0 }),
  point("northRope", { x: 0, y: 2, z: half }),
  point("southRope", { x: 0, y: 2, z: -half }),
  point("eastRope", { x: half, y: 2, z: 0 }),
  point("westRope", { x: -half, y: 2, z: 0 }),
  point("corner1", { x: 3, y: 2.2, z: 3 }),
  point("corner2", { x: -3, y: 2.2, z: 3 }),
  point("corner3", { x: -3, y: 2.2, z: -3 }),
  point("corner4", { x: 3, y: 2.2, z: -3 }),
];

/** The ring prop placed at (10, 0, 0) and turned 90 degrees about +Y. */
const ring = (affordances: IAutoMovieAffordance[]): IAutoMovieMotionHumanProp => ({
  subject: "ring",
  frame: {
    position: { x: 10, y: 0, z: 0 },
    rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
  },
  points: {},
  affordances,
});

/**
 * `KickboxingRing` reads a placed ring prop: its centre from the canvas, its
 * size from opposite top ropes, its heading from the placement, and it checks
 * that the ropes stand square and each post on its corner.
 *
 * Scenarios:
 *
 * 1. The ring placed at (10, 0, 0) turned 90 degrees reads its canvas at (10,
 *    1, 0), a 6 m size and a 90 degree heading.
 * 2. Ropes 6 m apart one way and 6.4 m the other are refused.
 * 3. A ring without its canvas is refused.
 */
export function test_unit_motions_sport_kickboxing_ring(): void {
  const read: IAutoMovieMotionHumanKickboxingRing.IRing = KickboxingRing(
    ring(contacts(3)),
  );
  TestValidator.predicate(
    "the placed ring",
    vclose(read.centre, { x: 10, y: 1, z: 0 }, 1e-12) &&
      nclose(read.size, 6, 1e-12) &&
      nclose(read.yaw, 90, 1e-9),
  );
  const crooked: IAutoMovieAffordance[] = contacts(3).map(
    (a: IAutoMovieAffordance): IAutoMovieAffordance =>
      a.id === "eastRope" ? point("eastRope", { x: 3.4, y: 2, z: 0 }) : a,
  );
  TestValidator.predicate(
    "no square, no canvas",
    throwsError(() => KickboxingRing(ring(crooked))) &&
      throwsError(() =>
        KickboxingRing(
          ring(
            contacts(3).filter(
              (a: IAutoMovieAffordance): boolean => a.id !== "canvas",
            ),
          ),
        ),
      ),
  );
}
