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
