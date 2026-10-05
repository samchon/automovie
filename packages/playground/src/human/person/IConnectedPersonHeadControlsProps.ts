import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

import type { IConnectedPersonHeadSolution } from "./IConnectedPersonHeadSolution";

/**
 * What the head measurement controls render into and call: the container,
 * the current person, the panel's intent tickets, the off-thread reader and
 * solver, and the panel's transaction, status and refusal owners.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-measurements Connects the head measurement controls to the person's transaction.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements Names the reader and the solver the controls call.
 * @author Samchon
 */
export interface IConnectedPersonHeadControlsProps {
  /** The document that creates the rows. */
  dom: Document;

  /** The element the rows are rendered into. */
  container: HTMLElement;

  /** The current draft person document. */
  current: () => IAutoMovieHumanPersonDocument;

  /** Reserve a new intent ticket. */
  reserve: () => number;

  /** Whether a ticket is still the latest intent. */
  isCurrent: (ticket: number) => boolean;

  /** Read every head measurement on a person's skin at rest, metres by name. */
  read: (document: IAutoMovieHumanPersonDocument) => Promise<Record<string, number>>;

  /** Solve the head for targets in metres by measurement name. */
  solve: (document: IAutoMovieHumanPersonDocument, targets: Record<string, number>) => Promise<IConnectedPersonHeadSolution>;

  /** Commit a person document under a ticket. */
  change: (document: IAutoMovieHumanPersonDocument, ticket: number) => Promise<boolean>;

  /** Show a busy status. */
  busy: (text: string) => void;

  /** Append a report line to the status. */
  report: (text: string) => void;

  /** Report a refused input; the committed state stays. */
  refuse: (error: unknown) => void;
}
