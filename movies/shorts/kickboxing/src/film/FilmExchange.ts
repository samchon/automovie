import { LabActor } from "../motion-lab/LabActor";
import { LabCase } from "../motion-lab/LabCase";
import { LabCombinationCase } from "../motion-lab/LabCombinationCase";
import type { LabSettings } from "../motion-lab/LabSettings";
import { labContactFrame } from "../motion-lab/labContactFrame";
import type { MotionAction } from "../motion/core/MotionAction";
import { ContactTrace } from "../motion/interaction/ContactTrace";
import { FilmPlan } from "./FilmPlan";
import { FilmRoute } from "./FilmRoute";

/**
 * One film placement of the same actual module consumer used by the laboratory.
 *
 * @evidence contracts/common.md#implementation-and-ownership Borrows the independently adopted actor pair without resetting it. Existing cases own support-first punches, overlapping continuation, actual full-surface interception and connected recovery. The film adds only an absolute clock, unique action identity and independent supported exit. Failed construction rolls back both actors.
 * @evidence contracts/common.md#authoring-interface An ordinary window contains the whole reusable action and return. An explicit continuing counter owns the outgoing recovery beyond its earlier handoff and does not consume a discarded exit route. Actual receipts retain query brackets and limits. An impactSeconds request refuses before either actor is read or changed; FilmFinish alone owns the witnessed finishing transition.
 */
export class FilmExchange {
  /** Existing actual consumer; no private motion or rig is duplicated here. */
  private readonly playable: LabCase | LabCombinationCase;
  /** Optional independent supported exit after the original complete recovery. */
  private readonly exit: FilmRoute | undefined;
  /** Complete accepted module ending, restored before every independent exit sample. */
  private readonly restoreEnding: (() => void) | undefined;
  /** Every actual contact remains tied to its original unique action. */
  private readonly receipts: FilmExchange.Contact[];
  /** Separate finite exit-clearance receipt, never a global contact exemption. */
  private readonly exitClearance: ContactTrace.Result | undefined;

  /** Bind an immutable module placement from this pair's actual current entry. */
  public constructor(
    public readonly plan: Readonly<FilmPlan.Exchange>,
    private readonly actors: Record<"a" | "b", LabActor>,
    options: { continuingCounter?: boolean } = {},
  ) {
    if (plan.impactSeconds !== undefined)
      throw new Error("Finishing impact requests require FilmFinish");

    const rollback: () => void = pairCheckpoint(actors);
    try {
      for (const actor of Object.values(actors)) actor.adopt();
      const distance: number = actors.a.person.object.position.distanceTo(
        actors.b.person.object.position,
      );
      const settings: LabSettings = {
        action: plan.technique,
        actor: plan.actorId,
        side: plan.side,
        target: plan.target,
        defense: plan.defense,
        distance,
        seed: plan.seed,
        aim: 0.003,
        timingVariation: 0.015,
        timingScale: 0.85,
        direction: 0,
        entry: true,
      };
      const playable: LabCase | LabCombinationCase =
        plan.technique === "one-two"
          ? new LabCombinationCase(settings, actors, {
              preserveEntry: true,
              actionId: plan.id,
            })
          : new LabCase(settings, actors, {
              preserveEntry: true,
              actionId: plan.id,
            });
      if (playable.admissionError)
        throw new Error(
          `Exchange ${plan.id} was refused: ${playable.admissionError}`,
          { cause: playable.inspect() },
        );
      this.playable = playable;
      const traces: { trace: ContactTrace.Result; prefix: number }[] = [];
      if (playable instanceof LabCombinationCase) {
        const observed: {
          jabContact?: ContactTrace.Result;
          crossContact?: ContactTrace.Result;
          crossStart: number;
        } = playable.inspect() as {
          jabContact?: ContactTrace.Result;
          crossContact?: ContactTrace.Result;
          crossStart: number;
        };
        if (observed.jabContact)
          traces.push({
            trace: observed.jabContact,
            prefix: playable.jabStart,
          });
        if (observed.crossContact)
          traces.push({
            trace: observed.crossContact,
            prefix: observed.crossStart,
          });
      } else if (playable.trace)
        traces.push({
          trace: playable.trace,
          prefix: playable.entrySeconds + playable.readySeconds,
        });
      this.receipts = traces.flatMap(
        (row: {
          trace: ContactTrace.Result;
          prefix: number;
        }): FilmExchange.Contact[] => {
          const event: MotionAction.ContactEvent | null = row.trace.event;
          if (!event) return [];
          return [
            {
              eventId: `${event.actionId}:contact`,
              actionId: event.actionId,
              actorId: event.actorId as FilmPlan.ActorId,
              targetId: event.targetId as FilmPlan.ActorId,
              seconds: plan.start + row.prefix + event.time,
              relation: event.relation,
              point: [...event.point],
              normal: [...event.normal],
              provenance:
                "actual original polygon full-surface ContactTrace after public Human support admission",
              query: structuredClone(row.trace.receipt),
            },
          ];
        },
      );
      const window: number = plan.end - plan.start;
      if (!options.continuingCounter && playable.duration > window + 1e-9)
        throw new Error(
          `Exchange ${plan.id} requires ${playable.duration}s but its window provides ${window}s`,
        );
      playable.evaluate(playable.duration);
      const remainder: number = window - playable.duration;
      if (!options.continuingCounter && remainder > 0.16) {
        for (const actor of Object.values(actors)) actor.adopt();
        this.restoreEnding = pairCheckpoint(actors);
        const mover: LabActor =
          actors[
            plan.seed % 3 === 0
              ? plan.actorId
              : plan.actorId === "a"
                ? "b"
                : "a"
          ];
        const other: LabActor = actors[mover === actors.a ? "b" : "a"];
        const sign: number = plan.seed % 2 === 0 ? 1 : -1;
        this.exit = new FilmRoute(
          mover,
          [-0.025, 0, sign * 0.045],
          remainder,
        );
        this.exitClearance = ContactTrace.resolve({
          actionId: `${plan.id}:exit`,
          actorId: mover.id,
          targetId: other.id,
          start: 0,
          end: remainder,
          stepSeconds: 1 / 30,
          refinementSteps: 8,
          maximumCaptures: Math.ceil(remainder * 60) + 32,
          grazeCosine: 0.25,
          capture: (seconds: number): ContactTrace.Frame => {
            this.restoreEnding!();
            this.exit!.evaluate(seconds);
            const sample: MotionAction.Sample = mover.constrained();
            sample.elapsed = seconds;
            const frame: ContactTrace.Frame = labContactFrame(
              mover,
              other,
              sample,
              { action: "step", side: "left", defense: "none" },
              "left",
            );
            for (const attack of frame.attacks) attack.role = "clearance";
            return frame;
          },
        });
      }
      this.evaluate(plan.end);
    } catch (error: unknown) {
      rollback();
      throw error;
    }
  }

