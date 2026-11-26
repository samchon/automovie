import type { IAutoMovieQuaternion } from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import type { AutoMovieXpbdJoint } from "../AutoMovieXpbdJoint";

/**
 * A joint's relation at the present poses: the child's anchor frame relative to
 * the parent's, normalised, the rotation its admission and its coordinates
 * read.
 *
 * @param joint The joint.
 * @returns The child's anchor frame in the parent's, unit.
 */
export function readXpbdJointRelation(
  joint: AutoMovieXpbdJoint,
): IAutoMovieQuaternion {
  const frame: IAutoMovieQuaternion = Quaternion.multiply(
    joint.parent.orientation,
    joint.parentFrame().rotation,
  );
  return Quaternion.normalize(
    Quaternion.multiply(
      Quaternion.inverse(frame),
      Quaternion.multiply(joint.child.orientation, joint.childFrame().rotation),
    ),
  );
}
