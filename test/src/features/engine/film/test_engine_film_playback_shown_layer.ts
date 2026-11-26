import {
  playbackLayersAt,
  playbackShownLayer,
  sequenceTimeline,
} from "@automovie/engine";
import type {
  IAutoMovieCaptionSidecar,
  IAutoMoviePlaybackLayer,
  IAutoMoviePlaybackTimeline,
  IAutoMovieSequence,
  IAutoMovieShot,
} from "@automovie/interface";
import { AutoMovieRenderCaption } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { TREE_SCRIPT } from "../../internal/TREE_SCRIPT";
import { throwsError } from "../../internal/predicates";

/** An authored empty-motion shot of the given id and length. */
function shot(id: string, duration: number): IAutoMovieShot {
  return {
    id,
    name: null,
    scene: "scene-room",
    camera: "cam-main",
    cameraMotion: null,
    performances: [],
    objectMotions: [],
    duration,
  };
}

/** Shot A of 3 s and shot B of 4 s. */
const SHOTS: IAutoMovieShot[] = [shot("shot:a", 3), shot("shot:b", 4)];

/**
 * A, then B through a one-second fade starting at 2 s, then A again through a
 * one-second cross dissolve starting at 5 s.
 */
const SEQUENCE: IAutoMovieSequence = {
  id: "seq",
  name: null,
  fps: 24,
  shots: [
    { shot: "shot:a", trim: null, transition: null },
    { shot: "shot:b", trim: null, transition: { kind: "fade", duration: 1 } },
    {
      shot: "shot:a",
      trim: null,
      transition: { kind: "crossDissolve", duration: 1 },
    },
  ],
};

/**
 * Every per-frame record follows the shot the picture shows most of: the layer
 * with the larger weight, the incoming one on a tie.
 *
 * Scenarios:
 *
 * 1. At a fade's quarter, 2.25 s, where only the outgoing shot is drawn at weight
 *    0.5, the shown layer is the outgoing A of entry 0.
 * 2. At the fade's three-quarter point, 2.75 s, where only the incoming shot is
 *    drawn at weight 0.5, the shown layer is the incoming B of entry 1.
 * 3. At a cross dissolve's quarter, 5.25 s, the outgoing B at 0.75 outweighs the
 *    incoming A at 0.25 and is shown.
 * 4. At the dissolve's midpoint, 5.5 s, both weigh 0.5 and the tie goes to the
 *    incoming A of entry 2.
 * 5. Outside a transition, at 1 s, the live shot is shown.
 * 6. The caption sidecar at 4 fps names, frame by frame, the shot each of those
 *    instants shows: frame 9 (2.25 s) A, frame 11 (2.75 s) B, frame 21 (5.25 s)
 *    B and frame 22 (5.5 s) A.
 * 7. No layers is refused.
 */
export function test_engine_film_playback_shown_layer(): void {
  const timeline: IAutoMoviePlaybackTimeline = sequenceTimeline(
    SEQUENCE,
    SHOTS,
  );
  const shown: (seconds: number) => [number, string] = (
    seconds: number,
  ): [number, string] => {
    const layer: IAutoMoviePlaybackLayer = playbackShownLayer(
      playbackLayersAt(SEQUENCE, timeline, seconds),
    );
    return [layer.entry, layer.shot];
  };
  TestValidator.equals("fade quarter shows the outgoing shot", shown(2.25), [
    0,
    "shot:a",
  ]);
  TestValidator.equals(
    "fade three-quarter shows the incoming shot",
    shown(2.75),
    [1, "shot:b"],
  );
  TestValidator.equals(
    "dissolve quarter shows the outgoing shot",
    shown(5.25),
    [1, "shot:b"],
  );
  TestValidator.equals(
    "dissolve midpoint ties to the incoming shot",
    shown(5.5),
    [2, "shot:a"],
  );
  TestValidator.equals("a plain instant shows the live shot", shown(1), [
    0,
    "shot:a",
  ]);

  // 6. The caption sidecar follows the same rule.
  const sidecar: IAutoMovieCaptionSidecar = AutoMovieRenderCaption.planSidecar({
    script: TREE_SCRIPT,
    sequence: SEQUENCE,
    shots: SHOTS,
    fps: 4,
  });
  const beatAt: (frame: number) => string | undefined = (
    frame: number,
  ): string | undefined =>
    sidecar.entries.find(
      (entry: IAutoMovieCaptionSidecar["entries"][number]): boolean =>
        entry.frameStart <= frame && frame < entry.frameEnd,
    )?.beat;
  TestValidator.equals(
    "captions name the shown shot",
    [beatAt(9), beatAt(11), beatAt(21), beatAt(22)],
    ["a", "b", "b", "a"],
  );

  // 7. Nothing to show.
  TestValidator.predicate(
    "no layers is refused",
    throwsError((): IAutoMoviePlaybackLayer => playbackShownLayer([])),
  );
}
