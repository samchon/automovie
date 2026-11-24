import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTarget,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import type { AutoMovieMotionHumanBendRepeat } from "../compose/AutoMovieMotionHumanBendRepeat";
import { HumanFrame } from "./HumanFrame";
import { HumanHand } from "./HumanHand";
import { assembleHumanHandTarget } from "./assembleHumanHandTarget";
import { placeHumanHandSurface } from "./placeHumanHandSurface";

/** The alternatives of `HumanHandTargetPlace`'s site. */
type HumanHandTargetPlace = "point" | "normal";

/**
 * Build the original surface-on-place hand target with one orientation and one
 * actual bend decision; the prepared companion shares fixed geometry.
 */
export function HumanHandTarget(
  body: IAutoMovieMotionHumanBody,
  posture: IPosture,
  side: AutoMovieHumanSide,
  place: Pick<IAutoMovieMotionHumanTarget.IPlace, HumanHandTargetPlace>,
  options: IAutoMovieMotionHumanTarget.IHand,
): IAutoMovieMotionHumanArmTarget.ITarget {
  const surface: IAutoMovieMotionHumanHand.Surface = options.surface ?? "palm";
  const shape: IAutoMovieMotionHumanHand.Shape = options.shape ?? "relaxed";
  const normal: IAutoMovieVector3 = Vector3.scale(
    Vector3.normalize(place.normal),
    -1,
  );
  const rotation: IAutoMovieQuaternion = oriented(
    posture,
    normal,
    options.forward,
    (): IAutoMovieMotionHumanHand.IFrame =>
      HumanHand.offset(body, side, surface, shape),
  );
  return assembleHumanHandTarget(
    body,
    posture,
    side,
    place.point,
    options,
    surface,
    shape,
    rotation,
    (): IAutoMovieVector3 =>
      HumanHand.place(body, side, surface, place.point, rotation, shape).point,
  );
}

/** Fixed hand-surface geometry for a plan's repeated changing-posture targets. */
export namespace HumanHandTarget {
  /**
   * Prepare fixed side/surface/shape/normal/options for one unchanged body.
   * First use prepares geometry, while each requested point and posture still
   * receives its actual preset or numerical bend decision.
   *
   * States fixed versus varying dependencies, lazy first use and fresh rotation
   * output. Surface offset and explicit-forward alignment are independent of
   * the target point and trunk posture; their rotated offset translates
   * rigidly, while an absent forward still reads each current heading and every
   * default bend uses the current wrist/posture. One plan closure owns private
   * fixed geometry and calls the same oriented/target owners as the cold path;
   * HumanHand/Bend keep their original formulas. Captures original option
   * values without modifying defaults, retains ALONG and actual
   * Bend.solve/preset fallback, and never caches a bend, distance, target point
   * or fit answer. Explicit-forward consumers align once and rotate their local
   * wrist offset at most once; absent-forward consumers still align per current
   * heading. Every numerical bend retains its original bounded cost, with no
   * measured speedup claim. Fixed body surface/shape, normal and explicit
   * forward prove geometric equivalence for this plan; options and
   * offset/rotation snapshots are private, and changed body/geometry requires
   * another preparation. The plan owns one body reference and constant-size
   * private option/offset/rotation data until release; returned rotations are
   * fresh copies and points are borrowed as before, without a query/result
   * history or external handle.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    placeNormal: IAutoMovieVector3,
    options: IAutoMovieMotionHumanTarget.IHand = {},
  ): (
    posture: IPosture,
    point: IAutoMovieVector3,
  ) => IAutoMovieMotionHumanArmTarget.ITarget {
    const fixed: IAutoMovieMotionHumanTarget.IHand = structuredClone(options);
    const frame: ReturnType<typeof prepareFrame> = prepareFrame(
      body,
      side,
      placeNormal,
      fixed,
    );
    const emit: ITargetEmitter = targetEmitter(
      body,
      side,
      fixed.surface ?? "palm",
      fixed.shape ?? "relaxed",
    );
    return (
      posture: IPosture,
      point: IAutoMovieVector3,
    ): IAutoMovieMotionHumanArmTarget.ITarget => {
      const current: ReturnType<ReturnType<typeof prepareFrame>> =
        frame(posture);
      return assembleHumanHandTarget(
        body,
        posture,
        side,
        point,
        fixed,
        current.surface,
        current.shape,
        current.rotation,
        (): IAutoMovieVector3 => current.place(point).point,
        emit,
      );
    };
  }
  /** The record of `IHumanHandTargetPrepareFrameResult`'s site. */
  type IHumanHandTargetPrepareFrameResult = {
    surface: IAutoMovieMotionHumanHand.Surface;
    shape: IAutoMovieMotionHumanHand.Shape;
    rotation: IAutoMovieQuaternion;
    place: (point: IAutoMovieVector3) => IAutoMovieMotionHumanHand.IWrist;
  };

