import type { AutoMoviePhysicsCache as Cache } from "@automovie/engine";
import type { IAutoMovieContactReceipt as Receipt } from "@automovie/interface";
import { createAutoMoviePerformanceOverlay } from "@automovie/viewer";

import { FilmActor } from "../assets/person/FilmActor";
import { createPersonParameters } from "../assets/person/createPersonParameters";
import { FighterBody } from "../motion/fighter/FighterBody";
import type { BoutFormulaResponse } from "../motion/reactions/BoutFormulaResponse";
import { FilmEvents } from "../runtime/FilmEvents";
import type { FilmPlan } from "../shots/kickboxing/ring-bout/FilmPlan";
import type { AudioMix } from "../sound/AudioMix";
import { BoutEffects } from "./BoutEffects";
import type { BoutFrameReader } from "./BoutFrameReader";
import { BoutReceipts } from "./BoutReceipts";
import { BoutSurface } from "./BoutSurface";
import { BoutTargetSource } from "./BoutTargetSource";
import { absoluteBoutContacts } from "./absoluteBoutContacts";
import { boutGeometricImpulses } from "./boutGeometricImpulses";
import { boutPlaybackFootsteps } from "./boutPlaybackFootsteps";
import { measureBoutGeometricFloor } from "./measureBoutGeometricFloor";

