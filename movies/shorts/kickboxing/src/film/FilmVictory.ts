import * as THREE from "three";

import type { createInspectionRing } from "../createInspectionRing";
import type { LabActor } from "../motion-lab/LabActor";
import { labContactFrame } from "../motion-lab/labContactFrame";
import type { MotionAction } from "../motion/core/MotionAction";
import { GestureMotion } from "../motion/down/GestureMotion";
import { ContactTrace } from "../motion/interaction/ContactTrace";
import { FilmPlan } from "./FilmPlan";
import { FilmRoute } from "./FilmRoute";

/**
 * Supported winner steps and a real quarter-turn beneath the upper celebration.
 * @evidence contracts/common.md#implementation-and-ownership Three independent existing footwork routes own the current sole goals, root and body rotation. Each actual route sample is admitted before the upper gesture is composed, retaining its same hard foot tasks. Pure-yaw endpoint adoption preserves original WORLD tasks through the actual host. A finite complete-surface query keeps the moving winner clear of the actual down track.
 * @evidence contracts/common.md#authoring-interface Movement begins only at168.1 after the ten count and decision; it ends exactly180. The first route divides90degrees into at most15degree phrases. Native floor/support, ring containment and original pair clearance still admit or refuse. This is kinematic authored celebration, not balance, force or continuous-motion approval.
 */
export class FilmVictory {
  /** Same immutable plan rows consumed by actual routes and pure composition checks. */
  public readonly stages: readonly FilmVictory.Stage[];
  /** Same native source routes, each with one retained actor baseline. */
  private readonly routes: { plan: FilmVictory.Stage; route: FilmRoute }[] = [];
  /** Finite full original-surface clearance, not an intentional-contact exemption. */
  private readonly clearance: ContactTrace.Result;
  /** Prepare supported endpoints in order, retaining each one for arbitrary seek. */
  public constructor(
    private readonly actors: Record<"a" | "b", LabActor>,
    private readonly layout: createInspectionRing.Layout,
    private readonly applyReceiver: (seconds: number) => void,
  ) {
    const restore: () => void = this.checkpoint();
    try {
      this.stages = FilmVictory.plan(
        actors.a.person.object.position.toArray(),
        actors.a.yaw,
      );
      for (const plan of this.stages) {
        const route: FilmRoute = new FilmRoute(
          actors.a,
          FilmRoute.displacement(actors.a, [...plan.destination]),
          plan.end - plan.start,
          plan.turnRadians,
        );
        this.routes.push({ plan, route });
        this.evaluate(plan.end);
        actors.a.adopt();
      }
      this.clearance = ContactTrace.resolve({
        actionId: "winner-supported-celebration",
        actorId: "a",
        targetId: "b",
        start: FilmPlan.victory.start,
        end: FilmPlan.duration,
        stepSeconds: 1 / 60,
        refinementSteps: 8,
        maximumCaptures:
          Math.ceil((FilmPlan.duration - FilmPlan.victory.start) * 60) + 40,
        grazeCosine: 0.25,
        capture: (seconds: number): ContactTrace.Frame => {
          this.evaluate(seconds);
          const sample: MotionAction.Sample = actors.a.constrained();
          sample.elapsed = seconds;
          const frame: ContactTrace.Frame = labContactFrame(
            actors.a,
            actors.b,
            sample,
            { action: "step", side: "left", defense: "none" },
            "right",
          );
          for (const attack of frame.attacks) attack.role = "clearance";
          return frame;
        },
      });
      this.evaluate(FilmPlan.duration);
    } catch (error: unknown) {
      restore();
      throw error;
    }
  }

