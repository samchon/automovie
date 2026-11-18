import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanKnockdown,
  IAutoMovieMotionHumanLean,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanRoot } from "../compose/AutoMovieMotionHumanRoot";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanFrame } from "../posture/HumanFrame";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { StrikingTarget } from "../striking/StrikingTarget";
import { KnockdownFloor } from "./KnockdownFloor";
import { ReactionSource } from "./ReactionSource";

/**
 * A knockdown: the legs give way and the body goes down away from the blow,
 * sitting onto the floor and falling back to lie supine.
 *
 * The collapse is a buckle, not a dive: the knees and hips fold while the
 * pelvis goes back and down behind the feet (as in the stepping-response
 * failures of Maki and McIlroy 1997, where a push too large for one step
 * ends in a fall), the seat meets the floor at 0.45 s, about the free-fall
 * time of the pelvis from its height slowed by the buckling legs, and the
 * trunk rolls back until the back rests on the floor by 1.1 s, the arms
 * trailing. The feet stay where they stood until the seat lands; then the
 * seat stays where it landed and the heels slide out as the legs straighten.
 *
 * Each pose rests on the floor without penetrating it: the root's height is
 * solved so the lowest point of the body's own collision shapes touches the
 * floor. The seat and the lie are fitted to the body the same way: the knee
 * at the seat is the one that puts the feet on the floor the seat sits on,
 * and the lying arm's extension and elbow are the ones that lay the arm on
 * the floor beside the body, so any stature sits and lies on the floor
 * exactly. The body goes down away from the blow (the `from` target), turned
 * so its back falls toward that direction.
 *
 * The trunk's recline and the hip's fold at the seat are provisional
 * readings; detailed falls derived from the Euphoria behaviours belong to
 * tier 2 of #3201.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the buckle, its timing, the floor rule and which proportions are provisional.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, an empty cancel table, parameters and a pure plan of postures in world metres and seconds with seat and lie contacts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the law's name/cancel table, parameters, timing, plan and exact floor rest; support/floor intervals also bind that same native measurement through prepareRest for their unchanged body.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, contact-window, target and collider types; the floor height comes from each body's own shapes.
 */
export namespace knockdown {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "knockdown";

  /** A knockdown's content is a staged fall, so its balance is judged (`IAutoMovieMotionHumanActionLaw.physical`). */
  export const physical: true = true;

  /** Cancel table: none; a knocked-down performer stays down for the count. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {};

  /** A reaction interrupts whatever the body was doing, at any instant, as a reflex. */
  export const accepts: IAutoMovieMotionHumanActionLaw["accepts"] = {
    any: [AutoMovieMotionHumanInterrupt.row("anytime", "reflex")],
  };

  /** Seat contact, seconds. */
  export const SEATED: number = 0.45;

  /** Back on the floor, seconds. */
  export const DOWN: number = 1.1;

  /**
   * The root height that rests a posture on the floor: its lowest collision
   * point at zero.
   *
   * @param body The body.
   * @param posture The posture, its root height ignored.
   * @param resolution Optional exact FK reader/supplier borrowed from the current synchronous body's planning operation.
   * @param projection Optional genuine same-body ROM metadata preparation borrowed from that operation; every current joint remains projected.
   * @returns The root height, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule, the ignored input and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation Forward kinematics of the posture with its root at zero height, then the lowest point of every collision shape's exact world bounds (`physicalShapeBounds`), negated.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One trunk resolution and one pass over the shapes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None; the height follows from the body's own shapes.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in bones and shapes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates the unchanged floor measurement and optional exact FK/projector loans to KnockdownFloor.rest; scalar FK checks and genuine projector provenance share only transform prerequisites/static ROM metadata while each actual posture and joint is still read normally.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains neither geometry nor optional FK/projector loans, which stay with their synchronous planning caller through return or throw.
   */
  export function rest(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): number {
    return KnockdownFloor.rest(body, posture, resolution, projection);
  }

