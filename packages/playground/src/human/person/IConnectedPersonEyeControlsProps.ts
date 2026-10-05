import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

/**
 * What the eye-region controls render into and call: the container, the
 * current person, the panel's intent tickets, and the panel's transaction,
 * status and refusal owners.
 *
 * @author Samchon
 */
export interface IConnectedPersonEyeControlsProps {
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

  /** Commit a person document under a ticket. */
  change: (document: IAutoMovieHumanPersonDocument, ticket: number) => Promise<boolean>;

  /** Show a busy status. */
  busy: (text: string) => void;

  /** Append a report line to the status. */
  report: (text: string) => void;

  /** Report a refused input; the committed state stays. */
  refuse: (error: unknown) => void;
}
