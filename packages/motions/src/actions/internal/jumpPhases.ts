import { AutoMovieGravity, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanJump,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStandUpright,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmCourse } from "../../compose/internal/AutoMovieMotionHumanArmCourse";
import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";
import { HumanPreparedPlayback } from "../../perform/internal/HumanPreparedPlayback";
import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanSampledCourse } from "../../posture/internal/prepareHumanSampledCourse";
import { fitJumpAbsorption } from "./fitJumpAbsorption";
import type { jumpAirborne } from "./jumpAirborne";
import type { jumpEndpoints } from "./jumpEndpoints";
import type { jumpFlight } from "./jumpFlight";
import { jumpGroundPosture } from "./jumpGroundPosture";
import { jumpJoints } from "./jumpJoints";
import type { jumpLanding } from "./jumpLanding";
import { jumpPath } from "./jumpPath";
import { jumpPush } from "./jumpPush";
import { jumpPushPosture } from "./jumpPushPosture";
import { jumpPushRocker } from "./jumpPushRocker";
import { jumpTouchdownRotation } from "./jumpTouchdownRotation";
import { prepareJumpPosture } from "./prepareJumpPosture";
import { rangeSteppingFoot } from "./rangeSteppingFoot";

/*
 * A jump's timed phases and its plan (`jump.plan`): the push, the flight, the
 * absorption and the rise retimed by the manner, the events and contacts, the
 * push-off from the entry's own values and rates, the absorption and rise
 * paths, the ground postures before and after the flight, and the prepared
 * airborne posture. Read from the plan's context, take-off, landing and
 * flight.
 * Parameter scope: What the plan's phases are built from.
 * Returns: The plan.
 * When the requested rotating landing is incompatible.
 */
