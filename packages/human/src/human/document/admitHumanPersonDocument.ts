import typia from "typia";

import { admitHumanBodyBasisDocument } from "../../body/document/admitHumanBodyBasisDocument";
import { admitHumanFaceBasisDocument } from "../../face/document/admitHumanFaceBasisDocument";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";

/**
 * Schema and finite-scalar admission shared by loading and saving a person.
 *
 * The person's own identity is admitted here; the face and the body go through
 * their own admission, so a person accepts exactly what its two anatomies
 * accept and nothing more, and a change to either schema reaches the person
 * without a second copy of it. Whether the channels, joints and colours exist
 * in the compiled bases, and the relation between the documents (the body
 * stating no skin colour of its own), is the builder's decision, so a person
 * can be saved against bases the editor has not loaded and still be refused
 * later for the right reason.
 *
 * @evidence contracts/common.md#principled-implementation Delegating each anatomy's admission to its owner keeps one schema per document and lets the person add only its own identity check.
 * @evidence contracts/common.md#clear-and-simple-design A record check, two delegations and an identity check.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is accepted by omission of a check: unknown fields refuse through the exact-schema assertion.
 * @evidence contracts/common.md#meaningful-documentation The comment states what is admitted here and what the builder decides.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function admits a document and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The function carries no unit or frame; the inner documents' values are admitted by their owners.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Ranges belong to the compiled bases.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function adds no input; each anatomy's own admission owns its inputs.
 */
export function admitHumanPersonDocument(
  input: unknown,
): IAutoMovieHumanPersonDocument {
  const document = typia.assertEquals<IAutoMovieHumanPersonDocument>(input);
  admitHumanFaceBasisDocument(document.face);
  admitHumanBodyBasisDocument(document.body);
  if ([document.id, document.name].some((id) => id.trim() === ""))
    throw new Error("A person needs nonempty identities.");
  return document;
}
