import type { IEvidenceClaim, IEvidenceReference } from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "../../AuthoredLayer";
import type { IProductionConfigProps } from "../../IProductionConfigProps";
import type { AutoMovieEvidenceProductionStage } from "../../AutoMovieEvidenceProductionStage";
import { createNarrativeUnitFiles } from "../../createNarrativeUnitFiles";
import { constructionStage } from "../constructionStage";
import { isCanonLayer } from "../isCanonLayer";
import { createCoverageReference } from "../references/createCoverageReference";
import { createLanguagePrincipleReferences } from "../references/createLanguagePrincipleReferences";
import { createLineageReference } from "../references/createLineageReference";
import { createPrincipleReferences } from "../references/createPrincipleReferences";
import { createUpstreamReference } from "../references/createUpstreamReference";
import { createTopologyFiles } from "../topology/createTopologyFiles";
import { BODY_ROOT } from "../utilities/BODY_ROOT";
import { createUnitFiles } from "../utilities/createUnitFiles";
import { createSettingCoverageClaim } from "./createSettingCoverageClaim";

/**
 * Creates the shared claims for one authored layer.
 *
 * Unit H2s answer only questions each can establish from its own body. The
 * population obligation claims own every whole-layer comparison at file level,
 * while the file claim carries relationships an authored file holds with
 * surrounding layers.
 *
 * What differs between layers is which parents exist. Canon, settings or a
 * short's brief, inherits nothing, so it has no construction file claim.
 * Treatments account for settings, and a short's screenplay for its brief.
 * Scripts realize the treatments they divide. A long screenplay keeps the
 * script partition: each screenplay scene file realizes exactly one script
 * scene H2, so a script episode file becomes the screenplay episode folder of
 * its scene files.
 *
 * Script scenes establish choices and draft exchanges. Final expression is
 * assessed in the screenplay construction checklist.
 */
export function createLayerClaims(
  props: IProductionConfigProps,
  layer: AuthoredLayer,
): IEvidenceClaim[] {
  const stage: AutoMovieEvidenceProductionStage = constructionStage(props, layer);
  const disabled: boolean = stage === "disabled";
  const files: string[] = createUnitFiles(layer, props.narrativeScope);

  // Indexes and invalid paths must enter the same snapshot as the authored H2s.
  const topology: string[] = isCanonLayer(layer)
    ? files
    : createTopologyFiles(layer, props.narrativeScope);

  const treatments: string[] = createNarrativeUnitFiles({
    layer: "treatments",
    scope: props.narrativeScope,
  });
  const scripts: string[] = createNarrativeUnitFiles({
    layer: "scripts",
    scope: props.narrativeScope,
  });

  function parents(symbol: "file" | "h2"): IEvidenceReference[] {
    return props.mode !== "long"
      ? []
      : [
          // A screenplay scene file realizes one script scene, an H2 of its
          // episode file; its sections have no one-to-one script parent.
          ...(layer === "screenplay" && symbol === "file"
            ? [createLineageReference(scripts, "h2")]
            : []),
          ...(layer === "scripts" || layer === "screenplay"
            ? [createCoverageReference(treatments, symbol)]
            : []),
        ];
  }

  const inherits: string = isCanonLayer(layer)
    ? ""
    : ", and account for the layers they inherit";
  const unit: IEvidenceClaim = {
    name: `${layer} H2 units answer their principle checklists${inherits}`,
    type: "markdown",
    root: BODY_ROOT,
    files: topology,
    symbol: "h2",
    disabled,
    reference: [
      ...createPrincipleReferences({
        contracts: props,
        layer,
      }),
      ...createLanguagePrincipleReferences({
        location: props.location,
        layer,
      }),
      ...(isCanonLayer(layer) ? [] : [createUpstreamReference(props, layer)]),
      ...parents("h2"),
    ],
  };
  if (isCanonLayer(layer)) return [unit];

  const coverage: IEvidenceClaim | undefined =
    layer === "treatments"
      ? createSettingCoverageClaim(props, layer)
      : layer === "screenplay" && props.mode === "short"
        ? createSettingCoverageClaim(props, layer, "brief")
        : undefined;
  return [
    {
      name: `${layer} unit files account for the layers they inherit`,
      type: "markdown",
      root: BODY_ROOT,
      files,
      symbol: "file",
      disabled,
      reference: parents("file"),
    },
    unit,
    ...(coverage === undefined ? [] : [coverage]),
  ];
}
