import typia from "typia";

import type { IAutoMovieHumanBodyAnatomicalAssembly } from "../../body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import { admitHumanBodyBasisDocument } from "../../body/document/admitHumanBodyBasisDocument";
import { admitHumanFaceBasisDocument } from "../../face/document/admitHumanFaceBasisDocument";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";

/**
 * Schema and finite-scalar admission shared by loading and saving a person.
 *
 * This owner admits the person's identity and closed `headShape` numerical
 * record, rejecting nonfinite source-trait differences. Face and body subtree
 * admission stays with each anatomy. The saved head values are millimetre or
 * degree differences under the requested trait's source convention, not raw
 * endpoint weights or clinical observations. No value is converted here.
 *
 * The generation resolver checks actual field availability, registered units,
 * authored support and the one body-channel conversion; the builder checks
 * the two bases, joints and cross-document colour/population relations.
 * Loading and saving therefore need no installed source generation, while
 * evaluation can still refuse an unavailable field, including explicit zero.
 * An optional loaded body source supplies the body's registered internal
 * quantity authority. It is host-owned and is not read from a person record;
 * omission retains the original body's unsupported-path admission behavior.
 * An explicitly neutral-only source also requires the face's owner-neutral
 * empty expression and absent oral/regional performance. Identity dimensions
 * remain authored, and this admission never clears a caller's expression.
 *
 * @evidence contracts/common.md#principled-implementation Exact person schema and finite source-trait values are admitted here; anatomy-specific schemas remain delegated, and generation-dependent support/conversion remains with the head shape resolver.
 * @evidence contracts/common.md#clear-and-simple-design One exact-schema check, two anatomy delegations, finite person-head values and person identity admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is accepted by omission of a check: unknown fields refuse through the exact-schema assertion.
 * @evidence contracts/common.md#meaningful-documentation The comment states what is admitted here and what the builder decides.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function admits a document and defines no part.
 * @evidence contracts/modeling.md#parameter-channels The person owns the closed source-neutral head trait requests; this admission preserves their values and leaves directional endpoint conversion to registered generation data.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Head differences retain their trait's source millimetre/degree units without conversion; source registration owns the anatomical support frame and weight scaling.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The source trait registration owns geometric/protocol qualification; schema admission derives no anatomy or clinical normal.
 * @evidenceExclude contracts/anatomy.md#permitted-range Finite values are admitted here; generation registration and pose/source owners enforce their actual authored and physical support during evaluation.
 * @evidence contracts/anatomy.md#parametric-authority The exact closed anatomical trait record admits numerical differences only; personal vertices, curves, meshes and extra fields cannot enter through headShape.
 */
export function admitHumanPersonDocument(
  input: unknown,
  bodySource?: IAutoMovieHumanBodyAnatomicalAssembly,
): IAutoMovieHumanPersonDocument {
  const document = typia.assertEquals<IAutoMovieHumanPersonDocument>(input);
  admitHumanFaceBasisDocument(document.face);
  admitHumanBodyBasisDocument(document.body, bodySource);
  if (
    bodySource?.mode === "neutral-only" &&
    (Object.keys(document.face.expression).length !== 0 ||
      document.face.oral?.performance !== undefined ||
      Object.values(document.face.skinRelief?.regions ?? {}).some(
        (region) => region?.performance !== undefined,
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
  if ([document.id, document.name].some((id) => id.trim() === ""))
    throw new Error("A person needs nonempty identities.");
  return document;
}
