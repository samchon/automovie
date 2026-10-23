import {
  type IProductionClaimOwner,
  type IProductionConfigProps,
  createProductionConfig,
  getProductionClaimOwners,
  stripNaturalnessComments,
} from "@automovie/evidence/narrative";
import {
  EvidenceChecker,
  type IEvidenceCheckAnalysis,
  type IEvidenceClaim,
  type IEvidenceConfig,
  type IEvidenceDeclaration,
  type IEvidenceGraphClaim,
  type IEvidenceHost,
  type IEvidenceSourceFile,
  createEvidenceConfigPlan,
} from "@wrtnlabs/evidence";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/** Temporary authored documents for portable production graph tests. */
export class ProductionWorkflowFixture {
  /** Creates an isolated package root which the caller removes in finally. */
  public static create(): string {
    return fs.realpathSync.native(
      fs.mkdtempSync(path.join(os.tmpdir(), "automovie-production-")),
    );
  }

  /** Writes one UTF-8 input without changing any other fixture document. */
  public static write(root: string, file: string, text: string): void {
    const target: string = path.join(root, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text, "utf8");
  }

  /** Returns a disabled lifecycle; tests explicitly open their own passes. */
  public static props(
    root: string,
    mode: "long" | "short" | "asset" = "long",
  ): IProductionConfigProps {
    return {
      lifecycle: "independent-evidence-v1",
      mode,
      location: root,
      narrativeScope: { mode: "complete-work" },
      construction: {
        settings: "disabled",
        treatments: "disabled",
        scripts: "disabled",
        screenplay: "disabled",
      },
      naturalness: { scripts: "disabled", screenplay: "disabled" },
      gate: {
        harnessVersion: "fixture-harness",
        compilerVersion: "fixture-compiler",
        claimScopes: [],
      },
      claims: [],
    };
  }

  /** Supplies real canon and narrative units plus one question per contract. */
  public static populate(root: string): void {
    for (const layer of ["settings", "treatments", "scripts", "screenplay"]) {
      const file: string =
        layer === "settings" || layer === "treatments"
          ? `${layer}/001-event.md`
          : `${layer}/001-part/001-scene.md`;
      ProductionWorkflowFixture.write(
        root,
        `docs/body/${file}`,
        "# Arrival record\n\n## Arrival {#arrival}\n\nThe guest opens the door.\n",
      );
      if (layer === "scripts" || layer === "screenplay")
        ProductionWorkflowFixture.write(
          root,
          `docs/body/${layer}/001-part/index.md`,
          "# First part\n\n1. [Arrival record](001-scene.md)\n",
        );
      for (const family of ["principles", "obligations", "discovery"])
        ProductionWorkflowFixture.write(
          root,
          `.agents/skills/contracts/story/shared/${family}/${layer}.md`,
          "# Contract\n\n## Scope {#scope}\n\nAccount for the selected work.\n",
        );
      if (layer !== "settings")
        ProductionWorkflowFixture.write(
          root,
          `.agents/skills/contracts/story/shared/upstream/${layer}.md`,
          "# Upstream\n\n## Repair {#repair}\n\nIdentify inherited defects.\n",
        );
    }
    for (const family of ["principles", "obligations", "discovery"])
      for (const group of ["common", "narratives"])
        ProductionWorkflowFixture.write(
          root,
          `.agents/skills/contracts/story/shared/${family}/${group}.md`,
          "# Contract\n\n## Scope {#scope}\n\nAccount for the selected work.\n",
        );
    ProductionWorkflowFixture.write(
      root,
      ".agents/skills/contracts/story/work/discovery/results.md",
      "# Discovery\n\nNo extra requirement was adopted.\n",
    );
  }

  /** Evaluates factory relationships through the actual Markdown adapter. */
  public static async evaluate(
    root: string,
    claims: IEvidenceClaim[],
  ): Promise<IEvidenceCheckAnalysis> {
    return EvidenceChecker.evaluate(
      createEvidenceConfigPlan(
        { claims },
        path.join(root, "evidence.config.ts"),
      ),
    );
  }

