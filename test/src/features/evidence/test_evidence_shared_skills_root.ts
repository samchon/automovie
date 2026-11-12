import { type IAutoMovieEvidenceConfigProps, createEvidenceConfig } from "@automovie/evidence";
import {
  createDevelopmentContractClaims,
  createEngineeringClaims,
  createPackageChecklistClaim,
  createPackagePopulationContract,
  createProductionConfig,
  createResearchClaims,
  type IProductionConfigProps,
} from "@automovie/evidence/internal";
import { TestValidator } from "@nestia/e2e";
import type {
  IEvidenceClaim,
  IEvidenceConfig,
  IEvidenceReference,
} from "@wrtnlabs/evidence";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * A workspace's shared skills tree roots the bundled contracts, the production
 * keeps its own work and language contracts in `docs/contracts`, omitting
 * `skills` keeps the standalone configuration unchanged, and a production
 * still holding its own contracts in the retired skills location is refused.
 *
 * Scenarios:
 *
 * 1. With `skills` at the workspace root, every `shared/...` story reference
 *    roots at `../../../.agents/skills/contracts/story`, every `language/...`
 *    reference and the discovery claim over `work/**` root at the production's
 *    `docs/contracts`, and the engineering, development and research claims
 *    root at `../../../.agents/skills`.
 * 2. Optional contracts are probed in their owner's tree: a shared document
 *    present only in the workspace tree is selected and one present only in
 *    the production's skills tree is not; a language document present only in
 *    the production's `docs/contracts` is selected and one present only in the
 *    workspace tree is not.
 * 3. Omitting `skills` equals passing the production's own `.agents/skills`,
 *    roots shared contracts at `.agents/skills/contracts/story` and every
 *    checklist at `.agents/skills`, keeps language at `docs/contracts`, and
 *    then selects the shared document installed in the production's tree.
 * 4. A relative `skills` resolves against `location` in both configuration factories.
 * 5. The public claim helpers default to `.agents/skills` and accept a
 *    workspace root, and work-local package claims root at `docs/contracts`.
 * 6. A legacy `.agents/skills/contracts/story/work` directory is refused by
 *    createEvidenceConfig with or without narrative and by
 *    createProductionConfig, naming only that directory and its new home; a
 *    legacy `language` directory beside it is named too.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public createEvidenceConfig, createProductionConfig and claim helpers and reads the reference roots, selected documents and refusal messages they produce, so a shared contract rooted in the production, a work or language contract rooted anywhere but `docs/contracts`, a probe in the wrong tree, or a silently accepted legacy layout fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected roots are the literal relative paths of the temporary layout `movies/shorts/demo` with its workspace `.agents/skills` and its own `docs/contracts`; the selected documents follow from which tree each fixture file was written to, and the refusal text is the documented legacy-to-new mapping, not output of the factories' path helpers.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts a workspace and a standalone configuration of the same production, decoy shared and language documents installed only in the non-owning tree, an omitted and an explicit default `skills`, relative and absolute values, default and supplied helper roots, and one against two legacy families across all three refusing entries.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-process unit: it writes a few Markdown files in its own temporary directory, removes it in finally, and starts no process or Evidence evaluation.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the ownership rule under test and numbers each scenario with the property it pins.
 */
