import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBallSport,
  IAutoMovieMotionPropLaunch,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanPlaced } from "../../compose/internal/AutoMovieMotionHumanPlaced";
import { composeMotionHumanAction } from "../../compose/internal/composeMotionHumanAction";
import { motionClock } from "../../compose/internal/motionClock";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanPropHandback } from "../../perform/internal/HumanPropHandback";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { releasePlan } from "../../throwing/internal/releasePlan";
import { ballCourtSphere } from "./ballCourtSphere";

type Params = IAutoMovieMotionHumanBallSport.IDribblePush;
type Context = IAutoMovieMotionHumanActionContext<Params>;
type Sphere = NonNullable<IAutoMovieMotionPropLaunch["sphere"]>;

export const dribblePush: IAutoMovieMotionHumanActionLaw<Params> = {
  name: "dribblePush",
  // A push keeps its authored grip and contact window.
  interrupts: {},
  overlay: true,
  plan(context) {
    const { carrier, params } = context;
    if (
      (carrier?.name !== "walk" && carrier?.name !== "run") ||
      carrier.support !== undefined
    )
      throw new AutoMovieMotionHumanRefusal({
        kind: "affordance",
        axis: "over",
        value: carrier?.name,
        reason: "dribblePush needs a walk or run on the ground",
        fix: "put dribblePush over a ground-level walk or run",
      });

    const { x, y, z } = params.velocity;
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(z) ||
      !(y < 0)
    )
      throw new AutoMovieMotionHumanRefusal({
        kind: "parameter",
        axis: "velocity",
        value: params.velocity,
        reason: "a court push requires a finite downward world velocity",
        fix: "give finite metres per second with a negative vertical component",
      });

    return params.incoming === undefined
      ? startDribble(context)
      : continueDribble(context, params.incoming);
  },
};

/*
 * The prior hold carries the ball until the existing opening-hand release.
 * The staged flight supplies the authored downward speed and uses the stock
 * ball's sphere, with its exact held orientation at the handoff.
 */
function startDribble(context: Context): IAutoMovieMotionHumanActionPlan {
  const { ball, hand = "right", velocity } = context.params;
  const other = hand === "left" ? "right" : "left";
  if (context.entry.holds[other] === ball)
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "hand",
      value: hand,
      reason: "the first push opens the ball's sole holding hand",
      fix: "establish a one-hand hold before starting the dribble",
    });
  const { reader, sphere } = ballCourtSphere(context, ball, [hand]);
  if (reader.prop.body?.drag !== undefined)
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "ball",
      value: ball,
      reason: "the court push expects a portable sphere without drag",
      fix: "use a stock spherical court ball",
    });

  const plan = releasePlan({ ...context, params: { prop: ball, hand } }, true);
  const launch = plan.launches![0]!;
  return {
    ...plan,
    launches: [
      {
        ...launch,
        point: reader.frame(context.start + launch.seconds).position,
        velocity: { ...velocity },
        sphere,
      },
    ],
  };
}

/*
 * Read the preceding native flight at the proposed time. The arm comes above
 * that actual sphere and follows down briefly. The new launch owns no hold.
 */
function continueDribble(
  context: Context,
  incoming: NonNullable<Params["incoming"]>,
): IAutoMovieMotionHumanActionPlan {
  const { ball, hand = "right", velocity } = context.params;
  const source = context.action(incoming.from);
  const launches = source.plan.launches?.filter((each) => each.prop === ball);
  const prior = launches?.[0];
  if (
    source.name !== dribblePush.name ||
    source.subject !== context.subject ||
    launches?.length !== 1 ||
    prior?.sphere === undefined
  )
    throw new AutoMovieMotionHumanRefusal({
      kind: "participant",
      axis: "incoming",
      value: incoming.from,
      reason:
        "the anchor must name this performer's preceding push of the same ball",
      fix: "name the preceding dribblePush anchor",
    });

  const releaseAt = source.start + prior.seconds;
  const at = releaseAt + incoming.seconds;
  const contact = at - context.start;
  if (
    !Number.isFinite(incoming.seconds) ||
    !(incoming.seconds > 0) ||
    !(contact > 0) ||
    releaseAt < source.entryTime ||
    releaseAt > source.end
  )
    throw new AutoMovieMotionHumanRefusal({
      kind: "reach",
      axis: "incoming",
      value: incoming.seconds,
      reason: "the palm must meet an earlier placed launch inside this action",
      fix: "place the touch after its anchored release with enough lead for the arm",
    });

  const reader = context.prop(ball);
  const earlier = at - Math.min(1e-4, incoming.seconds / 2);
  const approach = reader.flightApproach?.(at, earlier);
  const current =
    approach === undefined ? undefined : centre(approach.frame, prior.sphere);
  if (
    approach?.launch !== prior ||
    current === undefined ||
    !(current.y > centre(approach.before, prior.sphere).y)
  )
    throw new AutoMovieMotionHumanRefusal({
      kind: "reach",
      axis: "ball",
      value: ball,
      reason: "the anchored ball is not rising at the placed palm touch",
      fix: "use an unobstructed rebound and place the palm while the ball is rising",
    });

  // Each provisional 80 ms follow/recover window scales with effective tempo.
  const follow = 0.08 * (context.tempo ?? 1);
  const clock = motionClock.sequence([
    { name: "gather", seconds: contact },
    { name: "push", seconds: follow },
    { name: "recover", seconds: follow },
  ]);
  const palm = { ...current, y: current.y + prior.sphere.radius };
  const span = {
    start: 0,
    ready: contact,
    relax: clock.at("recover"),
    end: clock.duration,
  };
  const planned = composeMotionHumanAction({
    base: AutoMovieMotionHumanBase.under(context, clock.duration),
    clock,
    contact: "push",
    primitives: AutoMovieMotionHumanPlaced.arm({
      body: context.body,
      side: hand,
      from: 0,
      to: clock.duration,
      span,
      rest: AutoMovieMotionHumanArm.angles(context.entry.pose, hand),
      together: AutoMovieMotionHumanArm.together(
        context.handover,
        true,
        context.tempo,
      ),
      weight: motionClock.prepareEnvelope(
        clock,
        ["gather", "push"],
        ["recover", "end"],
      ),
      bend: "forward",
      place: (posture, seconds) => {
        const travel = Math.max(0, seconds - contact);
        return {
          point: {
            x: palm.x + prior.velocity.x * travel,
            y: palm.y - 0.05 * Math.min(1, travel / follow),
            z: palm.z + prior.velocity.z * travel,
          },
          facing: { x: 0, y: -1, z: 0 },
          forward: HumanFrame.point(
            { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
            { x: 0, y: 0, z: 1 },
          ),
        };
      },
    }),
  });
  return {
    ...planned,
    launches: [
      HumanPropHandback.tag(
        {
          prop: ball,
          seconds: contact,
          point: approach.frame.position,
          rotation: approach.frame.rotation,
          velocity: { ...velocity },
          sphere: prior.sphere,
          touching: [hand],
        },
        prior,
      ),
    ],
  };
}

function centre(
  frame: IAutoMovieRigidTransform,
  sphere: Sphere,
): IAutoMovieVector3 {
  return AutoMovieEngineVector3.add(
    frame.position,
    AutoMovieEngineQuaternion.rotateVector(frame.rotation, sphere.centre),
  );
}
