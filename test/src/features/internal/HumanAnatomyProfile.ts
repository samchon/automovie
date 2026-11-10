/**
 * Turning points of a sampled profile: where a curve read through the middle of
 * a part goes up and where it goes down.
 *
 * A mid-section of a body part (the trunk's breadth by height, the median
 * profile of the face, a limb's girth by length) has a known order of maxima
 * and minima that anatomy fixes: hip, waist, chest; forehead, nasion, nose tip,
 * subnasale. The helper reduces a profile to its prominent turning points, so a
 * test states the sequence it expects and the least prominence each turn must
 * have, and a wobble below that prominence is read as none.
 */
export namespace HumanAnatomyProfile {
  /** One turning point of a profile. */
  export interface ITurn {
    /** Index of the sample. */
    index: number;

    /** Whether the profile peaks or dips here. */
    kind: "max" | "min";

    /** The sample's value. */
    value: number;

    /**
     * How far the profile falls from this turn to the next turn or to its
     * start, whichever is nearer in value: the smaller of the two rises, in the
     * unit of the values. The first and last samples count one side only.
     */
    prominence: number;
  }

  /**
   * The prominent turning points of a profile, alternating maxima and minima.
   * A turn is kept only when the profile has moved at least `least` from the
   * last kept turn, so noise below that level is no turn at all.
   *
   * @param values Samples along the profile.
   * @param least Least rise or fall that counts as a turn, in the unit of the values.
   */
  export function turns(values: number[], least: number): ITurn[] {
    if (values.length < 3) return [];

    const found: { index: number; kind: "max" | "min" }[] = [];
    let high: number = 0;
    let low: number = 0;
    let rising: boolean | undefined;

    for (let i: number = 1; i < values.length; i++) {
      const v: number = values[i]!;

      if (v > values[high]!) high = i;
      if (v < values[low]!) low = i;

      if (rising === undefined) {
        // The first move of at least `least` fixes the direction.
        if (values[high]! - values[0]! >= least && high > low) {
          rising = true;
          low = 0;
        } else if (values[0]! - values[low]! >= least && low > high) {
          rising = false;
          high = 0;
        }
      } else if (rising && values[high]! - v >= least) {
        found.push({ index: high, kind: "max" });
        rising = false;
        low = i;
      } else if (!rising && v - values[low]! >= least) {
        found.push({ index: low, kind: "min" });
        rising = true;
        high = i;
      }
    }

    return found.map(
      (t: { index: number; kind: "max" | "min" }, k: number): ITurn => {
        const before: number =
          k === 0 ? values[0]! : values[found[k - 1]!.index]!;
        const after: number =
          k === found.length - 1
            ? values[values.length - 1]!
            : values[found[k + 1]!.index]!;
        const value: number = values[t.index]!;

        return {
          index: t.index,
          kind: t.kind,
          value,
          prominence:
            t.kind === "max"
              ? Math.min(value - before, value - after)
              : Math.min(before - value, after - value),
        };
      },
    );
  }

  /** The turn kinds of a profile in order, such as `max,min,max`. */
  export function kinds(values: number[], least: number): string {
    return turns(values, least)
      .map((t: ITurn): string => t.kind)
      .join(",");
  }
}
