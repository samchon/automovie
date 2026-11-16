import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanHand } from "../posture/HumanHand";
import type { HumanGrasp } from "./HumanGrasp";
import { HumanGraspReach } from "./HumanGraspReach";

/**
 * The original grip alignment and half-width palm placement, prepared by scope.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Separates fixed body/hand geometry from changing targets, and a fixed authored target's wrapped turn from the actual oblique tilt query.
 * @evidence contracts/development/design.md#principled-representation Uses existing world-metre grasp frames, degree angles and canonical hand wrist/quaternion types; prepared data contains only rigid geometry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepare serves HumanGrasp.prepareHand and its existing support consumers; turns serves pickUpSearch's actual repeated turn/tilt grid without another target or solver representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No prop, body size, fixture, solved wrist/pose, sampled time or contact verdict is embedded; every target point, width and direction retains its original meaning.
 */
export namespace HumanGraspHand {
  /**
   * Prepare unchanged hand geometry for independently changing target/tilt goals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Fixes canonical body/side through the reader lifetime; each world target and optional degree tilt returns a fresh world wrist and hand rotation.
   * @evidence contracts/development/implementation.md#principled-implementation Aligns the original grip normal/forward with the actual approach/axis, then applies original normalized approach-axis tilt and half-width near-surface palm placement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One body-geometry owner and one wrist assembler serve arbitrary-target and fixed-authored-target preparations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the exact quaternion product/normalization, half-width subtraction and rotated palm offset, without changing a point, tilt, width, bound or admission rule.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two local hand queries and fixed-rest alignment preparation occur once; each actual target retains its world alignment, tilt and point arithmetic without IK or result sampling. Runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only unchanged body/side geometry is shared; every distinct target and tilt computes its actual wrist independently through the same assembler.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The owner retains constant-size private grip/palm/alignment data until release; every output point/quaternion is fresh and no target, pose, time history or handle is retained.
   */
  export function prepare(body: IHumanBody, side: HumanHand.Side): (target: HumanGrasp.IFrame, tilt?: number) => HumanHand.IWrist {
    const fixed: IHand = geometry(body, side);
    return (target: HumanGrasp.IFrame, tilt: number = 0): HumanHand.IWrist => {
      const turn: IAutoMovieQuaternion = fixed.align({ normal: target.approach, forward: target.axis });
      const rotation: IAutoMovieQuaternion = tilted(target.approach, turn, tilt);
      return placed(fixed.palm, near(target), rotation);
    };
  }

  /**
   * Prepare one unchanged authored target for its actual wrapped-turn/tilt grid.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Body/side and authored world target remain fixed for the synchronous search; actual degree turn/tilt inputs return the same fresh wrist goals as around plus prepare.
   * @evidence contracts/development/implementation.md#principled-implementation HumanGraspReach.around owns the original wrapped approach. Alignment and half-width near point depend on that turn but not tilt, so one consecutive turn shares them while each tilt retains the original quaternion/palm computation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The same hand geometry, tilt and point assemblers are fed by one bounded last-turn geometry record; the existing wrapped-axis owner is delegated rather than copied.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No turn, tilt, preference, candidate, joint range or fit is removed; Object.is distinguishes signed-zero turns and no normalized intermediate replaces the original raw alignment before tilt multiplication.
   * @evidence contracts/development/implementation.md#efficient-algorithms For T consecutive turns and L tilts per turn, T wrapped-frame/alignment/near-point preparations replace T*L repeats; all T*L actual tilt/wrist goals and every later numerical candidate fit remain. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The actual pick-up grid fixes body/hand/authored point/approach/axis/width; exact consecutive turn equality is therefore sufficient for only this rigid preparation, while changed source geometry requires a new producer.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous search retains one hand geometry and one last-turn quaternion/approach/near point, replaced on a turn change and released with the builder; no wrist answer, candidate fit, query history or external handle is retained.
   */
  export function turns(body: IHumanBody, side: HumanHand.Side, authored: HumanGrasp.IFrame): (turn: number, tilt: number) => HumanHand.IWrist {
    const fixed: IHand = geometry(body, side);
    let previous: { turn: number; alignment: IAutoMovieQuaternion; approach: IAutoMovieVector3; point: IAutoMovieVector3 } | undefined;
    return (turn: number, tilt: number): HumanHand.IWrist => {
      if (previous === undefined || !Object.is(previous.turn, turn)) {
        const target: HumanGrasp.IFrame = HumanGraspReach.around(authored, turn);
        const alignment: IAutoMovieQuaternion = fixed.align({ normal: target.approach, forward: target.axis });
        previous = { turn, alignment, approach: target.approach, point: near(target) };
      }
      return placed(fixed.palm, previous.point, tilted(previous.approach, previous.alignment, tilt));
    };
  }
}

/** Private immutable body-local geometry shared by this hand's actual goals. */
interface IHand {
  /** The flat palm's wrist-local point in metres. */
  palm: IAutoMovieVector3;
  /** Original fixed-rest grip alignment for actual world directions. */
  align: ReturnType<typeof HumanHand.prepareAlignment>;
}

/** Read the same fixed grip/palm geometry once, with no wrist-placement work. */
function geometry(body: IHumanBody, side: HumanHand.Side): IHand {
  const grip: HumanHand.IFrame = HumanHand.offset(body, side, "grip", "flat");
  const palm: IAutoMovieVector3 = HumanHand.offset(body, side, "palm", "flat").point;
  return { palm, align: HumanHand.prepareAlignment(grip) };
}

/** The actual near surface, with the original point-minus-half-width grouping. */
function near(target: HumanGrasp.IFrame): IAutoMovieVector3 {
  return Vector3.subtract(target.point, Vector3.scale(target.approach, target.width / 2));
}

/** Keep the original unnormalized alignment inside the normalized tilt product. */
function tilted(approach: IAutoMovieVector3, turn: IAutoMovieQuaternion, tilt: number): IAutoMovieQuaternion {
  return Quaternion.normalize(Quaternion.multiply(Quaternion.fromAxisAngle(approach, tilt), turn));
}

/** Fresh original wrist/palm-offset assembly for either preparation scope. */
function placed(palm: IAutoMovieVector3, point: IAutoMovieVector3, rotation: IAutoMovieQuaternion): HumanHand.IWrist {
  return { point: Vector3.subtract(point, Quaternion.rotateVector(rotation, palm)), rotation };
}
