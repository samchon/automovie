import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import { SKILLS_ROOT } from "./internal/SKILLS_ROOT";

/**
 * Creates fresh source/test claims against the project's own checklists.
 *
 * Use the result when extending, rather than replacing, the default engineering
 * population. Every exported source declaration and test answers the common
 * checklist; exported types, interfaces and classes also answer the design
 * checklist, exported functions and class methods the implementation checklist,
 * and exported test functions the testing checklist. The paths are read from
 * the skills tree at `skills`, by default the production's own
 * `.agents/skills`; a workspace production names the shared tree at the
 * workspace root instead, such as `../../../.agents/skills`. By default the
 * paths are the scaffold's
 * `contracts/development/{common,design,implementation,testing}.md`.
 *
 * Each claim selects exactly the declarations that owe its checklists, so tests
 * answer common and testing in one claim, while source types and functions,
 * which owe different checklists, share common through a separate claim; a
 * claim reports an answer on a declaration outside its population as unhosted. A production created before that layout passes its
 * own paths instead, such as `common: null` with one `contracts/common.md` for
 * both design and implementation, which then selects types and functions in a
 * single claim as before.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Native TypeScript symbol kinds separate declarations that describe a shape (type) from those that compute (function); one claim per population keeps every acknowledgement on a host its claim selects, and equal design and implementation paths collapse into one claim for the same reason.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This factory owns only the default engineering population, independent of narrative graph construction; the optional paths and skills root name the checklists without changing which declarations owe them.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The documented src/test conventions are production defaults, not fixture paths or tailored expected answers; a supplied path replaces only its checklist file, a supplied skills root moves only where they are read, and a null common path removes only the shared claim.
 * @evidence contracts/development/common.md#meaningful-documentation The comment explains which declarations answer which checklist, how claims follow their populations, fresh ownership, extension, the workspace skills root and the legacy form; each option states its role.
 * @evidence contracts/development/implementation.md#efficient-algorithms Allocates at most four fixed-size claim trees in constant time and space; it performs no discovery or file I/O.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Fresh objects are intentional so editing one configuration cannot contaminate another; there is no expensive shared work to cache.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the returned claim trees; this function retains no references, handles, or tasks.
 */
export function createEngineeringClaims(
  props: {
    /**
     * Shared documentation checklist path from `skills`, answered by every
     * selected source declaration and test; `null` selects none.
     */
    common?: string | null;

    /** Design checklist path from `skills`, answered by source types. */
    design?: string;

    /**
     * Implementation checklist path from `skills`, answered by source
     * functions.
     */
    implementation?: string;

    /** Testing checklist path from `skills`, answered by tests. */
    tests?: string;

    /**
     * Reference root of the skills tree holding the checklists, relative to
     * the directory of `evidence.config.ts` with `/` separators; `..` segments
     * reach a workspace's shared tree.
     *
     * @default ".agents/skills"
     */
    skills?: string;
  } = {},
): IEvidenceClaim[] {
  const common: string | null =
    props.common === undefined
      ? "contracts/development/common.md"
      : props.common;
  const design: string = props.design ?? "contracts/development/design.md";
  const implementation: string =
    props.implementation ?? "contracts/development/implementation.md";
  const checklist = (...files: string[]): IEvidenceClaim["reference"] => ({
    type: "markdown",
    root: props.skills ?? SKILLS_ROOT,
    files,
    symbol: "h2",
    checklist: true,
  });
  const tests: string = props.tests ?? "contracts/development/testing.md";
  return [
    ...(design === implementation
      ? [
          {
            name: "production source",
            type: "typescript",
            files: ["src/**/*.ts"],
            symbol: ["type", "function"],
            reference: checklist(design),
          } satisfies IEvidenceClaim,
        ]
      : [
          {
            name: "production types",
            type: "typescript",
            files: ["src/**/*.ts"],
            symbol: "type",
            reference: checklist(design),
          } satisfies IEvidenceClaim,
          {
            name: "production functions",
            type: "typescript",
            files: ["src/**/*.ts"],
            symbol: "function",
            reference: checklist(implementation),
          } satisfies IEvidenceClaim,
        ]),
    {
      name: "production tests",
      type: "typescript",
      files: ["test/**/test_*.ts"],
      symbol: "function",
      reference: common === null ? checklist(tests) : checklist(common, tests),
    },
    ...(common === null
      ? []
      : [
          {
            name: "production documentation",
            type: "typescript",
            files: ["src/**/*.ts"],
            symbol: ["type", "function"],
            reference: checklist(common),
          } satisfies IEvidenceClaim,
        ]),
  ];
}
