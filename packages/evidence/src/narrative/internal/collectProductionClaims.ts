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
import { productionLayers } from "./productionLayers";
import { assertProductionEvidenceSources } from "./utilities/assertProductionEvidenceSources";
import { createEvidenceFiles } from "./utilities/createEvidenceFiles";

/**
 * Composes the complete native narrative and engineering claim array.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Validated routes expand the existing checklist, coverage, discovery, instruction, outline and review families; body file/H2 hosts receive detached construction selectors before engineering support is appended.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One collector serves the public claim and config factories; family helpers own their respondents and native relationship settings.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only generated claims with empty reference arrays are omitted because they have no target population; native diagnostics are never filtered here.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states family composition and detached evidence ownership; callers evaluate the returned native graph.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most four layer expansions discover current contracts; claim filtering and detached selector mapping are linear in emitted claims and selector text, plus discovery cost.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each family is built once per graph; live contract and review discovery is refreshed for every configuration build.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned graph owns its arrays and caller-provided claims; all discovery is synchronous with no retained registry, handle or task.
 */
export function collectProductionClaims(
  props: IProductionConfigProps,
): IEvidenceClaim[] {
  assertProductionEvidenceSources(props);
  const instructions: IEvidenceClaim[] = (
    props.mode === "long"
      ? (["settings", "treatments"] as const)
      : props.mode === "short"
        ? (["brief", "screenplay"] as const)
        : []
  ).flatMap(
    (
      layer: "settings" | "brief" | "treatments" | "screenplay",
    ): IEvidenceClaim[] => {
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
        ...createExpressionObligationClaims(props, layer),
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
      claim.root === "docs/body" &&
      claim.evidenceFiles === undefined &&
      (claim.symbol === "file" || claim.symbol === "h2")
    )
      claim.evidenceFiles = createEvidenceFiles(claim.symbol, claim.files);
  }
  return [...claims, ...(props.supportClaims ?? [])];
}
