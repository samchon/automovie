import type { FilmPlan } from "../film/FilmPlan";
import { AudioMix } from "./AudioMix";
import { AudioPcm } from "./AudioPcm";
import { MovieAudioAssets } from "./MovieAudioAssets";

/**
 * Play the shared complete soundtrack from the host's single film clock.
 *
 * @evidence contracts/common.md#implementation-and-ownership Preparation hashes fixed assets and renders the shared PCM kernel once. One native source plays the exact PCM16 samples exported to WAV; every transport transition replaces that source. Generation tokens reject stale async resumes and disposal aborts fetches and closes only this owner's context.
 * @evidence contracts/common.md#authoring-interface Configure only after the complete runtime has admitted its actual contacts, then prepare once. Await play from a user gesture before anchoring the host clock; call pause for seek, interval end and speed changes. This owner advances no separate film timer.
 */
export class MovieAudio {
  /** This soundtrack owns its native context and no other audio service. */
  private context: AudioContext | null = null;
  /** Terminal fetch cancellation shared by this owner's asset preparations. */
  private readonly aborter: AbortController = new AbortController();
  /** One preparation promise prevents duplicate complete soundtrack computation. */
  private preparation: Promise<void> | null = null;
  /** Compiled exact PCM16 samples kept in one native stereo buffer. */
  private buffer: AudioBuffer | null = null;
  /** Only one native replacement source can belong to the current generation. */
  private active: AudioBufferSourceNode | null = null;
  /** Detached complete current cue list; configure cannot interrupt preparation. */
  private cues: AudioMix.Cue[] | null = null;
  /** Prepared immutable-byte and cue identities for real export comparison. */
  private identity: MovieAudio.Manifest | null = null;
  /** Incremented on each cancellation to reject stale asynchronous playback. */
  private generation: number = 0;
  /** Explicit resource/transport state, separate from autoplay permission. */
  private state: string = "idle";
  /** Actual last failure for the visible Viewer. */
  private error: string | null = null;

  /**
   * Adopt one complete detached event/receipt compilation before preparation.
   *
   * @evidence contracts/common.md#implementation-and-ownership AudioMix validates all matching contact and floor receipts atomically before this owner replaces its cues. Reconfiguration after preparation starts refuses, so prepared bytes cannot accidentally retain an earlier film plan.
   * @evidence contracts/common.md#authoring-interface Events and receipts use absolute film seconds. The caller must compile the complete scene successfully; partial runtime results cannot stand in for a complete admitted film.
   */
  public configure(
    events: readonly FilmPlan.Event[],
    contacts: readonly AudioMix.Contact[],
    floorContacts: readonly AudioMix.FloorContact[] = [],
  ): void {
    this.assertOpen();
    if (this.preparation !== null || this.buffer !== null)
      throw new Error("Configure movie audio before preparation");
    this.cues = AudioMix.build(events, contacts, floorContacts);
    this.state = "configured";
  }

  /**
   * Load adopted bytes and prepare the same exact PCM16 mix used by export.
   *
   * @evidence contracts/common.md#implementation-and-ownership All required fetch/decode outcomes settle before failures are reported together. Successful preparation retains only one native stereo buffer and copied identity metadata; decoded originals and transient WAV bytes become collectable.
   * @evidence contracts/common.md#authoring-interface This does not grant autoplay permission. Missing source bytes, wrong hashes, unsupported PCM, invalid excerpts or clipping reject and preserve an explicit error state. Concurrent callers share the same preparation.
   */
  public prepare(): Promise<void> {
    this.assertOpen();
    if (this.buffer !== null) return Promise.resolve();
    if (this.preparation !== null) return this.preparation;
    if (this.cues === null)
      return Promise.reject(
        new Error("Configure complete movie audio before preparation"),
      );
    this.state = "loading";
    this.preparation = this.load()
      .catch((error: unknown): never => {
        if (this.state !== "disposed") {
          this.state = "error";
          this.error = error instanceof Error ? error.message : String(error);
        }
        throw error;
      })
      .finally((): void => {
        this.preparation = null;
      });
    return this.preparation;
  }

