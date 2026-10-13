import { IAutoMovieActionCall, IAutoMovieVector3 } from "@automovie/interface";

import { withArticle } from "../text/withArticle";
import { IPerformShotActionPlan } from "./IPerformShotActionPlan";
import { IPerformShotGateContext } from "./IPerformShotGateContext";
import { gatePerformShotStageAction } from "./gatePerformShotStageAction";
import { performShotActors } from "./performShotActors";
import { resolvePerformShotTarget } from "./resolvePerformShotTarget";
import { validatePerformShotFraming } from "./validatePerformShotFraming";
import { validatePerformShotId } from "./validatePerformShotId";

/**
 * Gate every action of a beat's performance against the staged world and sort
 * the list into the plan the later stages of `performShot` read.
 *
 * Each action, at `<base>[i]`, is checked for:
 *
 * - its actor: a non-blank id or a non-empty list of distinct ids, each a
 *   staged node or camera, and a camera only for a `frame` action;
 * - its timing: a start inside `[0, duration]`, a positive finite duration or
 *   `"auto"`, a span inside the shot, an `"auto"` span that is not empty
 *   because it starts at the shot's end, and a positive integer `repeat`.
 *
 * A `frame` action must also state a usable framing and move, name exactly one
 * staged camera, and frame a subject that resolves, with its focus and focal
 * length gated as lens intents. The first camera a `frame` action names
 * becomes the live camera, and a second camera is refused, because a take has
 * one live camera. Every other action joins the stage list and is gated by
 * {@link gatePerformShotStageAction}. Violations go into the context's
 * collector; the plan holds what passed.
 *
 * @param context The shot's staged tables and collector.
 * @param actions The performing action list, the revise pass's when present.
 * @returns The plan: live camera, stage list and its paths, and the jobs.
 *
 * @evidence contracts/common.md#principled-implementation One pass in input order applying each field's stated domain, so violations come out in authoring order and the first frame action elects the camera deterministically; untyped values are checked before use because the function is reachable in-process without the transport's schema gate.
 * @evidence contracts/common.md#clear-and-simple-design Owns the checks every action shares and the frame election; stage verbs are `gatePerformShotStageAction`'s, targets `resolvePerformShotTarget`'s and the framing vocabulary `validatePerformShotFraming`'s, so each rule has one home.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every action is checked by the same rules whatever its verb, the zero-span `"auto"` case is refused rather than given a minimum span, and a rival camera is refused rather than silently ignored.
 * @evidence contracts/common.md#meaningful-documentation States the actor and timing rules, the frame action's extra rules, the camera election and its refusal, where stage verbs are gated, and where violations and results go.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the actions plus their actor lists, with set lookups for staged ids and one duplicate set per actor list.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A single pass over one action list; the staged tables it reads are the context's, built once per shot.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned plan, bounded by the action count, is owned by `performShot` for the rest of its call; nothing else is retained.
 */
export const gatePerformShotActions = (
  context: IPerformShotGateContext,
  actions: readonly IAutoMovieActionCall[],
): IPerformShotActionPlan => {
  const plan: IPerformShotActionPlan = {
    liveCamera: null,
    stageActions: [],
    stageActionPaths: [],
    frames: [],
    launches: [],
    attachments: [],
  };
  actions.forEach((action: IAutoMovieActionCall, index: number): void => {
    const path: string = `${context.base}[${index}]`;
    const actors: string[] = performShotActors(action);
    gateActors(context, action, actors, path);
    gateTiming(context, action, path);
    if (action.verb !== "frame") {
      plan.stageActions.push(action);
      plan.stageActionPaths.push(`${path}.region`);
      gatePerformShotStageAction(context, plan, action, actors, index);
      return;
    }
    validatePerformShotFraming(context.out, path, action.framing, action.move);
    const subject: IAutoMovieVector3 | null = resolvePerformShotTarget(
      context,
      {
        target: action.on,
        path: `${path}.on`,
        label: "frame target",
        subject: "a frame subject",
        seconds: 0,
        formationsFramed: true,
      },
    );
    // The two lens intents are gated like any target or scalar but never read
    // by the camera solve; they ride to `shot.cameraIntent`.
    if (action.focus !== undefined)
      resolvePerformShotTarget(context, {
        target: action.focus,
        path: `${path}.focus`,
        label: "focus target",
        subject: "a focus subject",
        seconds: 0,
        formationsFramed: true,
      });
    if (
      action.focalLength !== undefined &&
      (!Number.isFinite(action.focalLength) || !(action.focalLength > 0))
    )
      context.out.push(
        "range",
        `${path}.focalLength`,
        `a focal length must be a finite number > 0 mm, but was ${action.focalLength}`,
        action.focalLength,
      );
    if (typeof action.actor !== "string")
      context.out.push(
        "type",
        `${path}.actor`,
        `a frame action must name exactly one staged camera, not an actor list`,
        action.actor,
      );
    else if (!context.cameraIds.has(action.actor))
      context.out.push(
        "type",
        `${path}.actor`,
        `a frame action's actor must be a staged camera, but "${action.actor}" is not`,
        action.actor,
      );
    else if (plan.liveCamera === null) plan.liveCamera = action.actor;
    else if (plan.liveCamera !== action.actor)
      context.out.push(
        "type",
        `${path}.actor`,
        `one live camera per shot, "${plan.liveCamera}" already frames it`,
        action.actor,
      );
    if (subject !== null) plan.frames.push({ action, index });
  });
  return plan;
};

