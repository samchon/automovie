import typia from "typia";

import type { IAutoMovieHumanBodyAnatomicalAssembly } from "../../body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import { admitHumanBodyBasisDocument } from "../../body/document/admitHumanBodyBasisDocument";
import { admitHumanFaceBasisDocument } from "../../face/document/admitHumanFaceBasisDocument";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";

/**
 * Schema and finite-scalar admission shared by loading and saving a person.
 *
 * Admit the exact person schema, nonempty identity and finite closed headShape values, delegating face/body subtree rules to their anatomy owners. Saved head differences use each public trait's millimetre/degree convention rather than raw endpoint weights or clinical observations; no conversion occurs here.
 *
 * Generation evaluation separately owns availability, unit/support conversion and cross-basis geometry. An optional host-loaded body source supplies internal quantity authority rather than reading it from the document. Neutral-only source admission requires empty face expression and omitted oral/regional performance without clearing caller values. Successful admission returns the original object; it establishes neither measured anatomy nor rendered acceptance.
 *
 * @evidence contracts/common.md#principled-implementation Exact schema and finite identity-trait values combine with anatomy-owned subtree admission and explicit loaded-source neutral-only restrictions.
 * @evidence contracts/common.md#clear-and-simple-design Person admission owns its closed outer record; face/body owners admit subtrees and the generation resolver owns actual source availability/conversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonfinite traits and authored performance under neutral-only sources refuse without clamping or clearing; a valid saved request does not fabricate an available source endpoint.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes storage admission from evaluated source availability, trait units, host source authority and unchanged returned identity.
 * @evidence contracts/performance.md#efficient-algorithms Exact generated schema and delegated subtree checks traverse actual document/source data; additional work scans head fields, identities and neutral-only regional performance.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This admission reflects the supplied mutable document and host source and owns no validation cache or effectful request coordinator.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Successful output borrows the original admitted object, while generated diagnostics and local key/value arrays are call-local with no retained task or source handle.
 */
export function admitHumanPersonDocument(
  input: unknown,
  bodySource?: IAutoMovieHumanBodyAnatomicalAssembly,
): IAutoMovieHumanPersonDocument {
  const document: IAutoMovieHumanPersonDocument = typia.assertEquals<IAutoMovieHumanPersonDocument>(input);
  admitHumanFaceBasisDocument(document.face);
  admitHumanBodyBasisDocument(document.body, bodySource);
  if (
    bodySource?.mode === "neutral-only" &&
    (Object.keys(document.face.expression).length !== 0 ||
      document.face.oral?.performance !== undefined ||
      Object.values(document.face.skinRelief?.regions ?? {}).some(
        (region: NonNullable<NonNullable<IAutoMovieHumanPersonDocument["face"]["skinRelief"]>["regions"]>[keyof NonNullable<NonNullable<IAutoMovieHumanPersonDocument["face"]["skinRelief"]>["regions"]>]): boolean => region?.performance !== undefined,
      ))
  )
    throw new Error(
      "The person source is neutral-only; expression, oral and regional performance must be owner-neutral omissions.",
    );
  for (const [id, value] of Object.entries(document.headShape ?? {}))
    if (!Number.isFinite(value))
      throw new Error(
        "A saved head numerical field must be finite: " + id + ".",
      );
  if ([document.id, document.name].some((id: string): boolean => id.trim() === ""))
    throw new Error("A person needs nonempty identities.");
  return document;
}
