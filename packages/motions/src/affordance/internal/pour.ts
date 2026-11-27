import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieHumanEffectorPointLimit,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPour,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { motionHumanHeld } from "../../compose/internal/motionHumanHeld";
import { composeMotionHumanAction } from "../../compose/internal/composeMotionHumanAction";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { StrikingRoll } from "../../striking/internal/StrikingRoll";
import { pourClock } from "./pourClock";

/*
 * A registered, stationary-base pour. Bring the held source above a fixed
 * recipient, tip about its rim lip, transfer, right it and retreat. Register
 * `pour` in `AutoMovieMotionHumanPerformance` and call `registered(pour.name, params)`.
 * `flowStart` and `flowEnd` delimit the authored transfer cue.
 * EPIC-KITCHENS-100 provides observational action context (Damen et al., 2021,
 * https://arxiv.org/abs/2006.13256). Angles and phase lengths here are staged
 * inputs. The liquid query gives the volume cue for one action instance.
 */
export namespace pour {
  /*
   * Registered action name.
   */
  export const name: string = "pour";
  /*
   * The whole transfer plays together, without an offered cut.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {};

  /*
   * Plan the held source's transport, pivot, transfer hold and return.
   * Parameter context: Entry with both feet planted and the named source in hand.
   * Returns: The action plan with its original grip retained.
   * For invalid timing, geometry, volumes, support or
   * grip, and for a pose that misses the sampled mouth or tilt bound.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPour.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const params: IAutoMovieMotionHumanPour.IParams = context.params;
    validateVolumes(params);
    const clock: IAutoMovieMotionClock = pourClock(params, context.tempo ?? 1);
    if (
      context.carrier !== undefined ||
      context.entry.base.kind !== "standing" ||
      !context.entry.supports.some(
        (support: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
          support.part === "leftFoot" && support.support.kind === "ground",
      ) ||
      !context.entry.supports.some(
        (support: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
          support.part === "rightFoot" && support.support.kind === "ground",
      )
    )
      throw new AutoMovieMotionHumanRefusal({
        kind: "base",
        axis: "base",
        value: context.entry.base.kind,
        reason: "pouring needs a standing entry with both feet supported",
        fix: "stage the pour after standing with the source in hand",
      });

    const side: AutoMovieHumanSide = params.hand ?? "right";
    const held: IAutoMovieMotionHumanHeld.IHeld = motionHumanHeld(
      context,
      side,
      params.source,
    );
    const source: IAutoMovieMotionHumanProp = context.prop(params.source).prop;
    const target: IAutoMovieMotionHumanPropReader = context.prop(params.target);
    const rim: IAutoMovieAffordance | undefined = rimOf(source);
    if (
      source.fixed === true ||
      source.motion !== undefined ||
      source.point !== undefined ||
      (source.hasArticulations ?? source.articulate !== undefined) ||
      rim === undefined
    )
      throw vesselRefusal(
        "source",
        source.subject,
        "the source needs a rigid rim lip and a movable body",
      );
    const opening: IPlanOpening = openingOf(
      source.subject,
      target,
      context.start,
    );
    const lip: IAutoMovieMotionHumanHeld.IPointResult =
      motionHumanHeld.point(held, "lip");
    const bones: ReturnType<typeof poseBones> = poseBones(
      context.body,
      context.entry.pose,
    );
    const wrist: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
    const bend: IAutoMovieVector3 = bones.get(`${side}LowerArm`)!.worldPosition;
    const lipOffset: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      HumanHand.offset(context.body, side, "grip").point,
      lip.point,
    );
    const initialUp: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      wrist.worldRotation,
      lip.direction,
    );
    const sourceRotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      wrist.worldRotation,
      held.frame.rotation,
    );
    const radial: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(sourceRotation, {
      x: rim.frame.translation.x,
      y: 0,
      z: rim.frame.translation.z,
    });
    const axisVector: IAutoMovieVector3 = AutoMovieEngineVector3.cross(UP, radial);
    if (
      !(
        AutoMovieEngineVector3.dot(initialUp, UP) >= UPRIGHT &&
        AutoMovieEngineVector3.length(axisVector) >= 0.005
      )
    )
      throw vesselRefusal(
        "source",
        params.source,
        "the held lip needs an upright axis and a radial rim",
      );
    const axis: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(axisVector);
    const pivot: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      opening.center,
      AutoMovieEngineVector3.scale(UP, params.gap),
    );
    const tiltAt = (seconds: number): number =>
      params.tilt *
      (clock.progress("tipStart", "flowStart", seconds) -
        clock.progress("flowEnd", "retreatStart", seconds));

    // The lip on its pivot and the vessel's tilt are the pour's outcome, so
    // the hand holds them as hard task limits, not as an attitude the arm
    // may trade away: the lip and a point a hand's length up the vessel's
    // axis from it, each in the hand's frame, kept within the held-tool
    // bound (`StrikingRoll.MISS`) of where the asked frame puts them. Within
    // that bound the lip stays inside the 25 mm the check below admits, and
    // the axis within asin(2 MISS / hand) of the asked tilt, under the
    // check's 10 degrees for any hand longer than 0.12 m.
    const limits: IAutoMovieHumanEffectorPointLimit[] = [
      lipOffset,
      AutoMovieEngineVector3.add(
        lipOffset,
        AutoMovieEngineVector3.scale(lip.direction, context.body.measure.hand),
      ),
    ].map(
      (contact: IAutoMovieVector3): IAutoMovieHumanEffectorPointLimit => ({
        contact,
        bound: StrikingRoll.MISS,
      }),
    );

    // One trajectory carries the source between the entry wrist and the lip
    // pivot. On the pivot the planner's contact site is the lip itself.
    const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
      start: 0,
      ready: clock.at("tipStart"),
      relax: clock.at("retreatStart"),
      end: clock.duration,
    };
    const composed: IAutoMovieMotionHumanActionPlan =
      composeMotionHumanAction({
        base: AutoMovieMotionHumanBase.under(context, clock.duration),
        clock,
        contact: "flowStart",
        primitives: [
          AutoMovieMotionHumanArm.carried({
            body: context.body,
            side,
            from: 0,
            to: clock.duration,
            span,
            // Every stage is the law's own, lengthened by a slower tempo.
            together: AutoMovieMotionHumanArm.together(
              context.handover,
              true,
              context.tempo,
            ),
            rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
            weight: (seconds: number): number =>
              clock.envelope(
                ["start", "tipStart"],
                ["retreatStart", "end"],
                seconds,
              ),
            goal: (
              _posture: IAutoMovieMotionHumanPosture,
              seconds: number,
            ): IAutoMovieHumanLimbGoal => {
              const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
                AutoMovieEngineQuaternion.fromAxisAngle(axis, tiltAt(seconds)),
                wrist.worldRotation,
              );
              return {
                point: AutoMovieEngineVector3.subtract(
                  pivot,
                  AutoMovieEngineQuaternion.rotateVector(rotation, lipOffset),
                ),
                rotation,
                contact: lipOffset,
                limits,
                bend,
              };
            },
          }),
        ],
      });

    // Read the prepared poses at stage boundaries and midpoints. The lip's
    // projection must stay inside the circular opening while poised above it.
    const keys: number[] = [
      "tipStart",
      "flowStart",
      "flowEnd",
      "retreatStart",
    ].map(clock.at);
    for (let i: number = 0; i < 2 * keys.length - 1; ++i) {
      const before: number = keys[Math.floor(i / 2)]!;
      const seconds: number =
        i % 2 === 0 ? before : (before + keys[(i + 1) / 2]!) / 2;
      const fitted: IAutoMovieResolvedBone = poseBones(
        context.body,
        resolveHumanPosture(context.body, composed.posture(seconds)),
      ).get(`${side}Hand`)!;
      const point: IAutoMovieVector3 = AutoMovieEngineVector3.add(
        fitted.worldPosition,
        AutoMovieEngineQuaternion.rotateVector(fitted.worldRotation, lipOffset),
      );
      const delta: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(point, opening.center);
      const up: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
        fitted.worldRotation,
        lip.direction,
      );
      const expected: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
        AutoMovieEngineQuaternion.fromAxisAngle(axis, tiltAt(seconds)),
        initialUp,
      );
      if (
        !(
          Math.hypot(delta.x, delta.z) <= opening.radius &&
          AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(point, pivot)) <= 0.025 &&
          AutoMovieEngineVector3.dot(up, expected) >= TIP_ALIGNMENT
        )
      )
        throw new AutoMovieMotionHumanRefusal({
          kind: "reach",
          axis: "target",
          value: params.target,
          reason: `the fitted lip misses the opening or tilt at ${seconds.toFixed(2)} seconds`,
          fix: "bring the fixed recipient nearer or reduce the tilt and adjust the entry grip",
        });
    }
    return {
      ...composed,
      contacts: [...composed.contacts, motionHumanHeld.grip(held)],
      holds: [motionHumanHeld.hold(context, held)],
    };
  }

  /*
   * Sample the authored liquid balance. Use the pour instance's plan so the
   * interval follows its clock after any performance tempo scaling.
   * Parameter params: The authored amounts used to plan the pour.
   * Parameter plan: The pour instance's duration and events.
   * Parameter seconds: Finite seconds from the plan's start, clamped outside flow.
   * Returns: Volumes remaining in both vessels and cumulative overflow, in
   * millilitres.
   * For invalid volumes, time or flow events.
   */
  export function liquid(
    params: IAutoMovieMotionHumanPour.IParams,
    plan: Pick<IAutoMovieMotionHumanActionPlan, LiquidPlan>,
    seconds: number,
  ): IAutoMovieMotionHumanPour.ILiquid {
    validateVolumes(params);
    const start: number =
      plan.duration *
      (plan.events.find(
        (event: IAutoMovieMotionEvent): boolean => event.name === "flowStart",
      )?.share ?? NaN);
    const end: number =
      plan.duration *
      (plan.events.find(
        (event: IAutoMovieMotionEvent): boolean => event.name === "flowEnd",
      )?.share ?? NaN);
    if (
      !(
        start >= 0 &&
        end > start &&
        end <= plan.duration
      )
    )
      throw new AutoMovieMotionHumanRefusal({
        kind: "parameter",
        axis: "time",
        value: seconds,
        reason:
          "liquid sampling needs a finite time and ordered flow events from a pour plan",
        fix: "give action-relative seconds and the corresponding pour plan",
      });
    const amount: number =
      params.transferMl *
      Math.max(0, Math.min(1, (seconds - start) / (end - start)));
    const caught: number = Math.min(
      amount,
      params.capacityMl - params.targetMl,
    );
    return {
      sourceMl: params.sourceMl - amount,
      targetMl: params.targetMl + caught,
      spillMl: amount - caught,
    };
  }
}

