import type { MotionAction } from "../motion/core/MotionAction";
import { ContactTrace } from "../motion/interaction/ContactTrace";
import { LabActor } from "../motion-lab/LabActor";
import { LabActualMotion } from "../motion-lab/LabActualMotion";
import { LabCase } from "../motion-lab/LabCase";
import { LabCombinationCase } from "../motion-lab/LabCombinationCase";
import type { LabRecovery } from "../motion-lab/LabRecovery";
import type { LabSettings } from "../motion-lab/LabSettings";
import { labContactFrame } from "../motion-lab/labContactFrame";
import { FilmExchange } from "./FilmExchange";
import { FilmPlan } from "./FilmPlan";
import { FilmRoute } from "./FilmRoute";

/**
 * An opposing strike during the original attacker's continuing arm withdrawal.
 *
 * @evidence contracts/common.md#implementation-and-ownership The original case exposes released arm writers with unchanged clocks and stopped states. The incoming real case consumes them inside its receiving body's single support/arm fit, and its full-surface trace therefore includes those actual recovering limbs. This placement never evaluates two opaque actor-pair cases over one another. A supported tail route uses the complete incoming ending.
 * @evidence contracts/common.md#authoring-interface Counter onset is an authored 35 percent of the final outgoing arm's resolved phase duration after release, not a measured tactical reaction time. Only clinical post-release arm carry is supported. Same-side external task conflicts refuse at the actual consumer. Construction and seeking are atomic across the borrowed actors; source construction is not physical or moving-image acceptance.
 */
export class FilmCounter {
  /** Resolved actual overlap onset on the absolute film clock. */
  public readonly start: number;
  /** Original film placement ending, including supported independent exit. */
  public readonly end: number;
  /** Original case second at which the counter begins; it never restarts. */
  private readonly offset: number;
  /** Original immutable recovery lifetime borrowed from the preceding placement. */
  private readonly outgoing: LabRecovery;
  /** Actual canonical pre-handoff values and finite rates for both next owners. */
  private readonly entryMotion: { attacker: LabActualMotion.Measurement; receiver: LabActualMotion.Measurement };
  /** Actual old-case sample count and CPU wall time for finite entry measurement. */
  private readonly entryWork: { captures: number; milliseconds: number };
  /** One actual incoming consumer owns both actors at every counter sample. */
  private readonly playable: LabCase | LabCombinationCase;
  /** Actual original incoming contacts mapped once to absolute film time. */
  private readonly receipts: FilmExchange.Contact[];
  /** Supported independent movement after the complete incoming action. */
  private readonly exit: FilmRoute | undefined;
  /** Exact incoming ending retained before route adoption changes baselines. */
  private readonly restoreEnding: (() => void) | undefined;
  /** Finite actual whole-surface route clearance query. */
  private readonly exitClearance: ContactTrace.Result | undefined;
  /** Actual route landing events, shared by the live and captured soundtracks. */
  private readonly routeEvents: FilmPlan.Event[];
  /** Terminal ownership state. */
  private disposed: boolean = false;