/** The polygon film consumes one precomputed physical state for seek, play, effects, audio and review. */
export class BoutPlaybackRuntime {
  /** Authored intent is retained for fingers, expressions and officiating cues. */
  public readonly source: BoutTargetSource;
  /** Same fixed-body rig descriptions as the target producer. */
  public readonly rigs: BoutTargetSource["rigs"];
  /** Original polygon performers and costumes. */
  public readonly actors: Record<FilmPlan.ActorId, FilmActor>;
  /** Shared effect renderer under the film's recipe. */
  public readonly effects: BoutEffects = new BoutEffects();
  /** Shared skeleton/contact inspection overlay. */
  public readonly overlay: ReturnType<typeof createAutoMoviePerformanceOverlay>;
  /** Completed outcome inspection. */
  public ready: boolean = false;
  /** Last exact film second. */
  public seconds: number = 0;
  /** Last CPU draw preparation, milliseconds. */
  public lastMotionMs: number = 0;
  /** Shared provider surface instances, retired before their actors. */
  private readonly surfaces: Map<FilmPlan.ActorId, BoutSurface> = new Map();
  /** Every measured outcome, including failed promises. */
  private report?: BoutReceipts.IResult;
  /** Actual floor arrivals are compiled once from the immutable playback. */
  private arrivals: FilmPlan.Event[] = [];
  /** Consumer preparation costs, milliseconds, used before extending a short qualification run. */
  private preparation: { floor: number; footfalls: number } = {
    floor: 0,
    footfalls: 0,
  };
  /** One clock conversion for every presentation consumer. */
  private readonly receipts: Receipt[];
  public constructor(
    public readonly playback: BoutFrameReader,
    public readonly startSeconds: number = 0,
    source?: BoutTargetSource,
    public readonly mode: "simulated" | "kinematic" = "simulated",
    formulaResponses?: readonly BoutFormulaResponse.IContact[],
  ) {
    this.source = source ?? new BoutTargetSource();
    this.source.configureResponses(
      mode === "kinematic" ? "kinematic" : "native",
      mode === "kinematic"
        ? (formulaResponses ?? this.source.formulaResponses)
        : [],
    );
    this.receipts = absoluteBoutContacts(playback.contacts, startSeconds);
    this.rigs = this.source.rigs;
    this.actors = {
      a: new FilmActor("a", this.rigs.a, createPersonParameters(1800, true)),
      b: new FilmActor("b", this.rigs.b, createPersonParameters(1800, true)),
      referee: new FilmActor(
        "referee",
        this.rigs.referee,
        createPersonParameters(1780, false),
      ),
    };
    this.overlay = createAutoMoviePerformanceOverlay({
      bodies: (["a", "b", "referee"] as const).map(
        (
          id: FilmPlan.ActorId,
        ): {
          id: string;
          profile: BoutTargetSource["rigs"][FilmPlan.ActorId]["profile"];
        } => ({ id, profile: this.rigs[id].profile }),
      ),
      maximumContacts: 1024,
      metresPerNewton: 0.0002,
    });
  }
  /** Exact displayed states, with an explicit absolute clock for bounded review archives. */
  public at(seconds: number): Cache.IFrame {
    const frame: Cache.IFrame = this.playback.at(seconds - this.startSeconds);
    return { ...frame, seconds };
  }
  /** Inspect all promises together; a delivered production refuses every unfulfilled screenplay outcome. */
  public async prepare(
    progress?: (id: string, completed: number, total: number) => void,
    review: boolean = false,
  ): Promise<void> {
    const profiles: Record<
      FilmPlan.ActorId,
      BoutTargetSource["rigs"][FilmPlan.ActorId]["profile"]
    > = {
      a: this.rigs.a.profile,
      b: this.rigs.b.profile,
      referee: this.rigs.referee.profile,
    };
    const floorStarted: number = performance.now();
    this.receipts.push(
      ...(await measureBoutGeometricFloor({
        profiles,
        at: (seconds: number): Cache.IFrame => this.at(seconds),
        start: this.startSeconds,
        end: this.startSeconds + this.playback.duration,
        rate: this.playback.rate,
      })),
    );
    this.preparation.floor = performance.now() - floorStarted;
    const contacts: Receipt[] = this.physicalContacts();
    const geometricImpulses: Record<string, number> = boutGeometricImpulses(
      contacts,
      profiles,
      (seconds: number): Cache.IFrame => this.at(seconds),
    );
    this.report = await BoutReceipts.measure({
      profiles,
      contacts,
      at: (seconds: number): Cache.IFrame => this.at(seconds),
      start: this.startSeconds,
      end: this.startSeconds + this.playback.duration,
      source: this.mode === "kinematic" ? "geometric" : "solver",
      geometricImpulses,
    });
    if (!review && this.report.findings.length)
      throw new Error(
        `Scripted physical outcomes failed: ${JSON.stringify(this.report.findings)}`,
      );
    const footstepsStarted: number = performance.now();
    this.arrivals = boutPlaybackFootsteps({
      profiles,
      contacts: this.receipts,
      recovery: this.playback.recovery,
      at: (seconds: number): Cache.IFrame => this.at(seconds),
      startSeconds: this.startSeconds,
      duration: this.playback.duration,
      rate: this.playback.rate,
      mode: this.mode,
      ownership: (
        actor: FilmPlan.ActorId,
        bone: string,
        localSeconds: number,
      ): "authored" | "return" | "dynamic" =>
        this.playback.ownershipAt(actor, bone, localSeconds),
      ownershipEvents: this.playback.ownership,
    });
    this.preparation.footfalls = performance.now() - footstepsStarted;
    this.effects.configure(this.report.impacts, geometricImpulses);
    const selected: Receipt[] = [
      ...new Map(
        this.report.impacts.map(
          (
            impact: BoutReceipts.IResult["impacts"][number],
          ): [string, Receipt] => [impact.receipt.id, impact.receipt],
        ),
      ).values(),
    ];
    for (const id of ["a", "b", "referee"] as const)
      this.surfaces.set(
        id,
        new BoutSurface(
          this.actors[id],
          selected,
          (seconds: number, bone: string): Cache.ISegment =>
            this.at(seconds).bodies[id]![bone]!,
          contacts.filter(
            (receipt: Receipt): boolean =>
              receipt.source === "solver" &&
              (receipt.a.body === "floor" || receipt.b.body === "floor"),
          ),
          geometricImpulses,
        ),
      );
    this.ready = true;
    this.evaluate(this.startSeconds);
    progress?.("complete", 1, 1);
  }
  /** Draw actual solver frames; this does not solve IK, lift feet or move a fallen root. */
  public evaluate(seconds: number): void {
    const begun: number = performance.now();
    const frame: Cache.IFrame = this.at(seconds);
    const intent: ReturnType<BoutTargetSource["frames"]> =
      this.source.frames(seconds);
    for (const id of ["a", "b", "referee"] as const) {
      this.actors[id].physical(
        frame.bodies[id]!,
        FighterBody.pose(intent[id]),
        intent[id].wince,
      );
      this.surfaces.get(id)?.update(seconds, frame.bodies[id]!);
    }
    this.effects.update(seconds);
    this.overlay.update(frame, this.physicalContacts());
    this.seconds = seconds;
    this.lastMotionMs = performance.now() - begun;
  }
  /** Shared overlay controls never alter the delivered state or camera. */
  public showReview(skeleton: boolean, contacts: boolean): void {
    this.overlay.show(skeleton, contacts);
  }
  /** Actual accepted audio contact rows. */
  public contacts(): AudioMix.Contact[] {
    return structuredClone(this.report?.contacts ?? []);
  }
  /** Actual hip/shoulder contact times. */
  public floorContacts(): AudioMix.FloorContact[] {
    return structuredClone(this.report?.mats ?? []);
  }
  /** Retain screenplay speech/count/attempt timing and move only receipt-backed impact onsets. */
  public audioEvents(): FilmPlan.Event[] {
    const events: FilmPlan.Event[] = FilmEvents.build({
      steps: {
        a: this.source.fighters.a.steps,
        b: this.source.fighters.b.steps,
        referee: this.source.referee.steps,
      },
    });
    for (const event of events) {
      const receipt: AudioMix.Contact | AudioMix.FloorContact | undefined =
        event.kind === "fall"
          ? this.report?.mats.find(
              (row: AudioMix.FloorContact): boolean => row.eventId === event.id,
            )
          : this.report?.contacts.find(
              (row: AudioMix.Contact): boolean => row.eventId === event.id,
            );
      if (receipt) event.seconds = receipt.seconds;
    }
    return [
      ...events.filter(
        (event: FilmPlan.Event): boolean =>
          event.kind !== "step" &&
          (event.kind !== "fall" ||
            this.report?.mats.some(
              (row: AudioMix.FloorContact): boolean => row.eventId === event.id,
            ) === true),
      ),
      ...structuredClone(this.arrivals),
    ].sort(
      (a: FilmPlan.Event, b: FilmPlan.Event): number =>
        a.seconds - b.seconds || a.id.localeCompare(b.id),
    );
  }
  /** Observable outcome failures remain available during explicit inspection runs. */
  public inspect(): object {
    return {
      seconds: this.seconds,
      lastMotionMs: this.lastMotionMs,
      identity: this.playback.identity,
      mode: this.mode,
      bodyResponse: {
        authority:
          this.mode === "kinematic" ? "cached geometric formula" : "native",
        formulaContacts: this.source.formulaResponses.length,
      },
      contacts: this.report?.contacts.length ?? 0,
      refusedContacts: this.report?.findings ?? [],
      mats: this.report?.mats ?? [],
      footfalls: structuredClone(this.arrivals),
      preparationMs: { ...this.preparation },
      ownership: this.owners(),
    };
  }
  /** Dispose in reverse ownership order. */
  public dispose(): void {
    for (const surface of this.surfaces.values()) surface.dispose();
    this.surfaces.clear();
    this.overlay.dispose();
    this.effects.dispose();
    for (const actor of Object.values(this.actors)) actor.dispose();
  }
  /** Bounded review archives store a local clock; only this explicit adapter adds their declared offset. */
  private physicalContacts(): Receipt[] {
    return this.receipts;
  }
  /** Expose the same native authority sampled by sound and capture at the actual displayed second. */
  private owners(): Record<string, Record<string, Cache.IOwnership["kind"]>> {
    if (!this.ready) return {};
    return Object.fromEntries(
      Object.entries(this.rigs).map(
        ([body, rig]: [string, BoutTargetSource["rigs"][FilmPlan.ActorId]]): [
          string,
          Record<string, Cache.IOwnership["kind"]>,
        ] => [
          body,
          Object.fromEntries(
            rig.profile.segments.map(
              (
                segment: BoutTargetSource["rigs"][FilmPlan.ActorId]["profile"]["segments"][number],
              ): [string, Cache.IOwnership["kind"]] => [
                segment.bone,
                this.playback.ownershipAt(
                  body,
                  segment.bone,
                  this.seconds - this.startSeconds,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
