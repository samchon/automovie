import { Vector3, physicalShapeNearest } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanEnvironmentRecovery,
  IAutoMovieMotionHumanForce,
  IAutoMovieMotionHumanImpulse,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionHumanSupportFrame,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanSupportFrame } from "../carrier/HumanSupportFrame";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanLoad } from "../perform/HumanLoad";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { environmentRailCatch } from "./environmentRailCatch";
import { perturb } from "./perturb";

/**
 * How far the displayed toe may be from the obstruction at the cue, metres
 * (provisional: a toe visibly touching it).
 */
const CONTACT: number = 0.025;

/**
 * The least forward toe speed that can trip, metres per second (provisional: a
 * swing, not a foot at rest).
 */
const SWING: number = 0.02;

/**
 * The least sliding speed of a slipping sole that sets the slide's direction,
 * metres per second; slower slides go along the heading (provisional).
 */
const SLIDE: number = 0.02;

/**
 * The share of the swinging foot's forward speed the trip hands the body as a
 * velocity change (provisional).
 */
const TRIP_SHARE: number = 0.28;

/**
 * The share of the excess horizontal load a slip hands the body as a velocity
 * change, seconds (provisional).
 */
const SLIP_SHARE: number = 0.18;

/**
 * The longest interval over which the lost foot is released, seconds
 * (provisional).
 */
const RELEASE: number = 0.14;

/** How far a slipping sole glides before release, foot lengths (provisional). */
const GLIDE: number = 0.09;

/**
 * Cut a walk at a staged trip or slip and resolve the lost support. The cue is
 * measured on the displayed entry before anything is published: a trip needs
 * the swinging foot's toe at the named obstruction and moving forward, a slip a
 * bearing foot whose required friction (`HumanLoad`), read relative to its
 * support's motion, exceeds the staged coefficient. The lost foot is released
 * and the response is the perturbation law (`perturb`) under a body-scaled
 * impulse along the trip or slide, or a braced catch on a named rail
 * (`environmentRailCatch`). The plan starts at the cut with the events
 * `<kind>:<source>` and `supportLost`, the lost foot's contact ends by
 * `RELEASE`, and a slipping sole glides over it.
 *
 * @param context The walk's cut and the named cause.
 * @returns The response on the same film clock, starting at the support loss.
 * @throws {HumanRefusal} When the entry is not a walk, the cue is not met at
 *   this cut, or the outcome is incompatible.
 */
