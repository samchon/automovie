import fs from "node:fs";
import path from "node:path";
import ts from "typescript-compiler";
import type { AutoMovieAuthoredDocumentLayer } from "./AutoMovieAuthoredDocumentLayer";
import type { AutoMovieEvidenceStage } from "./AutoMovieEvidenceStage";
import type { AutoMovieSourceRealizationBranch } from "./AutoMovieSourceRealizationBranch";
import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import type { IAutoMovieEvidenceHeadingIdentity } from "./IAutoMovieEvidenceHeadingIdentity";
import { DESIGN_LAYERS } from "./DESIGN_LAYERS";
import { DOCS } from "./DOCS";
import { MARKDOWN } from "./MARKDOWN";
import { SOURCES } from "./SOURCES";
import { assertSourceExportsAreEvidenceAddressable } from "./assertSourceExportsAreEvidenceAddressable";
import { finalScreenplayPopulationFiles } from "./finalScreenplayPopulationFiles";
import { isActive } from "./isActive";
import { markdownIdentities } from "./markdownIdentities";
import { markdownPopulationFiles } from "./markdownPopulationFiles";
import { narrativeH1 } from "./narrativeH1";
import { parseAutoMovieEvidenceSyntax } from "./parseAutoMovieEvidenceSyntax";
import { populationFiles } from "./populationFiles";
import { posix } from "./posix";
import { revisionStage } from "./revisionStage";
import { validateAutoMovieEvidenceAccounts } from "./validateAutoMovieEvidenceAccounts";
import { validateAutoMovieFinalScreenplayPopulation } from "./validateAutoMovieFinalScreenplayPopulation";
import { validateNarrativePopulationTopology } from "./validateNarrativePopulationTopology";
import { walkProjectFiles } from "./walkProjectFiles";