  /** Compile one counter from an existing immutable outgoing action and actual entry. */
  public constructor(previous: FilmExchange, public readonly plan: Readonly<FilmPlan.Exchange>, private readonly actors: Record<"a" | "b", LabActor>) {
    const rollback: () => void = previous.consumer().checkpoint();
    let acquired: LabCase | LabCombinationCase | undefined;
    try {
      if (plan.counterOf !== previous.plan.id || plan.actorId === previous.plan.actorId || plan.impactSeconds !== undefined || plan.technique.endsWith("kick")) throw new Error("A counter requires the named opposite punch and cannot own a kick or finishing transition");
      this.outgoing = previous.consumer().recoveryPort();
      if (this.outgoing.actorId !== previous.plan.actorId) throw new Error("Counter carry participant does not match its original film action");
      const sourceKey: "receiving" | "defense" = previous.consumer() instanceof LabCombinationCase ? "receiving" : "defense";
      const source: Record<typeof sourceKey, { request: MotionAction.Request; firstReturn?: { side: MotionAction.Side; endSeconds: number } }> = previous.consumer().inspect() as Record<typeof sourceKey, { request: MotionAction.Request; firstReturn?: { side: MotionAction.Side; endSeconds: number } }>;
      const receiving: (typeof source)[typeof sourceKey] = source[sourceKey];
      if (plan.side !== receiving.request.side) throw new Error("Counter punch must explicitly take over the original actual receiving arm");
      this.offset = FilmCounter.onset(this.outgoing, receiving.firstReturn && receiving.firstReturn.side !== plan.side ? receiving.firstReturn.endSeconds : 0);
      this.start = previous.filmTime(this.offset);
      this.end = plan.end;
      if (this.start < previous.plan.start || this.start >= previous.plan.end || this.start >= plan.start || this.end <= this.start) throw new Error("Counter onset must overlap the actual preceding recovery before its nominal response window");

      const begun: number = performance.now();
      const cache: Map<number, { attacker: LabActualMotion.Snapshot; receiver: LabActualMotion.Snapshot }> = new Map();
      const boundary: { restore?: () => void } = {};
      const canonical: (seconds: number, role: "attacker" | "receiver") => LabActualMotion.Snapshot = (seconds: number, role: "attacker" | "receiver"): LabActualMotion.Snapshot => {
        if (!cache.has(seconds)) {
          if (seconds <= this.outgoing.releasedSeconds) throw new Error("Counter entry tangent crosses the original contact release");
          previous.evaluate(previous.filmTime(seconds));
          const branch: "post-contact" | "free" = this.outgoing.actions.some((action: LabRecovery["actions"][number]): boolean => action.contact !== undefined) ? "post-contact" : "free";
          cache.set(seconds, { attacker: LabActualMotion.capture(actors[plan.actorId], plan.side, seconds, branch), receiver: LabActualMotion.capture(actors[opposite(plan.actorId)], plan.side === "left" ? "right" : "left", seconds, branch) });
          if (seconds === this.offset) boundary.restore = previous.consumer().checkpoint();
        }
        return structuredClone(cache.get(seconds)![role]);
      };
      const h: number = Math.min(1 / 2400, (this.offset - this.outgoing.releasedSeconds) / 4);
      this.entryMotion = { attacker: LabActualMotion.measure((seconds: number): LabActualMotion.Snapshot => canonical(seconds, "attacker"), this.offset, h, "before"), receiver: LabActualMotion.measure((seconds: number): LabActualMotion.Snapshot => canonical(seconds, "receiver"), this.offset, h, "before") };
      if (!boundary.restore) throw new Error("Canonical counter entry was not captured");
      boundary.restore();
      this.entryWork = { captures: cache.size, milliseconds: performance.now() - begun };

      // Both continuations retain the fixed actor frames and original support anchors.
      // Adopting a newly lowest vertex here would replace the planted-foot task.
      const distance: number = actors.a.person.object.position.distanceTo(actors.b.person.object.position);
      const settings: LabSettings = { action: plan.technique, actor: plan.actorId, side: plan.side, target: plan.target, defense: plan.defense, distance, seed: plan.seed, aim: .003, timingVariation: .015, timingScale: .85, direction: 0, entry: false };
      const options: { preserveEntry: boolean; actionId: string; receivingCarry: { port: LabRecovery; offsetSeconds: number }; entryMotion: FilmCounter["entryMotion"] } = { preserveEntry: true, actionId: plan.id, receivingCarry: { port: this.outgoing, offsetSeconds: this.offset }, entryMotion: this.entryMotion };
      acquired = plan.technique === "one-two" ? new LabCombinationCase(settings, actors, options) : new LabCase(settings, actors, options);
      if (acquired.admissionError) throw new Error(`Counter ${plan.id} was refused: ${acquired.admissionError}`, { cause: acquired.inspect() });
      this.playable = acquired;
      if (this.start + this.deliveryStart() >= previous.filmTime(this.outgoing.endSeconds)) throw new Error("The counter's actual delivery begins after the outgoing recovery has already ended");
      const window: number = this.end - this.start;
      if (acquired.duration > window + 1e-9) throw new Error(`Counter ${plan.id} requires ${acquired.duration}s but its resolved window provides ${window}s`);
      this.receipts = this.readContacts();
      acquired.evaluate(acquired.duration);
      const remainder: number = window - acquired.duration;
      this.routeEvents = [];
      if (remainder > .16) {
        for (const actor of Object.values(actors)) actor.adopt();
        this.restoreEnding = pairCheckpoint(actors);
        const mover: LabActor = actors[plan.seed % 3 === 0 ? plan.actorId : opposite(plan.actorId)];
        const other: LabActor = actors[mover === actors.a ? "b" : "a"];
        const sign: number = plan.seed % 2 === 0 ? 1 : -1;
        this.exit = new FilmRoute(mover, [-.025, 0, sign * .045], remainder);
        this.exitClearance = ContactTrace.resolve({ actionId: `${plan.id}:exit`, actorId: mover.id, targetId: other.id, start: 0, end: remainder, stepSeconds: 1 / 30, refinementSteps: 8, maximumCaptures: Math.ceil(remainder * 60) + 32, grazeCosine: .25, capture: (seconds: number): ContactTrace.Frame => {
          this.restoreEnding!(); this.exit!.evaluate(seconds);
          const sample: MotionAction.Sample = mover.constrained(); sample.elapsed = seconds;
          const frame: ContactTrace.Frame = labContactFrame(mover, other, sample, { action: "step", side: "left", defense: "none" }, "left");
          for (const attack of frame.attacks) attack.role = "clearance";
          return frame;
        } });
        this.routeEvents = this.exit.audioEvents(this.start + acquired.duration, `${plan.id}:exit`);
      }
      this.evaluate(this.end);
    } catch (error: unknown) {
      try { acquired?.dispose(); }
      catch (disposal: unknown) { throw new AggregateError([error, disposal], "Counter preparation and local cleanup failed"); }
      finally { rollback(); }
      throw error;
    }
  }

