import {
  type IAutoMovieBallisticSolution,
  IAutoMovieClip,
  type IAutoMovieCompileLaunch,
  IAutoMovieInteractionEvent,
  IAutoMovieLaunchAction,
  type IAutoMovieLaunchResult,
  type IAutoMovieProjectile,
  type IAutoMovieProjectileState,
  IAutoMovieReactAction,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { AutoMovieGravity } from "../../physics/AutoMovieGravity";
import { projectileAt } from "../../physics/projectileAt";
import { projectileTrajectory } from "../../physics/projectileTrajectory";
import { solveBallisticLaunch } from "../../physics/solveBallisticLaunch";
import { solveMovingLaunch } from "../../physics/solveMovingLaunch";
import { eventTimeKey } from "./eventTimeKey";

/** The default fall the launch solves against: standard gravity, world −Y. */
const DEFAULT_GRAVITY: IAutoMovieVector3 = AutoMovieGravity.DOWN;

/** Below this landing speed in m/s the incoming direction is undefined. */
const STILL_SPEED: number = 1e-9;

function firstActor(action: IAutoMovieLaunchAction): string | null {
  return typeof action.actor === "string"
    ? action.actor
    : (action.actor[0] ?? null);
}

/**
 * Compose the `launch` verb's engine primitives into one result: the
 * projectile's flight and the struck target's reaction, timed to the
 * engine-computed hit rather than a number the model had to guess.
 *
 * It {@link solveBallisticLaunch solves the aim} that connects `origin` to
 * `target` at `action.speed`, {@link projectileTrajectory bakes the flight} into
 * the projectile node's clip, and, when the launch carries an `onHit` and
 * strikes a node, schedules that node's `react` at the contact. Pass `targetAt`
 * to lead a moving target: the aim then solves through {@link solveMovingLaunch}
 * against where the mover will be when the projectile arrives, and `target`
 * only names the fallback sightline.
 *
 * Times differ by output. The clip is flight-local, keyed over `[0, hitTime]`
 * with id `trajectory:<projectile>`, and the caller shifts it by `action.start`
 * onto the shot clock. The `react` start, the event times, and `targetAt`'s
 * argument are shot-local seconds, so the hit lands at `action.start +
 * hitTime`. The events are a `contact` always, a `hit` when a node is struck,
 * and a `fall` when the react unbalances it; their `actionIndex` is null for
 * the caller to stamp.
 *
 * Returns null when the target is out of range at that speed. Throws
 * `RangeError` when `onHit` has no `targetNode`, because no actor can perform
 * that requested reaction.
 */
export function compileLaunch(
  props: IAutoMovieCompileLaunch.IProps,
): IAutoMovieLaunchResult | null {
  const action: IAutoMovieLaunchAction = props.action;
  if (action.onHit !== undefined && props.targetNode === null)
    throw new RangeError(
      "A launch's onHit requires a targetNode identifying the struck actor; point and group aims identify no actor to recoil.",
    );
  const gravity: IAutoMovieVector3 = props.gravity ?? DEFAULT_GRAVITY;
  const arc: "direct" | "high" = props.arc ?? "direct";
  const targetAt: ((t: number) => IAutoMovieVector3) | undefined =
    props.targetAt;

  // The lead solver measures time from the release, so the mover is read at
  // the release instant plus flight time on the shot clock.
  const solution: IAutoMovieBallisticSolution | null =
    targetAt !== undefined
      ? solveMovingLaunch(
          props.origin,
          (flight: number): IAutoMovieVector3 =>
            targetAt(action.start + flight),
          action.speed,
          gravity,
          arc,
        )
      : solveBallisticLaunch(
          props.origin,
          props.target,
          action.speed,
          gravity,
          arc,
        );
  if (solution === null) return null;

  const projectile: IAutoMovieProjectile = {
    origin: props.origin,
    velocity: solution.velocity,
    gravity,
  };
  const clip: IAutoMovieClip = projectileTrajectory(
    action.projectile,
    projectile,
    solution.hitTime,
    props.fps,
  );
  const landing: IAutoMovieProjectileState = projectileAt(
    projectile,
    solution.hitTime,
  );
  const hitAt: number = action.start + solution.hitTime;
  const targetNode: string | null = props.targetNode;

  let react: IAutoMovieReactAction | null = null;
  if (action.onHit !== undefined && targetNode !== null) {
    // The blow comes from one metre upstream along the incoming velocity, so
    // `target - from` points down the projectile's travel and the synthesiser
    // recoils the body that way. A projectile arriving still has no direction,
    // so the sightline from the origin to the impact is used instead.
    const aimRef: IAutoMovieVector3 =
      targetAt !== undefined ? landing.position : props.target;
    const incoming: IAutoMovieVector3 =
      Vector3.length(landing.velocity) < STILL_SPEED
        ? Vector3.normalize(Vector3.subtract(aimRef, props.origin))
        : Vector3.normalize(landing.velocity);
    react = {
      verb: "react",
      actor: targetNode,
      start: hitAt,
      duration: "auto",
      from: {
        kind: "point",
        point: Vector3.subtract(landing.position, incoming),
      },
      force: action.onHit.force,
      unbalance: action.onHit.unbalance,
    };
  }
  const sourceActor: string | null = firstActor(action);
  const events: IAutoMovieInteractionEvent[] = [
    {
      id: `contact:${action.projectile}:${targetNode ?? "point"}:${eventTimeKey(hitAt)}`,
      kind: "contact",
      source: "collisionSolver",
      time: hitAt,
      actor: sourceActor,
      target: targetNode,
      object: action.projectile,
      point: landing.position,
      actionIndex: null,
      reaction: null,
    },
  ];
  if (targetNode !== null) {
    events.push({
      id: `hit:${action.projectile}:${targetNode}:${eventTimeKey(hitAt)}`,
      kind: "hit",
      source: "impactOutput",
      time: hitAt,
      actor: sourceActor,
      target: targetNode,
      object: action.projectile,
      point: landing.position,
      actionIndex: null,
      reaction: react === null ? null : targetNode,
    });
    if (react?.unbalance === true)
      events.push({
        id: `fall:${targetNode}:${eventTimeKey(hitAt)}`,
        kind: "fall",
        source: "impactOutput",
        time: hitAt,
        actor: targetNode,
        target: null,
        object: action.projectile,
        point: landing.position,
        actionIndex: null,
        reaction: targetNode,
      });
  }

  return {
    clip,
    react,
    hitTime: solution.hitTime,
    hitPoint: landing.position,
    velocity: solution.velocity,
    events,
  };
}
