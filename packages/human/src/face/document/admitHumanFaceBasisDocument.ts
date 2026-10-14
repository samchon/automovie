import typia from "typia";

import { assertPortraitEyebrowProfile } from "../anatomy/brow/assertPortraitEyebrowProfile";
import { createPortraitIrisMaterials } from "../anatomy/eye/createPortraitIrisMaterials";
import { resolveHumanFaceOpticalProfile } from "../anatomy/eye/resolveHumanFaceOpticalProfile";
import { assertHumanFaceHair } from "../anatomy/hair/assertHumanFaceHair";
import { assertHumanFaceFacialHair } from "../anatomy/hair/assertHumanFaceFacialHair";
import { assertHumanFaceLashPopulation } from "../anatomy/lash/assertHumanFaceLashPopulation";
import { createPortraitColourField } from "../anatomy/skin/createPortraitColourField";
import { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanFacePeriocularTissueSection } from "../structures/IAutoMovieHumanFacePeriocularTissueSection";
import type { IAutoMovieHumanFaceLidSectionDisplacement } from "../structures/IAutoMovieHumanFaceLidSectionDisplacement";
import { assertFinite } from "./assertFinite";

/**
 * Finite scalar admission is shared by loading and saving this flat schema.
 * Exact schema checks precede a complete own-value finite/cycle walk and
 * profile-owner checks, including numbers in optional nested profiles.
 * Compiled channel/source admission and physical/visual model validation are
 * separate later boundaries; the admitted input is returned without cloning.
 *
 * @evidence contracts/common.md#principled-implementation typia exact schema precedes the shared assertFinite own-value walk and hair/pigment/optics/lash/brow checks. The complete admitted document is scanned, including optional oral, relief and phenotype numbers that plain number schema fields do not independently require to be finite. Parser and serializer share this boundary before JSON erases nonfinite values; compiled-basis names/ranges and geometry are not validated here.
 * @evidence contracts/common.md#clear-and-simple-design Current profile owners supply their own rules; this flat boundary keeps asset-dependent source/physical admission with the resolved builder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional profiles stay absent and scalar/paired wet-margin domains are checked without clamping or fixture exemptions. Passing schema does not establish source availability, anatomy or GPU acceptance.
 * @evidence contracts/common.md#meaningful-documentation Prose gives exact schema, finite/profile checks, load/save symmetry, input ownership and later channel/source/model/visual boundaries.
 * @evidence contracts/performance.md#efficient-algorithms Exact schema admission and the finite walk visit complete authored data; the latter expands each own-value occurrence and uses the existing path-ancestor cycle rule. Delegated profile admission follows actual cards/stations/colour populations, including nested repeated scans rather than constant cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Load/save use one admission owner and shared builder profile rules; mutable documents receive fresh admission instead of cached success.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary own-value lists, traversal ancestors and profile products are invocation-owned; original admitted input transfers and no clone, registry, worker or external handle is retained. The existing recursive finite walker has no explicit depth cap.
 *
 * @author Samchon
 */
export function admitHumanFaceBasisDocument(
  input: unknown,
): IAutoMovieHumanFaceBasisDocument {
  const document: IAutoMovieHumanFaceBasisDocument = typia.assertEquals<IAutoMovieHumanFaceBasisDocument>(input);
  assertFinite(document);
  if (document.hair !== undefined && document.hair !== null)
    assertHumanFaceHair(document.hair);
  if (document.facialHair !== undefined && document.facialHair !== null)
    assertHumanFaceFacialHair(document.facialHair);
  for (const fields of Object.values(document.skin ?? {}))
    createPortraitColourField(fields);
  // Iris pigments are refused on load and save by the same endpoint check
  // the builder applies, so an invalid colour never reaches a saved file.
  if (document.iris !== undefined && document.iris !== null)
    for (const pigment of [document.iris.left, document.iris.right])
      createPortraitIrisMaterials("iris", pigment);
  // Optics and lash profiles are refused on load and save by the same
  // containment and envelope checks their builders apply.
  if (document.eyes !== undefined)
    for (const side of [document.eyes.left, document.eyes.right])
      resolveHumanFaceOpticalProfile(side);
  if (document.lashes?.upper !== undefined)
    for (const side of [
      document.lashes.upper.left,
      document.lashes.upper.right,
    ])
      assertHumanFaceLashPopulation(side, "upper");
  if (document.lashes?.lower !== undefined)
    for (const side of [
      document.lashes.lower.left,
      document.lashes.lower.right,
    ])
      assertHumanFaceLashPopulation(side, "lower");
  for (const brow of [document.brows?.left, document.brows?.right])
    if (brow !== undefined)
      assertPortraitEyebrowProfile(brow, brow.strandCount);
  for (const side of [
    document.periocularTissues?.left,
    document.periocularTissues?.right,
  ])
    for (const section of Object.values<IAutoMovieHumanFacePeriocularTissueSection | undefined>(side ?? {}))
      if (
        section !== undefined &&
        ![section.inwardOffsetMm, section.thicknessMm].every(
          (value: number): boolean => Number.isFinite(value) && value > 0,
        )
      )
        throw new Error(
          "Periocular tissue dimensions need positive finite millimetres.",
        );
  for (const side of [document.eyelids?.left, document.eyelids?.right])
    for (const section of Object.values(side ?? {}) as (IAutoMovieHumanFaceLidSectionDisplacement | undefined)[])
      if (
        section !== undefined &&
        ![section.elevationMm, section.projectionMm].every(Number.isFinite)
      )
        throw new Error("Lid section displacements need finite millimetres.");
  for (const shape of [
    document.ocularSurfaces?.left,
    document.ocularSurfaces?.right,
  ])
    if (shape !== undefined) {
      if (
        !(Object.values(shape) as (number | undefined)[])
          .filter((value: number | undefined): value is number => value !== undefined)
          .every((value: number): boolean => Number.isFinite(value) && value >= 0)
      )
        throw new Error(
          "Ocular surface dimensions need nonnegative finite millimetres.",
        );
      if (
        (shape.upperMarginWidth === undefined) !==
        (shape.upperMarginLift === undefined)
      )
        throw new Error(
          "Upper wet-margin width and lift must be supplied together.",
        );
    }
  if (
    [document.id, document.name, document.basis].some((id: string): boolean  => id.trim() === "")
  )
    throw new Error(
      "Facial edits need finite numbers and nonempty identities.",
    );
  return document;
}