function hasExportedOwner(file: string, kinds: readonly ("class" | "function" | "property")[]): boolean {
  const source: ts.SourceFile = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const localExports: Set<string> = new Set<string>();
  for (const statement of source.statements) {
    if (
      !ts.isExportDeclaration(statement) ||
      statement.moduleSpecifier !== undefined ||
      statement.isTypeOnly ||
      statement.exportClause === undefined ||
      !ts.isNamedExports(statement.exportClause)
    )
      continue;
    for (const element of statement.exportClause.elements)
      if (!element.isTypeOnly)
        localExports.add((element.propertyName ?? element.name).text);
  }
  const directlyExported: (statement: ts.Statement) => boolean = (statement: ts.Statement): boolean =>
    ts.canHaveModifiers(statement) &&
    (ts.getModifiers(statement) ?? []).some(
      (modifier: ts.Modifier): boolean => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
  const declared: (statement: ts.Statement) => boolean = (statement: ts.Statement): boolean =>
    ts.canHaveModifiers(statement) &&
    (ts.getModifiers(statement) ?? []).some(
      (modifier: ts.Modifier): boolean => modifier.kind === ts.SyntaxKind.DeclareKeyword,
    );
  return source.statements.some(
    (statement: ts.Statement): boolean =>
      (kinds.includes("class") &&
        ts.isClassDeclaration(statement) &&
        statement.name !== undefined &&
        (directlyExported(statement) ||
          localExports.has(statement.name.text)) &&
        !declared(statement) &&
        (ts.getModifiers(statement) ?? []).every(
          (modifier: ts.Modifier): boolean => modifier.kind !== ts.SyntaxKind.AbstractKeyword,
        )) ||
      (kinds.includes("function") &&
        ts.isFunctionDeclaration(statement) &&
        statement.name !== undefined &&
        (directlyExported(statement) ||
          localExports.has(statement.name.text)) &&
        statement.body !== undefined &&
        !declared(statement)) ||
      (kinds.includes("property") &&
        ts.isVariableStatement(statement) &&
        !declared(statement) &&
        statement.declarationList.declarations.some(
          (declaration: ts.VariableDeclaration): boolean =>
            ts.isIdentifier(declaration.name) &&
            declaration.initializer !== undefined &&
            (directlyExported(statement) ||
              localExports.has(declaration.name.text)),
        )),
  );
}

/** Physical final screenplay files in the selected delivery population. */
function finalScreenplayFiles(graph: IAutoMovieEvidenceConfigProps): string[] {
  return populationFiles(
    graph,
    finalScreenplayPopulationFiles(graph).map((file: string): string => `${DOCS}/${file}`),
    ".md",
  );
}

function acceptsResetEvidenceTags(graph: IAutoMovieEvidenceConfigProps, layer: AutoMovieAuthoredDocumentLayer | AutoMovieSourceRealizationBranch): boolean {
  if (graph.populationScope.mode !== "complete-production-reset") return false;
  if (graph.kind === "film")
    return ["treatments", "scripts", "screenplays"].includes(layer);
  if ((DESIGN_LAYERS as readonly string[]).includes(layer))
    return (Object.keys(SOURCES) as AutoMovieSourceRealizationBranch[]).some(
      (source: AutoMovieSourceRealizationBranch): boolean =>
        SOURCES[source].design === layer &&
        graph[layer] === "draft" &&
        graph[source] === "draft",
    );
  const source: AutoMovieSourceRealizationBranch = layer as AutoMovieSourceRealizationBranch;
  const design: "instances" | "maps" | "materials" | "models" | "motions" | "spaces" | "systems" | null = SOURCES[source].design;
  return (
    design !== null && graph[source] === "draft" && graph[design] === "draft"
  );
}

/**
 * Admit resident authored and source populations, explicit anchor topology, final counterparts and script-to-screenplay identity before native evaluation.
 *
 * @evidence contracts/common.md#principled-implementation Admit resident authored and source populations, explicit anchor topology, final counterparts and script-to-screenplay identity before native evaluation.
 * @evidence contracts/common.md#clear-and-simple-design The gate joins physical population selection, account checks and source AST addressability under the declared lifecycle.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reset tag exceptions follow validated transition scope; disabled residents and active empty populations are rejected rather than excluded.
 * @evidence contracts/common.md#meaningful-documentation Identity comparison covers filenames, H1 titles and ordered anchor lineage; it does not compare prose quality or rendered behavior.
 * @evidence contracts/performance.md#efficient-algorithms Cost follows resident bytes, AST nodes and repeated population walks; per-layer maps and sets hold all admitted identities.
 * @evidence contracts/performance.md#reuse-equivalent-work Layer identity and title maps are reused for counterpart checks; some files are still reread for headings and owner syntax.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Maps, ASTs and read buffers are call-local with no fixed resident cap; synchronous I/O releases handles and no task escapes.
 */
export function validateHosts(graph: IAutoMovieEvidenceConfigProps): void {
  validateAutoMovieEvidenceAccounts(graph, {
    residents: walkProjectFiles(
      graph,
      path.join(graph.location, DOCS, "accounts"),
      ".md",
    ).map((file: string): string =>
      posix(path.relative(path.join(graph.location, DOCS), file)),
    ),
    readH2Count: (relative: string): number | undefined => {
      const file: string = path.join(graph.location, relative);
      return fs.existsSync(file)
        ? markdownIdentities(file, [2]).length
        : undefined;
    },
  });
  validateNarrativePopulationTopology(graph);
  const identities: Map<"briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments", Map<string, IAutoMovieEvidenceHeadingIdentity[]>> = new Map<AutoMovieAuthoredDocumentLayer, Map<string, IAutoMovieEvidenceHeadingIdentity[]>>();
  const titles: Map<"briefs" | "instances" | "maps" | "materials" | "models" | "motions" | "research" | "screenplays" | "scripts" | "settings" | "spaces" | "systems" | "treatments", Map<string, string>> = new Map<AutoMovieAuthoredDocumentLayer, Map<string, string>>();
  for (const name of Object.keys(MARKDOWN) as AutoMovieAuthoredDocumentLayer[]) {
    const stage: AutoMovieEvidenceStage = graph[name];
    const directory: string = path.join(graph.location, DOCS, name);
    const files: string[] = markdownPopulationFiles(graph, name);
    const disabledResidents: string[] =
      !isActive(stage) &&
      (name === "treatments" || name === "scripts" || name === "screenplays")
        ? walkProjectFiles(graph, directory, ".md")
        : files;
    if (!isActive(stage) && disabledResidents.length !== 0)
      throw new Error(
        `${name} is disabled but governed hosts remain: ${disabledResidents.map((file: string): string => posix(path.relative(graph.location, file))).join(", ")}.`,
      );
    if (isActive(stage) && files.length === 0)
      throw new Error(`${name} cannot enter ${stage} without a Markdown host.`);
    if (!isActive(stage)) continue;
    const layer: Map<string, IAutoMovieEvidenceHeadingIdentity[]> = new Map<string, IAutoMovieEvidenceHeadingIdentity[]>();
    const layerTitles: Map<string, string> = new Map<string, string>();
    for (const file of files) {
      const relative: string = posix(path.relative(directory, file));
      const source: string = fs.readFileSync(file, "utf8");
      if (
        stage === "draft" &&
        parseAutoMovieEvidenceSyntax({
          path: posix(path.relative(graph.location, file)),
          source,
        }).length !== 0 &&
        !acceptsResetEvidenceTags(graph, name)
      )
        throw new Error(
          `${posix(path.relative(graph.location, file))} is draft and must be completed before evidence tags are authored.`,
        );
      if (name === "treatments" || name === "scripts" || name === "screenplays")
        layerTitles.set(relative, narrativeH1(file));
      layer.set(relative, markdownIdentities(file, MARKDOWN[name].headings));
    }
    const seen: Set<string> = new Set<string>();
    for (const units of layer.values())
      for (const unit of units) {
        if (seen.has(unit.anchor))
          throw new Error(
            `${name} repeats #${unit.anchor}; identities are unique across the layer.`,
          );
        seen.add(unit.anchor);
      }
    identities.set(name, layer);
    titles.set(name, layerTitles);
  }

  const finalRoot: string = path.join(graph.location, DOCS, "final", "screenplays");
  validateAutoMovieFinalScreenplayPopulation({
    stage: revisionStage(graph),
    residents: walkProjectFiles(graph, finalRoot, ".md").map((file: string): string =>
      posix(path.relative(graph.location, file)),
    ),
    files: finalScreenplayFiles(graph).map((file: string): string =>
      posix(path.relative(finalRoot, file)),
    ),
    construction: new Map(
      [...(identities.get("screenplays") ?? [])].map(([file, units]: [string, IAutoMovieEvidenceHeadingIdentity[]]): [string, { title: string; units: IAutoMovieEvidenceHeadingIdentity[]; }] => [
        file,
        { title: titles.get("screenplays")!.get(file)!, units },
      ]),
    ),
    readFinal: (relative: string): { source: string; title: string; units: IAutoMovieEvidenceHeadingIdentity[]; } => {
      const file: string = path.join(finalRoot, relative);
      return {
        source: fs.readFileSync(file, "utf8"),
        title: narrativeH1(file),
        units: markdownIdentities(file, MARKDOWN.screenplays.headings),
      };
    },
    readGroupTitles: (group: string): { final: string; construction: string; } => ({
      final: narrativeH1(path.join(finalRoot, group, "index.md")),
      construction: narrativeH1(
        path.join(graph.location, DOCS, "screenplays", group, "index.md"),
      ),
    }),
  });

  for (const name of Object.keys(SOURCES) as AutoMovieSourceRealizationBranch[]) {
    const stage: AutoMovieEvidenceStage = graph[name];
    const files: string[] = populationFiles(graph, SOURCES[name].files, ".ts");
    if (!isActive(stage) && files.length !== 0)
      throw new Error(
        `${name} is disabled but governed hosts remain: ${files.map((file: string): string => posix(path.relative(graph.location, file))).join(", ")}.`,
      );
    if (isActive(stage) && files.length === 0)
      throw new Error(
        `${name} cannot enter ${stage} without a TypeScript host.`,
      );
    for (const file of files) {
      const source: string = fs.readFileSync(file, "utf8");
      const relative: string = posix(path.relative(graph.location, file));
      assertSourceExportsAreEvidenceAddressable(relative, file, source);
      if (
        stage === "draft" &&
        parseAutoMovieEvidenceSyntax({ path: relative, source }).length !== 0 &&
        !acceptsResetEvidenceTags(graph, name)
      )
        throw new Error(
          `${relative} is draft and must be completed before evidence tags are authored.`,
        );
      if (!hasExportedOwner(file, SOURCES[name].ownerKinds))
        throw new Error(
          `${relative} belongs to active ${name} but has no named exported owner of its required kind (${SOURCES[name].ownerKinds.join(", ")}).`,
        );
    }
  }

  const match: (childName: "screenplays", parentName: "scripts") => void = (childName: "screenplays", parentName: "scripts"): void => {
    const child: Map<string, IAutoMovieEvidenceHeadingIdentity[]> | undefined = identities.get(childName);
    if (child === undefined) return;
    const parent: Map<string, IAutoMovieEvidenceHeadingIdentity[]> = identities.get(parentName)!;
    const childFiles: string[] = [...child.keys()];
    const parentFiles: string[] = [...parent.keys()];
    if (
      childFiles.length !== parentFiles.length ||
      childFiles.some((file: string, index: number): boolean => file !== parentFiles[index])
    )
      throw new Error(
        `${childName} filenames must exactly preserve ${parentName}; received [${childFiles.join(", ")}], expected [${parentFiles.join(", ")}].`,
      );
    for (const file of childFiles) {
      if (
        titles.get(childName)!.get(file) !== titles.get(parentName)!.get(file)
      )
        throw new Error(
          `${childName}/${file} must exactly preserve the ${parentName} H1 title.`,
        );
      const signature: (items: readonly IAutoMovieEvidenceHeadingIdentity[]) => string[] = (items: readonly IAutoMovieEvidenceHeadingIdentity[]): string[] =>
        items.map((item: IAutoMovieEvidenceHeadingIdentity): string => `H${item.depth}:${item.lineage}`);
      const received: string[] = signature(child.get(file)!);
      const expected: string[] = signature(parent.get(file)!);
      if (
        received.length !== expected.length ||
        received.some((value: string, index: number): boolean => value !== expected[index])
      )
        throw new Error(
          `${childName}/${file} must exactly preserve ${parentName} identity, nesting, and order; received [${received.join(", ")}], expected [${expected.join(", ")}].`,
        );
    }
    const groups: Set<string> = new Set(childFiles.map((file: string): string => file.split("/")[0]!));
    for (const group of groups) {
      const childIndex: string = path.join(
        graph.location,
        DOCS,
        childName,
        group,
        "index.md",
      );
      const parentIndex: string = path.join(
        graph.location,
        DOCS,
        parentName,
        group,
        "index.md",
      );
      if (narrativeH1(childIndex) !== narrativeH1(parentIndex))
        throw new Error(
          `${childName}/${group}/index.md must exactly preserve the ${parentName} delivery-group H1 title.`,
        );
    }
  };
  match("screenplays", "scripts");
}
