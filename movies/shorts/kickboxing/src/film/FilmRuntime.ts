import type { AudioMix } from "../audio/AudioMix";
import { createInspectionRing } from "../createInspectionRing";
import { LabActor } from "../motion-lab/LabActor";
import { FilmCounter } from "./FilmCounter";
import { FilmEnding } from "./FilmEnding";
import { FilmExchange } from "./FilmExchange";
import { FilmFinish } from "./FilmFinish";
import { FilmPlan } from "./FilmPlan";
import { FilmRoute } from "./FilmRoute";
import { FilmTouch } from "./FilmTouch";

/** One actual retained placement and its resolved audible events. */
interface FilmClip {
  id: string;
  start: number;
  end: number;
  evaluate: (seconds: number) => void;
  audioEvents?: () => FilmPlan.Event[];
}

/**
 * The actual three-performer film assembled from reusable motion consumers.
 *
 * @evidence contracts/common.md#implementation-and-ownership One actor pair and one male official use the original polygon Human host. Immutable case/route entries make the sequence seekable without new rigs. Actual contact, not plan text, gates the finishing transition and complete soundtrack. Whole-film preparation compiles every placement, while live playback still reports any unsampled intermediate physical failure honestly.
 * @evidence contracts/common.md#authoring-interface Public time is absolute [0,180] seconds. Construction owns exactly three actors; prepare must complete before evaluate. Every displayed update and committed clock is atomic across all performers. Full-body collision, force, continuous motion and listening acceptance remain independent review obligations.
 */
export class FilmRuntime {
  /** Original actors mounted once by the Viewer. */
  public readonly actors: Record<FilmPlan.ActorId, LabActor>;
  /** Actual stage descriptor shared with the displayed ring. */
  public readonly layout: createInspectionRing.Layout;
  /** Successfully committed film second, separate from preparation samples. */
  public seconds: number = 0;
  /** Whole source sequence has been compiled; this does not claim watched acceptance. */
  public ready: boolean = false;
  /** Last actual refused placement and its already-computed native diagnostics. */
  public failure: object | null = null;
  /** Elapsed source intervals; async compilation includes yields, while drawing/encoding stay separate. */
  public readonly costs: {
    actorConstructionMs: number;
    sequenceCompilationMs: number;
    lastMotionMs: number;
  } = {
    actorConstructionMs: 0,
    sequenceCompilationMs: 0,
    lastMotionMs: 0,
  };
  /** Finite fixed source schedule, with the actual entry retained by each consumer. */
  private readonly clips: FilmClip[] = [];
  /** Completed module placements own retained traces, never another actor pair. */
  private readonly exchanges: FilmExchange[] = [];
  /** Opponent counters retain original outgoing-arm clocks through their typed carry ports. */
  private readonly counters: FilmCounter[] = [];
  /** The one actual audio manifest replaces nominal onset/footstep intentions after compilation. */
  private audioSchedule: FilmPlan.Event[] = [];
  /** Same actual touch consumer used for every opening seek. */
  private touch: FilmTouch | undefined;
  /** Immutable whole-timeline contacts shared by live and exported audio. */
  private contactReceipts: FilmExchange.Contact[] = [];
  /** One prepared actual ending owns collapse, corner, referee and floor observations. */
  private ending: FilmEnding | undefined;
  /** Final connected body-hook and kick retain one actual handoff and displayed contact. */
  private finish: FilmFinish | undefined;
  /** Current clip identity for truthful Viewer inspection. */
  private active: string = "unprepared";
  /** A sticky shared preparation prevents duplicate full-film computation. */
  private preparation: Promise<void> | undefined;
  /** Terminal owner state prevents late async publication. */
  private disposed: boolean = false;

