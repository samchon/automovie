import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "../AuthoredLayer";
import type { IProductionConfigProps } from "../IProductionConfigProps";
import { createDiscoveryClaim } from "./claims/createDiscoveryClaim";
import { createInstructionCoverageClaim } from "./claims/createInstructionCoverageClaim";
import { createLayerClaims } from "./claims/createLayerClaims";
import { createOutlineClaims } from "./claims/createOutlineClaims";
import { createPopulationObligationClaims } from "./claims/createPopulationObligationClaims";
import { createReviewClaims } from "./claims/createReviewClaims";
import { productionLayers } from "./productionLayers";
import { BODY_ROOT } from "./utilities/BODY_ROOT";
import { assertProductionEvidenceSources } from "./utilities/assertProductionEvidenceSources";
import { createEvidenceFiles } from "./utilities/createEvidenceFiles";

/** Composes the complete native narrative and engineering claim array. */
export function collectProductionClaims(
  props: IProductionConfigProps,
): IEvidenceClaim[] {
  assertProductionEvidenceSources(props);

  // The short screenplay realizes the commission using the brief's subject facts.
  const instructions: IEvidenceClaim[] = (
    props.mode === "long"
      ? (["settings", "treatments"] as const)
      : props.mode === "short"
        ? (["screenplay"] as const)
        : []
  ).flatMap(
    (layer: "settings" | "treatments" | "screenplay"): IEvidenceClaim[] => {
      const claim: IEvidenceClaim | undefined = createInstructionCoverageClaim(
        props,
        layer,
      );
      return claim === undefined ? [] : [claim];
    },
  );
  const outline: IEvidenceClaim[] =
    props.mode === "long" ? createOutlineClaims(props) : [];
  const claims: IEvidenceClaim[] = [
    ...productionLayers(props)
      .flatMap((layer: AuthoredLayer): IEvidenceClaim[] => [
        ...createLayerClaims(props, layer),
        ...createPopulationObligationClaims(props, layer),
        createDiscoveryClaim(props, layer),
      ])
      .filter((claim: IEvidenceClaim): boolean =>
        Array.isArray(claim.reference) ? claim.reference.length > 0 : true,
      ),
    ...instructions,
    ...outline,
    ...(props.claims ?? []),
    ...productionLayers(props).flatMap(
      (layer: AuthoredLayer): IEvidenceClaim[] =>
        createReviewClaims(props, layer),
    ),
  ];
  for (const claim of claims) {
    if (
      claim.type === "markdown" &&
      claim.root === BODY_ROOT &&
      claim.evidenceFiles === undefined &&
      (claim.symbol === "file" || claim.symbol === "h2")
    )
      claim.evidenceFiles = createEvidenceFiles(claim.symbol, claim.files);
  }
  return [...claims, ...(props.supportClaims ?? [])];
}
