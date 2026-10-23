import type { IEvidenceClaim, IEvidenceReference } from "@wrtnlabs/evidence";

import type { AuthoredLayer } from "../../AuthoredLayer";
import type { IProductionConfigProps } from "../../IProductionConfigProps";
import type { ProductionConstructionStageMixin } from "../../ProductionConstructionStageMixin";
import type { ProductionStage } from "../../ProductionStage";
import { createNarrativeUnitFiles } from "../../createNarrativeUnitFiles";
import { hasNaturalness } from "../hasNaturalness";
import { ownClaim } from "../ownClaim";
import { createCoverageReference } from "../references/createCoverageReference";
import { createLanguagePrincipleReferences } from "../references/createLanguagePrincipleReferences";
import { createLineageReference } from "../references/createLineageReference";
import { createPrincipleReferences } from "../references/createPrincipleReferences";
import { createUpstreamReference } from "../references/createUpstreamReference";
import { createTopologyFiles } from "../topology/createTopologyFiles";
import { createUnitFiles } from "../utilities/createUnitFiles";
import { passRoot } from "../utilities/passRoot";
import { resolveConstruction } from "../utilities/resolveConstruction";
import { createSettingCoverageClaim } from "./createSettingCoverageClaim";

/**
 * Creates the shared claims for one authored layer.
 *
 * Unit H2s answer only questions each can establish from its own body. The
 * population obligation claims own every whole-layer comparison at file level,
 * while the file claim carries relationships an authored file holds with
 * surrounding layers.
 *
 * What differs between layers is which parents exist. Settings inherits
 * nothing, so it has no construction file claim. Treatments account for settings.
 * Scripts realize the treatments they divide, and screenplay additionally preserves
 * the script partition exactly.
 *
 * Construction hosts body; naturalness hosts the working text, comparing it
 * with the frozen construction snapshot before promotion.
 */
export function createLayerClaims(
  props: IProductionConfigProps,
  layer: AuthoredLayer,
): IEvidenceClaim[] {
  const [stage, final]: ProductionConstructionStageMixin = resolveConstruction(
    props.construction[layer],
  );
  const disabled: boolean = stage === "disabled";
  const files: string[] = createUnitFiles(layer, props.narrativeScope);

  // Indexes and invalid paths must enter the same snapshot as the authored H2s.
  const topology: string[] =
    layer === "settings"
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
    props.mode === "short"
      ? []
      : [
          ...(layer === "screenplay"
            ? [
                createLineageReference(
                  scripts,
                  symbol,
                  final ? "final" : "draft",
                ),
              ]
            : []),
          ...(layer === "scripts" || layer === "screenplay"
            ? [
                createCoverageReference(
                  treatments,
                  symbol,
                  final ? "final" : "draft",
                ),
              ]
            : []),
        ];

  const inherits: string =
    layer === "settings" ? "" : ", and account for the layers they inherit";
  const construction: {
    readonly layer: AuthoredLayer;
    readonly pass: "construction";
    readonly kind: "generated";
  } = { layer, pass: "construction", kind: "generated" } as const;
  const unit: IEvidenceClaim = ownClaim(
    {
      name: `${layer} H2 units answer their principle checklists${inherits}`,
      type: "markdown",
      root: passRoot("draft"),
      files: topology,
      symbol: "h2",
      disabled,
      reference: [
        ...createPrincipleReferences({
          location: props.location,
          layer,
          gate: "layer",
        }),
        ...createLanguagePrincipleReferences({
          location: props.location,
          layer,
          gate: "layer",
        }),
        ...(layer === "settings"
          ? []
          : [createUpstreamReference(props.location, layer)]),
        ...parents("h2"),
      ],
    },
    { ...construction, authored: true },
  );

  // The revision snapshot is a reference, not another authored edition.
  const second: ProductionStage = hasNaturalness(layer)
    ? props.naturalness[layer]
    : "disabled";
  const naturalness: IEvidenceReference[] = [
    ...createPrincipleReferences({
      location: props.location,
      layer,
      gate: "naturalness",
    }),
    ...createLanguagePrincipleReferences({
      location: props.location,
      layer,
      gate: "naturalness",
    }),
  ];
  const surface: IEvidenceClaim[] = hasNaturalness(layer)
    ? [
        ownClaim(
          {
            name: `${layer} final files preserve their draft lineage for naturalness`,
            type: "markdown",
            root: passRoot("final"),
            files,
            symbol: "file",
            disabled: second === "disabled",
            reference: [createLineageReference(files, "file", "revision")],
          },
          { layer, pass: "naturalness", kind: "generated" },
        ),
        ownClaim(
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
          { layer, pass: "naturalness", kind: "generated", authored: true },
        ),
      ]
    : [];
  if (layer === "settings") return [unit, ...surface];

  const coverage: IEvidenceClaim | undefined =
    layer === "treatments"
      ? createSettingCoverageClaim(props, layer)
      : undefined;
  return [
    ownClaim(
      {
        name: `${layer} unit files account for the layers they inherit`,
        type: "markdown",
        root: passRoot("draft"),
        files,
        symbol: "file",
        disabled,
        reference: parents("file"),
      },
      construction,
    ),
    unit,
    ...surface,
    ...(coverage === undefined ? [] : [ownClaim(coverage, construction)]),
  ];
}
