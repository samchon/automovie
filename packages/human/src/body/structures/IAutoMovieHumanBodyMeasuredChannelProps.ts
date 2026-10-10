import type { IAutoMovieHumanBodyBasis } from "./IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyMeasuredChannelReading } from "./IAutoMovieHumanBodyMeasuredChannelReading";

/**
 * Inputs of `solveHumanBodyMeasuredChannel`: the basis, the shape to solve
 * from, the one channel the solve moves, the target and, when the channel
 * has no rule of its own, the instrument it is read by.
 *
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
