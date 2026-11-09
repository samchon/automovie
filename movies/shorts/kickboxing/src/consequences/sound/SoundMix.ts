/**
 * Measurements of the decoded film mix: how far each spoken word rises over
 * the bed under it. A word's level is the RMS of the mix over the word's
 * cue; the bed's level is the RMS of the mix in the {@link SoundMix.WINDOW}
 * before the word, leaving out samples inside any other word's cue, so the
 * count's previous number is not taken for the bed.
 *
 * ```ts
 * const mix = SoundMix.read(await fs.promises.readFile("film.wav"));
 * SoundMix.words(mix, cues); // [{ asset: "count1", seconds: 158, rise: 21.4 }, ...]
 * ```
 *
 * @evidence docs/research/sound/ring-mix.md#targets Every count word rises at least 12 dB over the bed.
 */
export namespace SoundMix {
  /** A decoded mono mix. */
  export interface IMix {
    /** Samples per second. */
    sampleRate: number;

    /** Samples in [-1, 1], the channels averaged. */
    samples: Float32Array;
  }

  /** One word's rise over the bed. */
  export interface IRise {
    /** The word's asset id. */
    asset: string;

    /** Its onset, film seconds. */
    seconds: number;

    /** Its level over the bed's, dB. */
    rise: number;
  }

  /** Seconds of bed measured before each word. */
  export const WINDOW: number = 0.5;

  /** The words this film speaks: the referee's commands and count. */
  export const WORDS: readonly string[] = Object.freeze([
    "fight",
    "down",
    "neutral",
    "decision",
    ...Array.from({ length: 10 }, (_, k) => `count${k + 1}`),
  ]);

  /**
   * A PCM16 WAV file as a mono mix, walking its chunks to `fmt ` and `data`.
   *
   * @param bytes The file.
   * @returns The mix.
   * @throws When the file is not 16-bit PCM WAV.
   */
  export function read(bytes: Uint8Array): IMix {
    const view: DataView = new DataView(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength,
    );
    const tag = (at: number): string =>
      String.fromCharCode(...bytes.subarray(at, at + 4));
    if (tag(0) !== "RIFF" || tag(8) !== "WAVE") throw new Error("Not a WAV file");
    let channels: number = 0;
    let sampleRate: number = 0;
    let bits: number = 0;
    for (let at: number = 12; at + 8 <= bytes.length; ) {
      const size: number = view.getUint32(at + 4, true);
      if (tag(at) === "fmt ") {
        channels = view.getUint16(at + 10, true);
        sampleRate = view.getUint32(at + 12, true);
        bits = view.getUint16(at + 22, true);
      } else if (tag(at) === "data") {
        if (bits !== 16 || channels < 1) throw new Error("Not 16-bit PCM");
        const frames: number = Math.floor(
          Math.min(size, bytes.length - at - 8) / (2 * channels),
        );
        const samples: Float32Array = new Float32Array(frames);
        for (let f: number = 0; f < frames; f++) {
          let sum: number = 0;
          for (let c: number = 0; c < channels; c++)
            sum += view.getInt16(at + 8 + 2 * (f * channels + c), true);
          samples[f] = sum / channels / 32768;
        }
        return { sampleRate, samples };
      }
      at += 8 + size + (size % 2);
    }
    throw new Error("No data chunk");
  }

  /**
   * Each spoken word's rise over the bed.
   *
   * @param mix The decoded mix.
   * @param cues The film's cues.
   * @returns One rise per word cue, in time order.
   */
  export function words(
    mix: IMix,
    cues: readonly { asset: string; seconds: number; durationSeconds: number }[],
  ): IRise[] {
    const spoken = cues
      .filter((c) => WORDS.includes(c.asset))
      .sort((x, y) => x.seconds - y.seconds);
    const index = (t: number): number =>
      Math.max(0, Math.min(mix.samples.length, Math.round(t * mix.sampleRate)));
    const rms = (from: number, to: number, skip: (t: number) => boolean): number => {
      let sum: number = 0;
      let n: number = 0;
      for (let i: number = index(from); i < index(to); i++) {
        if (skip(i / mix.sampleRate)) continue;
        sum += mix.samples[i]! ** 2;
        n++;
      }
      return n === 0 ? 0 : Math.sqrt(sum / n);
    };
    return spoken.map((w) => {
      const word: number = rms(w.seconds, w.seconds + w.durationSeconds, () => false);
      const bed: number = rms(w.seconds - WINDOW, w.seconds, (t) =>
        spoken.some(
          (o) => o !== w && o.seconds <= t && t < o.seconds + o.durationSeconds,
        ),
      );
      return {
        asset: w.asset,
        seconds: w.seconds,
        rise: bed === 0 ? Infinity : 20 * Math.log10(word / bed),
      };
    });
  }
}
