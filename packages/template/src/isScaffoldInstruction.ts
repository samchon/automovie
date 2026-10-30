/**
 * Whether a project-relative file belongs to the generated instruction surface.
 *
 * @evidence contracts/common.md#principled-implementation Only the two routers, retained license and non-contract skill resources are managed; normalized components refuse path traversal.
 * @evidence contracts/common.md#clear-and-simple-design One predicate defines both state admission and rendered instruction selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contracts, project scope, README, configuration, source and media remain project-owned; no production name changes selection.
 * @evidence contracts/common.md#meaningful-documentation The comment and branches identify the exact generated surface.
 * @evidence contracts/performance.md#efficient-algorithms Splitting and validating components is linear in path length.
 * @evidence contracts/performance.md#reuse-equivalent-work The same predicate serves renderer state and sync rather than duplicate path rules.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a call-local component array is allocated; no filesystem resource is acquired.
 */
export function isScaffoldInstruction(relative: string): boolean {
  if (
    relative === "AGENTS.md" ||
    relative === "CLAUDE.md" ||
    relative === ".agents/skills/LICENSE.novels"
  )
    return true;
  const parts: string[] = relative.split("/");
  return (
    parts.length >= 4 &&
    parts[0] === ".agents" &&
    parts[1] === "skills" &&
    parts[2] !== "contracts" &&
    parts
      .slice(2)
      .every(
        (part: string): boolean =>
          /^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$/u.test(part) &&
          part !== "." &&
          part !== "..",
      )
  );
}
