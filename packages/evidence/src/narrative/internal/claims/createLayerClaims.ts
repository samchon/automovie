import type { IEvidenceClaim, IEvidenceReference } from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "../../AuthoredLayer";
import type { IProductionConfigProps } from "../../IProductionConfigProps";
import type { ProductionStage } from "../../ProductionStage";
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
 * Script construction also answers the expression questions, because scripts
 * settle their own language and no later pass revises it.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Construction H2 claims and file inheritance use native reference flags for per-unit checklists, treatment coverage and exact script-scene lineage, where each screenplay scene file cites the one script scene H2 it realizes; scripts construction also selects its expression family.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One layer factory centralizes stage/root/parent choices, while population obligations, discovery and review remain separate factories with their distinct respondents.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Short screenplay cites its actual brief without invented treatment or script parents; canon has no inherited file claim, and only scripts construction selects the expression questions.
 * @evidence contracts/development/common.md#meaningful-documentation The prose distinguishes unit/population duties, layer-specific parents, the scene-file lineage and scripts expression; nearby comments explain topology capture.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fixed number of claims and reference families are constructed per layer; helper existence probes dominate most layers, while treatments and short screenplay also enumerate canon files for coverage, whose scans and sorting scale with the installed canon.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Unit/topology selectors, parent-reference builders and scalar stages are reused within the construction; each build refreshes filesystem-dependent contract/canon observations instead of retaining stale config results.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned native claims own their layer-family objects and any canon-derived references; synchronous discovery leaves no filesystem handle or background task open.
 */
export function createLayerClaims(
  props: IProductionConfigProps,
  layer: AuthoredLayer,
): IEvidenceClaim[] {
  const stage: ProductionStage = constructionStage(props, layer);
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

  const parents: (symbol: "file" | "h2") => IEvidenceReference[] = (
    symbol: "file" | "h2",
  ): IEvidenceReference[] =>
    props.mode !== "long"
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

  // Script expression must remain repairable in the same construction body.
  const expression: IEvidenceReference[] =
    layer === "scripts"
      ? [
          ...createPrincipleReferences({
            contracts: props,
            layer,
            family: "naturalness",
          }),
          ...createLanguagePrincipleReferences({
            location: props.location,
            layer,
            family: "naturalness",
          }),
        ]
      : [];

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
        family: "principles",
      }),
      ...createLanguagePrincipleReferences({
        location: props.location,
        layer,
        family: "principles",
      }),
      ...(isCanonLayer(layer) ? [] : [createUpstreamReference(props, layer)]),
      ...expression,
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
