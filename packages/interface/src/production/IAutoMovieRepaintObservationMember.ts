import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * Exact deterministic or selected-repaint member of one sequence observation.
 */
export type IAutoMovieRepaintObservationMember =
  | {
      occurrence: string;
      shot: string;
      lane: "deterministic";
      sourceDigest: AutoMovieContentDigest;
    }
  | {
      occurrence: string;
      shot: string;
      lane: "repainted";
      requestId: string;
      attemptId: string;
      outputDigest: AutoMovieContentDigest;
      candidateReceiptDigest: AutoMovieContentDigest;
      selectionId: string;
      selectionDigest: AutoMovieContentDigest;
    };
