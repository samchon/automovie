import type { IAutoMovieModel } from "@automovie/interface";

/**
 * Inputs of `readConnectedBodyContacts`: the bone-partitioned skin model, the
 * slice length and thread yield, and the test that a later request has
 * superseded the reading.
 *
 * @author Samchon
 */
export interface IReadConnectedBodyContactsProps {
  /** The posed skin partitioned into one part per bone segment. */
  model: IAutoMovieModel;

  /** Milliseconds of reading between thread yields. */
  sliceMs: number;

  /** Hand the thread back so a waiting request can run. */
  yieldThread: () => Promise<unknown>;

  /** Whether a later request has superseded this reading. */
  superseded: () => boolean;
}