  /**
   * Evaluate one absolute film time through the single incoming actor-pair owner.
   * @evidence contracts/common.md#implementation-and-ownership The actual case retains its immutable prepared entry and samples outgoing arms at offset plus incoming local time. Its receiver owns the body while the original arm source owns withdrawal. An optional supported exit starts only after the entire incoming action. Any refusal rolls back both real actors.
   * @evidence contracts/common.md#authoring-interface Supply finite seconds inside the closed resolved interval. Original outgoing deadlines remain unchanged even after its arm becomes a complete clinical guard. No FPS, previous draw or two-case last-writer policy enters evaluation.
   */
  public evaluate(seconds: number): void {
    if (this.disposed || !Number.isFinite(seconds) || seconds < this.start - 1e-9 || seconds > this.end + 1e-9) throw new Error("Counter seek is outside its active film interval");
    const rollback: () => void = pairCheckpoint(this.actors);
    try {
      const local: number = Math.max(0, seconds - this.start);
      if (this.exit && local > this.playable.duration) { this.restoreEnding!(); this.exit.evaluate(Math.min(this.exit.duration, local - this.playable.duration)); }
      else this.playable.evaluate(Math.min(this.playable.duration, local));
    } catch (error: unknown) { rollback(); throw error; }
  }

  /**
   * Return only this incoming action's detached actual impact receipts.
   * @evidence contracts/common.md#implementation-and-ownership The preceding placement remains the sole publisher of its original contacts; its unchanged stopped samples remain in the carry port. Incoming traces include actual carried-arm geometry and retain their native brackets and limits. No duplicate old impact is added to the audio timeline.
   * @evidence contracts/common.md#authoring-interface Contact seconds are absolute film time. Absence of an actual event produces no receipt or impact-dependent sound.
   */
  public contacts(): FilmExchange.Contact[] { return structuredClone(this.receipts); }

