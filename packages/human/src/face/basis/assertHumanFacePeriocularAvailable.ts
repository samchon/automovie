import type { AutoMovieHumanFacePeriocularTissue as AutoMovieHumanFacePeriocularTissueImported } from "../structures/AutoMovieHumanFacePeriocularTissue";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanFaceBrowPopulation as IAutoMovieHumanFaceBrowPopulationImported } from "../structures/IAutoMovieHumanFaceBrowPopulation";
import type { IAutoMovieHumanFaceLidSections as IAutoMovieHumanFaceLidSectionsImported } from "../structures/IAutoMovieHumanFaceLidSections";
import type { IAutoMovieHumanFaceOcularSurfaceShape as IAutoMovieHumanFaceOcularSurfaceShapeImported } from "../structures/IAutoMovieHumanFaceOcularSurfaceShape";
import type { IAutoMovieHumanFaceOpticalSupport as IAutoMovieHumanFaceOpticalSupportImported } from "../structures/IAutoMovieHumanFaceOpticalSupport";
import type { IAutoMovieHumanFacePeriocularSide as IAutoMovieHumanFacePeriocularSideImported } from "../structures/IAutoMovieHumanFacePeriocularSide";
import type { IAutoMovieHumanFacePeriocularTissueSection as IAutoMovieHumanFacePeriocularTissueSectionImported } from "../structures/IAutoMovieHumanFacePeriocularTissueSection";
import { HumanFacePeriocularUnavailableError } from "./HumanFacePeriocularUnavailableError";

/**
 * Refuse a document's periocular fields that its basis cannot build.
 *
 * `eyes` needs optical support for both sides; `lashes.upper` and
 * `lashes.lower` need the periocular registration and its anterior lash roots.
 * A present field whose registration is absent refuses with
 * HumanFacePeriocularUnavailableError naming the registration. Complete
 * registrations reach the actual independent optical and lash producers;
 * geometry/profile/contact admission remains with those owners.
 * Omitted fields pass untouched, so a document without them builds exactly as
 * before. The registrations are published by the source producer; no asset
 * name stands in for them.
 *
 * @evidence contracts/common.md#principled-implementation Requested optical, lash, lid, tissue, brow and ocular-surface fields require their actual publisher registrations/contact population; omitted or all-undefined side profiles remain unrequested.
 * @evidence contracts/common.md#clear-and-simple-design One capability gate names absent registrations with HumanFacePeriocularUnavailableError before invoking the existing geometry producers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Asset names never substitute for producer support; presence checks do not certify registration geometry/profile/contact, which remain actual producer admissions.
 * @evidence contracts/common.md#meaningful-documentation Prose gives field-to-registration dependencies, omission and typed refusal; the same gate also requires cage/brow-band/canthal support for their requested side populations.
 * @evidence contracts/performance.md#efficient-algorithms Optical owners are scanned once, then the fixed field/side vocabulary performs bounded registration checks and scans each optional profile's supplied members, without mesh allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work One optical-owner Set serves both eye requirements; no effectful capability result is cached across changed documents or source registrations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only local owner/member checks are retained during admission; failures preserve inputs and throw their small diagnostic without a global resource.
 */
export function assertHumanFacePeriocularAvailable(
  basis: IAutoMovieHumanFaceBasis,
  document: IAutoMovieHumanFaceBasisDocument,
): void {
  if (document.eyes !== undefined) {
    const owners: Set<"leftEye" | "rightEye"> = new Set(
      (basis.opticalSupport ?? []).map(
        (
          one: IAutoMovieHumanFaceOpticalSupportImported,
        ): "leftEye" | "rightEye" => one.owner,
      ),
    );
    if (!owners.has("leftEye") || !owners.has("rightEye"))
      throw new HumanFacePeriocularUnavailableError({
        field: "eyes",
        missing: "opticalSupport",
        basis: basis.id,
      });
  }
  for (const field of ["lashes.upper", "lashes.lower"] as const)
    if (
      document.lashes?.[field === "lashes.upper" ? "upper" : "lower"] !==
      undefined
    ) {
      if (basis.periocular === undefined)
        throw new HumanFacePeriocularUnavailableError({
          field,
          missing: "periocular",
          basis: basis.id,
        });
      if (
        ["left", "right"].some(
          (side: string): boolean =>
            basis.periocular![side as "left" | "right"].margins.lashRoots ===
            undefined,
        )
      )
        throw new HumanFacePeriocularUnavailableError({
          field,
          missing: "lashRoots",
          basis: basis.id,
        });
    }
  for (const field of [
    "eyelids",
    "periocularTissues",
    "brows",
    "ocularSurfaces",
  ] as const)
    for (const side of ["left", "right"] as const) {
      const profile:
        | IAutoMovieHumanFaceLidSectionsImported
        | Partial<
            Record<
              AutoMovieHumanFacePeriocularTissueImported,
              IAutoMovieHumanFacePeriocularTissueSectionImported
            >
          >
        | IAutoMovieHumanFaceBrowPopulationImported
        | IAutoMovieHumanFaceOcularSurfaceShapeImported
        | undefined = document[field]?.[side];
      if (
        profile === undefined ||
        Object.values(profile).every(
          (value: unknown): boolean => value === undefined,
        )
      )
        continue;
      if (
        (field === "periocularTissues" || field === "ocularSurfaces") &&
        basis.contact === undefined
      )
        throw new Error(
          "Requested " + field + " needs its declared source contact geometry.",
        );
      const registration:
        | IAutoMovieHumanFacePeriocularSideImported
        | undefined = basis.periocular?.[side];
      if (registration === undefined)
        throw new HumanFacePeriocularUnavailableError({
          field,
          missing: "periocular",
          basis: basis.id,
        });
      if (
        field === "brows"
          ? registration.browBand === undefined
          : registration.cage === undefined
      )
        throw new HumanFacePeriocularUnavailableError({
          field,
          missing: field === "brows" ? "browBand" : "cage",
          basis: basis.id,
        });
      if (
        field === "ocularSurfaces" &&
        registration.cage?.canthalSupport === undefined
      )
        throw new HumanFacePeriocularUnavailableError({
          field,
          missing: "canthalSupport",
          basis: basis.id,
        });
    }
}
