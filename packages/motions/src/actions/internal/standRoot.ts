import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../../posture/internal/HumanFrame";
import { standUpright } from "./standUpright";

/*
 * The root of a quiet stance over two ankle points (`stand.root`): the pelvis
 * over the feet's midpoint as it stands over its rest feet, shifted forward by
 * the upright alignment's lean (`standUpright`), `drop` below its rest height
 * above the mean ankle plane, and lowered where feet set wider or staggered
 * than the rest feet (a fighting stance kept from the entry) would hold a hip
 * farther from its ankle than the quiet stance does, so each leg spans its foot
 * with the quiet stance's knee, as a person settles into a wide stance. The
 * quiet stance itself is unchanged.
 * Parameter body: The body.
 * Parameter feet: Ankle points, world metres.
 * Parameter yaw: The heading, degrees.
 * Parameter drop: How far the quiet stance's root sits below its rest height,
 * metres.
 * Returns: The root, world metres.
 */
export function standRoot(
  body: IAutoMovieMotionHumanBody,
  feet: Readonly<Record<AutoMovieHumanSide, IAutoMovieVector3>>,
  yaw: number,
  drop: number,
): IAutoMovieVector3 {
  const placed: IAutoMovieVector3 = level(body, feet, yaw, drop);
  const quiet: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: { ...body.rest.get("leftFoot")!, y: body.measure.ankleHeight },
    right: { ...body.rest.get("rightFoot")!, y: body.measure.ankleHeight },
  };
  const rested: IAutoMovieVector3 = level(body, quiet, 0, drop);
  let y: number = placed.y;
  for (const side of ["left", "right"] as const) {
    const hip: IAutoMovieVector3 = body.rest.get(`${side}UpperLeg`)!;
    const span: number = Vector3.distance(
      Vector3.add(rested, hip),
      quiet[side],
    );
    const turned: IAutoMovieVector3 = HumanFrame.point(
      { origin: placed, yaw },
      hip,
    );
    const across: number = Math.hypot(
      turned.x - feet[side].x,
      turned.z - feet[side].z,
    );
    y = Math.min(
      y,
      feet[side].y +
        Math.sqrt(Math.max(0, span * span - across * across)) -
        hip.y,
    );
  }
  return { ...placed, y };
}

/*
 * The root before the legs' reach: over the feet's midpoint, leaned, `drop`
 * below the rest height.
 */
function level(
  body: IAutoMovieMotionHumanBody,
  feet: Readonly<Record<AutoMovieHumanSide, IAutoMovieVector3>>,
  yaw: number,
  drop: number,
): IAutoMovieVector3 {
  const l: IAutoMovieVector3 = body.rest.get("leftFoot")!;
  const r: IAutoMovieVector3 = body.rest.get("rightFoot")!;
  const mid: IAutoMovieVector3 = HumanFrame.point(
    { origin: { x: 0, y: 0, z: 0 }, yaw },
    { x: (l.x + r.x) / 2, y: 0, z: (l.z + r.z) / 2 },
  );
  const lean: IAutoMovieVector3 = HumanFrame.point(
    { origin: { x: 0, y: 0, z: 0 }, yaw },
    { x: 0, y: 0, z: standUpright(body).lean },
  );
  return {
    x: (feet.left.x + feet.right.x) / 2 - mid.x + lean.x,
    y: (feet.left.y + feet.right.y) / 2 - body.measure.ankleHeight - drop,
    z: (feet.left.z + feet.right.z) / 2 - mid.z + lean.z,
  };
}
