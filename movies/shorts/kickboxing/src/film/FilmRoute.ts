import * as THREE from "three";

import type { LabActor } from "../motion-lab/LabActor";
import { LabActorSupport } from "../motion-lab/LabActorSupport";
import type { LabFootworkStance } from "../motion-lab/LabFootworkStance";
import { labFootworkSample } from "../motion-lab/labFootworkSample";
import type { MotionAction } from "../motion/core/MotionAction";
import { FootworkMotion } from "../motion/defense/FootworkMotion";
import type { FilmPlan } from "./FilmPlan";

/**
 * A short independent supported route over the actual actor's retained entry.
 *
 * @evidence contracts/common.md#implementation-and-ownership Reuses FootworkMotion and the actual LabActor support consumer. Long destinations are divided into bounded step-and-follow phrases; no paired root interpolation or reset supplies movement. Every sample restores this route's actual entry and heading before the adapter adds the source's actual accumulated foot displacement to each retained original WORLD sole tuple; stationary tuples remain exact.
 * @evidence contracts/common.md#authoring-interface Displacement must be an occupied finite three-tuple of fixed actor-local horizontal metres, duration is seconds and optional yaw is radians. Turns are divided into at most15-degree step-and-follow phrases, each using the current stagger to select its direction-side foot. Footstep timing is staging, not measured gait. Original full-foot and native admission remain required.
 */
export class FilmRoute {
  /** Fixed original stance and its actual plantar bindings. */
  private readonly source: LabFootworkStance;
  /** Reversible entry for order-independent seek on the same drawing. */
  private readonly restore: () => void;
  /** Reusable local-time sole sequence. */
  private readonly motion: FootworkMotion;
  /** Exact caller-owned film window, seconds. */
  public readonly duration: number;
  /** Actual phase-sum endpoint retained by the FootworkMotion source, seconds. */
  public readonly sourceDuration: number;
  /** Planned touchdown boundaries from the same exact step inputs given to FootworkMotion. */
  private readonly touchdowns: { seconds: number; side: MotionAction.Side }[];

  /** Retain an actual entry and divide its displacement into supported phrases. */
  public constructor(
    private readonly actor: LabActor,
    displacement: MotionAction.Vec3,
    duration: number,
    turnRadians: number = 0,
  ) {
    if (
      !Number.isFinite(duration) ||
      duration <= 0 ||
      !Array.isArray(displacement) ||
      displacement.length !== 3 ||
      ![0, 1, 2].every(
        (axis: number): boolean =>
          Object.hasOwn(displacement, axis) &&
          Number.isFinite(displacement[axis]),
      ) ||
      displacement[1] !== 0 ||
      !Number.isFinite(turnRadians) ||
      Math.abs(turnRadians) > Math.PI ||
      (Math.hypot(...displacement) <= 1e-10 && turnRadians === 0)
    )
      throw new Error(
        "A film route requires a finite horizontal three-tuple, movement and positive duration",
      );
    this.restore = actor.checkpoint();
    this.source = {
      pose: structuredClone(actor.basePose),
      origin: actor.origin.toArray(),
      patches: {
        left: structuredClone(actor.patches.left.low),
        right: structuredClone(actor.patches.right.low),
      },
    };
    this.duration = duration;
    const feet: Record<MotionAction.Side, MotionAction.Vec3> = {
      left: actor.local(this.source.patches.left.world),
      right: actor.local(this.source.patches.right.world),
    };
    const count: number = Math.max(
      1,
      Math.ceil(Math.hypot(...displacement) / 0.3),
      Math.ceil(Math.abs(turnRadians) / (Math.PI / 12)),
    );
    const phrase: number = duration / count;
    let cursor: number = 0;
    const steps: FootworkMotion.Step[] = Array.from(
      { length: count },
      (_: unknown, index: number): FootworkMotion.Step => {
        const stagger: THREE.Vector3 = new THREE.Vector3(...feet.left)
          .sub(new THREE.Vector3(...feet.right))
          .applyAxisAngle(
            new THREE.Vector3(0, 1, 0),
            (index * turnRadians) / count,
          );
        const first: MotionAction.Side =
          displacement[0] * stagger.x + displacement[2] * stagger.z >= 0
            ? "left"
            : "right";
        const step: FootworkMotion.Step = {
          start: cursor,
          unload: phrase * 0.12,
          swing: phrase * 0.27,
          load: phrase * 0.12,
          follow: phrase * 0.27,
          settle: phrase * 0.22,
          first,
          displacement: [displacement[0] / count, 0, displacement[2] / count],
          ...(turnRadians !== 0 ? { turnRadians: turnRadians / count } : {}),
          clearance: Math.min(
            0.04,
            0.018 + (Math.hypot(...displacement) / count) * 0.08,
          ),
        };
        cursor = FootworkMotion.end(step);
        return step;
      },
    );
    this.motion = new FootworkMotion(actor.id, feet, steps);
    this.sourceDuration = this.motion.duration;
    this.touchdowns = steps.flatMap(
      (
        step: FootworkMotion.Step,
      ): { seconds: number; side: MotionAction.Side }[] => [
        {
          seconds: FootworkMotion.end(step, "first-landing"),
          side: step.first,
        },
        {
          seconds: FootworkMotion.end(step, "second-landing"),
          side: step.first === "left" ? "right" : "left",
        },
      ],
    );
  }

