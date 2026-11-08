import { AutoMovieChain } from "@automovie/engine";

/**
 * The timekeeper's bell: never seen, only heard, ringing to open the round
 * and as the match-ending bell.
 *
 * ```ts
 * new Bell().ring("bell-open");
 * ```
 *
 * @evidence docs/body/settings/props/bell.md#heard-only Heard only.
 * @evidence docs/body/settings/props/bell.md#start-end Once to open, once after the result.
 */
export class Bell {
  /** Stable subject id. */
  public readonly id: string = "bell";

  /**
   * Ring once.
   *
   * @param anchor Optional anchor id.
   * @returns The chain.
   */
  public ring(anchor?: string): AutoMovieChain {
    return AutoMovieChain.of({
      subject: this.id,
      capability: "ring",
      ...(anchor === undefined ? {} : { anchor }),
      parameters: Object.freeze({ action: Object.freeze({ kind: "ring" }) }),
    });
  }
}
