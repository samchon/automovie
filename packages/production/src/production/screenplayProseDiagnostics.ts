import type { AutoMovieDiagnosticCode, IAutoMovieDiagnostic, IAutoMovieScreenplayIndex, IAutoMovieScreenplayParticipant } from "@automovie/interface";
import { compareCodeUnits } from "./contentIdentity";
import type { IAutoMovieParsedScreenplayScene } from "./IAutoMovieParsedScreenplayScene";
import { parseScreenplayProse } from "./parseScreenplayProse";
const AUTHORITY_START: string = "@automovie-scene";

/**
 * Join authored Markdown scene identities and explicit carriers to their index.
 *
 * Mixed whole/split layouts read each addressed scene document once. The join
 * verifies heading identity/title, nonempty active bodies and exact declared
 * place, story time, participant modes and beat ids. It does not judge prose
 * quality or compare treatment sentences, word counts or natural-language time.
 *
 * @evidence contracts/common.md#principled-implementation Parsed stable headings and complete explicit carriers are joined by scene identity; ordered-independent participant and beat populations use exact sorted identity comparisons, while active/omitted state controls whether live authority is required.
 * @evidence contracts/common.md#clear-and-simple-design Markdown parsing owns lexical structure and this diagnostic owner compares only typed scene metadata; ledger admission separately owns stable-id coverage, catalogs and lock history.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Prose content cannot certify exact treatment coverage or physical timing, fenced/comment metadata cannot satisfy a missing body, and a carrier in another scene cannot discharge this scene's identities.
 * @evidence contracts/common.md#meaningful-documentation States supported mixed layout, exact semantic comparisons, active/tombstone differences and the limits of prose admission.
 * @evidence contracts/performance.md#efficient-algorithms For S scenes, B addressed text bytes and P total carrier entries, reads and parsing are cached per document while owned scene filtering visits the relevant parsed sections; sorting each identity population adds O(P log P) worst-case comparisons. A shared document with many owned scenes still incurs repeated section filtering, and diagnostic strings scale with findings.
 * @evidence contracts/performance.md#reuse-equivalent-work Per-call maps reuse each document text, absence and parsed sections across scenes; no cross-call cache assumes authored Markdown unchanged. Equal carrier populations compare independently of entry order.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Document text, parsed section maps and findings are local to this review call and scale with addressed prose without a fixed byte cap; the read callback owns file handles and only diagnostics transfer to the build attempt.
 */