export function test_evidence_shared_skills_root(): void {
  const workspace: string = fs.realpathSync.native(
    fs.mkdtempSync(path.join(os.tmpdir(), "evidence-skills-")),
  );
  try {
    const skills: string = path.join(workspace, ".agents", "skills");
    const location: string = path.join(workspace, "movies", "shorts", "demo");
    const local: string = path.join(location, ".agents", "skills");
    const write = (file: string): void => {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, "# Contract\n\n## Item\n\nState it.\n");
    };
    const story = (root: string, file: string): string =>
      path.join(root, "contracts", "story", file);
    const own = (file: string): string =>
      path.join(location, "docs", "contracts", file);
    write(story(skills, "shared/principles/realized.md"));
    write(story(skills, "shared/naturalness/common.md"));
    write(story(skills, "shared/obligations/screenplay.md"));
    write(story(skills, "language/principles/common.md"));
    write(story(local, "shared/naturalness/screenplay.md"));
    write(own("language/principles/screenplay.md"));
    write(own("language/discovery/questions.md"));

    const base: IAutoMovieEvidenceConfigProps = {
      location,
      research: "evidence",
      development: { entities: "evidence" },
      narrative: {
        mode: "short",
        construction: { screenplay: "evidence" },
        naturalness: { screenplay: "evidence" },
      },
    };

    // 1. Workspace roots by owner.
    const config: IEvidenceConfig = createEvidenceConfig({ ...base, skills });
    const roots: Map<string, string[]> = collectStoryRoots(config);
    TestValidator.equals(
      "shared story contracts root at the workspace tree",
      [...new Set(roots.get("shared") ?? [])],
      ["../../../.agents/skills/contracts/story"],
    );
    TestValidator.equals(
      "language contracts root at the production's docs/contracts",
      [...new Set(roots.get("language") ?? [])],
      ["docs/contracts"],
    );
    const discovery: IEvidenceClaim | undefined = config.claims.find(
      (claim: IEvidenceClaim): boolean => claim.files.includes("work/**/*.md"),
    );
    TestValidator.equals(
      "the discovery claim hosts the production's work contracts",
      discovery?.type === "markdown" ? discovery.root : undefined,
      "docs/contracts",
    );
    TestValidator.equals(
      "engineering, development and research claims root at the workspace tree",
      sortedSet(collectChecklistRoots(config)),
      ["../../../.agents/skills", "../../../.agents/skills/contracts/story"],
    );

    // 2. Optional contracts are probed in their owner's tree.
    const selected: string[] = collectFiles(config);
    TestValidator.predicate(
      "shared documents in the workspace tree are selected",
      [
        "shared/principles/realized.md",
        "shared/naturalness/common.md",
        "shared/obligations/screenplay.md",
      ].every((file: string): boolean => selected.includes(file)),
    );
    TestValidator.predicate(
      "a shared document only in the production's skills tree is not selected",
      !selected.includes("shared/naturalness/screenplay.md"),
    );
    TestValidator.predicate(
      "language documents in the production's docs/contracts are selected",
      selected.includes("language/principles/screenplay.md") &&
        selected.includes("language/discovery/questions.md"),
    );
    TestValidator.predicate(
      "a language document only in the workspace tree is not selected",
      !selected.includes("language/principles/common.md"),
    );

    // 3. The standalone default.
    const standalone: IEvidenceConfig = createEvidenceConfig(base);
    TestValidator.equals(
      "omitting skills equals the production's own tree",
      standalone,
      createEvidenceConfig({ ...base, skills: local }),
    );
    const standaloneRoots: Map<string, string[]> =
      collectStoryRoots(standalone);
    TestValidator.equals(
      "standalone shared contracts root at the production's skills tree",
      [...new Set(standaloneRoots.get("shared") ?? [])],
      [".agents/skills/contracts/story"],
    );
    TestValidator.equals(
      "standalone language contracts stay at docs/contracts",
      [...new Set(standaloneRoots.get("language") ?? [])],
      ["docs/contracts"],
    );
    TestValidator.equals(
      "standalone engineering claims root at the production tree",
      sortedSet(collectChecklistRoots(standalone)),
      [".agents/skills", ".agents/skills/contracts/story"],
    );
    TestValidator.predicate(
      "standalone selects the shared document of its own tree",
      collectFiles(standalone).includes("shared/naturalness/screenplay.md"),
    );

    // 4. A relative shared tree resolves against the production.
    const production: IProductionConfigProps = {
      location,
      mode: "short",
      narrativeScope: { mode: "complete-work" },
      construction: {
        settings: "disabled",
        treatments: "disabled",
        scripts: "disabled",
        screenplay: "evidence",
      },
      naturalness: { screenplay: "disabled" },
    };
    TestValidator.equals(
      "createEvidenceConfig resolves a relative skills against location",
      createEvidenceConfig({ ...base, skills: "../../../.agents/skills" }),
      config,
    );
    TestValidator.equals(
      "createProductionConfig resolves a relative skills against location",
      createProductionConfig({ ...production, skills: ".agents/skills" }),
      createProductionConfig({ ...production, skills: local }),
    );

    // 5. Public helpers.
    TestValidator.equals(
      "helpers default to the production tree",
      [
        ...collectChecklistRoots({ claims: createEngineeringClaims() }),
        ...collectChecklistRoots({
          claims: createDevelopmentContractClaims({ entities: "evidence" }),
        }),
        ...collectChecklistRoots({ claims: createResearchClaims() }),
      ],
      [
        ".agents/skills",
        ".agents/skills",
        ".agents/skills",
        ".agents/skills",
        ".agents/skills",
        ".agents/skills/contracts/story",
      ],
    );
    TestValidator.equals(
      "helpers accept a workspace root",
      [
        ...collectChecklistRoots({
          claims: createEngineeringClaims({ skills: "../x" }),
        }),
        ...collectChecklistRoots({
          claims: createDevelopmentContractClaims({
            entities: "evidence",
            skills: "../x",
          }),
        }),
        ...collectChecklistRoots({
          claims: createResearchClaims({ skills: "../x" }),
        }),
      ],
      ["../x", "../x", "../x", "../x", "../x", "../x/contracts/story"],
    );
    const work: IEvidenceClaim[] = [
      createPackageChecklistClaim({
        name: "units meet the work rule",
        document: "work/principles/rule.md",
        files: ["screenplay/**/*.md"],
        stage: "evidence",
        symbol: "h2",
      }),
      ...createPackagePopulationContract({
        document: "work/obligations/scale.md",
        layers: { screenplay: "evidence" },
        narrativeScope: { mode: "complete-work" },
        reason: "reach the commissioned scale",
      }),
    ];
    TestValidator.equals(
      "work-local package claims root at the production's docs/contracts",
      work.flatMap((claim: IEvidenceClaim): string[] =>
        references(claim).map((reference: IEvidenceReference): string =>
          reference.type === "markdown" ? rootOf(reference.root) : "",
        ),
      ),
      ["docs/contracts", "docs/contracts"],
    );

    // 6. A production still holding its own contracts in the retired tree.
    write(story(local, "work/discovery/results.md"));
    const workOnly: string = refusal(
      (): IEvidenceConfig => createEvidenceConfig({ ...base, skills }),
    );
    TestValidator.predicate(
      "the legacy work directory is named with its new home",
      workOnly.includes(
        ".agents/skills/contracts/story/work -> docs/contracts/work",
      ) && !workOnly.includes("story/language"),
    );
    TestValidator.equals(
      "an engineering-only configuration refuses the same layout",
      refusal((): IEvidenceConfig => createEvidenceConfig({ location })),
      workOnly,
    );
    TestValidator.equals(
      "createProductionConfig refuses the same layout",
      refusal((): IEvidenceConfig => createProductionConfig(production)),
      workOnly,
    );
    write(story(local, "language/principles/screenplay.md"));
    const both: string = refusal(
      (): IEvidenceConfig => createEvidenceConfig({ ...base, skills }),
    );
    TestValidator.predicate(
      "both legacy directories are named with their new homes",
      both.includes(
        ".agents/skills/contracts/story/work -> docs/contracts/work",
      ) &&
        both.includes(
          ".agents/skills/contracts/story/language -> docs/contracts/language",
        ),
    );
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
}

