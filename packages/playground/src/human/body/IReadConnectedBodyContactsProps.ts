import type { IAutoMovieModel } from "@automovie/interface";

/**
 * Inputs of `readConnectedBodyContacts`: the bone-partitioned skin model, the
 * slice length and thread yield, and the test that a later request has
 * superseded the reading.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Carries what an on-demand contact reading needs to run beside later edits.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Names the partitioned model and the slicing the resident worker reads contacts with.
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
