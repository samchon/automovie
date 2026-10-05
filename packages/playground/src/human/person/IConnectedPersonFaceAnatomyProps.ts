import type { AutoMovieHumanFaceMeasurementReading, IAutoMovieHumanPersonDocument } from "@automovie/human";

import type { IConnectedPersonFaceSolution } from "./IConnectedPersonFaceSolution";

/**
 * What the face anatomy panel renders into and calls: the container, the
 * current person, the worker's face reading and solve, and the panel's intent
 * tickets, transaction, status and refusal owners.
 *
 * @author Samchon
 */
export interface IConnectedPersonFaceAnatomyProps {
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

  /** Read every registered face measurement on a person's face. */
  read: (document: IAutoMovieHumanPersonDocument) => Promise<AutoMovieHumanFaceMeasurementReading[]>;

  /** Solve one face measurement target, in the measurement's unit. */
  solve: (document: IAutoMovieHumanPersonDocument, measurement: string, target: number) => Promise<IConnectedPersonFaceSolution>;

  /** Commit a person document under a ticket. */
  change: (document: IAutoMovieHumanPersonDocument, ticket: number) => Promise<boolean>;

  /** Show a busy status. */
  busy: (text: string) => void;

  /** Append a report line to the status. */
  report: (text: string) => void;

  /** Report a refused input; the committed state stays. */
  refuse: (error: unknown) => void;
}
