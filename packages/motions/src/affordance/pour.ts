import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
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

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/** Upright admission allows five degrees of staged placement error. */
const UPRIGHT: number = Math.cos((5 * Math.PI) / 180);
/** Minimum axis alignment at the sampled tilted poses, within 10 degrees. */
const TIP_ALIGNMENT: number = Math.cos((10 * Math.PI) / 180);
/** World vertical for the stationary vessel and the gravity cue. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/**
 * A registered, stationary-base pour. Bring the held source above a fixed
 * recipient, tip about its rim lip, transfer, right it and retreat. Register
 * `pour` in `HumanPerformance` and call `registered(pour.name, params)`.
 * `flowStart` and `flowEnd` delimit the authored transfer cue. EPIC-KITCHENS-100
 * provides observational action context (Damen et al., 2021,
 * https://arxiv.org/abs/2006.13256). Angles and phase lengths here are staged
 * inputs. The liquid query gives the volume cue for one action instance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the registration path, ordered phases, observed source and role of authored timing.
 * @evidence contracts/development/design.md#principled-representation One arm transports a rigid grip around an authored lip pivot. The flow interval drives a conserved volume balance.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the law record and an action-local liquid query.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses scene affordances, the held prop frame and a fixed recipient. Numerical fluid behavior and transfer amounts are not inferred from the archetype's fill mass.
 */