  /**
   * Seek one absolute film second through the same immutable actual case and route.
   * @evidence contracts/common.md#implementation-and-ownership Restores only this case's retained prepared entry, then samples its original clock. A supported exit uses its original complete ending. No last-frame state, neutral reset or opposing-root interpolation affects the result. Both actors roll back together on any failure.
   * @evidence contracts/common.md#authoring-interface Seconds must remain within this ordinary FilmPlan window. Finishing contact and post-impact recovery belong to FilmFinish and cannot be requested through this consumer.
   */
  public evaluate(seconds: number): void {
    if (
      !Number.isFinite(seconds) ||
      seconds < this.plan.start - 1e-9 ||
      seconds > this.plan.end + 1e-9
    )
      throw new Error("Exchange seek is outside its film window");
    const rollback: () => void = pairCheckpoint(this.actors);
    try {
      const local: number = Math.max(0, seconds - this.plan.start);
      if (this.exit && local > this.playable.duration) {
        this.restoreEnding!();
        this.exit.evaluate(
          Math.min(this.exit.duration, local - this.playable.duration),
        );
      } else this.playable.evaluate(Math.min(this.playable.duration, local));
    } catch (error: unknown) {
      rollback();
      throw error;
    }
  }

  /**
   * Return detached full-timeline contacts for the same Viewer and export soundtrack.
   * @evidence contracts/common.md#implementation-and-ownership Copies only the retained actual trace receipts and absolute clock conversion. Missing interception yields no contact, no impact sound and no impact-triggered reaction.
   * @evidence contracts/common.md#authoring-interface Event IDs match FilmPlan contact IDs. Query brackets, proxy/sampling limits and original action-local event identity remain attached to every actual receipt.
   */
  public contacts(): FilmExchange.Contact[] {
    return structuredClone(this.receipts);
  }

  /**
   * Borrow the same actual consumer for a typed overlapping opponent counter.
   * @evidence contracts/common.md#implementation-and-ownership Returns the existing consumer with its immutable source entry and original action/contact clocks. The counter uses its explicit recovery port; no new rig, copied solver or whole-pose overwrite is introduced.
   * @evidence contracts/common.md#authoring-interface The film retains disposal ownership. Callers may consume only the public case API and must preserve its original world tasks and actual admission.
   */
  public consumer(): LabCase | LabCombinationCase {
    return this.playable;
  }

  /**
   * Convert an originating case time to its one absolute placement in the film.
   * @evidence contracts/common.md#implementation-and-ownership Adds the fixed ordinary film onset once. No playback history, FPS or observed later pose changes this clock mapping.
   * @evidence contracts/common.md#authoring-interface Input and output are seconds. The caller still owns validating the originating case interval and action/contact lifetime.
   */
  public filmTime(seconds: number): number {
    if (!Number.isFinite(seconds)) throw new Error("Case time must be finite");
    return this.plan.start + seconds;
  }