  /** The alternatives of `HumanHandTargetPrepareFrameOptions`'s site. */
  type HumanHandTargetPrepareFrameOptions = "surface" | "shape" | "forward";

  /**
   * Prepare only the existing hand orientation and lazy wrist placement. Body
   * geometry, side, normal and options stay unchanged; a frame reads its
   * current heading when forward is absent and returns fresh rotation data plus
   * a placer of actual world-metre surface points. No bend is requested, so
   * callers that supply their own actual elbow search do not compute a
   * discarded default solve. Full prepare consumes this same geometry and
   * retains its original bend/preset and lazy wrist admission. Fixed
   * explicit-forward alignment/shift are calculated once at actual use;
   * changing-heading frames align anew. Only constant geometry and body
   * metadata are retained, with no pose/point/result/time history.
   */
  export function prepareFrame(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    placeNormal: IAutoMovieVector3,
    options: Pick<
      IAutoMovieMotionHumanTarget.IHand,
      HumanHandTargetPrepareFrameOptions
    > = {},
  ): (posture: IPosture) => IHumanHandTargetPrepareFrameResult {
    const fixed: typeof options = structuredClone(options);
    const inputNormal: IAutoMovieVector3 = { ...placeNormal };
    const surface: IAutoMovieMotionHumanHand.Surface = fixed.surface ?? "palm";
    const shape: IAutoMovieMotionHumanHand.Shape = fixed.shape ?? "relaxed";
    let normal: IAutoMovieVector3 | undefined;
    let local: IAutoMovieMotionHumanHand.IFrame | undefined;
    let rotation: IAutoMovieQuaternion | undefined;
    let placement:
      | ((point: IAutoMovieVector3) => IAutoMovieMotionHumanHand.IWrist)
      | undefined;
    const offset: () => IAutoMovieMotionHumanHand.IFrame =
      (): IAutoMovieMotionHumanHand.IFrame =>
        (local ??= structuredClone(
          HumanHand.offset(body, side, surface, shape),
        ));
    const align: ReturnType<typeof HumanHand.prepareAlignment> =
      fixedAlignment(offset);
    return (posture: IPosture): ReturnType<ReturnType<typeof prepareFrame>> => {
      normal ??= Vector3.scale(Vector3.normalize(inputNormal), -1);
      const aligned: IAutoMovieQuaternion =
        fixed.forward === undefined
          ? oriented(posture, normal, undefined, offset, align)
          : (rotation ??= oriented(
              posture,
              normal,
              fixed.forward,
              offset,
              align,
            ));
      const current: IAutoMovieQuaternion = { ...aligned };
      return {
        surface,
        shape,
        rotation: current,
        place: (point: IAutoMovieVector3): IAutoMovieMotionHumanHand.IWrist => {
          return fixed.forward === undefined
            ? placeHumanHandSurface(offset().point, point, { ...aligned })
            : (placement ??= placeHumanHandSurface.prepare(
                offset().point,
                aligned,
              ))(point);
        },
      };
    };
  }
  /** The alternatives of `HumanHandTargetPrepareMovingPlace2`'s site. */
  type HumanHandTargetPrepareMovingPlace2 = "point" | "normal";

