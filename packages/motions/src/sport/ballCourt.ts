import { AutoMovieGravity, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBallSport,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPlaced,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionManner,
  IAutoMovieMotionPropLaunch,
  IAutoMoviePhysicalShape,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import { AutoMovieMotionHumanTrunk } from "../compose/AutoMovieMotionHumanTrunk";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { lookPrimitive } from "../compose/lookPrimitive";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { throwObjectLaunch } from "../throwing/throwObjectLaunch";

/** The court phrases handled by this planner. */
type Kind =
  | "dribbleRelease"
  | "chestPass"
  | "bouncePass"
  | "setShot"
  | "handballThrow"
  | "highHandContest";
/** The record of `IPHRASESEntryItem`'s site. */
type IPHRASESEntryItem = {
  depth: number;
  lean: number;
  prepare: number;
  attack: number;
  flight: number;
};

/**
 * Planted motion parameters. Depth scales by stature; lean is forward degrees.
 * Durations are provisional seconds.
 */
const PHRASES: Readonly<Record<Kind, IPHRASESEntryItem>> = {
  dribbleRelease: {
    depth: 0.04,
    lean: 14,
    prepare: 0.36,
    attack: 0.21,
    flight: 0,
  },
  chestPass: {
    depth: 0.025,
    lean: 6,
    prepare: 0.37,
    attack: 0.24,
    flight: 0.42,
  },
  bouncePass: {
    depth: 0.04,
    lean: 11,
    prepare: 0.39,
    attack: 0.25,
    flight: 0.28,
  },
  setShot: { depth: 0.06, lean: 6, prepare: 0.45, attack: 0.35, flight: 0.88 },
  handballThrow: {
    depth: 0.035,
    lean: 12,
    prepare: 0.48,
    attack: 0.22,
    flight: 0.33,
  },
  highHandContest: {
    depth: 0.05,
    lean: 7,
    prepare: 0.34,
    attack: 0.55,
    flight: 0,
  },
};
/** The record of `ISphericalBallResult`'s site. */
type ISphericalBallResult = {
  reader: IAutoMovieMotionHumanPropReader;
  sphere: NonNullable<IAutoMovieMotionPropLaunch["sphere"]>;
};

/**
 * Resolve the one spherical ball the release moves. The collider's centre need
 * not coincide with the prop origin.
 */
function sphericalBall(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBallSport.IParams>,
  subject: string,
  hands: readonly AutoMovieHumanSide[],
): ISphericalBallResult {
  const reader: IAutoMovieMotionHumanPropReader = context.prop(subject);
  if (
    !hands.some(
      (side: AutoMovieHumanSide): boolean =>
        context.entry.holds[side] === subject,
    )
  )
    throw new HumanRefusal({
      kind: "affordance",
      axis: "prop",
      value: subject,
      reason: "a court release needs the ball already held by a releasing hand",
      fix: "pick up or catch the ball before releasing it, or choose its holding hand",
    });
  const shape: IAutoMoviePhysicalShape | undefined = reader.prop.shapes?.[0];
  if (
    reader.prop.shapes?.length !== 1 ||
    shape?.kind !== "sphere" ||
    reader.prop.fixed === true ||
    reader.prop.worn !== undefined ||
    reader.prop.motion !== undefined
  )
    throw new HumanRefusal({
      kind: "affordance",
      axis: "prop",
      value: subject,
      reason: "a court release needs one portable spherical prop",
      fix: "give the held ball's subject with its spherical collider",
    });
  const body: IAutoMovieMotionHumanPropReader["prop"]["body"] =
    reader.prop.body;
  const friction: number | null | undefined =
    body?.kineticFriction ?? body?.friction;
  return {
    reader,
    sphere: {
      radius: shape.radius,
      centre: shape.transform.position,
      // An underside-height drop determines normal restitution only. Use
      // no tangential loss in that provisional isolated court-ball fixture.
      ...(body?.restitution !== undefined &&
      (friction === null || friction === undefined)
        ? { tangentialFriction: 0 }
        : {}),
    },
  };
}

/** Rotate a direction or body-relative offset into the performer's heading. */
function turn(yaw: number, local: IAutoMovieVector3): IAutoMovieVector3 {
  return HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw }, local);
}

