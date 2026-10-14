import { IAutoMovieFilmTimeline } from "@automovie/interface";
import { filmEffectCue } from "./filmEffectCue";
/** Return the existing 48-frame, 24-fps film timeline with the same segment, provenance and track defaults. The default mist/haze cues are fresh and deliberately out of canonical order; a supplied effects array is retained by reference. */
export const filmEffectTimeline: (effects?: { id: string; recipe: "world-zone"; zone: string; startFrame: number; durationFrames: number; intensity: number; }[]) => IAutoMovieFilmTimeline = (
  effects: IAutoMovieFilmTimeline["tracks"]["effects"] = [
    filmEffectCue(),
    filmEffectCue({
      id: "haze",
      zone: "gate",
      startFrame: 0,
      durationFrames: 6,
      intensity: 1,
    }),
  ],
): IAutoMovieFilmTimeline => ({
  version: 1,
  builder: "test",
  inputFingerprint: `sha256:${"c".repeat(64)}`,
  sourceDigest: `sha256:${"d".repeat(64)}`,
  id: "film",
  fps: 24,
  totalFrames: 48,
  segments: [
    {
      shot: "shot",
      sourceInFrame: 0,
      sourceOutFrame: 48,
      startFrame: 0,
      endFrame: 48,
      headHandleFrames: 0,
      tailHandleFrames: 0,
      transitionIn: { kind: "cut" },
      transitionOut: { kind: "cut" },
    },
  ],
  omissions: [],
  tracks: { audio: [], captions: [], effects },
});
