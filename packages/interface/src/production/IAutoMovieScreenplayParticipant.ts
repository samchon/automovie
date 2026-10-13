import { AutoMovieScreenplayParticipantMode } from "./AutoMovieScreenplayParticipantMode";

/**
 * One stable story identity participating in one screenplay scene.
 *
 * @author Samchon
 */
export interface IAutoMovieScreenplayParticipant {
  /** Stable character, faction, object or environmental identity. */
  id: string;

  /** How that identity participates in this exact scene. */
  mode: AutoMovieScreenplayParticipantMode;
}
