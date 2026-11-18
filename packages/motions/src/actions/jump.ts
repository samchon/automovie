import {
  AutoMovieGravity,
  minimumJerk,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
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
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { jumpAirborne } from "./jumpAirborne";
import { jumpEndpoints } from "./jumpEndpoints";
import { jumpFlight } from "./jumpFlight";
import { jumpJoints } from "./jumpJoints";
import { jumpLanding } from "./jumpLanding";
import { jumpPath } from "./jumpPath";
import { jumpPush } from "./jumpPush";
import { jumpPushEnd } from "./jumpPushEnd";
import { jumpPushPosture } from "./jumpPushPosture";
import type { jumpState } from "./jumpState";
import { jumpTakeoff } from "./jumpTakeoff";
import { prepareJumpPosture } from "./prepareJumpPosture";
import { standUpright } from "./standUpright";

/** Offset decay time of a cut out of the settled jump, seconds (a deliberate change of the whole body's action, `AutoMovieMotionHumanInterrupt.BLENDS.deliberate`). */
const BLEND: number = AutoMovieMotionHumanInterrupt.BLENDS.deliberate;

/** How far the take-off root rises above the entry root, hip heights (provisional). */
const TAKEOFF_RISE: number = 0.03;

/** How far the take-off root lies ahead of the pushing ball, hip heights (provisional). */
const TAKEOFF_AHEAD: number = 0.25;

/** The withdrawn free ankle's height above the rig origin, hip heights (provisional). */
const TUCK_HEIGHT: number = 0.3;

/** The withdrawn free ankle's distance ahead of the rig origin, hip heights (provisional). */
const TUCK_AHEAD: number = 0.1;

/**
 * A jump to a floor point: a push-off from a planted foot, a ballistic flight
 * and a two-footed landing that absorbs and rises to standing.
 *
 * The push starts from the entry's position, velocity and acceleration on
 * a quintic Hermite root path. It uses the leading planted foot in the
 * entered body's frame, lowering a heel rocker before rising about the
 * metatarsal joint. The requested heel rise is 40 degrees; the actual pitch
 * follows the body's ankle/reach rule and can be steeper. The declared floor
 * contact is the heel during that rocker, then the metatarsal joint. The
 * free ankle withdraws to 0.3 hip heights while the shoulders rise to 60
 * degrees, the arm action that contributes to takeoff velocity
 * (Ashby and Heegaard 2002, "Role of arm motion in the standing long jump",
 * J. Biomech. 35).
 *
 * The push's carried entry rates and acceleration use the existing engine
 * bases and available floor room (`jumpPush`). Its pure terminal writer is
 * shared with endpoint preparation: lowering and ordinary canonical fitting
 * supply the actual root, feet, knee planes and toes to flight, instead of
 * reconstructing a nominal 40-degree pose. Shared endpoint values do not
 * establish world COM or angular C1 across takeoff.
 *
 * Flight is ballistic in the centre of mass, the one point gravity alone
 * moves while airborne: from the apex height `apex` above take-off (0.06 hip
 * heights plus a tenth of the jump's length when absent, provisional), the
 * vertical take-off speed is `sqrt(2 g apex)`, the flight time solves the
 * centre's landing height, and the horizontal speed covers its distance in
 * that time, the closed form of a drag-free projectile (`v = d / T - g T /
 * 2`, as the engine's ballistic solvers). At each airborne instant the root
 * is placed so the body's centre of mass, read by the engine's mass model
 * from the posture there, lies on that parabola, so moving the limbs in
 * flight shifts the trunk the way it would. The free legs travel between
 * achieved endpoints with the existing sine arch of a tenth of hip height;
 * original planted and landing targets remain unchanged.
 * Requested turns follow the performance's staged authored-turn clock by
 * default. Explicit physical mode instead derives rotation from the composed
 * body's angular momentum; that conservation claim does not apply to staged
 * rotation. Both policies retain the same ballistic COM and limb goals.
 * Both feet land flat on footprints at the destination and at its height (a
 * box's top, a step; the flight's default apex then also clears that rise,
 * and an apex that does not is refused), at the body's rest
 * separation, turned out by the stance angle; the root lands 0.03 hip
 * heights low with the flight's velocity, absorbs to 0.12 hip heights low on
 * a quintic path that brings that velocity to rest over `ABSORB` seconds,
 * then rises to the upright stand ({@link standUpright}) over `RISE` seconds,
 * both scaled by the manner's tempo as the push is.
 * Planted legs are kept reachable by the shared `lowerHumanPosture` rule. The
 * push-off is drawn by `jumpPush`, the landing's places by `jumpLanding`
 * and the paths by `jumpPath`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States entry continuation, the actual heel rule, ballistic COM, landing phases, units and provisional quantities; achieved endpoint preparation is delegated to its owner.
 * @evidence contracts/development/design.md#principled-representation One action law separates authored landing/apex/turn requests from body-dependent physical endpoints and the engine's flight rotation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the action name, interrupts, parameters, phase durations and planner; shared endpoint and posture assembly have one helper owner each.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Original targets, body ROM, contact windows and flight budgets remain intact; no body-specific case, timing epsilon or alternate accepted pose is introduced.
 */
export namespace jump {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "jump";

  /** A jump's content is a take-off, a flight and a landing, so its balance is judged (`IAutoMovieMotionHumanActionLaw.physical`). */
  export const physical: boolean = true;

  /** Cancel table: once landed and settled, a jump gives way to standing or walking. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      { window: ["settled", 1], kind: "inertialize", entry: 0, blend: BLEND },
    ],
    walk: [
      { window: ["settled", 1], kind: "inertialize", entry: 0, blend: BLEND },
    ],
  };

  /** Push-off duration, seconds (provisional; take-off contact of a one-foot jump from walking). */
  export const PUSH: number = 0.3;

  /** Landing absorption duration, seconds (provisional). */
  export const ABSORB: number = 0.3;

  /** Rise to standing after the absorption, seconds (provisional). */
  export const RISE: number = 0.45;

  /**
   * Plan a jump.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When no foot is planted to push off from, or the apex is not positive or does not clear a raised landing (jumpFlight).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the physical entry and refusal; helper documentation distinguishes the raw nominal root, achieved endpoints and independent whole-body flight turn.
   * @evidence contracts/development/implementation.md#principled-implementation The same terminal heel/knee/toe producer supplies endpoint preparation and timed push. Its achieved canonical states supply both ballistic COM endpoints and root-frame free goals, replacing independently reconstructed takeoff geometry while retaining the existing minimum-jerk and sine flight paths.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read entry/support, prepare achieved endpoint values, solve COM flight, prepare the original timed push, then evaluate the three phases through their owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves original floor/prop targets, entry velocity/acceleration, ROM, contact windows and momentum acceptance. No nominal root is replaced by its lowered value inside the heel rule; no flight plant, radius projection or epsilon hides the phase seam. World COM and whole-body angular C1 at takeoff remain unproved.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two endpoint preparations add bounded canonical solves/FK per plan. Push/landing share one fixed joint prefix and lazily prepared cosine-law reach; samples still copy all prefix members, write four arm tuples and evaluate every actual plant/hip/lowering. Each free query prepares its raw shape once, reads mass-bearing FK and lends that canonical result through exact resolver admission. Proven unchanged free legs may independently survive explicit rebasing; changed dependencies/turns fit normally. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Raw endpoints and achieved COM boundaries share; their two actual COM readings borrow one local exact FK source, while timed entry-rate curves remain independent. The unchanged body's joint prefix, arm separation and minimum-knee reach prepare once; new dimensions/knee require new preparation and every current root/plant/hip remains observed. Free-query COM/display share one checked canonical source without a time key. Parent FK/projector loans share only exact prerequisites/static ROM metadata through current solves.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains body/phase geometry, two endpoints, one bounded joint prefix/reach producer, prepared push/flight closures and fixed mass demand. The local paired-endpoint FK source ends with its preparation, leaving two COM vectors. Each free posture carries only its own checked preparation; optional FK/projector loans stay synchronous and never enter the plan, token/output evidence or previous-frame history. The lowering producer retains only fixed body/knee/scalar prerequisites.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanJump.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const l: number = m.hipHeight;
    const entry: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanJump.IParams>["entry"] = context.entry;
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
    const frame: (origin: IAutoMovieVector3) => IAutoMovieMotionHumanFrame = (origin: IAutoMovieVector3): IAutoMovieMotionHumanFrame => ({
      origin: { ...origin, y: 0 },
      yaw: heading,
    });
    const planted: ("left" | "right")[] = (["left", "right"] as const).filter(
      (s: "left" | "right"): boolean => entry.feet[s].planted,
    );
    if (planted.length === 0)
      throw new HumanRefusal({
        kind: "base",
        axis: "base",
        value: null,
        reason: `a jump takes off from a planted foot, and neither is planted`,
        fix: "enter the jump from an action that leaves a foot planted, such as stand or walk",
      });
    // A symmetric double support must choose the same foot after a rigid move.
    const takeoff: "left" | "right" = jumpTakeoff(body, entry);
    const reaching: "left" | "right" = takeoff === "left" ? "right" : "left";
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
    const upright: IAutoMovieMotionHumanStandUpright.IAlignment = standUpright.of(body);
    const model: IAutoMovieResolveCenterOfMass.IModel = body.massModel;
    // Take-off and touchdown roots.
    const rootT: IAutoMovieVector3 = HumanFrame.point(frame(ball), {
      x: 0,
      y: root0.y + TAKEOFF_RISE * l,
      z: TAKEOFF_AHEAD * l,
    });
    const landed: jumpLanding.ILanding = jumpLanding.of(
      body,
      to,
      heading,
      rise,
      upright.lean,
    );
    const landing: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement> = landed.feet;
    const landingYaw: Record<"left" | "right", number> = {
      left: HumanFoot.heading(landing.left.rotation),
      right: HumanFoot.heading(landing.right.rotation),
    };
    const landingContact: Record<"left" | "right", IAutoMovieVector3> = {
      left: HumanFoot.offset(body, "left", "mtp"),
      right: HumanFoot.offset(body, "right", "mtp"),
    };
    const rootL: IAutoMovieVector3 = landed.touched;
    const rootS: IAutoMovieVector3 = landed.stood;
    const rootA: IAutoMovieVector3 = landed.absorbed;

    // Body-frame placements at take-off and touchdown, for the flight.
    const tuck: IAutoMovieVector3 = {
      x:
        (reaching === "left" ? 1 : -1) *
        Math.abs(body.rest.get(`${reaching}Foot`)!.x),
      y: TUCK_HEIGHT * l,
      z: TUCK_AHEAD * l,
    };
    const knee: jumpPush.IProps["knee"] = jumpAirborne.knee(body, heading, [
      heading, supportHeading, landingYaw.left, landingYaw.right,
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
    const ends: jumpEndpoints.IEnds = jumpEndpoints.of(endProps, rootT, rootL, landing);
    const startState: jumpState.IState = ends.start;
    const endState: jumpState.IState = ends.end;

    // Ballistics and free goals inherit these same achieved endpoint poses.
    const massBones: Set<AutoMovieHumanoidBone> = new Set();
    for (const segment of model.segments) massBones.add(segment.bone);
    const readMassBones: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body, massBones);
    const { takeoff: comT, landing: comL }: { takeoff: IAutoMovieVector3; landing: IAutoMovieVector3 } = ((): { takeoff: IAutoMovieVector3; landing: IAutoMovieVector3 } => {
      const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
      return {
        takeoff: resolveAutoMovieCenterOfMass.place(model, readMassBones(startState.pose, read())),
        landing: resolveAutoMovieCenterOfMass.place(model, readMassBones(endState.pose, read())),
      };
    })();
    const flight: jumpFlight.IFlight = jumpFlight.solve(
      comT,
      comL,
      context.params.apex,
      l,
      rise,
    );
    const { vy, T, launch, land }: jumpFlight.IFlight = flight;

    // A manner retimes what the performer does, not the flight gravity fixes.
    const tempo: number = AutoMovieMotionManner.of(
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

    const pushRoot: ReturnType<typeof jumpPath.prepare> =
      jumpPath.prepare(root0, v0, rootT, launch, P, entry.acceleration);
    const absorbRoot: ReturnType<typeof jumpPath.prepare> =
      jumpPath.prepare(rootL, land, rootA, { x: 0, y: 0, z: 0 }, absorb);
    const riseRoot: ReturnType<typeof jumpPath.prepare> =
      jumpPath.prepare(rootA, { x: 0, y: 0, z: 0 }, rootS, { x: 0, y: 0, z: 0 }, rising);
    const rootAt: (t: number) => IAutoMovieVector3 = (t: number): IAutoMovieVector3 =>
      t <= settled ? absorbRoot(t - touchdown) : riseRoot(t - settled);

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
    const push: jumpPush.IPush = jumpPush.of(pushProps);
    const writers: NonNullable<Parameters<typeof jumpPushPosture>[4]> = {
      joints: jumpJoints.prepare(body, upright.joints),
      lower: lowerHumanPosture.prepare(body),
    };
    const pushedAt: (seconds: number, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]) => IAutoMovieMotionHumanPosture = (seconds: number, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): IAutoMovieMotionHumanPosture =>
      jumpPushPosture(pushProps, push, seconds, resolution, writers);
    const shape: jumpAirborne.IShape = { body, takeoff, heading, start: startState, end: endState };
    const landedAt: (t: number, resolution?: Parameters<typeof prepareHumanPoseResolution>[0]) => IAutoMovieMotionHumanPosture = (
      t: number, resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    ): IAutoMovieMotionHumanPosture => {
      const root: IAutoMovieVector3 = rootAt(t);
      const arms: number = jumpJoints.LANDING * (1 - minimumJerk.share((t - touchdown) / (absorb + rising)));
      const joints: IAutoMovieMotionHumanPosture["joints"] = writers.joints(arms, arms);
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
      for (const side of ["left", "right"] as const)
        limbs[`${side}Leg`] = {
          point: landing[side].ankle,
          rotation: landing[side].rotation,
          bend: knee(root, side, landingYaw[side]),
          planted: true,
          contact: { ...landingContact[side] },
        };
      return writers.lower({ root, yaw: heading, pitch: 0, roll: 0, joints, limbs }, resolution);
    };
    const prepared: prepareJumpPosture.IConstruction = prepareJumpPosture(
      body, model, shape,
      { from: P, to: touchdown, duration, flightSeconds: T, centre: comT, launch, settled },
      context.params.rotation, pushedAt, landedAt,
    );
    // The takeoff impulse and landing absorption end at settled. The remaining
    // ascent follows the authored return curve from zero velocity.
    return { duration, events, contacts, physicalWindow: { from: 0, to: settled }, ...prepared.declared, posture: prepared.posture };
  }
}
