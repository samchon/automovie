import {
  EvidenceFileGlob,
  type IEvidenceClaim,
  type IEvidenceMarkdownReference,
} from "@wrtnlabs/evidence";
import fs from "node:fs";
import path from "node:path";

import type { IContractLocation } from "../../../internal/IContractLocation";
import type { AuthoredLayer } from "../../AuthoredLayer";
import type { AuthoredPass } from "../../AuthoredPass";
import type { IProductionConfigProps } from "../../IProductionConfigProps";
import type { ProductionStage } from "../../ProductionStage";
import { constructionStage } from "../constructionStage";
import { hasNaturalness } from "../hasNaturalness";
import { createLineageReference } from "../references/createLineageReference";
import { createSharedReference } from "../references/createSharedReference";
import { PACKAGE_DOCS_ROOT } from "../utilities/PACKAGE_DOCS_ROOT";
import { createContractDirectory } from "../utilities/createContractDirectory";
import { createUnitFiles } from "../utilities/createUnitFiles";
import { passRoot } from "../utilities/passRoot";

/**
 * Creates the claims that record the evidence-stage reviews in the graph.
 *
 * A reviewer writes one review file per authored file and one review H2 per
 * authored H2, directly under `docs/review/<pass>/<layer>` in a tree that
 * mirrors the authored layer. A selected review file or `verdict/index.md`
 * starts this current population; missing counterparts never come from a
 * legacy round. Without current files, the highest numbered legacy round
 * remains supported. Each review H2 cites its authored H2 and keeps a current
 * review of it, so an authored change expires exactly the reviews it touched
 * and the graph shows which unit to read again. Each review H2 also answers
 * the review principles for itself. One verdict file per layer answers the
 * review obligations once, because they compare the whole population.
 *
 * No claim binds the review files to the authored files one to one, because
 * the H2 bijection already leaves no authored H2 without a review.
 *
 * Review claims are active only while the reviewed pass is in `evidence`.
 * A package whose installed contract predates the review family, or whose
 * reviewer has not yet written current files or a legacy round under
 * `docs/review/<pass>/<layer>`, has no review claims for that pass.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Actual in-scope direct review files or a verdict select the canonical population exclusively; otherwise the highest numeric legacy round supplies exact current-review lineage and a separate file-level verdict obligation, with stages preserved.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One root selector keeps current-versus-legacy admission separate from the unchanged unit bijection, freshness and whole-population verdict claims.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Older contract families, probed in the shared skills tree that also roots their references, and not-yet-created review roots yield no claims; native inactive populations do not establish that independent review occurred.
 * @evidence contracts/development/common.md#meaningful-documentation The prose states canonical admission, exclusive legacy fallback, current-review invalidation, H2 bijection, verdict ownership and optional roots/contracts.
 * @evidence contracts/development/implementation.md#efficient-algorithms Up to two editions scan entries only as deep as their actual selectors; directory entries and native glob matching dominate, with a linear root scan for legacy selection when no canonical file exists.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each edition reuses its resolved files, selected root and lineage for both claims; filesystem observation repeats per config build so new current files replace legacy selection.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Directory arrays are transient and bounded by visited entries; returned claims belong to the config, and synchronous scans retain no history, handle or task.
 */
