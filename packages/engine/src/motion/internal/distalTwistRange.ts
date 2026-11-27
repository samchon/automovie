import type {
  IAutoMovieAngleRange,
  IAutoMovieAxisFrame,
  IAutoMovieJointConstraint,
  IAutoMoviePreparedChainPlant,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineDistalTwistSwivelRange } from "../../kinematics/AutoMovieEngineDistalTwistSwivelRange";
import { AutoMovieEngineHingedArmSwivel } from "../../kinematics/AutoMovieEngineHingedArmSwivel";
import { AutoMovieEngineSwivelJointReadings } from "../../kinematics/AutoMovieEngineSwivelJointReadings";
import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import type { AutoMovieEngineMotionDistalTwist } from "../AutoMovieEngineMotionDistalTwist";

/*
 * The swivels of one bend branch at which a prepared chain's distally twisting
 * mid segment (a forearm) can take, inside its twist range, the twist a
 * requested effector rotation leaves it (`AutoMovieEngineDistalTwistSwivelRange`), read from
 * the chain's preparation as `solveDistalTwist` reads its equation: the
 * effector's rest-carried abduction and flexion axes and its clinical-zero
 * twist give the two directions of the zero-twist reading, and the request seen
 * from the untwisted mid segment, `K(s) = (W upper(s) Lr lower)^-1 R`, carries
 * the effector's flexion axis. A branch's mid rotation is its hinge turn alone,
 * which is the mid joint's articulation with no twist.
 * Parameter props: The chain's preparation; the mid joint's twist axis (its
 * admitted basis) and that axis's rest frame; the effector's admitted flexion
 * axis and its fixed distal-twist readings (`solveDistalTwist.prepare` under
 * the same rest, basis and frame); the branch's poser; the requested
 * model-frame effector rotation.
 * Returns: The breakpoints and the admission test; null when the mid joint has
 * no box range of twist to read (no constraint, a swing-twist gate, or an
 * immobile twist).
 */
export function distalTwistRange(props: {
  prepared: Pick<
    IAutoMoviePreparedChainPlant,
    "upper" | "lowerRotation" | "lowerDomain"
  >;
  axis: IAutoMovieVector3;
  frame: IAutoMovieAxisFrame | undefined;
  flexion: IAutoMovieVector3;
  fixed: AutoMovieEngineMotionDistalTwist.IPrepared;
  posed: ReturnType<typeof AutoMovieEngineHingedArmSwivel.pose>;
  rotation: IAutoMovieQuaternion;
}): AutoMovieEngineDistalTwistSwivelRange.IRange | null {
  const constraint: IAutoMovieJointConstraint | null =
    props.prepared.lowerDomain.constraint;
  if (constraint === null) return null;
  if (constraint.swingTwist !== undefined && constraint.swingTwist !== null)
    return null;
  const twist: IAutoMovieAngleRange | null = constraint.twist;
  if (twist === null) return null;
  const { cosine, sine }: AutoMovieEngineMotionDistalTwist.IZero = props.fixed.zero();
  const abduction: IAutoMovieVector3 = props.fixed.abduction();
  const flexion: IAutoMovieVector3 = props.fixed.flexion();
  const wanted: IAutoMovieQuaternion = AutoMovieEngineQuaternion.normalize(props.rotation);
  return AutoMovieEngineDistalTwistSwivelRange.of({
    axis: AutoMovieEngineVector3.normalize(props.axis),
    normal: AutoMovieEngineVector3.subtract(
      AutoMovieEngineVector3.scale(abduction, cosine),
      AutoMovieEngineVector3.scale(flexion, sine),
    ),
    ahead: AutoMovieEngineVector3.add(
      AutoMovieEngineVector3.scale(abduction, sine),
      AutoMovieEngineVector3.scale(flexion, cosine),
    ),
    carried: (swivel: number): IAutoMovieVector3 => {
      const at: ReturnType<ReturnType<typeof AutoMovieEngineHingedArmSwivel.pose>> =
        props.posed(swivel);
      return AutoMovieEngineQuaternion.rotateVector(
        AutoMovieEngineQuaternion.multiply(
          AutoMovieEngineQuaternion.inverse(
            AutoMovieEngineQuaternion.multiply(
              AutoMovieEngineQuaternion.multiply(
                AutoMovieEngineQuaternion.multiply(
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
    range: AutoMovieEngineSwivelJointReadings.rig(twist, props.frame),
  });
}
