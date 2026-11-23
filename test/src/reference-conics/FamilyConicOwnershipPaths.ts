/**
 * Distinct receipt and payload paths for the ownership tool. The caller owns
 * absolute-path and workspace admission; this pure owner requires a JSON suffix
 * without case sensitivity and retains the requested receipt's exact spelling.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Admits the actual final filename suffix before replacing exactly those five characters with the payload suffix, making the companion distinct even for uppercase JSON.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One suffix refusal and one pair of returned paths precede the tool's writes.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing suffix is refused instead of aliasing receipt and companion; absolute-path and protected-baseline checks remain with the tool boundary.
 * @evidence contracts/development/common.md#meaningful-documentation States suffix spelling, path ownership and the two distinct outputs.
 * @evidence contracts/development/implementation.md#efficient-algorithms Suffix matching and one string copy require work and storage linear in the filename length.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure string transformation coordinates no requests or effects.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns two strings and retains no path, filesystem handle or process.
 */
export function FamilyConicOwnershipPaths(output: string): {
  receipt: string;
  companion: string;
} {
  if (!/\.json$/i.test(output))
    throw new Error("Ownership receipt requires a JSON suffix");
  return { receipt: output, companion: output.slice(0, -5) + ".payload.json" };
}
