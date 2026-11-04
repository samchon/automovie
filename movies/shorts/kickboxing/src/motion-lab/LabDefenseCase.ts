import { ActionClock } from "../motion/core/ActionClock";
import { ActionVariation } from "../motion/core/ActionVariation";
import type { MotionAction } from "../motion/core/MotionAction";
import { DefenseMotion } from "../motion/defense/DefenseMotion";
import { LabActor } from "./LabActor";
import { LabBodyStage } from "./LabBodyStage";
import { LabFailure } from "./LabFailure";
import type { LabPlayable } from "./LabPlayable";
import type { LabSettings } from "./LabSettings";
import { labDefenseConfig } from "./labDefenseConfig";

/**
 * Exercise an existing defense directly without inventing an incoming hit.
 * @evidence contracts/common.md#implementation-and-ownership Uses the same public defense sampler, original actor geometry and full-floor consumer as an exchange. The other actor holds its independent stance. No ContactEvent, impulse or receiver task is synthesized to make a standalone movement play.
 * @evidence contracts/common.md#authoring-interface Select action defense and a defense kind. Arbitrary seek is deterministic and atomic across both actual actors. Unresolved support remains a refusal with detached raw evidence, distinct from Viewer health.
 */
export class LabDefenseCase implements LabPlayable {
  /** Reproducible original selection. */ public readonly settings: LabSettings;
  /** Variation-resolved full local interval. */ public duration: number = 1;
  /** A refused module cannot become the active transport. */ public admissionError:
    | string
    | null = null;
  /** Shared actors have independent poses and roots. */ public readonly actors: Record<
    "a" | "b",
    LabActor
  >;
  /** Standalone callers own their pair; Viewer callers borrow it. */ private readonly ownsActors: boolean;
  /** Original actor-local defense request. */ private readonly request: MotionAction.Request;
  /** Original measured receiving and clinical references. */ private readonly config: DefenseMotion.Config;
  /** Immutable original actor context, with borrowed fixed geometry providers. */ private readonly context: MotionAction.Context;
  /** Only the committed clock is displayed. */ private seconds: number = 0;
  /** Failed observations survive the independent actor rollback. */ private failed:
    | object
    | undefined;

  /** Bind one existing nominal defense with no contact-conditioned feedback. */
  public constructor(
    settings: LabSettings,
    actors?: Record<"a" | "b", LabActor>,
  ) {
    if (
      settings.action !== "defense" ||
      !Number.isFinite(settings.distance) ||
      settings.distance < 0.4 ||
      settings.distance > 2.5 ||
      !Number.isFinite(settings.timingScale) ||
      settings.timingScale < 0.25 ||
      settings.timingScale > 3
    )
      throw new Error("Invalid standalone defense selection");
    this.settings = structuredClone(settings);
    this.ownsActors = actors === undefined;
    this.actors = actors ?? {
      a: new LabActor("a", "a", -settings.distance / 2, 0),
      b: new LabActor("b", "b", settings.distance / 2, Math.PI),
    };
    if (actors) {
      actors.a.reset(-settings.distance / 2, 0, "left");
      actors.b.reset(settings.distance / 2, Math.PI, "left");
    }
    const actor: LabActor = this.actors[settings.actor];
    const scale: number = settings.timingScale;
    this.request = {
      id: "standalone-defense",
      actorId: actor.id,
      targetId: settings.actor === "a" ? "b" : "a",
      side: settings.side,
      leadSide: "left",
      direction: [1, 0, settings.direction],
      timing: {
        preparation: 0.1 * scale,
        delivery: 0.16 * scale,
        contact: 0.04 * scale,
        retraction: 0.2 * scale,
        recovery: 0.1 * scale,
      },
      variation: {
        seed: settings.seed,
        timingFraction: settings.timingVariation,
        aimMetres: 0,
        amplitudeFraction: 0,
      },
    };
    const timing: MotionAction.Timing = ActionVariation.create(
      this.request,
    ).timing;
    this.context = actor.context(settings.side, [0, 0, 0]);
    this.config = labDefenseConfig(
      actor,
      this.request,
      settings.defense,
      settings.target,
      timing.preparation + timing.delivery,
    );
    this.duration = ActionClock.duration(timing);
    try {
      this.evaluate(0);
    } catch (error: unknown) {
      this.admissionError =
        error instanceof Error ? error.message : String(error);
    }
  }

