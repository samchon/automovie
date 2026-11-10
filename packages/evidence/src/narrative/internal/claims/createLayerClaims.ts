import type { IEvidenceClaim, IEvidenceReference } from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "../../AuthoredLayer";
import type { IProductionConfigProps } from "../../IProductionConfigProps";
import type { ProductionStage } from "../../ProductionStage";
import { createNarrativeUnitFiles } from "../../createNarrativeUnitFiles";
import { constructionStage } from "../constructionStage";
import { hasNaturalness } from "../hasNaturalness";
import { isCanonLayer } from "../isCanonLayer";
import { createCoverageReference } from "../references/createCoverageReference";
import { createLanguagePrincipleReferences } from "../references/createLanguagePrincipleReferences";
import { createLineageReference } from "../references/createLineageReference";
import { createPrincipleReferences } from "../references/createPrincipleReferences";
import { createUpstreamReference } from "../references/createUpstreamReference";
import { createTopologyFiles } from "../topology/createTopologyFiles";
import { createUnitFiles } from "../utilities/createUnitFiles";
import { passRoot } from "../utilities/passRoot";
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
 * Scripts realize the treatments they divide, and screenplay additionally preserves
 * the script partition exactly.
 *
 * Construction hosts body; screenplay naturalness hosts working text against
 * frozen construction. Script construction also answers expression questions,
 * because a frozen content-preserving revision cannot repair content-shaped
 * speech defects where those questions find them.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Construction H2 claims, file inheritance and independent naturalness claims use native reference flags for per-unit checklists, treatment coverage and exact script/frozen lineage; naturalness hosts the working tree and targets its frozen construction.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One layer factory centralizes stage/root/parent choices, while population obligations, discovery and review remain separate factories with their distinct respondents.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Short screenplay cites its actual brief and compact short its actual settings without invented treatment or script parents; canon has no inherited file claim, and only screenplay receives separate naturalness claims, while scripts construction selects its expression questions.
 * @evidence contracts/development/common.md#meaningful-documentation The prose distinguishes unit/population duties, layer-specific parents and body versus working hosts; nearby comments explain topology capture and frozen-reference ownership.
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
  const topology: string[] =
    isCanonLayer(layer)
      ? files
      : createTopologyFiles(layer, props.narrativeScope);

  const treatments: string[] = createNarrativeUnitFiles(
    "treatments",
    props.narrativeScope,
  );
  const scripts: string[] = createNarrativeUnitFiles(
    "scripts",
    props.narrativeScope,
  );

  const parents: (symbol: "file" | "h2") => IEvidenceReference[] = (
    symbol: "file" | "h2",
  ): IEvidenceReference[] =>
    props.mode !== "long"
      ? []
      : [
          ...(layer === "screenplay"
            ? [createLineageReference(scripts, symbol, "draft")]
            : []),
          ...(layer === "scripts" || layer === "screenplay"
            ? [createCoverageReference(treatments, symbol, "draft")]
            : []),
        ];

  const naturalness: IEvidenceReference[] = [
    ...createPrincipleReferences({
      contracts: props,
      layer,
      gate: "naturalness",
    }),
    ...createLanguagePrincipleReferences({
      location: props.location,
      layer,
      gate: "naturalness",
    }),
  ];

  // Script expression must remain repairable in the same construction body.
  const expression: IEvidenceReference[] =
    layer === "scripts" ? naturalness : [];

  const inherits: string =
    isCanonLayer(layer) ? "" : ", and account for the layers they inherit";
  const unit: IEvidenceClaim = {
    name: `${layer} H2 units answer their principle checklists${inherits}`,
    type: "markdown",
    root: passRoot("draft"),
    files: topology,
    symbol: "h2",
    disabled,
    reference: [
      ...createPrincipleReferences({
        contracts: props,
        layer,
        gate: "layer",
      }),
      ...createLanguagePrincipleReferences({
        location: props.location,
        layer,
        gate: "layer",
      }),
      ...(isCanonLayer(layer) ? [] : [createUpstreamReference(props, layer)]),
      ...expression,
      ...parents("h2"),
    ],
  };

  // The revision snapshot is a reference, not another authored edition.
  const second: ProductionStage = hasNaturalness(layer)
    ? props.naturalness.screenplay
    : "disabled";
  const surface: IEvidenceClaim[] = hasNaturalness(layer)
    ? [
        {
          name: `${layer} final files preserve their draft lineage for naturalness`,
          type: "markdown",
          root: passRoot("final"),
          files,
          symbol: "file",
          disabled: second === "disabled",
          reference: [createLineageReference(files, "file", "revision")],
        },
        {
          name: `${layer} final H2 units answer their naturalness checklists`,
          type: "markdown",
          root: passRoot("final"),
          files: topology,
          symbol: "h2",
          disabled: second === "disabled",
          reference: [
            createLineageReference(topology, "h2", "revision"),
            ...naturalness,
          ],
        },
      ]
    : [];
  if (isCanonLayer(layer)) return [unit, ...surface];

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
      root: passRoot("draft"),
      files,
      symbol: "file",
      disabled,
      reference: parents("file"),
    },
    unit,
    ...surface,
    ...(coverage === undefined ? [] : [coverage]),
  ];
}
