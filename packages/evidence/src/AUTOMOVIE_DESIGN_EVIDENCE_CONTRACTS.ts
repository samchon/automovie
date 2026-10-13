import type { IAutoMovieSharedContractReference } from "./IAutoMovieSharedContractReference";

/** Bundled design contract routes, retaining their inventory order. */
export const AUTOMOVIE_DESIGN_EVIDENCE_CONTRACTS: readonly IAutoMovieSharedContractReference[] = [
{
    domain: "design",
    file: "discovery/design/designs.md",
    anchors: ["work-specific-design-requirements"],
  },
{
    domain: "design",
    file: "discovery/design/instances.md",
    anchors: ["work-specific-instance-requirements"],
  },
{
    domain: "design",
    file: "discovery/design/maps.md",
    anchors: ["work-specific-map-requirements"],
  },
{
    domain: "design",
    file: "discovery/design/materials.md",
    anchors: ["work-specific-material-requirements"],
  },
{
    domain: "design",
    file: "discovery/design/models.md",
    anchors: ["work-specific-model-requirements"],
  },
{
    domain: "design",
    file: "discovery/design/motions.md",
    anchors: ["work-specific-motion-requirements"],
  },
{
    domain: "design",
    file: "discovery/design/spaces.md",
    anchors: ["work-specific-space-requirements"],
  },
{
    domain: "design",
    file: "discovery/design/systems.md",
    anchors: ["work-specific-system-requirements"],
  },
{
    domain: "design",
    file: "obligations/design/instances.md",
    anchors: [
      "addressable-instance-decisions",
      "instance-prototype-membership",
      "instance-identity-transform",
      "instance-variation-tiers",
      "instance-placement-review",
    ],
  },
{
    domain: "design",
    file: "obligations/design/maps.md",
    anchors: [
      "addressable-map-decisions",
      "map-world-site-interface",
      "map-world-content-relations",
      "map-world-temporal-state",
      "map-world-scale-partition",
      "map-world-source-resolution",
      "map-review-set",
    ],
  },
{
    domain: "design",
    file: "obligations/design/materials.md",
    anchors: [
      "addressable-material-decisions",
      "material-identity-assembly",
      "material-surface-assignment",
      "material-response",
      "material-review-set",
    ],
  },
{
    domain: "design",
    file: "obligations/design/models.md",
    anchors: [
      "addressable-model-decisions",
      "representation-ceiling",
      "reference-scale",
      "articulation-ownership",
      "model-review-set",
      "model-representation-completion",
    ],
  },
{
    domain: "design",
    file: "obligations/design/motions.md",
    anchors: [
      "addressable-motion-decisions",
      "time-base",
      "contact-policy",
      "composition-interruption",
      "motion-review-set",
    ],
  },
{
    domain: "design",
    file: "obligations/design/spaces.md",
    anchors: [
      "addressable-spatial-decisions",
      "space-reference-topology",
      "space-envelope-interface",
      "space-access-circulation",
      "space-review-set",
    ],
  },
{
    domain: "design",
    file: "obligations/design/systems.md",
    anchors: [
      "addressable-system-decisions",
      "system-ownership-interfaces",
      "system-state-clock",
      "system-budget-degradation",
      "system-review-set",
    ],
  },
{
    domain: "design",
    file: "obligations/design/instance-sources.md",
    anchors: [
      "instance-source-design-ownership",
      "instance-source-stable-membership",
      "instance-source-invalid-placement",
    ],
  },
{
    domain: "design",
    file: "obligations/design/map-sources.md",
    anchors: [
      "map-source-design-ownership",
      "map-source-deterministic-world",
      "map-source-preserved-lineage",
      "map-source-invalid-world",
    ],
  },
{
    domain: "design",
    file: "principles/design/instances.md",
    anchors: [
      "instance-prototype-boundary",
      "instance-derivation-authority",
      "instance-verification-address",
    ],
  },
{
    domain: "design",
    file: "principles/design/maps.md",
    anchors: [
      "map-addressable-world-identity",
      "map-coordinate-extent-scale",
      "map-verification-address",
    ],
  },
{
    domain: "design",
    file: "obligations/design/material-sources.md",
    anchors: [
      "material-source-design-ownership",
      "material-source-renderer-mapping",
      "material-source-invalid-state",
    ],
  },
{
    domain: "design",
    file: "principles/design/materials.md",
    anchors: [
      "material-construction-appearance",
      "material-binding-interface",
      "material-verification-address",
    ],
  },
{
    domain: "design",
    file: "obligations/design/model-sources.md",
    anchors: [
      "design-owned-construction",
      "deterministic-build",
      "unsupported-fidelity-is-explicit",
    ],
  },
{
    domain: "design",
    file: "principles/design/models.md",
    anchors: [
      "representation-contract",
      "spatial-convention",
      "reviewable-structure",
      "model-observable-style-basis",
      "model-scale-layer-completion",
    ],
  },
{
    domain: "design",
    file: "obligations/design/motion-sources.md",
    anchors: [
      "design-owned-transition",
      "pure-time-mapping",
      "invalid-input-is-visible",
    ],
  },
{
    domain: "design",
    file: "principles/design/motions.md",
    anchors: [
      "state-endpoints",
      "temporal-phases",
      "spatial-relation",
      "parameter-domain",
    ],
  },
{
    domain: "design",
    file: "obligations/design/space-sources.md",
    anchors: [
      "space-source-design-ownership",
      "space-source-stable-identities",
      "space-source-invalid-topology",
    ],
  },
{
    domain: "design",
    file: "principles/design/spaces.md",
    anchors: [
      "space-topology",
      "space-boundary-authority",
      "space-verification-address",
    ],
  },
{
    domain: "design",
    file: "obligations/design/system-sources.md",
    anchors: [
      "system-source-design-ownership",
      "system-source-explicit-evaluation",
      "system-source-failure-budget",
    ],
  },
{
    domain: "design",
    file: "principles/design/systems.md",
    anchors: [
      "system-authority-confinement",
      "system-dependency-basis",
      "system-verification-address",
    ],
  },
{
    domain: "design",
    file: "upstream/design/instance-sources.md",
    anchors: ["design-revision-from-instance-source-work"],
  },
{
    domain: "design",
    file: "upstream/design/instances.md",
    anchors: ["parent-revision-from-instance-work"],
  },
{
    domain: "design",
    file: "upstream/design/map-sources.md",
    anchors: ["design-revision-from-map-source-work"],
  },
{
    domain: "design",
    file: "upstream/design/maps.md",
    anchors: ["settings-revision-from-map-work"],
  },
{
    domain: "design",
    file: "upstream/design/material-sources.md",
    anchors: ["design-revision-from-material-source-work"],
  },
{
    domain: "design",
    file: "upstream/design/materials.md",
    anchors: ["parent-revision-from-material-work"],
  },
{
    domain: "design",
    file: "upstream/design/model-sources.md",
    anchors: ["design-revision-from-model-source-work"],
  },
{
    domain: "design",
    file: "upstream/design/models.md",
    anchors: ["settings-and-space-revision-from-model-work"],
  },
{
    domain: "design",
    file: "upstream/design/motion-sources.md",
    anchors: ["design-revision-from-motion-source-work"],
  },
{
    domain: "design",
    file: "upstream/design/motions.md",
    anchors: ["parent-revision-from-motion-work"],
  },
{
    domain: "design",
    file: "upstream/design/space-sources.md",
    anchors: ["design-revision-from-space-source-work"],
  },
{
    domain: "design",
    file: "upstream/design/spaces.md",
    anchors: ["settings-and-map-revision-from-space-work"],
  },
{
    domain: "design",
    file: "upstream/design/system-sources.md",
    anchors: ["design-revision-from-system-source-work"],
  },
{
    domain: "design",
    file: "upstream/design/systems.md",
    anchors: ["parent-revision-from-system-work"],
  }
];
