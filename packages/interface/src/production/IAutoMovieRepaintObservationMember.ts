import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * Exact deterministic or selected-repaint member of one sequence observation.
 * @evidence requirements/repaint/sequence-continuity-and-publication.md#repaint-temporal-artifacts Seals every ordered occurrence observed together.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-structure-continuity Preserves lane-specific member identity.
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
