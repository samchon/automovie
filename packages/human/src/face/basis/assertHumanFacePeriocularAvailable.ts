import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import { HumanFacePeriocularUnavailableError } from "./HumanFacePeriocularUnavailableError";

/**
 * Refuse a document's periocular fields that its basis cannot build.
 *
 * `eyes` needs optical support for both sides; `lashes.upper` and
 * `lashes.lower` need the periocular registration. A present field whose
 * registration is absent refuses with HumanFacePeriocularUnavailableError
 * naming the registration. A present field on a basis that carries its
 * registration still refuses, naming the shape producer that does not exist
 * yet (the optical builder, the lash generator), because no stage turns the
 * field into geometry and an accepted field would be silently ignored.
 * Omitted fields pass untouched, so a document without them builds exactly as
 * before. The registrations are published by the source producer; no asset
 * name stands in for them.
 *
 * @evidence contracts/common.md#principled-implementation Checks the registration each field needs and the shape producer that would consume it, before any geometry is built, so no present field is accepted and ignored.
 * @evidence contracts/common.md#clear-and-simple-design One owner of the field-to-registration and field-to-producer requirement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No asset-name fallback and no silent acceptance of an unconsumed field; omission is untouched.
 * @evidence contracts/common.md#meaningful-documentation States which field needs which registration and producer, and the omission case.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Carries no spatial quantity.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The registration names the parts.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The editor shows the refusal.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admission bounds the values.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Checks availability, not a control.
 */
export function assertHumanFacePeriocularAvailable(
  basis: IAutoMovieHumanFaceBasis,
  document: IAutoMovieHumanFaceBasisDocument,
): void {
  if (document.eyes !== undefined) {
    const owners = new Set(
      (basis.opticalSupport ?? []).map((one) => one.owner),
    );
    if (!owners.has("leftEye") || !owners.has("rightEye"))
      throw new HumanFacePeriocularUnavailableError({
        field: "eyes",
        missing: "opticalSupport",
        basis: basis.id,
      });
    throw new HumanFacePeriocularUnavailableError({
      field: "eyes",
      missing: "opticalBuilder",
      basis: basis.id,
    });
  }
  for (const field of ["lashes.upper", "lashes.lower"] as const)
    if (
      document.lashes?.[field === "lashes.upper" ? "upper" : "lower"] !==
      undefined
    )
      throw new HumanFacePeriocularUnavailableError({
        field,
        missing:
          basis.periocular === undefined ? "periocular" : "lashGenerator",
        basis: basis.id,
      });
}
