import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "../AuthoredLayer";
import type { IProductionConfigProps } from "../IProductionConfigProps";
import { createDiscoveryClaim } from "./claims/createDiscoveryClaim";
import { createExpressionObligationClaims } from "./claims/createExpressionObligationClaims";
import { createInstructionCoverageClaim } from "./claims/createInstructionCoverageClaim";
import { createLayerClaims } from "./claims/createLayerClaims";
import { createOutlineClaims } from "./claims/createOutlineClaims";
import { createPopulationObligationClaims } from "./claims/createPopulationObligationClaims";
import { createReviewClaims } from "./claims/createReviewClaims";
import { ownClaim } from "./ownClaim";
import { ownClaims } from "./ownClaims";
import { productionLayers } from "./productionLayers";
import { assertProductionEvidenceSources } from "./utilities/assertProductionEvidenceSources";

/** Builds the full claim array once and records each family's factory owner. */
export function collectProductionClaims(
  props: IProductionConfigProps,
): IEvidenceClaim[] {
  assertProductionEvidenceSources(props);
  const settings: {
    readonly layer: "settings";
    readonly pass: "construction";
    readonly kind: "generated";
  } = { layer: "settings", pass: "construction", kind: "generated" } as const;
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
      return claim === undefined
        ? []
        : [ownClaim(claim, { layer, pass: "construction", kind: "generated" })];
    },
  );
  const outline: IEvidenceClaim[] =
    props.mode === "long"
      ? ownClaims(createOutlineClaims(props), settings)
      : [];
  return [
    ...productionLayers(props)
      .flatMap((layer: AuthoredLayer): IEvidenceClaim[] => [
        ...createLayerClaims(props, layer),
        ...ownClaims(createPopulationObligationClaims(props, layer), {
          layer,
          pass: "construction",
          kind: "generated",
        }),
        ...ownClaims(createExpressionObligationClaims(props, layer), {
          layer,
          pass: "naturalness",
          kind: "generated",
        }),
        ownClaim(createDiscoveryClaim(props, layer), {
          layer,
          pass: "construction",
          kind: "generated",
        }),
      ])
      .filter((claim: IEvidenceClaim): boolean =>
        Array.isArray(claim.reference) ? claim.reference.length > 0 : true,
      ),
    ...instructions,
    ...outline,
    ...(props.claims ?? []),
    ...ownClaims(props.supportClaims ?? [], {
      layer: "settings",
      pass: "construction",
      kind: "support",
    }),
    ...productionLayers(props).flatMap(
      (layer: AuthoredLayer): IEvidenceClaim[] =>
        createReviewClaims(props, layer),
    ),
  ];
}
