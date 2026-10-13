import { IAutoMovieMovablePanel } from "./IAutoMovieMovablePanel";
import { IAutoMovieOpeningHardware } from "./IAutoMovieOpeningHardware";
import { IAutoMovieOperationState } from "./IAutoMovieOperationState";

/**
 * The moving part of a door, sash, shutter, or blind, as states rather than a
 * word.
 *
 * A single `"open"` string cannot say how far open, cannot be interpolated, and
 * cannot be checked. Instead each travelling leaf declares one degree of
 * freedom with its own limits, and a named state gives every leaf a value on
 * it. `closed`, `open`, `vent`, and a production's own term are all the same
 * kind of record, so the vocabulary belongs to the author and the arithmetic
 * belongs to the engine.
 *
 * Swing, slide, and fold are not three contracts: a swing leaf is one revolute
 * panel, a slide leaf is one prismatic panel, and a folding leaf is a revolute
 * panel whose element is parented to another leaf's element, so the existing
 * element hierarchy carries the chaining without a second parent notion.
 *
 * An opening that declares an operation must name the element the panels belong
 * to in {@link IAutoMovieBuiltOpening.fill}: a moving leaf that fills nothing is
 * a leaf nobody can point at.
 *
 * @author Samchon
 */
export interface IAutoMovieOpeningOperation {
  /** Travelling leaves, sashes, or slats; at least one. */
  panels: IAutoMovieMovablePanel[];

  /** Named states; at least one, and each gives every panel a value. */
  states: IAutoMovieOperationState[];

  /**
   * The state the design currently stands in; names one of {@link states}.
   *
   * Lowering places every panel at the travel this state gives it.
   */
  state: string;

  /** Fixed members the opening carries, such as a frame, hinge, or handle. */
  hardware: IAutoMovieOpeningHardware[];
}
