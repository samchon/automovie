import type { IAutoMovieQuaternion } from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import type { AutoMovieEngineXpbdJoint } from "../AutoMovieEngineXpbdJoint";

/*
 * A joint's relation at the present poses: the child's anchor frame relative to
 * the parent's, normalised, the rotation its admission and its coordinates
 * read.
 * Parameter joint: The joint.
 * Returns: The child's anchor frame in the parent's, unit.
 */
export function readXpbdJointRelation(
  joint: AutoMovieEngineXpbdJoint,
): IAutoMovieQuaternion {
  const frame: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
    joint.parent.orientation,
    joint.parentFrame().rotation,
  );
  return AutoMovieEngineQuaternion.normalize(
    AutoMovieEngineQuaternion.multiply(
      AutoMovieEngineQuaternion.inverse(frame),
      AutoMovieEngineQuaternion.multiply(joint.child.orientation, joint.childFrame().rotation),
    ),
  );
}
