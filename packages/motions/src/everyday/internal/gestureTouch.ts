import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGestureStroke,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTouchEffector } from "../../compose/internal/AutoMovieMotionHumanTouchEffector";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { HumanTrunk } from "./HumanTrunk";
import { gestureSignal } from "./gestureSignal";
import type { gestureStroke } from "./gestureStroke";

/**
 * The hand goals of a gesture that need the posed trunk: pointing along the
 * eye's line and touching the body's own face.
 *
 * - `point`: the index fingertip on the line from the eye on the pointing side to
 *   the target, as people point (Henriques and Crawford 2002, J Neurophysiol
 *   87:1677, found the fingertip placed on the line from the dominant eye; the
 *   side's eye is the provisional choice), at the distance where the arm
 *   reaches with `0.95` of its length (`POINT_REACH`), the fingers along the
 *   line and the palm down.
 * - `touchFace`: the index fingertip, hand flat, on a face region with the palm
 *   toward the face and the fingers up, held, the elbow out by 0.15 of the
 *   upper arm; `pushGlasses` slides it 12 mm up the nose bridge; `scratchHead`
 *   rubs it 15 mm on the head's side four times a second (provisional).
 */
export namespace gestureTouch {
  /**
   * Prepare one plan's fixed self-touch padding or pointing arm/digit reach.
   *
   * @param body The body supplying rig, measure and contact geometry.
   * @param side The moving hand.
   * @param kind The gesture kind.
   * @param touched The face region a `touchFace` touches.
   * @returns The plan's touch geometry for pointing or self-touch, or undefined
   *   for other kinds: a pointing hand's reach and bone reader, or a touching
   *   hand's padding and region reader, all built here.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    kind: IAutoMovieMotionHumanGestureStroke.Kind,
    touched: AutoMovieHumanoidRegion,
  ): IPrepared | undefined {
    if (kind === "point")
      return {
        body,
        side,
        kind,
        reach: pointingReach(body, side),
        point: HumanTrunk.prepareResolve(body, POINT_FRAMES[side]),
      };
    if (
      kind !== "touchFace" &&
      kind !== "pushGlasses" &&
      kind !== "scratchHead"
    )
      return undefined;
    const name: AutoMovieHumanoidRegion = regionOf(kind, side, touched);
    return {
      body,
      side,
      kind,
      padding: padding(body, side),
      region: { name, read: HumanTrunk.prepareRegion(body, name) },
    };
  }

  /**
   * A plan's touch geometry for one hand: the body, side and kind it was built
   * for, and what was computed for them.
   */
  export interface IPrepared {
    /** The body the geometry is computed for. */
    readonly body: IAutoMovieMotionHumanBody;

    /** The hand. */
    readonly side: AutoMovieHumanSide;

    /** The gesture kind. */
    readonly kind: IAutoMovieMotionHumanGestureStroke.Kind;

    /** The fingertip's landmark-to-skin padding for self-touch, metres. */
    readonly padding?: number;

    /** The pointing reach from the shoulder to the fingertip, metres. */
    readonly reach?: number;

    /** The eye and shoulder reader of a pointing hand. */
    readonly point?: ReturnType<typeof HumanTrunk.prepareResolve>;

    /** The self-touch region's reader. */
    readonly region?: IPreparedRegion;
  }

  /**
   * The pointing goal: the fingertip on the eye-to-target line at the arm's
   * reach.
   *
   * @param input The instant's inputs.
   * @param side The hand.
   * @returns The goal.
   * @throws {Error} Without a target.
   */
  export function point(
    input: gestureStroke.IInput,
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanGestureStroke.IHand {
    const body: IAutoMovieMotionHumanBody = input.body;
    if (input.target === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "target",
        value: undefined,
        reason: "Pointing needs a target",
        fix: "give the point gesture a target",
      });
    const fixed: IPrepared | undefined = preparation(
      input.prepared,
      body,
      side,
      "point",
    );
    const bones: ReturnType<typeof HumanTrunk.resolve> =
      fixed?.point === undefined
        ? HumanTrunk.resolve(
            body,
            input.base,
            undefined,
            input.resolution,
            POINT_FRAMES[side],
          )
        : fixed.point(input.base, input.resolution);
    const eye: IAutoMovieVector3 = bones.get(`${side}Eye`)!.worldPosition;
    const shoulder: IAutoMovieVector3 = bones.get(
      `${side}UpperArm`,
    )!.worldPosition;
    const line: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(input.target, eye),
    );
    const reach: number = fixed?.reach ?? pointingReach(body, side);

