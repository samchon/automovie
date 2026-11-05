import type {
  IEvidenceClaim,
  IEvidenceMarkdownReference,
} from "@wrtnlabs/evidence";

import type { IAutoMovieDevelopmentProps } from "./IAutoMovieDevelopmentProps";

/**
 * Creates the claims of the enabled production-specific development contracts.
 *
 * Each enabled stage selects the exported functions of one source folder and
 * requires each to answer every item of
 * `.agents/skills/contracts/development/<stage>.md` in its doc comment. Motion
 * functions also cite the performance studies they follow, and every study in
 * `docs/research/` apart from its index must be cited, so motion cannot be
 * written without its study and no study goes unused; shot functions cite the
 * screenplay H2s they execute, and every screenplay H2 must be executed; asset
 * functions answer their checklist alone, because the settings record links
 * its asset rather than every record needing one.
 *
 * @evidence contracts/common.md#principled-implementation Native TypeScript function claims carry the checklist, and a second Markdown reference uses native target coverage to make the study-to-motion and screenplay-to-shot relations mechanical.
 * @evidence contracts/common.md#clear-and-simple-design One table maps each stage to its source folder and cited population; disabled stages produce no claim.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source folders are the scaffold layout's documented locations, not fixture paths; nothing is inferred from file presence.
 * @evidence contracts/common.md#meaningful-documentation The comment states each stage's respondents and the relation it enforces.
 * @evidence contracts/performance.md#efficient-algorithms Builds at most three fixed-size claim trees in constant time; it performs no discovery or file I/O.
 * @evidence contracts/performance.md#reuse-equivalent-work Fresh objects are returned so one configuration's edits cannot reach another; there is no expensive shared work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned claims; nothing is retained.
 */
export function createDevelopmentContractClaims(
  props: IAutoMovieDevelopmentProps,
): IEvidenceClaim[] {
  const stages: {
    stage: keyof IAutoMovieDevelopmentProps;
    name: string;
    folder: string;
    cited?: IEvidenceMarkdownReference;
  }[] = [
    { stage: "assets", name: "assets", folder: "src/assets" },
    {
      stage: "motion",
      name: "motion modules",
      folder: "src/motion",
      cited: {
        type: "markdown",
        files: ["docs/research/**/*.md", "!docs/research/index.md"],
        symbol: "file",
      },
    },
    {
      stage: "shots",
      name: "shots",
      folder: "src/shots",
      cited: {
        type: "markdown",
        files: ["docs/body/screenplay/**/*.md"],
        symbol: "h2",
      },
    },
  ];
  return stages
    .filter((entry): boolean => props[entry.stage] === "evidence")
    .map(
      (entry): IEvidenceClaim => ({
        name: entry.name,
        type: "typescript",
        files: [`${entry.folder}/**/*.ts`],
        symbol: "function",
        reference: [
          {
            type: "markdown",
            root: ".agents/skills",
            files: [`contracts/development/${entry.stage}.md`],
            symbol: "h2",
            checklist: true,
          },
          ...(entry.cited === undefined ? [] : [structuredClone(entry.cited)]),
        ],
      }),
    );
}