  /**
   * Resolve attempts and admitted exit landings on the same actual action clock.
   * @evidence contracts/common.md#implementation-and-ownership A punch attempt uses its resolved fist-motion onset after preparation. A one-two keeps independent jab/cross IDs and clocks. Route events were produced by actual supported landing evaluation; impact audio remains separately gated by contacts.
   * @evidence contracts/common.md#authoring-interface Returned events are detached absolute film cues. They establish action timing and native landing admission, not an observed audible mix.
   */
  public audioEvents(): FilmPlan.Event[] {
    const attempts: { actionId: string; local: number }[] = this.playable.recoveryPort().actions.map((action: LabRecovery["actions"][number]): { actionId: string; local: number } => ({ actionId: action.actionId, local: action.deliveryStartSeconds }));
    return [...attempts.map((attempt: { actionId: string; local: number }): FilmPlan.Event => ({ id: `${attempt.actionId}:attempt`, kind: "attempt", actorId: this.plan.actorId, targetId: opposite(this.plan.actorId), actionId: attempt.actionId, seconds: this.start + attempt.local })), ...structuredClone(this.routeEvents)];
  }

  /**
   * Read retained ownership, clocks and native outcomes without another solve.
   * @evidence contracts/common.md#implementation-and-ownership Omits callable closures while copying every original action identity, lifetime and stopped state, plus the current actual case and finite exit receipt. This reports the original recovery rather than a renamed fresh attack.
   * @evidence contracts/common.md#authoring-interface Diagnostics are detached values. Sampling and proxy limits remain those of each actual native trace; no continuous collision or visual acceptance is inferred.
   */
  public inspect(): object { return { plan: structuredClone(this.plan), start: this.start, end: this.end, outgoing: structuredClone({ actorId: this.outgoing.actorId, actions: this.outgoing.actions, releasedSeconds: this.outgoing.releasedSeconds, endSeconds: this.outgoing.endSeconds, originalCaseSecondsAtStart: this.offset }), actualEntry: structuredClone(this.entryMotion), entryWork: { ...this.entryWork }, case: this.playable.inspect(), exitClearance: structuredClone(this.exitClearance), contacts: this.contacts() }; }

  /**
   * Retire only this incoming consumer; the preceding action and film actors stay owned.
   * @evidence contracts/common.md#implementation-and-ownership Idempotent disposal releases the new case's retained work exactly once. The borrowed original recovery port and actors are never disposed here.
   * @evidence contracts/common.md#authoring-interface Sampling a disposed counter refuses. The film separately disposes its original exchange and each actual actor.
   */
  public dispose(): void { if (this.disposed) return; this.disposed = true; this.playable.dispose(); }

