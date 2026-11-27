import { Quaternion, physicalShapeBounds } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanCrossing,
  IAutoMovieMotionHumanJump,
  IAutoMovieMotionHumanPropReader,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalShapeBounds,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { jump } from "../../actions/internal/jump";
import { stepOver } from "../../everyday/internal/stepOver";
import { HumanFoot } from "../../posture/HumanFoot";
import { HumanFrame } from "../../posture/HumanFrame";
import { poseBones } from "../../posture/internal/poseBones";
import { crossingClearance } from "./crossingClearance";
import { crossingSurface } from "./crossingSurface";
import { planNamedVault } from "./planNamedVault";

/**
 * How far an entering sole may sit off the departure top, metres (provisional:
 * a sole visibly on the deck).
 */
const SOLE: number = 0.025;

/**
 * The least clear gap between two decks, metres, below which they are one
 * surface (provisional).
 */
const GAP: number = 0.02;

/**
 * Landing room the far deck needs beyond its near edge, foot lengths
 * (provisional: a foot and its heel margin).
 */
const LANDING_ROOM: number = 1.15;

/**
 * Where the toe joints land beyond the far deck's near edge, foot lengths
 * (provisional: the heel on the deck).
 */
const LANDING_DEPTH: number = 0.8;

/**
 * The landing's margin inside a deck's side edges, foot lengths (provisional:
 * half a stance width).
 */
const LANE_MARGIN: number = 0.65;

/**
 * Where the feet land beyond an obstacle's far extent, foot lengths
 * (provisional: room for the absorbing stance's heels).
 */
const BEYOND: number = 1.45;

/**
 * Cross a named obstacle or a gap between two named decks with the existing
 * laws, against the scene's actual shapes: a step uses `stepOver`, a vault
 * `planNamedVault`, and an obstacle or gap jump the ballistic `jump` landing
 * beyond the obstacle or on the far deck. The jump's departure contacts bear on
 * the departure deck. The whole displayed body is checked clear of the named
 * shapes over the crossing (`crossingClearance`), for a jump once its airborne
 * rotation is set.
 *
 * @param context The entry and the selected crossing.
 * @returns A crossing that hands a settled exit to the following gait.
 * @throws {HumanRefusal} For geometry that does not span the path or a body
 *   that enters a named shape.
 */
export function planNamedCrossing(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCrossing.IParams>,
): IAutoMovieMotionHumanActionPlan {
  const request: IAutoMovieMotionHumanCrossing.IParams = context.params;
  if (request.kind === "step") {
    const plan: IAutoMovieMotionHumanActionPlan = stepOver.plan({
      ...context,
      params: {
        obstacle: request.obstacle,
        ...(request.lead === undefined ? {} : { lead: request.lead }),
        ...(request.onto === undefined ? {} : { onto: request.onto }),
      },
    });
    crossingClearance(context, plan, [request.obstacle]);
    return plan;
  }

  const frame: HumanFrame.IPrepared = HumanFrame.prepare({
    origin: { ...context.entry.posture.root, y: 0 },
    yaw: context.entry.posture.yaw,
  });
  if (request.kind === "vault")
    return planNamedVault(context, frame, request.over, request.hand ?? "left");

  const landing: ILanding =
    request.kind === "gap"
      ? gapLanding(context, frame, request)
      : obstacleLanding(context, frame, request.obstacle);
  const flown: IAutoMovieMotionHumanActionPlan = jump.plan({
    ...context,
    params: {
      ...landing.params,
      ...(request.apex === undefined ? {} : { apex: request.apex }),
    },
  });

  // The take-off foot bears on the departure deck, not the floor.
  const departure: string | undefined =
    request.kind === "gap" ? request.from.prop : undefined;
  const takeoff: number =
    flown.events.find(
      (event: IAutoMovieMotionHumanActionPlan["events"][number]): boolean =>
        event.name === "takeoff",
    )?.share ?? 0;
  const plan: IAutoMovieMotionHumanActionPlan =
    departure === undefined
      ? flown
      : {
          ...flown,
          contacts: flown.contacts.map(
            (
              window: IAutoMovieMotionHumanContactWindow,
            ): IAutoMovieMotionHumanContactWindow =>
              window.support.kind === "ground" && window.to <= takeoff + 1e-9
                ? { ...window, support: { kind: "prop", subject: departure } }
                : window,
          ),
        };
  const airborne: IAutoMovieMotionHumanActionPlan["airborne"] = flown.airborne;
  if (plan.flight === undefined || airborne === undefined) {
    crossingClearance(context, plan, landing.subjects);
    return plan;
  }

  // The flight's rotation is set by the performance after planning; the
  // displayed body is only known, and checked, once it is.
  return {
    ...plan,
    airborne: (
      turn: Parameters<
        NonNullable<IAutoMovieMotionHumanActionPlan["airborne"]>
      >[0],
    ): void => {
      airborne(turn);
      crossingClearance(context, plan, landing.subjects);
    },
  };
}

