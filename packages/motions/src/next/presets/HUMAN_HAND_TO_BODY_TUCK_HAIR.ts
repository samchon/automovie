import type { IAutoMovieMotionHumanHandToBody } from "@automovie/interface";

/*
 * The tuck-hair preset: one stroke of the relaxed index fingertip to the right
 * ear (mirrored for the left hand), from 0.065 up and 0.135 forward of the ear
 * to 0.018 up, 0.055 behind and 0.035 out of it, in shares of the arm's length.
 * Spread into the arm phrase's parameters; the `tuckHair` row fixes these
 * values. The grooming action is described in
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC6137092/; the offsets are
 * provisional, and the slightly outward end offset clears the head as the
 * fingertip passes the ear landmark.
 */
export const HUMAN_HAND_TO_BODY_TUCK_HAIR: IAutoMovieMotionHumanHandToBody.ITuckHairPreset =
  {
    phrase: "stroke",
    target: { kind: "self", region: "earRight" },
    mirror: true,
    surface: "indexTip",
    shape: "relaxed",
    offset: { out: 0.035, up: 0.018, forward: -0.055 },
    from: { out: 0, up: 0.065, forward: 0.135 },
  };