  /**
   * Apply one nominal defense while keeping both original feet and failure authority visible.
   * @evidence contracts/common.md#implementation-and-ownership Samples the original selected definition and applies its clinical witnesses without granting them hard task authority. Both actors must pass unchanged native floor and loaded-foot checks; a failure restores both drawings and the committed clock.
   * @evidence contracts/common.md#authoring-interface No feedback state is supplied. The closed interval uses the same variation-resolved timing for seek, play and endpoints; failed evidence is detached before rollback.
   */
  public evaluate(seconds: number): void {
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > this.duration)
      throw new Error("Defense time is outside its closed interval");
    const restore: (() => void)[] = Object.values(this.actors).map(
      (actor: LabActor): (() => void) => actor.checkpoint(),
    );
    try {
      const actor: LabActor = this.actors[this.settings.actor];
      const other: LabActor =
        this.actors[this.settings.actor === "a" ? "b" : "a"];
      actor.apply(
        DefenseMotion.sample(
          this.settings.defense === "none" ? "guard" : this.settings.defense,
          this.request,
          this.context,
          seconds,
          this.config,
        ),
      );
      other.apply(
        LabBodyStage.sample({
          pose: other.basePose,
          rootOffset: [0, 0, 0],
          support: {
            left: 0.5,
            right: 0.5,
            patches: [other.patches.left.low, other.patches.right.low],
          },
        }),
      );
      if (
        Object.values(this.actors).some(
          (current: LabActor): boolean =>
            current.support?.status !== "admitted",
        )
      )
        throw new Error("Standalone defense has unresolved actual support");
      this.seconds = seconds;
      this.failed = undefined;
    } catch (error: unknown) {
      this.failed = structuredClone({
        seconds,
        actors: Object.values(this.actors).map((actor: LabActor): object =>
          actor.inspect(),
        ),
        producerCause: error instanceof Error ? error.cause : undefined,
      });
      for (const rollback of restore) rollback();
      throw LabFailure.error("standalone-defense", error, this.failed);
    }
  }

  /**
   * Expose the actual standalone module and absence of any contact event.
   * @evidence contracts/common.md#implementation-and-ownership Reads the same displayed actors and retained nominal request; failed snapshots remain separate from the committed scene.
   * @evidence contracts/common.md#authoring-interface Geometry and rates are not inferred from a successful clock. contact is always null for this explicitly nominal case.
   */
  public inspect(): object {
    return structuredClone({
      kind: "standalone-defense",
      seconds: this.seconds,
      request: this.request,
      config: this.config,
      contact: null,
      admissionError: this.admissionError,
      failedEvaluation: this.failed,
      actors: { a: this.actors.a.inspect(), b: this.actors.b.inspect() },
    });
  }

  /**
   * Name the observed standalone defense and actual support status.
   * @evidence contracts/common.md#implementation-and-ownership Reports selected nominal behavior without calling it a defended hit.
   * @evidence contracts/common.md#authoring-interface Local seconds and actual actor states identify the shown case independently of its pending selection.
   */
  public summary(): string {
    return `${this.settings.actor}: ${this.settings.defense} · nominal defense · ${this.seconds.toFixed(3)} s\nNo incoming contact event. Support A: ${this.actors.a.support?.status}, B: ${this.actors.b.support?.status}`;
  }

  /**
   * Retire only an independently owned pair.
   * @evidence contracts/common.md#implementation-and-ownership Borrowed Viewer actors survive case changes; a portable standalone owner disposes both native drawings.
   * @evidence contracts/common.md#authoring-interface This never closes the Viewer, server or another case's borrowed geometry.
   */
  public dispose(): void {
    if (this.ownsActors)
      for (const actor of Object.values(this.actors)) actor.dispose();
  }
}
