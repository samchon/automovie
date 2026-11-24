import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanMounted,
} from "@automovie/interface";

/**
 * The clock of a mounted performance (`HumanMounted`): when each figure's
 * transfer begins and arrives and when its hold ends, how far each hand has
 * taken its contact at a second, and the contact windows each support holds
 * over the figures that name it.
 *
 * A support named by consecutive figures is held through the transfers between
 * them. One a figure newly names is acquired when its transfer arrives; one the
 * next figure drops is released when that transfer begins. The seat bears
 * through every seated figure, and the entry's seat and planted feet are held
 * from the start into a first figure that keeps them.
 */
export class HumanMountedTimeline {
  /** Each figure's transfer start, local seconds. */
  public readonly starts: readonly number[];

  /** Each figure's arrival, the transfer's end, local seconds. */
  public readonly arrivals: readonly number[];

  /** The whole performance, seconds. */
  public readonly duration: number;

  /**
   * Lay the clock out.
   *
   * @param figures The admitted figures.
   * @param gripped The hands the entry already holds on the first figure's
   *   contacts.
   */
  public constructor(
    private readonly figures: readonly IAutoMovieMotionHumanMounted.IFigure[],
    private readonly gripped: ReadonlySet<AutoMovieHumanSide> = new Set(),
  ) {
    const starts: number[] = [];
    const arrivals: number[] = [];
    let at: number = 0;
    for (const figure of figures) {
      starts.push(at);
      at += figure.transfer;
      arrivals.push(at);
      at += figure.hold;
    }
    this.starts = starts;
    this.arrivals = arrivals;
    this.duration = at;
  }

  /**
   * The figure a second falls in and how far its transfer has gone, 0 to 1
   * eased by minimum jerk; 1 through its hold.
   *
   * @param at Local seconds.
   * @returns The figure's index and the eased share.
   */
  public at(at: number): IAutoMovieMotionHumanMounted.IPhase {
    let index: number = 0;
    for (let i: number = 1; i < this.starts.length; ++i)
      if (at >= this.starts[i]!) index = i;
    const span: number = this.arrivals[index]! - this.starts[index]!;
    return {
      index,
      share: minimumJerk.share(
        Math.max(0, Math.min(1, (at - this.starts[index]!) / span)),
      ),
    };
  }

  /**
   * How far a hand has taken the contact it holds at a second, 0 free to 1
   * holding: held through a transfer between two figures that both name it, or
   * from the entry when it already holds the first figure's contact, taken over
   * a transfer into a figure that newly names it, and let go over a transfer
   * into one that drops it.
   *
   * @param side The hand.
   * @param at Local seconds.
   * @returns The share.
   */
  public hand(side: AutoMovieHumanSide, at: number): number {
    const { index, share }: IAutoMovieMotionHumanMounted.IPhase = this.at(at);
    const now: boolean =
      this.figures[index]!.supports?.[`${side}Hand`] !== undefined;
    const was: boolean =
      index > 0
        ? this.figures[index - 1]!.supports?.[`${side}Hand`] !== undefined
        : this.gripped.has(side);
    return now ? (was ? 1 : share) : was ? 1 - share : 0;
  }

  /**
   * The contact windows of every support, as shares of the duration.
   *
   * @param members Each figure's supports, keyed by an identity that tells two
   *   contacts of one part apart, with the window each holds.
   * @param entry The supports the entry holds, keyed the same way.
   * @returns The windows.
   */
  public windows(
    members: readonly ReadonlyMap<string, IAutoMovieMotionHumanContactWindow>[],
    entry: ReadonlySet<string>,
  ): IAutoMovieMotionHumanContactWindow[] {
    const out: IAutoMovieMotionHumanContactWindow[] = [];
    const open: Map<string, number> = new Map();
    members.forEach(
      (
        figure: ReadonlyMap<string, IAutoMovieMotionHumanContactWindow>,
        i: number,
      ): void => {
        const before:
          | ReadonlyMap<string, IAutoMovieMotionHumanContactWindow>
          | undefined = members[i - 1];
        if (before !== undefined)
          for (const [key, window] of before)
            if (!figure.has(key)) {
              out.push({
                ...window,
                from: open.get(key)!,
                to: this.starts[i]! / this.duration,
              });
              open.delete(key);
            }
        for (const key of figure.keys())
          if (!open.has(key))
            open.set(
              key,
              i === 0 && entry.has(key) ? 0 : this.arrivals[i]! / this.duration,
            );
      },
    );
    for (const [key, from] of open)
      out.push({ ...members[members.length - 1]!.get(key)!, from, to: 1 });
    return out;
  }
}
