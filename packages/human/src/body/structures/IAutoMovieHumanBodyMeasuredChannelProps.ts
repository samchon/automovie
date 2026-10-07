import type { IAutoMovieHumanBodyBasis } from "./IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyMeasuredChannelReading } from "./IAutoMovieHumanBodyMeasuredChannelReading";

/**
 * Inputs of `solveHumanBodyMeasuredChannel`: the basis, the shape to solve
 * from, the one channel the solve moves, the target and, when the channel
 * has no rule of its own, the instrument it is read by.
 *
 * @evidence contracts/common.md#principled-implementation The reading defaults to the rule the channel names, so every existing caller keeps its instrument.
 * @evidence contracts/common.md#clear-and-simple-design Five fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The shape is read-only; the solver returns a fresh one.
 * @evidence contracts/common.md#meaningful-documentation States what each field is.
 * @evidence contracts/modeling.md#parameter-channels Names the one channel the solve changes.
 * @evidence contracts/modeling.md#spatial-conventions The target is metres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The props define no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The props emit no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The props build no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The props are not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The measurement rule owns the source.
 * @evidenceExclude contracts/anatomy.md#permitted-range The solver's inverse owns the reach.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The solver converts the target; the props only carry it.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyMeasuredChannelProps {
  /** The body basis whose shaped rest skin is measured. */
  basis: IAutoMovieHumanBodyBasis;

  /** The shape to solve from; only the solved channel's weight changes. */
  shape: Readonly<Record<string, number>>;

  /** The basis channel id the solve moves. */
  channel: string;

  /** The target value, metres. */
  targetMetres: number;

  /** The instrument to read; omitted reads `humanBodyChannelReading(channel)`: its own rule or its table binding. */
  measurement?: IAutoMovieHumanBodyMeasuredChannelReading;
}