  /**
   * Evaluate the original route through the same actual public support host.
   * @evidence contracts/common.md#implementation-and-ownership Restores the actual immutable entry and retains the sole request's original WORLD tasks before applying its full-surface goals. Actual pose/root observations are combined with those unchanged support goals and inverse-expressed original external tasks, so a later upper composition cannot replace residuals with achieved FK. Refusal restores the prior displayed state and propagates its raw producer cause.
   * @evidence contracts/common.md#authoring-interface Requires local seconds in the closed film window. Its exact endpoint consumes the actual source endpoint; an earlier source completion holds its completed state without redistributing intermediate phases or relaxing a threshold. Returns actual pose/root observations with original fitting authority; constrained() retains its separate stopped-observation meaning. The actor remains borrowed and the film owns subsequent adoption of an accepted ending.
   */
  public evaluate(seconds: number): MotionAction.Sample {
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > this.duration)
      throw new Error("Route time is outside its supported interval");
    const rollback: () => void = this.actor.checkpoint();
    try {
      this.restore();
      const sourceSeconds: number =
        seconds === this.duration ? this.sourceDuration : seconds;
      const requested: MotionAction.Sample = labFootworkSample(
        this.actor,
        this.motion.sample(sourceSeconds),
        sourceSeconds,
        this.sourceDuration,
        this.source,
      );
      const tasks: LabActorSupport.BodyTask[] = requested.effectors.map(
        (effector: MotionAction.Effector): LabActorSupport.BodyTask => {
          const point: MotionAction.SupportPatch | undefined =
            requested.support.patches?.find(
              (patch: MotionAction.SupportPatch): boolean =>
                patch.bone === effector.bone &&
                patch.localPoint.every(
                  (value: number, axis: number): boolean =>
                    value === (effector.localPoint ?? [0, 0, 0])[axis],
                ),
            );
          if (!point)
            throw new Error(
              "A route effector lacks its original WORLD sole goal",
            );
          return {
            effector: structuredClone(effector),
            world: [...point.world],
          };
        },
      );
      this.actor.apply(requested);
      if (this.actor.support?.status !== "admitted")
        throw new Error(`Route support is unresolved for ${this.actor.id}`, {
          cause: this.actor.inspect(),
        });
      const actual: MotionAction.Sample = this.actor.constrained();
      return {
        ...actual,
        support: structuredClone(requested.support),
        effectors: LabActorSupport.retainedBodyEffectors(
          tasks,
          actual,
          this.actor.origin.toArray(),
          this.actor.yaw,
        ),
      };
    } catch (error: unknown) {
      rollback();
      throw error;
    }
  }

  /**
   * Convert a fixed world destination to this route owner's unchanged actor frame.
   * @evidence contracts/common.md#implementation-and-ownership Subtracts only the actual current root and rotates by that actor's fixed heading once. An opponent destination is chosen by the film before this conversion; no actor movement is read or copied by the route.
   * @evidence contracts/common.md#authoring-interface World and returned local vectors use metres; Y is removed because the route remains on the fixed mat. The returned independent displacement does not admit reach or clearance.
   */
  public static displacement(
    actor: LabActor,
    world: MotionAction.Vec3,
  ): MotionAction.Vec3 {
    const delta: THREE.Vector3 = new THREE.Vector3(...world)
      .sub(actor.person.object.position)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), -actor.yaw);
    return [delta.x, 0, delta.z];
  }

  /**
   * Admit each original route touchdown before publishing a footstep audio event.
   * @evidence contracts/common.md#implementation-and-ownership Exact boundaries derive from the same positive Step phases passed to FootworkMotion, then the actual public support host evaluates every landing. Only admitted real planted geometry creates an audible event. A surrounding checkpoint restores the caller's original display after this finite inspection.
   * @evidence contracts/common.md#authoring-interface Start is an absolute film second and id names this route placement. Returned event times are exact phase boundaries, not a percentage guessed by the audio mixer. This inspection is finite and does not measure impact force or acoustic realism.
   */
  public audioEvents(start: number, id: string): FilmPlan.Event[] {
    if (
      !Number.isFinite(start) ||
      !id.trim() ||
      !["a", "b", "referee"].includes(this.actor.id)
    )
      throw new Error(
        "Route audio requires a film actor, start and unique identity",
      );
    const rollback: () => void = this.actor.checkpoint();
    try {
      return this.touchdowns.map(
        (
          touchdown: { seconds: number; side: MotionAction.Side },
          index: number,
        ): FilmPlan.Event => {
          const sample: MotionAction.Sample = this.evaluate(touchdown.seconds);
          if (
            !sample.support.patches?.some(
              (patch: MotionAction.SupportPatch): boolean =>
                patch.side === touchdown.side && patch.mode === "planted",
            )
          )
            throw new Error(
              "Footstep lacks an actual admitted planted landing",
            );
          return {
            id: `${id}:${touchdown.side}:landing-${index}`,
            kind: "step",
            actorId: this.actor.id as FilmPlan.ActorId,
            actionId: id,
            seconds: start + touchdown.seconds,
          };
        },
      );
    } finally {
      rollback();
    }
  }
}