export function screenplayProseDiagnostics(props: {
  screenplay: IAutoMovieScreenplayIndex | null;
  read: (relativePath: string) => string | null;
}): IAutoMovieDiagnostic[] {
  const screenplay: IAutoMovieScreenplayIndex | null = props.screenplay;
  if (screenplay === null) return [];
  const diagnostics: IAutoMovieDiagnostic[] = [];
  function refuse(code: AutoMovieDiagnosticCode, message: string, path: string | null): void {
    diagnostics.push({
      code,
      category: "error",
      phase: "compile",
      target: "screenplay",
      path,
      message,
    });
  }
  const documents: Map<string, string | null> = new Map<string, string | null>();
  function read(relativePath: string): string | null {
    if (documents.has(relativePath)) return documents.get(relativePath)!;
    const content: string | null = props.read(relativePath);
    documents.set(relativePath, content);
    if (content === null)
      refuse(
        "screenplay-document-absent",
        `The screenplay index addresses "${relativePath}", which is not a readable project file. The index dangles from prose nobody can open. Restore the document or correct the path, then compile again.`,
        relativePath,
      );
    return content;
  }

  // --- Scene headings ------------------------------------------------------
  const owned: Map<string, string> = new Map<string, string>();
  for (const scene of screenplay.screenplay.scenes)
    if (scene.path !== undefined && scene.path.trim().length !== 0)
      owned.set(scene.id, scene.path);
  const headings: Map<string, IAutoMovieParsedScreenplayScene[]> = new Map<string, IAutoMovieParsedScreenplayScene[]>();
  const headingPath: Map<string, string> = new Map<string, string>();
  const parsedDocuments: Map<string, IAutoMovieParsedScreenplayScene[]> = new Map<string, IAutoMovieParsedScreenplayScene[]>();
  function collect(documentPath: string, only?: string): void {
    const content: string | null = read(documentPath);
    if (content === null) return;
    let parsedSections: IAutoMovieParsedScreenplayScene[] | undefined = parsedDocuments.get(documentPath);
    if (parsedSections === undefined) {
      parsedSections = parseScreenplayProse(content);
      parsedDocuments.set(documentPath, parsedSections);
    }
    for (const parsed of parsedSections) {
      if (only !== undefined && parsed.id !== only) continue;
      if (only === undefined && owned.has(parsed.id)) continue;
      headings.set(parsed.id, [...(headings.get(parsed.id) ?? []), parsed]);
      headingPath.set(parsed.id, documentPath);
    }
  }
  collect(screenplay.screenplay.path);
  for (const [id, documentPath] of owned) collect(documentPath, id);

  const declared: Set<string> = new Set(
    screenplay.screenplay.scenes.map((scene: IAutoMovieScreenplayIndex["screenplay"]["scenes"][number]): string => scene.id),
  );
  for (const [id, entries] of headings) {
    const documentPath: string = headingPath.get(id)!;
    if (entries.length !== 1) {
      refuse(
        "screenplay-heading-repeated",
        `Scene id "${id}" heads ${entries.length} sections of "${documentPath}". One stable id must occur on exactly one heading line, or a downstream citation cannot say which prose it cites. Keep one heading and compile again.`,
        documentPath,
      );
      continue;
    }
    if (declared.has(id) === false)
      refuse(
        "screenplay-heading-unindexed",
        `"${documentPath}" heads a scene "${id}" the index does not declare. Downstream records cannot cite an unindexed scene, so this prose is unreachable. Add it to the index or remove the heading, then compile again.`,
        documentPath,
      );
  }
  for (const scene of screenplay.screenplay.scenes) {
    const documentPath: string = owned.get(scene.id) ?? screenplay.screenplay.path;
    if (documents.get(documentPath) === null) continue;
    const entries: IAutoMovieParsedScreenplayScene[] = headings.get(scene.id) ?? [];
    if (entries.length === 0) {
      refuse(
        "screenplay-heading-absent",
        `Scene "${scene.id}" is indexed, but "${documentPath}" heads no such scene. Downstream citations dangle from the human screenplay. Restore the heading and compile again.`,
        documentPath,
      );
      continue;
    }
    if (entries.length !== 1) continue;
    const entry: IAutoMovieParsedScreenplayScene = entries[0]!;
    if (entry.title !== scene.title)
      refuse(
        "screenplay-heading-retitled",
        `Scene "${scene.id}" is titled "${scene.title}" in the index and "${entry.title}" in "${documentPath}". Human prose and machine identity have diverged, so neither can be trusted to name the other. Make the titles exact and compile again.`,
        documentPath,
      );
    if (scene.status === "active" && entry.body.trim().length === 0)
      refuse(
        "screenplay-scene-unwritten",
        `Active scene "${scene.id}" has a heading in "${documentPath}" and no prose beneath it. A heading-only ledger entry cannot satisfy authored dramatic work. Write the scene and compile again.`,
        documentPath,
      );
    if (entry.authorityErrors.length !== 0)
      refuse(
        "screenplay-scene-authority-invalid",
        `Scene "${scene.id}" has an invalid ${AUTHORITY_START} carrier in "${documentPath}": ${entry.authorityErrors.join("; ")}. Correct the bounded carrier rather than asking the builder to infer action prose, then compile again.`,
        documentPath,
      );
    if (scene.status === "OMITTED") {
      if (entry.authority !== null)
        refuse(
          "screenplay-scene-authority-unexpected",
          `OMITTED scene "${scene.id}" still declares an active authority carrier in "${documentPath}". A permanent tombstone has identity but no live place, time, participant or beat claim. Remove the carrier or reactivate the scene, then compile again.`,
          documentPath,
        );
      continue;
    }
    if (entry.authority === null) {
      refuse(
        "screenplay-scene-authority-absent",
        `Active scene "${scene.id}" has no complete ${AUTHORITY_START} carrier immediately below its heading in "${documentPath}". Declare location, story-time, participants and beat identities there so prose and index have one deterministic join, then compile again.`,
        documentPath,
      );
      continue;
    }
    if (entry.authority.location !== scene.location)
      refuse(
        "screenplay-scene-location-conflict",
        `Scene "${scene.id}" names location "${scene.location}" in the index and "${entry.authority.location}" in authoritative prose. Stable ids compare exactly; repair the record that is wrong, then compile again.`,
        documentPath,
      );
    if (entry.authority.storyTime !== scene.storyTime)
      refuse(
        "screenplay-scene-story-time-conflict",
        `Scene "${scene.id}" names story time "${scene.storyTime}" in the index and "${entry.authority.storyTime}" in authoritative prose. Explicit unknown matches only explicit unknown, so repair the record that is wrong, then compile again.`,
        documentPath,
      );
    function participantKey(participant: IAutoMovieScreenplayParticipant): string {
  return `${participant.id}\u0000${participant.mode}`;
}
    const indexedParticipants: string[] = scene.participants
      .map(participantKey)
      .sort(compareCodeUnits);
    const proseParticipants: string[] = entry.authority.participants
      .map(participantKey)
      .sort(compareCodeUnits);
    if (
      indexedParticipants.length !== proseParticipants.length ||
      indexedParticipants.some(
        (participant: string, index: number): boolean => participant !== proseParticipants[index],
      )
    )
      refuse(
        "screenplay-scene-participant-conflict",
        `Scene "${scene.id}" participants differ between index [${indexedParticipants.join(", ")}] and authoritative prose [${proseParticipants.join(", ")}]. Compare each stable identity and mode inside this scene, then compile again.`,
        documentPath,
      );
    const indexedBeats: string[] = scene.covers
      .map((coverage: IAutoMovieScreenplayIndex["screenplay"]["scenes"][number]["covers"][number]): string => coverage.id)
      .sort(compareCodeUnits);
    const proseBeats: string[] = [...entry.authority.beats].sort(compareCodeUnits);
    if (
      indexedBeats.length !== proseBeats.length ||
      indexedBeats.some((beat: string, index: number): boolean => beat !== proseBeats[index])
    )
      refuse(
        "screenplay-scene-beat-conflict",
        `Scene "${scene.id}" beat identities differ between index [${indexedBeats.join(", ")}] and authoritative prose [${proseBeats.join(", ")}]. A same sentence in another scene cannot discharge this join. Correct the exact scene carrier, then compile again.`,
        documentPath,
      );
  }
  return diagnostics;
}
