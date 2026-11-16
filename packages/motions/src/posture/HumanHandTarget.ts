import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import type { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { HumanFrame } from "./HumanFrame";
import { HumanHand } from "./HumanHand";
import type { IHumanPosture } from "./IHumanPosture";

/**
 * Build the original surface-on-place hand target with one orientation and
 * one actual bend decision; the prepared companion shares fixed geometry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines surface alignment, current-posture bend solving and fixed-geometry companion.
 * @evidence contracts/development/implementation.md#principled-implementation Aligns the surface normal opposite the normalized place normal, chooses the original explicit/heading/up forward, then keeps the original default strain search or stated bend preset.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This moved hand body owns alignment/target assembly for cold and prepared Target.hand consumers; HumanHand and Bend retain their mathematical responsibilities.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves ALONG, surface/shape/curl defaults, offset calls and actual fallback semantics; every current default bend still runs its numerical search.
 * @evidence contracts/development/implementation.md#efficient-algorithms One alignment and optional bounded Bend search, as before; one-off construction retains no geometry population or measured speedup claim.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The prepared companion shares this same orientation/target owner while the cold path reads actual current geometry normally.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the original caller-owned target/rotation with borrowed world point and retains no input, prepared frame or result history.
 */
export function HumanHandTarget(
  body: IHumanBody,
  posture: IPosture,
  side: HumanHand.Side,
  place: Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
  options: AutoMovieMotionHumanTarget.IHand,
): AutoMovieMotionHumanArm.ITarget {
  const surface: HumanHand.Surface = options.surface ?? "palm";
  const shape: HumanHand.Shape = options.shape ?? "relaxed";
  const normal: IAutoMovieVector3 = Vector3.scale(Vector3.normalize(place.normal), -1);
  const rotation: IAutoMovieQuaternion = oriented(posture, normal, options.forward,
    (): HumanHand.IFrame => HumanHand.offset(body, side, surface, shape));
  return target(body, posture, side, place.point, options, surface, shape, rotation,
    (): IAutoMovieVector3 => HumanHand.place(body, side, surface, place.point, rotation, shape).point);
}

/**
 * Fixed hand-surface geometry for a plan's repeated changing-posture targets.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines plan-owned fixed geometry and actual varying posture/point targets.
 * @evidence contracts/development/design.md#principled-representation Shares only body-local offset, fixed place normal and explicit forward alignment; varying root/pitch/roll and default-forward heading remain actual inputs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepare serves crawl flat palms through the existing Target facade without adding an alternative goal or solver type.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No bend candidate, target point, solved arm or previous result is retained; all default Bend.solve calls remain current.
 */
export namespace HumanHandTarget {
  /**
   * Prepare fixed side/surface/shape/normal/options for one unchanged body.
   * First use prepares geometry, while each requested point and posture
   * still receives its actual preset or numerical bend decision.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed versus varying dependencies, lazy first use and fresh rotation output.
   * @evidence contracts/development/implementation.md#principled-implementation Surface offset and explicit-forward alignment are independent of the target point and trunk posture; their rotated offset translates rigidly, while an absent forward still reads each current heading and every default bend uses the current wrist/posture.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One plan closure owns private fixed geometry and calls the same oriented/target owners as the cold path; HumanHand/Bend keep their original formulas.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Captures original option values without modifying defaults, retains ALONG and actual Bend.solve/preset fallback, and never caches a bend, distance, target point or fit answer.
   * @evidence contracts/development/implementation.md#efficient-algorithms Explicit-forward consumers align once and rotate their local wrist offset at most once; absent-forward consumers still align per current heading. Every numerical bend retains its original bounded cost, with no measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed body surface/shape, normal and explicit forward prove geometric equivalence for this plan; options and offset/rotation snapshots are private, and changed body/geometry requires another preparation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns one body reference and constant-size private option/offset/rotation data until release; returned rotations are fresh copies and points are borrowed as before, without a query/result history or external handle.
   */
  export function prepare(
    body: IHumanBody,
    side: HumanHand.Side,
    placeNormal: IAutoMovieVector3,
    options: AutoMovieMotionHumanTarget.IHand = {},
  ): (posture: IPosture, point: IAutoMovieVector3) => AutoMovieMotionHumanArm.ITarget {
    const fixed: AutoMovieMotionHumanTarget.IHand = structuredClone(options);
    const inputNormal: IAutoMovieVector3 = { ...placeNormal };
    const surface: HumanHand.Surface = fixed.surface ?? "palm";
    const shape: HumanHand.Shape = fixed.shape ?? "relaxed";
    let normal: IAutoMovieVector3 | undefined;
    let local: HumanHand.IFrame | undefined;
    let rotation: IAutoMovieQuaternion | undefined;
    let shift: IAutoMovieVector3 | undefined;
    const offset: () => HumanHand.IFrame = (): HumanHand.IFrame =>
      (local ??= structuredClone(HumanHand.offset(body, side, surface, shape)));
    return (posture: IPosture, point: IAutoMovieVector3): AutoMovieMotionHumanArm.ITarget => {
      normal ??= Vector3.scale(Vector3.normalize(inputNormal), -1);
      const aligned: IAutoMovieQuaternion = fixed.forward === undefined
        ? oriented(posture, normal, undefined, offset)
        : (rotation ??= oriented(posture, normal, fixed.forward, offset));
      const current: IAutoMovieQuaternion = { ...aligned };
      return target(body, posture, side, point, fixed, surface, shape, current,
        (): IAutoMovieVector3 => {
          const moved: IAutoMovieVector3 = fixed.forward === undefined
            ? Quaternion.rotateVector(current, offset().point)
            : (shift ??= Quaternion.rotateVector(current, offset().point));
          return Vector3.subtract(point, moved);
        });
    };
  }
}

/** Root and clinical heading information used by the existing bend owners. */
type IPosture = Pick<IHumanPosture, "root" | "yaw"> & Partial<Pick<IHumanPosture, "pitch" | "roll">>;

/** Preserve the original heading/up choice and lazy offset read before alignment. */
function oriented(
  posture: IPosture,
  normal: IAutoMovieVector3,
  explicit: IAutoMovieVector3 | undefined,
  offset: () => HumanHand.IFrame,
): IAutoMovieQuaternion {
  const heading: IAutoMovieVector3 = HumanFrame.point(
    { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
    { x: 0, y: 0, z: 1 },
  );
  const forward: IAutoMovieVector3 = explicit ??
    (Math.abs(Vector3.dot(heading, normal)) < ALONG ? heading : { x: 0, y: 1, z: 0 });
  return HumanHand.align(offset(), { normal, forward });
}

/** Assemble the target while evaluating only the bend branch the caller requested. */
function target(
  body: IHumanBody,
  posture: IPosture,
  side: HumanHand.Side,
  point: IAutoMovieVector3,
  options: AutoMovieMotionHumanTarget.IHand,
  surface: HumanHand.Surface,
  shape: HumanHand.Shape,
  rotation: IAutoMovieQuaternion,
  wrist: () => IAutoMovieVector3,
): AutoMovieMotionHumanArm.ITarget {
  return {
    surface,
    shape,
    point,
    rotation,
    bend: options.bend === undefined && options.out === undefined
      ? AutoMovieMotionHumanBend.solve({ body, posture, side, point: wrist(), rotation, fallback: "hang" })
      : AutoMovieMotionHumanBend.arm(body, posture, side, options.bend, options.out ?? 0),
    ...(options.curl === undefined ? {} : { curl: options.curl }),
  };
}

/** The original cosine beyond which the current heading counts as along the normal. */
const ALONG: number = 0.9;
