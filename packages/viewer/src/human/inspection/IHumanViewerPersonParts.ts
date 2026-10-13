/**
 * The two parts of a person document whose basis names the catalogue reads;
 * either may be missing or malformed until checked.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the parts read and that they are unchecked.
 *
 * @evidence contracts/common.md#principled-implementation Unknown optional face and body values preserve malformed external Person JSON until each identity is inspected.
 * @evidence contracts/common.md#clear-and-simple-design Only the two preliminary parts are projected for basis-name reading.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The transport does not assert absent or malformed domain values are already admitted documents.
 *
 * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Unknown optional face and body values preserve malformed external Person JSON until each identity is inspected.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant The transport does not assert absent or malformed domain values are already admitted documents.
 *
 * @author Samchon
 */
export interface IHumanViewerPersonParts {
  /**
   * The face document.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Preserves a missing or malformed external Face part as unknown until its basis identity is read.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Preserves a missing or malformed external Face part as unknown until its basis identity is read.
   */
  face?: unknown;

  /**
   * The body document.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Preserves a missing or malformed external Body part as unknown until its basis identity is read.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Preserves a missing or malformed external Body part as unknown until its basis identity is read.
   */
  body?: unknown;
}
