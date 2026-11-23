import type {
  AutoMovieHumanLimb,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

/**
 * The knots of a swivel course (`courseLimbSwivels.swivels`): the limbs'
 * swivels and branches fitted at its seconds and the seeds a second between two
 * knots takes.
 */
export namespace courseLimbSwivelKnots {
  /** The limbs' swivels and branches at one knot. */
  export interface ISwivelKnot {
    /** The second, from the plan's start. */
    seconds: number;

    /** Each fitted limb's seed. */
    seeds: ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed>;

    /**
     * The coursed limbs the plan writes a goal for at this second; unknown for
     * the entered knot.
     */
    held?: ReadonlySet<AutoMovieHumanLimb>;
  }

  /**
   * The seeds a second between two knots takes: each limb both knots fit on one
   * branch at its shortest-turn interpolation of their swivels, the forearm's
   * twist carried between them too; a limb whose branch changes or whose goal
   * ends inside the interval at the earlier knot's seed; and a limb whose goal
   * begins inside it (the plan writes it none at the earlier knot) at the later
   * knot's, the arm its goal starts from there.
   *
   * @param seconds The second, from the plan's start.
   * @param a The earlier knot.
   * @param b The later knot.
   * @returns Each limb's seed at the second.
   */
  export function between(
    seconds: number,
    a: ISwivelKnot,
    b: ISwivelKnot,
  ): ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> {
    const share: number =
      b.seconds > a.seconds
        ? Math.min(
            1,
            Math.max(0, (seconds - a.seconds) / (b.seconds - a.seconds)),
          )
        : 0;
    const out: Map<AutoMovieHumanLimb, IAutoMovieSwivelSeed> = new Map();
    for (const [limb, from] of a.seeds) {
      const to: IAutoMovieSwivelSeed | undefined = b.seeds.get(limb);
      if (to === undefined || to.branch !== from.branch) {
        out.set(limb, from);
        continue;
      }
      const turn: number = to.swivel - from.swivel;
      const unwrapped: number = turn - 360 * Math.round(turn / 360);
      // The forearm's twist is carried between the knots too, so the
      // placement between them continues it (`IAutoMovieSwivelSeed.twist`).
      const twist: number | undefined =
        from.twist === undefined
          ? undefined
          : to.twist === undefined
            ? from.twist
            : from.twist + (to.twist - from.twist) * share;
      out.set(limb, {
        swivel: from.swivel + unwrapped * share,
        branch: from.branch,
        ...(twist === undefined ? {} : { twist }),
      });
    }
    // A limb whose goal begins inside the interval takes the later knot's
    // placement.
    for (const [limb, to] of b.seeds)
      if (!out.has(limb) && a.held?.has(limb) === false) out.set(limb, to);
    return out;
  }
}
