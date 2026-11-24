import {
  AutoMovieGravity,
  minimumJerk,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanJump,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStandUpright,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPreparedPlayback } from "../perform/HumanPreparedPlayback";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { fitJumpAbsorption } from "./fitJumpAbsorption";
import { jumpAirborne } from "./jumpAirborne";
import { jumpEndpoints } from "./jumpEndpoints";
import { jumpFlight } from "./jumpFlight";
import { jumpGroundPosture } from "./jumpGroundPosture";
import { jumpJoints } from "./jumpJoints";
import { jumpLanding } from "./jumpLanding";
import { jumpLandingHeading } from "./jumpLandingHeading";
import { jumpPath } from "./jumpPath";
import { jumpPush } from "./jumpPush";
import { jumpPushEnd } from "./jumpPushEnd";
import { jumpPushPosture } from "./jumpPushPosture";
import type { jumpState } from "./jumpState";
import { jumpTakeoff } from "./jumpTakeoff";
import { jumpTouchdownRotation } from "./jumpTouchdownRotation";
import { prepareJumpPosture } from "./prepareJumpPosture";
import { standUpright } from "./standUpright";

/**
 * Offset decay time of a cut out of the settled jump, seconds (a deliberate
 * change of the whole body's action,
 * `AutoMovieMotionHumanInterrupt.BLENDS.deliberate`).
 */
const BLEND: number = AutoMovieMotionHumanInterrupt.BLENDS.deliberate;

/**
 * How far the take-off root rises above the entry root, hip heights
 * (provisional).
 */
const TAKEOFF_RISE: number = 0.03;

/**
 * How far the take-off root lies ahead of the pushing ball, hip heights
 * (provisional).
 */
const TAKEOFF_AHEAD: number = 0.25;

/**
 * The withdrawn free ankle's height above the rig origin, hip heights
 * (provisional).
 */
const TUCK_HEIGHT: number = 0.3;

/**
 * The withdrawn free ankle's distance ahead of the rig origin, hip heights
 * (provisional).
 */
const TUCK_AHEAD: number = 0.1;
/** The record of `IPlanResult`'s site. */
type IPlanResult = {
  takeoff: IAutoMovieVector3;
  landing: IAutoMovieVector3;
};

/** The record of `IPlan`'s site. */
type IPlan = { takeoff: IAutoMovieVector3; landing: IAutoMovieVector3 };

/**
 * A jump to a floor point: a push-off from a planted foot, a ballistic flight
 * and a two-footed landing that absorbs and rises to standing.
 *
 * The push starts from the entry's position, velocity and acceleration on a
 * quintic Hermite root path. It uses the leading planted foot in the entered
 * body's frame, lowering a heel rocker before rising about the metatarsal
 * joint. The requested heel rise is 40 degrees; the actual pitch follows the
 * body's ankle/reach rule and can be steeper. The declared floor contact is the
 * heel during that rocker, then the metatarsal joint. The free ankle withdraws
 * to 0.3 hip heights while the shoulders rise to 60 degrees, the arm action
 * that contributes to takeoff velocity (Ashby and Heegaard 2002, "Role of arm
 * motion in the standing long jump", J. Biomech. 35).
 *
 * The push's carried entry rates and acceleration use the existing engine bases
 * and available floor room (`jumpPush`). Its pure terminal writer is shared
 * with endpoint preparation: lowering and ordinary canonical fitting supply the
 * actual root, feet, knee planes and toes to flight, instead of reconstructing
 * a nominal 40-degree pose. Shared endpoint values do not establish world COM
 * or angular C1 across takeoff.
 *
 * Flight is ballistic in the centre of mass, the one point gravity alone moves
 * while airborne: from the apex height `apex` above take-off (0.06 hip heights
 * plus a tenth of the jump's length when absent, provisional), the vertical
 * take-off speed is `sqrt(2 g apex)`, the flight time solves the centre's
 * landing height, and the horizontal speed covers its distance in that time,
 * the closed form of a drag-free projectile (`v = d / T - g T / 2`, as the
 * engine's ballistic solvers). At each airborne instant the root is placed so
 * the body's centre of mass, read by the engine's mass model from the posture
 * there, lies on that parabola, so moving the limbs in flight shifts the trunk
 * the way it would. The free legs travel between achieved endpoints with the
 * existing sine arch of a tenth of hip height; original planted and landing
 * targets remain unchanged. Requested turns follow the performance's staged
 * authored-turn clock by default. Explicit physical mode instead derives
 * rotation from the composed body's angular momentum; that conservation claim
 * does not apply to staged rotation. Both policies retain the same ballistic
 * COM and limb goals. Both feet land flat on footprints at the destination and
 * at its height (a box's top, a step; the flight's default apex then also
 * clears that rise, and an apex that does not is refused), at the body's rest
 * separation, turned out by the stance angle; the root lands 0.03 hip heights
 * low with the flight's velocity, absorbs toward 0.12 hip heights low on a
 * quintic path that brings that velocity to rest over `ABSORB` seconds, then
 * rises to the upright stand ({@link standUpright}) over `RISE` seconds, both
 * scaled by the manner's tempo as the push is. Planted legs are kept reachable
 * by the shared `lowerHumanPosture` rule. The push-off is drawn by `jumpPush`,
 * the landing's places by `jumpLanding` and the paths by `jumpPath`. A
 * fractional twist may finish upright on level floor with both footprints
 * facing the terminal heading. The signed winding still belongs to flight,
 * which must hand back a touchdown inside the continuity budget. The turned
 * absorption follows the measured depth available to both planted feet.
 *
 * The phase boundaries separate ground propulsion, airborne shape and impact.
 * [Bobbert and van Ingen Schenau
 * (1988)](https://pubmed.ncbi.nlm.nih.gov/3379084/) describe push-off in terms
 * of the energy transferred to the centre of mass. The [MIT Cheetah jump
 * planner](https://dspace.mit.edu/entities/publication/8cfc87cf-d85a-466e-9471-66ca6923035d)
 * likewise prepares distinct approach and push-off phases.
 */