  /** The alternatives of `HumanHandTargetPrepareMovingTrial`'s site. */
  type HumanHandTargetPrepareMovingTrial = 0 | 1;

  /** The alternatives of `HumanHandTargetPrepareMovingPlace`'s site. */
  type HumanHandTargetPrepareMovingPlace = "point" | "normal";

  /** The record of `IHumanHandTargetPrepareMovingResult`'s site. */
  type IHumanHandTargetPrepareMovingResult = {
    frame: (
      posture: IPosture,
      normal: IAutoMovieVector3,
      forward?: IAutoMovieVector3,
    ) => IHumanHandTargetPrepareMovingFrameResult;
    target: (
      posture: IPosture,
      place: Pick<
        IAutoMovieMotionHumanTarget.IPlace,
        HumanHandTargetPrepareMovingTargetPlaceResult
      >,
      forward?: IAutoMovieVector3,
      trial?: readonly [
        AutoMovieMotionHumanBendRepeat.IRead,
        HumanHandTargetPrepareMovingTargetTrialResult,
      ],
    ) => IAutoMovieMotionHumanArmTarget.ITarget;
    wrist: (
      posture: IPosture,
      place: Pick<
        IAutoMovieMotionHumanTarget.IPlace,
        HumanHandTargetPrepareMovingWristPlaceResult
      >,
      forward?: IAutoMovieVector3,
    ) => IAutoMovieMotionHumanHand.IWrist;
  };

  /** The alternatives of `HumanHandTargetPrepareMovingWristPlaceResult`'s site. */
  type HumanHandTargetPrepareMovingWristPlaceResult = "point" | "normal";

  /** The alternatives of `HumanHandTargetPrepareMovingTargetTrialResult`'s site. */
  type HumanHandTargetPrepareMovingTargetTrialResult = 0 | 1;

  /** The alternatives of `HumanHandTargetPrepareMovingTargetPlaceResult`'s site. */
  type HumanHandTargetPrepareMovingTargetPlaceResult = "point" | "normal";

  /** The record of `IHumanHandTargetPrepareMovingFrameResult`'s site. */
  type IHumanHandTargetPrepareMovingFrameResult = {
    rotation: IAutoMovieQuaternion;
    place: (point: IAutoMovieVector3) => IAutoMovieMotionHumanHand.IWrist;
  };

