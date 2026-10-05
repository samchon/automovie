import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyBasisDocument,
} from "@automovie/human";

import type { IConnectedBodyMeasurement } from "../body/IConnectedBodyMeasurement";

/**
 * What the person panel's body control section renders into and calls: its
 * section root, the body partition view, the current body, the panel's
 * intent tickets, the off-thread measured solve and the panel's transaction,
 * status and refusal owners.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Carries the body view, current body and solver the person's body section edits with.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Names the section root, intent tickets and transaction owners of the body controls.
 * @author Samchon
 */
export interface IConnectedPersonBodyControlsProps {
  /** The document that creates the controls. */
  dom: Document;

  /** The body section root holding the `control-kind` and `basis-controls` roles. */
  section: HTMLElement;

  /** The body partition view of the person generation. */
  body: IAutoMovieHumanBodyBasis;

  /** The current draft body document. */
  current: () => IAutoMovieHumanBodyBasisDocument;

  /** Reserve a new intent ticket. */
  reserve: () => number;

  /** Whether a ticket is still the latest intent. */
  isCurrent: (ticket: number) => boolean;

  /** Solve a measured body channel for a target in metres, off the page. */
  solve: (
    shape: Record<string, number>,
    channel: string,
    targetMetres: number,
  ) => Promise<IConnectedBodyMeasurement>;

  /** Commit a body document, under a ticket when one was reserved. */
  change: (body: IAutoMovieHumanBodyBasisDocument, ticket?: number) => Promise<boolean>;

  /** Show a busy status. */
  busy: (text: string) => void;

  /** Append a report line to the status. */
  report: (text: string) => void;

  /** Report a refused input; the committed state stays. */
  refuse: (error: unknown) => void;
}
