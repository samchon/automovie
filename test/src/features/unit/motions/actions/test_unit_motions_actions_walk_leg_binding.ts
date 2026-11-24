import type {
  IAutoMovieMotionHumanColliders,
  IAutoMovieQuaternion,
  IAutoMoviePhysicalShape,
  IAutoMovieVector3,
} from "@automovie/interface";
import { walkLegBinding } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of a rotation and a plane distance, metres. */
const ROUNDING: number = 1e-12;

/**
 * `walkLegBinding` reads a leg clearance's probes: `prepareRelative` carries a
 * point from one placed segment's frame into another's, and `prepareInside`
 * reads a segment-local point's depth inside a shape, a hull's least distance
 * inside its face planes and any other shape's negated signed distance, zero
 * outside.
 *
 * Scenarios:
 *
 * 1. From a segment at (1, 0, 0) unturned into one at the origin turned a
 *    quarter turn about +Y: its origin reads (0, 0, 1) and its +Y point (0, 1,
 *    1).
 * 2. A 0.2 m cube hull placed at (1, 0, 0): its centre lies 0.1 m deep, a point
 *    0.05 m off the centre along X 0.05 m deep, and a point 0.2 m off it
 *    outside.
 * 3. A 0.1 m sphere: its centre 0.1 m deep, 0.04 m off it 0.06 m deep, outside
 *    0.
 */
export function test_unit_motions_actions_walk_leg_binding(): void {
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const p = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });

  // 1. Relative frames.
  const a: Pick<IAutoMovieMotionHumanColliders.IPlaced, "pose"> = {
    pose: { position: p(1, 0, 0), rotation: identity },
  };
  const b: Pick<IAutoMovieMotionHumanColliders.IPlaced, "pose"> = {
    pose: {
      position: p(0, 0, 0),
      rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
    },
  };
  const relative: (probe: IAutoMovieVector3) => IAutoMovieVector3 =
    walkLegBinding.prepareRelative(a, b);
  TestValidator.predicate(
    "carried into the turned frame",
    vclose(relative(p(0, 0, 0)), p(0, 0, 1), ROUNDING) &&
      vclose(relative(p(0, 1, 0)), p(0, 1, 1), ROUNDING),
  );

  // 2. A hull.
  const corners: IAutoMovieVector3[] = [];
  for (const x of [-0.1, 0.1])
    for (const y of [-0.1, 0.1]) for (const z of [-0.1, 0.1]) corners.push(p(x, y, z));
  const hull: IAutoMoviePhysicalShape = {
    kind: "hull",
    transform: { position: p(1, 0, 0), rotation: identity },
    points: corners,
  };
  const inHull: (local: IAutoMovieVector3, floor: number) => number =
    walkLegBinding.prepareInside(hull);
  TestValidator.predicate(
    "inside the hull",
    nclose(inHull(p(1, 0, 0), 0), 0.1, ROUNDING) &&
      nclose(inHull(p(1.05, 0, 0), 0), 0.05, ROUNDING) &&
      inHull(p(1.2, 0, 0), 0) === 0,
  );

  // 3. A sphere.
  const sphere: IAutoMoviePhysicalShape = {
    kind: "sphere",
    transform: { position: p(0, 0, 0), rotation: identity },
    radius: 0.1,
  };
  const inSphere: (local: IAutoMovieVector3, floor: number) => number =
    walkLegBinding.prepareInside(sphere);
  TestValidator.predicate(
    "inside the sphere",
    nclose(inSphere(p(0, 0, 0), 0), 0.1, ROUNDING) &&
      nclose(inSphere(p(0.04, 0, 0), 0), 0.06, ROUNDING) &&
      inSphere(p(0.2, 0, 0), 0) === 0,
  );
}