  /**
   * Prepare one fixed surface for changing world places and headings. The
   * target reader retains the original actual preset/default Bend and lazy
   * wrist admission; the wrist reader computes only actual alignment and rigid
   * placement for a reach observation that never consumes Bend. Both share one
   * lazily copied body-local surface and rest alignment; the frame reader
   * exposes their actual rotation and lazy placement for catch ranks that
   * correct a glove pocket before placing the wrist. Every query evaluates its
   * current normal, explicit/default forward, world point and posture, without
   * retaining a target or solved result. Returned wrist points/rotations are
   * fresh, while target points remain borrowed as before; the owner releases
   * fixed geometry with its plan.
   */
  export function prepareMoving(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    options: IAutoMovieMotionHumanTarget.IHand = {},
  ): IHumanHandTargetPrepareMovingResult {
    const fixed: IAutoMovieMotionHumanTarget.IHand = structuredClone(options);
    const surface: IAutoMovieMotionHumanHand.Surface = fixed.surface ?? "palm";
    const shape: IAutoMovieMotionHumanHand.Shape = fixed.shape ?? "relaxed";
    let local: IAutoMovieMotionHumanHand.IFrame | undefined;
    const offset: () => IAutoMovieMotionHumanHand.IFrame =
      (): IAutoMovieMotionHumanHand.IFrame =>
        (local ??= structuredClone(
          HumanHand.offset(body, side, surface, shape),
        ));
    const align: ReturnType<typeof HumanHand.prepareAlignment> =
      fixedAlignment(offset);
    const emit: ITargetEmitter = targetEmitter(body, side, surface, shape);
    const frame: ReturnType<typeof prepareMoving>["frame"] = (
      posture: IPosture,
      normal: IAutoMovieVector3,
      forward?: IAutoMovieVector3,
    ): ReturnType<ReturnType<typeof prepareMoving>["frame"]> => {
      const rotation: IAutoMovieQuaternion = oriented(
        posture,
        Vector3.scale(Vector3.normalize(normal), -1),
        forward ?? fixed.forward,
        offset,
        align,
      );
      return {
        rotation,
        place: (point: IAutoMovieVector3): IAutoMovieMotionHumanHand.IWrist =>
          placeHumanHandSurface(offset().point, point, rotation),
      };
    };
    return {
      frame,
      target: (
        posture: IPosture,
        place: Pick<
          IAutoMovieMotionHumanTarget.IPlace,
          HumanHandTargetPrepareMovingPlace
        >,
        forward?: IAutoMovieVector3,
        trial?: readonly [
          AutoMovieMotionHumanBendRepeat.IRead,
          HumanHandTargetPrepareMovingTrial,
        ],
      ): IAutoMovieMotionHumanArmTarget.ITarget => {
        const current: ReturnType<typeof frame> = frame(
          posture,
          place.normal,
          forward,
        );
        return assembleHumanHandTarget(
          body,
          posture,
          side,
          place.point,
          fixed,
          surface,
          shape,
          current.rotation,
          (): IAutoMovieVector3 => current.place(place.point).point,
          emit,
          trial,
        );
      },
      wrist: (
        posture: IPosture,
        place: Pick<
          IAutoMovieMotionHumanTarget.IPlace,
          HumanHandTargetPrepareMovingPlace2
        >,
        forward?: IAutoMovieVector3,
      ): IAutoMovieMotionHumanHand.IWrist => {
        return frame(posture, place.normal, forward).place(place.point);
      },
    };
  }
  /** The alternatives of `HumanHandTargetPrepareGoalPlace`'s site. */
  type HumanHandTargetPrepareGoalPlace = "point" | "normal";

  /** The alternatives of `HumanHandTargetPrepareGoalPlaceResult`'s site. */
  type HumanHandTargetPrepareGoalPlaceResult = "point" | "normal";

  /**
   * Prepare fixed body/hand/surface/shape/options for changing world places.
   * Every query reads its actual point, normal, optional forward and current
   * posture; one original alignment and actual bend/preset are evaluated. The
   * same lazy wrist feeds default Bend and the final shared goal assembler,
   * retaining preset-before-placement admission. No changing target or fitted
   * answer is reused. Only fixed hand geometry/options survive across requests;
   * mutable goal contact payloads are fresh and the per-query wrist reader
   * never escapes in the returned goal.
   */
  export function prepareGoal(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    options: Omit<IAutoMovieMotionHumanTarget.IHand, "curl"> = {},
  ): (
    posture: IPosture,
    place: Pick<
      IAutoMovieMotionHumanTarget.IPlace,
      HumanHandTargetPrepareGoalPlaceResult
    >,
    forward?: IAutoMovieVector3,
  ) => IAutoMovieHumanLimbGoal {
    const fixed: IAutoMovieMotionHumanTarget.IHand = structuredClone(options);
    const surface: IAutoMovieMotionHumanHand.Surface = fixed.surface ?? "palm";
    const shape: IAutoMovieMotionHumanHand.Shape = fixed.shape ?? "relaxed";
    let local: IAutoMovieMotionHumanHand.IFrame | undefined;
    const offset: () => IAutoMovieMotionHumanHand.IFrame =
      (): IAutoMovieMotionHumanHand.IFrame =>
        (local ??= structuredClone(
          HumanHand.offset(body, side, surface, shape),
        ));
    const align: ReturnType<typeof HumanHand.prepareAlignment> =
      fixedAlignment(offset);
    return (
      posture: IPosture,
      place: Pick<
        IAutoMovieMotionHumanTarget.IPlace,
        HumanHandTargetPrepareGoalPlace
      >,
      forward?: IAutoMovieVector3,
    ): IAutoMovieHumanLimbGoal => {
      const normal: IAutoMovieVector3 = Vector3.scale(
        Vector3.normalize(place.normal),
        -1,
      );
      const rotation: IAutoMovieQuaternion = oriented(
        posture,
        normal,
        forward ?? fixed.forward,
        offset,
        align,
      );
      let placed: IAutoMovieMotionHumanHand.IWrist | undefined;
      const wrist: () => IAutoMovieMotionHumanHand.IWrist =
        (): IAutoMovieMotionHumanHand.IWrist => {
          placed ??= placeHumanHandSurface(
            offset().point,
            place.point,
            rotation,
          );
          return placed;
        };
      const current: IAutoMovieMotionHumanArmTarget.ITarget =
        assembleHumanHandTarget(
          body,
          posture,
          side,
          place.point,
          fixed,
          surface,
          shape,
          rotation,
          (): IAutoMovieVector3 => wrist().point,
        );
      return AutoMovieMotionHumanArmTarget.fromWrist(wrist(), current.bend, {
        ...offset().point,
      });
    };
  }
}
/** The alternatives of `PostureItem`'s site. */
type PostureItem = "pitch" | "roll";

