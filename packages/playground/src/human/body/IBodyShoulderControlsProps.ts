import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyShoulderPose,
} from "@automovie/human";

/**
 * Inputs of `renderBodyShoulderControls`: one humerus's thorax-relative goal.
 *
 * `rest` and `shoulders` paint the current document while `currentRest` and `currentShoulders` read the latest draft at event time, so newer pending edits are retained. These goals use the loaded rig's thorax-relative degree conventions; they are not measurements of the subject's clinical capacity. An unavailable current rest withdraws the edit rather than reusing the painted rest.
 *
 * @evidence contracts/common.md#principled-implementation Thorax-relative shoulder goals and shape-dependent source-rig rest are distinct inputs, allowing current rest to be re-resolved before applying an authored goal.
 * @evidence contracts/common.md#clear-and-simple-design One humerus's renderer receives its basis declaration and latest-draft getters; numerical rest resolution and full-document commits remain with the mounting panel.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A refused current rest is represented as undefined rather than a stale painted substitute, and rig admission ranges do not claim clinical capacity.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes painted from event-time rest and goals, declares their thorax-relative convention and explains unavailable-rest withdrawal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The shoulder-input interface implements no rest resolver or DOM construction algorithm; those costs belong to the supplied getter and renderer.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Snapshot fields and latest-draft getters state access needs without implementing equality or memoization of shoulder rest.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Shoulder declarations and DOM references are borrowed from the panel, with no live resources acquired by this schema.
 *
 * @author Samchon
 */
export interface IBodyShoulderControlsProps {
  /** Document the controls are created in. */
  dom: Document;

  /** Element whose children the controls replace. */
  container: HTMLElement;

  /** Humerus whose goal is shown. */
  bone: IAutoMovieHumanBodyShoulderPose["bone"];

  /** The basis joint's shoulder declaration: ranges and rest conventions. */
  shoulder: NonNullable<IAutoMovieHumanBodyBasis["joints"][number]["shoulder"]>;

  /** Shape-only source-rig rest paired with the painted document. */
  rest: IAutoMovieHumanBodyShoulderPose;

  /**
   * Latest draft rest, or unavailable after the transaction owner refused it. An unavailable result prevents the edit.
   *
   * @evidence contracts/common.md#principled-implementation Shape-dependent rest is requested at edit time so a goal is interpreted in the current draft's source-rig frame.
   * @evidence contracts/common.md#clear-and-simple-design The getter returns only one humerus's rest and leaves refusal reporting with the transaction owner that computes it.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Undefined rest keeps an invalid pending shape visible as a refusal instead of silently recovering with an older frame.
   * @evidence contracts/common.md#meaningful-documentation The callback comment specifies both refused-rest absence and its consequence of withdrawing the edit.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This current-rest signature delegates shape evaluation to the caller and selects no rig algorithm itself.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The function-valued member carries no cache or promise; its provider owns any equivalent rest reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A returned shoulder-rest record has no external handle, and this declaration owns no ongoing evaluation.
   */
  currentRest: () => IAutoMovieHumanBodyShoulderPose | undefined;

  /** Shoulder goals painted into the inputs. */
  shoulders: readonly IAutoMovieHumanBodyShoulderPose[];

  /**
   * Read the latest draft's shoulder goals at event time, preserving edits to the other humerus.
   *
   * @evidence contracts/common.md#principled-implementation Reading the complete latest shoulder list lets the renderer replace one humerus without losing newer contralateral goals.
   * @evidence contracts/common.md#clear-and-simple-design A readonly goal-list getter supplies only the authored state needed for this row edit, without exposing transaction internals.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Latest goals come from the pending document rather than a fixed initial shoulder pose or previously rendered answer.
   * @evidence contracts/common.md#meaningful-documentation The comment ties event-time goal access to retaining edits on the other humerus.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The latest-goals callback type defines no list traversal or copying strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Goal access is a current-state read and this signature declares no cached equivalence across edits.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The readonly shoulder rows borrow document data and require no transport or renderer retirement.
   */
  currentShoulders: () => readonly IAutoMovieHumanBodyShoulderPose[];

  /**
   * Receive replacement shoulder goals after an edit; the panel performs the body-document transaction.
   *
   * @evidence contracts/common.md#principled-implementation The row emits authored shoulder goals while body admission and geometry construction remain in the document transaction.
   * @evidence contracts/common.md#clear-and-simple-design One replacement-goals callback is sufficient because the parent owns the rest of the body document and its history.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Emitting shoulder coordinates does not bypass range admission or imply that the requested body frame has already been published.
   * @evidence contracts/common.md#meaningful-documentation The operation comment identifies replacement goals and assigns the ensuing document transaction to the panel.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This shoulder-edit declaration implements neither a history update nor a body rebuild.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Authored shoulder updates are effects; this member specifies no merging of equal-looking submissions.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The callback hands over goal data without acquiring a build task or taking ownership of an admitted frame.
   */
  onChange: (shoulders: IAutoMovieHumanBodyShoulderPose[]) => void;
}