/**
 * Plan a planted basketball or handball phrase on the same clock as its
 * release. Basketball's return from the floor and the handball throw keep the
 * actual ball as a single performance prop. The contest waves and raises the
 * hands without an authored ball impulse. FIBA WABC Level 2 §1.1.1 identifies a
 * high-hand finish for a closeout. Wagner et al. (2011), J Sports Sci Med
 * 10:73–80, distinguishes grounded and airborne handball delivery. This first
 * grounded version uses a planted base and a separate arm cocking and delivery
 * phase. Phase durations and limb targets are provisional staging values.
 *
 * @param context The ball-sport action instance and its actor and prop readers.
 * @param kind The checked court phrase selected by ballSport.
 * @returns Planted motion with named beats and, for a release, a grip window
 *   and the one prop launch.
 * @throws {HumanRefusal} For an unavailable spherical prop or required aim.
 */
export function ballCourt(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBallSport.IParams>,
  kind: Kind,
): IAutoMovieMotionHumanActionPlan {
  const { body, params }: typeof context = context;
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const row: (typeof PHRASES)[Kind] = PHRASES[kind];
  const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner.of(
    context,
    params.manner,
  );
  const guard: boolean = kind === "highHandContest";
  const dribble: boolean = kind === "dribbleRelease";
  const one: boolean = dribble || kind === "handballThrow";
  const hands: readonly AutoMovieHumanSide[] = one
    ? [params.hand ?? "right"]
    : ["left", "right"];
  const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
    AutoMovieMotionClock.phrase({
      prepare: row.prepare,
      attack: row.attack,
      follow: 0.22,
      hold: guard ? 0.24 : 0.85,
      retract: 0.34,
    }),
    modifiers,
  );
  const release: number = clock.at("stroke");
  const arm: number = body.measure.upperArm + body.measure.forearm;
  const weight = (t: number): number =>
    clock.envelope(["start", "ready"], ["relax", "end"], t);
  const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
    start: 0,
    ready: clock.at("ready"),
    relax: clock.at("relax"),
    end: clock.duration,
  };
  const target: IAutoMovieVector3 | undefined = params.at;
  const prop: string | undefined = params.prop;
  if (!guard && prop === undefined)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "prop",
      value: prop,
      reason: `${kind} releases a real prop`,
      fix: "name the ball the performer is holding",
    });
  if (!guard && !dribble && target === undefined)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "at",
      value: target,
      reason: `${kind} needs an aim point`,
      fix: "give a world point for the flight or its first floor contact",
    });
  const ball: ReturnType<typeof sphericalBall> | undefined =
    guard || prop === undefined
      ? undefined
      : sphericalBall(context, prop, hands);
  const radius: number = ball?.sphere.radius ?? 0;
  const primitives: IAutoMovieMotionHumanPrimitive[] = [
    AutoMovieMotionHumanTrunk.crouch({
      body,
      standing: entry,
      clock,
      rise: ["start", "ready"],
      fall:
        kind === "setShot" || kind === "handballThrow"
          ? ["strokeStart", "stroke"]
          : ["relax", "end"],
      depth: row.depth * body.measure.stature * modifiers.extent,
      pitch: row.lean,
    }),
  ];
  for (const side of hands)
    primitives.push(
      ...AutoMovieMotionHumanPlaced.arm({
        body,
        side,
        from: span.start,
        to: span.end,
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
        weight,
        span,
        // The clock is the law's own, lengthened by a slower tempo.
        together: AutoMovieMotionHumanArm.together(
          context.handover,
          true,
          context.tempo,
        ),
        bend: guard || kind === "handballThrow" ? "raised" : "forward",
        place: (
          posture,
          t,
          resolution,
        ): ReturnType<IAutoMovieMotionHumanPlaced.IArm["place"]> => {
          const sign: number = side === "left" ? 1 : -1;
          const u: number = clock.progress("strokeStart", "stroke", t);
          const follow: number = clock.progress("stroke", "strokeEnd", t);
          const shoulders: IAutoMovieVector3 =
            AutoMovieMotionHumanPlaced.shoulders(body, posture, resolution);
          const width: number = body.measure.shoulderHalfWidth;
          const yaw: number = posture.yaw;
          let offset: IAutoMovieVector3;
          let facing: IAutoMovieVector3;
          switch (kind) {
            case "highHandContest": {
              const wave: number = Math.sin(4 * Math.PI * u) * arm * 0.13;
              offset = {
                x: sign * (width + 0.1 * arm + wave),
                y: arm * (0.49 + 0.24 * u),
                z: 0.21 * arm,
              };
              facing = { x: 0, y: 0, z: 1 };
              break;
            }
            case "dribbleRelease":
              offset = {
                x: sign * (width + 0.09 * arm),
                y: -(0.39 + 0.34 * u) * arm,
                z: 0.27 * arm,
              };
              facing = { x: 0, y: -1, z: 0 };
              break;
            case "handballThrow":
              offset = {
                x: sign * (width + (0.37 - 0.19 * u) * arm),
                y: (0.4 + 0.2 * u - 0.36 * follow) * arm,
                z: (-0.2 + 0.71 * u + 0.15 * follow) * arm,
              };
              facing = { x: 0, y: 0, z: 1 };
              break;
            case "setShot":
              offset = {
                x: sign * radius,
                y: (0.18 + 0.67 * u) * arm,
                z: (0.34 + 0.08 * u) * arm,
              };
              facing = { x: -sign * (1 - u), y: u, z: 0.4 * u };
              break;
            case "bouncePass":
            case "chestPass":
              offset = {
                x: sign * (radius + 0.06 * arm * follow),
                y: (-0.2 - (kind === "bouncePass" ? 0.27 : 0.05) * u) * arm,
                z: (0.31 + 0.45 * u + 0.08 * follow) * arm,
              };
              facing = {
                x: -sign,
                y: kind === "bouncePass" ? -0.4 * u : 0,
                z: u,
              };
              break;
          }
          return {
            point: Vector3.add(shoulders, turn(yaw, offset)),
            facing: Vector3.normalize(turn(yaw, facing)),
            forward: dribble
              ? turn(yaw, { x: 0, y: 0, z: 1 })
              : { x: 0, y: 1, z: 0 },
          };
        },
      }),
    );
  if (target !== undefined)
    primitives.push(
      lookPrimitive({
        body,
        recruit: "head",
        from: 0,
        to: clock.duration,
        weight,
        target: (): IAutoMovieVector3 => target,
      }),
    );
  const plan: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(
        clock.duration,
        entry,
        AutoMovieMotionHumanBase.plants(),
      ),
      clock,
      primitives,
      contact: "stroke",
    });
  if (ball === undefined || prop === undefined) return plan;

  const seconds: number = params.flightSeconds ?? row.flight;
  const aim: IAutoMovieMotionPropLaunch["aim"] =
    target === undefined || dribble
      ? undefined
      : {
          seconds,
          point:
            kind === "bouncePass"
              ? { ...target, y: target.y + radius }
              : target,
        };
  const point: IAutoMovieVector3 = ball.reader.frame(context.start).position;

  // A dribble pushes the ball down hard enough that its rebound comes back
  // to the hand: from e^2 (v^2 + 2 g d) = 2 g d over the held centre's drop
  // d to the floor, v = sqrt(2 g d (1 / e^2 - 1)). A ball that declares no
  // restitution keeps the provisional push of 1.3 sqrt(g arm).
  const restitution: number | undefined = ball.reader.prop.body?.restitution;
  const drop: number = point.y + ball.sphere.centre.y - ball.sphere.radius;
  const push: number =
    restitution !== undefined && restitution > 0 && restitution < 1
      ? Math.sqrt(
          2 * AutoMovieGravity.STANDARD * drop * (1 / restitution ** 2 - 1),
        )
      : 1.3 * Math.sqrt(AutoMovieGravity.STANDARD * arm);
  const velocity: IAutoMovieVector3 = dribble
    ? { x: 0, y: -push, z: 0 }
    : { x: 0, y: 0, z: 0 };
  const launch: IAutoMovieMotionPropLaunch = {
    prop,
    seconds: release,
    point,
    velocity,
    sphere: ball.sphere,
    ...(aim === undefined ? {} : { aim }),
  };
  const grips: IAutoMovieMotionHumanContactWindow[] = hands.flatMap(
    (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow[] =>
      throwObjectLaunch.held(prop, side, release / clock.duration),
  );
  return {
    ...plan,
    contacts: [...plan.contacts, ...grips],
    launches: [...(plan.launches ?? []), launch],
  };
}
