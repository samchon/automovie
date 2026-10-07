import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

/**
 * The skin-relief controls' host and transaction owners. Successful edits use
 * the person editor's history; refusal leaves its committed document and model.
 * @author Samchon
 */
export interface IConnectedPersonSkinReliefControlsProps {
  /** Browser document that creates the controls. */
  dom: Document;

  /** Container for the independent skin inputs. */
  container: HTMLElement;

  /** Current complete person document. */
  current: () => IAutoMovieHumanPersonDocument;

  /** Reserve the next edit intent. */
  reserve: () => number;

  /** Whether an edit intent is still current. */
  isCurrent: (ticket: number) => boolean;

  /** Validate and commit through the existing person worker and history. */
  change: (
    document: IAutoMovieHumanPersonDocument,
    ticket: number,
  ) => Promise<boolean>;

  /** Show the pending operation. */
  busy: (text: string) => void;

  /** Record the committed operation. */
  report: (text: string) => void;

  /** Show a refusal without changing the committed person. */
  refuse: (error: unknown) => void;
}