/** The alternatives of `Posture`'s site. */
type Posture = "root" | "yaw";

/** Root and clinical heading information used by the existing bend owners. */
type IPosture = Pick<IAutoMovieMotionHumanPosture, Posture> &
  Partial<Pick<IAutoMovieMotionHumanPosture, PostureItem>>;

/**
 * Preserve the original heading/up choice and lazy offset read before
 * alignment.
 */
function oriented(
  posture: IPosture,
  normal: IAutoMovieVector3,
  explicit: IAutoMovieVector3 | undefined,
  offset: () => IAutoMovieMotionHumanHand.IFrame,
  align?: ReturnType<typeof HumanHand.prepareAlignment>,
): IAutoMovieQuaternion {
  let forward: IAutoMovieVector3;
  if (explicit !== undefined) forward = explicit;
  else {
    const heading: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
      { x: 0, y: 0, z: 1 },
    );
    forward =
      Math.abs(Vector3.dot(heading, normal)) < ALONG
        ? heading
        : { x: 0, y: 1, z: 0 };
  }
  return align === undefined
    ? HumanHand.align(offset(), { normal, forward })
    : align({ normal, forward });
}

/**
 * Delay fixed-rest preparation until the first actual world's original
 * alignment admission.
 */
function fixedAlignment(
  offset: () => IAutoMovieMotionHumanHand.IFrame,
): ReturnType<typeof HumanHand.prepareAlignment> {
  let align: ReturnType<typeof HumanHand.prepareAlignment> | undefined;
  return (
    world: Parameters<ReturnType<typeof HumanHand.prepareAlignment>>[0],
  ): IAutoMovieQuaternion => {
    align ??= HumanHand.prepareAlignment(offset());
    return align(world);
  };
}

/**
 * Existing raw-row producer, retaining only genuine fixed local-surface
 * geometry.
 */
type ITargetEmitter = ReturnType<
  typeof AutoMovieMotionHumanArmTarget.prepareTarget
>;

/** Acquire fixed surface issuance only after an actual complete target is built. */
function targetEmitter(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  surface: IAutoMovieMotionHumanHand.Surface,
  shape: IAutoMovieMotionHumanHand.Shape,
): ITargetEmitter {
  let emit: ITargetEmitter | undefined;
  return (
    placement: Parameters<ITargetEmitter>[0],
  ): IAutoMovieMotionHumanArmTarget.ITarget => {
    emit ??= AutoMovieMotionHumanArmTarget.prepareTarget(
      body,
      side,
      surface,
      shape,
    );
    return emit(placement);
  };
}

/**
 * The original cosine beyond which the current heading counts as along the
 * normal.
 */
const ALONG: number = 0.9;