/** A jump's landing and the fixtures its clearance is checked against. */
interface ILanding {
  /** The jump's landing point and support. */
  params: IAutoMovieMotionHumanJump.IParams;

  /** The fixtures the body must clear. */
  subjects: readonly string[];
}

/** Land on the far deck of a gap after checking the departure stance. */
function gapLanding(
  context: IAutoMovieMotionHumanActionContext,
  frame: HumanFrame.IPrepared,
  request: IAutoMovieMotionHumanCrossing.IGap,
): ILanding {
  const foot: number = context.body.measure.footLength;
  const from: crossingSurface.IExtent = crossingSurface.read(
    context,
    frame,
    request.from,
  );
  const to: crossingSurface.IExtent = crossingSurface.read(
    context,
    frame,
    request.to,
  );
  const entry: ReturnType<typeof poseBones> = poseBones(
    context.body,
    context.entry.pose,
  );
  for (const side of ["left", "right"] as const) {
    const contact: IAutoMovieVector3 = frame.local(
      HumanFoot.sockets(context.body, entry, side)[1]!.point,
    );
    if (
      Math.abs(contact.y - from.height) > SOLE ||
      contact.z < from.near ||
      contact.z > from.far ||
      contact.x < from.left ||
      contact.x > from.right
    )
      throw crossingSurface.refusal(
        "from.point",
        request.from.point,
        "the entering sole does not bear on the named side",
      );
  }
  if (
    from.far >= to.near - GAP ||
    to.near <= 0 ||
    to.far - to.near < LANDING_ROOM * foot
  )
    throw crossingSurface.refusal(
      "to.point",
      request.to.point,
      "the destination needs a clear gap and room beyond its near edge",
    );

  // Land on the path's line when the deck spans it, else nearest it.
  const lane: number = Math.max(
    to.left + foot * LANE_MARGIN,
    Math.min(0, to.right - foot * LANE_MARGIN),
  );
  return {
    params: {
      to: frame.point({
        x: lane,
        y: to.height,
        z: to.near + LANDING_DEPTH * foot,
      }),
      on: request.to.prop,
    },
    subjects: [request.from.prop, request.to.prop],
  };
}

/** Land on the floor beyond an obstacle that spans the path ahead. */
function obstacleLanding(
  context: IAutoMovieMotionHumanActionContext,
  frame: HumanFrame.IPrepared,
  obstacle: string,
): ILanding {
  const reader: IAutoMovieMotionHumanPropReader = context.prop(obstacle);
  const shapes: readonly IAutoMoviePhysicalShape[] = reader.prop.shapes ?? [];
  if (shapes.length === 0)
    throw crossingSurface.refusal(
      "obstacle",
      obstacle,
      "the object has no collision shapes to cross",
    );
  const world: IAutoMovieRigidTransform = reader.frame(context.start);
  const placed: IAutoMovieRigidTransform = {
    position: frame.local(world.position),
    rotation: Quaternion.multiply(
      HumanFrame.turn(-context.entry.posture.yaw),
      world.rotation,
    ),
  };
  const extents: IAutoMoviePhysicalShapeBounds.IResult[] = shapes.map(
    (shape: IAutoMoviePhysicalShape): IAutoMoviePhysicalShapeBounds.IResult =>
      physicalShapeBounds(placed, shape),
  );
  const far: number = Math.max(
    ...extents.map(
      (e: IAutoMoviePhysicalShapeBounds.IResult): number => e.max.z,
    ),
  );
  const near: number = Math.min(
    ...extents.map(
      (e: IAutoMoviePhysicalShapeBounds.IResult): number => e.min.z,
    ),
  );
  const left: number = Math.min(
    ...extents.map(
      (e: IAutoMoviePhysicalShapeBounds.IResult): number => e.min.x,
    ),
  );
  const right: number = Math.max(
    ...extents.map(
      (e: IAutoMoviePhysicalShapeBounds.IResult): number => e.max.x,
    ),
  );
  if (near <= 0 || far <= near || left >= 0 || right <= 0)
    throw crossingSurface.refusal(
      "obstacle",
      obstacle,
      "the named shape must span the path ahead",
    );
  return {
    params: {
      to: frame.point({
        x: 0,
        y: 0,
        z: far + BEYOND * context.body.measure.footLength,
      }),
    },
    subjects: [obstacle],
  };
}
