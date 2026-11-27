import { AutoMovieEngineVector3, AutoMovieEnginePhysics } from "@automovie/engine";
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

import { HumanSupportFrame } from "../../carrier/internal/HumanSupportFrame";
import { HumanLoad } from "../../perform/internal/HumanLoad";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { poseBones } from "../../posture/internal/poseBones";
import { environmentRailCatch } from "./environmentRailCatch";
import { environmentRecoveryCue } from "./environmentRecoveryCue";
import { perturb } from "./perturb";

/*
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
 * Parameter context: The walk's cut and the named cause.
 * Returns: The response on the same film clock, starting at the support loss.
 * When the entry is not a walk, the cue is not met at
 * this cut, or the outcome is incompatible.
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
    throw environmentRecoveryCue.refuse(
      "cut",
      asked.kind,
      "the named hazard interrupts an authored walk",
    );
  if (!entry.feet[other].planted)
    throw environmentRecoveryCue.refuse(
      "foot",
      side,
      "the remaining foot has no bearing phase at this cue",
    );

  const cue: environmentRecoveryCue.ICue =
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
      throw environmentRecoveryCue.refuse(
        "rail",
        null,
        "a braced recovery needs a named rail",
      );
    reacted = environmentRailCatch(local, asked.rail, side, cue.direction);
  } else {
    if (asked.rail !== undefined)
      throw environmentRecoveryCue.refuse(
        "rail",
        asked.rail.point,
        "a rail belongs to the rail-supported outcome",
      );
    const impact: IAutoMovieMotionHumanImpulse = {
      kind: "impulse",
      subject: context.subject,
      at: { bone: part, point: { x: 0, y: 0, z: 0 } },
      seconds: context.start,
      impulse: AutoMovieEngineVector3.scale(cue.direction, body.massModel.mass * cue.severity),
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
            point: AutoMovieEngineVector3.add(
              goal.point,
              AutoMovieEngineVector3.scale(
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

/*
 * The longest interval over which the lost foot is released, seconds
 * (provisional).
 */
const RELEASE: number = 0.14;

/*
 * How far a slipping sole glides before release, foot lengths (provisional).
 */
const GLIDE: number = 0.09;

/*
 * Admit a trip: the swinging toe at the obstruction and moving forward.
 */
function trip(
  context: IAutoMovieMotionHumanActionContext,
  asked: IAutoMovieMotionHumanEnvironmentRecovery.ITrip,
): environmentRecoveryCue.ICue {
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
    throw environmentRecoveryCue.refuse(
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
        AutoMovieEnginePhysics.physicalShapeNearest(pose, shape, ball, toe).distance,
    ),
  );
  const heading: IAutoMovieVector3 = HumanFrame.forward(
    context.entry.posture.yaw,
  );
  return environmentRecoveryCue.trip(
    asked.obstacle,
    nearest,
    foot.velocity.x * heading.x + foot.velocity.z * heading.z,
    context.entry.posture.yaw,
  );
}

/*
 * Admit a slip: a bearing foot whose required friction exceeds the coefficient.
 */
function slip(
  context: IAutoMovieMotionHumanActionContext,
  asked: IAutoMovieMotionHumanEnvironmentRecovery.ISlip,
): environmentRecoveryCue.ICue {
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
    throw environmentRecoveryCue.refuse(
      "support",
      asked.support ?? "floor",
      "the selected foot does not bear on the supplied surface with a feasible coefficient",
    );

  // Friction answers the load relative to the support, so a moving deck's
  // own acceleration is taken out first.
  const carrier: IAutoMovieMotionHumanSupportFrame.IFrame =
    HumanSupportFrame.at(context, context.start, surface);
  const relative: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
    entry.acceleration,
    carrier.acceleration,
  );
  return environmentRecoveryCue.slip(
    asked.support ?? "floor",
    relative,
    AutoMovieEngineVector3.subtract(foot.velocity, carrier.velocity),
    asked.coefficient,
    HumanLoad.required(relative),
    entry.posture.yaw,
  );
}
