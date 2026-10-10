import { humanFaceBasisWeights } from "@automovie/human/face/basis/humanFaceBasisWeights";
import { prepareHumanFaceReference } from "@automovie/human/face/basis/prepareHumanFaceReference";
import crypto from "node:crypto";

import { compileHumanSourceNativeRegistration } from "./compileHumanSourceNativeRegistration.ts";
import { extendHumanSourceBrowMaterialSupport } from "./extendHumanSourceBrowMaterialSupport.ts";
import { extendHumanSourcePeriocularAttachmentCharts } from "./extendHumanSourcePeriocularAttachmentCharts.ts";
import { prepareHumanSourceBootstrapMaterialReference } from "./prepareHumanSourceBootstrapMaterialReference.ts";
import { readHumanSourceProtectedHairDomains } from "./readHumanSourceProtectedHairDomains.ts";
import { registerHumanSourceFacialHairDomains } from "./registerHumanSourceFacialHairDomains.ts";
import type { IHumanSourceAttachmentRegistration } from "./structures/IHumanSourceAttachmentRegistration.ts";
import type { IHumanSourceAttachmentRegistrationInput } from "./structures/IHumanSourceAttachmentRegistrationInput.ts";

/**
 * Register complete native attachments on the final consumer-frame source.
 * The same production owner serves full generation and standalone preparation:
 * native terminal territories and disks first, then the exact numerical
 * reference, finite brow support
 * under both bootstrap and explicit profiles, and every registered tarsal arc.
 *
 * The existing exterior and host triangle incidence determine continuation
 * paths and the necessary disk extent. No request, source position, target,
 * extent or admission tolerance changes. Unsupported source topology refuses
 * before publication. These observations qualify the stated reference only;
 * clinical anatomy, other configurations and rendered acceptance are separate.
 */
export function compileHumanSourceAttachmentRegistration(
  input: IHumanSourceAttachmentRegistrationInput,
): IHumanSourceAttachmentRegistration {
  const { basis, document } = input;
  const sha = (value: string): string =>
    crypto.createHash("sha256").update(value).digest("hex");
  const geometryIdentity = (): string => sha(JSON.stringify(
    basis.surfaces.map((surface) => ({
      ...surface,
      materialCharts: undefined,
      hairDomains: readHumanSourceProtectedHairDomains(surface),
    })),
  ));
  const originalGeometry = geometryIdentity();
  const numericalContext = JSON.stringify(document);
  const coverage: IHumanSourceAttachmentRegistration["coverage"] = {};
  const facialHair = registerHumanSourceFacialHairDomains(basis);
  const counts = compileHumanSourceNativeRegistration(basis);
  console.log("[human-source] native medial patches complete", JSON.stringify(counts));
  console.log("[human-source] numerical reference preparation begins");
  const prepared = prepareHumanFaceReference({
    basis,
    state: humanFaceBasisWeights(basis, document),
    geometry: document,
  });
  const reference = prepared.complete();
  if (reference === undefined || prepared.optics === undefined)
    throw new Error("Source continuation requires the actual numerical document's prepared reference and independent optics.");
  console.log("[human-source] numerical reference preparation complete");
  Object.assign(counts, extendHumanSourceBrowMaterialSupport({
    basis,
    references: [
      prepareHumanSourceBootstrapMaterialReference(basis),
      { document, positions: reference },
    ],
  }));
  console.log("[human-source] finite brow guide support complete", JSON.stringify(counts));
  for (const side of ["left", "right"] as const) {
    const cage = basis.periocular?.[side]?.cage;
    if (cage === undefined) continue;
    const host = basis.surfaces.find((surface) => surface.id === cage.surface);
    if (host?.sourcePartition === undefined || host.sourcePartition.generation !== cage.generation)
      throw new Error("Attachment chart requires same-generation actual host samples.");
    const exterior = prepared.optics.find((eye) => eye.side === side)?.exterior.rest;
    const positions = reference.get(cage.surface);
    if (exterior === undefined || positions === undefined)
      throw new Error("Source support lacks its actual reference exterior or skin.");
    const expanded = extendHumanSourcePeriocularAttachmentCharts({ host, cage, reference: positions, exterior });
    cage.attachmentCharts = expanded.charts;
    coverage[side] = expanded.coverage;
    counts[`${side}:outerDualDepth`] = expanded.outerDualDepth;
    for (const lid of ["upper", "lower"] as const) {
      counts[`${side}:${lid}:vertices`] = expanded.charts[lid].vertices.length;
      counts[`${side}:${lid}:triangles`] = expanded.charts[lid].sourceTriangles.length;
    }
  }
  if (Object.keys(counts).length === 0)
    throw new Error("Source face has no material attachment cage.");
  if (geometryIdentity() !== originalGeometry)
    throw new Error("Attachment preparation changed original geometry or source field values.");
  if (JSON.stringify(document) !== numericalContext)
    throw new Error("Attachment preparation changed its numerical context.");
  return {
    counts,
    coverage,
    preservedSourceGeometrySha256: originalGeometry,
    numericalContextSha256: sha(numericalContext),
    facialHair,
  };
}