export function createReviewClaims(
  props: IProductionConfigProps,
  layer: AuthoredLayer,
): IEvidenceClaim[] {
  const passes: [AuthoredPass, ProductionStage][] = [
    ["draft", constructionStage(props, layer)],
    ...(hasNaturalness(layer)
      ? [
          ["final", props.naturalness.screenplay] as [
            AuthoredPass,
            ProductionStage,
          ],
        ]
      : []),
  ];
  const principles: boolean = installed(props, "principles/review.md");
  const obligations: boolean = installed(props, "obligations/review.md");
  if (!principles && !obligations) return [];
  const files: string[] = createUnitFiles(layer, props.narrativeScope);

  return passes.flatMap(
    ([pass, stage]: [AuthoredPass, ProductionStage]): IEvidenceClaim[] => {
      // Naturalness approval stays with the working text, even after promotion.
      const inside: string[] = files.map((file: string): string =>
        file.slice(layer.length + 1),
      );
      const base: string = `${PACKAGE_DOCS_ROOT}/review/${pass}/${layer}`;
      const selected: { root: string; files: string[] } | null =
        selectReviewRoot(path.join(props.location, base), inside);
      if (selected === null) return [];
      const disabled: boolean = stage === "disabled";
      const root: string =
        selected.root === "" ? base : `${base}/${selected.root}`;
      const lineage: IEvidenceMarkdownReference = {
        ...(createLineageReference(
          files,
          "h2",
          pass,
          true,
        ) as IEvidenceMarkdownReference),
        root: `${passRoot(pass)}/${layer}`,
        files: inside,
      };
      const where: "construction" | "naturalness" =
        pass === "draft" ? "construction" : "naturalness";
      return [
        {
          name: `${layer} ${where} review H2 units keep a current review of their ${pass} H2`,
          type: "markdown",
          root,
          files: selected.files,
          symbol: "h2",
          disabled,
          reference: [
            lineage,
            ...(principles
              ? [
                  createSharedReference({
                    contracts: props,
                    file: "principles/review.md",
                    checklist: true,
                    exclusion: false,
                  }),
                ]
              : []),
          ],
        },
        ...(obligations
          ? [
              {
                name: `${layer} ${where} verdict answers each review obligation once`,
                type: "markdown",
                root,
                files: ["verdict/index.md"],
                symbol: "file",
                disabled,
                reference: {
                  ...createSharedReference({
                    contracts: props,
                    file: "obligations/review.md",
                    checklist: false,
                    exclusion: false,
                  }),
                  uniqueEvidence: true,
                },
              } satisfies IEvidenceClaim,
            ]
          : []),
      ];
    },
  );
}

/**
 * Selects current or legacy review hosts, or no review root.
 *
 * An empty relative root selects current files; a round name selects legacy.
 * Current host selectors exclude every observed numeric round subtree.
 * Files outside the actual authored scope cannot start a current review.
 * Traversal stops at selector depth and never enters legacy round subtrees.
 * Filesystem errors and malformed round entries propagate instead of hiding
 * unavailable review input behind another population. A non-directory numeric
 * round is rejected when legacy selection is needed.
 *
 * Principled implementation: Native EvidenceFileGlob membership admits selected direct files or the canonical verdict before numeric legacy fallback; maximum selector segment count bounds traversal, and exact observed numeric-round exclusions prevent legacy hosts entering canonical extraction.
 * Clear and simple design: The private selector returns the relative root and its host selectors together, leaving extraction and all review semantics with the existing native claims.
 * Prohibited implementation shortcuts: Partial current populations win without legacy backfill; out-of-scope files cannot trigger admission, filesystem failures propagate and non-directory numeric rounds throw.
 * Meaningful documentation: The comment defines all three results, scope-sensitive admission, traversal bounds and failure behavior.
 * Efficient algorithms: Native glob matching checks visited files up to maximum selector depth; a short-circuit current match ends traversal, otherwise one additional root-entry scan selects the highest numeric round. Storage is directory arrays along the bounded traversal stack.
 * Reuse equivalent work: One glob and maximum depth serve the current scan; the initial root listing is reused for legacy selection, and each config build observes the filesystem anew.
 * Bound retention and release resources: Synchronous directory listings and the glob are call-local, with no retained cache, descriptor or task; the selected root and host selector strings belong to the caller.
 */
