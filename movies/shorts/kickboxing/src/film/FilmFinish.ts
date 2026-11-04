import type { LabActor } from "../motion-lab/LabActor";
import { LabActualMotion } from "../motion-lab/LabActualMotion";
import { LabCase } from "../motion-lab/LabCase";
import type { LabRecovery } from "../motion-lab/LabRecovery";
import type { LabSettings } from "../motion-lab/LabSettings";
import { labContactFrame } from "../motion-lab/labContactFrame";
import type { MotionAction } from "../motion/core/MotionAction";
import { ContactTrace } from "../motion/interaction/ContactTrace";
import type { FilmExchange } from "./FilmExchange";
import { FilmPlan } from "./FilmPlan";
import { FilmRoute } from "./FilmRoute";
import { inspectFilmImpact } from "./inspectFilmImpact";
import { measureFilmHandoff } from "./measureFilmHandoff";
import { placeFilmFinish } from "./placeFilmFinish";

/**
 * The final supported body-hook to high-kick handoff on one original actor pair.
 * @evidence contracts/common.md#implementation-and-ownership Existing LabCase instances own both techniques, the actual low receiving cover, released clinical arm carry and finite entry tangents. The film retains their original clocks and uses one supported independent setup step to place the measured first head witness at150. No guard, target, mesh, support anchor or rig is replaced.
 * @evidence contracts/common.md#authoring-interface The setup step fills the positive time before the two connected techniques; it is never a frozen prepared pose. Both actual feet must be planted before kick ownership begins, while the old arm is still returning. The displayed150 state must pass the public original-world crossing and depth inspection. Preparation alone does not certify continuous playback.
 */
export class FilmFinish {
  /** Original final two source identities, consumed without duplicate choreography. */
  public readonly plans: readonly Readonly<FilmPlan.Exchange>[];
  /** Whole final setup-and-exchange interval on the film clock. */
  public readonly start: number;
  /** The actual witnessed head contact has exactly this absolute second. */
  public readonly end: number = FilmPlan.koSeconds;
  /** Actual contact-conditioned entries for the independent receiving down module. */
  public readonly knockout: {
    event: MotionAction.ContactEvent;
    a: MotionAction.Sample;
    b: MotionAction.Sample;
    displayed: inspectFilmImpact.Receipt;
  };
  /** Existing independent route, retained in a normalized one-second source clock. */
  private readonly setup: FilmRoute;
  /** Actual unchanged other actor while the setup step is sampled. */
  private readonly setupOther: () => void;
  /** Finite actual whole-surface clearance over the unchanged normalized setup route. */
  private readonly setupClearance: ContactTrace.Result;
  /** Original reusable consumers retain their own canonical actor baselines. */
  private readonly hook: LabCase;
  private readonly kick: LabCase;
  /** Original body-hook time at the admitted two-foot handoff. */
  private readonly handoff: number;
  /** Absolute technique onsets derived from original source clocks, never nominal hit labels. */
  private readonly hookStart: number;
  private readonly kickStart: number;
  /** Original actual first head witness in the high-kick case clock. */
  private readonly impactLocal: number;
  /** Released original arm identity remains independently inspectable. */
  private readonly carry: LabRecovery;
  /** Same immutable actual entry measurements passed to the high-kick consumer. */
  private readonly entryMotion: {
    attacker: LabActualMotion.Measurement;
    receiver: LabActualMotion.Measurement;
  };

