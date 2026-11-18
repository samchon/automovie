import { Vector3, physicalHullFaces } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGestureStroke,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { HumanTrunk } from "./HumanTrunk";
import { gestureSignal } from "./gestureSignal";
import type { gestureStroke } from "./gestureStroke";

/**
 * The hand goals of a gesture that need the posed trunk: pointing along the
 * eye's line and touching the body's own face.
 *
 * - `point`: the index fingertip on the line from the eye on the pointing
 *   side to the target, as people point (Henriques and Crawford 2002, J
 *   Neurophysiol 87:1677, found the fingertip placed on the line from the
 *   dominant eye; the side's eye is the provisional choice), at the distance
 *   where the arm reaches with `0.95` of its length (`POINT_REACH`), the
 *   fingers along the line and the palm down.
 * - `touchFace`: the index fingertip, hand flat, on a face region with the
 *   palm toward the face and the fingers up, held, the elbow out by 0.15 of
 *   the upper arm; `pushGlasses` slides it 12 mm up the nose bridge;
 *   `scratchHead` rubs it 15 mm on the head's side four times a second
 *   (provisional).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both goals, the pointing source and the provisional values.
 * @evidence contracts/development/design.md#principled-representation Effector goals as a named hand surface, a world point in metres and a world rotation, read from the trunk's own forward kinematics.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Pointing and self-touch goals serve the stroke dispatcher, with the per-plan record (`IPrepared`) that holds the padding, the reach and the trunk readers a plan shares; a stroke read without one computes them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the stroke's input and goal types and the body's surface regions; contact points do not scale with the extent.
 */
export namespace gestureTouch {
  /**
   * Prepare one plan's fixed self-touch padding or pointing arm/digit reach.
   *
   * @param body The body supplying rig, measure and contact geometry.
   * @param side The moving hand.
   * @param kind The gesture kind.
   * @returns The plan's touch geometry for pointing or self-touch, or undefined for other kinds; a pointing hand's reach and bone readers are built on first use.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the body, side and kind it is bound to, which kinds get one, and what is built at once or on first use.
   * @evidence contracts/development/implementation.md#principled-implementation Self-touch takes its fingertip padding from `padding`; pointing takes its reach from the point shape's index-tip offset plus `POINT_REACH` of the arm, on the first pointing query.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One kind branch builds the record; the touch padding is computed at once and the pointing reach and bone readers when first read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A record is used only by a query on the same body, side and kind; any other falls back to computing its geometry, so a wrong record cannot change a goal.
   * @evidence contracts/development/implementation.md#efficient-algorithms The padding scan and the pointing reach run once per plan instead of once per posture; every posture's target and trunk forward kinematics still run.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The body, side and kind fix the padding, the reach and the bone-name readers, so the plan shares them across its postures; every posture, target and workspace is read afresh.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan holds the record, its scalars and at most one pointing and one region reader until it is released; no posture, frame, goal or history enters it.
   */
  export function prepare(body: IAutoMovieMotionHumanBody, side: AutoMovieHumanSide,
    kind: IAutoMovieMotionHumanGestureStroke.Kind): IPrepared | undefined {
    if (kind !== "point" && kind !== "touchFace" && kind !== "pushGlasses" && kind !== "scratchHead")
      return undefined;
    const prepared: IPrepared = { body, side, kind };
    if (kind !== "point") prepared.padding = padding(body, side);
    return prepared;
  }

  /**
   * A plan's touch geometry for one hand: the body, side and kind it was
   * built for, and what has been computed for them so far.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is bound to and that its optional members fill on first use.
   * @evidence contracts/development/design.md#principled-representation The binding (body, side, kind) and the derived padding and reach in metres, with the trunk readers that depend only on the binding.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members `point` and `touch` read and fill; `gestureStroke.IInput` carries the record.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Derived members are computed here from the binding, never supplied by a caller; a query on another binding ignores the record.
   */
  export interface IPrepared {
    /** The body the geometry is computed for. */
    readonly body: IAutoMovieMotionHumanBody;

    /** The hand. */
    readonly side: AutoMovieHumanSide;

    /** The gesture kind. */
    readonly kind: IAutoMovieMotionHumanGestureStroke.Kind;

    /** The fingertip's axis-to-skin padding for self-touch, metres. */
    padding?: number;

    /** The pointing reach from the shoulder to the fingertip, metres, once first read. */
    reach?: number;

    /** The eye and shoulder reader of a pointing hand, once first read. */
    point?: ReturnType<typeof HumanTrunk.prepareResolve>;

