import {
  Quaternion,
  Vector3,
  inertializeOffset,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanPostureRotation,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFlight,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanJumpAirborne,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanPosturePreparation } from "../posture/HumanPosturePreparation";
import { createHumanPostureRotation } from "../posture/createHumanPostureRotation";
import { hipJoints } from "../posture/hipJoints";
import type { jumpState } from "./jumpState";
import type { jumpTouchdownRotation } from "./jumpTouchdownRotation";
import { walkLeg } from "./walkLeg";

/**
 * How far each free foot lifts above its straight path at mid-flight, hip
 * heights (provisional).
 */
const ARCH: number = 0.1;

/**
 * The least forward gap between the feet that reads as one foot ahead of the
 * other, metres: a nanometre, the walk's root-solve width (`walkReach`), under
 * which the gap is a rounding of side by side.
 */
const PASS_GAP: number = 1e-9;
/** The record of `IPrepareFixed`'s site. */
type IPrepareFixed = {
  start: Pick<jumpState.IState, PrepareFixedStart>;
  end: Pick<jumpState.IState, PrepareFixedEnd>;
};

/** The alternatives of `PrepareFixedEnd`'s site. */
type PrepareFixedEnd = "joints" | "legs";

/** The alternatives of `PrepareFixedStart`'s site. */
type PrepareFixedStart = "root" | "joints" | "legs";

/**
 * A jump's time in the air: the shape it holds between take-off and touchdown,
 * the knee hint its legs bend toward, and the turns it asks the performance's
 * flight pass for, with the hook that hands the rotation back
 * (`IHumanActionPlan.airborne`). Authored turns use that pass's staged default;
 * explicit physical mode instead solves angular momentum on the composed shape.
 * This declaration and handback own neither policy nor a conservation verdict.
 */
export namespace jumpAirborne {
  /**
   * Clinical coordinates varied by this free-flight law. All others are copied
   * from the achieved takeoff pose.
   */
  export const TRACKS: readonly AutoMovieHumanoidBone[] = Object.freeze([
    "leftUpperArm",
    "rightUpperArm",
    "leftLowerArm",
    "rightLowerArm",
    "leftUpperLeg",
    "rightUpperLeg",
    "leftLowerLeg",
    "rightLowerLeg",
    "leftFoot",
    "rightFoot",
    "leftToes",
    "rightToes",
  ] as const);

  /** What the airborne shape is drawn from. */
  export interface IShape {
    /** The body whose hip height scales the existing free-foot arch. */
    body: IAutoMovieMotionHumanBody;

    /** The foot that pushed off. */
    takeoff: AutoMovieHumanSide;

    /** The actual achieved push endpoint; its leg geometry is in the root frame. */
    start: jumpState.IState;

    /** The actual achieved touchdown endpoint in the same frame. */
    end: jumpState.IState;

    /** The jump's heading, degrees about +Y. */
    heading: number;
  }

  /**
   * The point a leg's knee bends toward: ahead of the knee's rest place on the
   * body turned to the heading, at a yaw.
   *
   * @param body The body.
   * @param heading The jump's heading, degrees.
   * @param poleHeadings The finite set of fixed pole headings used by this
   *   plan, copied in degrees; other headings retain ordinary point
   *   conversion.
   * @returns A world-metre pole reader of root metres, leg side and pole
   *   heading degrees.
   */
  export function knee(
    body: IAutoMovieMotionHumanBody,
    heading: number,
    poleHeadings: readonly number[] = [],
  ): (
    root: IAutoMovieVector3,
    side: AutoMovieHumanSide,
    yaw: number,
  ) => IAutoMovieVector3 {
    const lower: Record<
      AutoMovieHumanSide,
      ReturnType<typeof HumanFrame.preparePoint>
    > = {
      left: HumanFrame.preparePoint(heading, body.rest.get("leftLowerLeg")!),
      right: HumanFrame.preparePoint(heading, body.rest.get("rightLowerLeg")!),
    };
    const poles: (readonly [
      number,
      ReturnType<typeof HumanFrame.preparePoint>,
    ])[] = poleHeadings.map(
      (
        yaw: number,
      ): readonly [number, ReturnType<typeof HumanFrame.preparePoint>] => [
        yaw,
        HumanFrame.preparePoint(yaw, { x: 0, y: 0, z: 1 }),
      ],
    );
    return (
      root: IAutoMovieVector3,
      side: AutoMovieHumanSide,
      yaw: number,
    ): IAutoMovieVector3 => {
      const origin: IAutoMovieVector3 = lower[side](root);
      for (const [fixed, point] of poles)
        if (Object.is(fixed, yaw)) return point(origin);
      return HumanFrame.point({ origin, yaw }, { x: 0, y: 0, z: 1 });
    };
  }

