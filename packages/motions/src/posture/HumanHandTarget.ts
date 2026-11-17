import { Vector3 } from "@automovie/engine";
import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import type { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { HumanFrame } from "./HumanFrame";
import { HumanHand } from "./HumanHand";
import { placeHumanHandSurface } from "./placeHumanHandSurface";
import type { IHumanPosture } from "./IHumanPosture";

/**
 * Build the original surface-on-place hand target with one orientation and
 * one actual bend decision; the prepared companion shares fixed geometry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines surface alignment, current-posture bend solving and fixed geometry preparation. prepareFrame returns orientation/lazy wrist placement without a bend; prepare adds its original bend. prepareMoving serves changing-frame, full-target and wrist-only consumers from one fixed surface; prepareGoal returns the original complete arm goal.
 * @evidence contracts/development/implementation.md#principled-implementation Aligns the surface normal opposite the normalized place normal, chooses the original explicit/heading/up forward, then keeps the original default strain search or stated bend preset.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure oriented and target serve cold, fixed-frame and dynamic-goal consumers. Fixed full-target readers lazily use ArmTarget.prepareTarget's genuine surface metadata; placeHumanHandSurface owns wrist arithmetic and fromWrist owns final goal assembly.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves ALONG, surface/shape/curl defaults, actual body-owned offsets and fallback semantics; every current default bend runs its original numerical search. Issuance carries only fixed local geometry, never an achieved pose or solver answer.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed readers share actual rest/surface geometry while each world alignment and full-target Bend remains actual; wrist-only consumers omit discarded bends. Fixed full targets bind one genuine local-offset reader for native arm goal assembly rather than two hand lookups per frame, paying fresh placement/row wrappers. Placed goals share one wrist between Bend and goal. Speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed body/options/surface geometry establish preparation equivalence; full targets receive only ArmTarget's existing private fixed-domain issuance, whose native goal consumer checks body/side/surface/shape. Cold targets stay live, every current point/heading/bend remains actual and changed fixed geometry requires another producer.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Cold calls retain nothing; the plan owns fixed body/options/offset/alignment and lazy emitter metadata until release. Issued raw rows weakly retain only ArmTarget's fixed surface metadata while those rows live; current rotations are fresh and points remain borrowed, without an operation FK reader, query/time/pose history or external handle.
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
   * States fixed versus varying dependencies, lazy first use and fresh rotation output.
   * Surface offset and explicit-forward alignment are independent of the target point and trunk posture; their rotated offset translates rigidly, while an absent forward still reads each current heading and every default bend uses the current wrist/posture.
   * One plan closure owns private fixed geometry and calls the same oriented/target owners as the cold path; HumanHand/Bend keep their original formulas.
   * Captures original option values without modifying defaults, retains ALONG and actual Bend.solve/preset fallback, and never caches a bend, distance, target point or fit answer.
   * Explicit-forward consumers align once and rotate their local wrist offset at most once; absent-forward consumers still align per current heading. Every numerical bend retains its original bounded cost, with no measured speedup claim.
   * Fixed body surface/shape, normal and explicit forward prove geometric equivalence for this plan; options and offset/rotation snapshots are private, and changed body/geometry requires another preparation.
   * The plan owns one body reference and constant-size private option/offset/rotation data until release; returned rotations are fresh copies and points are borrowed as before, without a query/result history or external handle.
   */
  export function prepare(
    body: IHumanBody,
    side: HumanHand.Side,
    placeNormal: IAutoMovieVector3,
    options: AutoMovieMotionHumanTarget.IHand = {},
  ): (posture: IPosture, point: IAutoMovieVector3) => AutoMovieMotionHumanArm.ITarget {
    const fixed: AutoMovieMotionHumanTarget.IHand = structuredClone(options);
    const frame: ReturnType<typeof prepareFrame> = prepareFrame(body, side, placeNormal, fixed);
    const emit: ITargetEmitter = targetEmitter(body, side, fixed.surface ?? "palm", fixed.shape ?? "relaxed");
    return (posture: IPosture, point: IAutoMovieVector3): AutoMovieMotionHumanArm.ITarget => {
      const current: ReturnType<ReturnType<typeof prepareFrame>> = frame(posture);
      return target(body, posture, side, point, fixed, current.surface, current.shape, current.rotation,
        (): IAutoMovieVector3 => current.place(point).point, emit);
    };
  }

  /**
   * Prepare only the existing hand orientation and lazy wrist placement.
   * Body geometry, side, normal and options stay unchanged; a frame reads
   * its current heading when forward is absent and returns fresh rotation
   * data plus a placer of actual world-metre surface points. No bend is
   * requested, so callers that supply their own actual elbow search do not
   * compute a discarded default solve. Full prepare consumes this same
   * geometry and retains its original bend/preset and lazy wrist admission.
   * Fixed explicit-forward alignment/shift are calculated once at actual
   * use; changing-heading frames align anew. Only constant geometry and
   * body metadata are retained, with no pose/point/result/time history.
   */
  export function prepareFrame(
    body: IHumanBody,
    side: HumanHand.Side,
    placeNormal: IAutoMovieVector3,
    options: Pick<AutoMovieMotionHumanTarget.IHand, "surface" | "shape" | "forward"> = {},
  ): (posture: IPosture) => {
    surface: HumanHand.Surface;
    shape: HumanHand.Shape;
    rotation: IAutoMovieQuaternion;
    place: (point: IAutoMovieVector3) => HumanHand.IWrist;
  } {
    const fixed: typeof options = structuredClone(options);
    const inputNormal: IAutoMovieVector3 = { ...placeNormal };
    const surface: HumanHand.Surface = fixed.surface ?? "palm";
    const shape: HumanHand.Shape = fixed.shape ?? "relaxed";
    let normal: IAutoMovieVector3 | undefined;
    let local: HumanHand.IFrame | undefined;
    let rotation: IAutoMovieQuaternion | undefined;
    let placement: ((point: IAutoMovieVector3) => HumanHand.IWrist) | undefined;
    const offset: () => HumanHand.IFrame = (): HumanHand.IFrame =>
      (local ??= structuredClone(HumanHand.offset(body, side, surface, shape)));
    const align: ReturnType<typeof HumanHand.prepareAlignment> = fixedAlignment(offset);
    return (posture: IPosture): ReturnType<ReturnType<typeof prepareFrame>> => {
      normal ??= Vector3.scale(Vector3.normalize(inputNormal), -1);
      const aligned: IAutoMovieQuaternion = fixed.forward === undefined
        ? oriented(posture, normal, undefined, offset, align)
        : (rotation ??= oriented(posture, normal, fixed.forward, offset, align));
      const current: IAutoMovieQuaternion = { ...aligned };
      return { surface, shape, rotation: current,
        place: (point: IAutoMovieVector3): HumanHand.IWrist => {
          return (fixed.forward === undefined
            ? placeHumanHandSurface(offset().point, point, { ...aligned })
            : (placement ??= placeHumanHandSurface.prepare(offset().point, aligned))(point));
        } };
    };
  }

  /**
   * Prepare one fixed surface for changing world places and headings.
   * The target reader retains the original actual preset/default Bend and
   * lazy wrist admission; the wrist reader computes only actual alignment
   * and rigid placement for a reach observation that never consumes Bend.
   * Both share one lazily copied body-local surface and rest alignment;
   * the frame reader exposes their actual rotation and lazy placement for
   * catch ranks that correct a glove pocket before placing the wrist.
   * Every query evaluates its current normal, explicit/default forward,
   * world point and posture, without retaining a target or solved result.
   * Returned wrist points/rotations are fresh, while target points remain
   * borrowed as before; the owner releases fixed geometry with its plan.
   */
  export function prepareMoving(body: IHumanBody, side: HumanHand.Side,
    options: AutoMovieMotionHumanTarget.IHand = {}): {
    frame: (posture: IPosture, normal: IAutoMovieVector3, forward?: IAutoMovieVector3) => {
      rotation: IAutoMovieQuaternion; place: (point: IAutoMovieVector3) => HumanHand.IWrist;
    };
    target: (posture: IPosture, place: Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
      forward?: IAutoMovieVector3) => AutoMovieMotionHumanArm.ITarget;
    wrist: (posture: IPosture, place: Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
      forward?: IAutoMovieVector3) => HumanHand.IWrist;
  } {
    const fixed: AutoMovieMotionHumanTarget.IHand = structuredClone(options);
    const surface: HumanHand.Surface = fixed.surface ?? "palm";
    const shape: HumanHand.Shape = fixed.shape ?? "relaxed";
    let local: HumanHand.IFrame | undefined;
    const offset: () => HumanHand.IFrame = (): HumanHand.IFrame =>
      (local ??= structuredClone(HumanHand.offset(body, side, surface, shape)));
    const align: ReturnType<typeof HumanHand.prepareAlignment> = fixedAlignment(offset);
    const emit: ITargetEmitter = targetEmitter(body, side, surface, shape);
    const frame: ReturnType<typeof prepareMoving>["frame"] = (posture: IPosture,
      normal: IAutoMovieVector3, forward?: IAutoMovieVector3): ReturnType<ReturnType<typeof prepareMoving>["frame"]> => {
      const rotation: IAutoMovieQuaternion = oriented(posture, Vector3.scale(Vector3.normalize(normal), -1),
        forward ?? fixed.forward, offset, align);
      return { rotation, place: (point: IAutoMovieVector3): HumanHand.IWrist =>
        placeHumanHandSurface(offset().point, point, rotation) };
    };
    return {
      frame,
      target: (posture: IPosture, place: Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
        forward?: IAutoMovieVector3): AutoMovieMotionHumanArm.ITarget => {
        const current: ReturnType<typeof frame> = frame(posture, place.normal, forward);
        return target(body, posture, side, place.point, fixed, surface, shape, current.rotation,
          (): IAutoMovieVector3 => current.place(place.point).point, emit);
      },
      wrist: (posture: IPosture, place: Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
        forward?: IAutoMovieVector3): HumanHand.IWrist => {
        return frame(posture, place.normal, forward).place(place.point);
      },
    };
  }

  /**
   * Prepare fixed body/hand/surface/shape/options for changing world places.
   * Every query reads its actual point, normal, optional forward and current
   * posture; one original alignment and actual bend/preset are evaluated.
   * The same lazy wrist feeds default Bend and the final shared goal
   * assembler, retaining preset-before-placement admission. No changing
   * target or fitted answer is reused. Only fixed hand geometry/options
   * survive across requests; mutable goal contact payloads are fresh and
   * the per-query wrist reader never escapes in the returned goal.
   */
  export function prepareGoal(
    body: IHumanBody,
    side: HumanHand.Side,
    options: Omit<AutoMovieMotionHumanTarget.IHand, "curl"> = {},
  ): (posture: IPosture, place: Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
    forward?: IAutoMovieVector3) => IHumanPosture.IGoal {
    const fixed: AutoMovieMotionHumanTarget.IHand = structuredClone(options);
    const surface: HumanHand.Surface = fixed.surface ?? "palm";
    const shape: HumanHand.Shape = fixed.shape ?? "relaxed";
    let local: HumanHand.IFrame | undefined;
    const offset: () => HumanHand.IFrame = (): HumanHand.IFrame =>
      (local ??= structuredClone(HumanHand.offset(body, side, surface, shape)));
    const align: ReturnType<typeof HumanHand.prepareAlignment> = fixedAlignment(offset);
    return (posture: IPosture, place: Pick<AutoMovieMotionHumanTarget.IPlace, "point" | "normal">,
      forward?: IAutoMovieVector3): IHumanPosture.IGoal => {
      const normal: IAutoMovieVector3 = Vector3.scale(Vector3.normalize(place.normal), -1);
      const rotation: IAutoMovieQuaternion = oriented(posture, normal, forward ?? fixed.forward, offset, align);
      let placed: HumanHand.IWrist | undefined;
      const wrist: () => HumanHand.IWrist = (): HumanHand.IWrist => {
        placed ??= placeHumanHandSurface(offset().point, place.point, rotation);
        return placed;
      };
      const current: AutoMovieMotionHumanArm.ITarget = target(body, posture, side,
        place.point, fixed, surface, shape, rotation, (): IAutoMovieVector3 => wrist().point);
      return AutoMovieMotionHumanArmTarget.fromWrist(wrist(), current.bend, { ...offset().point });
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
  align?: ReturnType<typeof HumanHand.prepareAlignment>,
): IAutoMovieQuaternion {
  let forward: IAutoMovieVector3;
  if (explicit !== undefined) forward = explicit;
  else {
    const heading: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
      { x: 0, y: 0, z: 1 },
    );
    forward = Math.abs(Vector3.dot(heading, normal)) < ALONG ? heading : { x: 0, y: 1, z: 0 };
  }
  return align === undefined ? HumanHand.align(offset(), { normal, forward }) : align({ normal, forward });
}

/** Delay fixed-rest preparation until the first actual world's original alignment admission. */
function fixedAlignment(offset: () => HumanHand.IFrame): ReturnType<typeof HumanHand.prepareAlignment> {
  let align: ReturnType<typeof HumanHand.prepareAlignment> | undefined;
  return (world: Parameters<ReturnType<typeof HumanHand.prepareAlignment>>[0]): IAutoMovieQuaternion => {
    align ??= HumanHand.prepareAlignment(offset());
    return align(world);
  };
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
  emit?: ITargetEmitter,
): AutoMovieMotionHumanArm.ITarget {
  const bend: IAutoMovieVector3 = options.bend === undefined && options.out === undefined
    ? AutoMovieMotionHumanBend.solve({ body, posture, side, point: wrist(), rotation, fallback: "hang" })
    : AutoMovieMotionHumanBend.arm(body, posture, side, options.bend, options.out ?? 0);
  if (emit !== undefined)
    return emit({ point, rotation, bend, ...(options.curl === undefined ? {} : { curl: options.curl }) });
  return {
    surface,
    shape,
    point,
    rotation,
    bend,
    ...(options.curl === undefined ? {} : { curl: options.curl }),
  };
}

/** Existing raw-row producer, retaining only genuine fixed local-surface geometry. */
type ITargetEmitter = ReturnType<typeof AutoMovieMotionHumanArmTarget.prepareTarget>;

/** Acquire fixed surface issuance only after an actual complete target is built. */
function targetEmitter(body: IHumanBody, side: HumanHand.Side,
  surface: HumanHand.Surface, shape: HumanHand.Shape): ITargetEmitter {
  let emit: ITargetEmitter | undefined;
  return (placement: Parameters<ITargetEmitter>[0]): AutoMovieMotionHumanArm.ITarget => {
    emit ??= AutoMovieMotionHumanArmTarget.prepareTarget(body, side, surface, shape);
    return emit(placement);
  };
}

/** The original cosine beyond which the current heading counts as along the normal. */
const ALONG: number = 0.9;