    /** The last self-touch region's reader. */
    region?: { name: AutoMovieHumanoidRegion; read: ReturnType<typeof HumanTrunk.prepareRegion> };
  }

  /**
   * The pointing goal: the fingertip on the eye-to-target line at the arm's
   * reach.
   *
   * @param input The instant's inputs.
   * @param side The hand.
   * @returns The goal.
   * @throws {Error} Without a target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the goal and the refusal; the namespace states the source.
   * @evidence contracts/development/implementation.md#principled-implementation The reach is solved as a ray-sphere intersection from the shoulder along the eye's line, never past the target itself.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The line, the reach, the distance on the line, then the hand's turn.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The palm turns back or forward for a line within `STEEP` of the vertical, where palm down has no meaning; `POINT_REACH` is a documented provisional value.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trunk forward-kinematics pass demanding the eye and the shoulder, and constant ray-sphere arithmetic; a prepared record computes the reach once per plan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A record prepared for this body, side and kind supplies the eye and shoulder reader and the reach; without one they are computed here. The target, line, intersection and hand goal are computed at every call.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new goal and retains nothing.
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
    const fixed: IPrepared | undefined = preparation(input.prepared, body, side, "point");
    let bones: ReturnType<typeof HumanTrunk.resolve>;
    if (fixed === undefined)
      bones = HumanTrunk.resolve(body, input.base, undefined, input.resolution, POINT_FRAMES[side]);
    else {
      fixed.point ??= HumanTrunk.prepareResolve(body, POINT_FRAMES[side]);
      bones = fixed.point(input.base, input.resolution);
    }
    const eye: IAutoMovieVector3 = bones.get(`${side}Eye`)!.worldPosition;
    const shoulder: IAutoMovieVector3 = bones.get(
      `${side}UpperArm`,
    )!.worldPosition;
    const line: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(input.target, eye),
    );
    let reach: number;
    if (fixed === undefined) reach = pointingReach(body, side);
    else {
      fixed.reach ??= pointingReach(body, side);
      reach = fixed.reach;
    }

    // The point on the line at the reach from the shoulder: |eye + s d - shoulder| = reach.
    const w: IAutoMovieVector3 = Vector3.subtract(eye, shoulder);
    const b: number = Vector3.dot(w, line);
    const c: number = Vector3.dot(w, w) - reach * reach;
    const s: number = -b + Math.sqrt(Math.max(0, b * b - c));
    const distance: number = Math.min(
      s,
      Vector3.distance(input.target, eye),
    );
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the goal; the namespace gives each gesture's slide.
   * @evidence contracts/development/implementation.md#principled-implementation The fingertip's axis stands off the region's surface point by the finger's collider radius along the surface normal, and slides along the surface's upward tangent.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The region, its upward tangent, the slide, then the goal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The slide sizes are documented provisional values; no body is special-cased.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trunk forward-kinematics pass demanding the region's bone and constant vector work; a prepared record supplies the padding and the region reader, and without one the padding's profile scan runs here.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The region read may borrow its caller's FK workspace; the padding, fixed by body and side, comes from the prepared record. The region's place, the slide and the goal are computed at every call.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new goal and retains nothing.
   */
  export function touch(
    kind: "touchFace" | "pushGlasses" | "scratchHead",
    input: gestureStroke.IInput,
    side: AutoMovieHumanSide,
    u: number,
    cycles: number,
  ): IAutoMovieMotionHumanGestureStroke.IHand {
    const body: IAutoMovieMotionHumanBody = input.body;
    const region: AutoMovieHumanoidRegion =
      kind === "pushGlasses"
        ? "noseBridge"
        : kind === "scratchHead"
          ? side === "left"
            ? "templeLeft"
            : "templeRight"
          : input.region;
    const fixed: IPrepared | undefined = preparation(input.prepared, body, side, kind);
    let surface: HumanTrunk.ISurface;
    if (fixed === undefined) surface = HumanTrunk.region(body, input.base, region, input.resolution);
    else {
      let reading: IPrepared["region"] = fixed.region;
      if (reading === undefined || reading.name !== region) {
        reading = { name: region, read: HumanTrunk.prepareRegion(body, region) };
        fixed.region = reading;
      }
      surface = reading.read(input.base, input.resolution);
    }
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
        Vector3.addScaled(surface.point, surface.normal, pad), up, slide,
      ),
      rotation: HumanHand.rotation(side, {
        fingers: up,
        palm: Vector3.scale(surface.normal, -1),
      }),
      out: TOUCH_OUT,
    };
  }

  /**
   * How far the finger's axis stands off the skin it touches: the distal
   * index phalanx's collider radius (the hand's thinnest half-extent on a
   * profile without finger colliders: a box's least half extent, or the
   * radius of the sphere a hull holds about its centre), so a fingertip laid
   * on a surface touches it rather than sinking its axis into it.
   *
   * @param body The body whose profile defines the fingertip.
   * @param side The touching hand.
   * @returns The axis-to-skin padding, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fingertip and hand fallback, the profile source and the metre output.
   * @evidence contracts/development/implementation.md#principled-implementation Takes the least nonzero half-thickness of the distal index segment's colliders, or of the hand segment's when no distal segment exists: a sphere's or capsule's radius, a box's least half extent, a hull's inscribed depth.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two ordered segment searches choose the segment, then one shape scan finds the least half-thickness.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The thickness is the colliders'; no skin thickness or contact allowance is guessed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Scans at most twice the S profile segments and the chosen segment's F shapes, plus the hull faces when a hull is read; a gesture computes it once per touching hand.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The padding depends only on the body's profile and the hand, so `prepare` computes it once per plan; a stroke read without a prepared record computes it here.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a scalar and retains no body, profile, shape or frame.
   */
  export function padding(body: IAutoMovieMotionHumanBody, side: AutoMovieHumanSide): number {
    type Segment = IAutoMovieMotionHumanBody["profile"]["segments"][number];
    const segment: Segment | undefined =
      body.profile.segments.find((s: Segment): boolean => s.bone === `${side}IndexDistal`) ??
      body.profile.segments.find((s: Segment): boolean => s.bone === `${side}Hand`);
    let thin: number = 0;
    for (const shape of segment?.shapes ?? []) {
      const half: number = thickness(shape);
      thin = thin === 0 ? half : Math.min(thin, half);
    }
    return thin;
  }

  /** A shape's thinnest half extent, metres. */
  function thickness(
    shape: IAutoMovieMotionHumanBody["profile"]["segments"][number]["shapes"][number],
  ): number {
    if (shape.kind === "sphere") return shape.radius;
    if (shape.kind === "capsule") return shape.radius;
    if (shape.kind === "box")
      return Math.min(
        shape.halfExtents.x,
        shape.halfExtents.y,
        shape.halfExtents.z,
      );
    if (shape.kind === "hull") return physicalHullFaces(shape.points).depth;
    shape satisfies never;
    throw new Error("Unknown physical shape kind");
  }
}

