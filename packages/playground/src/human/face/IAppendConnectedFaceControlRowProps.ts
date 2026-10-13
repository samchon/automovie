import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";

/**
 * What one control row needs: where it goes, how its ids are prefixed, the
 * search query it must match, and the panel's transaction and refusal.
 *
 * @author Samchon
 */
export interface IAppendConnectedFaceControlRowProps {
  /** The element the row is appended to. */
  target: HTMLElement;

  /** Whether the row is a simple coordinate (its ids are prefixed differently). */
  simple: boolean;

  /** The lowercase, space-free search query; a non-matching row is skipped. */
  query: string;

  /** Commit a candidate document through the panel's transaction. */
  change: (document: IAutoMovieHumanFaceBasisDocument) => Promise<void>;

  /** Report a refused input. */
  refuse: (error: unknown) => void;

  /** Redraw the controls after a refusal, restoring the committed values. */
  render: () => void;
}
