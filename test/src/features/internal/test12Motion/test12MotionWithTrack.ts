import { test12MotionInspect } from "./test12MotionInspect";

/**
 * Replace only the first take's tracks in a shallow inspection copy to exercise the existing unsupported-track adoption boundaries.
 */
export function test12MotionWithTrack(inspection: ReturnType<typeof test12MotionInspect>, track: NonNullable<
    ReturnType<typeof test12MotionInspect>["motion"]
  >["takes"][number]["tracks"][number]): ReturnType<typeof test12MotionInspect> { return ({
  ...inspection,
  motion: {
    ...inspection.motion!,
    takes: [{ ...inspection.motion!.takes[0]!, tracks: [track] }],
  },
}); }
