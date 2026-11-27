import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHandshake,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";

/*
 * The handshake's standing shoulder and sternum offsets from one actual trunk.
 * Parameter body: The body whose stand posture fixes the approach geometry.
 * Parameter side: The shaking hand.
 * Returns: World-metre offsets from the stand law's zero floor origin and
 * heading.
 */
export function handshakeStance(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
): IAutoMovieMotionHumanHandshake.IStance {
  const posture: IAutoMovieMotionHumanPosture = stand.posture(
    body,
    { x: 0, y: 0, z: 0 },
    0,
  );
  const reading: ReturnType<typeof HumanTrunk.prepare> = HumanTrunk.prepare(
    body,
    posture,
    new Set<AutoMovieHumanoidBone>([
      `${side}UpperArm`,
      body.surfaces.regions.sternum.bone,
    ]),
  );
  const shoulder: IAutoMovieVector3 = reading.bones.get(
    `${side}UpperArm`,
  )!.worldPosition;
  return {
    height: shoulder.y,
    sternum: reading.region("sternum").point.z,
    shoulder: shoulder.z,
    across: Math.abs(shoulder.x),
  };
}
