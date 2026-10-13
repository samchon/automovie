import crypto from "node:crypto";
import path from "node:path";
import ts from "typescript-compiler";
import { createAutoMovieContractBindingManifest } from "../createAutoMovieContractBindingManifest";
import type { IAutoMovieProductionEvidenceSourceOwnerBinding } from "../IAutoMovieProductionEvidenceSourceOwnerBinding";
import type { IMarkdownSourceOwnerTarget } from "./IMarkdownSourceOwnerTarget";
import { resolveAutoMovieProductionEvidencePopulationFiles } from "../resolveAutoMovieProductionEvidencePopulationFiles";
import { markdownSourceOwnerTargets } from "./markdownSourceOwnerTargets";
import { readNormalizedSource } from "./readNormalizedSource";
import { exportedSourceOwners } from "./exportedSourceOwners";
import { jsDocTagsOf } from "./jsDocTagsOf";
import { compareCodeUnits } from "./compareCodeUnits";


/** Resolve the runtime-bearing lineage edges selected by the live manifest.
 *
 * @evidence contracts/common.md#principled-implementation Graph-selected lineage targets and exposed AST owners are joined by exact evidence citations, while normalized source bytes supply the execution identity digest.
 * @evidence contracts/common.md#clear-and-simple-design One reader projection turns selected source exports into authored-owner edges without executing the source.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unselected symbol kinds and target addresses do not enter the result; duplicate edges are suppressed by full branch/source/export/target identity, without generating text-review metadata.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies graph-selected runtime-bearing lineage; output members distinguish graph activation, byte digest and exact target anchor.
 * @evidence contracts/performance.md#efficient-algorithms For B bindings, each binding walks selected targets and sources, builds target maps and parses source ASTs; sorting E edges adds O(E log E), with target syntax projection charged to its owning helper.
 * @evidence contracts/performance.md#reuse-equivalent-work Within a binding one target map serves every export citation and one parsed source serves all exposed owners; different bindings currently repeat overlapping reads and parses.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only edge strings and flags escape; ASTs, source strings and target maps are released after each scan, with no file-count or byte cap here.
 */
export const sourceOwnerBindingsOf: (root: string, bindings: ReturnType<typeof createAutoMovieContractBindingManifest>["bindings"]) => IAutoMovieProductionEvidenceSourceOwnerBinding[] = (
  root: string,
  bindings: ReturnType<
    typeof createAutoMovieContractBindingManifest
  >["bindings"],
): IAutoMovieProductionEvidenceSourceOwnerBinding[] => {
  const output: IAutoMovieProductionEvidenceSourceOwnerBinding[] = [];
  const seen: Set<string> = new Set<string>();
  for (const binding of bindings) {
    if (
      binding.relationship !== "lineage" ||
      binding.host.type !== "typescript" ||
      binding.target.type !== "population" ||
      binding.target.symbols.some(
        (symbol: string) : boolean => symbol === "h2" || symbol === "h3",
      ) === false
    )
      continue;
    const targetSymbols: Set<string> = new Set(binding.target.symbols);
    const targets: Map<string, IMarkdownSourceOwnerTarget> = new Map<string, IMarkdownSourceOwnerTarget>();
    for (const file of resolveAutoMovieProductionEvidencePopulationFiles(
      root,
      binding.target.root,
      binding.target.files,
      ".md",
    )) {
      const absolute: string = path.resolve(root, file);
      for (const target of markdownSourceOwnerTargets(
        root,
        binding.target.root,
        absolute,
      ))
        if (targetSymbols.has(`h${target.depth}`))
          targets.set(target.relativeTarget, target);
    }
    for (const sourcePath of resolveAutoMovieProductionEvidencePopulationFiles(
      root,
      binding.host.root,
      binding.host.files,
    )) {
      const source: string = readNormalizedSource(path.resolve(root, sourcePath));
  const sourceDigest: string = `sha256:${crypto
        .createHash("sha256")
        .update(source)
        .digest("hex")}`;
      const parsed: ts.SourceFile = ts.createSourceFile(
        sourcePath,
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
      );
      for (const owner of exportedSourceOwners(parsed)) {
        if (binding.host.symbols.includes(owner.symbolKind) === false) continue;
        const tags: { name: string; comment: string; }[] = jsDocTagsOf(owner.nodes);
        for (const tag of tags.filter((tag: { name: string; comment: string; }) : boolean => tag.name === "evidence")) {
          const [cited, ...reason]: string[] = tag.comment.split(/\s+/u);
          if (cited === undefined || reason.length === 0) continue;
          const target: IMarkdownSourceOwnerTarget | undefined = targets.get(cited);
          if (target === undefined) continue;
          const identity: string = JSON.stringify([
            binding.branch,
            sourcePath,
            owner.exportName,
            target.relativeTarget,
          ]);
          if (seen.has(identity)) continue;
          seen.add(identity);
          output.push({
            branch: binding.branch,
            stage: binding.stage,
            enforced: binding.enforced,
            relationship: "lineage",
            sourcePath,
            exportName: owner.exportName,
            symbolKind: owner.symbolKind,
            sourceDigest,
            targetPath: target.path,
            targetAnchor: target.anchor,
          });
        }
      }
    }
  }
  return output.sort((left: IAutoMovieProductionEvidenceSourceOwnerBinding, right: IAutoMovieProductionEvidenceSourceOwnerBinding) : number =>
    compareCodeUnits(
      JSON.stringify([
        left.branch,
        left.sourcePath,
        left.exportName,
        left.targetPath,
        left.targetAnchor,
      ]),
      JSON.stringify([
        right.branch,
        right.sourcePath,
        right.exportName,
        right.targetPath,
        right.targetAnchor,
      ]),
    ),
  );
};
