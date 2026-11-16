import {
  AutoMovieGravity,
  minimumJerk,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { tags } from "typia";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanUnit } from "../law/HumanUnit";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { jumpAirborne } from "./jumpAirborne";
import { jumpFlight } from "./jumpFlight";
import { jumpEndpoints } from "./jumpEndpoints";
import { jumpJoints } from "./jumpJoints";
import { jumpLanding } from "./jumpLanding";
import { jumpPath } from "./jumpPath";
import { jumpPush } from "./jumpPush";
import type { jumpPushEnd } from "./jumpPushEnd";
import { jumpPushPosture } from "./jumpPushPosture";
import type { jumpState } from "./jumpState";
import { jumpTakeoff } from "./jumpTakeoff";
import { prepareJumpFlight } from "./prepareJumpFlight";
import { standUpright } from "./standUpright";

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
 * Both feet land flat on footprints at the destination and at its height (a
 * box's top, a step; the flight's default apex then also clears that rise,
 * and an apex that does not is refused), at the body's rest
 * separation, turned out by the stance angle; the root lands 0.03 hip
 * heights low with the flight's velocity, absorbs to 0.12 hip heights low on
 * a quintic path that brings that velocity to rest over `ABSORB` seconds,
 * then rises to the upright stand ({@link standUpright}) over `RISE` seconds.
 * Planted legs are kept reachable by `resolveHumanPosture.lower`. The
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
  export const name: HumanActionName = "jump";

  /** Cancel table: once landed and settled, a jump gives way to standing or walking. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [
      { window: ["settled", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
    walk: [
      { window: ["settled", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
  };

  /**
   * Authored landing, apex, airborne turns and manner.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member documents world units, the landing support, rotation direction and manner semantics.
   * @evidence contracts/development/design.md#principled-representation Spatial landing and apex requests are distinct from optional support identity and signed flight turns.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Contains only authored jump choices; achieved endpoint geometry and ballistic time are derived.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No cached pose, physical tolerance, special population switch or caller-supplied solver timing is exposed.
   */
  export interface IParams {
    /** The point to land on, world metres: its height is the landing surface's, the floor's 0, a box's top or a step's. */
    to: IAutoMovieVector3;

    /** The prop whose top is landed on, its subject id, so the feet bear on it; the floor when absent. */
    on?: string;

    /** Apex height of the flight above take-off, metres; positive. */
    apex?: number & tags.ExclusiveMinimum<0> & HumanUnit<"m">;

    /**
     * Turns the body makes in flight (#3428): somersaults about the axis
     * across the heading (`forward` or `backward`) or about the axis along it
     * (`left` or `right`, a side salto), and twists about the body's long
     * axis, signed by the right-hand rule about up. The flight turns by the
     * angular momentum that lands these turns on the composed body's shape
     * (`HumanPerformanceFlight`), so a tuck laid over the flight turns it
     * faster. No turn when absent.
     */
    rotation?: jumpAirborne.IRotation;

    /** How it is performed: the manner's tempo scales the push-off, the absorption and the rise, never the flight, which gravity fixes; neutral when absent. */
    manner?: AutoMovieMotionManner.IManner;
  }

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
   * @evidence contracts/development/implementation.md#efficient-algorithms Two endpoint preparations add bounded canonical solves/FK per plan. Each free-flight query prepares its existing raw shape once, reads only mass-bearing FK and transfers the same canonical solution to an eligible displayed consumer through resolver-owned exact admission. Changing overlays or turns retain ordinary solving; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Raw endpoints and achieved COM boundaries are shared by their phase consumers; timed entry-rate curves remain independent. A free query's own COM and translated displayed demands share one checked canonical preparation without a time-keyed result cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains body/phase geometry, two endpoint states, prepared push/flight closures and a bounded mass-bone set. Each returned free posture carries only its own checked preparation; no previous-frame state, reader, external handle or global pose cache is added here.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const m: IHumanBody["measure"] = body.measure;
    const l: number = m.hipHeight;
    const entry: IHumanActionContext<IParams>["entry"] = context.entry;
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
    const frame: (origin: IAutoMovieVector3) => HumanFrame.IFrame = (origin: IAutoMovieVector3): HumanFrame.IFrame => ({
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
    const support: HumanFoot.IPlacement = {
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
    const flat: HumanFoot.IPlacement =
      supportPitch > 0
        ? HumanFoot.pivot(body, takeoff, "heel", heel, supportHeading, 0)
        : support;
    const ball: IAutoMovieVector3 = HumanFoot.point(body, takeoff, "mtp", flat);
    const upright: standUpright.IAlignment = standUpright.of(body);
    const model: resolveAutoMovieCenterOfMass.IModel = body.massModel;
    // Take-off and touchdown roots.
    const rootT: IAutoMovieVector3 = HumanFrame.point(frame(ball), {
      x: 0,
      y: root0.y + 0.03 * l,
      z: 0.25 * l,
    });
    const landed: jumpLanding.ILanding = jumpLanding.of(
      body,
      to,
      heading,
      rise,
      upright.lean,
    );
    const landing: Record<"left" | "right", HumanFoot.IPlacement> = landed.feet;
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
      y: 0.3 * l,
      z: 0.1 * l,
    };
    const knee: jumpPush.IProps["knee"] = jumpAirborne.knee(body, heading);

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
    const comT: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(model, poseBones(body, startState.pose));
    const comL: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(model, poseBones(body, endState.pose));
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
    const touchdown: number = P + T;
    const settled: number = touchdown + ABSORB * tempo;
    const duration: number = settled + RISE * tempo;
    const bearing: IHumanContactWindow["support"] =
      context.params.on === undefined
        ? { kind: "ground" }
        : { kind: "prop", subject: context.params.on };
    const events: IAutoMovieMotionEvent[] = [
      { name: "takeoff", share: P / duration },
      { name: "apex", share: (P + vy / AutoMovieGravity.STANDARD) / duration },
      { name: "touchdown", share: touchdown / duration },
      { name: "settled", share: settled / duration },
    ];
    const contacts: IHumanContactWindow[] = [
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
      jumpPath.prepare(rootL, land, rootA, { x: 0, y: 0, z: 0 }, ABSORB);
    const riseRoot: ReturnType<typeof jumpPath.prepare> =
      jumpPath.prepare(rootA, { x: 0, y: 0, z: 0 }, rootS, { x: 0, y: 0, z: 0 }, RISE);
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
    const pushedAt: (seconds: number) => IHumanPosture = (seconds: number): IHumanPosture =>
      jumpPushPosture(pushProps, push, seconds);
    const shape: jumpAirborne.IShape = { body, takeoff, heading, start: startState, end: endState };
    const flightPosture: ReturnType<typeof prepareJumpFlight> =
      prepareJumpFlight(body, model, shape);

    const turning: jumpAirborne.ITurning = jumpAirborne.turning(
      context.params.rotation,
      P,
      touchdown,
      duration,
    );

    return {
      duration,
      events,
      contacts,
      ...turning.declared,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        if (t <= P) return pushedAt(t);
        if (t <= touchdown) {
          const u: number = t - P;
          const centre: IAutoMovieVector3 = {
            x: comT.x + launch.x * u,
            y: comT.y + launch.y * u - 0.5 * AutoMovieGravity.STANDARD * u * u,
            z: comT.z + launch.z * u,
          };
          return turning.turned(flightPosture(u / T, centre), t);
        }
        const root: IAutoMovieVector3 = rootAt(t);
        const arms: number = 30 * (1 - minimumJerk((t - touchdown) / (ABSORB + RISE)).s);
        const joints: IHumanPosture["joints"] = jumpJoints(body, upright.joints, arms, arms);
        const limbs: IHumanPosture["limbs"] = {};
        for (const side of ["left", "right"] as const)
            limbs[`${side}Leg`] = {
              point: landing[side].ankle,
              rotation: landing[side].rotation,
              bend: knee(root, side, landingYaw[side]),
              planted: true,
              contact: { ...landingContact[side] },
            };
        return resolveHumanPosture.lower(body, {
          root,
          yaw: heading,
          pitch: 0,
          roll: 0,
          joints,
          limbs,
        });
      },
    };
  }
}