/** Returns the message a refused configuration throws, failing if none is thrown. */
function refusal(task: () => unknown): string {
  try {
    task();
  } catch (error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
  throw new Error("The configuration was expected to be refused.");
}

/** Deduplicates and orders strings for an order-free comparison. */
function sortedSet(values: string[]): string[] {
  return [...new Set(values)].sort((a: string, b: string): number =>
    a.localeCompare(b),
  );
}

/** Spells an omitted root as `.`, the configuration directory it defaults to. */
function rootOf(root: string | undefined): string {
  return root ?? ".";
}

/** Lists one claim's references whether it declares one or several. */
function references(claim: IEvidenceClaim): IEvidenceReference[] {
  return Array.isArray(claim.reference) ? claim.reference : [claim.reference];
}

/** Groups the roots of contract references by their family folder. */
function collectStoryRoots(config: IEvidenceConfig): Map<string, string[]> {
  const roots: Map<string, string[]> = new Map();
  for (const claim of config.claims)
    for (const reference of references(claim)) {
      if (reference.type !== "markdown") continue;
      for (const file of reference.files) {
        const family: string = file.split("/")[0]!;
        if (family !== "shared" && family !== "language") continue;
        roots.set(family, [
          ...(roots.get(family) ?? []),
          rootOf(reference.root),
        ]);
      }
    }
  return roots;
}

/** Lists the roots of checklist references that address a skills tree. */
function collectChecklistRoots(
  config: Pick<IEvidenceConfig, "claims">,
): string[] {
  return config.claims.flatMap((claim: IEvidenceClaim): string[] =>
    claim.type === "typescript" || claim.name === "research studies"
      ? references(claim).flatMap((reference: IEvidenceReference): string[] =>
          reference.type === "markdown" && reference.checklist === true
            ? [rootOf(reference.root)]
            : [],
        )
      : [],
  );
}

/** Lists every contract document the configuration references. */
function collectFiles(config: IEvidenceConfig): string[] {
  return config.claims.flatMap((claim: IEvidenceClaim): string[] =>
    references(claim).flatMap((reference: IEvidenceReference): string[] =>
      reference.type === "markdown" ? reference.files : [],
    ),
  );
}
