import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/**
 * Sweep a long white cane ahead of the feet while walking, performed over the
 * walk: the cane hand is held at the body's midline and the tip arcs from side
 * to side just wider than the body, touching the floor on the side opposite
 * each foot as that foot lands (the two-point touch), or sliding along the
 * floor between the sides (constant contact).
 */
export interface IAutoMovieMotionHumanCaneSweep {
  /** The long cane's scene subject, held at entry in the cane hand. */
  prop: string;

  /** The cane hand; the right when absent. */
  hand?: AutoMovieHumanSide;

  /** The technique; the two-point touch when absent. */
  technique?: IAutoMovieMotionHumanCaneSweep.Technique;

  /**
   * How long the sweep is performed over the walk, seconds; positive. The arm
   * takes 0.5 s to reach the cane pose and leaves it 0.3 s before the span ends
   * (`HumanCaneSweep` constants, provisional).
   */
  duration: number;
}

/** Companion types of {@link IAutoMovieMotionHumanCaneSweep}. */
export namespace IAutoMovieMotionHumanCaneSweep {
  /**
   * The two-point touch, the tip lifted between touches, or constant contact,
   * the tip sliding along the floor.
   */
  export type Technique = "twoPoint" | "constant";
}