/*
 * Upright admission allows five degrees of staged placement error.
 */
const UPRIGHT: number = Math.cos((5 * Math.PI) / 180);
/*
 * Minimum axis alignment at the sampled tilted poses, within 10 degrees.
 */
const TIP_ALIGNMENT: number = Math.cos((10 * Math.PI) / 180);
/*
 * World vertical for the stationary vessel and the gravity cue.
 */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/*
 * Admit finite quantities before arithmetic or planning.
 */
function validateVolumes(params: IAutoMovieMotionHumanPour.IParams): void {
  if (
    !(
      params.transferMl > 0 &&
      params.transferMl <= params.sourceMl &&
      params.targetMl >= 0 &&
      params.capacityMl > 0 &&
      params.targetMl <= params.capacityMl
    )
  )
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "transferMl",
      value: params.transferMl,
      reason:
        "the pour needs finite volumes, enough liquid in the source and a recipient filled no higher than its capacity",
      fix: "supply the initial fills and capacity in millilitres and discharge at most the available source volume",
    });
}

/*
 * Read the stationary recipient's upright circular opening from its centre and
 * rim.
 */
function openingOf(
  source: string,
  receiver: IAutoMovieMotionHumanPropReader,
  seconds: number,
): IOpeningOfResult {
  const target: IAutoMovieMotionHumanProp = receiver.prop;
  const mouth: IAutoMovieAffordance | undefined = target.affordances?.find(
    (site: IAutoMovieAffordance): boolean =>
      site.id === "mouth" && site.kind === "socket" && site.rides === undefined,
  );
  const edge: IAutoMovieAffordance | undefined = rimOf(target);
  if (
    source === target.subject ||
    target.fixed !== true ||
    target.motion !== undefined ||
    target.worn !== undefined ||
    target.mounted !== undefined ||
    target.point !== undefined ||
    (target.hasArticulations ?? target.articulate !== undefined) ||
    mouth === undefined ||
    edge === undefined
  )
    throw vesselRefusal(
      "target",
      target.subject,
      "the distinct recipient needs a fixed rigid mouth socket and a rim lip",
    );
  const frame: IAutoMovieRigidTransform = receiver.frame(seconds);
  const up: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    AutoMovieEngineQuaternion.multiply(frame.rotation, mouth.frame.rotation),
    UP,
  );
  const rim: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
    edge.frame.translation,
    mouth.frame.translation,
  );
  const radius: number = Math.hypot(rim.x, rim.z);
  if (
    !(
      AutoMovieEngineVector3.dot(up, UP) >= UPRIGHT &&
      Math.abs(rim.y) <= 0.005 &&
      radius >= 0.005 &&
      radius <= 0.15
    )
  )
    throw vesselRefusal(
      "target",
      target.subject,
      "the recipient needs an upright circular opening with a rim 5 to 150 mm from its mouth centre",
    );
  return {
    center: AutoMovieEngineVector3.add(
      frame.position,
      AutoMovieEngineQuaternion.rotateVector(frame.rotation, mouth.frame.translation),
    ),
    radius,
  };
}
/*
 * Find the rigid rim affordance shared by source and recipient vessels.
 */