    // The point on the line at the reach from the shoulder: |eye + s d - shoulder| = reach.
    const w: IAutoMovieVector3 = Vector3.subtract(eye, shoulder);
    const b: number = Vector3.dot(w, line);
    const c: number = Vector3.dot(w, w) - reach * reach;
    const s: number = -b + Math.sqrt(Math.max(0, b * b - c));
    const distance: number = Math.min(s, Vector3.distance(input.target, eye));
    const palm: IAutoMovieVector3 =
      Math.abs(line.y) > STEEP
        ? HumanFrame.point(
            { origin: { x: 0, y: 0, z: 0 }, yaw: input.base.yaw },
            { x: 0, y: 0, z: -Math.sign(line.y) },
          )
        : { x: 0, y: -1, z: 0 };
    return {
      surface: "indexTip",
      shape: "point",
      point: Vector3.addScaled(eye, line, distance),
      rotation: HumanHand.rotation(side, { fingers: line, palm }),
      out: 0,
    };
  }

  /**
   * A self-touch goal: the fingertip on a face region, palm toward the face,
   * fingers up.
   *
   * @param kind The self-touch gesture.
   * @param input The instant's inputs.
   * @param side The hand.
   * @param u Stroke share in [0, 1].
   * @param cycles Stroke cycles.
   * @returns The goal.
   */
  export function touch(
    kind: TouchKind,
    input: gestureStroke.IInput,
    side: AutoMovieHumanSide,
    u: number,
    cycles: number,
  ): IAutoMovieMotionHumanGestureStroke.IHand {
    const body: IAutoMovieMotionHumanBody = input.body;
    const region: AutoMovieHumanoidRegion = regionOf(kind, side, input.region);
    const fixed: IPrepared | undefined = preparation(
      input.prepared,
      body,
      side,
      kind,
    );
    const surface: HumanTrunk.ISurface =
      fixed?.region === undefined || fixed.region.name !== region
        ? HumanTrunk.region(body, input.base, region, input.resolution)
        : fixed.region.read(input.base, input.resolution);
    const up: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(
        { x: 0, y: 1, z: 0 },
        Vector3.scale(surface.normal, surface.normal.y),
      ),
    );
    const slide: number =
      kind === "pushGlasses"
        ? 0.012 * gestureSignal.rise(u)
        : kind === "scratchHead"
          ? 0.015 * gestureSignal.oscillation(u, cycles)
          : 0;
    const pad: number = fixed?.padding ?? padding(body, side);
    return {
      surface: "indexTip",
      shape: "flat",
      point: Vector3.addScaled(
        Vector3.addScaled(surface.point, surface.normal, pad),
        up,
        slide,
      ),
      rotation: HumanHand.rotation(side, {
        fingers: up,
        palm: Vector3.scale(surface.normal, -1),
      }),
      out: TOUCH_OUT,
    };
  }

  /**
   * Distance from the material fingertip landmark to its own collision surface.
   *
   * @param body The body whose profile defines the fingertip.
   * @param side The touching hand.
   * @returns The landmark-to-skin padding, metres.
   */
  export function padding(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
  ): number {
    return AutoMovieMotionHumanTouchEffector.pad(body, side, {
      surface: "indexTip",
      shape: "flat",
    });
  }
}

/** The alternatives of `TouchKind`'s site. */
type TouchKind = "touchFace" | "pushGlasses" | "scratchHead";

/** The record of `IPreparedRegion`'s site. */
type IPreparedRegion = {
  name: AutoMovieHumanoidRegion;
  read: ReturnType<typeof HumanTrunk.prepareRegion>;
};

/** A pointing hand reads its eye and shoulder, without evaluating other limbs. */
const POINT_FRAMES: Readonly<
  Record<AutoMovieHumanSide, ReadonlySet<AutoMovieHumanoidBone>>
> = {
  left: new Set<AutoMovieHumanoidBone>(["leftEye", "leftUpperArm"]),
  right: new Set<AutoMovieHumanoidBone>(["rightEye", "rightUpperArm"]),
};

/**
 * The pointing reach from the shoulder to the fingertip: `POINT_REACH` of the
 * arm plus the point shape's index-tip offset from the wrist.
 */
function pointingReach(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
): number {
  const tip: number = Vector3.length(
    HumanHand.offset(body, side, "indexTip", "point").point,
  );
  return POINT_REACH * (body.measure.upperArm + body.measure.forearm) + tip;
}

/**
 * The share of the arm (upper arm and forearm) a pointing arm extends to:
 * nearly straight, as people point at a distant target with an almost fully
 * extended arm (Herbort and Kunde 2016, J Exp Psychol Hum Percept Perform
 * 42:78, Exp. 1, Fig. 3); the study gives no extension in numbers, so the share
 * is short of straight only by what keeps the elbow off its end stop.
 */
const POINT_REACH: number = 0.95;

/**
 * The vertical component of a pointing line past which palm down has no meaning
 * and the palm turns back or forward instead (provisional: about 64 degrees
 * from the horizontal).
 */
const STEEP: number = 0.9;

/**
 * The outward elbow hint of a hand touching the face, a share of the upper arm
 * (provisional: read from no measured source).
 */
const TOUCH_OUT: number = 0.15;

/**
 * The face region a self-touch kind touches: the nose bridge for `pushGlasses`,
 * the hand's temple for `scratchHead`, the asked one otherwise.
 */
function regionOf(
  kind: IAutoMovieMotionHumanGestureStroke.Kind,
  side: AutoMovieHumanSide,
  asked: AutoMovieHumanoidRegion,
): AutoMovieHumanoidRegion {
  return kind === "pushGlasses"
    ? "noseBridge"
    : kind === "scratchHead"
      ? side === "left"
        ? "templeLeft"
        : "templeRight"
      : asked;
}

/** A prepared record, when it was built for this body, side and kind. */
function preparation(
  prepared: gestureTouch.IPrepared | undefined,
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  kind: IAutoMovieMotionHumanGestureStroke.Kind,
): gestureTouch.IPrepared | undefined {
  return prepared !== undefined &&
    prepared.body === body &&
    prepared.side === side &&
    prepared.kind === kind
    ? prepared
    : undefined;
}
