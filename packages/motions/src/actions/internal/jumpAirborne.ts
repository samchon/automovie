import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFlight,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { hipJoints } from "../../posture/internal/hipJoints";
import type { jumpState } from "./jumpState";
import type { jumpTouchdownRotation } from "./jumpTouchdownRotation";
import { walkLeg } from "./walkLeg";

/*
 * A jump's time in the air: the shape it holds between take-off and touchdown,
 * the knee hint its legs bend toward, and the turns it asks the performance's
 * flight pass for, with the hook that hands the rotation back
 * (`IHumanActionPlan.airborne`). Authored turns use that pass's staged default;
 * explicit physical mode instead solves angular momentum on the composed shape.
 * This declaration and handback own neither policy nor a conservation verdict.
 */
export namespace jumpAirborne {
  /*
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

  /*
   * What the airborne shape is drawn from.
   */
  export interface IShape {
    /*
     * The body whose hip height scales the existing free-foot arch.
     */
    body: IAutoMovieMotionHumanBody;

    /*
     * The foot that pushed off.
     */
    takeoff: AutoMovieHumanSide;

    /*
     * The actual achieved push endpoint; its leg geometry is in the root frame.
     */
    start: jumpState.IState;

    /*
     * The actual achieved touchdown endpoint in the same frame.
     */
    end: jumpState.IState;

    /*
     * The jump's heading, degrees about +Y.
     */
    heading: number;
  }

  /*
   * The point a leg's knee bends toward: ahead of the knee's rest place on the
   * body turned to the heading, at a yaw.
   * Parameter body: The body.
   * Parameter heading: The jump's heading, degrees.
   * Parameter poleHeadings: The finite set of fixed pole headings used by this
   * plan, copied in degrees; other headings retain ordinary point
   * conversion.
   * Returns: A world-metre pole reader of root metres, leg side and pole
   * heading degrees.
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

  /*
   * The airborne posture at a root and a share of the flight: the arms lowering
   * from the push's height, both forefeet uncurling, and each foot carried on a
   * minimum-jerk path between achieved endpoint states, lifted by a tenth of
   * hip height at mid-flight along the existing sine arch. Endpoint values are
   * shared; world COM and angular C1 are not established by this shape
   * interpolation.
   * Parameter shape: Fixed achieved endpoints, body dimensions and flight heading.
   * Returns: A posture reader of a world-metre root and flight share in [0,1].
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
      ReturnType<typeof AutoMovieEngineQuaternion.prepareSlerp>
    > = {
      left: AutoMovieEngineQuaternion.prepareSlerp(
        fixed.start.legs.left.rotation,
        fixed.end.legs.left.rotation,
      ),
      right: AutoMovieEngineQuaternion.prepareSlerp(
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
    const rightward: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
      AutoMovieEngineVector3.cross(along, { x: 0, y: 1, z: 0 }),
    );
    const apart: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      fixed.start.legs.right.point,
      fixed.start.legs.left.point,
    );
    const apartEnd: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      fixed.end.legs.right.point,
      fixed.end.legs.left.point,
    );
    const g0: number = AutoMovieEngineVector3.dot(apart, along);
    const g1: number = AutoMovieEngineVector3.dot(apartEnd, along);
    // A pass is a sign change of two real gaps, strictly inside the
    // flight: feet landing side by side leave a floating-point zero gap,
    // whose pass at the very end made the bump 0/0. A pair whose feet change
    // sides across the line as well (a crossing landing) is the law's own
    // crossing, not a pass to open.
    const passAt: number | undefined =
      g0 * g1 < 0 && Math.min(Math.abs(g0), Math.abs(g1)) > PASS_GAP
        ? g0 / (g0 - g1)
        : undefined;
    const passBump: number =
      passAt === undefined ||
      !(AutoMovieEngineVector3.dot(apart, rightward) > 0) ||
      !(AutoMovieEngineVector3.dot(apartEnd, rightward) > 0)
        ? 0
        : Math.max(
            0,
            2 * body.measure.shankRadius -
              AutoMovieEngineVector3.dot(AutoMovieEngineVector3.lerp(apart, apartEnd, passAt), rightward),
          );
    const passing = (s: number): IAutoMovieVector3 =>
      passAt === undefined || passBump === 0
        ? { x: 0, y: 0, z: 0 }
        : AutoMovieEngineVector3.scale(
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
      const s: number = AutoMovieEngineMotionSampling.minimumJerkShare(u);
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
        const point: IAutoMovieVector3 = AutoMovieEngineVector3.add(
          points[side](s, root, arch),
          AutoMovieEngineVector3.scale(passed, side === "right" ? 1 : -1),
        );
        const asked: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
          turn,
          rotations[side](s),
        );
        const ranged: IAutoMovieQuaternion = ankleRange(
          AutoMovieEngineVector3.add(root, hipOffsets[side]),
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

  /*
   * One immutable achieved-endpoint construction's reader of its actual
   * targets.
   */
  export interface IPrepared {
    /*
     * Original actual world target at a root and normalized flight share.
     */
    (root: IAutoMovieVector3, u: number): IAutoMovieMotionHumanPosture;
  }

  /*
   * Identify the actual flight request whose ground phase owns a turned
   * landing.
   * Parameter flight: The plan's original flight request.
   * Returns: Whether its ground phase already adopts the terminal yaw.
   */
  export function hasTurnedLanding(
    flight: IAutoMovieMotionHumanFlight,
  ): boolean {
    return flight.touchdown?.turnedLanding === true;
  }

  /*
   * The geometry requirement belonging to a native planted touchdown.
   * Parameter flight: The original placed flight request.
   * Returns: The angular target and the exact read-back check for this request,
   * if present.
   */
  export function touchdown(
    flight: IAutoMovieMotionHumanFlight,
  ): jumpTouchdownRotation.IRequirement | undefined {
    return flight.touchdown;
  }
}

/*
 * How far each free foot lifts above its straight path at mid-flight, hip
 * heights (provisional).
 */
const ARCH: number = 0.1;
/*
 * The least forward gap between the feet that reads as one foot ahead of the
 * other, metres: a nanometre, the walk's root-solve width (`walkReach`), under
 * which the gap is a rounding of side by side.
 */
const PASS_GAP: number = 1e-9;

/*
 * The record of `IPrepareFixed`'s site.
 */
type IPrepareFixed = {
  start: Pick<jumpState.IState, PrepareFixedStart>;
  end: Pick<jumpState.IState, PrepareFixedEnd>;
};

/*
 * The alternatives of `PrepareFixedEnd`'s site.
 */
type PrepareFixedEnd = "joints" | "legs";

/*
 * The alternatives of `PrepareFixedStart`'s site.
 */
type PrepareFixedStart = "root" | "joints" | "legs";

/*
 * One fixed endpoint joint and its clinical difference, prepared once per
 * flight.
 */
interface IJointTrack {
  /*
   * The joint being interpolated.
   */
  bone: AutoMovieHumanoidBone;

  /*
   * Clinical degrees at takeoff.
   */
  from: readonly [number, number, number];

  /*
   * Touchdown minus takeoff, clinical degrees.
   */
  delta: readonly [number, number, number];
}