  /**
   * Prepare this body's exact floor rest for a support or floor interval.
   *
   * @param body The canonical body with unchanged rig, rest geometry and profile throughout the owning plan.
   * @returns The native floor reader accepting each current posture and optional synchronous FK/ROM loans; root Y is ignored and height is in metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed-body premise, changing posture/metadata inputs, root-Y-zero convention, metre output and plan-owned reader lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to KnockdownFloor.prepareRest, preserving complete current trunk admission and the exact lowest-collider floor law used by rest.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One direct function wrapper exposes the existing floor owner's prepared reader; collider selection, placement and numeric bounds keep one owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Changes no posture, collider, contact, bound or tolerance, and provides no caller-authored posed map, cached floor or success flag.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant facade work; the native owner binds fixed demand/profile entries once while every query retains full current admission/fits, required FK, placement and exact shape bounds. Runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Explicit unchanged body/rig/profile establish only static selection equivalence. Each actual posture and current-call FK/ROM source reaches the native owner normally, with original dependency/provenance checks and no fitted result reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the native reader and its bounded body/profile metadata until its plan or interval releases it. Invocation FK/ROM loans, posed maps and scalar heights are never retained in that reader or returned data.
   */
  export function prepareRest(body: IAutoMovieMotionHumanBody): ReturnType<typeof KnockdownFloor.prepareRest> {
    return KnockdownFloor.prepareRest(body);
  }

