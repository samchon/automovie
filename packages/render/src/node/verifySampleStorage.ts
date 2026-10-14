import type { Sample, Track, createFile } from "mp4box";

/**
 * The parsed samples of `track`, after proving that each one maps to non-empty bytes inside `bytes` and inside one parsed media-data box.
 *
 * The sample count must equal the track's declared `nb_samples` and be positive. Throws `MP4 sample table does not map every declared sample to non-empty resident bytes.` for a count mismatch, an empty sample or a range outside `bytes`, and `MP4 samples are not fully backed by parsed media-data boxes.` when the file has no media-data box or a sample is not wholly inside one. The video and audio readings both depend on it, because a sample table that points outside the file, or at bytes no media box holds, would otherwise be reported as delivered media.
 *
 * @evidence contracts/common.md#principled-implementation ISO media data lives in top-level `mdat` boxes, so a sample is resident when its byte range lies inside one box's payload, between the box start plus header and the box end; the boxes are read from `file.mdats`, which the parser fills in file order as it reads consecutive top-level boxes, so their payload ranges are sorted and disjoint and the only candidate for a sample is the last box starting at or before it.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the residency proof that `probeVideoTrack` and the audio-track reading both need, and returns the sample table so neither caller asks the parser for it twice.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No sample or box is special-cased, and a range is never clamped; any sample outside the media boxes refuses the whole track.
 * @evidence contracts/common.md#meaningful-documentation The doc states what is returned, the count condition, both refusals with their messages and triggers, and why residency matters to the probes.
 * @evidence contracts/performance.md#efficient-algorithms For S samples and M media boxes, constructing the ranges costs O(M), the bounds pass costs O(S), and each sample finds its box by binary search, giving O(M + S log(M + 1)) time and O(M) temporary storage. A file written by mp4box's fragment writer carries one media box per sample, where scanning every box for every sample would be quadratic.
 * @evidence contracts/performance.md#reuse-equivalent-work Returns the parser-owned sample table for the caller's subsequent reading instead of fetching it again. Each invocation rebuilds the file-wide media ranges, including separate video and audio readings of one feature; no range cache or prior residency verdict is shared across those calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The range array of M entries lives for the call; the returned sample array is the parser's own and stays owned by `file`, and no handle or task is opened.
 */
export const verifySampleStorage: (bytes: Uint8Array, file: ReturnType<typeof createFile>, track: Track) => Sample[] = (
  bytes: Uint8Array,
  file: ReturnType<typeof createFile>,
  track: Track,
): Sample[] => {
  const samples: Sample[] = file.getTrackSamplesInfo(track.id) ?? [];
  if (
    samples.length === 0 ||
    samples.length !== track.nb_samples ||
    samples.some(
      (sample: Sample): boolean =>
        sample.size <= 0 ||
        sample.offset < 0 ||
        sample.offset + sample.size > bytes.byteLength,
    )
  )
    throw new Error(
      "MP4 sample table does not map every declared sample to non-empty resident bytes.",
    );
  const ranges: Array<{ start: number; end: number }> = file.mdats.map(
    (box: { start?: number; hdr_size?: number; size: number }): { start: number; end: number } => ({
      start: box.start! + box.hdr_size!,
      end: box.start! + box.size,
    }),
  );
  if (
    ranges.length === 0 ||
    samples.some(
      (sample: Sample): boolean =>
        resident(ranges, sample.offset, sample.offset + sample.size) === false,
    )
  )
    throw new Error(
      "MP4 samples are not fully backed by parsed media-data boxes.",
    );
  return samples;
};

/** Whether `[start, end)` lies inside the last of the sorted `ranges` starting at or before `start`. */
const resident: (ranges: ReadonlyArray<{
    start: number;
    end: number;
}>, start: number, end: number) => boolean = (
  ranges: ReadonlyArray<{ start: number; end: number }>,
  start: number,
  end: number,
): boolean => {
  let low: number = 0;
  let high: number = ranges.length - 1;
  let candidate: number = -1;
  while (low <= high) {
    const middle: number = (low + high) >>> 1;
    if (ranges[middle]!.start <= start) {
      candidate = middle;
      low = middle + 1;
    } else high = middle - 1;
  }
  return candidate >= 0 && end <= ranges[candidate]!.end;
};