  /** Construct only the original polygon performers; no dense Human skin is generated. */
  public constructor(
    layout: createInspectionRing.Layout = createInspectionRing.layout(),
  ) {
    this.layout = layout;
    const begun: number = performance.now();
    const acquired: LabActor[] = [];
    try {
      const a: LabActor = new LabActor("a", "a", -0.64, 0, "left", -0.025);
      acquired.push(a);
      const b: LabActor = new LabActor("b", "b", 0.64, Math.PI, "left", 0.025);
      acquired.push(b);
      const referee: LabActor = new LabActor(
        "referee",
        "referee",
        -0.6,
        -Math.PI / 2,
        "left",
        -1.55,
      );
      acquired.push(referee);
      this.actors = { a, b, referee };
      this.costs.actorConstructionMs = performance.now() - begun;
    } catch (error: unknown) {
      for (const actor of acquired) actor.dispose();
      throw error;
    }
  }

  /**
   * Compile the complete source once before declaring the film loaded.
   * @evidence contracts/common.md#implementation-and-ownership Sequential compilation carries each actual accepted ending into the next entry; each completed consumer retains its own baseline for later arbitrary seek. Short event-loop yields keep the already drawn Viewer responsive. A failure restores the original three actors and exposes the refused source/actual cause; partial compilation never authorizes export or complete audio.
   * @evidence contracts/common.md#authoring-interface Concurrent callers share one sticky Promise. Progress reports source IDs and counts, not completed video review. Disposal rejects later publication; no worker, server, renderer or media encoder is started here.
   */
  public prepare(
    progress?: (id: string, completed: number, total: number) => void,
  ): Promise<void> {
    if (this.disposed)
      return Promise.reject(new Error("The film runtime is disposed"));
    this.preparation ??= this.compile(progress);
    return this.preparation;
  }

