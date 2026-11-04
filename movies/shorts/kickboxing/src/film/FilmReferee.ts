import {
  AutoMovieHumanRigControls,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import * as THREE from "three";

import type { LabActor } from "../motion-lab/LabActor";
import type { MotionAction } from "../motion/core/MotionAction";
import { GestureMotion } from "../motion/down/GestureMotion";
import { FilmPlan } from "./FilmPlan";
import { FilmRoute } from "./FilmRoute";

/**
 * Independent male official, routes, actual attention and legal count gestures.
 *
 * @evidence contracts/common.md#implementation-and-ownership Uses the same original polygon/support host with a referee appearance and no gloves. The film owns count and corner policy; reusable footwork and upper-body gestures own their articulation. Actual fighter positions supply attention and the actual far corner supplies the pointing direction.
 * @evidence contracts/common.md#authoring-interface Every route is world-derived then converted once to the referee's independent actor frame. Count numbers run at 158 through 167 after an open count at 157. This actor never changes either fighter or creates a collision exemption.
 */
export class FilmReferee {
  /** Initial supported state for seek before the first retreat. */
  private readonly initial: () => void;
  /** Chronological independently prepared route entries and endings. */
  private readonly routes: { start: number; end: number; route: FilmRoute }[] =
    [];
  /** Actual far neutral destination supplied after the KO is prepared. */
  private readonly corner: MotionAction.Vec3;
  /** Actual independently fitted pointing endpoint at the end of the approach. */
  private readonly countEntry: MotionAction.Sample;
  /** Raised closed-hand preparation before the first spoken count. */
  private readonly countReady: MotionAction.Sample;

  /** Prepare the referee's fixed routes once, retaining every original entry. */
  public constructor(
    private readonly actor: LabActor,
    private readonly fighters: Record<"a" | "b", LabActor>,
    corner: MotionAction.Vec3,
    fallen: MotionAction.Vec3,
  ) {
    this.corner = [...corner];
    actor.apply(standing(actor, 0));
    if (actor.support?.status !== "admitted")
      throw new Error("Referee initial support is unresolved", {
        cause: actor.inspect(),
      });
    actor.adopt();
    this.initial = actor.checkpoint();
    for (const step of FilmPlan.steps
      .filter(
        (row: Readonly<FilmPlan.Step>): boolean => row.actorId === "referee",
      )
      .sort(
        (a: Readonly<FilmPlan.Step>, b: Readonly<FilmPlan.Step>): number =>
          a.start - b.start,
      )) {
      const destination: MotionAction.Vec3 | undefined =
        step.destination === "fallen-fighter"
          ? [fallen[0] - 0.45, 0, fallen[2] - 0.85]
          : undefined;
      const delta: MotionAction.Vec3 = destination
        ? FilmRoute.displacement(actor, destination)
        : [...step.displacement];
      const route: FilmRoute = new FilmRoute(
        actor,
        delta,
        step.end - step.start,
      );
      route.evaluate(route.duration);
      actor.adopt();
      this.routes.push({ start: step.start, end: step.end, route });
    }
    actor.apply(this.pointing(standing(actor, 157), 1));
    if (actor.support?.status !== "admitted")
      throw new Error("Referee pointing entry is unresolved", {
        cause: actor.inspect(),
      });
    this.countEntry = actor.constrained();
    this.countEntry.effectors = [];
    this.countReady = GestureMotion.sample("count", this.countEntry, 1, {
      side: "right",
      count: 1,
      duration: 0.16,
    });
    this.countReady.pose.arms!.right.hand!.index = {
      mcpFlexion: 65,
      pipFlexion: 80,
      dipFlexion: 55,
    };
    this.initial();
  }

  /**
   * Sample route, observed attention and the current official gesture atomically.
   * @evidence contracts/common.md#implementation-and-ownership Restores the selected route's actual endpoint or current sample before authoring upper-body action. Neck and eyes look toward actual displayed fighters, with native limits retained. Pointing uses an independent world direction and real Hand-bound effector while the lower body keeps its original support.
   * @evidence contracts/common.md#authoring-interface Requires finite film seconds in [0,180] and the winner's actual neutral-corner status before counting. Refused route/gesture fitting restores the previous displayed referee. Crouching is an authored shallow knee/hip action after the stop signal, not an assessment of medical condition.
   */
  public evaluate(seconds: number, neutral: boolean): void {
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > FilmPlan.duration)
      throw new Error("Referee time is outside the film");
    const rollback: () => void = this.actor.checkpoint();
    try {
      const selected:
        | { start: number; end: number; route: FilmRoute }
        | undefined = [...this.routes]
        .reverse()
        .find(
          (route: { start: number; end: number; route: FilmRoute }): boolean =>
            route.start <= seconds,
        );
      if (selected)
        selected.route.evaluate(
          Math.min(selected.route.duration, seconds - selected.start),
        );
      else this.initial();
      let sample: MotionAction.Sample = this.actor.sample
        ? this.actor.constrained()
        : standing(this.actor, seconds);
      if (seconds >= 150 && seconds < FilmPlan.countStart) {
        sample = this.pointing(sample, seconds - 150);
      } else if (
        seconds >= FilmPlan.countStart &&
        seconds < FilmPlan.decisionSeconds
      ) {
        if (!neutral)
          throw new Error(
            "The count cannot run while the winner is outside the far neutral corner",
          );
        const count: number = Math.min(
          10,
          Math.max(1, Math.floor(seconds - FilmPlan.countStart)),
        );
        if (seconds < 158) {
          const u: number = Math.min(1, (seconds - 157) / 0.3);
          sample.pose.arms = AutoMovieHumanRigControls.blend(
            this.countEntry.pose,
            this.countReady.pose,
            u * u * (3 - 2 * u),
          ).arms;
        } else {
          sample.pose.arms = structuredClone(this.countReady.pose.arms);
          if (count > 1)
            sample = GestureMotion.sample("count", sample, 1, {
              side: "right",
              count: count - 1,
              duration: 0.16,
            });
          sample = GestureMotion.sample(
            "count",
            sample,
            seconds - (FilmPlan.countStart + count),
            { side: "right", count, duration: 0.16 },
          );
        }
      } else if (seconds >= FilmPlan.decisionSeconds && seconds < 169.6) {
        const rest: IAutoMovieHumanPose = structuredClone(sample.pose);
        sample.pose.arms = structuredClone(this.countReady.pose.arms);
        sample = GestureMotion.sample("count", sample, 1, {
          side: "right",
          count: 10,
          duration: 0.16,
        });
        sample = GestureMotion.sample(
          "stop",
          sample,
          Math.min(1.4, seconds - FilmPlan.decisionSeconds),
          { side: "right", duration: 0.25 },
        );
        if (seconds >= 169) {
          const u: number = Math.min(1, (seconds - 169) / 0.6);
          sample.pose.arms = AutoMovieHumanRigControls.blend(
            sample.pose,
            rest,
            u * u * (3 - 2 * u),
          ).arms;
        }
      } else if (seconds < 0.8) {
        const command: MotionAction.Sample = GestureMotion.sample(
          "direct-corner",
          sample,
          0.8 - seconds,
          { side: "right", duration: 0.8 },
        );
        sample.pose = command.pose;
      }
      const focus: THREE.Vector3 =
        seconds < 150
          ? new THREE.Vector3(...this.fighters.a.person.point("head")).lerp(
              new THREE.Vector3(...this.fighters.b.person.point("head")),
              0.5,
            )
          : new THREE.Vector3(...this.fighters.b.person.point("head"));
      const head: THREE.Vector3 = new THREE.Vector3(
        ...this.actor.person.point("head"),
      );
      const look: THREE.Vector3 = focus
        .sub(head)
        .applyQuaternion(this.actor.person.object.quaternion.clone().invert());
      const yaw: number = Math.max(
        -35,
        Math.min(35, (Math.atan2(look.z, look.x) * 180) / Math.PI),
      );
      const pitch: number = Math.max(
        -15,
        Math.min(
          25,
          (-Math.atan2(look.y, Math.hypot(look.x, look.z)) * 180) / Math.PI,
        ),
      );
      const pose: IAutoMovieHumanPose = sample.pose;
      pose.neck = {
        ...pose.neck,
        atlantoAxial: { rotation: yaw * 0.65 },
        cervical: { flexion: pitch * 0.65 },
      };
      pose.head = {
        ...pose.head,
        eyes: {
          left: { horizontal: yaw * 0.35, vertical: -pitch * 0.35 },
          right: { horizontal: yaw * 0.35, vertical: -pitch * 0.35 },
        },
        jaw: { opening: speechOpening(seconds) },
      };
      if (seconds >= 169) {
        const weight: number = Math.min(1, (seconds - 169) / 0.6);
        pose.spine = {
          ...pose.spine,
          thoracic: { ...pose.spine?.thoracic, flexion: 12 * weight },
          lumbar: { flexion: 8 * weight },
        };
        for (const side of ["left", "right"] as const) {
          pose.legs ??= { left: {}, right: {} };
          pose.legs[side] = {
            ...pose.legs[side],
            hip: {
              ...pose.legs[side].hip,
              flexion: (pose.legs[side].hip?.flexion ?? 0) + 12 * weight,
            },
            knee: {
              ...pose.legs[side].knee,
              flexion: (pose.legs[side].knee?.flexion ?? 0) + 18 * weight,
            },
          };
        }
        sample.rootOffset[1] -= 0.06 * weight;
      }
      sample.elapsed = seconds;
      this.actor.apply(sample);
      if (this.actor.support?.status !== "admitted")
        throw new Error("Referee gesture or original support is unresolved", {
          cause: this.actor.inspect(),
        });
    } catch (error: unknown) {
      rollback();
      throw error;
    }
  }

  /**
   * Publish actual admitted referee touchdowns from the same independent route clocks.
   * @evidence contracts/common.md#implementation-and-ownership Delegates each retained route's exact touchdown inspection rather than deriving sounds from the count or fighter exchanges. The route owner restores the actual display after inspection.
   * @evidence contracts/common.md#authoring-interface Returned events use absolute film seconds and stable referee-route identities. The caller merges them into the one runtime audio manifest used by both media consumers.
   */
  public audioEvents(): FilmPlan.Event[] {
    return this.routes.flatMap(
      (
        route: { start: number; end: number; route: FilmRoute },
        index: number,
      ): FilmPlan.Event[] =>
        route.route.audioEvents(route.start, `referee-route-${index}`),
    );
  }

  /** Author one continuous actual Hand target toward the independently selected corner. */
  private pointing(
    entry: MotionAction.Sample,
    seconds: number,
  ): MotionAction.Sample {
    const sample: MotionAction.Sample = GestureMotion.sample(
      "direct-corner",
      entry,
      seconds,
      { side: "right", duration: 0.3 },
    );
    const shoulder: THREE.Vector3 = new THREE.Vector3(
      ...this.actor.person.point("rightUpperArm"),
    );
    const direction: THREE.Vector3 = new THREE.Vector3(...this.corner)
      .setY(shoulder.y + 0.05)
      .sub(shoulder)
      .normalize();
    const start: THREE.Vector3 = new THREE.Vector3(
      ...this.actor.person.point("rightHand"),
    );
    const u: number = Math.max(0, Math.min(1, seconds / 0.3));
    const world: MotionAction.Vec3 = start
      .lerp(shoulder.addScaledVector(direction, 0.48), u * u * (3 - 2 * u))
      .toArray();
    sample.effectors = [
      {
        bone: AutoMovieHumanRigControls.joint("rightHand"),
        target: this.actor
          .local(world)
          .map(
            (value: number, index: number): number =>
              value - sample.rootOffset[index]!,
          ) as MotionAction.Vec3,
        role: "guide",
        radius: 0,
      },
    ];
    return sample;
  }
}

/** An independent actual two-foot pose with no fighting or contact task. */
function standing(actor: LabActor, seconds: number): MotionAction.Sample {
  return {
    pose: structuredClone(actor.basePose),
    rootOffset: [0, 0, 0],
    support: {
      left: 0.5,
      right: 0.5,
      patches: [
        structuredClone(actor.patches.left.low),
        structuredClone(actor.patches.right.low),
      ],
    },
    effectors: [],
    phase: "idle",
    elapsed: seconds,
    progress: 0,
  };
}

/** Short retained audio windows drive an approximate mouth envelope, never lip-sync proof. */
function speechOpening(seconds: number): number {
  const speech: Readonly<FilmPlan.Event> | undefined = FilmPlan.events.find(
    (event: Readonly<FilmPlan.Event>): boolean =>
      ["speech", "count", "decision"].includes(event.kind) &&
      seconds >= event.seconds &&
      seconds < event.seconds + (event.durationSeconds ?? 0),
  );
  return speech ? 5 + 3 * Math.sin((seconds - speech.seconds) * 22) ** 2 : 0;
}
