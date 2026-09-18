import { AutoMovieScreenplayParticipantMode } from "./AutoMovieScreenplayParticipantMode";

/**
 * One stable story identity participating in one screenplay scene.
 *
 * @evidence requirements/story/scenes-and-observable-action.md#story-scene-participant-modes Separates stable participant identity from its scene-local mode.
 * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types the exact participant pair compared between index and prose.
 * @author Samchon
 */
export interface IAutoMovieScreenplayParticipant {
  /** Stable character, faction, object or environmental identity. */
  id: string;
  /** How that identity participates in this exact scene. */
  mode: AutoMovieScreenplayParticipantMode;
}
