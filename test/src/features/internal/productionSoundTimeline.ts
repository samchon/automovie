import type {
  IAutoMovieAudioCue,
  IAutoMovieFilmTimeline,
} from "@automovie/interface";

import { productionSoundDigest } from "./productionSoundDigest";

/**
 * The film that cues five tracks across four buses and one caption over that
 * shot.
 *
 * Cues start at or after the shot's forty-frame boundary, with source offsets
 * at zero. The muted track carries zero gain on the music bus, retaining a
 * silent contributor alongside the ordinary music, ambience, effects and
 * dialogue tracks.
 *
 * Behavior: Constructs the original 60-frame film, 40-frame shot trim, five
 * authored cue tracks across four buses and caption used by real
 * planning/mixing assertions. Expectation basis: The authored 20fps/60-frame
 * extent independently implies three seconds and 144000 native sample frames;
 * the fixed fixture digest is a marker rather than a computed provenance hash.
 * Cases: Retains music/ambience/effects/dialogue/muted cues, out-of-phase
 * starts and caption timing; cue ingress and rational phase tests own shorter
 * isolated plans. Execution: The existing owning entries call
 * productionSoundTimeline during their portable in-memory cases and retain
 * responsibility for assertion expectations and dynamically invoked predicates;
 * this helper acquires no asset, process, renderer or GPU and keeps no
 * completed-result cache.
 */
export function productionSoundTimeline(): IAutoMovieFilmTimeline {
  return {
    version: 1,
    builder: "test",
    inputFingerprint: productionSoundDigest,
    sourceDigest: productionSoundDigest,
    id: "film",
    fps: 20,
    totalFrames: 60,
    segments: [
      {
        shot: "sound-shot",
        sourceInFrame: 0,
        sourceOutFrame: 40,
        startFrame: 0,
        endFrame: 40,
        headHandleFrames: 0,
        tailHandleFrames: 0,
        transitionIn: { kind: "cut" },
        transitionOut: { kind: "cut" },
      },
    ],
    omissions: [],
    tracks: {
      audio: CUES.map(
        (
          [name, bus, gain]: [string, IAutoMovieAudioCue["bus"], number],
          index: number,
        ): IAutoMovieFilmTimeline["tracks"]["audio"][number] => ({
          id: `${name}-cue`,
          asset: `public/${name}.json`,
          sourceDurationFrames: 10,
          sourceOffsetFrame: 0,
          startFrame: 40 + index,
          durationFrames: 8,
          gain,
          fadeInFrames: 1,
          fadeOutFrames: 1,
          bus,
        }),
      ),
      captions: [
        {
          id: "line",
          text: "Advance.",
          language: "en-US",
          speaker: "captain",
          startFrame: 52,
          endFrame: 60,
        },
      ],
      effects: [],
    },
  };
}

/** Each cue's name, bus and gain; the muted cue is a silent music contributor. */
const CUES: ReadonlyArray<[string, IAutoMovieAudioCue["bus"], number]> = [
  ["music", "music", 0.25],
  ["ambience", "ambience", 0.25],
  ["effects", "effects", 0.25],
  ["dialogue", "dialogue", 0.25],
  ["muted", "music", 0],
];
