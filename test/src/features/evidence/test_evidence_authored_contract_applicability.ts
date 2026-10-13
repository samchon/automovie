import {
  AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS,
  createAutoMovieAuthoredDiscoveryReferences,
  createAutoMovieAuthoredPrincipleReferences,
  createAutoMovieScreenplayNaturalnessReferences,
  selectAutoMovieAuthoredContractFiles,
  selectAutoMovieScreenplayNaturalnessContractFiles,
} from "@automovie/evidence";
import { TestValidator } from "@nestia/e2e";

/**
 *
 * Authored role determines contract applicability within every production kind.
 *
 * Scenarios:
 * 1. Every technical layer selects its own contract and the common foundation.
 * 2. Construction narrative layers select population language duties, while
 *    screenplay naturalness selects expression rules independently.
 * 3. Film settings select story subjects; other shapes retain their settings role.
 * 4. Research has source principles and common obligations; derived technical
 *    layers also answer inherited-unit principles.
 * 5. Independent calls return independent selections in deterministic order.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `selectAutoMovieAuthoredContractFiles` for every production kind and every `AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS` entry, then the discovery, principle and naturalness reference builders, and asserts which contract files each selection contains, the full discovery list, determinism, independent arrays and the projected reference policy; it catches a narrative-only duty leaking into technical layers or missing from treatments, scripts and screenplays, story subjects selected outside film settings, an inherited-unit principle on a foundation or narrative layer, a specialist obligation invented for research, shared mutable arrays between calls, and a reference that loses `checklist` or `noEvidenceExclude`.
 * @evidence contracts/testing.md#independent-expectations Expectations restate the selector's documented applicability rules as separate predicates and a hand-kept per-layer discovery table rather than calling the selector's own logic: every layer answers the common files, only the narrative ladder answers population-language duties, film settings alone answer story subjects, and derived technical layers alone answer inherited units; because the table is maintained beside the selector, a rule changed in both places on purpose is not caught, and the naturalness file list itself is not asserted.
 * @evidence contracts/testing.md#distinguishing-cases Positive and negative applicability for each rule across 4 kinds by 13 layers, including the null kind; boundaries of research, which has no specialist discovery or obligation, and settings, which changes only for film; both review flags for every reference builder; local claim validation and policy belong to `test_evidence_local_principle_policy` and `test_evidence_local_principle_hosts`, and file parentage claims to `test_evidence_authored_file_parentage`.
 */
export const test_evidence_authored_contract_applicability = (): void => {
  const narrativeLayers = new Set(["treatments", "scripts", "screenplays"]);
  const specialistDiscovery = {
    settings: ["core/settings.md"],
    research: [],
    maps: ["design/designs.md", "design/maps.md"],
    models: ["design/designs.md", "design/models.md"],
    spaces: ["design/designs.md", "design/spaces.md"],
    materials: ["design/designs.md", "design/materials.md"],
    instances: ["design/designs.md", "design/instances.md"],
    motions: ["design/designs.md", "design/motions.md"],
    systems: ["design/designs.md", "design/systems.md"],
    treatments: ["story/films.md", "story/treatments.md"],
    scripts: ["story/films.md", "story/scripts.md"],
    screenplays: ["story/films.md", "story/screenplays.md"],
    briefs: ["delivery/briefs.md"],
  };
  for (const kind of [null, "film", "brief", "library"] as const)
    for (const layer of AUTOMOVIE_AUTHORED_DOCUMENT_LAYERS) {
      const selected = selectAutoMovieAuthoredContractFiles(kind, layer);
      const narrative = narrativeLayers.has(layer);
      for (const family of ["principles", "obligations"] as const) {
        TestValidator.predicate(
          `${kind}/${layer} common ${family}`,
          selected[family].includes(`${family}/core/common.md`),
        );
        for (const style of [`${family}/story/narratives.md`])
          TestValidator.equals(
            `${kind}/${layer} ${style} applicability`,
            selected[family].includes(style),
            narrative,
          );
      }
      for (const populationRule of [
        "obligations/core/defaults.md",
        "language/obligations/common.md",
      ])
        TestValidator.equals(
          `${kind}/${layer} ${populationRule} applicability`,
          selected.obligations.includes(populationRule),
          narrative,
        );
      TestValidator.predicate(
        `${kind}/${layer} has no construction naturalness rule`,
        selected.principles.every(
          (file) =>
            !file.startsWith("naturalness/") &&
            !file.startsWith("language/naturalness/"),
        ),
      );
      const domain =
        layer === "settings" || layer === "research"
          ? "core"
          : narrative
            ? "story"
            : layer === "briefs"
              ? "delivery"
              : "design";
      TestValidator.equals(
        `${kind}/${layer} discovery roles`,
        selected.discovery,
        [
          "discovery/core/common.md",
          ...specialistDiscovery[layer].map((file) => `discovery/${file}`),
          ...(narrative ? ["language/discovery/signals.md"] : []),
        ],
      );
      TestValidator.predicate(
        `${layer} specialist principle`,
        selected.principles.includes(`principles/${domain}/${layer}.md`),
      );
      TestValidator.equals(
        `${layer} specialist obligation`,
        selected.obligations.includes(`obligations/${domain}/${layer}.md`),
        layer !== "research",
      );
      TestValidator.equals(
        `${kind}/${layer} story subjects`,
        selected.obligations.includes("obligations/story/subjects.md"),
        kind === "film" && layer === "settings",
      );
      TestValidator.equals(
        `${layer} inherited unit basis`,
        selected.principles.includes("principles/core/inherited-units.md"),
        !["settings", "research"].includes(layer) && !narrative,
      );
      const repeated = selectAutoMovieAuthoredContractFiles(kind, layer);
      TestValidator.equals("deterministic selection", repeated, selected);
      for (const review of [false, true]) {
        const discovery = createAutoMovieAuthoredDiscoveryReferences(
          kind,
          layer,
          review,
        );
        TestValidator.equals(
          "selected discovery reaches native coverage",
          discovery,
          selected.discovery.map((file) => ({
            type: "markdown",
            root: "docs",
            files: [file],
            symbol: "h2",
            requireReview: false,
          })),
        );
        const references = createAutoMovieAuthoredPrincipleReferences(
          kind,
          layer,
          review,
        );
        TestValidator.equals(
          "selected files reach native references",
          references.map((reference) => reference.files[0]),
          selected.principles,
        );
        for (const reference of references)
          TestValidator.equals(
            "independent principle policy",
            {
              root: reference.root,
              symbol: reference.symbol,
              checklist: reference.checklist,
              noEvidenceExclude: reference.noEvidenceExclude,
              requireReview: reference.requireReview,
            },
            {
              root: "docs",
              symbol: "h2",
              checklist: true,
              noEvidenceExclude: true,
              requireReview: false,
            },
          );
      }
      selected.principles.length = 0;
      selected.obligations.length = 0;
      selected.discovery.length = 0;
      TestValidator.predicate(
        "selections own their arrays",
        repeated.principles.length > 0 &&
          repeated.obligations.length > 0 &&
          repeated.discovery.length > 0,
      );
    }

  const naturalness = selectAutoMovieScreenplayNaturalnessContractFiles();
  for (const review of [false, true])
    TestValidator.equals(
      "naturalness reference policy",
      createAutoMovieScreenplayNaturalnessReferences(review),
      naturalness.map((file) => ({
        type: "markdown",
        root: "docs",
        files: [file],
        symbol: "h2",
        checklist: true,
        noEvidenceExclude: true,
        requireReview: false,
      })),
    );
};
