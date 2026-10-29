import type { IEvidenceClaim, IEvidenceReference } from "@wrtnlabs/evidence";

import type { IProductionConfigProps } from "../../IProductionConfigProps";
import type { ProductionStage } from "../../ProductionStage";
import { createNarrativeUnitFiles } from "../../createNarrativeUnitFiles";
import { createSettingReferences } from "../references/createSettingReferences";
import { passRoot } from "../utilities/passRoot";

/**
 * Creates settings dependencies on treatments or compact-short screenplay H2s.
 *
 * Edges stay on the concrete consumers: a narrative H2 cites the canon H2 it
 * depends on, and a canon H2 no selected narrative H2 uses is answered by an
 * exclusion on the narrative H2 whose scope makes it absent.
 *
 * @evidence contracts/common.md#principled-implementation Actual treatment or compact-screenplay H2 consumers cover H2s of every enumerated promoted canon file, selecting its body edition while the scalar construction stage controls the consumer stage; an empty canon returns undefined.
 * @evidence contracts/common.md#clear-and-simple-design Settings coverage lives on the concrete event or compact-scene consumers, separate from structural prerequisite readiness and inherited script/screenplay relations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty reference populations are omitted because there is no canon dependency to cite; pass readiness remains a separate required check rather than being excused by this omission.
 * @evidence contracts/common.md#meaningful-documentation The prose states dependency hosts and truthful scope exclusions, and the nearby comment distinguishes empty coverage from readiness.
 * @evidence contracts/performance.md#efficient-algorithms Settings enumeration and sorting dominate: one reference is allocated per canon file after directory scans, while the consumer selector and claim have fixed size; factory work does not read canon file contents.
 * @evidence contracts/performance.md#reuse-equivalent-work The settings reference builder centralizes both legacy and classified layouts; this call reobserves installed canon paths each config build rather than caching a potentially obsolete file population.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned claim retains one reference per canon file under config ownership; enumeration arrays are transient and synchronous directory operations retain no open descriptor or running task.
 */
export function createSettingCoverageClaim(
  props: IProductionConfigProps,
  layer: "treatments" | "screenplay",
): IEvidenceClaim | undefined {
  const stage: ProductionStage = props.construction[layer];
  const reference: IEvidenceReference[] = createSettingReferences(
    props.location,
    "draft",
  );
  // An empty canon has no settings dependency to cite. Structural prerequisite readiness is
  // checked separately by pass validation; settings always reads the canon in body.
  if (reference.length === 0) return undefined;
  return {
    name: `${layer} H2 consumers cite their settings dependencies`,
    type: "markdown",
    root: passRoot("draft"),
    files: createNarrativeUnitFiles(layer, props.narrativeScope),
    symbol: "h2",
    disabled: stage === "disabled",
    reference,
  };
}
