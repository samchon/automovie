import {
  cutSequence,
  performShot,
  preparePlaybackTimeline,
  sequenceEditorialMarkerTimeline,
  stageScene,
  validateShotArtifact,
} from "@automovie/engine";
import type {
  IAutoMovieEditorialMarker,
  IAutoMoviePlaybackEditorialMarker,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../../../internal/filmFixtures";
import { createSkeleton } from "../../../internal/fixtures";
import { nclose } from "../../../internal/predicates";

/**
 * Authored editorial markers retain their identity and map onto each kept play.
 *
 * Scenarios:
 * 1. Preserve source endpoints and labels after compiling the performance.
 * 2. Clip a range across two-sided trims, place a seam point once per retained play and sort across a dissolve and replay.
 * 3. Refuse duplicate ids, blank labels and invalid endpoints at both the authoring and artifact boundaries.
 */
export function test_unit_engine_film_film_editorial_markers(): void {
  const script: ReturnType<typeof makeScriptWrite> = makeScriptWrite();
  const staged: ReturnType<typeof stageScene> = stageScene(
    script,
    makeStagingWrite(),
  );
  if (staged.success !== true) throw new Error("staging must succeed");

  const authored: IAutoMovieEditorialMarker[] = [
    {
      id: "window",
      label: "Dialogue window",
      startSeconds: 0.25,
      endSeconds: 1.75,
    },
    { id: "seam", label: "Reply", startSeconds: 0.75, endSeconds: 0.75 },
    { id: "outgoing", label: "Look", startSeconds: 0.7, endSeconds: 0.7 },
    { id: "trim-end", label: "Pause", startSeconds: 1.5, endSeconds: 1.5 },
    { id: "touch", label: "After the trim", startSeconds: 1.5, endSeconds: 2 },
  ];
  const props: Omit<Parameters<typeof performShot>[0], "performance"> = {
    script,
    staged,
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  };
  const performed: ReturnType<typeof performShot> = performShot({
    ...props,
    performance: makePerformanceWrite({ editorialMarkers: authored }),
  });
  if (performed.success !== true) throw new Error("performance must succeed");
  const shot: typeof performed.shot = performed.shot;
  TestValidator.equals(
    "labels survive compilation",
    shot.editorialMarkers?.map(
      (marker: IAutoMovieEditorialMarker): string => marker.label,
    ),
    ["Dialogue window", "Reply", "Look", "Pause", "After the trim"],
  );
  TestValidator.predicate(
    "compiled list and records are owned by the shot",
    shot.editorialMarkers !== authored &&
      shot.editorialMarkers?.[0] !== authored[0],
  );

  const cut: ReturnType<typeof cutSequence> = cutSequence(
    {
      sequence: { id: "markers", name: "Editorial markers" },
      fps: 24,
      pacing: "Let the dialogue overlap.",
      continuity: "Repeat the retained reply.",
      entries: [
        { shot: shot.id, trim: { start: 0, duration: 0.75 }, transition: null },
        {
          shot: shot.id,
          trim: { start: 0.75, duration: 0.75 },
          playbackRate: 2,
          transition: { kind: "crossDissolve", duration: 0.125 },
        },
        {
          shot: shot.id,
          trim: { start: 0.75, duration: 0.75 },
          playbackRate: 2,
          transition: null,
        },
      ],
    },
    [shot],
  );
  if (cut.success !== true) throw new Error("cut must succeed");
  const placements: IAutoMoviePlaybackEditorialMarker[] =
    sequenceEditorialMarkerTimeline(
      cut.sequence,
      preparePlaybackTimeline(cut.sequence, [shot]),
    );
  const expected: readonly [
    id: string,
    entry: number,
    sourceStart: number,
    sourceEnd: number,
    outputStart: number,
    outputEnd: number,
  ][] = [
    ["window", 0, 0.25, 0.75, 0.25, 0.75],
    ["seam", 1, 0.75, 0.75, 0.625, 0.625],
    ["window", 1, 0.75, 1.5, 0.625, 1],
    ["outgoing", 0, 0.7, 0.7, 0.7, 0.7],
    ["seam", 2, 0.75, 0.75, 1, 1],
    ["window", 2, 0.75, 1.5, 1, 1.375],
  ];
  TestValidator.equals(
    "retained placement count",
    placements.length,
    expected.length,
  );
  for (const [
    index,
    [id, entry, sourceStart, sourceEnd, outputStart, outputEnd],
  ] of expected.entries()) {
    const marker: IAutoMoviePlaybackEditorialMarker | undefined =
      placements[index];
    TestValidator.predicate(
      `placement ${index}: ${id} on play ${entry}`,
      marker?.id === id &&
        marker.entry === entry &&
        marker.shot === shot.id &&
        nclose(marker.retainedStartSeconds, sourceStart) &&
        nclose(marker.retainedEndSeconds, sourceEnd) &&
        nclose(marker.outputStartSeconds, outputStart) &&
        nclose(marker.outputEndSeconds, outputEnd),
    );
  }

  TestValidator.predicate(
    "replayed window keeps original source endpoints",
    nclose(placements[5]!.startSeconds, 0.25) &&
      nclose(placements[5]!.endSeconds, 1.75),
  );

  const invalid: IAutoMovieEditorialMarker[] = [
    authored[0]!,
    { id: "window", label: " ", startSeconds: 2, endSeconds: 1 },
    {
      id: "nonfinite",
      label: "Unplayable",
      startSeconds: 1,
      endSeconds: Infinity,
    },
  ];
  const rejected: ReturnType<typeof performShot> = performShot({
    ...props,
    performance: makePerformanceWrite({ editorialMarkers: invalid }),
  });
  const artifact: ReturnType<typeof validateShotArtifact> =
    validateShotArtifact(
      { ...shot, editorialMarkers: invalid },
      staged.scene,
      null,
    );
  const paths: string[] = [
    "$input.editorialMarkers[1].label",
    "$input.editorialMarkers[1].id",
    "$input.editorialMarkers[1].startSeconds",
    "$input.editorialMarkers[1].endSeconds",
    "$input.editorialMarkers[2].endSeconds",
  ];
  for (const [boundary, result] of [
    ["authoring", rejected],
    ["stored artifact", artifact],
  ] as const)
    TestValidator.equals(
      boundary + " rejection fields",
      result.success ? [] : result.violations.map((item): string => item.path),
      paths,
    );
}