  /** Builds an explicit one-scene graph whose contracts make no literary claim. */
  public static complete(
    root: string,
    mode: "long" | "short",
  ): IProductionConfigProps {
    ProductionWorkflowFixture.populate(root);
    const props: IProductionConfigProps = ProductionWorkflowFixture.props(
      root,
      mode,
    );
    const layers: ("settings" | "treatments" | "scripts" | "screenplay")[] =
      mode === "long"
        ? ["settings", "treatments", "scripts", "screenplay"]
        : ["screenplay"];
    const discovery: Set<string> = new Set<string>();
    for (const family of ["principles", "obligations"])
      ProductionWorkflowFixture.write(
        root,
        `.agents/skills/contracts/story/shared/${family}/review.md`,
        "# Review\n\n## Scope {#scope}\n\nCompare the complete fixture.\n",
      );
    ProductionWorkflowFixture.write(
      root,
      ".agents/skills/contracts/story/shared/naturalness/common.md",
      "# Expression\n\n## Scope {#scope}\n\nPreserve the scene decision.\n",
    );
    ProductionWorkflowFixture.write(
      root,
      ".agents/skills/contracts/story/shared/naturalness/obligations/common.md",
      "# Expression population\n\n## Scope {#scope}\n\nCompare expression across all selected scenes.\n",
    );
    ProductionWorkflowFixture.write(
      root,
      "docs/instructions/001-brief.md",
      "# Brief\n\n## Door {#door}\n\nThe guest opens the door.\n",
    );
    if (mode === "long") {
      props.construction.index = "evidence";
      for (const family of ["principles", "obligations"])
        ProductionWorkflowFixture.write(
          root,
          `.agents/skills/contracts/story/shared/${family}/index.md`,
          "# Outline\n\n## Scope {#scope}\n\nGuide the reader to every canon file.\n",
        );
      ProductionWorkflowFixture.write(
        root,
        "docs/body/settings/outline/index.md",
        "# Settings outline\n\n## Canon {#canon}\n\nThe scene's starting facts.\n\n### Arrival record {#001-event}\n\nThe guest's starting action.\n",
      );
      ProductionWorkflowFixture.write(
        root,
        "docs/evidence/construction/units/settings/outline/index.md",
        "# docs/body/settings/outline/index.md#canon\n\n## @evidence shared/principles/index.md#scope\n\nThe canon part guides the reader to the arrival record.\n",
      );
      ProductionWorkflowFixture.write(
        root,
        "docs/evidence/construction/files/settings/outline/index.md",
        "# docs/body/settings/outline/index.md\n\n## @evidence shared/obligations/index.md#scope\n\nThe only canon file has one matching ordered entry.\n",
      );
    }
    for (const layer of layers) {
      props.construction[layer] = "evidence";
      const file: string =
        layer === "settings" || layer === "treatments"
          ? "001-event.md"
          : "001-part/001-scene.md";
      const groups: string[] =
        layer === "settings"
          ? ["common", layer]
          : ["common", "narratives", layer];
      const units: string[] = groups.map(
        (group: string): string => `shared/principles/${group}.md#scope`,
      );
      const files: string[] = groups.map(
        (group: string): string => `shared/obligations/${group}.md#scope`,
      );
      if (layer === "settings" || layer === "treatments" || mode === "short")
        units.push("instructions/001-brief.md#door");
      if (layer === "settings")
        files.push("settings/outline/index.md#001-event");
      for (const group of groups)
        discovery.add(`shared/discovery/${group}.md#scope`);
      if (layer !== "settings")
        units.push(`shared/upstream/${layer}.md#repair`);
      if (layer === "treatments") units.push("settings/001-event.md#arrival");
      if (mode === "long" && (layer === "scripts" || layer === "screenplay")) {
        units.push("treatments/001-event.md#arrival");
        files.push("docs/body/treatments/001-event.md");
      }
      if (mode === "long" && layer === "screenplay") {
        units.push("scripts/001-part/001-scene.md#arrival");
        files.push("docs/body/scripts/001-part/001-scene.md");
      }
      ProductionWorkflowFixture.write(
        root,
        `docs/evidence/construction/units/${layer}/${file}`,
        `# docs/body/${layer}/${file}#arrival\n\n${units.map((target: string): string => `## @evidence ${target}\n\nThe complete fixture scene carries this requirement.\n`).join("\n")}`,
      );
      ProductionWorkflowFixture.write(
        root,
        `docs/evidence/construction/files/${layer}/${file}`,
        `# docs/body/${layer}/${file}\n\n${files.map((target: string): string => `## @evidence ${target}\n\nThis file owns the fixture duty.\n`).join("\n")}`,
      );
      if (layer === "scripts" || layer === "screenplay") {
        props.naturalness[layer] = "evidence";
        const working: string = `<!--\n@evidence docs/revision/${layer}/${file} Preserves the frozen file.\n@evidence shared/naturalness/obligations/common.md#scope Compared expression across the selected scene population.\n-->\n# Arrival record\n\n## Arrival {#arrival}\n<!--\n@evidence ${layer}/${file}#arrival Preserves the frozen scene.\n@evidence shared/naturalness/common.md#scope Keeps the same scene decision.\n-->\nThe guest opens the door.\n`;
        ProductionWorkflowFixture.write(
          root,
          `docs/revision/${layer}/${file}`,
          "# Arrival record\n\n## Arrival {#arrival}\n\nThe guest opens the door.\n",
        );
        ProductionWorkflowFixture.write(
          root,
          `docs/naturalness/${layer}/${file}`,
          working,
        );
        ProductionWorkflowFixture.write(
          root,
          `docs/body/${layer}/${file}`,
          stripNaturalnessComments(Buffer.from(working)).toString("utf8"),
        );
      }
      for (const pass of layer === "scripts" || layer === "screenplay"
        ? ["draft", "final"]
        : ["draft"]) {
        ProductionWorkflowFixture.write(
          root,
          `docs/review/${pass}/${layer}/round-1/${file}`,
          `# Arrival record\n\n## Arrival {#arrival}\n<!--\n@evidence ${file}#arrival Read the fixture scene.\n@evidence shared/principles/review.md#scope Compared the complete fixture.\n-->\nThe fixture review is structural only.\n`,
        );
        ProductionWorkflowFixture.write(
          root,
          `docs/review/${pass}/${layer}/round-1/verdict/index.md`,
          "<!--\n@evidence shared/obligations/review.md#scope Read every selected fixture unit.\n-->\n# Verdict\n\nNo structural finding remains.\n",
        );
      }
    }
    ProductionWorkflowFixture.write(
      root,
      ".agents/skills/contracts/story/work/discovery/results.md",
      `<!--\n${[...discovery].map((target: string): string => `@evidenceExclude ${target} The fixture needs no additional rule.`).join("\n")}\n-->\n# Discovery\n\nThe fixed scene introduces no work-specific rule.\n`,
    );
    return props;
  }