  /** Prepare chronology from actual endpoint adoption, retaining source and failure evidence. */
  private async compile(
    progress?: (id: string, completed: number, total: number) => void,
  ): Promise<void> {
    const original: () => void = this.checkpoint();
    const begun: number = performance.now();
    const pair: Record<"a" | "b", LabActor> = {
      a: this.actors.a,
      b: this.actors.b,
    };
    try {
      this.addRoutes(
        "opening-step",
        0,
        0.8,
        FilmPlan.steps.filter(
          (step: Readonly<FilmPlan.Step>): boolean =>
            step.start === 0 && step.actorId !== "referee",
        ),
      );
      this.touch = new FilmTouch(pair);
      const touch: FilmTouch = this.touch;
      this.clips.push({
        id: "opening-touch",
        start: 0.8,
        end: 1.55,
        evaluate: (seconds: number): void => touch.evaluate(seconds - 0.8),
      });
      touch.evaluate(0.75);
      this.contactReceipts.push(...touch.contacts());
      this.adoptFighters();
      let cursor: number = 1.55;
      for (const plan of FilmPlan.exchanges.slice(0, -2)) {
        if (this.disposed)
          throw new Error("Film preparation was cancelled by disposal");
        if (plan.start > cursor + 1e-9)
          this.addRoutes(
            `angle-before-${plan.id}`,
            cursor,
            plan.start,
            FilmPlan.steps.filter(
              (step: Readonly<FilmPlan.Step>): boolean =>
                step.actorId !== "referee" &&
                step.start >= cursor - 1e-9 &&
                step.end <= plan.start + 1e-9,
            ),
          );
        if (plan.counterOf) {
          const previous: FilmExchange | undefined = this.exchanges.at(-1);
          if (!previous || previous.plan.id !== plan.counterOf)
            throw new Error(
              "A counter must name its immediate original attack",
            );
          const counter: FilmCounter = new FilmCounter(previous, plan, pair);
          const preceding: FilmClip = this.clips.at(-1)!;
          if (counter.start <= preceding.start || counter.start > preceding.end)
            throw new Error(
              "The actual counter boundary lies outside its originating attack",
            );
          preceding.end = counter.start;
          this.counters.push(counter);
          this.contactReceipts.push(...counter.contacts());
          this.clips.push({
            id: plan.id,
            start: counter.start,
            end: counter.end,
            evaluate: (seconds: number): void => counter.evaluate(seconds),
            audioEvents: (): FilmPlan.Event[] => counter.audioEvents(),
          });
          counter.evaluate(counter.end);
        } else {
          const following: Readonly<FilmPlan.Exchange> | undefined =
            FilmPlan.exchanges[
              this.exchanges.length + this.counters.length + 1
            ];
          const exchange: FilmExchange = new FilmExchange(plan, pair, {
            continuingCounter: following?.counterOf === plan.id,
          });
          this.exchanges.push(exchange);
          this.contactReceipts.push(...exchange.contacts());
          this.clips.push({
            id: plan.id,
            start: plan.start,
            end: plan.end,
            evaluate: (seconds: number): void => exchange.evaluate(seconds),
            audioEvents: (): FilmPlan.Event[] => exchange.audioEvents(),
          });
        }
        cursor = plan.end;
        if (
          !FilmPlan.exchanges[this.exchanges.length + this.counters.length]
            ?.counterOf
        )
          this.adoptFighters();
        progress?.(
          plan.id,
          this.exchanges.length + this.counters.length,
          FilmPlan.exchanges.length,
        );
        await new Promise<void>((resolve: () => void): void => {
          setTimeout(resolve, 0);
        });
      }
      const finish: FilmFinish = new FilmFinish(
        FilmPlan.exchanges.slice(-2),
        pair,
      );
      this.finish = finish;
      progress?.(
        FilmPlan.exchanges.at(-1)!.id,
        FilmPlan.exchanges.length,
        FilmPlan.exchanges.length,
      );
      this.contactReceipts.push(...finish.contacts());
      this.clips.push({
        id: "connected-finishing-setup",
        start: finish.start,
        end: finish.end,
        evaluate: (seconds: number): void => finish.evaluate(seconds),
        audioEvents: (): FilmPlan.Event[] => finish.audioEvents(),
      });
      this.ending = new FilmEnding(finish, this.actors, this.layout);
      this.clips.push(...this.ending.clips);
      this.audioSchedule = [
        ...FilmPlan.events
          .filter(
            (event: Readonly<FilmPlan.Event>): boolean =>
              event.kind !== "attempt" && event.kind !== "step",
          )
          .map(
            (event: Readonly<FilmPlan.Event>): FilmPlan.Event =>
              structuredClone(event),
          ),
        ...this.clips.flatMap((clip: FilmClip): FilmPlan.Event[] =>
          (clip.audioEvents?.() ?? []).filter(
            (event: FilmPlan.Event): boolean =>
              event.seconds >= clip.start - 1e-9 && event.seconds < clip.end,
          ),
        ),
        ...this.ending.referee.audioEvents(),
      ].sort(
        (a: FilmPlan.Event, b: FilmPlan.Event): number => a.seconds - b.seconds,
      );
      if (this.disposed)
        throw new Error("Film preparation was cancelled by disposal");
      this.ready = true;
      this.evaluate(0);
    } catch (error: unknown) {
      this.failure = {
        stage: "film-compilation",
        source: this.exchanges.at(-1)?.plan.id ?? "opening",
        message: error instanceof Error ? error.message : String(error),
        producerCause: error instanceof Error ? error.cause : undefined,
        actors: Object.values(this.actors).map((actor: LabActor): object =>
          actor.inspect(),
        ),
      };
      original();
      this.ready = false;
      throw error;
    } finally {
      this.costs.sequenceCompilationMs = performance.now() - begun;
    }
  }

  /** Carry independent actual ending poses forward without a new guard or shared root. */
  private adoptFighters(): void {
    this.actors.a.adopt();
    this.actors.b.adopt();
  }

  /** Prepare a gap's explicitly named route; its nonmoving actor retains the same actual ending. */
  private addRoutes(
    id: string,
    start: number,
    end: number,
    steps: readonly Readonly<FilmPlan.Step>[],
  ): void {
    const entry: (() => void)[] = Object.values(this.actors)
      .filter((actor: LabActor): boolean => actor.id !== "referee")
      .map((actor: LabActor): (() => void) => actor.checkpoint());
    const routes: { actorId: FilmPlan.ActorId; route: FilmRoute }[] = steps.map(
      (
        step: Readonly<FilmPlan.Step>,
      ): { actorId: FilmPlan.ActorId; route: FilmRoute } => ({
        actorId: step.actorId,
        route: new FilmRoute(
          this.actors[step.actorId],
          [...step.displacement],
          end - start,
        ),
      }),
    );
    if (!routes.length) throw new Error(`Unperformed film gap ${id}`);
    const evaluate: (seconds: number) => void = (seconds: number): void => {
      for (const restore of entry) restore();
      for (const route of routes) route.route.evaluate(seconds - start);
    };
    this.clips.push({
      id,
      start,
      end,
      evaluate,
      audioEvents: (): FilmPlan.Event[] =>
        routes.flatMap(
          (row: {
            actorId: FilmPlan.ActorId;
            route: FilmRoute;
          }): FilmPlan.Event[] =>
            row.route.audioEvents(start, `${id}:${row.actorId}`),
        ),
    });
    evaluate(end);
    this.adoptFighters();
  }

