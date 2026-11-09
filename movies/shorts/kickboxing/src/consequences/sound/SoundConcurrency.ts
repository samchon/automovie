/**
 * Voice limits for the film's one-shot cues, as game engines bound sound
 * concurrency: a source (one fighter's feet, breath or the air past his
 * head) sounds one instance at a time, a sound sounds at most its limit of
 * instances, and at most {@link SoundConcurrency.MAX_FOREGROUND} cues sound
 * at once. A cue that would break a limit is dropped; rank 0 (words and the
 * bell) is never dropped, and earlier cues win over later ones.
 *
 * ```ts
 * SoundConcurrency.cap([{ asset: "step", seconds: 0, durationSeconds: 0.1, rank: 4, source: "step/a", ... }]);
 * SoundConcurrency.overlap(cues); // 4
 * ```
 *
 * @evidence docs/research/sound/ring-mix.md#practice Unreal sound concurrency: per-group voice limits.
 * @evidence docs/research/sound/ring-mix.md#law The limits per source, per sound and in all.
 */
export namespace SoundConcurrency {
  /** A cue before the cap. */
  export interface ICandidate {
    /** Asset id. */
    asset: string;

    /** Onset, film seconds. */
    seconds: number;

    /** Output duration, seconds. */
    durationSeconds: number;

    /** Importance: 0 is never dropped, larger is dropped first. */
    rank: number;

    /** The source of which one instance sounds at a time. */
    source?: string;
  }

  /** Most foreground cues sounding at once beyond the bed: one ring's voice limit. */
  export const MAX_FOREGROUND: number = 4;

  /**
   * Most instances of one sound at once: two impacts so a block and a
   * counter both read, one canvas landing so each landing is distinct, two
   * rushes of air and two footfalls and breaths, one per fighter.
   */
  export const LIMITS: Readonly<Record<string, number>> = Object.freeze({
    impact: 2,
    fall: 1,
    air: 2,
    step: 2,
    breath: 2,
  });

  /**
   * The sound an asset plays: the five impact takes are one sound.
   *
   * @param asset Asset id.
   * @returns The sound's name.
   */
  export function sound(asset: string): string {
    return asset.startsWith("punch") ? "impact" : asset;
  }

  /**
   * The candidates that may sound, in time order.
   *
   * @param candidates Cues before the cap.
   * @returns The kept candidates.
   */
  export function cap<T extends ICandidate>(candidates: readonly T[]): T[] {
    const ordered: T[] = [...candidates].sort(
      (x, y) => x.seconds - y.seconds || x.rank - y.rank,
    );
    const kept: T[] = [];
    for (const c of ordered) {
      if (c.rank > 0) {
        const now: T[] = kept.filter(
          (k) => k.seconds <= c.seconds && c.seconds < k.seconds + k.durationSeconds,
        );
        if (c.source !== undefined && now.some((k) => k.source === c.source))
          continue;
        const family: string = sound(c.asset);
        if (
          now.filter((k) => sound(k.asset) === family).length >=
          (LIMITS[family] ?? 1)
        )
          continue;
        if (now.length >= MAX_FOREGROUND) continue;
      }
      kept.push(c);
    }
    return kept;
  }

  /**
   * The most cues sounding at one instant; consecutive cues do not overlap.
   *
   * @param cues Bounded cues.
   * @returns The maximum overlap.
   */
  export function overlap(
    cues: readonly { seconds: number; durationSeconds: number }[],
  ): number {
    const edges: [number, number][] = cues.flatMap(
      (c): [number, number][] => [
        [c.seconds, 1],
        [c.seconds + c.durationSeconds, -1],
      ],
    );
    edges.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    let now: number = 0;
    let most: number = 0;
    for (const [, d] of edges) {
      now += d;
      most = Math.max(most, now);
    }
    return most;
  }
}
