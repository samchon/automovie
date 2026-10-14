import type { IAutoMovieScreenplayParticipant } from "@automovie/interface";



/**
 * Explicit scene authority decoded from its complete Markdown carrier.
 *
 * @evidence contracts/common.md#principled-implementation Stable location, story-time, participant identity/mode pairs and beat ids are explicit carrier values; no natural-language action, timing or treatment sentence is interpreted.
 * @evidence contracts/common.md#clear-and-simple-design parseScreenplayAuthority produces this typed carrier and screenplayProseDiagnostics compares it with the same scene index.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No word matching or timing lexicon can manufacture scene authority; duplicate or malformed carrier fields remain parser errors.
 * @evidence contracts/common.md#meaningful-documentation States exact explicit scene identities retained after carrier parsing.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The data type executes no parser or comparison.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The result type defines no cross-document cache or identity proof.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The parser caller owns its string arrays and participant records; the type opens no resource.
 */
export interface IAutoMovieParsedScreenplayAuthority {
  /** Authored location line of the authority block. */
  location: string;
  /** Authored story-time line of the authority block. */
  storyTime: string;
  /** Participants named in the authority block, with their roles. */
  participants: IAutoMovieScreenplayParticipant[];
  /** Beat lines in authored order. */
  beats: string[];
}