export namespace jump {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "jump";

  /**
   * A jump's content is a take-off, a flight and a landing, so its balance is
   * judged (`IAutoMovieMotionHumanActionLaw.physical`).
   */
  export const physical: boolean = true;

  /**
   * Cancel table: once landed and settled, a jump gives way to standing or
   * walking.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      { window: ["settled", 1], kind: "inertialize", entry: 0, blend: BLEND },
    ],
    walk: [
      { window: ["settled", 1], kind: "inertialize", entry: 0, blend: BLEND },
    ],
  };

  /**
   * The trunk, arms and hands a layup, a jump throw, a spike or a block takes
   * while the jump carries the body by its root and legs; the jump's own trunk
   * and momentum swing show only where no overlay claims them.
   */
  export const yields: IAutoMovieMotionHumanActionLaw["yields"] = [
    "trunk",
    "leftArm",
    "leftHand",
    "rightArm",
    "rightHand",
  ];

  /**
   * Push-off duration, seconds (provisional; take-off contact of a one-foot
   * jump from walking).
   */
  export const PUSH: number = 0.3;
  /** Landing absorption duration, seconds (provisional). */
  export const ABSORB: number = 0.3;
  /** Rise to standing after the absorption, seconds (provisional). */
  export const RISE: number = 0.45;

