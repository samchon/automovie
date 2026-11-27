import type {
  IAutoMovieHumanBodyBox,
  IAutoMovieHumanBodyMeasures,
  IAutoMovieLoftContract,
} from "@automovie/interface";

/**
 * The trunk's three boxes: at the chest, the natural waist and the hip, the
 * published breadth W and depth D of the level and the tape girth G that wraps
 * it, with the range a girth can take inside its box.
 *
 * A convex section that touches all four sides of a W by D box has a taut-tape
 * perimeter from `2 sqrt(W^2 + D^2)`, the rhombus through the four touch
 * points, to `2 (W + D)`, the box itself. The lower bound is the shortest
 * closed path that visits all four sides of a rectangle (unfold the path by
 * reflecting the rectangle in its sides: it straightens into a segment twice
 * the diagonal), and a convex set holds the hull of its touch points; the upper
 * bound holds because a convex set inside a convex set has the shorter
 * perimeter. A tape bridges every concavity (the spinal groove, the gluteal
 * cleft), so the girth is the convex hull's perimeter. One girth therefore
 * gives one fullness inside its box, and a girth outside the range contradicts
 * its breadth and depth.
 *
 * The trunk's front and side outlines carry each breadth and depth at its own
 * published site (`IAutoMovieHumanBodyAnatomy`): the chest's at the chest
 * circumference's level, the waist's at the natural waist, the hip breadth at
 * its own widest level and the buttock depth at the buttock circumference's.
 * The hip box pairs those two, the way each station's box takes both
 * outlines' values there even where the two sites differ; at the survey, the
 * hip breadth's level lies within a few centimetres of the buttock's.
 */
export namespace AutoMovieHumanBodyBox {
  /** The three levels, top down. */
  export const LEVELS: readonly IAutoMovieHumanBodyBox.Level[] = [
    "chest",
    "waist",
    "hip",
  ];

  /** Each level's measures, by their `IAutoMovieHumanBodyAnatomy` names. */
  export const FIELDS: Readonly<
    Record<IAutoMovieHumanBodyBox.Level, IAutoMovieHumanBodyBox.IFields>
  > = {
    chest: {
      breadth: "chestBreadth",
      depth: "chestDepth",
      girth: "chestCircumference",
    },
    waist: {
      breadth: "waistBreadth",
      depth: "waistDepth",
      girth: "waistCircumference",
    },
    hip: {
      breadth: "hipBreadth",
      depth: "buttockDepth",
      girth: "hipCircumference",
    },
  };

  /**
   * Floating-point slack of the range test, mm: a default held at an end of
   * the range by {@link place} lands there only to rounding, a millionth of a
   * micrometre, far below any measurement.
   */
  export const ROUNDING: number = 1e-9;

  /**
   * The range of taut-tape perimeters of a convex section touching all four
   * sides of a box.
   *
   * @param breadth Box breadth, mm.
   * @param depth Box depth, mm.
   * @returns The rhombus's and the box's perimeters, mm.
   */
  export function range(
    breadth: number,
    depth: number,
  ): IAutoMovieHumanBodyBox.RangeResult {
    return [2 * Math.hypot(breadth, depth), 2 * (breadth + depth)];
  }

  /**
   * Each level's box from resolved measures.
   *
   * @param measures A person's resolved measures.
   */
  export function of(
    measures: IAutoMovieHumanBodyMeasures,
  ): IAutoMovieHumanBodyBox.IBox[] {
    return LEVELS.map(
      (level: IAutoMovieHumanBodyBox.Level): IAutoMovieHumanBodyBox.IBox => {
        const fields: IAutoMovieHumanBodyBox.IFields = FIELDS[level];
        const breadth: number = measures[fields.breadth];
        const depth: number = measures[fields.depth];
        const girth: number = measures[fields.girth];
        const [rhombus, box] = range(breadth, depth);
        const tape: number = Math.min(box, Math.max(rhombus, girth));
        return {
          level,
          breadth,
          depth,
          girth,
          rhombus,
          box,
          tape,
          fullness: (tape - rhombus) / (box - rhombus),
        };
      },
    );
  }

