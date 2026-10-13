import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The world volume one movable panel sweeps across its whole travel.
 *
 * Produced by `builtOpeningSweepEnvelope`, one per panel in authored order. It
 * is an axis-aligned world box around the four corners of the panel's
 * element-local `(0, 0)` to `(width, height)` rectangle over its own travel
 * range, so the leaf has no thickness here. Ancestors stand at the
 * environment's current state while the panel's own displacement is removed;
 * the box is not the union over every state a chain of leaves could reach.
 *
 * @author Samchon
 */
export interface IAutoMovieOpeningSweep {
  /** Panel id inside its opening. */
  panel: string;

  /** The visible element the panel drives. */
  element: string;

  /** World minimum corner of the swept volume. */
  min: IAutoMovieVector3;

  /** World maximum corner of the swept volume. */
  max: IAutoMovieVector3;
}
