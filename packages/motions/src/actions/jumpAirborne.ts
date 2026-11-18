import { Quaternion, inertializeOffset, integrateMotionTrajectory, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanPostureRotation,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanJumpAirborne,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../posture/HumanFrame";
import { HumanPosturePreparation } from "../posture/HumanPosturePreparation";
import { createHumanPostureRotation } from "../posture/createHumanPostureRotation";
import type { jumpState } from "./jumpState";

/** How far each free foot lifts above its straight path at mid-flight, hip heights (provisional). */
const ARCH: number = 0.1;

/**
 * A jump's time in the air: the shape it holds between take-off and
 * touchdown, the knee hint its legs bend toward, and the turns it asks the
 * performance's flight pass for (#3428), with the hook that hands the
 * rotation back (`IHumanActionPlan.airborne`).
 * Authored turns use that pass's staged default; explicit physical mode
 * instead solves angular momentum on the composed shape. This declaration
 * and handback own neither policy nor a conservation verdict.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three parts of the flight it owns and who turns it.
 * @evidence contracts/development/design.md#principled-representation The flight's shape, its knee hint and its turns, apart from the push-off and the landing.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The requested turns, the shape's inputs and three builders, read by the jump.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The turning is the flight pass's; this module only declares it and carries what comes back.
 */
export namespace jumpAirborne {
  /**
   * What the airborne shape is drawn from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation The jump's own heading, unchanged body dimensions and achieved canonical endpoint states define its free-flight shape.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the prepared posture reader consumes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every length is the body's.
   */
  export interface IShape {
    /** The body whose hip height scales the existing free-foot arch. */
    body: IAutoMovieMotionHumanBody;

    /** The foot that pushed off. */
    takeoff: "left" | "right";

    /** The actual achieved push endpoint; its leg geometry is in the root frame. */
    start: jumpState.IState;

    /** The actual achieved touchdown endpoint in the same frame. */
    end: jumpState.IState;

    /** The jump's heading, degrees about +Y. */
    heading: number;

  }

  /**
   * The point a leg's knee bends toward: ahead of the knee's rest place on
   * the body turned to the heading, at a yaw.
   *
   * @param body The body.
   * @param heading The jump's heading, degrees.
   * @param poleHeadings The finite set of fixed pole headings used by this plan, copied in degrees; other headings retain ordinary point conversion.
   * @returns A world-metre pole reader of root metres, leg side and pole heading degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the point.
   * @evidence contracts/development/implementation.md#principled-implementation A pole one metre ahead of the knee's rest place, the hint a two-bone fit bends toward.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare the unchanged jump heading and explicitly supplied pole headings once; each call applies the same two point conversions with its actual root and exact pole heading, using the ordinary owner for an unprepared heading.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two knee-local readers and H supplied pole readers prepare heading trigonometry/products once; the actual jump supplies H=4. Each query performs at most H exact scalar comparisons and the original fresh point expressions, without per-query trigonometry for those headings. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The unchanged body/heading and explicit copied pole angles fix only transform coefficients. Object.is preserves signed-zero distinctions; changed roots/sides are transformed normally and an unprepared angle uses the original point owner, with no time/result cache or changed addition order.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns two knee and H pole readers holding copied scalar terms until released; H is the supplied finite array length, with no query-driven growth. Every call returns fresh vectors and retains no body, input root or previous pole.
   */
  export function knee(
    body: IAutoMovieMotionHumanBody,
    heading: number,
    poleHeadings: readonly number[] = [],
  ): (root: IAutoMovieVector3, side: "left" | "right", yaw: number) => IAutoMovieVector3 {
    const lower: Record<"left" | "right", ReturnType<typeof HumanFrame.preparePoint>> = {
      left: HumanFrame.preparePoint(heading, body.rest.get("leftLowerLeg")!),
      right: HumanFrame.preparePoint(heading, body.rest.get("rightLowerLeg")!),
    };
    const poles: (readonly [number, ReturnType<typeof HumanFrame.preparePoint>])[] = poleHeadings.map(
      (yaw: number): readonly [number, ReturnType<typeof HumanFrame.preparePoint>] =>
        [yaw, HumanFrame.preparePoint(yaw, { x: 0, y: 0, z: 1 })],
    );
    return (root: IAutoMovieVector3, side: "left" | "right", yaw: number): IAutoMovieVector3 => {
      const origin: IAutoMovieVector3 = lower[side](root);
      for (const [fixed, point] of poles)
        if (Object.is(fixed, yaw)) return point(origin);
      return HumanFrame.point({ origin, yaw }, { x: 0, y: 0, z: 1 });
    };
  }

  /**
   * The airborne posture at a root and a share of the flight: the arms
   * lowering from the push's height, the take-off toes uncurling, and each
   * foot carried on a minimum-jerk path between achieved endpoint states,
   * lifted by a tenth of hip height at mid-flight along the existing sine
   * arch. Endpoint values are shared; world COM and angular C1 are not
   * established by this shape interpolation.
   *
   * @param shape Fixed achieved endpoints, body dimensions and flight heading.
   * @returns A posture reader of a world-metre root and flight share in [0,1].
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each part of the shape does over the flight.
   * @evidence contracts/development/implementation.md#principled-implementation Minimum-jerk endpoint interpolation (Flash and Hogan 1985) uses achieved foot/knee/toe values and quaternion interpolation of achieved foot rotations. The existing provisional arch remains 0.1 hip heights times sin(pi*u); no extra path projection or motion law is added.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare fixed joint start/difference tracks and the heading turn once; each read copies the achieved seed, interpolates arms/toes and builds two free goals from the same endpoints.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fixed -40-degree seed, reconstructed ankle, ground plant, epsilon or boundary-only pose replaces the achieved shape. Coupled ROM remains the ordinary resolver's responsibility.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed joint tracks, four scalar point/bend interpolation readers, the 0.1-hip-height arch coefficient and two quaternion endpoint arcs prepare once. Each query shares one minimum-jerk share/current sine arch and evaluates original local-then-world expressions directly into four world vectors, avoiding four discarded local vectors. Original quaternion work remains and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only fixed body-dimension/endpoint/delta/frame/arc prerequisites prepare; changed dimensions require another prepared shape. Every root/share/sine still evaluates its original scalar sequence: local interpolation, explicit point Y lift, then unchanged world multiply/add order; bends add no artificial zero lift. No affine regrouping, target substitute or time-keyed result cache is used.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns endpoints, fixed joint/scalar interpolation data and two arc readers. Each posture query owns fresh changed tuples/world vectors and retains no history, body workspace or handle; unchanged clinical tuples keep their original readonly endpoint ownership.
   */
  export function prepare(
    shape: IShape,
  ): IPrepared {
    const { body, takeoff, heading }: IShape = shape;
    const fixed: { start: Pick<jumpState.IState, "root" | "joints" | "legs">; end: Pick<jumpState.IState, "joints" | "legs"> } = structuredClone({
      start: { root: shape.start.root, joints: shape.start.joints, legs: shape.start.legs },
      end: { joints: shape.end.joints, legs: shape.end.legs },
    });
    const archHeight: number = ARCH * body.measure.hipHeight;
    const tracks: IJointTrack[] = [];
    for (const bone of [
      "leftUpperArm", "rightUpperArm", "leftLowerArm", "rightLowerArm",
      "leftUpperLeg", "rightUpperLeg", "leftLowerLeg", "rightLowerLeg", "leftFoot", "rightFoot",
    ] as const) {
      const from: readonly [number, number, number] = fixed.start.joints[bone] ?? [0, 0, 0];
      const into: readonly [number, number, number] = fixed.end.joints[bone] ?? [0, 0, 0];
      tracks.push({ bone, from, delta: [into[0] - from[0], into[1] - from[1], into[2] - from[2]] });
    }
    const toe: AutoMovieHumanoidBone = `${takeoff}Toes`;
    const fromToe: number = fixed.start.joints[toe]?.[0] ?? 0;
    const toeDelta: number = (fixed.end.joints[toe]?.[0] ?? 0) - fromToe;
    const turn: ReturnType<typeof HumanFrame.turn> = HumanFrame.turn(heading);
    const frame: IAutoMovieMotionHumanFrame = { origin: fixed.start.root, yaw: heading };
    const points: Record<"left" | "right", ReturnType<typeof HumanFrame.prepareLerp>> = {
      left: HumanFrame.prepareLerp(frame, fixed.start.legs.left.point, fixed.end.legs.left.point),
      right: HumanFrame.prepareLerp(frame, fixed.start.legs.right.point, fixed.end.legs.right.point),
    };
    const bends: Record<"left" | "right", ReturnType<typeof HumanFrame.prepareLerp>> = {
      left: HumanFrame.prepareLerp(frame, fixed.start.legs.left.bend, fixed.end.legs.left.bend),
      right: HumanFrame.prepareLerp(frame, fixed.start.legs.right.bend, fixed.end.legs.right.bend),
    };
    const rotations: Record<"left" | "right", ReturnType<typeof Quaternion.prepareSlerp>> = {
      left: Quaternion.prepareSlerp(fixed.start.legs.left.rotation, fixed.end.legs.left.rotation),
      right: Quaternion.prepareSlerp(fixed.start.legs.right.rotation, fixed.end.legs.right.rotation),
    };
    const posture: (root: IAutoMovieVector3, u: number) => IAutoMovieMotionHumanPosture = (root: IAutoMovieVector3, u: number): IAutoMovieMotionHumanPosture => {
      const s: number = minimumJerk.share(u);
      const joints: IAutoMovieMotionHumanPosture["joints"] = { ...fixed.start.joints };
      for (const track of tracks)
        joints[track.bone] = [
          track.from[0] + track.delta[0] * s,
          track.from[1] + track.delta[1] * s,
          track.from[2] + track.delta[2] * s,
        ];
      joints[toe] = [fromToe + toeDelta * s, 0, 0];
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
      const arch: number = archHeight * Math.sin(Math.PI * u);
      for (const side of ["left", "right"] as const) {
        const point: IAutoMovieVector3 = points[side](s, root, arch);
        const rotation: ReturnType<typeof Quaternion.slerp> = rotations[side](s);
        limbs[`${side}Leg`] = {
          point,
          rotation: Quaternion.multiply(turn, rotation),
          bend: bends[side](s, root),
        };
      }
      return { root, yaw: heading, pitch: 0, roll: 0, joints, limbs };
    };
    return posture;
  }

  /**
   * One immutable achieved-endpoint construction's reader of its actual targets.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the world root, the normalized flight share and the target posture the reader gives.
   * @evidence contracts/development/design.md#principled-representation The fixed endpoints, minimum-jerk coefficients, sine arch and quaternion interpolation law construct each posture.
   * @evidence contracts/development/design.md#minimal-and-owned-surface prepareJumpFlight consumes the target call; nothing else is exposed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A plain reader of the construction, with no optional member.
   */
  export interface IPrepared {
    /** Original actual world target at a root and normalized flight share. */
    (root: IAutoMovieVector3, u: number): IAutoMovieMotionHumanPosture;
  }

  /**
   * A flight's declared turns and the rotation the flight pass hands back.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it carries.
   * @evidence contracts/development/design.md#principled-representation The plan's flight members and the turn applied to a posture in flight.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two plan members the jump spreads and the turn its posture reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The members are the plan's own (`IHumanActionPlan.flight`, `airborne`).
   */
  export interface ITurning {
    /** The plan's flight members, none for a flight with no turns. */
    declared: Pick<IAutoMovieMotionHumanActionPlan, "flight" | "airborne">;

    /**
     * A posture in flight with the rotation handed back, unchanged before
     * it arrives and outside the flight; at touchdown itself the turn still
     * holds, so the landing's offset (`landed`) starts from it.
     *
     * @param posture The posture.
     * @param seconds Seconds of the jump.
     * @returns The posture, turned.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the local jump clock and that the received whole-body turn is absent before handback and outside the flight.
     * @evidence contracts/development/implementation.md#principled-implementation The actual turning producer returns the posture with the flight pass's rigid rotation about COM after take-off through touchdown.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One handed-back-reader/span check, otherwise one fresh posture record with rotation.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not script a turn, alter momentum or mark a free limb as a world plant.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fixed-size optional record update.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses exactly the rotation supplied by the real performance flight pass.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan holds its existing handed-back reader; each call preserves unchanged posture identity or returns one new record with no added global state.
     */
    turned(posture: IAutoMovieMotionHumanPosture, seconds: number): IAutoMovieMotionHumanPosture;

    /**
     * A landing posture carrying the flight's touchdown attitude away: the
     * laws' own rule at a change of motion (Bollo 2018, inertialization).
     * The turn the flight hands back at touchdown, its residual from the
     * landing's unturned attitude, and that turn's rate there decay on
     * Bollo's quintic (`inertializeOffset`) over the landing's absorption,
     * from touchdown to settled, as a rigid turn about the touchdown centre.
     * A posture rotation turns the root and the free goals only, so the
     * planted feet keep their places and the legs are re-solved onto them.
     *
     * @param posture The landing posture.
     * @param seconds Seconds of the jump.
     * @returns The posture, turned by the decaying offset, or unchanged outside the absorption or without a handed-back turn.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the rule, its source, the offset, its window and what the turn reaches.
     * @evidence contracts/development/implementation.md#principled-implementation The offset is the flight's own handed-back turn at touchdown and its rate by the plan-time step's backward difference, decayed by the engine's inertialization quintic.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One offset read once, one quintic a call.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The turn reaches the root and free goals only; planted goals stay in the world, never moved by the offset.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work a call.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The touchdown offset is read once from the handed-back reader and kept with it.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the one offset beside the handed-back reader, for as long as the plan.
     */
    landed(posture: IAutoMovieMotionHumanPosture, seconds: number): IAutoMovieMotionHumanPosture;
  }

  /**
   * A flight's turns as plan members: the somersault signed by its way, a
   * side salto's somersault frame turned a quarter about the long axis,
   * and the rotation kept once the pass hands it back.
   *
   * @param rotation The requested turns, none when absent.
   * @param takeoff Seconds of the jump at take-off.
   * @param touchdown Seconds of the jump at touchdown.
   * @param duration The jump's duration, seconds.
   * @param settled Seconds of the jump where the landing's absorption ends.
   * @returns The turning.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the signs, the side salto's frame and when the rotation applies.
   * @evidence contracts/development/implementation.md#principled-implementation Turns become the plan's request. The performance's staged default constructs the authored unwrapped turn clock, while explicit physical mode solves the composed body's momentum; either policy hands back one numeric rigid-rotation reader. This declaration itself makes no conservation or landing-feasibility claim.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One request and one held rotation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No turn is scripted here.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs but for the held rotation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the one rotation the pass hands back, for as long as the plan.
   */
  export function turning(
    rotation: IAutoMovieMotionHumanJumpAirborne.IRotation | undefined,
    takeoff: number,
    touchdown: number,
    duration: number,
    settled: number,
  ): ITurning {
    const somersault: number =
      (rotation?.somersault ?? 0) * (rotation?.way === "backward" ? -1 : 1);
    const twist: number = rotation?.twist ?? 0;
    const sideways: boolean =
      rotation?.way === "left" || rotation?.way === "right";
    let rotated: ((seconds: number) => IAutoMovieHumanPostureRotation) | null = null;
    const declared: Pick<IAutoMovieMotionHumanActionPlan, "flight" | "airborne"> =
      somersault === 0 && twist === 0
        ? {}
        : {
            flight: {
              from: takeoff / duration,
              to: touchdown / duration,
              momentum: {
                kind: "turns",
                somersault,
                twist,
                ...(sideways
                  ? {
                      frame: Quaternion.fromAxisAngle(
                        { x: 0, y: 1, z: 0 },
                        rotation?.way === "left" ? 90 : -90,
                      ),
                    }
                  : {}),
              },
            },
            airborne: (
              handed: (seconds: number) => IAutoMovieHumanPostureRotation,
            ): void => {
              rotated = handed;
            },
          };
    // The touchdown offset: the handed-back turn there as an axis and an
    // angle, and its rate by the backward difference over the plan-time step.
    let offset: { about: IAutoMovieVector3; axis: IAutoMovieVector3; angle: number; rate: number } | null | undefined;
    const touched = (): typeof offset => {
      if (offset !== undefined || rotated === null) return offset;
      const h: number = Math.min(integrateMotionTrajectory.STEP, touchdown - takeoff);
      const at: IAutoMovieHumanPostureRotation = rotated(touchdown);
      const turn: IAutoMovieQuaternion = at.turn.w < 0
        ? { x: -at.turn.x, y: -at.turn.y, z: -at.turn.z, w: -at.turn.w } : at.turn;
      const sine: number = Math.hypot(turn.x, turn.y, turn.z);
      if (!(sine > 0) || !(h > 0)) return (offset = null);
      const axis: IAutoMovieVector3 = { x: turn.x / sine, y: turn.y / sine, z: turn.z / sine };
      const angle: number = (2 * Math.atan2(sine, turn.w) * 180) / Math.PI;
      const step: IAutoMovieQuaternion = Quaternion.multiply(at.turn, Quaternion.inverse(rotated(touchdown - h).turn));
      const signed: IAutoMovieQuaternion = step.w < 0 ? { x: -step.x, y: -step.y, z: -step.z, w: -step.w } : step;
      const swept: number = (2 * Math.atan2(Math.hypot(signed.x, signed.y, signed.z), signed.w) * 180) / Math.PI;
      const along: number = Math.hypot(signed.x, signed.y, signed.z) > 0
        ? (signed.x * axis.x + signed.y * axis.y + signed.z * axis.z) / Math.hypot(signed.x, signed.y, signed.z) : 0;
      return (offset = { about: at.about, axis, angle, rate: (swept * along) / h });
    };
    return {
      declared,
      turned: (posture: IAutoMovieMotionHumanPosture, t: number): IAutoMovieMotionHumanPosture =>
        // At touchdown itself the flight's turn still holds, so the landing's
        // decaying offset starts from exactly the pose the flight ends on.
        rotated === null || t <= takeoff || t > touchdown
          ? posture
          : HumanPosturePreparation.turned(posture, rotated(t)),
      landed: (posture: IAutoMovieMotionHumanPosture, t: number): IAutoMovieMotionHumanPosture => {
        if (rotated === null || !(t > touchdown) || !(t < settled) || !(settled > touchdown)) return posture;
        const touch: typeof offset = touched();
        if (touch === null || touch === undefined) return posture;
        const decayed: number = inertializeOffset(touch.angle, touch.rate, settled - touchdown, t - touchdown).value;
        return decayed === 0
          ? posture
          : { ...posture, rotation: { ...createHumanPostureRotation(touch.about, Quaternion.fromAxisAngle(touch.axis, decayed)), planted: "kept" } };
      },
    };
  }
}

/** One fixed endpoint joint and its clinical difference, prepared once per flight. */
interface IJointTrack {
  /** The joint being interpolated. */
  bone: AutoMovieHumanoidBone;

  /** Clinical degrees at takeoff. */
  from: readonly [number, number, number];

  /** Touchdown minus takeoff, clinical degrees. */
  delta: readonly [number, number, number];
}