function rimOf(
  prop: IAutoMovieMotionHumanProp,
): IAutoMovieAffordance | undefined {
  return prop.affordances?.find(
    (site: IAutoMovieAffordance): boolean =>
      site.id === "lip" && site.kind === "ledge" && site.rides === undefined,
  );
}
/*
 * Report the vessel feature that must change.
 */
function vesselRefusal(
  axis: VesselRefusalAxis,
  value: string,
  reason: string,
): AutoMovieMotionHumanRefusal {
  return new AutoMovieMotionHumanRefusal({
    kind: "affordance",
    axis,
    value,
    reason,
    fix:
      axis === "source"
        ? "hold an upright rigid vessel by a suitable grip before pouring"
        : "place a fixed upright recipient with a mouth socket and rim lip",
  });
}

/*
 * The alternatives of `LiquidPlan`'s site.
 */
type LiquidPlan = "duration" | "events";
/*
 * The record of `IPlanOpening`'s site.
 */
type IPlanOpening = { center: IAutoMovieVector3; radius: number };
/*
 * The record of `IOpeningOfResult`'s site.
 */
type IOpeningOfResult = { center: IAutoMovieVector3; radius: number };

/*
 * The alternatives of `VesselRefusalAxis`'s site.
 */
type VesselRefusalAxis = "source" | "target";
