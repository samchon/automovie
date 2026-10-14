

/**
 * Translate legacy viewer part names and discard their trailing revision suffix for a current lookup.
 *
 * @evidence contracts/common.md#principled-implementation The last at-sign suffix is stripped; part: prefixes try element-part before prototype-part, while other bare ids pass through.
 * @evidence contracts/common.md#clear-and-simple-design Legacy naming adaptation stays outside the engine's canonical namespace resolver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The supplied suffix is not checked for freshness and ambiguous part aliases take the first successful spelling.
 * @evidence contracts/common.md#meaningful-documentation Order and current-lookup meaning are explicit; no subject is selected without the later resolver.
 * @evidence contracts/performance.md#efficient-algorithms String slicing/prefix checks and at most two new spellings scale with id length.
 * @evidence contracts/performance.md#reuse-equivalent-work The single bare spelling is reused for both candidate namespaces without caching names across revisions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the small owned string array escapes; no artifact or lookup state is retained.
 */
export function subjectInspectionCompiledSubjectSpellings(
  subject: string
): string[] {
  const revisionAt: number = subject.lastIndexOf("@");
  const bare: string = revisionAt === -1 ? subject : subject.slice(0, revisionAt);
  return bare.startsWith("part:")
    ? [
        `element-part:${bare.slice("part:".length)}`,
        `prototype-part:${bare.slice("part:".length)}`,
      ]
    : [bare];
}