/** Check an action's actor field and that every actor is staged. */
const gateActors = (
  context: IPerformShotGateContext,
  action: IAutoMovieActionCall,
  actors: readonly string[],
  path: string,
): void => {
  if (typeof action.actor === "string")
    validatePerformShotId(
      context.out,
      action.actor,
      `${path}.actor`,
      "action actor id",
    );
  else if (Array.isArray(action.actor)) {
    if (action.actor.length === 0)
      context.out.push(
        "type",
        `${path}.actor`,
        "an action actor list must name at least one staged scene node or camera",
        action.actor,
      );
    const seen: Set<string> = new Set();
    action.actor.forEach((actor: string, slot: number): void => {
      validatePerformShotId(
        context.out,
        actor,
        `${path}.actor[${slot}]`,
        "action actor id",
      );
      if (seen.has(actor))
        context.out.push(
          "type",
          `${path}.actor[${slot}]`,
          `actor "${actor}" is duplicated in this action's actor list`,
          actor,
        );
      seen.add(actor);
    });
  } else
    context.out.push(
      "type",
      `${path}.actor`,
      "action actor must be a staged scene node id or an array of ids",
      action.actor,
    );
  for (const actor of actors) {
    const isNode: boolean = context.nodeIds.has(actor);
    const isCamera: boolean = context.cameraIds.has(actor);
    if (!isNode && !isCamera)
      context.out.push(
        "type",
        `${path}.actor`,
        `actor "${actor}" must be a staged scene node or camera`,
        actor,
      );
    else if (action.verb !== "frame" && isCamera)
      context.out.push(
        "type",
        `${path}.actor`,
        `${withArticle(action.verb)} action's actor must be a staged scene node, but "${actor}" is a camera`,
        actor,
      );
  }
};

/** Check an action's start, duration, span and repeat against the shot. */
const gateTiming = (
  context: IPerformShotGateContext,
  action: IAutoMovieActionCall,
  path: string,
): void => {
  const duration: number = context.performance.duration;
  const finiteStart: boolean = Number.isFinite(action.start);
  if (!finiteStart || action.start < 0 || action.start > duration)
    context.out.push(
      "range",
      `${path}.start`,
      `action start must be within [0, ${duration}] (the shot), but was ${action.start}`,
      action.start,
    );
  if (action.duration === "auto") {
    // An "auto" duration fills to the shot end, so an action starting exactly
    // there has no span, and a zero-span coupling bakes duplicate key times
    // that throw when sampled. A later start is already a start violation.
    if (finiteStart && action.start === duration)
      context.out.push(
        "range",
        `${path}.duration`,
        `an "auto" duration leaves no span when the action starts at the shot end (${duration}s), start earlier`,
        action.duration,
      );
  } else {
    const finiteDuration: boolean = Number.isFinite(action.duration);
    if (!finiteDuration || !(action.duration > 0))
      context.out.push(
        "range",
        `${path}.duration`,
        `action duration must be a finite number > 0 seconds or "auto", but was ${action.duration}`,
        action.duration,
      );
    if (finiteStart && finiteDuration && action.start + action.duration > duration)
      context.out.push(
        "range",
        `${path}.duration`,
        `action span [${action.start}, ${action.start + action.duration}] must lie inside the shot [0, ${duration}]`,
        action.duration,
      );
  }
  if (
    action.repeat !== undefined &&
    (!Number.isInteger(action.repeat) || action.repeat < 1)
  )
    context.out.push(
      "range",
      `${path}.repeat`,
      `action repeat must be a positive integer when present, but was ${action.repeat}`,
      action.repeat,
    );
};
