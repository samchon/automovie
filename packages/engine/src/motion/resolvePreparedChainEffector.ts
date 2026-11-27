import type {
  IAutoMovieChainBone,
  IAutoMovieResolvePreparedChainEffectorResolvedPreparedEffectorProps,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { resolvePreparedChainLower } from "./internal/resolvePreparedChainLower";

/**
 * Resolve the effector produced by two candidate clinical joints through a
 * prepared chain, in the same model-metre frame as its target. Clinical
 * axes/rest frames must match preparation and candidate inversion. A supplied
 * lower frame must be the completed prefix for these exact same inputs.
 */
export function resolvePreparedChainEffector(
  props: IAutoMovieResolvePreparedChainEffectorResolvedPreparedEffectorProps,
  lower?: IAutoMovieChainBone,
): IAutoMovieVector3 {
  const frame: IAutoMovieChainBone = lower ?? resolvePreparedChainLower(props);
  return Vector3.add(
    frame.worldPosition,
    Quaternion.rotateVector(frame.worldRotation, props.prepared.effectorOffset),
  );
}
