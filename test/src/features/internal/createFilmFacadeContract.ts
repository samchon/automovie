import type { IAutoMovieShotContract } from "@automovie/interface";

/** Preserve the existing facade camera contract and required subject. */
export const createFilmFacadeContract = (NODE: string): IAutoMovieShotContract => ({
  id: "shot-facade",
  beat: "beat",
  source: { module: "src/shots/facade.ts", export: "shot" },
  durationSeconds: 2,
  participants: [],
  opening: [],
  closing: [],
  camera: {
    intent: "hold the west facade",
    requiredSubjects: [NODE],
    maxOcclusionRatio: 1,
  },
  events: [],
  reviewFrames: [{ id: "mid", time: 1, passes: ["beauty"] }],
});