  /** Records active review tokens from fresh props or an original factory config. */
  public static async certify(
    root: string,
    input: IProductionConfigProps | IEvidenceConfig,
  ): Promise<void> {
    const config: IEvidenceConfig =
      "lifecycle" in input ? createProductionConfig(input) : input;
    const owners: IProductionClaimOwner[] = getProductionClaimOwners(config);
    const analysis: IEvidenceCheckAnalysis =
      await ProductionWorkflowFixture.evaluate(root, config.claims);
    for (const owner of owners.filter(
      (candidate: IProductionClaimOwner): boolean =>
        candidate.kind === "review" &&
        config.claims[candidate.index].disabled !== true,
    )) {
      const result:
        | IEvidenceCheckAnalysis["graph"]["claims"][number]
        | undefined = analysis.graph.claims.find(
        (
          candidate: IEvidenceCheckAnalysis["graph"]["claims"][number],
        ): boolean => candidate.claim === owner.index,
      );
      if ((result?.obligations[0]?.edges.length ?? 0) === 0)
        throw new Error(
          `Fixture review has no captured fingerprint: ${owner.layer}/${owner.pass}\n${JSON.stringify(analysis.report.diagnostics)}`,
        );
      const input: IEvidenceGraphClaim = analysis.graphInput.claims.find(
        (claim: IEvidenceGraphClaim): boolean => claim.index === owner.index,
      )!;
      const updated: Map<string, string> = new Map();
      for (const edge of result!.obligations[0].edges) {
        const declaration: IEvidenceDeclaration =
          input.inventory.declarations.find(
            (candidate: IEvidenceDeclaration): boolean =>
              candidate.id === edge.declarationId,
          )!;
        const host: IEvidenceHost = input.inventory.hosts.find(
          (candidate: IEvidenceHost): boolean => candidate.id === edge.hostId,
        )!;
        const source: IEvidenceSourceFile = input.inventory.sources.find(
          (candidate: IEvidenceSourceFile): boolean =>
            candidate.physicalPath === host.file,
        )!;
        const current: string =
          updated.get(host.file) ??
          source.content.replace(/^@evidenceReview .*\n/gmu, "");
        const range: NonNullable<IEvidenceDeclaration["location"]["range"]> =
          declaration.location.range!;
        const original: string = source.content.slice(
          range.start.offset,
          range.end.offset,
        );
        updated.set(
          host.file,
          current.replace(
            original,
            `${original}\n@evidenceReview ${declaration.target} #${edge.fingerprint} Compared the captured fixture scene.`,
          ),
        );
      }
      for (const [target, content] of updated)
        fs.writeFileSync(target, content, "utf8");
    }
  }
}