  /**
   * Resume one exact remaining soundtrack interval from the supplied film time.
   *
   * @evidence contracts/common.md#implementation-and-ownership Resume starts before the first await to preserve user-gesture admission. Pause, dispose or a newer play invalidates the generation; a stale completion never starts native playback. Source playbackRate applies the host review speed without altering cue identities.
   * @evidence contracts/common.md#authoring-interface Seconds are in [0,180] and speed in (0,4]. A call at 180 schedules no samples. Await this call before setting the host's wall-time anchor, and inspect diagnostics.state because a cancelled call deliberately resolves without playing.
   */
  public async play(seconds: number, speed: number): Promise<void> {
    this.assertOpen();
    if (
      !Number.isFinite(seconds) ||
      seconds < 0 ||
      seconds > 180 ||
      !Number.isFinite(speed) ||
      speed <= 0 ||
      speed > 4
    )
      throw new Error(
        "Movie audio requires seconds in [0,180] and speed in (0,4]",
      );
    this.pause();
    const generation: number = this.generation;
    const context: AudioContext = this.getContext();
    const resume: Promise<void> = context.resume();
    try {
      await Promise.all([resume, this.prepare()]);
      if (generation !== this.generation || this.state === "disposed") return;
      if (context.state !== "running" || this.buffer === null)
        throw new Error(`Movie sound is not enabled: ${context.state}`);
      if (seconds < 180) {
        const source: AudioBufferSourceNode = context.createBufferSource();
        source.buffer = this.buffer;
        source.playbackRate.value = speed;
        source.connect(context.destination);
        source.onended = (): void => {
          source.disconnect();
          if (this.active === source) this.active = null;
        };
        source.start(context.currentTime, seconds, 180 - seconds);
        this.active = source;
      }
      this.state = seconds === 180 ? "paused" : "playing";
      this.error = null;
    } catch (error: unknown) {
      if (generation !== this.generation || this.state === "disposed") return;
      this.pause();
      this.state = "error";
      this.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  /**
   * Cancel native playback and pending play without discarding prepared samples.
   *
   * @evidence contracts/common.md#implementation-and-ownership Stops and disconnects the sole owned source, clears its handler and increments the generation. No timer, decoder or source remains able to restart cancelled playback.
   * @evidence contracts/common.md#authoring-interface Call for every host seek, pause, interval boundary and freeze. This method owns no film position; the host supplies its authoritative current second on the next play.
   */
  public pause(): void {
    if (this.state === "disposed") return;
    this.generation++;
    if (this.active !== null) {
      this.active.onended = null;
      this.active.stop();
      this.active.disconnect();
      this.active = null;
    }
    if (this.state !== "loading" && this.state !== "error")
      this.state = this.buffer === null ? "idle" : "paused";
  }

  /**
   * Return detached exact cue, source and complete WAV identities after preparation.
   *
   * @evidence contracts/common.md#implementation-and-ownership Copies the prepared manifest without native nodes or sample arrays. Export compares cueDigest and sha256 against its independently read fixed assets and shared mixer result.
   * @evidence contracts/common.md#authoring-interface Calling before successful preparation refuses. These identities establish deterministic data equivalence, not listening, synchronization perception or physical contact truth.
   */
  public manifest(): MovieAudio.Manifest {
    if (this.identity === null)
      throw new Error("Movie audio manifest is not prepared");
    return structuredClone(this.identity);
  }

  /**
   * Read actual native state and explicitly outstanding listening acceptance.
   *
   * @evidence contracts/common.md#implementation-and-ownership Reports context permission, active source and exact prepared identities separately. A running context or correct digest never changes listening status into approval.
   * @evidence contracts/common.md#authoring-interface State and error describe this owner's last operation. The context may resample at the browser device boundary; the retained 48 kHz PCM16 remains the same input used by export.
   */
  public diagnostics(): {
    state: string;
    contextState: string;
    error: string | null;
    active: boolean;
    listeningStatus: string;
    manifest: MovieAudio.Manifest | null;
  } {
    return {
      state: this.state,
      contextState: this.context?.state ?? "absent",
      error: this.error,
      active: this.active !== null,
      listeningStatus: "not-reviewed",
      manifest: this.identity === null ? null : structuredClone(this.identity),
    };
  }

  /**
   * Abort preparation, release samples and close this soundtrack's native context.
   *
   * @evidence contracts/common.md#implementation-and-ownership Idempotent disposal stops playback, invalidates async work, aborts fetches and releases cues, samples and manifest. A late preparation checks the signal before publishing its buffer.
   * @evidence contracts/common.md#authoring-interface Disposal is terminal. The context close is asynchronous; its actual failure remains in diagnostics.error while no owned sound source remains active.
   */
  public dispose(): void {
    if (this.state === "disposed") return;
    this.pause();
    this.state = "disposed";
    this.aborter.abort();
    this.buffer = null;
    this.cues = null;
    this.identity = null;
    if (this.context !== null)
      void this.context.close().catch((error: unknown): void => {
        this.error = String(error);
      });
  }

  /** Refuse terminal reuse before touching native resources. */
  private assertOpen(): void {
    if (this.state === "disposed") throw new Error("MovieAudio is disposed");
  }

  /** Allocate only this owner's 48 kHz context; no service or background timer. */
  private getContext(): AudioContext {
    return (this.context ??= new AudioContext({ sampleRate: 48000 }));
  }

  /** Collect every required source before producing one atomic complete mix. */
  private async load(): Promise<void> {
    if (this.cues === null) throw new Error("No movie cue list");
    const cues: AudioMix.Cue[] = structuredClone(this.cues);
    const assets: MovieAudioAssets.Asset[] = MovieAudioAssets.select(cues);
    const results: PromiseSettledResult<Float32Array>[] =
      await Promise.allSettled(
        assets.map(
          async (asset: MovieAudioAssets.Asset): Promise<Float32Array> => {
            const response: Response = await fetch(asset.url, {
              signal: this.aborter.signal,
            });
            if (!response.ok)
              throw new Error(`${asset.id}: HTTP ${response.status}`);
            return MovieAudioAssets.decode(
              asset,
              new Uint8Array(await response.arrayBuffer()),
            );
          },
        ),
      );
    const errors: string[] = [];
    const sources: Map<AudioMix.Source, Float32Array> = new Map<
      AudioMix.Source,
      Float32Array
    >();
    results.forEach(
      (result: PromiseSettledResult<Float32Array>, index: number): void => {
        if (result.status === "rejected")
          errors.push(`${assets[index].id}: ${String(result.reason)}`);
        else sources.set(assets[index].id, result.value);
      },
    );
    if (errors.length > 0) throw new Error(errors.join("; "));
    const mixed: ReturnType<typeof AudioMix.render> = AudioMix.render(
      cues,
      sources,
    );
    const bytes: Uint8Array = AudioPcm.encode(mixed.left, mixed.right);
    const sha256: string = await MovieAudioAssets.digest(bytes);
    const cueDigest: string = await MovieAudioAssets.digest(
      new TextEncoder().encode(JSON.stringify(cues)),
    );
    if (this.aborter.signal.aborted)
      throw new Error("Movie audio preparation cancelled");
    const buffer: AudioBuffer = this.getContext().createBuffer(
      2,
      mixed.left.length,
      48000,
    );
    const pcm: DataView = new DataView(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength,
    );
    for (let channel: number = 0; channel < 2; channel++) {
      const samples: Float32Array = buffer.getChannelData(channel);
      for (let frame: number = 0; frame < samples.length; frame++)
        samples[frame] =
          pcm.getInt16(44 + frame * 4 + channel * 2, true) / 32768;
    }
    this.buffer = buffer;
    this.identity = {
      durationSeconds: 180,
      sampleRate: 48000,
      channels: 2,
      sha256,
      cueDigest,
      peak: mixed.peak,
      cues,
      assets: assets.map(
        (
          asset: MovieAudioAssets.Asset,
        ): { id: AudioMix.Source; sha256: string } => ({
          id: asset.id,
          sha256: asset.sha256,
        }),
      ),
    };
    this.state = "ready";
  }
}

/**
 * Detached shared soundtrack identity, usable by the actual export consumer.
 */
export namespace MovieAudio {
  /**
   * Exact complete WAV bytes and their source and cue lineage.
   *
   * @evidence contracts/common.md#implementation-and-ownership Both consumers compute these fields through AudioMix and AudioPcm. Source arrays contain only digests and ids, so exporting the record retains no browser buffers.
   * @evidence contracts/common.md#authoring-interface sha256 hashes the complete PCM16 WAV; cueDigest hashes UTF-8 JSON of the ordered cue list. Peak is pre-quantization normalized amplitude and must not exceed one.
   */
  export interface Manifest {
    /** Exact film seconds. */ durationSeconds: 180;
    /** Adopted samples per second. */ sampleRate: 48000;
    /** Stereo channels. */ channels: 2;
    /** Complete PCM16 WAV content identity. */ sha256: string;
    /** Canonical ordered cue JSON identity. */ cueDigest: string;
    /** Measured pre-quantization peak. */ peak: number;
    /** Exact resolved audible requests. */ cues: AudioMix.Cue[];
    /** Fixed derivative identities. */ assets: {
      id: AudioMix.Source;
      sha256: string;
    }[];
  }
}