export function jumpPhases(
  scope: jumpPhases.IScope,
): IAutoMovieMotionHumanActionPlan {
  const {
    context,
    PUSH,
    ABSORB,
    RISE,
    body,
    model,
    entry,
    root0,
    v0,
    takeoff,
    reaching,
    support,
    supportHeading,
    supportPitch,
    heel,
    ball,
    upright,
    heading,
    tuck,
    knee,
    rootT,
    landing,
    landingKnee,
    landingYaw,
    landingContact,
    landingHeading,
    headingChange,
    rise,
    rootS,
    comT,
    caught,
    caughtEnds,
    caughtCentre,
    vy,
    T,
    launch,
    land,
  }: jumpPhases.IScope = scope;
  // A manner retimes what the performer does, not the flight gravity fixes.
  const tempo: number = AutoMovieMotionManner(
    context,
    context.params.manner,
  ).tempo;
  const P: number = PUSH * tempo;
  const absorb: number = ABSORB * tempo;
  const rising: number = RISE * tempo;
  const touchdown: number = P + T;
  const settled: number = touchdown + absorb;
  const duration: number = settled + rising;
  const bearing: IAutoMovieMotionHumanContactWindow["support"] =
    context.params.on === undefined
      ? { kind: "ground" }
      : { kind: "prop", subject: context.params.on };
  const events: IAutoMovieMotionEvent[] = [
    { name: "takeoff", share: P / duration },
    { name: "apex", share: (P + vy / AutoMovieGravity.STANDARD) / duration },
    { name: "touchdown", share: touchdown / duration },
    { name: "settled", share: settled / duration },
  ];
  const contacts: IAutoMovieMotionHumanContactWindow[] = [
    {
      part: `${takeoff}Foot`,
      kind: "plant",
      from: 0,
      to: P / duration,
      support: { kind: "ground" },
    },
    {
      part: "leftFoot",
      kind: "plant",
      from: touchdown / duration,
      to: 1,
      support: bearing,
    },
    {
      part: "rightFoot",
      kind: "plant",
      from: touchdown / duration,
      to: 1,
      support: bearing,
    },
  ];

  const pushRoot: ReturnType<typeof jumpPath.prepare> = jumpPath.prepare(
    root0,
    v0,
    rootT,
    launch,
    P,
    entry.acceleration,
  );
  // The push-off: the pelvis, the heading, the take-off foot's rocker and
  // the reaching leg, each from the entry's own value and rate.
  const pushProps: jumpPush.IProps = {
    body,
    entry,
    takeoff,
    reaching,
    support,
    supportHeading,
    supportPitch,
    heel,
    ball,
    upright,
    heading,
    push: P,
    tuck,
    rootAt: pushRoot,
    knee,
  };
  const push: jumpPush.IPush = jumpPush(pushProps);
  const writers: NonNullable<Parameters<typeof jumpPushPosture>[4]> = {
    joints: jumpJoints.prepare(body, upright.joints),
    lower: lowerHumanPosture.prepare(body),
  };
  // The reaching foot's heel rise over the push, the one search of a push
  // read, solved at knots AutoKnots places to the rise's tolerance
  // (`jumpPushRocker.TOLERANCE`) and read between them from a knot course.
  const reachingPitch: (seconds: number) => number[] = ((): ((
    seconds: number,
  ) => number[]) => {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    return prepareHumanSampledCourse({
      from: 0,
      to: pushProps.push,
      sample: (t: number): number[] => [
        rangeSteppingFoot.pitch(
          body,
          jumpPushPosture(pushProps, push, t, read, writers),
          reaching,
          read,
        ),
      ],
      tolerance: { kind: "absolute", absolute: jumpPushRocker.TOLERANCE },
      step: AutoMovieMotionHumanArmCourse.STEP,
    });
  })();
  const shape: jumpAirborne.IShape = {
    body,
    takeoff,
    heading,
    start: caughtEnds.start,
    end: caughtEnds.end,
  };
  /*
   * The actual current landing demands before swing clearance.
   */
  const landingAtRoot: (
    root: IAutoMovieVector3,
    t: number,
    read: ReturnType<typeof prepareHumanPoseResolution>,
  ) => IAutoMovieMotionHumanPosture = (
    root: IAutoMovieVector3,
    t: number,
    read: ReturnType<typeof prepareHumanPoseResolution>,
  ): IAutoMovieMotionHumanPosture => {
    const arms: number =
      jumpJoints.LANDING *
      (1 - AutoMovieEngineMotionSampling.minimumJerkShare((t - touchdown) / (absorb + rising)));
    const joints: IAutoMovieMotionHumanPosture["joints"] = writers.joints(
      arms,
      arms,
    );
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
    for (const side of ["left", "right"] as const)
      limbs[`${side}Leg`] = {
        point: landing[side].ankle,
        rotation: landing[side].rotation,
        bend: landingKnee(root, side, landingYaw[side]),
        planted: true,
        contact: { ...landingContact[side] },
      };
    return writers.lower(
      { root, yaw: landingHeading, pitch: 0, roll: 0, joints, limbs },
      read,
    );
  };
  const rotation: IAutoMovieMotionHumanJump.IParams["rotation"] =
    context.params.rotation;
  const rotates: boolean =
    (rotation?.somersault ?? 0) !== 0 || (rotation?.twist ?? 0) !== 0;
  const absorption: fitJumpAbsorption.IPath =
    rotates && rise === 0
      ? fitJumpAbsorption(body, caught, land, absorb, (root, elapsed, read) =>
          landingAtRoot(root, touchdown + elapsed, read),
        )
      : { root: caught.absorbed, acceleration: 0 };
  const absorbRoot: ReturnType<typeof jumpPath.prepare> = jumpPath.prepare(
    caught.touched,
    land,
    absorption.root,
    { x: 0, y: 0, z: 0 },
    absorb,
    { x: 0, y: absorption.acceleration, z: 0 },
  );
  const riseRoot: ReturnType<typeof jumpPath.prepare> = jumpPath.prepare(
    absorption.root,
    { x: 0, y: 0, z: 0 },
    rootS,
    { x: 0, y: 0, z: 0 },
    rising,
  );
  const rootAt: (t: number) => IAutoMovieVector3 = (
    t: number,
  ): IAutoMovieVector3 =>
    t <= settled ? absorbRoot(t - touchdown) : riseRoot(t - settled);

  /*
   * Read the current ground posture on the settled landing path.
   */
  const landingAt = (
    seconds: number,
    read: ReturnType<typeof prepareHumanPoseResolution>,
  ): IAutoMovieMotionHumanPosture =>
    landingAtRoot(rootAt(seconds), seconds, read);
  let pushArms: ReturnType<typeof jumpGroundPosture.course> | undefined;
  let landingArms: ReturnType<typeof jumpGroundPosture.course> | undefined;
  const ground: prepareJumpPosture.IGround = {
    before: (seconds, _channels, resolution) => {
      const read: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(resolution);
      return jumpGroundPosture(
        body,
        jumpPushPosture(pushProps, push, seconds, read, writers),
        reaching,
        read,
        reachingPitch(seconds)[0]!,
        pushArms?.(seconds),
      );
    },
    after: (seconds, _channels, resolution) => {
      const read: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(resolution);
      return jumpGroundPosture(
        body,
        landingAt(seconds, read),
        "landing",
        read,
        undefined,
        landingArms?.(seconds),
      );
    },
    sampleBefore: (seconds, _channels, resolution, projection) => {
      const read: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(resolution);
      return jumpGroundPosture.sample(
        body,
        jumpPushPosture(pushProps, push, seconds, read, writers),
        reaching,
        read,
        projection,
        reachingPitch(seconds)[0]!,
        pushArms?.(seconds),
      );
    },
    sampleAfter: (seconds, _channels, resolution, projection) => {
      const read: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(resolution);
      return jumpGroundPosture.sample(
        body,
        landingAt(seconds, read),
        "landing",
        read,
        projection,
        undefined,
        landingArms?.(seconds),
      );
    },
  };
  const prepared: prepareJumpPosture.IConstruction = prepareJumpPosture(
    body,
    model,
    shape,
    {
      from: P,
      to: touchdown,
      duration,
      flightSeconds: T,
      centre: comT,
      launch,
      settled,
    },
    rotation,
    ground,
    rotates
      ? jumpTouchdownRotation(
          body,
          caught,
          caughtCentre,
          headingChange,
          context.subject,
        )
      : undefined,
  );
  // The takeoff impulse and landing absorption end at settled. The remaining
  // ascent follows the authored return curve from zero velocity.
  const result: IAutoMovieMotionHumanActionPlan = {
    duration,
    events,
    contacts,
    physicalWindow: { from: 0, to: settled },
    ...prepared.declared,
    prepare: (): void => {
      const read: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution();
      pushArms ??= jumpGroundPosture.course(
        body,
        0,
        P,
        reaching,
        (seconds: number): IAutoMovieMotionHumanPosture =>
          jumpPushPosture(pushProps, push, seconds, read, writers),
        (seconds: number): number => reachingPitch(seconds)[0]!,
      );
      landingArms ??= jumpGroundPosture.course(
        body,
        touchdown,
        duration,
        "landing",
        (seconds: number): IAutoMovieMotionHumanPosture =>
          landingAt(seconds, read),
      );
    },
    posture: prepared.posture,
  };
  HumanPreparedPlayback.attach(result, body, prepared.playback);
  return result;
}