  /**
   * The airborne posture at a root and a share of the flight: the arms lowering
   * from the push's height, both forefeet uncurling, and each foot carried on a
   * minimum-jerk path between achieved endpoint states, lifted by a tenth of
   * hip height at mid-flight along the existing sine arch. Endpoint values are
   * shared; world COM and angular C1 are not established by this shape
   * interpolation.
   *
   * @param shape Fixed achieved endpoints, body dimensions and flight heading.
   * @returns A posture reader of a world-metre root and flight share in [0,1].
   */
  export function prepare(shape: IShape): IPrepared {
    const { body, heading }: IShape = shape;
    const fixed: IPrepareFixed = structuredClone({
      start: {
        root: shape.start.root,
        joints: shape.start.joints,
        legs: shape.start.legs,
      },
      end: { joints: shape.end.joints, legs: shape.end.legs },
    });
    const archHeight: number = ARCH * body.measure.hipHeight;
    const tracks: IJointTrack[] = [];
    for (const bone of TRACKS) {
      const from: readonly [number, number, number] = fixed.start.joints[
        bone
      ] ?? [0, 0, 0];
      const into: readonly [number, number, number] = fixed.end.joints[
        bone
      ] ?? [0, 0, 0];
      tracks.push({
        bone,
        from,
        delta: [into[0] - from[0], into[1] - from[1], into[2] - from[2]],
      });
    }
    const turn: ReturnType<typeof HumanFrame.turn> = HumanFrame.turn(heading);
    // The pelvis keeps its takeoff articulation and heading throughout the
    // free shape. Translating its two hip origins preserves the current shanks.
    const hipOffsets: ReturnType<typeof hipJoints> = hipJoints(
      body,
      { x: 0, y: 0, z: 0 },
      turn,
      fixed.start.joints.hips,
    );
    const ankleRange: ReturnType<typeof walkLeg.prepareAnkleRange> =
      walkLeg.prepareAnkleRange(body, heading);
    const frame: IAutoMovieMotionHumanFrame = {
      origin: fixed.start.root,
      yaw: heading,
    };
    const points: Record<
      AutoMovieHumanSide,
      ReturnType<typeof HumanFrame.prepareLerp>
    > = {
      left: HumanFrame.prepareLerp(
        frame,
        fixed.start.legs.left.point,
        fixed.end.legs.left.point,
      ),
      right: HumanFrame.prepareLerp(
        frame,
        fixed.start.legs.right.point,
        fixed.end.legs.right.point,
      ),
    };
    const bends: Record<
      AutoMovieHumanSide,
      ReturnType<typeof HumanFrame.prepareLerp>
    > = {
      left: HumanFrame.prepareLerp(
        frame,
        fixed.start.legs.left.bend,
        fixed.end.legs.left.bend,
      ),
      right: HumanFrame.prepareLerp(
        frame,
        fixed.start.legs.right.bend,
        fixed.end.legs.right.bend,
      ),
    };
    const rotations: Record<
      AutoMovieHumanSide,
      ReturnType<typeof Quaternion.prepareSlerp>
    > = {
      left: Quaternion.prepareSlerp(
        fixed.start.legs.left.rotation,
        fixed.end.legs.left.rotation,
      ),
      right: Quaternion.prepareSlerp(
        fixed.start.legs.right.rotation,
        fixed.end.legs.right.rotation,
      ),
    };
    // The two feet pass each other along the heading where their forward
    // gap, linear in the share, changes sign, s* = g0 / (g0 − g1); a lateral
    // gap there under two shank radii (the passing clearance a line walk
    // keeps) is opened half by each foot, outward, by a bump that is the
    // shortfall at s* and zero at both ends, s(1 − s) / (s*(1 − s*)).
    const along: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: heading },
      { x: 0, y: 0, z: 1 },
    );
    const rightward: IAutoMovieVector3 = Vector3.normalize(
      Vector3.cross(along, { x: 0, y: 1, z: 0 }),
    );
    const apart: IAutoMovieVector3 = Vector3.subtract(
      fixed.start.legs.right.point,
      fixed.start.legs.left.point,
    );
    const apartEnd: IAutoMovieVector3 = Vector3.subtract(
      fixed.end.legs.right.point,
      fixed.end.legs.left.point,
    );
    const g0: number = Vector3.dot(apart, along);
    const g1: number = Vector3.dot(apartEnd, along);
    // A pass is a sign change of two real gaps, strictly inside the
    // flight: feet landing side by side leave a floating-point zero gap,
    // whose pass at the very end made the bump 0/0. A pair whose feet change
    // sides across the line as well (a crossing landing) is the law's own
    // crossing, not a pass to open.
    const passAt: number =
      g0 * g1 < 0 && Math.min(Math.abs(g0), Math.abs(g1)) > PASS_GAP
        ? g0 / (g0 - g1)
        : Number.NaN;
    const passBump: number =
      Number.isNaN(passAt) ||
      !(Vector3.dot(apart, rightward) > 0) ||
      !(Vector3.dot(apartEnd, rightward) > 0)
        ? 0
        : Math.max(
            0,
            2 * body.measure.shankRadius -
              Vector3.dot(Vector3.lerp(apart, apartEnd, passAt), rightward),
          );
    const passing = (s: number): IAutoMovieVector3 =>
      passBump === 0
        ? { x: 0, y: 0, z: 0 }
        : Vector3.scale(
            rightward,
            (passBump / 2) *
              Math.min(1, (s * (1 - s)) / (passAt * (1 - passAt))),
          );
    const posture: (
      root: IAutoMovieVector3,
      u: number,
    ) => IAutoMovieMotionHumanPosture = (
      root: IAutoMovieVector3,
      u: number,
    ): IAutoMovieMotionHumanPosture => {
      const s: number = minimumJerk.share(u);
      const joints: IAutoMovieMotionHumanPosture["joints"] = {
        ...fixed.start.joints,
      };
      for (const track of tracks)
        joints[track.bone] = [
          track.from[0] + track.delta[0] * s,
          track.from[1] + track.delta[1] * s,
          track.from[2] + track.delta[2] * s,
        ];
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
      const arch: number = archHeight * Math.sin(Math.PI * u);
      const passed: IAutoMovieVector3 = passing(s);
      for (const side of ["left", "right"] as const) {
        const point: IAutoMovieVector3 = Vector3.add(
          points[side](s, root, arch),
          Vector3.scale(passed, side === "right" ? 1 : -1),
        );
        const asked: IAutoMovieQuaternion = Quaternion.multiply(
          turn,
          rotations[side](s),
        );
        const ranged: IAutoMovieQuaternion = ankleRange(
          Vector3.add(root, hipOffsets[side]),
          point,
          asked,
        );
        limbs[`${side}Leg`] = {
          point,
          rotation:
            ranged === asked
              ? asked
              : HumanFoot.rotation(
                  HumanFoot.heading(asked),
                  HumanFoot.pitch(ranged),
                  HumanFoot.roll(asked),
                ),
          bend: bends[side](s, root),
        };
      }
      return { root, yaw: heading, pitch: 0, roll: 0, joints, limbs };
    };
    return posture;
  }

  /**
   * One immutable achieved-endpoint construction's reader of its actual
   * targets.
   */
  export interface IPrepared {
    /** Original actual world target at a root and normalized flight share. */
    (root: IAutoMovieVector3, u: number): IAutoMovieMotionHumanPosture;
  }

  /** A flight's declared turns and the rotation the flight pass hands back. */
  export interface ITurning {
    /**
     * Takeoff in action-local seconds, reconstructed from the authored flight
     * share and duration.
     */
    from: number;
    /**
     * Touchdown in action-local seconds, reconstructed from the authored flight
     * share and duration.
     */
    to: number;

    /** The plan's flight members, none for a flight with no turns. */
    declared: Pick<IAutoMovieMotionHumanActionPlan, FlightMember>;

    /**
     * Prepare the handed-back touchdown offset after the native flight pass
     * when landing has a nonempty absorption interval.
     */
    prepareLanding(): void;

    /**
     * A posture in flight with the rotation handed back, unchanged before it
     * arrives and outside the flight; at touchdown itself the turn still holds,
     * so the landing's offset (`landed`) starts from it.
     *
     * @param posture The posture.
     * @param seconds Seconds of the jump.
     * @returns The posture, turned.
     */
    turned(
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanPosture;

    /**
     * A landing posture carrying the flight's touchdown attitude away: the
     * laws' own rule at a change of motion (Bollo 2018, inertialization). The
     * turn the flight hands back at touchdown, its residual from the landing's
     * unturned attitude decays on Bollo's quintic (`inertializeOffset`) over
     * the landing's absorption, from touchdown to settled, as a rigid turn
     * about the touchdown centre. The two-foot contact arrests the free-flight
     * angular rate at the impact. A posture rotation turns the root and the
     * free goals only, so the planted feet keep their places and the legs are
     * re-solved onto them.
     *
     * @param posture The landing posture.
     * @param seconds Seconds of the jump.
     * @returns The posture, turned by the decaying offset, or unchanged outside
     *   the absorption, without a handed-back turn or with an admitted turned
     *   stance.
     */
    landed(
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanPosture;
  }

  /**
   * Identify the actual flight request whose ground phase owns a turned
   * landing.
   *
   * @param flight The plan's original flight request.
   * @returns Whether its ground phase already adopts the terminal yaw.
   */
  export function hasTurnedLanding(
    flight: IAutoMovieMotionHumanFlight,
  ): boolean {
    return flight.touchdown?.turnedLanding === true;
  }

  /**
   * The geometry requirement belonging to a native planted touchdown.
   *
   * @param flight The original placed flight request.
   * @returns The angular target and the exact read-back check for this request,
   *   if present.
   */
  export function touchdown(
    flight: IAutoMovieMotionHumanFlight,
  ): jumpTouchdownRotation.IRequirement | undefined {
    return flight.touchdown;
  }

  /**
   * A flight's turns as plan members: the somersault signed by its way, a side
   * salto's somersault frame turned a quarter about the long axis, and the
   * rotation kept once the pass hands it back.
   *
   * @param rotation The requested turns, none when absent.
   * @param takeoff Seconds of the jump at take-off.
   * @param touchdown Seconds of the jump at touchdown.
   * @param duration The jump's duration, seconds.
   * @param settled Seconds of the jump where the landing's absorption ends.
   * @param touchdownRequirement The native geometry target and check for the
   *   returned rotation.
   * @returns The turning.
   */
  export function turning(
    rotation: IAutoMovieMotionHumanJumpAirborne.IRotation | undefined,
    takeoff: number,
    touchdown: number,
    duration: number,
    settled: number,
    touchdownRequirement?: jumpTouchdownRotation.IRequirement,
  ): ITurning {
    const somersault: number =
      (rotation?.somersault ?? 0) * (rotation?.way === "backward" ? -1 : 1);
    const twist: number = rotation?.twist ?? 0;
    const sideways: boolean =
      rotation?.way === "left" || rotation?.way === "right";
    let rotated: ((seconds: number) => IAutoMovieHumanPostureRotation) | null =
      null;
    let known: boolean = false;
    let offset: ITouchdown = STILL;
    const declared: Pick<IAutoMovieMotionHumanActionPlan, FlightMember> =
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
              ...(touchdownRequirement === undefined
                ? {}
                : { touchdown: touchdownRequirement }),
            },
            airborne: (
              handed: (seconds: number) => IAutoMovieHumanPostureRotation,
            ): void => {
              if (touchdownRequirement?.turnedLanding === true)
                touchdownRequirement.check(handed(to));
              rotated = handed;
              known = false;
              offset = STILL;
            },
          };
    // Every reader reconstructs seconds from the public shares. Use those
    // same representable boundaries for both phase selection and handback.
    const from: number =
      declared.flight === undefined ? takeoff : declared.flight.from * duration;
    const to: number =
      declared.flight === undefined ? touchdown : declared.flight.to * duration;
    // Read the actual touchdown attitude once. The planted ground phase
    // absorbs the landing and settles this pose offset after contact.
    const touched = (): ITouchdown => {
      if (known || rotated === null) return offset;
      known = true;
      const at: IAutoMovieHumanPostureRotation = rotated(to);
      const turn: IAutoMovieQuaternion =
        at.turn.w < 0
          ? { x: -at.turn.x, y: -at.turn.y, z: -at.turn.z, w: -at.turn.w }
          : at.turn;
      const sine: number = Math.hypot(turn.x, turn.y, turn.z);
      if (!(sine > 0)) return offset;
      const axis: IAutoMovieVector3 = {
        x: turn.x / sine,
        y: turn.y / sine,
        z: turn.z / sine,
      };
      const angle: number = (2 * Math.atan2(sine, turn.w) * 180) / Math.PI;
      return (offset = { about: at.about, axis, angle });
    };
    return {
      from,
      to,
      declared,
      prepareLanding: (): void => {
        if (touchdownRequirement?.turnedLanding !== true && settled > to)
          touched();
      },
      turned: (
        posture: IAutoMovieMotionHumanPosture,
        t: number,
      ): IAutoMovieMotionHumanPosture =>
        // At touchdown itself the flight's turn still holds, so the landing's
        // decaying offset starts from exactly the pose the flight ends on.
        rotated === null || t <= from || t > to
          ? posture
          : HumanPosturePreparation.turned(posture, rotated(t)),
      landed: (
        posture: IAutoMovieMotionHumanPosture,
        t: number,
      ): IAutoMovieMotionHumanPosture => {
        // Turned footprints already place the body in the admitted terminal stance.
        if (
          touchdownRequirement?.turnedLanding === true ||
          rotated === null ||
          !(t > to) ||
          !(t < settled) ||
          !(settled > to)
        )
          return posture;
        const touch: ITouchdown = touched();
        const decayed: number = inertializeOffset(
          touch.angle,
          0,
          settled - to,
          t - to,
        ).value;
        return decayed === 0
          ? posture
          : {
              ...posture,
              rotation: {
                ...createHumanPostureRotation(
                  touch.about,
                  Quaternion.fromAxisAngle(touch.axis, decayed),
                ),
                planted: true,
              },
            };
      },
    };
  }
}

/** Action-plan members supplied for an authored turning flight. */
type FlightMember = "flight" | "airborne";

/**
 * The flight's actual touchdown attitude: centre, world axis and angle in
 * degrees.
 */
interface ITouchdown {
  /** The touchdown centre the turn is about, world metres. */
  about: IAutoMovieVector3;

  /** The turn's unit axis, world. */
  axis: IAutoMovieVector3;

  /** The turn's angle, degrees. */
  angle: number;
}

/** An upright touchdown has no attitude offset. */
const STILL: ITouchdown = {
  about: { x: 0, y: 0, z: 0 },
  axis: { x: 0, y: 1, z: 0 },
  angle: 0,
};

/**
 * One fixed endpoint joint and its clinical difference, prepared once per
 * flight.
 */
interface IJointTrack {
  /** The joint being interpolated. */
  bone: AutoMovieHumanoidBone;

  /** Clinical degrees at takeoff. */
  from: readonly [number, number, number];

  /** Touchdown minus takeoff, clinical degrees. */
  delta: readonly [number, number, number];
}