export namespace pour {
  /**
   * Registered action name.
   * @evidence contracts/development/common.md#meaningful-documentation Names the lookup key used by the chain.
   */
  export const name: string = "pour";
  /**
   * The whole transfer plays together, without an offered cut.
   * @evidence contracts/development/common.md#meaningful-documentation No authored interruption window is offered during the pour.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {};

  /**
   * Plan the held source's transport, pivot, transfer hold and return.
   *
   * @param context Entry with both feet planted and the named source in hand.
   * @returns The action plan with its original grip retained.
   * @throws {HumanRefusal} For invalid timing, geometry, volumes, support or grip, and for a pose that misses the sampled mouth or tilt bound.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the entry, retained hold and refusal categories.
   * @evidence contracts/development/implementation.md#principled-implementation The wrist target is the pivot minus the rotated wrist-to-lip offset. Changing orientation therefore keeps the lip above the opening throughout the tip and righting goals.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admits the staging, constructs one arm trajectory, then checks the trajectory at the relevant phase samples.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Derives the opening from the recipient's affordances and refuses sampled loss of alignment instead of moving the receiving vessel or changing the requested transfer.
   * @evidence contracts/development/implementation.md#efficient-algorithms One arm planning call and seven bounded forward pose reads per instance. Posture evaluation reads the prepared trajectory.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the vocabulary's rigid hold, arm carry, key clock, base composition and pose resolver.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains one trajectory and the rigid hold. There is no frame history or resource handle.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPour.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const params: IAutoMovieMotionHumanPour.IParams = context.params;
    validateVolumes(params);
    const clock: IAutoMovieMotionClock = clockOf(params, context.tempo ?? 1);
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
      throw new HumanRefusal({
        kind: "base",
        axis: "base",
        value: context.entry.base.kind,
        reason: "pouring needs a standing entry with both feet supported",
        fix: "stage the pour after standing with the source in hand",
      });

    const side: AutoMovieHumanSide = params.hand ?? "right";
    const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
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
      source.articulate !== undefined ||
      rim === undefined
    )
      throw vesselRefusal(
        "source",
        source.subject,
        "the source needs a rigid rim lip and a movable body",
      );
    const opening: { center: IAutoMovieVector3; radius: number } = openingOf(
      source.subject,
      target,
      context.start,
    );
    const lip: IAutoMovieMotionHumanHeld.IPointResult =
      AutoMovieMotionHumanHeld.point(held, "lip");
    const bones: ReturnType<typeof poseBones> = poseBones(
      context.body,
      context.entry.pose,
    );
    const wrist: IAutoMovieResolvedBone = bones.get(`${side}Hand`)!;
    const bend: IAutoMovieVector3 = bones.get(`${side}LowerArm`)!.worldPosition;
    const lipOffset: IAutoMovieVector3 = Vector3.add(
      HumanHand.offset(context.body, side, "grip").point,
      lip.point,
    );
    const initialUp: IAutoMovieVector3 = Quaternion.rotateVector(
      wrist.worldRotation,
      lip.direction,
    );
    const sourceRotation: IAutoMovieQuaternion = Quaternion.multiply(
      wrist.worldRotation,
      held.frame.rotation,
    );
    const radial: IAutoMovieVector3 = Quaternion.rotateVector(sourceRotation, {
      x: rim.frame.translation.x,
      y: 0,
      z: rim.frame.translation.z,
    });
    const axisVector: IAutoMovieVector3 = Vector3.cross(UP, radial);
    if (
      !(
        Vector3.dot(initialUp, UP) >= UPRIGHT &&
        Vector3.length(axisVector) >= 0.005
      )
    )
      throw vesselRefusal(
        "source",
        params.source,
        "the held lip needs an upright axis and a radial rim",
      );
    const axis: IAutoMovieVector3 = Vector3.normalize(axisVector);
    const pivot: IAutoMovieVector3 = Vector3.add(
      opening.center,
      Vector3.scale(UP, params.gap),
    );
    const tiltAt = (seconds: number): number =>
      params.tilt *
      (clock.progress("tipStart", "flowStart", seconds) -
        clock.progress("flowEnd", "retreatStart", seconds));

    // One trajectory carries the source between the entry wrist and the lip
    // pivot. On the pivot the planner's contact site is the lip itself.
    const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
      start: 0,
      ready: clock.at("tipStart"),
      relax: clock.at("retreatStart"),
      end: clock.duration,
    };
    const composed: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
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
              const rotation: IAutoMovieQuaternion = Quaternion.multiply(
                Quaternion.fromAxisAngle(axis, tiltAt(seconds)),
                wrist.worldRotation,
              );
              return {
                point: Vector3.subtract(
                  pivot,
                  Quaternion.rotateVector(rotation, lipOffset),
                ),
                rotation,
                contact: lipOffset,
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
      const point: IAutoMovieVector3 = Vector3.add(
        fitted.worldPosition,
        Quaternion.rotateVector(fitted.worldRotation, lipOffset),
      );
      const delta: IAutoMovieVector3 = Vector3.subtract(point, opening.center);
      const up: IAutoMovieVector3 = Quaternion.rotateVector(
        fitted.worldRotation,
        lip.direction,
      );
      const expected: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.fromAxisAngle(axis, tiltAt(seconds)),
        initialUp,
      );
      if (
        !(
          Math.hypot(delta.x, delta.z) <= opening.radius &&
          Vector3.length(Vector3.subtract(point, pivot)) <= 0.025 &&
          Vector3.dot(up, expected) >= TIP_ALIGNMENT
        )
      )
        throw new HumanRefusal({
          kind: "reach",
          axis: "target",
          value: params.target,
          reason: `the fitted lip misses the opening or tilt at ${seconds.toFixed(2)} seconds`,
          fix: "bring the fixed recipient nearer or reduce the tilt and adjust the entry grip",
        });
    }
    return {
      ...composed,
      contacts: [...composed.contacts, AutoMovieMotionHumanHeld.grip(held)],
      holds: [AutoMovieMotionHumanHeld.hold(context, held)],
    };
  }

  /**
   * Sample the authored liquid balance. Use the pour instance's plan so
   * the interval follows its clock after any performance tempo scaling.
   *
   * @param params The authored amounts used to plan the pour.
   * @param plan The pour instance's duration and events.
   * @param seconds Finite seconds from the plan's start, clamped outside flow.
   * @returns Volumes remaining in both vessels and cumulative overflow, in millilitres.
   * @throws {HumanRefusal} For invalid volumes, time or flow events.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the plan and time frame, the result's units and all refusal classes.
   * @evidence contracts/development/implementation.md#principled-implementation Discharge advances linearly within the authored flow interval. The recipient takes up to its remaining capacity, with excess counted as overflow.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read both flow boundaries, clamp progress and distribute the discharged amount.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No liquid is added or removed independently of the source discharge.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two lookups in the plan's events and constant arithmetic.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the same named phase boundaries driving the motion.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure query that retains nothing.
   */
  export function liquid(
    params: IAutoMovieMotionHumanPour.IParams,
    plan: Pick<IAutoMovieMotionHumanActionPlan, "duration" | "events">,
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
        Number.isFinite(seconds) &&
        Number.isFinite(end) &&
        start >= 0 &&
        end > start &&
        end <= plan.duration
      )
    )
      throw new HumanRefusal({
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
/** Admit a bounded, nonempty authored stage sequence and usable tip geometry. */
function clockOf(
  params: IAutoMovieMotionHumanPour.IParams,
  tempo: number,
): IAutoMovieMotionClock {
  const { timing, gap, tilt } = params;
  const phases: { name: string; seconds: number }[] = [
    { name: "approachStart", seconds: timing?.approach },
    { name: "tipStart", seconds: timing?.tip },
    { name: "flowStart", seconds: timing?.flow },
    { name: "flowEnd", seconds: timing?.right },
    { name: "retreatStart", seconds: timing?.retreat },
  ];
  let duration: number = 0;
  for (const phase of phases)
    duration +=
      typeof phase.seconds === "number" &&
      phase.seconds >= 0.2 &&
      phase.seconds <= 3
        ? phase.seconds
        : NaN;
  if (!(duration <= 10 && tempo > 0 && duration * tempo <= 10))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "timing",
      value: duration,
      reason:
        "the five stages need 0.2 to 3 seconds each and at most 10 seconds in all, including tempo scaling",
      fix: "shorten or lengthen the affected stage lengths",
    });
  if (!(tilt >= 35 && tilt <= 90 && gap >= 0.04 && gap <= 0.18))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "tilt/gap",
      value: params.tilt,
      reason:
        "the pour needs a 35 to 90 degree tilt and a 0.04 to 0.18 metre gap",
      fix: "author a tilt and lip clearance in those ranges",
    });
  for (const phase of phases) phase.seconds *= tempo;
  return AutoMovieMotionClock.sequence(phases);
}
/** Admit finite quantities before arithmetic or planning. */
function validateVolumes(params: IAutoMovieMotionHumanPour.IParams): void {
  if (
    ![
      params.sourceMl,
      params.targetMl,
      params.capacityMl,
      params.transferMl,
    ].every(Number.isFinite) ||
    !(
      params.transferMl > 0 &&
      params.transferMl <= params.sourceMl &&
      params.targetMl >= 0 &&
      params.capacityMl > 0 &&
      params.targetMl <= params.capacityMl &&
      Number.isFinite(params.sourceMl + params.targetMl)
    )
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "transferMl",
      value: params.transferMl,
      reason:
        "the pour needs finite volumes, enough liquid in the source and a recipient filled no higher than its capacity",
      fix: "supply the initial fills and capacity in millilitres and discharge at most the available source volume",
    });
}
/** Read the stationary recipient's upright circular opening from its centre and rim. */
function openingOf(
  source: string,
  receiver: IAutoMovieMotionHumanPropReader,
  seconds: number,
): { center: IAutoMovieVector3; radius: number } {
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
    target.articulate !== undefined ||
    mouth === undefined ||
    edge === undefined
  )
    throw vesselRefusal(
      "target",
      target.subject,
      "the distinct recipient needs a fixed rigid mouth socket and a rim lip",
    );
  const frame: IAutoMovieRigidTransform = receiver.frame(seconds);
  const up: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.multiply(frame.rotation, mouth.frame.rotation),
    UP,
  );
  const rim: IAutoMovieVector3 = Vector3.subtract(
    edge.frame.translation,
    mouth.frame.translation,
  );
  const radius: number = Math.hypot(rim.x, rim.z);
  if (
    !(
      Vector3.dot(up, UP) >= UPRIGHT &&
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
    center: Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, mouth.frame.translation),
    ),
    radius,
  };
}
/** Find the rigid rim affordance shared by source and recipient vessels. */
function rimOf(
  prop: IAutoMovieMotionHumanProp,
): IAutoMovieAffordance | undefined {
  return prop.affordances?.find(
    (site: IAutoMovieAffordance): boolean =>
      site.id === "lip" && site.kind === "ledge" && site.rides === undefined,
  );
}
/** Report the vessel feature that must change. */
function vesselRefusal(
  axis: "source" | "target",
  value: string,
  reason: string,
): HumanRefusal {
  return new HumanRefusal({
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
