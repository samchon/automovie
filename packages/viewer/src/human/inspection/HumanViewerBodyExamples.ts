import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";

/**
 * Application-owned body parameter sets. The Human document owns channel and
 * joint semantics; this transport adds no geometry, range or acceptance rule.
 */
export type HumanViewerBodyExamples = Record<string,
  Pick<IAutoMovieHumanBodyBasisDocument, "shape" | "pose" | "shoulders" | "underwear">
>;
