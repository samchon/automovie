import { IAutoMovieDefinedShotContract } from "@automovie/interface";

/** The duel contract the door fixture compiles under. */
export const DOOR_CONTRACT: IAutoMovieDefinedShotContract = {
  beat: "beat-1",
  durationSeconds: 2,
  participants: [
    { kind: "actor", id: "knightA" },
    { kind: "actor", id: "knightB" },
  ],
  opening: [],
  closing: [],
  camera: {
    intent: "Keep the duel readable.",
    requiredSubjects: ["knightA", "knightB"],
    maxOcclusionRatio: 0.2,
  },
  events: [],
  reviewFrames: [{ id: "impact", time: 1, passes: ["beauty"] }],
};
