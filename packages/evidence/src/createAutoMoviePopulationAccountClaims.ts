import type { IAutoMoviePopulationAccountClaimsProps } from "./IAutoMoviePopulationAccountClaimsProps";
import { createAutoMoviePopulationAccountClaim } from "./createAutoMoviePopulationAccountClaim";

/**
 * Creates distributed coverage for each selected obligation family.
 *
 * Authored H2s and the family's optional aggregate account are equally valid owners. Their evidence collectively covers the obligation targets. The item's substantive scope determines how many contributors it needs.
 *
 * @evidence contracts/common.md#principled-implementation Validate the layer and distinct host or obligation paths before creating distributed coverage for each selected obligation.
 * @evidence contracts/common.md#clear-and-simple-design Family routing and account naming stay together so every obligation has one deterministic aggregate address.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicate paths and cross-layer selectors are rejected; collective coverage does not weaken no-exclusion target duties.
 * @evidence contracts/common.md#meaningful-documentation Inputs are docs-relative selectors, and errors name the offending layer or obligation before any result is returned.
 * @evidence contracts/performance.md#efficient-algorithms Sets make duplicate admission linear in host and obligation counts; constructing each obligation copies the host selector population.
 * @evidence contracts/performance.md#reuse-equivalent-work The host set is shared across obligation validation within the call; results are rebuilt for changed selector inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary sets are call-local and returned claims are caller-owned; retained output grows with obligations times host selectors.
 */
export function createAutoMoviePopulationAccountClaims(
  props: IAutoMoviePopulationAccountClaimsProps,
): ReturnType<typeof createAutoMoviePopulationAccountClaim>[] {
  if (!/^[a-z][a-zA-Z]*$/u.test(props.layer))
    throw new Error(
      `Invalid population account layer ${JSON.stringify(props.layer)}.`,
    );
  if (props.populationFiles.length === 0)
    throw new Error(
      `${props.layer} population accounts require authored H2 files.`,
    );
  const population: Set<string> = new Set<string>();
  for (const file of props.populationFiles) {
    if (!file.startsWith(`${props.layer}/`))
      throw new Error(
        `${props.layer} population account cannot select another layer through ${JSON.stringify(file)}.`,
      );
    if (population.has(file))
      throw new Error(`${props.layer} repeats population file ${file}.`);
    population.add(file);
  }
  const seen: Set<string> = new Set<string>();
  return props.obligationFiles.map((file: string): ReturnType<typeof createAutoMoviePopulationAccountClaim> => {
    if (
      !/^(?:obligations\/(?:core|delivery|design|story)|language\/obligations)\/[a-z0-9-]+\.md$/u.test(
        file,
      )
    )
      throw new Error(
        `Invalid population obligation path ${JSON.stringify(file)}.`,
      );
    if (seen.has(file))
      throw new Error(`${props.layer} repeats population obligation ${file}.`);
    seen.add(file);
    return createAutoMoviePopulationAccountClaim({
      name: `${props.layer} owners collectively fulfill ${file} obligations`,
      account: `accounts/${props.layer}/${file.replace(/^obligations\//u, "").replaceAll("/", "-")}`,
      document: file,
      documentRoot: "docs",
      populationFiles: props.populationFiles,
      enabled: props.enabled,
    });
  });
}
