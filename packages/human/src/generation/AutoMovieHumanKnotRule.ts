/**
 * Where a family's station knots stand: at the part's landmarks, not where one person's trace needed them.
 *
 * A wall's fields are curves along its course through their values at the knots. A knot is spent where the form needs one: at the ends
 * of each run between two course centres, at each measurement site, and at each extremum of each outline between them (one maximum for
 * a belly, one minimum for a waist). Between two extrema an outline is monotone and a cubic carries it. Knots closer together than the
 * form they carry make the wall follow the small steps of its target, which show as level lines across the surface (3d-modeling's
 * lofting, on spacing a wall's knots at the scale of the form); the scale here is the section's own size, so two knots stand no closer
 * than a stated share of the section's mean reach there.
 *
 * Every knot is a place in a run, so a person's knots follow the person's segment lengths with the run.
 */
export namespace AutoMovieHumanKnotRule {
  /** What the rule reads of one family. */
  export interface IInput {
    /** The run ends along the course, mm, increasing: the first station, each interior course centre, the last station. */
    runs: readonly number[];

    /** The measurement sites' stations, mm. */
    sites: readonly number[];

    /** Each outline whose extrema take a knot, as a smooth function of the station, mm. */
    outlines: readonly ((station: number) => number)[];

    /** The section's mean reach by station, mm: the scale of the form. */
    reach: (station: number) => number;

    /** The least distance between two knots as a share of the mean reach where they stand. */
    share: number;

    /** The spacing the outlines are searched at, mm: finer than the narrowest belly to be found. */
    step: number;
  }

  /** One knot with why it stands. */
  export interface IKnot {
    /** Its station, mm. */
    station: number;

    /** What put it there. A run end and a site are kept whatever stands beside them. */
    basis: "run" | "site" | "extremum";
  }

  /**
   * The knots of a family: its run ends, its sites and its outlines' extrema, thinned so no two stand closer than the form's scale.
   *
   * @param input The runs, sites, outlines and scale.
   *
   * @evidence contracts/development/implementation.md#principled-implementation An extremum of a smooth outline is bracketed where its difference over one step changes sign and placed by ternary search inside the two steps round it, where the outline has one extremum when the step is finer than its narrowest belly. Thinning keeps run ends first, then sites, then extrema in station order, and drops a candidate nearer a kept knot than `share` times the mean reach at the candidate.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scan an outline, one thinning pass by rank.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No station is a stored number of a person; fewer than two run ends, unordered runs, a site outside the runs and nonpositive scale, share or step are refused.
   * @evidence contracts/development/common.md#meaningful-documentation States units, which knots are always kept and what the share is a share of.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each outline is read once a step and `HALVINGS` times an extremum.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure rule coordinates no shared work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one array.
   */
  export function knots(input: IInput): IKnot[] {
    const [first, last]: [number, number] = [input.runs[0] ?? NaN, input.runs.at(-1) ?? NaN];
    if (input.runs.length < 2 || input.runs.some((s: number, k: number): boolean => k > 0 && !(s > input.runs[k - 1]!))) throw new Error("knot rule: the run ends must be at least two, increasing");
    if (!(input.share > 0 && input.step > 0)) throw new Error("knot rule: the share and the step must be positive");
    if (input.sites.some((s: number): boolean => !(s >= first && s <= last))) throw new Error("knot rule: a site lies outside the runs");

    // Each outline's interior extrema: a sign change of its difference over one step, placed by ternary search on the two steps round it.
    const extrema: number[] = [];
    for (const outline of input.outlines) {
      let previous: number = outline(first + input.step) - outline(first);
      for (let s: number = first + input.step; s + input.step <= last; s += input.step) {
        const next: number = outline(s + input.step) - outline(s);
        if (previous !== 0 && next !== 0 && Math.sign(next) !== Math.sign(previous)) {
          const sign: number = previous > 0 ? 1 : -1;
          let [low, high]: [number, number] = [s - input.step, s + input.step];
          for (let k: number = 0; k < HALVINGS; ++k) {
            const [a, b]: [number, number] = [low + (high - low) / 3, high - (high - low) / 3];
            if (sign * outline(a) < sign * outline(b)) low = a;
            else high = b;
          }
          extrema.push((low + high) / 2);
        }
        if (next !== 0) previous = next;
      }
    }

    // Thinning by rank: run ends, then sites, then extrema; a candidate too near a kept knot is left out.
    const kept: IKnot[] = [];
    const offer = (station: number, basis: IKnot["basis"], always: boolean): void => {
      const scale: number = input.reach(station);
      if (!(scale > 0)) throw new Error("knot rule: the reach at " + station + " mm is not positive");
      if (kept.some((knot: IKnot): boolean => knot.station === station)) return;
      if (always || kept.every((knot: IKnot): boolean => Math.abs(knot.station - station) >= input.share * scale)) kept.push({ station, basis });
    };
    for (const s of input.runs) offer(s, "run", true);
    for (const s of [...input.sites].sort((a: number, b: number): number => a - b)) offer(s, "site", true);
    for (const s of extrema.sort((a: number, b: number): number => a - b)) offer(s, "extremum", false);
    return kept.sort((a: IKnot, b: IKnot): number => a.station - b.station);
  }

  /*
   * Thirds taken off an extremum's bracket: forty take a bracket of a few millimetres under 1e-6 mm. The search cannot place it finer
   * than the outline lets it: beside an extremum the values within `sqrt(2 eps f / |f''|)` of it are one double, a few thousandths of a
   * micrometre to a few micrometres for a body's outline, far under any knot's use.
   */
  const HALVINGS: number = 40;
}
