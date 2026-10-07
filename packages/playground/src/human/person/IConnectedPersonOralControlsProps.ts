import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

/**
 * Complete person transactions used by the independent oral numerical editor.
 * The panel owns admission, history and last-valid state; these controls
 * author a candidate and publish it only through that transaction.
 * @author Samchon
 */
export interface IConnectedPersonOralControlsProps {
  /** Browser document creating the independent oral form elements. */
  dom: Document;

  /** Host into which the controls append their forms. */
  container: HTMLElement;

  /** Read the currently committed complete person without mutation. */
  current: () => IAutoMovieHumanPersonDocument;

  /** Reserve a new edit intent, superseding earlier unfinished control edits. */
  reserve: () => number;

  /** Whether the reserved intent still owns the editor transaction. */
  isCurrent: (ticket: number) => boolean;

  /** Admit and commit the candidate under its ticket; false means it was not published. */
  change: (document: IAutoMovieHumanPersonDocument, ticket: number) => Promise<boolean>;

  /** Show a pending candidate operation before its asynchronous result. */
  busy: (text: string) => void;

  /** Report the committed operation after the panel accepts it. */
  report: (text: string) => void;

  /** Show the refusal while preserving the committed document and model. */
  refuse: (error: unknown) => void;
}
