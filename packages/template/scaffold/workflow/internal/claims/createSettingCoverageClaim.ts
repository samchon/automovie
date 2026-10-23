import type { IEvidenceClaim, IEvidenceReference } from "@wrtnlabs/evidence";

import type { IProductionConfigProps } from "../../IProductionConfigProps";
import type { ProductionConstructionStageMixin } from "../../ProductionConstructionStageMixin";
import { createNarrativeUnitFiles } from "../../createNarrativeUnitFiles";
import { createSettingReferences } from "../references/createSettingReferences";
import { passRoot } from "../utilities/passRoot";
import { resolveConstruction } from "../utilities/resolveConstruction";

/**
 * Creates the settings dependency claim over treatment H2s.
 *
 * Edges stay on the concrete consumers: a narrative H2 cites the canon H2 it
 * depends on, and a canon H2 no selected narrative H2 uses is answered by an
 * exclusion on the narrative H2 whose scope makes it absent.
 */
export function createSettingCoverageClaim(
  props: IProductionConfigProps,
  layer: "treatments",
): IEvidenceClaim | undefined {
  const [stage, final]: ProductionConstructionStageMixin = resolveConstruction(
    props.construction[layer],
  );
  const reference: IEvidenceReference[] = createSettingReferences(
    props.location,
    final ? "final" : "draft",
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
