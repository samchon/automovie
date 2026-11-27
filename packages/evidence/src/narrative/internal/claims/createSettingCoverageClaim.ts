import type { IEvidenceClaim, IEvidenceReference } from "@wrtnlabs/evidence";

import type { IProductionConfigProps } from "../../IProductionConfigProps";
import type { AutoMovieEvidenceProductionStage } from "../../AutoMovieEvidenceProductionStage";
import { createNarrativeUnitFiles } from "../createNarrativeUnitFiles";
import { constructionStage } from "../constructionStage";
import { createSettingReferences } from "../references/createSettingReferences";
import { BODY_ROOT } from "../utilities/BODY_ROOT";

/*
 * Connects treatment H2s to settings, or short screenplay H2s to the brief.
 *
 * Edges stay on the concrete consumers: a narrative H2 cites the canon H2 it
 * depends on, and a canon H2 no selected narrative H2 uses is answered by an
 * exclusion on the narrative H2 whose scope makes it absent.
 */
export function createSettingCoverageClaim(
  props: IProductionConfigProps,
  layer: "treatments" | "screenplay",
  canon: "settings" | "brief" = "settings",
): IEvidenceClaim | undefined {
  const stage: AutoMovieEvidenceProductionStage = constructionStage(props, layer);
  const reference: IEvidenceReference[] = createSettingReferences(
    props.location,
    canon,
  );
  // An empty canon has no dependency to cite.
  if (reference.length === 0) return undefined;
  return {
    name: `${layer} H2 consumers cite their ${canon} dependencies`,
    type: "markdown",
    root: BODY_ROOT,
    files: createNarrativeUnitFiles({ layer, scope: props.narrativeScope }),
    symbol: "h2",
    disabled: stage === "disabled",
    reference,
  };
}