  /**
   * Plan a jump.
   *
   * @param context The action's context.
   * @param supportFoot The optional planted foot named by a composing sport
   *   law.
   * @returns The plan.
   * @throws {HumanRefusal} When no foot is planted to push off from, or the
   *   apex is not positive or does not clear a raised landing (jumpFlight), or
   *   the requested rotating landing is incompatible.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanJump.IParams>,
    supportFoot?: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const l: number = m.hipHeight;
    const entry: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanJump.IParams>["entry"] =
      context.entry;
    const root0: IAutoMovieVector3 = entry.posture.root;
    const v0: IAutoMovieVector3 = entry.velocity.linear;
    const to: IAutoMovieVector3 = {
      x: context.params.to.x,
      y: 0,
      z: context.params.to.z,
    };
    // The landing surface's height: the floor's, a box's top or a step's.
    const rise: number = context.params.to.y;
    const heading: number = jumpPath.unwrap(
      (Math.atan2(to.x - root0.x, to.z - root0.z) * 180) / Math.PI,
      entry.posture.yaw,
    );
    const frame: (origin: IAutoMovieVector3) => IAutoMovieMotionHumanFrame = (
      origin: IAutoMovieVector3,
    ): IAutoMovieMotionHumanFrame => ({
      origin: { ...origin, y: 0 },
      yaw: heading,
    });
    const planted: AutoMovieHumanSide[] = (["left", "right"] as const).filter(
      (s: AutoMovieHumanSide): boolean => entry.feet[s].planted,
    );
    if (planted.length === 0)
      throw new HumanRefusal({
        kind: "base",
        axis: "base",
        value: null,
        reason: `a jump takes off from a planted foot, and neither is planted`,
        fix: "enter the jump from an action that leaves a foot planted, such as stand or walk",
      });
    if (supportFoot !== undefined && !entry.feet[supportFoot].planted)
      throw new HumanRefusal({
        kind: "base",
        axis: "takeoffFoot",
        value: supportFoot,
        reason: `the named ${supportFoot} take-off foot is not planted`,
        fix: "end the approach on that foot or select the planted foot",
      });
    // A symmetric double support must choose the same foot after a rigid move.
    const takeoff: AutoMovieHumanSide = supportFoot ?? jumpTakeoff(body, entry);
    const reaching: AutoMovieHumanSide = takeoff === "left" ? "right" : "left";
    const support: IAutoMovieMotionHumanFoot.IPlacement = {
      ankle: entry.feet[takeoff].ankle,
      rotation: entry.feet[takeoff].rotation,
    };
    const supportHeading: number = HumanFoot.heading(support.rotation);
    const supportPitch: number = HumanFoot.pitch(support.rotation);
    // A foot still in its heel rocker comes down about its heel first; the
    // push then rises about the toes' joint of the flat foot.
    const heel: IAutoMovieVector3 = HumanFoot.point(
      body,
      takeoff,
      "heel",
      support,
    );
    const flat: IAutoMovieMotionHumanFoot.IPlacement =
      supportPitch > 0
        ? HumanFoot.pivot(body, takeoff, "heel", heel, supportHeading, 0)
        : support;
    const ball: IAutoMovieVector3 = HumanFoot.point(body, takeoff, "mtp", flat);
    const upright: IAutoMovieMotionHumanStandUpright.IAlignment =
      standUpright(body);
    const model: IAutoMovieResolveCenterOfMass.IModel = body.massModel;
    // Take-off and touchdown roots. The take-off foot rises about its toes'
    // joint, which carries its ankle toward the toes, so the root leads the
    // ball only by the share of `TAKEOFF_AHEAD` the jump's heading has along
    // the foot's own: a jump backward or sideways takes off with the root
    // over the ball, within the planted leg's reach.
    const along: number = Math.max(
      0,
      Math.cos(((heading - supportHeading) * Math.PI) / 180),
    );
    const rootT: IAutoMovieVector3 = HumanFrame.point(frame(ball), {
      x: 0,
      y: root0.y + TAKEOFF_RISE * l,
      z: TAKEOFF_AHEAD * l * along,
    });
    const landingHeading: number = jumpLandingHeading(context.params, heading);
    const headingChange: number = landingHeading - heading;
    const landed: jumpLanding.ILanding = jumpLanding(
      body,
      to,
      landingHeading,
      rise,
      upright.lean,
      headingChange !== 0,
      0,
    );
    const landing: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    > = landed.feet;
    const landingYaw: Record<AutoMovieHumanSide, number> = {
      left: HumanFoot.heading(landing.left.rotation),
      right: HumanFoot.heading(landing.right.rotation),
    };
    const landingContact: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
      left: HumanFoot.offset(body, "left", "mtp"),
      right: HumanFoot.offset(body, "right", "mtp"),
    };
    const rootL: IAutoMovieVector3 = landed.touched;
    const rootS: IAutoMovieVector3 = landed.stood;

    // Body-frame placements at take-off and touchdown, for the flight.
    const tuck: IAutoMovieVector3 = {
      x:
        (reaching === "left" ? 1 : -1) *
        Math.abs(body.rest.get(`${reaching}Foot`)!.x),
      y: TUCK_HEIGHT * l,
      z: TUCK_AHEAD * l,
    };
    const knee: jumpPush.IProps["knee"] = jumpAirborne.knee(body, heading, [
      heading,
      supportHeading,
      landingYaw.left,
      landingYaw.right,
    ]);

    const landingKnee: jumpPush.IProps["knee"] =
      headingChange === 0
        ? knee
        : jumpAirborne.knee(body, landingHeading, [
            landingYaw.left,
            landingYaw.right,
          ]);

    const endProps: Parameters<typeof jumpPushEnd>[0] = {
      body,
      takeoff,
      reaching,
      supportPitch,
      supportHeading,
      ball,
      upright,
      heading,
      tuck,
      knee,
    };
    const ends: jumpEndpoints.IEnds = jumpEndpoints(
      endProps,
      rootT,
      rootL,
      landing,
      landingHeading,
      landingKnee,
    );
    const startState: jumpState.IState = ends.start;
    const endState: jumpState.IState = ends.end;

    // Ballistics and free goals inherit these same achieved endpoint poses.
    const massBones: Set<AutoMovieHumanoidBone> = new Set();
    for (const segment of model.segments) massBones.add(segment.bone);
    const readMassBones: ReturnType<typeof poseBones.prepare> =
      poseBones.prepare(body, massBones);
    const { takeoff: comT, landing: comL }: IPlan = ((): IPlanResult => {
      const read: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution();
      return {
        takeoff: resolveAutoMovieCenterOfMass.place(
          model,
          readMassBones(startState.pose, read()),
        ),
        landing: resolveAutoMovieCenterOfMass.place(
          model,
          readMassBones(endState.pose, read()),
        ),
      };
    })();
    const flight: jumpFlight.IFlight = jumpFlight.solve(
      comT,
      comL,
      context.params.apex,
      l,
      rise,
    );
    // The landing's capture (Hof 2008, Hum Mov Sci 27:112; Pratt et al. 2006,
    // the capture point): the root touches down behind the footprints by the
    // flight's horizontal speed over the body's pendulum frequency, the one
    // the balance audit reads (`resolveAutoMovieCenterOfMass.pendulum`), so
    // the extrapolated centre of mass, the centre plus its speed over that
    // frequency, lies over the feet as they land: the place a body can stop
    // over. The speed is the flight's own, the distance its centre covers
    // over its time; the offset shortens that distance, so with `D` the
    // distance to a landing over the feet and `T` the flight's time (set by
    // the heights alone) the speed is `D / (T + 1 / omega)` in closed form.
    const omega: number = resolveAutoMovieCenterOfMass.frequency(
      resolveAutoMovieCenterOfMass.pendulum(l),
    );
    const ahead: number = Math.max(
      0,
      (comL.x - comT.x) * Math.sin((landingHeading * Math.PI) / 180) +
        (comL.z - comT.z) * Math.cos((landingHeading * Math.PI) / 180),
    );
    const caught: jumpLanding.ILanding = jumpLanding(
      body,
      to,
      landingHeading,
      rise,
      upright.lean,
      headingChange !== 0,
      ahead / (flight.T + 1 / omega) / omega,
    );
    const caughtEnds: jumpEndpoints.IEnds = jumpEndpoints(
      endProps,
      rootT,
      caught.touched,
      landing,
      landingHeading,
      landingKnee,
    );
    const caughtCentre: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
      model,
      readMassBones(caughtEnds.end.pose, prepareHumanPoseResolution()()),
    );
    const { vy, T, launch, land }: jumpFlight.IFlight = jumpFlight.solve(
      comT,
      caughtCentre,
      context.params.apex,
      l,
      rise,
    );

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
    const shape: jumpAirborne.IShape = {
      body,
      takeoff,
      heading,
      start: caughtEnds.start,
      end: caughtEnds.end,
    };
    /** The actual current landing demands before swing clearance. */
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
        (1 - minimumJerk.share((t - touchdown) / (absorb + rising)));
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

    /** Read the current ground posture on the settled landing path. */
    const landingAt = (
      seconds: number,
      read: ReturnType<typeof prepareHumanPoseResolution>,
    ): IAutoMovieMotionHumanPosture =>
      landingAtRoot(rootAt(seconds), seconds, read);
    const ground: prepareJumpPosture.IGround = {
      before: (seconds, _channels, resolution) => {
        const read: ReturnType<typeof prepareHumanPoseResolution> =
          prepareHumanPoseResolution(resolution);
        return jumpGroundPosture(
          body,
          jumpPushPosture(pushProps, push, seconds, read, writers),
          reaching,
          read,
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
      posture: prepared.posture,
    };
    HumanPreparedPlayback.attach(result, body, prepared.playback);
    return result;
  }
}
