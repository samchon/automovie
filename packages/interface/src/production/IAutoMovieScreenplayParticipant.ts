import { AutoMovieScreenplayParticipantMode } from "./AutoMovieScreenplayParticipantMode";

/**
 * One stable story identity participating in one screenplay scene.
 *
 * @evidence contracts/common.md#principled-implementation The scene records the exact story participant id and its explicit participation mode; downstream cast and scene validation can resolve that identity without inferring presence from similar prose or model names.
 * @evidence contracts/common.md#clear-and-simple-design A two-field entry separates story identity from how it participates in this scene, leaving reusable model and formation binding in the catalog.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A participation mode does not prove staged visibility, motion or sound; those outcomes are authored and measured at their downstream seams.
 * @evidence contracts/common.md#meaningful-documentation Defines stable character, faction, object or environment identity and its scene-local participation mode.
 * @author Samchon
 */
export interface IAutoMovieScreenplayParticipant {
  /** Stable character, faction, object or environmental identity. */
  id: string;

  /** How that identity participates in this exact scene. */
  mode: AutoMovieScreenplayParticipantMode;
}
