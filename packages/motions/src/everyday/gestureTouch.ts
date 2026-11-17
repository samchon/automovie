import { Vector3, physicalHullFaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
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
 *   where the arm reaches with `0.95` of its length, the fingers along the
 *   line and the palm down.
 * - `touchFace`: the index fingertip, hand flat, on a face region with the
 *   palm toward the face and the fingers up, held; `pushGlasses` slides it
 *   12 mm up the nose bridge; `scratchHead` rubs it 15 mm on the head's side
 *   four times a second (provisional).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both goals, the pointing source and the provisional values.
 * @evidence contracts/development/design.md#principled-representation Effector goals as a named hand surface, a world point in metres and a world rotation, read from the trunk's own forward kinematics.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Pointing and self-touch goals serve the stroke dispatcher. One plan-bound producer shares fixed point-shape reach or profile padding, while direct stroke callers retain the same cold numerical owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the stroke's input and goal types and the body's surface regions; contact points do not scale with the extent.
 */
export namespace gestureTouch {
  /**
   * Prepare one plan's fixed self-touch padding or pointing arm/digit reach.
   *
   * @param body The unchanged body supplying rig, measure and contact geometry.
   * @param side The moving hand.
   * @param kind The fixed gesture kind.
   * @returns A genuine opaque geometry owner for point/self-touch, or undefined for unrelated kinds; fixed point reach is first demanded after an actual target line succeeds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States unchanged body/side/kind, metre scalars, self-touch and pointing uses, lazy reach admission and absence of retained pose/goal answers.
   * @evidence contracts/development/implementation.md#principled-implementation Self-touch uses the existing profile padding owner; pointing uses the same point-shape index-tip offset length plus the original 0.95 arm share, without changing its ray-sphere target.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One fixed-kind branch issues a private geometry owner with eager touch padding and lazy actual FK/point-reach readers; unrelated kinds prepare nothing.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The first pointing reach still follows successful target validation, actual trunk FK and line normalization; failed preparation is not retained and no target, limit or contact allowance changes.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed digit-shape FK/length runs once across Q pointing probes; touch padding retains its original once-per-plan preparation. All current target geometry and actual limb fits remain, without a measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Body, side and kind fix the plan's genuine name-demand readers, point finger shape and profile padding. Only that immutable metadata and scalar reach are shared; every current posture, target and borrowed workspace reaches its actual query, and changing the source domain requires fresh preparation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns one weakly keyed body/side/kind state, fixed padding/reach scalars and at most one actual point/region name reader until release; no current posture, world frame, FK workspace, target, goal or history enters that state.
   */
  export function prepare(body: IHumanBody, side: HumanHand.Side,
    kind: gestureStroke.Kind): IPrepared | undefined {
    if (kind !== "point" && kind !== "touchFace" && kind !== "pushGlasses" && kind !== "scratchHead")
      return undefined;
    const current: IState = { body, side, kind };
    if (kind !== "point") current.padding = padding(body, side);
    const prepared: IPrepared = { [BRAND]: true };
    STATES.set(prepared, current);
    return prepared;
  }

  /**
   * A fixed-body/hand geometry owner issued only by prepare.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that prepare alone supplies this plan-owned handle; it exposes no padding, reach, frame, pose or mutable cache to the caller.
   * @evidence contracts/development/design.md#principled-representation A nominal handle identifies one unchanged body/side/kind and its genuine native fixed-name readers, separately from each current posture, target and borrowed FK workspace.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IInput carries the handle only for actual point/self-touch queries; cold and unrelated strokes require none.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A private symbol and weak state table admit sharing only for issued matching-domain handles; other inputs follow the ordinary cold path. No supplied derived point, reach, padding, numeric index or resolved flag bypasses body-derived geometry.
   */
  export interface IPrepared {
    /** Only the genuine constructor supplies this nominal identity. */
    readonly [BRAND]: true;
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
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The palm turns back or forward for a line near the vertical, where palm down has no meaning; the `0.95` reach share is a documented provisional value.
   * @evidence contracts/development/implementation.md#efficient-algorithms One demanded eye/shoulder trunk FK and current ray-sphere arithmetic remain. A prepared plan computes fixed point-shape digit FK/length once; native distance and addScaled retain the original magnitude and operand order without discarded displacement/scaled-offset records.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A genuine same-body/side/kind preparation binds actual eye/shoulder names and fixed reach; cold calls keep ordinary live-demand geometry. The current parent FK loan and every authored tuple/root still reach native admission. Every current target subtraction, line, intersection and hand goal remains independently evaluated.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new goal and retains nothing.
   */
  export function point(
    input: gestureStroke.IInput,
    side: HumanHand.Side,
  ): gestureStroke.IHand {
    const { body } = input;
    if (input.target === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "target",
        value: undefined,
        reason: "Pointing needs a target",
        fix: "give the point gesture a target",
      });
    const fixed: IState | undefined = preparation(input.prepared, body, side, "point");
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
      Math.abs(line.y) > 0.9
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
   * @evidence contracts/development/implementation.md#efficient-algorithms One actual demanded region FK remains. A genuine preparation binds fixed name/tuple metadata and profile padding once; cold queries retain the original segment-shape scan, with all current pose/normal/slide work preserved. The native addScaled owner removes two discarded scaled-offset vectors without regrouping either addition.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The actual region observation may borrow its parent's same-body synchronous exact FK workspace; current region placement, slide, normal and goal remain actual, and only unchanged profile padding is prepared separately.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new goal and retains nothing.
   */
  export function touch(
    kind: "touchFace" | "pushGlasses" | "scratchHead",
    input: gestureStroke.IInput,
    side: HumanHand.Side,
    u: number,
    cycles: number,
  ): gestureStroke.IHand {
    const { body } = input;
    const region: AutoMovieHumanoidRegion =
      kind === "pushGlasses"
        ? "noseBridge"
        : kind === "scratchHead"
          ? side === "left"
            ? "templeLeft"
            : "templeRight"
          : input.region;
    const fixed: IState | undefined = preparation(input.prepared, body, side, kind);
    let surface: HumanTrunk.ISurface;
    if (fixed === undefined) surface = HumanTrunk.region(body, input.base, region, input.resolution);
    else {
      let reading: IState["region"] = fixed.region;
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
      out: 0.15,
    };
  }

  /**
   * How far the finger's axis stands off the skin it touches: the distal
   * index phalanx's collider radius (the hand's thinnest half-extent on a
   * profile without finger colliders: a box's least half extent, or the
   * radius of the sphere a hull holds about its centre), so a fingertip laid
   * on a surface touches it rather than sinking its axis into it.
   *
   * @param body The immutable body whose profile defines the fingertip.
   * @param side The touching hand.
   * @returns The original profile-derived axis-to-skin padding, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fingertip/hand fallback, profile source, metre output and intended immutable gesture-plan preparation.
   * @evidence contracts/development/implementation.md#principled-implementation Takes the least half-thickness of the distal index segment's actual colliders, or the hand segment's when no distal segment exists, preserving each shape's existing thickness owner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two ordered segment searches select the original fallback, then one shape scan finds the least nonzero half-thickness.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves segment precedence, zero-thickness behavior, all collider-kind formulas and the existing hull depth; it introduces no guessed skin thickness or contact allowance.
   * @evidence contracts/development/implementation.md#efficient-algorithms Scans at most twice the S profile segments and the selected segment's F shapes, plus existing hull-face preparation when a hull is read; a gesture computes it once per touching hand instead of once per evaluated frame.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The gesture's fixed body/profile and hand establish equivalent padding across its frames; direct stroke callers may still request the same computation when they provide no prepared value.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a scalar and retains no body, profile, shape or frame.
   */
  export function padding(body: IHumanBody, side: HumanHand.Side): number {
    const segment =
      body.profile.segments.find((s) => s.bone === `${side}IndexDistal`) ??
      body.profile.segments.find((s) => s.bone === `${side}Hand`);
    let thin: number = 0;
    for (const shape of segment?.shapes ?? []) {
      const half: number = thickness(shape);
      thin = thin === 0 ? half : Math.min(thin, half);
    }
    return thin;
  }

  /** A shape's thinnest half extent, metres. */
  function thickness(
    shape: IHumanBody["profile"]["segments"][number]["shapes"][number],
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
const POINT_FRAMES: Readonly<Record<HumanHand.Side, ReadonlySet<AutoMovieHumanoidBone>>> = {
  left: new Set<AutoMovieHumanoidBone>(["leftEye", "leftUpperArm"]),
  right: new Set<AutoMovieHumanoidBone>(["rightEye", "rightUpperArm"]),
};

/** Original fixed point-shape fingertip extent and comfortable arm share. */
function pointingReach(body: IHumanBody, side: HumanHand.Side): number {
  const tip: number = Vector3.length(HumanHand.offset(body, side, "indexTip", "point").point);
  return 0.95 * (body.measure.upperArm + body.measure.forearm) + tip;
}
/** The source domain and genuine readers belong only to this issued preparation. */
interface IState {
  body: IHumanBody;
  side: HumanHand.Side;
  kind: gestureStroke.Kind;
  padding?: number;
  reach?: number;
  point?: ReturnType<typeof HumanTrunk.prepareResolve>;
  region?: { name: AutoMovieHumanoidRegion; read: ReturnType<typeof HumanTrunk.prepareRegion> };
}

/** Unforgeable identity; no caller-visible numeric shortcut is carried by the handle. */
const BRAND: unique symbol = Symbol("prepared gesture geometry");

/** A plan's handle lifetime bounds its fixed source metadata; queries are not values. */
const STATES: WeakMap<gestureTouch.IPrepared, IState> = new WeakMap();

/** Only an issued preparation for these exact source inputs may share geometry. */
function preparation(prepared: gestureTouch.IPrepared | undefined, body: IHumanBody,
  side: HumanHand.Side, kind: gestureStroke.Kind): IState | undefined {
  const current: IState | undefined = prepared === undefined ? undefined : STATES.get(prepared);
  return current !== undefined && current.body === body && current.side === side && current.kind === kind ? current : undefined;
}