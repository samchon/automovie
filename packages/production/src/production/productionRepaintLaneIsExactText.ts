/**
 * Recognize nonempty unpadded lane identity/path text. Text admission provides no path containment, credential filtering or resident source verification.
 *
 * @evidence contracts/common.md#principled-implementation A string guard precedes nonempty trim and original-to-trim equality, preserving exact identity spelling.
 * @evidence contracts/common.md#clear-and-simple-design Lane population and selected-source checks share this scalar predicate without coupling to project filesystem admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Padded/empty text fails without coercion, while unsafe locator or credential contents need their actual project owner.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes exact text from contained or verified artifact paths.
 * @evidence contracts/performance.md#efficient-algorithms Two trims scan L characters with possible temporary string allocation and no population-level work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The predicate owns no lane request coordinator or retained text cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Trim temporaries expire and neither supplied text nor a filesystem handle is retained.
 */
export const productionRepaintLaneIsExactText: (value: string) => boolean = (value: string): boolean =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value === value.trim();