  /**
   * Convert a film time back to the original case clock without restarting recovery.
   * @evidence contracts/common.md#implementation-and-ownership Subtracts the same fixed onset used by evaluation. This exposes a clock seam rather than another motion or body owner.
   * @evidence contracts/common.md#authoring-interface Input and output are seconds. Negative results precede this placement and must not be mistaken for a restarted action.
   */
  public caseTime(seconds: number): number {
    if (!Number.isFinite(seconds)) throw new Error("Film time must be finite");
    return seconds - this.plan.start;
  }

  /**
   * Resolve air and footstep cues from this same actual consumer's fixed local clocks.
   * @evidence contracts/common.md#implementation-and-ownership Existing placed actions expose their variation-resolved start and preparation duration; filmTime converts that first-delivery onset once. Independent exit touchdowns are admitted by FilmRoute before an audible event exists. Actual contact cues remain separately receipt-gated.
   * @evidence contracts/common.md#authoring-interface Returned times are absolute film seconds. This creates no hit, changes no strike target and does not infer footsteps from attack frequency. The counter compositor must exclude truncated future route events when it takes over an earlier boundary.
   */
  public audioEvents(): FilmPlan.Event[] {
    const attempts: FilmPlan.Event[] = this.playable.actionClocks().map(
      (clock: {
        actionId: string;
        startSeconds: number;
        timing: MotionAction.Timing;
      }): FilmPlan.Event => ({
        id: `${clock.actionId}:attempt`,
        kind: "attempt",
        actorId: this.plan.actorId,
        targetId: this.plan.actorId === "a" ? "b" : "a",
        actionId: clock.actionId,
        seconds: this.filmTime(clock.startSeconds + clock.timing.preparation),
      }),
    );
    return [
      ...attempts,
      ...(this.exit?.audioEvents(
        this.filmTime(this.playable.duration),
        `${this.plan.id}:exit`,
      ) ?? []),
    ];
  }

  /**
   * Read source, actual host and finite route-query evidence without another solve.
   * @evidence contracts/common.md#implementation-and-ownership Returns existing case diagnostics, unique plan and separate exit receipt. No fresh fit is run merely to produce a status label.
   * @evidence contracts/common.md#authoring-interface This is a detached diagnostic snapshot, not continuous viewing, balance, impact-force or complete articulated CCD proof.
   */
  public inspect(): object {
    return {
      plan: structuredClone(this.plan),
      localOffset: 0,
      case: this.playable.inspect(),
      exitClearance: structuredClone(this.exitClearance),
      contacts: this.contacts(),
    };
  }

  /**
   * Release only the case's retained work, preserving the film-owned actor pair.
   * @evidence contracts/common.md#implementation-and-ownership Existing borrowed-actor disposal never retires the shared drawing. The runtime separately owns and disposes each actor once.
   * @evidence contracts/common.md#authoring-interface Terminal disposal clears case resources; this placement must not be sampled afterwards. It never closes a server or another production's process.
   */
  public dispose(): void {
    this.playable.dispose();
  }
}

/** Typed actual receipt used by both media consumers.
 * The merged namespace keeps the receipt type with the consumer that maps actual ContactTrace results to the film clock; it owns no separate execution state.
 * Contact retains actual participants, absolute seconds and the original finite local query receipt. A missing receipt is never replaced by a planned hit.
 */
export namespace FilmExchange {
  /**
   * A real action's first interception mapped onto the film clock.
   * @evidence contracts/common.md#implementation-and-ownership Participant and action identity, exact observed witness and native query receipt remain together. Film timing converts the originating action clock once, while the source event remains unchanged.
   * @evidence contracts/common.md#authoring-interface seconds is absolute film time; point and normal are world metres and a world unit vector. Provenance explicitly states the finite original-surface method and cannot be replaced by planned contact text.
   */
  export interface Contact {
    /** Matching planned consequence. */ eventId: string;
    /** Unique original action placement. */ actionId: string;
    /** Attacking performer. */ actorId: FilmPlan.ActorId;
    /** Actual receiving performer. */ targetId: FilmPlan.ActorId;
    /** Absolute film second of conservative connected reaction. */ seconds: number;
    /** Actual receiving surface classification. */ relation:
      | "guard"
      | "body"
      | "head"
      | "shin-check";
    /** World witness at the receipt's separately named witness time. */ point: MotionAction.Vec3;
    /** World normal from receiver toward attacker. */ normal: MotionAction.Vec3;
    /** Actual mechanism and retained limitations. */ provenance: string;
    /** Original local bracket, participants, work and sampling limits. */ query: ContactTrace.Receipt;
  }
}

/** Reuse each actor's actual transaction boundary without constructing another rig. */
function pairCheckpoint(actors: Record<"a" | "b", LabActor>): () => void {
  const restores: (() => void)[] = [
    actors.a.checkpoint(),
    actors.b.checkpoint(),
  ];
  return (): void => {
    for (const restore of restores) restore();
  };
}