  /**
   * Sample supported lower-body motion before applying the same upper celebration.
   * @evidence contracts/common.md#implementation-and-ownership The selected original route restores its own actual baseline, fits current soles and body yaw, and supplies that actual placement to compose. Both actors roll back if the final composed support, current geometry or original mat bounds refuse. The receiver remains owned by the independent down callback.
   * @evidence contracts/common.md#authoring-interface Requires absolute168.1..180seconds. Accepted source endpoints can be inspected during construction; arbitrary seek never derives a pose from the preceding displayed frame. No attacker action or contact is created.
   */
  public evaluate(seconds: number): void {
    if (
      !Number.isFinite(seconds) ||
      seconds < FilmPlan.victory.start ||
      seconds > FilmPlan.duration
    )
      throw new Error("Victory time is outside the supported ending");
    const row: { plan: FilmVictory.Stage; route: FilmRoute } | undefined =
      this.routes.find(
        (item: { plan: FilmVictory.Stage; route: FilmRoute }): boolean =>
          seconds >= item.plan.start &&
          (seconds < item.plan.end ||
            (seconds === item.plan.end &&
              !this.routes.some(
                (next: {
                  plan: FilmVictory.Stage;
                  route: FilmRoute;
                }): boolean => next.plan.start === seconds,
              ))),
      );
    if (!row) throw new Error("No supported victory route covers this time");
    const restore: () => void = this.checkpoint();
    try {
      const actual: MotionAction.Sample = row.route.evaluate(
        seconds - row.plan.start,
      );
      this.actors.a.apply(FilmVictory.compose(actual, seconds));
      this.applyReceiver(seconds);
      if (this.actors.a.support?.status !== "admitted")
        throw new Error(
          "The composed victory has unresolved original support",
          { cause: this.actors.a.inspect() },
        );
      for (const part of this.actors.a.person.collisionParts()) {
        const points: number[] = this.actors.a.worldMesh(part.mesh).positions;
        for (let index: number = 0; index < points.length; index += 3)
          if (
            points[index]! < this.layout.usableBounds.min[0] ||
            points[index]! > this.layout.usableBounds.max[0] ||
            points[index + 2]! < this.layout.usableBounds.min[2] ||
            points[index + 2]! > this.layout.usableBounds.max[2]
          )
            throw new Error(
              "The actual supported winner leaves the usable ring",
              {
                cause: {
                  seconds,
                  carrier: part.id,
                  world: [points[index], points[index + 1], points[index + 2]],
                },
              },
            );
      }
    } catch (error: unknown) {
      restore();
      throw error;
    }
  }

  /**
   * Admit actual composed landing states before sharing their original route cues.
   * @evidence contracts/common.md#implementation-and-ownership Existing routes provide their exact admitted touchdown clocks. Each event is then sampled through this same full lower-body-plus-gesture consumer before publication. The surrounding pair checkpoint restores the caller's display.
   * @evidence contracts/common.md#authoring-interface Events retain original route IDs and absolute times; no footstep is inferred from arm pulses. The audio mixer receives these same events for live playback and export.
   */
  public audioEvents(): FilmPlan.Event[] {
    const restore: () => void = this.checkpoint();
    try {
      const events: FilmPlan.Event[] = this.routes.flatMap(
        (row: {
          plan: FilmVictory.Stage;
          route: FilmRoute;
        }): FilmPlan.Event[] =>
          row.route.audioEvents(row.plan.start, row.plan.id),
      );
      for (const event of events) this.evaluate(event.seconds);
      return events;
    } finally {
      restore();
    }
  }

  /**
   * Read retained real turn/step source rows and finite clearance without solving again.
   * @evidence contracts/common.md#implementation-and-ownership Copies the same plan rows consumed by the native routes and their original complete-surface query receipt. The body turn is actual root/sole motion rather than a neck-only label.
   * @evidence contracts/common.md#authoring-interface A source receipt is not continuous viewing or a global articulated CCD certificate. Original footwork, whole-body native support and final media review remain separate obligations.
   */
  public inspect(): object {
    return {
      stages: structuredClone(this.stages),
      clocks: this.routes.map(
        (row: { plan: FilmVictory.Stage; route: FilmRoute }): object => ({
          id: row.plan.id,
          windowSeconds: row.route.duration,
          sourceSeconds: row.route.sourceDuration,
        }),
      ),
      clearance: structuredClone(this.clearance),
      limits: [
        "Finite60Hz original full-surface clearance, not complete articulated CCD",
        "Actual native support and authored load transfer, not measured COM/force",
        "Continuous Viewer and listening review required",
      ],
    };
  }

  /** Retain the actual pair, including native support baselines and root orientation. */
  private checkpoint(): () => void {
    const a: () => void = this.actors.a.checkpoint();
    const b: () => void = this.actors.b.checkpoint();
    return (): void => {
      a();
      b();
    };
  }

