import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyToePose,
} from "@automovie/human";

/**
 * Inputs of `renderBodyToeRayControls` for one foot's source-declared phalanges. Toe rows use degrees relative to their parent ray or toes bone, with positive flexion toward the sole. Their bounds are the package's stated convention rather than measured clinical capacity.
 *
 * @evidence contracts/common.md#principled-implementation The selected side filters source-declared toe rays, while current sparse rows and an edit callback keep authored phalanx coordinates separate from the enclosing toes-bone motion.
 * @evidence contracts/common.md#clear-and-simple-design The toe renderer receives only its mounting target, basis, side and row hooks, leaving complete body-document transactions to the parent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A basis without rays remains unavailable rather than receiving invented phalanges, and conventional limits are not described as clinical measurements.
 * @evidence contracts/common.md#meaningful-documentation The interface documents parent-relative degrees, flexion direction, side selection and the conventional status of toe bounds.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This toe-input schema chooses no ray filtering or DOM construction algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current toe data is supplied without a cache or equivalence relation across document edits.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Basis and DOM references remain panel-owned; this declaration creates no listener or rendering resource.
 *
 * @author Samchon
 */
export interface IBodyToeRayControlsProps {
  /** The panel's document. */
  dom: Document;

  /** Where the rows are appended. */
  container: HTMLElement;

  /** The compiled body basis. */
  basis: IAutoMovieHumanBodyBasis;

  /** The foot whose rays are shown. */
  side: "left" | "right";

  /**
   * Read latest authored toe rows at paint and event time, preserving edits to other phalanges.
   *
   * @evidence contracts/common.md#principled-implementation Latest-row lookup lets one phalanx edit retain changes made elsewhere while the controls were displayed.
   * @evidence contracts/common.md#clear-and-simple-design The getter exposes toe rows alone rather than the full document and body history.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored rows are read from the draft rather than reconstructed from a displayed neutral pose.
   * @evidence contracts/common.md#meaningful-documentation The member identifies both rendering and event-time use and preservation of neighboring phalanges.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This toe-row getter selects no collection access or snapshot-copying algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Readonly toe access declares no shared numerical evaluation or memoized pose result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed sparse rows have no external handle or independently retained worker task.
   */
  toes: () => readonly IAutoMovieHumanBodyToePose[];

  /**
   * Submit replacement toe rows to the parent body transaction; blank coordinates can remove an unneeded authored row.
   *
   * @evidence contracts/common.md#principled-implementation Replacement sparse rows represent authored toe changes while omission returns an unneeded phalanx row to rest.
   * @evidence contracts/common.md#clear-and-simple-design The parent receives toe data and retains full-document admission, history and publication responsibilities.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Row submission does not bypass body admission or certify a completed geometry update.
   * @evidence contracts/common.md#meaningful-documentation The callback comment distinguishes transaction submission and the meaning of omitted authored coordinates.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This toe-edit signature implements no sparse merge or body build strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Toe updates are authored effects with no declared cross-edit result sharing.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The row handoff transfers numerical data while subsequent frames remain owned by the panel and viewport.
   */
  onChange: (toes: IAutoMovieHumanBodyToePose[]) => void;
}
