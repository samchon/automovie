import type { IEvidenceClaim, IEvidenceReference } from "@wrtnlabs/evidence";

import type { IProductionConfigProps } from "../../IProductionConfigProps";
import type { ProductionStage } from "../../ProductionStage";
import { createNarrativeUnitFiles } from "../../createNarrativeUnitFiles";
import { constructionStage } from "../constructionStage";
import { createSettingReferences } from "../references/createSettingReferences";
import { passRoot } from "../utilities/passRoot";

/**
 * Creates canon dependencies on treatments or short screenplay H2s: settings for treatments and compact shorts, the brief for shorts.
 *
 * Edges stay on the concrete consumers: a narrative H2 cites the canon H2 it
 * depends on, and a canon H2 no selected narrative H2 uses is answered by an
 * exclusion on the narrative H2 whose scope makes it absent.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Actual treatment or short-screenplay H2 consumers cover H2s of every enumerated promoted canon file, settings or brief as `canon` names, selecting its body edition while the scalar construction stage controls the consumer stage; an empty canon returns undefined.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Canon coverage lives on the concrete event or short-scene consumers, separate from structural prerequisite readiness and inherited script/screenplay relations.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Empty reference populations are omitted because there is no canon dependency to cite; pass readiness remains a separate required check rather than being excused by this omission.
 * @evidence contracts/development/common.md#meaningful-documentation The prose states which canon each consumer cites, dependency hosts and truthful scope exclusions, and the nearby comment distinguishes empty coverage from readiness.
 * @evidence contracts/development/implementation.md#efficient-algorithms Canon enumeration and sorting dominate: one reference is allocated per canon file after directory scans, while the consumer selector and claim have fixed size; factory work does not read canon file contents.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The canon reference builder centralizes every supported layout; this call reobserves installed canon paths each config build rather than caching a potentially obsolete file population.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned claim retains one reference per canon file under config ownership; enumeration arrays are transient and synchronous directory operations retain no open descriptor or running task.
 */
export function createSettingCoverageClaim(
  props: IProductionConfigProps,
  layer: "treatments" | "screenplay",
  canon: "settings" | "brief" = "settings",
): IEvidenceClaim | undefined {
  const stage: ProductionStage = constructionStage(props, layer);
  const reference: IEvidenceReference[] = createSettingReferences(
    props.location,
    "draft",
    canon,
  );
  // An empty canon has no dependency to cite. Structural prerequisite readiness is
  // checked separately by pass validation; canon is always read in body.
  if (reference.length === 0) return undefined;
  return {
    name: `${layer} H2 consumers cite their ${canon} dependencies`,
    type: "markdown",
    root: passRoot("draft"),
    files: createNarrativeUnitFiles(layer, props.narrativeScope),
    symbol: "h2",
    disabled: stage === "disabled",
    reference,
  };
}