/*
 * What a jump's phases read.
 */
export namespace jumpPhases {
  /*
   * What a jump plan builds its phases from.
   */
  export interface IScope {
    /*
     * The action's context.
     */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanJump.IParams>;

    /*
     * The push-off duration, seconds (`jump.PUSH`).
     */
    PUSH: number;

    /*
     * The landing absorption duration, seconds (`jump.ABSORB`).
     */
    ABSORB: number;

    /*
     * The rise to standing, seconds (`jump.RISE`).
     */
    RISE: number;

    /*
     * The body.
     */
    body: IAutoMovieMotionHumanBody;

    /*
     * The body's mass model.
     */
    model: IAutoMovieResolveCenterOfMass.IModel;

    /*
     * The action's entry.
     */
    entry: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanJump.IParams>["entry"];

    /*
     * The entry root.
     */
    root0: IAutoMovieVector3;

    /*
     * The entry root's velocity.
     */
    v0: IAutoMovieVector3;

    /*
     * The take-off foot.
     */
    takeoff: AutoMovieHumanSide;

    /*
     * The reaching foot.
     */
    reaching: AutoMovieHumanSide;

    /*
     * The take-off foot's entry placement.
     */
    support: IAutoMovieMotionHumanFoot.IPlacement;

    /*
     * The take-off foot's heading, degrees.
     */
    supportHeading: number;

    /*
     * The take-off foot's pitch, degrees.
     */
    supportPitch: number;

    /*
     * The take-off foot's heel.
     */
    heel: IAutoMovieVector3;

    /*
     * The take-off foot's ball.
     */
    ball: IAutoMovieVector3;

    /*
     * The upright stand's alignment.
     */
    upright: IAutoMovieMotionHumanStandUpright.IAlignment;

    /*
     * The jump's heading, degrees.
     */
    heading: number;

    /*
     * The withdrawn free ankle in the body frame.
     */
    tuck: IAutoMovieVector3;

    /*
     * The knee planes at take-off.
     */
    knee: jumpPush.IProps["knee"];

    /*
     * The take-off root.
     */
    rootT: IAutoMovieVector3;

    /*
     * Each foot's landing footprint.
     */
    landing: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>;

    /*
     * The knee planes at landing.
     */
    landingKnee: jumpPush.IProps["knee"];

    /*
     * Each landing footprint's heading, degrees.
     */
    landingYaw: Record<AutoMovieHumanSide, number>;

    /*
     * Each landing foot's contact offset.
     */
    landingContact: Record<AutoMovieHumanSide, IAutoMovieVector3>;

    /*
     * The landing's heading, degrees.
     */
    landingHeading: number;

    /*
     * The turn from the take-off heading to the landing's, degrees.
     */
    headingChange: number;

    /*
     * The landing surface's height, metres.
     */
    rise: number;

    /*
     * The standing root.
     */
    rootS: IAutoMovieVector3;

    /*
     * The centre of mass at take-off.
     */
    comT: IAutoMovieVector3;

    /*
     * The caught landing.
     */
    caught: jumpLanding.ILanding;

    /*
     * The endpoints to the caught landing.
     */
    caughtEnds: jumpEndpoints.IEnds;

    /*
     * The centre of mass at the caught touchdown.
     */
    caughtCentre: IAutoMovieVector3;

    /*
     * The vertical take-off speed, metres a second.
     */
    vy: jumpFlight.IFlight["vy"];

    /*
     * The flight's time, seconds.
     */
    T: jumpFlight.IFlight["T"];

    /*
     * The centre's launch velocity.
     */
    launch: jumpFlight.IFlight["launch"];

    /*
     * The centre's landing velocity.
     */
    land: jumpFlight.IFlight["land"];
  }
}
