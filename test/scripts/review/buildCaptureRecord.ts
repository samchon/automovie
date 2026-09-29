import { createHash } from "node:crypto";

/** One frame the runner drew, identified without its pixels. */
export interface IReviewCapture {
  /** The document state that was applied. */
  state: string;

  /** The named view the camera stood at. */
  view: string;

  /** The pass the subject was drawn as. */
  pass: string;

  /** File name under the run's output directory. */
  file: string;

  /** SHA-256 of the PNG bytes, lowercase hex. */
  sha256: string;
}

/**
 * The record of one review run: what was drawn, on which device, from which
 * source, and an identity for every frame, without any image bytes.
 *
 * Renders never go into the repository, so the record carries their digests
 * instead: enough to say later that a frame is the one a claim was written
 * about, or that it has since changed, and never enough to reconstruct it.
 * `renderer` is the unmasked device string the page reported, kept verbatim
 * so a reader can see what was accepted as a GPU. `revision` and `humanBuild`
 * name the source and the browser build the frames came from, so a record
 * whose revision no longer matches the tree reads as old. Frames are listed in
 * the order they were drawn; the digest is computed here from the bytes, not
 * supplied, so a record cannot name a digest its bytes do not have.
 *
 * @param input The device, the source identity and the frames with their bytes.
 */
export function buildCaptureRecord(input: {
  kind: "body" | "face";
  renderer: string;
  revision: string;
  humanBuildFresh: boolean;
  frames: {
    state: string;
    view: string;
    pass: string;
    file: string;
    bytes: Uint8Array;
  }[];
}): {
  kind: "body" | "face";
  renderer: string;
  revision: string;
  humanBuildFresh: boolean;
  captures: IReviewCapture[];
} {
  return {
    kind: input.kind,
    renderer: input.renderer,
    revision: input.revision,
    humanBuildFresh: input.humanBuildFresh,
    captures: input.frames.map(({ bytes, ...frame }) => ({
      ...frame,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    })),
  };
}
