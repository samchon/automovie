import { IAutoMovieSceneBeatCoverage } from "./IAutoMovieSceneBeatCoverage";
import { IAutoMovieSceneDisposition } from "./IAutoMovieSceneDisposition";
import { IAutoMovieScreenplayParticipant } from "./IAutoMovieScreenplayParticipant";

/** One indexed screenplay scene whose prose remains in Markdown. */
export interface IAutoMovieScreenplayScene {
  /**
   * Stable scene number, such as `SCN-010`.
   *
   * After lock, inserted scenes use the `SCN-A11` form and existing ids remain
   * forever addressable.
   */
  id: string;

  /** Human title following the exact id token in the Markdown heading. */
  title: string;

  /** Active prose scene or retained deletion tombstone. */
  status: "active" | "OMITTED";

  /**
   * Project-relative document holding this scene's prose, when the screenplay
   * is split one file per scene.
   *
   * Omit it while the screenplay is a single document; the index's
   * `screenplay.path` is then the address. An `OMITTED` tombstone has no prose
   * to hold, so it carries no path either.
   */
  path?: string;

  /** Exact treatment promises this scene realizes. */
  covers: IAutoMovieSceneBeatCoverage[];

  /** Existing location catalog id for an active scene. */
  location: string | null;

  /**
   * Exact story-time identity stated by the authoritative prose carrier.
   *
   * Use `unknown` when the story deliberately leaves the time unresolved. An
   * absent carrier is different from that explicit state and is refused.
   */
  storyTime: string;

  /** Exact scene-local participant identities and modes. */
  participants: IAutoMovieScreenplayParticipant[];

  /** Explicit local exemption from shot realization, or null when required. */
  disposition: IAutoMovieSceneDisposition | null;
}
