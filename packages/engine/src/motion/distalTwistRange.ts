import type {
  IAutoMovieAngleRange,
  IAutoMovieAxisFrame,
  IAutoMovieJointConstraint,
  IAutoMoviePreparedChainPlant,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { distalTwistSwivelRange } from "../kinematics/distalTwistSwivelRange";
import { hingedArmSwivel } from "../kinematics/hingedArmSwivel";
import { swivelJointReadings } from "../kinematics/swivelJointReadings";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { solveDistalTwist } from "./solveDistalTwist";

/**
 * The swivels of one bend branch at which a prepared chain's distally
 * twisting mid segment (a forearm) can take, inside its twist range, the
 * twist a requested effector rotation leaves it (`distalTwistSwivelRange`),
 * read from the chain's preparation as `solveDistalTwist` reads its
 * equation: the effector's rest-carried abduction and flexion axes and its
 * clinical-zero twist give the two directions of the zero-twist reading, and
 * the request seen from the untwisted mid segment,
 * `K(s) = (W upper(s) Lr lower)^-1 R`, carries the effector's flexion axis.
 * A branch's mid rotation is its hinge turn alone, which is the mid joint's
 * articulation with no twist.
 *
 * @param props The chain's preparation; the mid joint's twist axis (its admitted basis) and that axis's rest frame; the effector's admitted flexion axis and its fixed distal-twist readings (`solveDistalTwist.prepare` under the same rest, basis and frame); the branch's poser; the requested model-frame effector rotation.
 * @returns The breakpoints and the admission test; null when the mid joint has no box range of twist to read (no constraint, a swing-twist gate, or an immobile twist).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read from the preparation, the frame of the carried axis, the premise on the branch's mid rotation and every null case.
 * @evidence contracts/development/implementation.md#principled-implementation The zero-twist condition is `solveDistalTwist`'s own equation, `P cos z - Q sin z = 0` with `P` and `Q` the twisted carried axis's components on the rest-carried abduction and flexion axes, and `P sin z + Q cos z > 0` selects the reading at the zero itself; the range is the constraint's clinical interval taken to rest-relative degrees, the angle the mid joint's twist composes about its axis.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The range, the two directions, the carried axis, then the shared reader.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A joint the analysis does not cover returns null rather than a guess; nothing here accepts a pose, the fit scores the swivel chosen.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work: three posed swivels through `distalTwistSwivelRange.of`, each four quaternion products and one vector rotation.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The fixed effector readings are the caller's shared `solveDistalTwist.prepare` record; the interval lift is `swivelJointReadings.rig`.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the returned test, which its fit releases.
 */
export function distalTwistRange(props: {
  prepared: Pick<IAutoMoviePreparedChainPlant, "upper" | "lowerRotation" | "lowerDomain">;
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
