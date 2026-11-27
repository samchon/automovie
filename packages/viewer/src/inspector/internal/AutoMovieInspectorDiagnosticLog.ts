import type { IAutoMovieInspectionDiagnostics as Diagnostics } from "@automovie/interface";

import type { IAutoMovieViewerInspectorScene } from "../IAutoMovieViewerInspectorScene";

/*
 * Report confirmed problems when first seen and summarize observed multi-sample
 * spans.
 *
 * Two links can extend a span. Checks at actual neighboring frame indices make
 * a `frames` span, as a stepped or exact review visits them. Painted samples of
 * one uninterrupted playback, forward in time with no seek or restart between
 * them, make a `playback` span: its first, worst and last are the painted
 * samples, and the film between them was not checked frame by frame. Sparse,
 * reversed and skipped samples may show individual findings, and a bounded
 * recent history prevents replay from reporting the same evidence again.
 */
export class AutoMovieInspectorDiagnosticLog {
  private active: Map<string, IOpen> = new Map();
  private readonly recent: ISeen[] = [];
  private previous: IPrevious | undefined;

  /*
   * The presentation owner supplies how to publish a new incident and a closed
   * observed span.
   */
  public constructor(
    private readonly report: Pick<
      IAutoMovieViewerInspectorScene.IReport,
      "diagnosticIncident"
    >,
  ) {}

  /*
   * Read the confirmed findings of one successfully painted pose, with the
   * playhead state it was painted at.
   */
  public observe(
    packet: Diagnostics,
    playhead: { playing: boolean; jump: number },
  ): void {
    if (this.report.diagnosticIncident === undefined) return;
    const { scope, time } = packet;
    const previous: IPrevious | undefined = this.previous;
    if (
      previous?.scope === scope &&
      previous.time.filmSeconds === time.filmSeconds
    )
      return;
    const link: IAutoMovieViewerInspectorScene.EpisodeBasis | undefined = linkOf(
      previous,
      scope,
      time,
      playhead,
    );
    const checked: Set<string> = new Set();
    for (const row of packet.coverage)
      if (row.status === "checked") checked.add(checkKey(row));

    const next: Map<string, IOpen> = new Map();
    for (const finding of packet.findings) {
      if (finding.category !== "error" || finding.confidence !== "confirmed")
        continue;
      const key: string = JSON.stringify([
        scope,
        finding.check,
        finding.key,
        finding.code,
        finding.paths,
      ]);
      const old: IOpen | undefined = this.active.get(key);
      const fresh: boolean = this.remember(key, time);
      const observation: Diagnostics.IObservation = {
        time: finding.witness.time ?? time,
        finding,
      };
      const covered: boolean = checked.has(checkKey(finding));
      if (
        old !== undefined &&
        link !== undefined &&
        old.basis === link &&
        old.checked &&
        covered
      ) {
        if (
          (finding.witness.rank ?? -Infinity) >
          (old.worst.finding.witness.rank ?? -Infinity)
        )
          old.worst = observation;
        old.last = time;
        old.fresh ||= fresh;
        ++old.samples;
        next.set(key, old);
      } else {
        if (old !== undefined) this.complete(old);
        if (
          fresh &&
          (old === undefined || (!playhead.playing && link === undefined))
        )
          this.report.diagnosticIncident({ kind: "first", observation });
        next.set(key, {
          scope,
          basis: playhead.playing ? "playback" : "frames",
          first: observation,
          firstSample: time,
          worst: observation,
          last: time,
          samples: 1,
          checked: covered,
          fresh,
        });
      }
    }
    for (const [key, episode] of this.active)
      if (!next.has(key)) this.complete(episode);
    this.active = next;
    this.previous = { scope, time, ...playhead };
  }

  /*
   * Report outstanding measured spans when the mount ends and release all
   * retained state.
   */
  public dispose(): void {
    for (const episode of this.active.values()) this.complete(episode);
    this.active.clear();
    this.recent.length = 0;
    this.previous = undefined;
  }

  /*
   * Report a closed span only if it joins more than one sample and includes a
   * new observation.
   */
  private complete(episode: IOpen): void {
    if (episode.samples <= 1 || !episode.fresh) return;
    const { scope, first, worst, last, samples, basis } = episode;
    this.report.diagnosticIncident?.({
      kind: "episode",
      basis,
      episode: { scope, first, worst, last, samples },
      firstSample: episode.firstSample,
    });
  }

  /*
   * Remember one actual sample, returning whether this is a new visit in the
   * recent history.
   */
  private remember(key: string, time: Diagnostics.ITime): boolean {
    const frame: number | undefined = time.outputFrame;
    let extension: Extract<ISeen, { kind: "frames" }> | undefined;
    for (let index: number = this.recent.length - 1; index >= 0; --index) {
      const known: ISeen = this.recent[index]!;
      if (known.key !== key) continue;
      if (known.kind === "second") {
        if (frame === undefined && known.seconds === time.filmSeconds)
          return false;
      } else if (frame !== undefined) {
        if (frame >= known.first && frame <= known.last) return false;
        if (frame === known.last + 1) extension ??= known;
      }
    }
    if (extension !== undefined && frame !== undefined) {
      extension.last = frame;
      return true;
    }
    this.recent.push(
      frame === undefined
        ? { key, kind: "second", seconds: time.filmSeconds }
        : { key, kind: "frames", first: frame, last: frame },
    );
    if (this.recent.length > HISTORY_LIMIT) this.recent.shift();
    return true;
  }
}

/*
 * Maximum recent ranges retained for replay deduplication per mounted subject.
 */
const HISTORY_LIMIT: number = 128;

/*
 * How the current sample continues the previous one: by uninterrupted playback,
 * by the next output frame, or not at all.
 */
function linkOf(
  previous: IPrevious | undefined,
  scope: string,
  time: Diagnostics.ITime,
  playhead: { playing: boolean; jump: number },
): IAutoMovieViewerInspectorScene.EpisodeBasis | undefined {
  if (
    previous === undefined ||
    previous.scope !== scope ||
    time.filmSeconds <= previous.time.filmSeconds
  )
    return undefined;
  if (playhead.playing)
    return previous.playing && previous.jump === playhead.jump
      ? "playback"
      : undefined;
  const frame: number | undefined = previous.time.outputFrame;
  return frame !== undefined && time.outputFrame === frame + 1
    ? "frames"
    : undefined;
}

/*
 * A matching checked obligation permits a finding to extend its span.
 */
function checkKey(value: Pick<Diagnostics.IFinding, "check" | "key">): string {
  return JSON.stringify([value.check, value.key]);
}

/*
 * A run of observations while its last and worst witness can still advance.
 */
interface IOpen {
  scope: string;
  basis: IAutoMovieViewerInspectorScene.EpisodeBasis;
  first: Diagnostics.IObservation;
  firstSample: Diagnostics.ITime;
  worst: Diagnostics.IObservation;
  last: Diagnostics.ITime;
  samples: number;
  checked: boolean;
  fresh: boolean;
}

/*
 * The previous painted sample and how the playhead reached it.
 */
interface IPrevious {
  scope: string;
  time: Diagnostics.ITime;
  playing: boolean;
  jump: number;
}

/*
 * Previously seen sample coordinates used only to deduplicate reporting.
 */
type ISeen =
  | { key: string; kind: "frames"; first: number; last: number }
  | { key: string; kind: "second"; seconds: number };
