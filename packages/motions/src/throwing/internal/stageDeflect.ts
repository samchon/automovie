import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanCatchObject,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPlacedAction,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionPropLaunch,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { stageCatch } from "./stageCatch";
import { stageDeflectRebound } from "./stageDeflectRebound";

/*
 * A deliberate deflection of an incoming ball: the staged interception of
 * `stageCatch`, whose hand meets the ball on its actual flight at the authored
 * instant, hands the same ball straight back instead of closing on it. The
 * deflection is the outcome the caller decides, so it is published as a launch
 * at the touch, and the incoming flight's sweep leaves the touching hands to
 * that launch as a staged catch's hands are left to it.
 *
 * The rebound is the ball's own restitution off a palm facing the incoming
 * ball: with the palm's normal `n` against the incoming velocity `v`, the
 * outgoing velocity is `v - (1 + e)(v . n) n = -e v`, the normal impact of a
 * sphere on a surface held still through the touch (no tangential friction
 * along a head-on normal).
 */
export const stageDeflect: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanCatchObject.IStageParams> =
  {
    ...stageCatch,
    name: "stageDeflect",
    plan: planStageDeflect,
  };

/*
 * A deliberate deflection of an incoming ball: the staged interception of
 * `stageCatch`, whose hand meets the ball on its actual flight at the authored
 * instant, hands the same ball straight back instead of closing on it. The
 * deflection is the outcome the caller decides, so it is published as a launch
 * at the touch, and the incoming flight's sweep leaves the touching hands to
 * that launch as a staged catch's hands are left to it.
 *
 * The rebound is the ball's own restitution off a palm facing the incoming
 * ball: with the palm's normal `n` against the incoming velocity `v`, the
 * outgoing velocity is `v - (1 + e)(v . n) n = -e v`, the normal impact of a
 * sphere on a surface held still through the touch (no tangential friction
 * along a head-on normal).
 */
function planStageDeflect(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCatchObject.IStageParams>,
): IAutoMovieMotionHumanCatchObject.IPlan {
  const caught: IAutoMovieMotionHumanCatchObject.IPlan =
    stageCatch.plan(context);
  const { ball, partner: from }: IAutoMovieMotionHumanCatchObject.IStageParams =
    context.params;
  const contact: number = caught.contact!;
  const reader: IAutoMovieMotionHumanPropReader = context.prop(ball);
  const restitution: number | undefined = reader.prop.body?.restitution;
  if (restitution === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "ball",
      value: ball,
      reason: "a deflection needs the ball's restitution",
      fix: "give the ball's physical body a restitution",
    });

  const velocity: IAutoMovieVector3 = stageDeflectRebound(
    caught.object,
    contact,
    restitution,
    context.params.intercept ?? contact,
  );
  const source: IAutoMovieMotionHumanPlacedAction = context.action(from);
  const sphere: IAutoMovieMotionPropLaunch["sphere"] =
    source.plan.launches?.find(
      (launch: IAutoMovieMotionPropLaunch): boolean => launch.prop === ball,
    )?.sphere;
  const frame: IAutoMovieRigidTransform = reader.frame(context.start + contact);
  const hands: readonly AutoMovieHumanSide[] =
    context.params.hands === "one"
      ? [context.params.hand ?? "right"]
      : ["left", "right"];
  const launch: IAutoMovieMotionPropLaunch = {
    prop: ball,
    seconds: contact,
    point: frame.position,
    rotation: frame.rotation,
    velocity,
    ...(sphere === undefined ? {} : { sphere }),
    touching: hands,
  };

  // The hands meet the ball and let it go at once: no hold, and no
  // support window on the ball from the touch on.
  const share: number = contact / caught.duration;
  return {
    ...caught,
    holds: (caught.holds ?? []).filter((hold): boolean => hold.prop !== ball),
    contacts: caught.contacts.filter(
      (window: IAutoMovieMotionHumanContactWindow): boolean =>
        !(
          window.support.kind === "prop" &&
          window.support.subject === ball &&
          window.from >= share - 1e-9
        ),
    ),
    launches: [...(caught.launches ?? []), launch],
  };
}