  /**
   * One diagnostic per level whose girth lies outside its box's range.
   *
   * `AutoMovieHumanBodyAnatomy.resolve` places every default inside the range
   * the supplied measures leave ({@link place}), so a level outside it is a
   * contradiction among the person's own measures, reported at the input; the
   * figure is still made, with the section at the nearest end ({@link IBox.tape}).
   *
   * @param measures A person's resolved measures.
   * @returns The contradictions, producer `human.inputs`, level 1.
   */
  export function diagnose(
    measures: IAutoMovieHumanBodyMeasures,
  ): IAutoMovieLoftContract.IDiagnostic[] {
    return of(measures)
      .filter(
        (b: IAutoMovieHumanBodyBox.IBox): boolean =>
          !(b.girth >= b.rhombus - ROUNDING && b.girth <= b.box + ROUNDING),
      )
      .map(
        (
          b: IAutoMovieHumanBodyBox.IBox,
        ): IAutoMovieLoftContract.IDiagnostic => ({
          producer: "human.inputs",
          level: 1,
          contract: `the ${b.level} girth lies inside its breadth and depth's box`,
          detail:
            `${b.level}: breadth ${b.breadth.toFixed(1)} mm, depth ${b.depth.toFixed(1)} mm, girth ${b.girth.toFixed(1)} mm ` +
            `${b.girth < b.rhombus ? "below the rhombus" : "above the box"}; a convex section touching that box takes ` +
            `${b.rhombus.toFixed(1)} to ${b.box.toFixed(1)} mm, so the section takes ${b.tape.toFixed(1)} mm`,
        }),
      );
  }

  /**
   * A level's three measures with every default placed inside the range the
   * supplied ones leave, so a defaulted measure is never the cause of a
   * contradiction.
   *
   * The girth is the person's or its own default; each omitted breadth or
   * depth is its survey line on that girth. Then, keeping every supplied value:
   *
   * - a defaulted girth is held inside the box of the breadth and depth;
   * - with the girth supplied and both breadth and depth defaulted, both are
   *   scaled by one factor, keeping their survey proportion, until the girth
   *   lies in their box;
   * - with the girth and one of the two supplied, the other is held inside the
   *   interval that puts the girth in the box: for a supplied breadth W, the
   *   depth from `G / 2 - W` (the box's perimeter reaches G) to
   *   `sqrt(G^2 / 4 - W^2)` (the rhombus's does), an interval that is empty
   *   only when `W > G / 2`, which no depth can mend;
   * - with all three supplied, nothing moves, and {@link diagnose} reports a
   *   contradiction.
   *
   * @param supplied The person's own values, each undefined when omitted, mm.
   * @param girth The girth's default when omitted, mm.
   * @param breadth The breadth's survey line on the girth, mm.
   * @param depth The depth's survey line on the girth, mm.
   * @returns The level's breadth, depth and girth, mm.
   */
  export function place(
    supplied: IAutoMovieHumanBodyBox.IPlaceSupplied,
    girth: number,
    breadth: IAutoMovieHumanBodyBox.PlaceBreadth,
    depth: IAutoMovieHumanBodyBox.PlaceDepth,
  ): IAutoMovieHumanBodyBox.IPlaceResult {
    const g: number = supplied.girth ?? girth;
    const w: number = supplied.breadth ?? breadth(g);
    const d: number = supplied.depth ?? depth(g);
    if (supplied.girth === undefined) {
      const [rhombus, box] = range(w, d);
      return {
        breadth: w,
        depth: d,
        girth: Math.min(box, Math.max(rhombus, g)),
      };
    }
    if (supplied.breadth === undefined && supplied.depth === undefined) {
      const [rhombus, box] = range(w, d);
      const s: number = Math.min(g / rhombus, Math.max(g / box, 1));
      return { breadth: s * w, depth: s * d, girth: g };
    }
    if (supplied.breadth === undefined)
      return { breadth: within(w, g, d), depth: d, girth: g };
    if (supplied.depth === undefined)
      return { breadth: w, depth: within(d, g, w), girth: g };
    return { breadth: w, depth: d, girth: g };
  }

  /*
   * A default side of a box held so that a girth lies in the box with the
   * other, supplied side; unchanged when no side can (the supplied side is
   * more than half the girth).
   * Parameter value: The default side, mm.
   * Parameter girth: The girth, mm.
   * Parameter other: The supplied side, mm.
   */
  function within(value: number, girth: number, other: number): number {
    const half: number = girth / 2;
    if (other > half) return value;
    return Math.min(
      Math.sqrt(half * half - other * other),
      Math.max(half - other, value),
    );
  }
}
