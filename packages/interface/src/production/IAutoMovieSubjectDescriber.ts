import type { IAutoMovieSubjectDescription } from "./IAutoMovieSubjectDescription";

/**
 * Describes the subjects of one compiled shot artifact, sharing every index
 * and measurement across one description pass.
 *
 * {@link describeAutoMovieSubject} and {@link describeAutoMovieSubjects} both
 * describe through one of these, so a subject reads the same whether it is
 * addressed alone or listed in the inventory. The describer indexes the
 * artifact when constructed and memoizes model-frame part points per model and
 * staged part boxes per built environment, so a pass over many elements of one
 * model tessellates it once and stages each environment once for its building
 * units. It treats the artifact as an immutable snapshot; a caller that edits
 * the artifact builds a new describer.
 *
 * Every member summary is the page of {@link autoMovieSubjectMemberSummary}
 * starting at the constructor's `memberOffset`. Prototype and prototype-part
 * bounds are in model coordinates and every other kind's in world metres.
 *
 * @evidence contracts/development/design.md#principled-representation A memoizing context over a snapshot: indexes and measurements are computed once and reused, which is sound because the describer's contract is one unchanged artifact, and every geometric answer comes from the engine's own staging, tessellation and bounds functions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One owner for how each subject kind is described, replacing the two full copies the single and inventory entry points kept; the class exists so the shared indexes and caches live exactly as long as one description pass.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No subject, model or environment is special-cased; a transform-only group is described without geometry because it has none, and an unknown address throws.
 * @evidence contracts/development/common.md#meaningful-documentation The documentation states who uses the describer, what it memoizes and why, its snapshot semantics, the member page rule, and the coordinate space of each kind's bounds.
 */
export interface IAutoMovieSubjectDescriber {
  /**
   * Describe the subject at one address, regenerating an element part or a
   * single compact instance only because it was addressed.
   *
   * Addresses are those of {@link autoMovieSubjectAddress} and
   * {@link autoMovieInstanceAddress}. Throws an `Error` for an address no
   * subject answers, and whatever `instanceSlot` throws for a member it cannot
   * regenerate.
   *
   * @param subjectId Stable subject address.
   * @returns The subject's description.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Resolves the address kind by kind in a fixed order, comparing each candidate's own address with the request, so any subject the inventory lists resolves to the same description, and element parts and instances are regenerated from the records that define them.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The single-subject half of the describer; it shares every per-kind description with `inventory` so the two answers cannot drift.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No address is special-cased beyond its grammar; an unknown address is refused rather than matched loosely.
   * @evidence contracts/development/common.md#meaningful-documentation The documentation states which addresses resolve, which subjects are regenerated, and both failure sources.
   * @evidence contracts/development/implementation.md#efficient-algorithms One scan per subject kind until the first match, linear in the artifact's stored subjects and part count, and only the subject found is measured; a compact member address is parsed rather than generated.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Answers one address per call; repeated addressing on one describer reuses its memoized points and boxes.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new description the caller owns; any measurement it memoizes is held by the describer as stated on the class.
   */
  describe(subjectId: string): IAutoMovieSubjectDescription;

  /**
   * Every directly stored subject, sorted by address in render-id order.
   *
   * Holds each model as a prototype with its prototype parts, each staged
   * scene node as an element, each instance set, and, per built environment,
   * its transform-only groups, logical spaces and building units. Element parts
   * and single instances are left out because they are regenerated only when
   * addressed.
   *
   * @returns One description per stored subject.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Enumerates exactly the records the artifact stores, so the inventory is a census of the work rather than of the expanded scene, and sorts once with the render-id comparator every subject list uses.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The inventory half of the describer, built from the same per-kind descriptions `describe` returns.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No subject is filtered or special-cased beyond the stated rule that regenerated subjects are left out.
   * @evidence contracts/development/common.md#meaningful-documentation The documentation states every included kind, what is left out and why, and the order.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in stored subjects plus measured vertices, with an O(n log n) sort; tessellation is shared per model and building staging per environment, while each space's content bounds still stage its environment once.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Produces a new list per call; the describer's memoized points and boxes are what repeated work reuses.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a list the caller owns, one description per stored subject; the describer's caches are bounded as stated on the class.
   */
  inventory(): IAutoMovieSubjectDescription[];
}
