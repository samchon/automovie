import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";

/*
 * Face a hand against a target normal, keeping its fingers as near upright as
 * that normal allows. A vertical normal, which leaves no upright direction in
 * its plane, points the fingers along the performer's forward.
 * Parameter side: The hand whose anatomical axes are aligned.
 * Parameter normal: The target's outward world normal.
 * Parameter yaw: The performer's heading, degrees about +Y.
 * Returns: The world hand rotation.
 */
export function armPhraseFacing(
  side: AutoMovieHumanSide,
  normal: IAutoMovieVector3,
  yaw: number,
): IAutoMovieQuaternion {
  const n: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(normal);
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const across: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
    up,
    AutoMovieEngineVector3.scale(n, AutoMovieEngineVector3.dot(up, n)),
  );
  const fingers: IAutoMovieVector3 =
    AutoMovieEngineVector3.length(across) > VERTICAL
      ? across
      : HumanFrame.point(
          { origin: { x: 0, y: 0, z: 0 }, yaw },
          { x: 0, y: 0, z: 1 },
        );
  return HumanHand.rotation(side, { fingers, palm: AutoMovieEngineVector3.scale(n, -1) });
}

/*
 * The projected length of world up under which a normal counts as vertical: the
 * sine of the angle between them, 1e-6 rad, a numeric guard far below any
 * authored tilt.
 */
const VERTICAL: number = 1e-6;
