import type { IEvidenceClaim } from "@wrtnlabs/evidence";

/**
 * Creates the claim that holds performance studies to the story research
 * principles.
 *
 * Each study in `docs/research/`, apart from its index, answers every item of
 * `.agents/skills/contracts/story/shared/principles/research.md`. Like the
 * other story layers, the answers live apart from the study, in
 * `docs/evidence/construction/files/research/`, under an H1 naming the study's
 * path, so the study stays a plain synthesis its readers use.
 *
 * @evidence contracts/common.md#principled-implementation A native Markdown file claim with detached evidence files keeps the study's text free of answers while each study still owes every research item.
 * @evidence contracts/common.md#clear-and-simple-design One claim with fixed study and answer locations; the caller decides whether to enable it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The study, index and answer paths are the scaffold layout's documented locations, not fixture paths.
 * @evidence contracts/common.md#meaningful-documentation The comment states the respondents, the contract and where the answers live.
 * @evidence contracts/performance.md#efficient-algorithms Builds one fixed-size claim tree in constant time; it performs no discovery or file I/O.
 * @evidence contracts/performance.md#reuse-equivalent-work A fresh object is returned so one configuration's edits cannot reach another.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned claim; nothing is retained.
 */
export function createResearchClaims(): IEvidenceClaim[] {
  return [
    {
      name: "performance studies",
      type: "markdown",
      files: ["docs/research/**/*.md", "!docs/research/index.md"],
      evidenceFiles: ["docs/evidence/construction/files/research/**/*.md"],
      symbol: "file",
      reference: {
        type: "markdown",
        root: ".agents/skills/contracts/story",
        files: ["shared/principles/research.md"],
        symbol: "h2",
        checklist: true,
      },
    },
  ];
}
