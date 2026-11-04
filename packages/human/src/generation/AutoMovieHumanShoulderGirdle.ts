import type { IAutoMovieHumanShoulderOutline } from "./IAutoMovieHumanShoulderOutline";
import type { IAutoMovieHumanTrunkSection } from "./IAutoMovieHumanTrunkSection";
import type { AutoMovieHumanTrunkColumn } from "./AutoMovieHumanTrunkColumn";

/**
 * The shoulder girdle: the clavicle, the acromion and the scapular spine's
 * ring about the acromioclavicular centre, wider than the rib cage by the
 * girdle's overhang (the biacromial breadth, 365 mm women and 416 mm men, is
 * over a third wider than the chest breadth, ANSUR II), carrying the
 * trapezius' line to the neck.
 *
 * Its section is the trunk's column through the shoulders, whose half width
 * rises from the rib cage's at the axilla to the shoulder point's, and above
 * the shoulder point is the trapezius line's, copied from the neck's ring.
 * The thoracic wall below and the deltoid cap beside it are pieces of their
 * own with their own centres; the girdle joins the thorax along the
 * clavicle's line (G1) and the cap at the shoulder point (G2).
 */
export namespace AutoMovieHumanShoulderGirdle {
  /** What the girdle reads. */
  export interface IInput {
    /** The torso's column through the shoulders. */
    column: AutoMovieHumanTrunkColumn.IColumn;

    /** The trapezius line, from the shoulder point to the neck's ring. */
    line: IAutoMovieHumanShoulderOutline;
  }

  /**
   * The girdle's section measures at a height: the column's, with the half
   * width the trapezius line gives from the shoulder point up.
   *
   * @param input The column and the line.
   * @param y Height, mm.
   * @returns The measures.
   */
  export function section(input: IInput, y: number): IAutoMovieHumanTrunkSection {
    const s: IAutoMovieHumanTrunkSection = input.column.at(y);

    return y >= input.line.from ? { ...s, width: input.line.at(Math.min(y, input.line.to)).value } : s;
  }
}