  /**
   * Plan a knockdown.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the lying time is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States its input, its plan and its refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Overlapping minimum-jerk sit and roll-back profiles over one pose function, the root height solved each posture by the floor rest and the root's travel by the pose's own ankles and hips, so the feet and then the seat stay in place on any body.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fits the body and reads the blow's heading once, then evaluates each posture in closed form.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A negative lying time throws; the knee and the lying arm are solved on the body's shapes instead of stated, and the recline and the hip's fold are named provisional values.
   * @evidence contracts/development/implementation.md#efficient-algorithms Keeps the original independent root, trunk and joint primitives, their phase/fold reads and three 16-step fit bisections. Fixed named phase interval preparation and demanded floor geometry avoid repeated prerequisites without removing actual measures or claiming measured speedup.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The root writer lends only current composition FK/ROM metadata to its actual floor measure. A planning IIFE shares exact FK/projector prerequisites across standing then seated reads, with every joint still projected. Entry yaw is read at the original offset expression sites and every original phase call remains observable through the clock's guarded live callback.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan holds fitted angles, one fold measure reader bound to its body, two numeric measures, fixed phase preparation and one heading cleared on settle. Fit/IIFE loans end before plan return. Runtime loans belong only to the current root-writer call and never enter its raw posture, measures or callbacks; no sampled-pose history is retained.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKnockdown.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const lie: number = context.params.seconds ?? 1;
    if (!(lie >= 0)) throw new Error("A knockdown lies a non-negative time");
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(
      DOWN + lie,
      [
        { name: "rolling", seconds: ROLLING * SEATED },
        { name: "seated", seconds: SEATED },
        { name: "stroke", seconds: SEATED },
        { name: "down", seconds: DOWN },
        { name: "relax", seconds: DOWN },
      ],
    );
    const duration: number = clock.duration;
    const sit: (seconds: number) => number = AutoMovieMotionClock.prepare(
      clock, AutoMovieMotionClock.START, "seated",
    ).progress;
    const back: (seconds: number) => number = AutoMovieMotionClock.prepare(
      clock, "rolling", "down",
    ).progress;

    // The angles this body needs to rest on the floor, and where its ankles
    // and hips are along its heading standing and seated: the feet stay where
    // they stood until the seat lands, and the seat stays where it landed.
    const fitted: KnockdownFloor.IFit = KnockdownFloor.fit(body, back(SEATED));
    const measure: ReturnType<typeof KnockdownFloor.prepareMeasure> =
      KnockdownFloor.prepareMeasure(body);
    const at: (
      seconds: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ) => KnockdownFloor.IMeasure = (
      seconds: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): KnockdownFloor.IMeasure => measure(
      KnockdownFloor.fold(fitted, sit(seconds), back(seconds)),
      resolution,
      projection,
    );
    const [standing, seated]: readonly [KnockdownFloor.IMeasure, KnockdownFloor.IMeasure] =
      ((): readonly [KnockdownFloor.IMeasure, KnockdownFloor.IMeasure] => {
        const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
        const projection: ReturnType<typeof prepareHumanPostureProjection> = prepareHumanPostureProjection(body);
        return [at(0, resolution, projection), at(SEATED, resolution, projection)];
      })();

    // The heading that faces the blow, so the back falls away from it.
    let cached: number | undefined;
    const heading: () => number = (): number => {
      if (cached !== undefined) return cached;
      const away: IAutoMovieVector3 = AutoMovieMotionHumanTarget.away(
        ReactionSource.at(
          context,
          context.params.from,
          context.start - StrikingTarget.LOOK,
          entry,
          AutoMovieMotionHumanTarget.DEFAULTS.ahead,
        ),
        entry.root,
        entry.yaw,
      );
      cached = (Math.atan2(-away.x, -away.z) * 180) / Math.PI;
      return cached;
    };

    const flat: (yaw: number, forward: number) => IAutoMovieVector3 = (yaw: number, forward: number): IAutoMovieVector3 =>
      HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw },
        { x: 0, y: 0, z: forward },
      );
    return composeAutoMovieMotionHumanAction({
      base: {
        ...AutoMovieMotionHumanBase.still(
          duration,
          {
            root: entry.root,
            yaw: entry.yaw,
            pitch: 0,
            roll: 0,
            joints: {},
            limbs: {},
          },
          [
            {
              part: "seat",
              kind: "seat",
              from: SEATED / duration,
              to: DOWN / duration,
              support: { kind: "ground" },
            },
            {
              part: "back",
              kind: "lie",
              from: DOWN / duration,
              to: 1,
              support: { kind: "ground" },
            },
          ],
        ),
        settle: (): void => {
          cached = undefined;
        },
      },
      clock,
      primitives: [
        // The pelvis goes back and down behind the feet until the seat
        // lands, the body turning to face the blow; then the seat stays and
        // the heels slide out as the back rolls down. The height rests the
        // pose of each second on the floor.
        {
          channels: ["root"],
          reads: ["root"],
          from: 0,
          to: duration,
          write: (
            posture: IAutoMovieMotionHumanPosture,
            seconds: number,
            _before?: IAutoMovieMotionHumanPrimitive.Reader,
            resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
            projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
          ): IAutoMovieMotionHumanPosture => {
            const turn: number = angle(heading() - entry.yaw);
            const now: KnockdownFloor.IMeasure = at(seconds, resolution, projection);
            const landed: boolean = seconds >= SEATED;
            const world: IAutoMovieVector3 = Vector3.add(
              Vector3.subtract(
                flat(entry.yaw, standing.ankle),
                flat(
                  entry.yaw + turn * sit(seconds),
                  (landed ? seated : now).ankle,
                ),
              ),
              flat(entry.yaw + turn, landed ? seated.hips - now.hips : 0),
            );
            return AutoMovieMotionHumanRoot.place(posture, {
              point: {
                ...HumanFrame.local(
                  { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
                  world,
                ),
                y: now.floor - entry.root.y,
              },
              yaw: turn * sit(seconds),
            });
          },
        },
        AutoMovieMotionHumanLean.tilt({
          from: 0,
          to: duration,
          angles: (seconds: number): IAutoMovieMotionHumanLean.IAngles => ({
            pitch: KnockdownFloor.fold(fitted, sit(seconds), back(seconds)).pitch,
            roll: 0,
          }),
        }),
        AutoMovieMotionHumanJoints.add({
          channels: ["head", "leftLeg", "rightLeg", "leftArm", "rightArm"],
          from: 0,
          to: duration,
          delta: (seconds: number): IAutoMovieMotionHumanJoints.Angles =>
            KnockdownFloor.fold(fitted, sit(seconds), back(seconds)).joints,
        }),
      ],
    });
  }

  /** When the trunk starts rolling back, as a share of the time to the seat. */
  const ROLLING: number = 0.6;

  /** A heading difference wrapped into (-180, 180]. */
  function angle(degrees: number): number {
    return ((((degrees + 180) % 360) + 360) % 360) - 180;
  }
}
