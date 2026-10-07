import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";

/**
 * One row of the connected face controls: what it shows and how an entered
 * value becomes a candidate document.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Describes one face control row and how an entered value becomes a candidate document.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Keeps the row's display separate from the candidate document it produces.
 * @author Samchon
 */
export interface IConnectedFaceControlEntry {
  /** The control id: a channel id, or a simple coordinate id. */
  id: string;

  /** The label shown for the row. */
  label: string;

  /** What one unit of the control moves. */
  description: string;

  /** The smallest value the control offers, in its displayed unit. */
  minimum: number;

  /** The largest value the control offers, in its displayed unit. */
  maximum: number;

  /** The current value, in its displayed unit. */
  value: number;

  /** The component path the search also matches. */
  group?: string;

  /** The candidate document for an entered value. */
  edit: (value: number) => IAutoMovieHumanFaceBasisDocument;
}