  /**
   * Choose a strictly post-release original case time inside the last withdrawal.
   * @evidence contracts/common.md#implementation-and-ownership Validates distinct action and side ownership, original participant/contact relationships and unchanged aggregate deadlines. An authored 35-percent withdrawal fraction selects a real phase duration. A different receiving arm's original deadline may delay onset only while the latest attacking arm is still withdrawing; it never compresses or restarts either action. This pure calculation allocates no actors and retains no input.
   * @evidence contracts/common.md#authoring-interface Returns original case-local seconds. notBeforeSeconds is an existing different-arm return deadline in that same case clock; zero adds no delay. Empty, malformed, conflicting or no-longer-overlapping recovery specifications refuse. Actual entry and canonical finite rates remain the real host's responsibility.
   */
  public static onset(port: Pick<LabRecovery, "actorId" | "actions" | "releasedSeconds" | "endSeconds">, notBeforeSeconds: number = 0): number {
    if (!port.actorId.trim() || port.actions.length < 1 || port.actions.length > 2 || !Number.isFinite(notBeforeSeconds) || notBeforeSeconds < 0) throw new Error("Counter recovery requires one performer, one or two arms and a finite original deadline");
    const ids: Set<string> = new Set();
    const sides: Set<MotionAction.Side> = new Set();
    for (const action of port.actions) {
      if (!action.actionId.trim() || ids.has(action.actionId) || sides.has(action.side) || !["left", "right"].includes(action.side)) throw new Error("Counter recovery requires unique actions and anatomical arm writers");
      ids.add(action.actionId); sides.add(action.side);
      if (![action.deliveryStartSeconds, action.releasedSeconds, action.retractionSeconds, action.endSeconds].every(Number.isFinite) || action.deliveryStartSeconds < 0 || action.releasedSeconds < action.deliveryStartSeconds || action.retractionSeconds <= 0 || action.endSeconds < action.releasedSeconds + action.retractionSeconds - 1e-9) throw new Error("Counter recovery requires original nonnegative phase clocks");
      if (action.contact && (action.contact.event.actionId !== action.actionId || action.contact.event.actorId !== port.actorId || action.contact.event.targetId === port.actorId || !Number.isFinite(action.contact.event.time) || action.contact.event.time < 0 || action.contact.event.time > action.releasedSeconds)) throw new Error("Counter recovery contact belongs to another action, performer or lifetime");
    }
    const release: number = Math.max(...port.actions.map((action: LabRecovery["actions"][number]): number => action.releasedSeconds));
    const end: number = Math.max(...port.actions.map((action: LabRecovery["actions"][number]): number => action.endSeconds));
    if (!Number.isFinite(port.releasedSeconds) || !Number.isFinite(port.endSeconds) || Math.abs(release - port.releasedSeconds) > 1e-9 || Math.abs(end - port.endSeconds) > 1e-9) throw new Error("Counter recovery aggregate clock must preserve its original actions");
    const withdrawal: number = Math.min(...port.actions.filter((action: LabRecovery["actions"][number]): boolean => action.releasedSeconds === release).map((action: LabRecovery["actions"][number]): number => action.retractionSeconds));
    const onset: number = Math.max(release + withdrawal * .35, notBeforeSeconds);
    if (!Number.isFinite(onset) || onset <= release || onset >= release + withdrawal - 1e-9) throw new Error("No original arm withdrawal remains after the other receiving arm's deadline");
    return onset;
  }

  /** Read this fixed case's first resolved delivery onset without evaluating it. */
  private deliveryStart(): number {
    return Math.min(...this.playable.recoveryPort().actions.map((action: LabRecovery["actions"][number]): number => action.deliveryStartSeconds));
  }

  /** Map each unchanged incoming actual trace, preserving its own action clock. */
  private readContacts(): FilmExchange.Contact[] {
    const traces: { trace: ContactTrace.Result; prefix: number }[] = [];
    if (this.playable instanceof LabCase) {
      if (this.playable.trace) traces.push({ trace: this.playable.trace, prefix: this.playable.entrySeconds + this.playable.readySeconds });
    } else {
      const source: { jabContact?: ContactTrace.Result; crossContact?: ContactTrace.Result; crossStart: number } = this.playable.inspect() as { jabContact?: ContactTrace.Result; crossContact?: ContactTrace.Result; crossStart: number };
      if (source.jabContact) traces.push({ trace: source.jabContact, prefix: this.playable.jabStart });
      if (source.crossContact) traces.push({ trace: source.crossContact, prefix: source.crossStart });
    }
    return traces.flatMap((row: { trace: ContactTrace.Result; prefix: number }): FilmExchange.Contact[] => {
      const event: MotionAction.ContactEvent | null = row.trace.event;
      return event ? [{ eventId: `${event.actionId}:contact`, actionId: event.actionId, actorId: event.actorId as FilmPlan.ActorId, targetId: event.targetId as FilmPlan.ActorId, seconds: this.start + row.prefix + event.time, relation: event.relation, point: [...event.point], normal: [...event.normal], provenance: "actual original polygon full-surface counter trace including the original recovering arms", query: structuredClone(row.trace.receipt) }] : [];
    });
  }
}

/** Preserve both borrowed actors together without another fit or recalibration. */
function pairCheckpoint(actors: Record<"a" | "b", LabActor>): () => void {
  const restores: (() => void)[] = [actors.a.checkpoint(), actors.b.checkpoint()];
  return (): void => { for (const restore of restores) restore(); };
}

/** Opposing performer identity is a film relationship rather than a rig control. */
function opposite(actorId: "a" | "b"): "a" | "b" { return actorId === "a" ? "b" : "a"; }
