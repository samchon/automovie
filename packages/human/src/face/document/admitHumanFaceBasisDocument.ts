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

/**
 * Finite scalar admission is shared by loading and saving this flat schema.
 * Exact schema checks precede profile-owner checks and finite scalar scans.
 * Compiled channel/source admission and physical/visual model validation are
 * separate later boundaries; the admitted input is returned without cloning.
 *
 * @evidence contracts/common.md#principled-implementation typia exact schema precedes shared hair/pigment/optics/lash/brow checks and finite dimension/material/channel scans. Parser and serializer share this boundary before JSON erases nonfinite values; compiled-basis names/ranges and geometry are not validated here.
 * @evidence contracts/common.md#clear-and-simple-design Current profile owners supply their own rules; this flat boundary keeps asset-dependent source/physical admission with the resolved builder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional profiles stay absent and scalar/paired wet-margin domains are checked without clamping or fixture exemptions. Passing schema does not establish source availability, anatomy or GPU acceptance.
 * @evidence contracts/common.md#meaningful-documentation Prose gives exact schema, finite/profile checks, load/save symmetry, input ownership and later channel/source/model/visual boundaries.
 * @evidence contracts/performance.md#efficient-algorithms Schema/finite scans follow all authored fields; delegated profile admission follows actual cards/stations/colour populations, including nested repeated scans rather than constant cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Load/save use one admission owner and shared builder profile rules; mutable documents receive fresh admission instead of cached success.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary field lists/profile products are local; original admitted input transfers and no clone, registry, worker or external handle is retained.
 *
 * @author Samchon
 */
export function admitHumanFaceBasisDocument(
  input: unknown,
): IAutoMovieHumanFaceBasisDocument {
  const document: IAutoMovieHumanFaceBasisDocument = typia.assertEquals<IAutoMovieHumanFaceBasisDocument>(input);
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
  const values: number[] = [
    ...Object.values(document.shape),
    ...Object.values(document.expression),
  ];
  for (const material of Object.values(document.materials ?? {})) {
    values.push(...Object.values(material.color ?? {}));
    if (material.roughness !== undefined) values.push(material.roughness);
    values.push(...(material.pigment ?? []));
    if (material.density !== undefined) values.push(material.density);
  }
  if (
    !values.every(Number.isFinite) ||
    [document.id, document.name, document.basis].some((id: string): boolean  => id.trim() === "")
  )
    throw new Error(
      "Facial edits need finite numbers and nonempty identities.",
    );
  return document;
}
