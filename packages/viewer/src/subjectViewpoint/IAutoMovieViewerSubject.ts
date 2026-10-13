import type { AutoMovieViewerSubjectKind } from "./AutoMovieViewerSubjectKind.js";

/**
 * Stable identity of one thing under inspection.
 *
 * This is the currency two agents working one production exchange instead of
 * screenshots. A reviewer that reports `element:hall-oriel-2` names something
 * the authoring agent can open, and both open the same thing; a reviewer that
 * reports a pixel names something only it can see.
 *
 * @author Samchon
 */
export interface IAutoMovieViewerSubject {
  /**
   * Which authored kind the id names.
   */
  kind: AutoMovieViewerSubjectKind;

  /**
   * Authored id, unique within its kind.
   */
  id: string;

  /**
   * Revision the observation was taken against, or `null` when the caller has
   * none to state.
   *
   * A revision is what makes an observation reopenable rather than merely
   * repeatable: the same id at a later revision is a different thing to judge.
   */
  revision: string | null;
}
