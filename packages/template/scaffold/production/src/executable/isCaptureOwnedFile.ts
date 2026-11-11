/** A still's file name: `t<seconds>.png`, `t<seconds>-<view>.png`, or a numbered `f<number>.png` or `s<number>.png` whose number is padded to five digits and longer past 99999. */
const STILL: string = String.raw`(?:t\d+\.\d+(?:-[\w-]+)?|[fs](?:\d{5}|[1-9]\d{5,}))\.png`;

/** Every file name a capture run writes, anchored at both ends. */
const OWNED: RegExp = new RegExp(
  String.raw`^(?:${STILL}|diff-${STILL}|sheet-\d+\.\d+-\d+\.\d+\.png(?:\.json)?|manifest\.json|comparison\.json)$`,
  "u",
);

/**
 * Whether a file name is one a capture run writes, which the next run in the same folder replaces.
 *
 * Those are a still `t<seconds>.png` or `t<seconds>-<view>.png`, a numbered frame `f<number>.png` of a video run, a numbered still `s<number>.png` as FFmpeg decodes it, a difference image `diff-<still>` of any of those stills, a sheet `sheet-<seconds>-<seconds>.png` with its `.json` index, `manifest.json` and `comparison.json`. A number is padded to five digits and grows a digit past 99999. Every other name is left alone, the `rounds` folder among them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every owned form, how a number is written, and names what is left alone.
 * @evidence contracts/development/implementation.md#principled-implementation A run is replaced by the names this command writes, so kept rounds and a reader's own files beneath the folder survive every run.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pattern, anchored at both ends, in which a difference image is `diff-` before a still's name.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The whole name must match a written form, so a renamed copy of a still and a reader's own file that only starts with `sheet-` or `diff-` are not deleted, and a frame past the 99999th is owned like the ones before it.
 * @evidence contracts/development/implementation.md#efficient-algorithms One match per name against a pattern compiled once.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each name is matched once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a boolean and keeps nothing.
 */
export function isCaptureOwnedFile(name: string): boolean {
  return OWNED.test(name);
}
