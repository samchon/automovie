import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyBasisDocument,
} from "@automovie/human";

/**
 * What the anatomical target rows render into and call: the container, the
 * body view within its reach, the search, the parent's drafts and intent
 * tickets, and the panel's transaction, status and refusal owners.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Carries what the body editor's anatomical measurement rows need to state and commit a target.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Names the container, search and transaction owners the rows draw into and commit through.
 * @author Samchon
 */
export interface IConnectedBodyExteriorTargetsProps {
  /** The document that creates the rows. */
  dom: Document;

  /** The element the rows are appended to. */
  container: HTMLElement;

  /** The body view with each channel's range cut to its evaluable reach. */
  basis: IAutoMovieHumanBodyBasis;

  /** The search text, lower-cased without spaces. */
  query: string;

  /** Uncommitted typed targets by request path, owned by the parent. */
  drafts: Map<string, string>;

  /** The current draft body document. */
  current: () => IAutoMovieHumanBodyBasisDocument;

  /** Reserve a new intent ticket. */
  reserve: () => number;

  /** Whether a ticket is still the latest intent. */
  isCurrent: (ticket: number) => boolean;

  /** Commit a body document under a ticket; the builder solves its anatomy. */
  change: (
    document: IAutoMovieHumanBodyBasisDocument,
    ticket: number,
  ) => Promise<boolean>;

  /** Show a busy status. */
  busy: (text: string) => void;

  /** Append a report line to the status. */
  report: (text: string) => void;

  /** Report a refused input; the committed state stays. */
  refuse: (error: unknown) => void;
}
