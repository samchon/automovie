import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";

/**
 * Every point of the trunk's control cage by its anatomical slot, before connectivity.
 *
 * The torso is thirteen loops of twenty-four columns. Column `j` counts counterclockwise about +Y from the anterior midline (0) through the person's left side (6, the midaxillary line) to the posterior midline (12) and back up the right side; loop `i` counts upward from the thigh roots (0) to the top edge along the clavicles and the upper trapezius (12). The arm opens through columns 5 to 7 of loops 10 to 12 on each side, so the slot at loop 11, column 6 (and 18) is empty. Above the top loop a ridge row runs along the trapezius crest from each side of the neck to the acromion; below the thigh roots a perineal row of three crosses between the thighs.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanTrunkPoints {
  /** `loops[i][j]`, thirteen loops of twenty-four columns. */
  loops: IAutoMovieVector3[][];

  /**
   * Ridge row along the trapezius crest, index `c + 4` for `c` from -4 (right, at the acromion) to 4 (left); `c` from -1 to 1 lies inside the neck opening and is unused.
   */
  ridge: IAutoMovieVector3[];

  /** Perineal row between the thighs, right to left, `c` = -1, 0, 1. */
  perineum: IAutoMovieVector3[];

  /** Rings of each arm stub out to the cut, in the upper arm ring's layout order, the last ring the cut itself. */
  arms: Record<AutoMovieHumanSide, IAutoMovieVector3[][]>;

  /** Rings of each thigh down to the cut, in the thigh ring's layout order, the last ring the cut itself. */
  legs: Record<AutoMovieHumanSide, IAutoMovieVector3[][]>;

  /** The shared shapes of the trunk's five rings. */
  layouts: IAutoMovieHumanTrunkPoints.ILayouts;
}
export namespace IAutoMovieHumanTrunkPoints {
  /**
   * The shared ring shapes where the trunk opens.
   *
   * @author Samchon
   */
  export interface ILayouts {
    /** The neck base. */
    neck: IAutoMovieHumanRingShape;

    /** Each mid upper arm. */
    arm: Record<AutoMovieHumanSide, IAutoMovieHumanRingShape>;

    /** Each mid thigh. */
    thigh: Record<AutoMovieHumanSide, IAutoMovieHumanRingShape>;
  }
}
