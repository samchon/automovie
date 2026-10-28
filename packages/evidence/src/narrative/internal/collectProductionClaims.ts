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
import { hasNaturalness } from "./hasNaturalness";
import { ownClaim } from "./ownClaim";
import { ownClaims } from "./ownClaims";
import { productionLayers } from "./productionLayers";
import { assertProductionEvidenceSources } from "./utilities/assertProductionEvidenceSources";

/**
 * Builds the full claim array once and records each family's factory owner.
 *
 * @evidence contracts/common.md#principled-implementation Validated props expand into ordered layer, population, expression, discovery, instruction, outline, custom, support and review families; generated claim objects receive factory ownership at their creation boundary.
 * @evidence contracts/common.md#clear-and-simple-design The collector is the single composition owner used by raw claim and config factories; each family retains its separate evidence responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only claims with an empty reference array are dropped because they have no target population; route-specific instructions and outline follow actual long/short/asset ownership rather than consumer exceptions.
 * @evidence contracts/common.md#meaningful-documentation The comment states full claim-array construction and ownership registration; family helpers document their host and target semantics.
 * @evidence contracts/performance.md#efficient-algorithms At most four layer expansions run, with filesystem contract discovery and emitted claims/references determining cost; custom/support array copies and the empty-reference filter are linear in their populations. Work and allocations scale with discovered document paths and output graph size.
 * @evidence contracts/performance.md#reuse-equivalent-work Claim-family results are reused within the one returned graph, while each build rediscovers current work/language contracts; no unchanged-path assumption permits caching mutable filesystem discovery across builds.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned graph owns claim/reference arrays and caller-provided custom/support objects; ownership maps are weakly keyed by claim objects, so they do not prolong their lifetime or retain open filesystem handles.
 */
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
          pass: hasNaturalness(layer) ? "naturalness" : "construction",
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
