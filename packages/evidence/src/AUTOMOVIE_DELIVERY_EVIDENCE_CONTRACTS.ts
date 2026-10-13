import type { IAutoMovieSharedContractReference } from "./IAutoMovieSharedContractReference";

/** Bundled delivery contract routes, retaining their inventory order. */
export const AUTOMOVIE_DELIVERY_EVIDENCE_CONTRACTS: readonly IAutoMovieSharedContractReference[] = [
{
    domain: "delivery",
    file: "discovery/delivery/briefs.md",
    anchors: ["work-specific-brief-requirements"],
  },
{
    domain: "delivery",
    file: "obligations/delivery/briefs.md",
    anchors: [
      "single-scope-eligibility",
      "brief-unit-addressability",
      "observable-progression",
    ],
  },
{
    domain: "delivery",
    file: "principles/delivery/briefs.md",
    anchors: ["brief-information-structure", "no-narrative-smuggling"],
  },
{
    domain: "delivery",
    file: "obligations/delivery/film-sources.md",
    anchors: [
      "editorial-only-assembly",
      "authored-auxiliary-tracks",
      "deterministic-timeline",
    ],
  },
{
    domain: "delivery",
    file: "obligations/delivery/production-sources.md",
    anchors: [
      "settings-only-serialization",
      "delivery-identity",
      "shared-visual-grammar",
    ],
  },
{
    domain: "delivery",
    file: "obligations/delivery/shots.md",
    anchors: [
      "contract-only-composition",
      "explicit-inputs-and-time",
      "acceptance-travels-with-delivery",
    ],
  },
{
    domain: "delivery",
    file: "upstream/delivery/briefs.md",
    anchors: ["parent-revision-from-brief-work"],
  },
{
    domain: "delivery",
    file: "upstream/delivery/film-sources.md",
    anchors: ["parent-revision-from-film-source-work"],
  },
{
    domain: "delivery",
    file: "upstream/delivery/production-sources.md",
    anchors: ["settings-revision-from-production-source-work"],
  },
{
    domain: "delivery",
    file: "upstream/delivery/shots.md",
    anchors: ["parent-revision-from-shot-work"],
  }
];
