import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanHeld,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  StrikingHeldFrame
} from "../../../../../packages/motions/src/striking/internal/StrikingHeldFrame";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/** An affordance at a point, its +Y turned by a rotation. */
const at = (
  id: string,
  translation: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  length?: number,
): IAutoMovieAffordance => ({
  id,
  kind: "handle",
  frame: { translation, rotation, scale: { x: 1, y: 1, z: 1 } },
  extent: null,
  ...(length === undefined ? {} : { length }),
});

/** A blade held at the origin: its point 0.8 m up +Z, an edge 0.4 m long. */
const HELD: IAutoMovieMotionHumanHeld.IHeld = {
  prop: "blade",
  side: "right",
  frame: {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  },
  affordances: [
    at(
      "point",
      { x: 0, y: 0, z: 0.8 },
      { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 },
    ),
    at(
      "edge",
      { x: 0, y: 0, z: 0.5 },
      { x: 0, y: 0, z: -Math.SQRT1_2, w: Math.SQRT1_2 },
      0.4,
    ),
    at("grip", { x: 0, y: 0, z: 0.1 }, { x: 0, y: 0, z: 0, w: 1 }),
  ],
};

/**
 * A held tool's frame (`StrikingHeldFrame.read`, `square`): the axis along the
 * point's own +Y (or from a named point to the tip), the length the tip's reach
 * along it, the edge squared off the axis, and the edge's span about its middle
 * along the axis; a working line between coincident points is refused; a
 * direction squared off an axis falls back when it runs along it.
 *
 * Scenarios:
 *
 * 1. The blade runs along +Z, 0.8 m, its edge +X, not rolling, edged from 0.1 to
 *    0.5 m back from the tip.
 * 2. From the grip, the run is 0.7 m; from the point itself it is refused.
 * 3. Squared off +Z, (0, 1, 1) is +Y and +Z itself falls back to +Y; off +Y with
 *    only +Y to fall back on it is +X.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies local tool axis, edge span and geometric fallback, including refusal for a zero-length named line.
 * @evidence contracts/development/testing.md#behavioral-verification Reads an authored tool frame, tries a named offset and coincident points, and squares vectors off two different axes.
 * @evidence contracts/development/testing.md#independent-expectations The authored extent fixes 0.8 and 0.7 m lengths. Removing the axial component of (0, 1, 1) leaves +Y and parallel vectors exercise fallback.
 */
export function test_motions_striking_held_frame(): void {
  const tool = StrikingHeldFrame.read(HELD);
  TestValidator.predicate(
    "the blade",
    vclose(tool.axis, { x: 0, y: 0, z: 1 }, 1e-12) &&
      nclose(tool.length, 0.8, 1e-12) &&
      vclose(tool.edge, { x: 1, y: 0, z: 0 }, 1e-12) &&
      tool.rolls === false &&
      nclose(tool.span![0], 0.1, 1e-12) &&
      nclose(tool.span![1], 0.5, 1e-12),
  );
  TestValidator.predicate(
    "a working line",
    nclose(
      StrikingHeldFrame.read(HELD, { tip: "point", from: "grip" }).length,
      0.7,
      1e-12,
    ) &&
      throwsError(() =>
        StrikingHeldFrame.read(HELD, { tip: "point", from: "point" }),
      ),
  );
  const z = { x: 0, y: 0, z: 1 };
  TestValidator.predicate(
    "squared off",
    vclose(
      StrikingHeldFrame.square(z, { x: 0, y: 1, z: 1 }),
      { x: 0, y: 1, z: 0 },
      1e-12,
    ) &&
      vclose(StrikingHeldFrame.square(z, z), { x: 0, y: 1, z: 0 }, 1e-12) &&
      vclose(
        StrikingHeldFrame.square({ x: 0, y: 1, z: 0 }, { x: 0, y: 1, z: 0 }, [
          { x: 0, y: 1, z: 0 },
        ]),
        { x: 1, y: 0, z: 0 },
        1e-12,
      ),
  );
}
