/**
 * The members the input reader reads of a hand-written document before its
 * owner admits it; both may be missing or malformed.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the members read and that they are unchecked.
 *
 * @evidence contracts/common.md#principled-implementation Unknown optional id and basis fields preserve malformed external JSON until the input reader validates their meaning.
 * @evidence contracts/common.md#clear-and-simple-design Only the catalogue's two preliminary identity fields are projected.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A TypeScript declaration does not turn missing or malformed external identity values into trusted strings.
 *
 * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Unknown optional id and basis fields preserve malformed external JSON until the input reader validates their meaning.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant A TypeScript declaration does not turn missing or malformed external identity values into trusted strings.
 *
 * @author Samchon
 */
export interface IHumanViewerInputDocument {
  /**
   * Document id, required to be a nonempty string.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Keeps a missing or malformed external id unknown until the input reader checks nonempty-string identity.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Keeps a missing or malformed external id unknown until the input reader checks nonempty-string identity.
   */
  id?: unknown;

  /**
   * Declared basis id of a face or body document.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Keeps the declared basis value unchecked until the actual input/domain owner validates it.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Keeps the declared basis value unchecked until the actual input/domain owner validates it.
   */
  basis?: unknown;
}
