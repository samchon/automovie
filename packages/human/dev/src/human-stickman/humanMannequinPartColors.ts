/** Choose the playground's custom semantic hint colors from actual Human bone identities.
 *
 * @evidence contracts/common.md#principled-implementation Stable bone-name groups select authored RGB swatches; this palette describes part identity, not anatomy, inferred visibility or an external pose-map encoding.
 * @evidence contracts/common.md#clear-and-simple-design Example colors stay with the playground while the polygon owner applies and retires actual materials.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinates, person-specific branches, OpenPose or DensePose compatibility are claimed.
 * @evidence contracts/common.md#meaningful-documentation Returns RGB hexadecimal colors indexed by the supplied exact bone identities, with distinct left/right limb segment swatches.
 * @evidence contracts/performance.md#efficient-algorithms One bounded name classification per supplied bone costs O(B) time and O(B) returned entries.
 * @evidence contracts/performance.md#reuse-equivalent-work The page computes one palette for its fixed rest prototype and reuses it when display mode changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned plain color map belongs to the page and owns no material, texture or native resource.
 */
export function humanMannequinPartColors(
  bones: readonly string[],
): Readonly<Record<string, number>> {
  const colors: Record<string, number> = {};
  const axial: Record<string, number> = {
    hips: 0x8674c4,
    spine: 0x5ea36e,
    chest: 0x47b6a2,
    neck: 0xe0bd74,
    atlas: 0xe0bd74,
    head: 0xe8d5ad,
    jaw: 0xd9bc92,
  };
  for (const bone of bones) {
    const left: boolean = bone.startsWith("left");
    const bilateral: boolean = left || bone.startsWith("right");
    const side: string = bilateral ? bone.slice(left ? 4 : 5) : bone;
    colors[bone] = !bilateral
      ? (axial[bone] ?? 0xa8b8c4)
      : /UpperArm/.test(side)
        ? left
          ? 0xf09137
          : 0x427fd1
        : /LowerArm/.test(side)
          ? left
            ? 0xecbc37
            : 0x45b6d6
          : /UpperLeg/.test(side)
            ? left
              ? 0xd95a68
              : 0x775cc9
            : /LowerLeg/.test(side)
              ? left
                ? 0xed8c98
                : 0xa58ae4
              : /Foot|Subtalar|Midfoot|Toe|Hallux/.test(side)
                ? left
                  ? 0xeeb27b
                  : 0x92a9e6
                : /Hand|Thumb|Index|Middle|Ring|Little/.test(side)
                  ? left
                    ? 0xe8854c
                    : 0x50c0b4
                  : left
                    ? 0xf4b15c
                    : 0x72a6df;
  }
  return colors;
}