function selectReviewRoot(
  directory: string,
  files: string[],
): { root: string; files: string[] } | null {
  if (!fs.existsSync(directory)) return null;
  const selectors: string[] = [...files, "verdict/index.md"];
  const glob: EvidenceFileGlob = new EvidenceFileGlob(selectors);
  const depth: number = Math.max(
    ...selectors.map((selector: string): number => selector.split("/").length),
  );
  const entries: fs.Dirent[] = fs.readdirSync(directory, {
    withFileTypes: true,
  });
  if (hasCurrentReview(directory, entries, glob, depth, ""))
    return {
      root: "",
      files: [
        ...files,
        ...entries
          .filter((entry: fs.Dirent): boolean => /^round-\d+$/.test(entry.name))
          .map((entry: fs.Dirent): string => `!${entry.name}/**`),
      ],
    };
  let latest: string | null = null;
  let number: number = 0;
  for (const entry of entries) {
    const match: RegExpMatchArray | null = /^round-(\d+)$/.exec(entry.name);
    if (match === null) continue;
    if (!entry.isDirectory())
      throw new Error(
        `Review round must be a directory: ${path.join(directory, entry.name)}`,
      );
    if (Number(match[1]) > number) {
      number = Number(match[1]);
      latest = entry.name;
    }
  }
  return latest === null ? null : { root: latest, files };
}

/**
 * Tests actual file membership within the selector's remaining path depth.
 *
 * Principled implementation: Relative paths are matched by the native glob; symlink status follows its actual target, recursion consumes one selector segment and skips top-level round directories, preventing legacy files from masquerading as canonical files.
 * Clear and simple design: This bounded traversal owns only canonical membership and returns as soon as a participating file exists.
 * Prohibited implementation shortcuts: No body or consumer name is special-cased; the numeric round grammar denotes the supported legacy format, and read failures propagate unchanged.
 * Meaningful documentation: The comment states selector depth and membership; parameter names expose root-relative prefix and remaining depth.
 * Efficient algorithms: The depth-first short-circuit scan visits at most entries reachable within selector depth, with one native glob match per file and directory arrays retained only along that bounded stack.
 * Reuse equivalent work: The caller supplies the same glob and initial directory entries; recursive calls reuse it and read each reached child directory once.
 * Bound retention and release resources: Child entry arrays and relative path strings expire on return, and synchronous reads leave no open handle or background task.
 */
function hasCurrentReview(
  directory: string,
  entries: fs.Dirent[],
  glob: EvidenceFileGlob,
  depth: number,
  prefix: string,
): boolean {
  for (const entry of entries) {
    if (prefix === "" && /^round-\d+$/.test(entry.name)) continue;
    const relative: string = `${prefix}${entry.name}`;
    const selected: boolean = glob.matches(relative);
    const descendant: boolean =
      depth > 1 && glob.couldMatchDescendant(relative);
    if (!selected && !descendant) continue;
    const status: fs.Dirent | fs.Stats = entry.isSymbolicLink()
      ? fs.statSync(path.join(directory, entry.name))
      : entry;
    if (status.isFile() && selected) return true;
    if (
      status.isDirectory() &&
      descendant &&
      hasCurrentReview(
        path.join(directory, entry.name),
        fs.readdirSync(path.join(directory, entry.name), {
          withFileTypes: true,
        }),
        glob,
        depth - 1,
        `${relative}/`,
      )
    )
      return true;
  }
  return false;
}

/**
 * Reports whether one review-family document is installed.
 *
 * Principled implementation: The shared story tree from createContractDirectory and the requested relative family path identify the installed optional review question document, wherever a workspace keeps the shared tree.
 * Clear and simple design: This private predicate keeps optional-family discovery separate from review host selection and native evaluation.
 * Prohibited implementation shortcuts: Existence only determines whether the optional family is installed; native extraction still owns readable valid contract content and cannot be replaced by this probe.
 * Meaningful documentation: The comment identifies optional review-family document discovery; the caller supplies the two supported relative contract paths.
 * Efficient algorithms: One path assembly and synchronous existence probe cost path-length work and constant-size metadata observation.
 * Reuse equivalent work: Each factory build observes current installation instead of caching a mutable contract path's existence.
 * Bound retention and release resources: The temporary path and synchronous probe retain no cache, open handle or task.
 */
function installed(contracts: IContractLocation, file: string): boolean {
  return fs.existsSync(
    path.join(
      createContractDirectory(contracts, "shared"),
      "shared",
      ...file.split("/"),
    ),
  );
}
