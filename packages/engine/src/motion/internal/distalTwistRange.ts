import type {
  IAutoMovieAngleRange,
  IAutoMovieAxisFrame,
  IAutoMovieJointConstraint,
  IAutoMoviePreparedChainPlant,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { distalTwistSwivelRange } from "../../kinematics/distalTwistSwivelRange";
import { hingedArmSwivel } from "../../kinematics/hingedArmSwivel";
import { swivelJointReadings } from "../../kinematics/swivelJointReadings";
import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import type { solveDistalTwist } from "../solveDistalTwist";

/**
 * The swivels of one bend branch at which a prepared chain's distally twisting
 * mid segment (a forearm) can take, inside its twist range, the twist a
 * requested effector rotation leaves it (`distalTwistSwivelRange`), read from
 * the chain's preparation as `solveDistalTwist` reads its equation: the
 * effector's rest-carried abduction and flexion axes and its clinical-zero
 * twist give the two directions of the zero-twist reading, and the request seen
 * from the untwisted mid segment, `K(s) = (W upper(s) Lr lower)^-1 R`, carries
 * the effector's flexion axis. A branch's mid rotation is its hinge turn alone,
 * which is the mid joint's articulation with no twist.
 *
 * @param props The chain's preparation; the mid joint's twist axis (its
 *   admitted basis) and that axis's rest frame; the effector's admitted flexion
 *   axis and its fixed distal-twist readings (`solveDistalTwist.prepare` under
 *   the same rest, basis and frame); the branch's poser; the requested
 *   model-frame effector rotation.
 * @returns The breakpoints and the admission test; null when the mid joint has
 *   no box range of twist to read (no constraint, a swing-twist gate, or an
 *   immobile twist).
 */
export function distalTwistRange(props: {
  prepared: Pick<
    IAutoMoviePreparedChainPlant,
    "upper" | "lowerRotation" | "lowerDomain"
  >;
  axis: IAutoMovieVector3;
  frame: IAutoMovieAxisFrame | undefined;
  flexion: IAutoMovieVector3;
  fixed: solveDistalTwist.IPrepared;
  posed: ReturnType<typeof hingedArmSwivel.pose>;
  rotation: IAutoMovieQuaternion;
}): distalTwistSwivelRange.IRange | null {
  const constraint: IAutoMovieJointConstraint | null =
    props.prepared.lowerDomain.constraint;
  if (constraint === null) return null;
  if (constraint.swingTwist !== undefined && constraint.swingTwist !== null)
    return null;
  const twist: IAutoMovieAngleRange | null = constraint.twist;
  if (twist === null) return null;
  const { cosine, sine }: solveDistalTwist.IZero = props.fixed.zero();
  const abduction: IAutoMovieVector3 = props.fixed.abduction();
  const flexion: IAutoMovieVector3 = props.fixed.flexion();
  const wanted: IAutoMovieQuaternion = Quaternion.normalize(props.rotation);
  return distalTwistSwivelRange.of({
    axis: Vector3.normalize(props.axis),
    normal: Vector3.subtract(
      Vector3.scale(abduction, cosine),
      Vector3.scale(flexion, sine),
    ),
    ahead: Vector3.add(
      Vector3.scale(abduction, sine),
      Vector3.scale(flexion, cosine),
    ),
    carried: (swivel: number): IAutoMovieVector3 => {
      const at: ReturnType<ReturnType<typeof hingedArmSwivel.pose>> =
        props.posed(swivel);
      return Quaternion.rotateVector(
        Quaternion.multiply(
          Quaternion.inverse(
            Quaternion.multiply(
              Quaternion.multiply(
                Quaternion.multiply(
                  props.prepared.upper.worldRotation,
                  at.upper,
                ),
                props.prepared.lowerRotation,
              ),
              at.lower,
            ),
          ),
          wanted,
        ),
        props.flexion,
      );
    },
    range: swivelJointReadings.rig(twist, props.frame),
  });
}