  /**
   * Evaluate one absolute time and publish only a complete admitted three-actor frame.
   * @evidence contracts/common.md#implementation-and-ownership The retained placement restores its own actual entry before sampling. Both fighters are completed before independent referee attention is evaluated. All three actors and the committed clock roll back on any refusal; previous source checkpoints and contact receipts never change.
   * @evidence contracts/common.md#authoring-interface Requires completed preparation and finite [0,180] seconds. The count only proceeds while the winner remains at the actual far neutral destination. No timestamp or planned pose is treated as evidence of playback, sound or whole-body collision acceptance.
   */
  public evaluate(seconds: number): void {
    if (!this.ready || this.disposed)
      throw new Error("The complete film is not loaded");
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > 180)
      throw new Error("Film seek must remain inside [0,180]");
    const rollback: () => void = this.checkpoint();
    const begun: number = performance.now();
    try {
      const clip: FilmClip | undefined = this.clips.find(
        (row: FilmClip): boolean =>
          seconds >= row.start &&
          (seconds < row.end || (seconds === 180 && row.end === 180)),
      );
      if (!clip)
        throw new Error(`No consumed film placement covers ${seconds}s`);
      clip.evaluate(seconds);
      const neutral: boolean =
        Math.hypot(
          this.actors.a.person.object.position.x - this.ending!.neutral[0],
          this.actors.a.person.object.position.z - this.ending!.neutral[2],
        ) < 0.05;
      this.ending!.referee.evaluate(seconds, neutral);
      this.seconds = seconds;
      this.active = clip.id;
      this.failure = null;
      this.costs.lastMotionMs = performance.now() - begun;
    } catch (error: unknown) {
      const cause: object = {
        stage: "film-evaluation",
        seconds,
        message: error instanceof Error ? error.message : String(error),
        producerCause: error instanceof Error ? error.cause : undefined,
        actors: Object.values(this.actors).map((actor: LabActor): object =>
          actor.inspect(),
        ),
      };
      rollback();
      this.failure = cause;
      throw error;
    }
  }

  /**
   * Retain the actual displayed three-actor state for an atomic camera/draw boundary.
   * @evidence contracts/common.md#implementation-and-ownership Reuses public actor checkpoints and copies only this runtime's committed clock and active source identity. It introduces no separate pose cache or solver.
   * @evidence contracts/common.md#authoring-interface The synchronous restore belongs to this runtime lifetime. The Viewer uses it when a camera or drawing failure follows successful motion evaluation; no new frame is certified on restoration.
   */
  public checkpoint(): () => void {
    const restores: (() => void)[] = Object.values(this.actors).map(
      (actor: LabActor): (() => void) => actor.checkpoint(),
    );
    const seconds: number = this.seconds;
    const active: string = this.active;
    return (): void => {
      for (const restore of restores) restore();
      this.seconds = seconds;
      this.active = active;
    };
  }

  /**
   * Read all actual contacts from the same successful whole-film compilation.
   * @evidence contracts/common.md#implementation-and-ownership Returns detached receipts rather than mutable native meshes or planned events. Partial compilation refuses so downstream media cannot turn incomplete contact evidence into a complete film.
   * @evidence contracts/common.md#authoring-interface Receipts use absolute film seconds and exact original action IDs. Their finite query limits remain attached; missing contacts remain absent.
   */
  public contacts(): FilmExchange.Contact[] {
    if (!this.ready) throw new Error("Complete film contacts are unavailable");
    return structuredClone(this.contactReceipts);
  }

  /**
   * Read actual first hip/shoulder floor observations for conditional fall sounds.
   * @evidence contracts/common.md#implementation-and-ownership Copies only first admitted region receipts from the same finite 60Hz actual-host collapse inspection. A nominal fall cue cannot create a missing observed region.
   * @evidence contracts/common.md#authoring-interface Calling before complete preparation refuses. Absolute seconds retain the finite-grid limitation; these observations do not measure impact force or audible material correctness.
   */
  public floorContacts(): AudioMix.FloorContact[] {
    if (!this.ready) throw new Error("Complete floor contacts are unavailable");
    return this.ending!.floorContacts();
  }

  /**
   * Read the exact actual event manifest consumed by browser and exported audio.
   * @evidence contracts/common.md#implementation-and-ownership Resolves original module delivery clocks and actual admitted route touchdowns, then merges unchanged count, speech and conditional contact intentions. Truncated outgoing clips contribute no future route cues. It does not retarget motion or create a contact receipt.
   * @evidence contracts/common.md#authoring-interface Requires complete preparation. All times are absolute film seconds; audio consumes this exact detached collection with contacts and floorContacts from the same source run.
   */
  public audioEvents(): FilmPlan.Event[] {
    if (!this.ready)
      throw new Error("The actual film audio event manifest is unavailable");
    return structuredClone(this.audioSchedule);
  }

  /**
   * Read the actual displayed actors, source, costs and unresolved acceptance together.
   * @evidence contracts/common.md#implementation-and-ownership Uses retained native actor diagnostics and the current source identity without solving another pose. Measured computation and preparation costs stay distinct from drawing, capture and encoding owned by their consumers.
   * @evidence contracts/common.md#authoring-interface Returned data is a diagnostic snapshot. No field declares visual, audio, CCD, force or complete decoded-film approval.
   */
  public inspect(): object {
    return {
      ready: this.ready,
      seconds: this.seconds,
      active: this.active,
      timeline: this.clips.map((clip: FilmClip): object => ({
        id: clip.id,
        start: clip.start,
        end: clip.end,
      })),
      compiledPlacements:
        this.exchanges.length + this.counters.length + (this.finish ? 2 : 0),
      plannedPlacements: FilmPlan.exchanges.length,
      counters: this.counters.length,
      audioEvents: this.audioSchedule.length,
      contactCount: this.contactReceipts.length,
      ending: this.ending?.inspect(),
      finishing: this.finish?.inspect(),
      costs: { ...this.costs },
      actors: Object.values(this.actors).map((actor: LabActor): object =>
        actor.inspect(),
      ),
      failure: structuredClone(this.failure),
      limits: [
        "Finite full-surface action/contact and collapse inspection, not full articulated CCD",
        "Kinematic support and compliance, not force/COM proof",
        "Continuous Viewer and listening review required",
        "Final 5400-frame decoding and continuity acceptance required",
      ],
    };
  }

  /**
   * Retire only this production's retained placements and its three original actors.
   * @evidence contracts/common.md#implementation-and-ownership Marks disposal before retiring consumers, attempts every owned actor and aggregates failures. Borrowed cases cannot dispose the same actors; no server or unrelated browser/process is owned here.
   * @evidence contracts/common.md#authoring-interface Terminal and idempotent. A pending preparation checks disposal before publishing readiness; it cannot be restarted after disposal.
   */
  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.ready = false;
    const errors: unknown[] = [];
    for (const resource of [
      ...(this.finish ? [this.finish] : []),
      ...this.exchanges,
      ...this.counters,
      ...Object.values(this.actors),
    ])
      try {
        resource.dispose();
      } catch (error: unknown) {
        errors.push(error);
      }
    this.clips.length = 0;
    this.exchanges.length = 0;
    this.counters.length = 0;
    this.contactReceipts = [];
    this.audioSchedule = [];
    this.touch = undefined;
    this.ending = undefined;
    this.finish = undefined;
    if (errors.length) throw new AggregateError(errors, "Film disposal failed");
  }
}