  /** Compile two connected techniques after one admitted independent setup step. */
  public constructor(
    plans: readonly Readonly<FilmPlan.Exchange>[],
    private readonly actors: Record<"a" | "b", LabActor>,
  ) {
    const restore: () => void = checkpoint(actors);
    const acquired: LabCase[] = [];
    try {
      if (
        plans.length !== 2 ||
        plans[0]!.actorId !== "a" ||
        plans[0]!.technique !== "hook" ||
        plans[0]!.target !== "body" ||
        plans[1]!.actorId !== "a" ||
        plans[1]!.technique !== "high-kick" ||
        plans[1]!.impactSeconds !== FilmPlan.koSeconds
      )
        throw new Error(
          "The finishing source requires its actual body hook and final high kick",
        );
      this.plans = Object.freeze([...plans]);
      this.start = plans[0]!.start;
      this.setupOther = actors.b.checkpoint();
      this.setup = new FilmRoute(
        actors.a,
        [...FilmPlan.finishing.setupDisplacement],
        1,
      );
      this.setupClearance = ContactTrace.resolve({
        actionId: "finishing-supported-setup",
        actorId: "a",
        targetId: "b",
        start: 0,
        end: 1,
        stepSeconds: 1 / 60,
        refinementSteps: 8,
        maximumCaptures: 160,
        grazeCosine: 0.25,
        capture: (seconds: number): ContactTrace.Frame => {
          this.setupOther();
          this.setup.evaluate(seconds);
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
      this.setup.evaluate(1);
      actors.a.adopt();
      actors.b.adopt();
      this.hook = new LabCase(settings(plans[0]!, actors, true), actors, {
        preserveEntry: true,
        actionId: plans[0]!.id,
        defenseTiming: structuredClone(FilmPlan.finishing.lowCover),
      });
      acquired.push(this.hook);
      admitted(this.hook);
      if (!this.hook.trace?.event || this.hook.trace.event.relation !== "guard")
        throw new Error(
          "The final body-hook setup has no actual receiving forearm interception",
          { cause: this.hook.inspect() },
        );
      this.carry = this.hook.recoveryPort();
      this.handoff = this.findHandoff();
      this.entryMotion = measureFilmHandoff(
        this.hook,
        actors,
        this.handoff,
        "before",
      );
      this.hook.evaluate(this.handoff);
      // Keeping the original actor frame also preserves the original planted WORLD goals.
      this.kick = new LabCase(settings(plans[1]!, actors, false), actors, {
        preserveEntry: true,
        actionId: plans[1]!.id,
        entryMotion: this.entryMotion,
        attackingCarry: { port: this.carry, offsetSeconds: this.handoff },
        stopAt: "first-witness",
      });
      acquired.push(this.kick);
      admitted(this.kick);
      const trace: ContactTrace.Result | undefined = this.kick.trace;
      if (
        !trace?.event ||
        trace.event.relation !== "head" ||
        !inspectFilmImpact.headCarrier(
          actors.b,
          trace.receipt.pair?.receiver ?? "",
        ) ||
        trace.receipt.stopAt !== "first-witness" ||
        trace.event.time !== trace.receipt.witnessTime
      )
        throw new Error(
          "The connected finishing kick does not retain its original first actual head witness",
          { cause: this.kick.inspect() },
        );
      this.impactLocal =
        this.kick.entrySeconds + this.kick.readySeconds + trace.event.time;
      const placement: ReturnType<typeof placeFilmFinish> = placeFilmFinish(
        this.start,
        FilmPlan.koSeconds,
        this.handoff,
        this.impactLocal,
      );
      this.kickStart = placement.kickStart;
      this.hookStart = placement.hookStart;
      this.kick.evaluate(this.impactLocal);
      this.knockout = {
        event: structuredClone(trace.event),
        a: actors.a.constrained(),
        b: actors.b.constrained(),
        displayed: inspectFilmImpact(
          actors.a,
          actors.b,
          trace,
          FilmPlan.koSeconds,
        ),
      };
      this.evaluate(this.end);
    } catch (error: unknown) {
      for (const item of acquired) item.dispose();
      restore();
      throw error;
    }
  }

  /** Find a finite actual two-foot replant while the original arm is still returning. */
  private findHandoff(): number {
    const start: number = this.carry.releasedSeconds + 1 / 2400;
    const end: number = Math.min(
      this.hook.duration,
      this.carry.endSeconds - 1 / 2400,
    );
    for (
      let seconds: number = start;
      seconds <= end;
      seconds += FilmPlan.finishing.handoffStepSeconds
    ) {
      this.hook.evaluate(seconds);
      const sample: MotionAction.Sample = this.actors.a.constrained();
      if (
        this.actors.a.support?.status === "admitted" &&
        this.actors.b.constrained().phase === "contact" &&
        sample.support.kind !== "airborne" &&
        sample.support.kind !== "contacts" &&
        ["left", "right"].every(
          (side: string): boolean =>
            sample.support.patches?.some(
              (patch: MotionAction.SupportPatch): boolean =>
                patch.side === side && patch.mode === "planted",
            ) === true,
        )
      )
        return seconds;
    }
    throw new Error(
      "The final punch provides no actual two-foot replant before its original arm recovery ends",
      { cause: { carry: this.carry.actions, hook: this.hook.inspect() } },
    );
  }

  /**
   * Seek the supported setup and connected techniques from their immutable actual entries.
   * @evidence contracts/common.md#implementation-and-ownership The normalized route is sampled at an affine local time, then each existing case activates its own original baseline. During the handoff the kick owns one body and the old punch supplies only its released arm writer. Both actors restore together on failure.
   * @evidence contracts/common.md#authoring-interface Absolute seconds must be inside this final interval. The original source timings of the hook and kick are unchanged; only the independent setup step receives the remaining positive film time.
   */
  public evaluate(seconds: number): void {
    if (!Number.isFinite(seconds) || seconds < this.start || seconds > this.end)
      throw new Error("Finishing time is outside its actual placement");
    const restore: () => void = checkpoint(this.actors);
    try {
      if (seconds < this.hookStart) {
        this.setupOther();
        this.setup.evaluate(
          (seconds - this.start) / (this.hookStart - this.start),
        );
      } else if (seconds < this.kickStart)
        this.hook.evaluate(seconds - this.hookStart);
      else
        this.kick.evaluate(
          seconds === this.end ? this.impactLocal : seconds - this.kickStart,
        );
    } catch (error: unknown) {
      restore();
      throw error;
    }
  }

  /**
   * Continue this same kick after the actual impact while down owns its receiver.
   * @evidence contracts/common.md#implementation-and-ownership Samples the original case and contact-conditioned return without creating a second strike. The ending consumer immediately replaces B with its independent down sample before drawing.
   * @evidence contracts/common.md#authoring-interface Absolute seconds must be at least150; after the original deadline the original complete return is sustained. This method alone does not complete a two-owner displayed frame.
   */
  public evaluateRecovery(seconds: number): void {
    if (!Number.isFinite(seconds) || seconds < this.end)
      throw new Error("Finishing recovery precedes the actual impact");
    this.kick.evaluate(
      Math.min(this.kick.duration, this.impactLocal + (seconds - this.end)),
    );
  }

  /**
   * Measure the same receiving post-contact branch for the articulated collapse.
   * @evidence contracts/common.md#implementation-and-ownership Uses three actual canonical case samples per side with shared h/h2 observations and restores the prior pair. No RAF delta, raw target tangent or unknown velocity is substituted.
   * @evidence contracts/common.md#authoring-interface Returned arm measurements share the original fixed frame, actual root/support and one-sided post-contact branch. Finite secants remain approximations and do not measure impact force.
   */
  public knockdownEntry(): Record<
    MotionAction.Side,
    LabActualMotion.Measurement
  > {
    const restore: () => void = checkpoint(this.actors);
    try {
      const cache: Map<
        number,
        Record<MotionAction.Side, LabActualMotion.Snapshot>
      > = new Map();
      const sample: (
        seconds: number,
        side: MotionAction.Side,
      ) => LabActualMotion.Snapshot = (
        seconds: number,
        side: MotionAction.Side,
      ): LabActualMotion.Snapshot => {
        if (!cache.has(seconds)) {
          this.kick.evaluate(seconds);
          cache.set(seconds, {
            left: LabActualMotion.capture(
              this.actors.b,
              "left",
              seconds,
              "post-contact",
            ),
            right: LabActualMotion.capture(
              this.actors.b,
              "right",
              seconds,
              "post-contact",
            ),
          });
        }
        return structuredClone(cache.get(seconds)![side]);
      };
      return {
        left: LabActualMotion.measure(
          (seconds: number): LabActualMotion.Snapshot =>
            sample(seconds, "left"),
          this.impactLocal,
          1 / 2400,
          "after",
        ),
        right: LabActualMotion.measure(
          (seconds: number): LabActualMotion.Snapshot =>
            sample(seconds, "right"),
          this.impactLocal,
          1 / 2400,
          "after",
        ),
      };
    } finally {
      restore();
    }
  }

  /**
   * Return only original actual interceptions at their resolved absolute film seconds.
   * @evidence contracts/common.md#implementation-and-ownership Copies the two retained original traces, unique action IDs, original participants and finite query limitations. A missing setup or head contact refuses construction rather than manufacturing a receipt.
   * @evidence contracts/common.md#authoring-interface Event IDs match their source contact intentions. The final high contact is exactly150 by the unchanged actual source witness clock.
   */
  public contacts(): FilmExchange.Contact[] {
    return [
      { item: this.hook, start: this.hookStart },
      { item: this.kick, start: this.kickStart },
    ].map(
      ({
        item,
        start,
      }: {
        item: LabCase;
        start: number;
      }): FilmExchange.Contact => {
        const trace: ContactTrace.Result = item.trace!;
        const event: MotionAction.ContactEvent = trace.event!;
        return {
          eventId: `${event.actionId}:contact`,
          actionId: event.actionId,
          actorId: event.actorId as FilmPlan.ActorId,
          targetId: event.targetId as FilmPlan.ActorId,
          seconds: start + item.entrySeconds + item.readySeconds + event.time,
          relation: event.relation,
          point: [...event.point],
          normal: [...event.normal],
          query: structuredClone(trace.receipt),
          provenance:
            "original actual connected case trace; same displayed polygon actors",
        };
      },
    );
  }

  /**
   * Resolve actual delivery onsets and admitted setup-step arrivals on this same film clock.
   * @evidence contracts/common.md#implementation-and-ownership Original actionClocks provide unchanged technique onsets. Each original normalized touchdown is physically admitted by FilmRoute before the affine setup-time conversion; no attack-frequency or nominal contact label supplies a footstep.
   * @evidence contracts/common.md#authoring-interface Returned events are absolute and shared verbatim by live audio and export. Contact sounds still require the separate actual matching receipts.
   */
  public audioEvents(): FilmPlan.Event[] {
    return [
      ...this.setup.audioEvents(0, "finishing-supported-setup").map(
        (event: FilmPlan.Event): FilmPlan.Event => ({
          ...event,
          seconds: this.start + event.seconds * (this.hookStart - this.start),
        }),
      ),
      ...[
        { item: this.hook, start: this.hookStart },
        { item: this.kick, start: this.kickStart },
      ].flatMap(
        ({ item, start }: { item: LabCase; start: number }): FilmPlan.Event[] =>
          item.actionClocks().map(
            (
              clock: ReturnType<LabCase["actionClocks"]>[number],
            ): FilmPlan.Event => ({
              id: `${clock.actionId}:attempt`,
              kind: "attempt",
              actorId: "a",
              targetId: "b",
              actionId: clock.actionId,
              seconds: start + clock.startSeconds + clock.timing.preparation,
            }),
          ),
      ),
    ];
  }

  /**
   * Read actual handoff, source clocks and displayed world-contact measurements without solving.
   * @evidence contracts/common.md#implementation-and-ownership Retains the original low-cover request, finite actual entry rates, original arm lifetime and displayed150 crossing receipt together with both unchanged consumer diagnostics.
   * @evidence contracts/common.md#authoring-interface This snapshot discloses the finite handoff grid and h/h2 estimates. It does not stand in for continuous Viewer, listening or decoded-film review.
   */
  public inspect(): object {
    return {
      plans: structuredClone(this.plans),
      start: this.start,
      hookStart: this.hookStart,
      kickStart: this.kickStart,
      handoff: this.handoff,
      handoffStepSeconds: FilmPlan.finishing.handoffStepSeconds,
      setupClearance: structuredClone(this.setupClearance),
      entryMotion: structuredClone(this.entryMotion),
      displayed: structuredClone(this.knockout.displayed),
      hook: this.hook.inspect(),
      kick: this.kick.inspect(),
    };
  }

  /**
   * Release both retained cases without retiring the borrowed actor pair.
   * @evidence contracts/common.md#implementation-and-ownership Original consumer disposal releases only its retained traces and continuations. The outer FilmRuntime owns and retires the three actual actors once.
   * @evidence contracts/common.md#authoring-interface No browser, server or audio object is owned here. Disposal follows the same idempotent borrowed-case lifetime.
   */
  public dispose(): void {
    this.hook.dispose();
    this.kick.dispose();
  }
}

/** Actual borrowed-pair rollback, including each immutable source frame. */
function checkpoint(actors: Record<"a" | "b", LabActor>): () => void {
  const restores: (() => void)[] = Object.values(actors).map(
    (actor: LabActor): (() => void) => actor.checkpoint(),
  );
  return (): void => {
    for (const restore of restores) restore();
  };
}
/** One source settings adapter; all technique and receiving behavior remains module-owned. */
function settings(
  plan: Readonly<FilmPlan.Exchange>,
  actors: Record<"a" | "b", LabActor>,
  entry: boolean,
): LabSettings {
  return {
    action: plan.technique,
    actor: plan.actorId,
    side: plan.side,
    target: plan.target,
    defense: plan.defense,
    distance: actors.a.person.object.position.distanceTo(
      actors.b.person.object.position,
    ),
    seed: plan.seed,
    aim: 0.003,
    timingVariation: 0.015,
    timingScale: 0.85,
    direction: 0,
    entry,
  };
}
/** Reject a refused native consumer with its already-collected cause. */
function admitted(item: LabCase): void {
  if (item.admissionError)
    throw new Error(`Finishing source was refused: ${item.admissionError}`, {
      cause: item.inspect(),
    });
}