export function planEnvironmentRecovery(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanEnvironmentRecovery.IParams>,
): IAutoMovieMotionHumanActionPlan {
  const asked: IAutoMovieMotionHumanEnvironmentRecovery.IParams =
    context.params;
  const side: AutoMovieHumanSide = asked.foot;
  const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
  const part: IAutoMovieMotionHumanSupport.Part = `${side}Foot`;
  const entry: IAutoMovieMotionHumanEntryState = context.entry;
  const foot: IAutoMovieMotionHumanEntryState.IFoot = entry.feet[side];
  if (entry.from?.family !== "walk" && entry.from?.name !== "walk")
    throw refuse(
      "cut",
      asked.kind,
      "the named hazard interrupts an authored walk",
    );
  if (!entry.feet[other].planted)
    throw refuse(
      "foot",
      side,
      "the remaining foot has no bearing phase at this cue",
    );

  const cue: ICue =
    asked.kind === "trip" ? trip(context, asked) : slip(context, asked);
  const released: IAutoMovieMotionHumanEntryState = {
    ...entry,
    feet: { ...entry.feet, [side]: { ...foot, planted: false } },
    supports: entry.supports.filter(
      (window: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
        window.part !== part,
    ),
  };
  const local: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanEnvironmentRecovery.IParams> =
    { ...context, entry: released };
  const body: IAutoMovieMotionHumanBody = context.body;
  let reacted: IAutoMovieMotionHumanActionPlan;
  if (asked.outcome === "rail") {
    if (asked.rail === undefined)
      throw refuse("rail", null, "a braced recovery needs a named rail");
    reacted = environmentRailCatch(local, asked.rail, side, cue.direction);
  } else {
    if (asked.rail !== undefined)
      throw refuse(
        "rail",
        asked.rail.point,
        "a rail belongs to the rail-supported outcome",
      );
    const impact: IAutoMovieMotionHumanImpulse = {
      kind: "impulse",
      subject: context.subject,
      at: { bone: part, point: { x: 0, y: 0, z: 0 } },
      seconds: context.start,
      impulse: Vector3.scale(cue.direction, body.massModel.mass * cue.severity),
    };
    reacted = perturb.plan({
      ...local,
      params: { outcome: asked.outcome ?? "auto" },
      forces: (from: number, to: number): IAutoMovieMotionHumanForce[] => [
        ...(context.forces?.(from, to) ?? []),
        impact,
      ],
    });
  }

  // The lost foot's contact ends within the release, and a slipping sole
  // glides along the slide over it.
  const release: number = Math.min(RELEASE, reacted.duration * 0.25);
  const until: number = release / reacted.duration;
  const limb: AutoMovieHumanLimb = `${side}Leg`;
  const glide: number =
    asked.kind === "slip" ? GLIDE * body.measure.footLength : 0;
  return {
    ...reacted,
    ...(asked.outcome === "fall" ? { base: { kind: "lying" as const } } : {}),
    events: [
      { name: `${asked.kind}:${cue.source}`, share: 0 },
      { name: "supportLost", share: 0 },
      ...reacted.events,
    ],
    contacts: reacted.contacts.flatMap(
      (
        window: IAutoMovieMotionHumanContactWindow,
      ): IAutoMovieMotionHumanContactWindow[] => {
        if (window.part !== part || window.from >= until) return [window];
        return window.to <= until ? [] : [{ ...window, from: until }];
      },
    ),
    posture: (
      ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
    ): IAutoMovieMotionHumanPosture => {
      const t: number = args[0];
      const pose: IAutoMovieMotionHumanPosture = reacted.posture(...args);
      const goal: IAutoMovieHumanLimbGoal | undefined = pose.limbs[limb];
      if (goal === undefined || t < 0 || t >= release) return pose;
      return {
        ...pose,
        limbs: {
          ...pose.limbs,
          [limb]: {
            ...goal,
            planted: false,
            point: Vector3.add(
              goal.point,
              Vector3.scale(
                cue.direction,
                glide * Math.sin((Math.PI * t) / release),
              ),
            ),
          },
        },
      };
    },
    yields: [],
  };
}

/**
 * A measured cue: its source, the velocity change it hands the body and its
 * direction.
 */
interface ICue {
  /** The named source: the obstruction, the support prop or `floor`. */
  source: string;

  /** The velocity change, metres per second. */
  severity: number;

  /** Its horizontal unit direction. */
  direction: IAutoMovieVector3;
}

/** Admit a trip: the swinging toe at the obstruction and moving forward. */
function trip(
  context: IAutoMovieMotionHumanActionContext,
  asked: IAutoMovieMotionHumanEnvironmentRecovery.ITrip,
): ICue {
  const foot: IAutoMovieMotionHumanEntryState.IFoot =
    context.entry.feet[asked.foot];
  const reader: IAutoMovieMotionHumanPropReader = context.prop(asked.obstacle);
  const pose: IAutoMovieRigidTransform = reader.frame(context.start);
  if (
    foot.planted ||
    reader.prop.fixed !== true ||
    reader.prop.motion !== undefined ||
    reader.prop.hasArticulations === true ||
    !reader.prop.shapes?.length
  )
    throw refuse(
      "obstacle",
      asked.obstacle,
      "the swinging foot needs a fixed shaped obstruction",
    );
  const sockets: ReturnType<typeof HumanFoot.sockets> = HumanFoot.sockets(
    context.body,
    poseBones(context.body, context.entry.pose),
    asked.foot,
  );
  const ball: IAutoMovieVector3 = sockets[1]!.point;
  const toe: IAutoMovieVector3 = sockets[2]!.point;
  const nearest: number = Math.min(
    ...reader.prop.shapes.map(
      (shape: IAutoMoviePhysicalShape): number =>
        physicalShapeNearest(pose, shape, ball, toe).distance,
    ),
  );
  const heading: IAutoMovieVector3 = HumanFrame.forward(
    context.entry.posture.yaw,
  );
  const forward: number =
    foot.velocity.x * heading.x + foot.velocity.z * heading.z;
  if (nearest > CONTACT || forward <= SWING)
    throw refuse(
      "obstacle",
      asked.obstacle,
      "the displayed forward swing is clear of the named object at this cue",
    );
  return {
    source: asked.obstacle,
    severity: TRIP_SHARE * forward,
    direction: heading,
  };
}

/** Admit a slip: a bearing foot whose required friction exceeds the coefficient. */
function slip(
  context: IAutoMovieMotionHumanActionContext,
  asked: IAutoMovieMotionHumanEnvironmentRecovery.ISlip,
): ICue {
  const entry: IAutoMovieMotionHumanEntryState = context.entry;
  const foot: IAutoMovieMotionHumanEntryState.IFoot = entry.feet[asked.foot];
  const surface: IAutoMovieMotionHumanContactWindow.Support =
    HumanSupportFrame.contact(context, `${asked.foot}Foot`);
  if (
    !foot.planted ||
    !(asked.coefficient >= 0) ||
    (asked.support === undefined
      ? surface.kind !== "ground"
      : surface.kind !== "prop" || surface.subject !== asked.support)
  )
    throw refuse(
      "support",
      asked.support ?? "floor",
      "the selected foot does not bear on the supplied surface with a feasible coefficient",
    );

  // Friction answers the load relative to the support, so a moving deck's
  // own acceleration is taken out first.
  const carrier: IAutoMovieMotionHumanSupportFrame.IFrame =
    HumanSupportFrame.at(context, context.start, surface);
  const relative: IAutoMovieVector3 = Vector3.subtract(
    entry.acceleration,
    carrier.acceleration,
  );
  const required: number = HumanLoad.required(relative);
  if (required === Infinity || required <= asked.coefficient)
    throw refuse(
      "coefficient",
      asked.coefficient,
      "the staged surface can still carry the displayed foot at this cue",
    );
  const carried: IAutoMovieVector3 = Vector3.subtract(
    foot.velocity,
    carrier.velocity,
  );
  const motion: IAutoMovieVector3 = { x: carried.x, y: 0, z: carried.z };
  return {
    source: asked.support ?? "floor",
    severity:
      SLIP_SHARE *
      Math.hypot(relative.x, relative.z) *
      (1 - asked.coefficient / required),
    direction:
      Vector3.length(motion) > SLIDE
        ? Vector3.normalize(motion)
        : HumanFrame.forward(entry.posture.yaw),
  };
}

/** The recovery's parameter refusal. */
function refuse(axis: string, value: unknown, reason: string): HumanRefusal {
  return new HumanRefusal({
    kind: "parameter",
    axis,
    value,
    reason,
    fix: "use a compatible source and outcome at the actual walking contact cue",
  });
}
