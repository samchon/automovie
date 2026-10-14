import type { AutoMovieScreenplayParticipantMode, IAutoMovieScreenplayParticipant } from "@automovie/interface";
import type { IAutoMovieParsedScreenplayAuthority } from "./IAutoMovieParsedScreenplayAuthority";

const AUTHORITY_START: string = "@automovie-scene";
const AUTHORITY_END: string = "@end-automovie-scene";
const PARTICIPANT_MODES: ReadonlySet<AutoMovieScreenplayParticipantMode> = new Set(["on-screen","off-screen","crowd","object","environmental","referenced"]);

/**
 * Decode the explicit bounded scene carrier without interpreting surrounding prose.
 *
 * @evidence contracts/common.md#principled-implementation Only the first nonblank carrier-start line selects grammar; a matching end is required and named fields/participant modes are checked for required values, repetition and exact identity spelling.
 * @evidence contracts/common.md#clear-and-simple-design The complete scene parser supplies section lines and consumes authority/errors/body; carrier grammar stays separate from document-heading boundaries and later semantic index joining.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed carrier lines remain explicit errors, unknown fields are not inferred from prose, and absent carriers return null without inventing place/time/participants.
 * @evidence contracts/common.md#meaningful-documentation States bounded carrier grammar, absent selection and retained malformed-field findings.
 * @evidence contracts/performance.md#efficient-algorithms For B section text, P participants and K beat ids, bounded scanning plus duplicate sets costs O(B+P+K), while body reconstruction retains the surrounding text; no document or geometry is reread.
 * @evidence contracts/performance.md#reuse-equivalent-work The scene section is parsed once and its result is shared with diagnostics; no answer is cached across changing documents.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned carrier arrays, errors and body transfer to the document parse; temporary lists/sets remain call-local and no handle is acquired.
 */
export function parseScreenplayAuthority(lines: string[]): {
  authority: IAutoMovieParsedScreenplayAuthority | null;
  errors: string[];
  body: string;
} {
  const first: number = lines.findIndex((line: string): boolean => line.trim().length !== 0);
  if (first === -1 || lines[first]!.trim() !== AUTHORITY_START)
    return { authority: null, errors: [], body: lines.join("\n") };
  const end: number = lines.findIndex(
    (line: string, index: number): boolean => index > first && line.trim() === AUTHORITY_END,
  );
  if (end === -1)
    return {
      authority: null,
      errors: [`${AUTHORITY_START} has no ${AUTHORITY_END}`],
      body: lines.join("\n"),
    };
  const errors: string[] = [];
  let location: string | undefined;
  let storyTime: string | undefined;
  const participants: IAutoMovieScreenplayParticipant[] = [];
  const beats: string[] = [];
  for (const source of lines.slice(first + 1, end)) {
    const line: string = source.trim();
    if (line.length === 0) continue;
    const separator: number = line.indexOf(":");
    if (separator === -1) {
      errors.push(`authority line "${line}" has no field separator`);
      continue;
    }
    const key: string = line.slice(0, separator).trim();
    const value: string = line.slice(separator + 1).trim();
    if (key === "location") {
      if (location !== undefined) errors.push("location is declared twice");
      else location = value;
    } else if (key === "story-time") {
      if (storyTime !== undefined) errors.push("story-time is declared twice");
      else storyTime = value;
    } else if (key === "participant") {
      const split: number = value.lastIndexOf(" ");
      const id: string = split === -1 ? "" : value.slice(0, split).trim();
      const mode: string = split === -1 ? "" : value.slice(split + 1).trim();
      if (
        id.length === 0 ||
        PARTICIPANT_MODES.has(mode as AutoMovieScreenplayParticipantMode) ===
          false
      )
        errors.push(`participant "${value}" has no valid identity and mode`);
      else
        participants.push({
          id,
          mode: mode as AutoMovieScreenplayParticipantMode,
        });
    } else if (key === "beat") {
      if (value.length === 0) errors.push("beat identity is blank");
      else beats.push(value);
    } else errors.push(`authority field "${key}" is not supported`);
  }
  if (location === undefined || location.length === 0)
    errors.push("location is absent or blank");
  if (storyTime === undefined || storyTime.length === 0)
    errors.push("story-time is absent or blank");
  const participantKeys: string[] = participants.map(
    (participant: IAutoMovieScreenplayParticipant): string => `${participant.id}\u0000${participant.mode}`,
  );
  if (new Set(participantKeys).size !== participantKeys.length)
    errors.push("a participant identity and mode pair is repeated");
  if (new Set(beats).size !== beats.length)
    errors.push("a beat identity is repeated");
  return {
    authority:
      location === undefined || storyTime === undefined
        ? null
        : { location, storyTime, participants, beats },
    errors,
    body: [...lines.slice(0, first), ...lines.slice(end + 1)].join("\n"),
  };
}
