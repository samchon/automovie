import { AutoMovieGravity } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanCrowd,
  IAutoMovieMotionHumanEnsemble,
  IAutoMovieMotionHumanFormation,
  IAutoMovieMotionHumanManoeuvre,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walk } from "../../gait/internal/walk";
import { HumanCrowd } from "./HumanCrowd";
import { HumanManoeuvre } from "./HumanManoeuvre";

/*
 * Each member's way to its new slot through the crowd's steering pass
 * (`HumanCrowd.steer`), the members walking from where they stand at the word:
 * the steered course sampled every `STEERED` seconds, ending on the slot. The
 * pass runs for `SPAN` times the time the longest straight way takes at the
 * slowest member's walk, which leaves room to go round.
 */
export function manoeuvreSteered(
  ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble,
  manoeuvre: IAutoMovieMotionHumanManoeuvre,
  starts: readonly IAutoMovieVector3[],
  ends: readonly IAutoMovieMotionHumanFormation.ISlot[],
): IAutoMovieVector3[][] {
  const longest: number = Math.max(
    1e-3,
    ...starts.map((s: IAutoMovieVector3, i: number): number =>
      Math.hypot(ends[i]!.at.x - s.x, ends[i]!.at.z - s.z),
    ),
  );
  const slowest: number = Math.min(
    ...ensemble.members.map(
      (m: IAutoMovieMotionHumanEnsemble.IMember): number =>
        Math.sqrt(
          walk.FROUDE.normal *
            AutoMovieGravity.STANDARD *
            m.body.measure.hipHeight,
        ),
    ),
  );
  const until: number =
    manoeuvre.at + (HumanManoeuvre.SPAN * longest) / slowest;
  const placed: IAutoMovieMotionHumanEnsemble.IEnsemble = {
    ...ensemble,
    members: ensemble.members.map(
      (
        m: IAutoMovieMotionHumanEnsemble.IMember,
        i: number,
      ): IAutoMovieMotionHumanEnsemble.IMember => ({
        ...m,
        place: { at: starts[i]!, yaw: m.place.yaw },
      }),
    ),
  };
  const result: IAutoMovieMotionHumanCrowd.IResult = HumanCrowd.steer(placed, {
    goals: (m: IAutoMovieMotionHumanEnsemble.IMember): IAutoMovieVector3 =>
      ends[m.index]!.at,
    gait: manoeuvre.gait === "run" ? "run" : "walk",
    start: manoeuvre.at,
    until,
  });
  return result.frames.map(
    (
      frame: IAutoMovieMotionHumanFormation.ICourse,
      i: number,
    ): IAutoMovieVector3[] => {
      const way: IAutoMovieVector3[] = frame.samples
        .filter(
          (_: IAutoMovieMotionHumanFormation.ISample, k: number): boolean =>
            k %
              Math.max(
                1,
                Math.round(HumanManoeuvre.STEERED / HumanCrowd.STEP),
              ) ===
            0,
        )
        .map(
          (s: IAutoMovieMotionHumanFormation.ISample): IAutoMovieVector3 => ({
            x: s.x,
            y: 0,
            z: s.z,
          }),
        );
      return [...way, ends[i]!.at];
    },
  );
}
