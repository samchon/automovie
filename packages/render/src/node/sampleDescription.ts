import type { IsoFileOptions, Sample } from "mp4box";

/**
 * The sample entry a parsed sample was coded under, as its four-character type
 * and its child boxes.
 *
 * The result has the shape mp4box's `addTrack` takes as `type` and
 * `description_boxes`, so a writer can open a track that decodes the copied
 * samples exactly as their source did. `boxes` is the parser's own array,
 * holding the parser's box objects, and an entry without child boxes reads as
 * a new empty array, so every writer and comparison in this entry handles one
 * shape. Callers must not mutate the returned boxes, which still belong to the
 * parsed file.
 *
 * @evidence contracts/common.md#principled-implementation An ISO sample entry is the decoder configuration of the samples that reference it, and mp4box attaches that entry to each sample as `description`; the type assertion names the two fields every video and audio sample entry carries, because mp4box types `description` as a union that also admits sample-group entries, which a track's samples never reference.
 * @evidence contracts/common.md#clear-and-simple-design Every writer that re-emits samples, the splice proofs and `sameSampleDescription` read a sample entry through this one projection, so the absent-boxes case is decided once.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The boxes are returned by reference, not rebuilt or filtered, and only an absent list is replaced by an empty one, which writes the same sample entry.
 * @evidence contracts/common.md#meaningful-documentation The doc states what the two fields are, that they match `addTrack`'s parameters, that the boxes are shared with the parsed file and must not be mutated, and how an absent list reads.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Two field reads and one small object allocation choose no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The projection is cheaper than any cache lookup, and callers that compare many samples already short-circuit on shared box identity in `sameSampleDescription`.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned object references the parser's box array, so it keeps the parsed sample entry alive for as long as the caller holds it; nothing else is retained or opened.
 */
export const sampleDescription: (sample: Sample) => {
  type: IsoFileOptions["type"];
  boxes: NonNullable<IsoFileOptions["description_boxes"]>;
} = (
  sample: Sample,
): {
  type: IsoFileOptions["type"];
  boxes: NonNullable<IsoFileOptions["description_boxes"]>;
} => {
  const description: {
    type: IsoFileOptions["type"];
    boxes?: IsoFileOptions["description_boxes"];
  } = sample.description as {
    type: IsoFileOptions["type"];
    boxes?: IsoFileOptions["description_boxes"];
  };
  return { type: description.type, boxes: description.boxes ?? [] };
};