/** A pointing hand reads its eye and shoulder, without evaluating other limbs. */
const POINT_FRAMES: Readonly<Record<AutoMovieHumanSide, ReadonlySet<AutoMovieHumanoidBone>>> = {
  left: new Set<AutoMovieHumanoidBone>(["leftEye", "leftUpperArm"]),
  right: new Set<AutoMovieHumanoidBone>(["rightEye", "rightUpperArm"]),
};

/** The pointing reach from the shoulder to the fingertip: `POINT_REACH` of the arm plus the point shape's index-tip offset from the wrist. */
function pointingReach(body: IAutoMovieMotionHumanBody, side: AutoMovieHumanSide): number {
  const tip: number = Vector3.length(HumanHand.offset(body, side, "indexTip", "point").point);
  return POINT_REACH * (body.measure.upperArm + body.measure.forearm) + tip;
}

/** The share of the arm (upper arm and forearm) a pointing arm extends to: nearly straight, as people point at a distant target with an almost fully extended arm (Herbort and Kunde 2016, J Exp Psychol Hum Percept Perform 42:78, Exp. 1, Fig. 3); the study gives no extension in numbers, so the share is short of straight only by what keeps the elbow off its end stop. */
const POINT_REACH: number = 0.95;

/** The vertical component of a pointing line past which palm down has no meaning and the palm turns back or forward instead (provisional: about 64 degrees from the horizontal). */
const STEEP: number = 0.9;

/** The outward elbow hint of a hand touching the face, a share of the upper arm (provisional: read from no measured source). */
const TOUCH_OUT: number = 0.15;

/** A prepared record, when it was built for this body, side and kind. */
function preparation(prepared: gestureTouch.IPrepared | undefined, body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide, kind: IAutoMovieMotionHumanGestureStroke.Kind): gestureTouch.IPrepared | undefined {
  return prepared !== undefined && prepared.body === body && prepared.side === side && prepared.kind === kind
    ? prepared
    : undefined;
}