import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";

/**
 * Application-owned body parameter sets. The Human document owns channel and
 * joint semantics; this transport adds no geometry, range or acceptance rule.
 *
 * @evidence contracts/common.md#principled-implementation The examples retain the Human document's existing shape, pose and shoulder inputs without a second schema.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes application content from Human numerical authority.
 *
 * @evidence contracts/common.md#clear-and-simple-design Only the shape, pose, shoulders and underwear channels needed by catalogue composition are projected from the Human document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Named parameter sets are supplied by the application; this transport embeds no example person or numerical fitting rule.
 */
export type HumanViewerBodyExamples = Record<string,
  Pick<IAutoMovieHumanBodyBasisDocument, "shape" | "pose" | "shoulders" | "underwear">
>;
