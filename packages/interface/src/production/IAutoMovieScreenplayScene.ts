import { IAutoMovieSceneBeatCoverage } from "./IAutoMovieSceneBeatCoverage";
import { IAutoMovieSceneDisposition } from "./IAutoMovieSceneDisposition";
import { IAutoMovieScreenplayParticipant } from "./IAutoMovieScreenplayParticipant";

/**
 * One stable screenplay scene or permanent deletion tombstone whose narrative prose remains in Markdown.
 *
 * @evidence contracts/common.md#principled-implementation A scene record carries authored coverage, location, story time and participation beside an active-or-OMITTED status; the flat interface does not validate joins or constrain other fields by status.
 * @evidence contracts/common.md#clear-and-simple-design The scene ledger stores addressable semantic relationships and an optional per-scene document path; full narrative prose remains in its authoritative document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Tombstone path omission and explicit unknown story time are documented conventions; this declaration neither refuses malformed carriers nor proves downstream shot realization.
 * @evidence contracts/common.md#meaningful-documentation Defines stable numbering and insertion form, title, active/tombstone status, split-document addressing, exact promises, location, story time, participants and local exemption.
 * @author Samchon
 */
export interface IAutoMovieScreenplayScene {
  /**
   * Stable scene number, such as `SCN-010`.
   *
   * After lock, inserted scenes use the `SCN-A11` form and existing ids remain forever addressable.
   */
  id: string;

  /** Human title following the exact id token in the Markdown heading. */
  title: string;

  /** Active prose scene or retained deletion tombstone. */
  status: "active" | "OMITTED";

  /**
   * Project-relative document holding this scene's prose, when the screenplay is split one file per scene.
   *
   * Omit it while the screenplay is a single document; the index's `screenplay.path` is then the address. An `OMITTED` tombstone has no prose to hold, so it carries no path either.
   */
  path?: string;

  /** Exact treatment promises this scene realizes. */
  covers: IAutoMovieSceneBeatCoverage[];

  /** Existing location catalog id for an active scene. */
  location: string | null;

  /**
   * Exact story-time identity stated by the authoritative prose carrier.
   *
   * Use `unknown` when the story deliberately leaves the time unresolved. The string field does not verify that the prose carrier exists or states this value.
   */
  storyTime: string;

  /** Exact scene-local participant identities and modes. */
  participants: IAutoMovieScreenplayParticipant[];

  /** Explicit local exemption from shot realization, or null when required. */
  disposition: IAutoMovieSceneDisposition | null;
}