  /**
   * Resolve one independent in-ring path with continued supported steps after the turn.
   * @evidence contracts/common.md#implementation-and-ownership The actual corner root determines an inward world direction. The first route moves inward while making the commissioned quarter-turn; two later routes step toward and back from the front stands in the resulting heading. No opposing root or camera motion supplies movement.
   * @evidence contracts/common.md#authoring-interface Inputs are actual world metres and fixed actor yaw. Output rows cover168.1..180 without a neutral gap. These authored destinations still require the actual native route and full-surface clearance.
   */
  public static plan(
    origin: MotionAction.Vec3,
    yaw: number,
  ): readonly FilmVictory.Stage[] {
    if (
      origin.length !== 3 ||
      ![origin[0], origin[1], origin[2]].every(Number.isFinite) ||
      !Number.isFinite(yaw) ||
      Math.hypot(origin[0], origin[2]) <= 1e-10
    )
      throw new Error(
        "Victory routes need a finite actual corner root and heading",
      );
    const toward: THREE.Vector3 = new THREE.Vector3(
      -origin[0],
      0,
      -origin[2],
    ).setLength(FilmPlan.victory.inwardMetres);
    const first: MotionAction.Vec3 = [
      origin[0] + toward.x,
      0,
      origin[2] + toward.z,
    ];
    const front: THREE.Vector3 = new THREE.Vector3(
      FilmPlan.victory.forwardMetres,
      0,
      0,
    ).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      yaw + FilmPlan.victory.turnRadians,
    );
    const second: MotionAction.Vec3 = [
      first[0] + front.x,
      0,
      first[2] + front.z,
    ];
    const back: THREE.Vector3 = front
      .clone()
      .setLength(-FilmPlan.victory.returnMetres);
    const third: MotionAction.Vec3 = [
      second[0] + back.x,
      0,
      second[2] + back.z,
    ];
    const stages: FilmVictory.Stage[] = [
      {
        id: "winner-step-turn",
        start: FilmPlan.victory.start,
        end: FilmPlan.victory.turnEnd,
        destination: first,
        turnRadians: FilmPlan.victory.turnRadians,
      },
      {
        id: "winner-front-step",
        start: FilmPlan.victory.turnEnd,
        end: FilmPlan.victory.secondEnd,
        destination: second,
        turnRadians: 0,
      },
      {
        id: "winner-return-step",
        start: FilmPlan.victory.secondEnd,
        end: FilmPlan.duration,
        destination: third,
        turnRadians: 0,
      },
    ];
    return Object.freeze(
      stages.map(
        (stage: FilmVictory.Stage): FilmVictory.Stage =>
          Object.freeze({
            ...stage,
            destination: Object.freeze([
              ...stage.destination,
            ]) as unknown as MotionAction.Vec3,
          }),
      ),
    );
  }

  /**
   * Compose upper celebration over the current actual lower-body placement and tasks.
   * @evidence contracts/common.md#implementation-and-ownership GestureMotion receives the current supported route sample on every call. Its attack-task clearing is followed only by restoration of that same route's foot tasks; root, sole orientation, support and legs remain the route owner's actual values. Initial centre attention returns smoothly during the real body turn.
   * @evidence contracts/common.md#authoring-interface Input must be the admitted current route sample and seconds must be168.1..180. This pure composition does no fitting; the actual FilmVictory consumer admits the final displayed pose afterward.
   */
  public static compose(
    actual: MotionAction.Sample,
    seconds: number,
  ): MotionAction.Sample {
    if (
      !Number.isFinite(seconds) ||
      seconds < FilmPlan.victory.start ||
      seconds > FilmPlan.duration
    )
      throw new Error("Victory composition requires its actual ending clock");
    const sample: MotionAction.Sample = GestureMotion.sample(
      "celebrate",
      actual,
      seconds - FilmPlan.victory.start,
      { side: "left", duration: 0.5 },
    );
    sample.effectors = structuredClone(actual.effectors);
    sample.pose.legs = structuredClone(actual.pose.legs);
    const progress: number = Math.max(
      0,
      Math.min(
        1,
        (seconds - FilmPlan.victory.start) /
          (FilmPlan.victory.turnEnd - FilmPlan.victory.start),
      ),
    );
    const weight: number = 1 - progress * progress * (3 - 2 * progress);
    sample.pose.neck = {
      ...sample.pose.neck,
      atlantoAxial: {
        rotation: (actual.pose.neck?.atlantoAxial?.rotation ?? 0) * weight,
      },
    };
    sample.pose.head = {
      ...sample.pose.head,
      eyes: {
        left: {
          ...sample.pose.head?.eyes?.left,
          horizontal: (actual.pose.head?.eyes?.left?.horizontal ?? 0) * weight,
        },
        right: {
          ...sample.pose.head?.eyes?.right,
          horizontal: (actual.pose.head?.eyes?.right?.horizontal ?? 0) * weight,
        },
      },
    };
    return sample;
  }
}

/**
 * Actual independent supported route intervals for the ending consumer.
 * Shares the movie-owned plan rows with the actual route factory and pure integration checks; motion implementation stays in the reusable footwork module.
 * Stages are film-second intervals and destinations are WORLD metres, distinct from each route's actor-local displacement.
 */
export namespace FilmVictory {
  /**
   * One original route and explicit body-turn intent.
   * @evidence contracts/common.md#implementation-and-ownership Names a supported route, complete interval, world endpoint and original yaw intent without carrying a copied pose or solver.
   * @evidence contracts/common.md#authoring-interface Endpoints are requests until actual native admission; immutable rows do not certify collision, physical plausibility or playback.
   */
  export interface Stage {
    /** Stable original route identity. */ id: string;
    /** Absolute onset. */ start: number;
    /** Absolute complete ending. */ end: number;
    /** Original world endpoint. */ destination: MotionAction.Vec3;
    /** Total authored body yaw in radians. */ turnRadians: number;
  }
}
