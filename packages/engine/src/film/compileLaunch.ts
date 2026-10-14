import {
  IAutoMovieClip,
  IAutoMovieInteractionEvent,
  IAutoMovieLaunchAction,
  IAutoMovieReactAction,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { IAutoMovieBallisticSolution } from "../physics/IAutoMovieBallisticSolution";
import { IAutoMovieProjectile } from "../physics/IAutoMovieProjectile";
import { IAutoMovieProjectileState } from "../physics/IAutoMovieProjectileState";
import { projectileAt } from "../physics/projectileAt";
import { projectileTrajectory } from "../physics/projectileTrajectory";
import { solveBallisticLaunch } from "../physics/solveBallisticLaunch";
import { solveMovingLaunch } from "../physics/solveMovingLaunch";
import { IAutoMovieLaunchResult } from "./IAutoMovieLaunchResult";
import { eventTimeKey } from "./eventTimeKey";

/** The default fall the launch solves against: Earth gravity, world −Y. */
const DEFAULT_GRAVITY: IAutoMovieVector3 = { x: 0, y: -9.81, z: 0 };

/** Below this landing speed in m/s the incoming direction is undefined. */
const STILL_SPEED: number = 1e-9;

function firstActor(action: IAutoMovieLaunchAction): string | null {
  return typeof action.actor === "string"
    ? action.actor
    : (action.actor[0] ?? null);
}

/**
 * Compose the `launch` verb's engine primitives into one result: the projectile's flight and the struck target's reaction, timed to the engine-computed hit rather than a number the model had to guess.
 *
 * It {@link solveBallisticLaunch solves the aim} that connects `origin` to `target` at `action.speed`, {@link projectileTrajectory bakes the flight} into the projectile node's clip, and, when the launch carries an `onHit` and strikes a node, schedules that node's `react` at the contact. Pass `targetAt` to lead a moving target: the aim then solves through {@link solveMovingLaunch} against where the mover will be when the projectile arrives, and `target` only names the fallback sightline.
 *
 * Times differ by output. The clip is flight-local, keyed over `[0, hitTime]` with id `trajectory:<projectile>`, and the caller shifts it by `action.start` onto the shot clock. The `react` start, the event times, and `targetAt`'s argument are shot-local seconds, so the hit lands at `action.start + hitTime`. The events are a `contact` always, a `hit` when a node is struck, and a `fall` when the react unbalances it; their `actionIndex` is null for the caller to stamp.
 *
 * Returns null when the target is out of range at that speed. Throws `RangeError` when `onHit` has no non-blank `targetNode`, because no actor can perform that requested reaction.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Solves the closed-form ballistic aim, or its fixed-point lead against a moving target sampled at `action.start` plus flight time, samples the closed-form flight so there is no integration drift, and derives the recoil source one metre up the incoming velocity, falling back to the sightline when the projectile arrives still.
 * @evidence contracts/common.md#clear-and-simple-design Orchestrates the physics primitives and owns only what joins them into a verb: the react, the events and their ids; shifting the clip onto the shot clock and suffixing repeated flights stay with `performShot`, which owns the shot's object-motion list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no projectile or target; Earth gravity follows world down, the stillness threshold guards a zero direction, and a requested recoil without a struck node is refused instead of silently omitted or assigned to an arbitrary group member.
 * @evidence contracts/common.md#meaningful-documentation States what is solved and baked, when a react is scheduled, the leading behaviour, the time base of every output including `targetAt`, the events emitted and their ids, the clip id, and the null case.
 * @evidence contracts/performance.md#efficient-algorithms Static aim takes constant local work; leading adds a bounded fixed-point iteration whose targetAt callback cost is delegated. Output construction then grows with the flight's sampled frame count, O(hitTime × fps), and retains each emitted key.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call compiles one launch from its own inputs and coordinates nothing across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned clip, at most one react and three events.
 */
export function compileLaunch(props: {
  /** The launch to compile: its `projectile`, `speed`, `onHit` and `start`. */
  action: IAutoMovieLaunchAction;

  /** Where the projectile launches from, in world metres. */
  origin: IAutoMovieVector3;

  /** The struck target's world point, where a static aim lands. */
  target: IAutoMovieVector3;

  /**
   * The struck scene node, the emitted `react`'s actor, or null when the aim is a point or group with no single actor to recoil. A null value supports flight and contact without `onHit`; requesting `onHit` without a non-blank target node throws.
   */
  targetNode: string | null;

  /**
   * The target's world position at shot-local second `t`, when it moves during the shot. Supplied, the aim leads the mover to the intercept; omitted, the launch is a static intercept on `target`.
   */
  targetAt?: (t: number) => IAutoMovieVector3;

  /** Constant acceleration in m/s²; defaults to Earth gravity along world −Y. */
  gravity?: IAutoMovieVector3;

  /** A flat `direct` shot, the default, or a lobbed `high` arc. */
  arc?: "direct" | "high";

  /** Samples per second of the baked flight clip; defaults to 30. */
  fps?: number;
}): IAutoMovieLaunchResult | null {
  const action: IAutoMovieLaunchAction = props.action;
  if (
    action.onHit !== undefined &&
    (props.targetNode === null || props.targetNode.trim().length === 0)
  )
    throw new RangeError(
      "A launch's onHit requires a non-blank targetNode identifying the struck actor; point and group aims identify no actor to recoil.",
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
