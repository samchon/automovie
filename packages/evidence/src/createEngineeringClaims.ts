import type { IEvidenceClaim } from "@wrtnlabs/evidence";

/**
 * Creates fresh source/test claims against the project's own checklists.
 *
 * Use the result when extending, rather than replacing, the default engineering
 * population. The project owns these checklist files and their questions.
 *
 * @evidence contracts/common.md#principled-implementation Native TypeScript selectors address exported source types/functions and exported test functions; project-relative Markdown checklists own their obligations.
 * @evidence contracts/common.md#clear-and-simple-design This factory owns only the default engineering population, independent of narrative graph construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The two documented src/test conventions are production defaults, not fixture paths or tailored expected answers.
 * @evidence contracts/common.md#meaningful-documentation The comment explains fresh ownership, extension, and project checklist locations; native Evidence types describe selector fields.
 * @evidence contracts/performance.md#efficient-algorithms Allocates two fixed-size claim trees in constant time and space; it performs no discovery or file I/O.
 * @evidence contracts/performance.md#reuse-equivalent-work Fresh objects are intentional so editing one configuration cannot contaminate another; there is no expensive shared work to cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned two claim trees; this function retains no references, handles, or tasks.
 */
export function createEngineeringClaims(): IEvidenceClaim[] {
  return [
    {
      name: "production source",
      type: "typescript",
      files: ["src/**/*.ts"],
      symbol: ["type", "function"],
      reference: {
        type: "markdown",
        root: ".agents/skills",
        files: ["contracts/common.md"],
        symbol: "h2",
        checklist: true,
      },
    },
    {
      name: "production tests",
      type: "typescript",
      files: ["test/**/test_*.ts"],
      symbol: ["function"],
      reference: {
        type: "markdown",
        root: ".agents/skills",
        files: ["contracts/testing.md"],
        symbol: "h2",
        checklist: true,
      },
    },
  ];
}
