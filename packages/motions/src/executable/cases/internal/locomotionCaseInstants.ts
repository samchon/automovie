import type { IAutoMovieMotionHumanSegment } from "@automovie/interface";

import type { IMotionCaptureCase } from "../../internal/IMotionCaptureCase";

/** Every 0.2 s, and every heel strike and toe-off, labelled. */
export function locomotionCaseInstants(
  performance: ILocomotionPerformance,
  end: number,
): IMotionCaptureCase.ITime[] {
  const segment = performance.segments("w0")[0]!;
  const events: IMotionCaptureCase.ITime[] = segment.plan.events
    .filter((e) => /HeelStrike|ToeOff/.test(e.name))
    .map((e) => ({
      seconds: segment.start + e.share * segment.plan.duration,
      label: e.name.replace(/^(left|right)/, (m: string): string =>
        m === "left" ? "L " : "R ",
      ),
    }));
  const grid: IMotionCaptureCase.ITime[] = Array.from(
    { length: Math.floor(end / 0.2) + 1 },
    (_, k: number) => ({
      seconds: k * 0.2,
      label: `${(k * 0.2).toFixed(1)} s`,
    }),
  );
  return [...grid, ...events, { seconds: end, label: "end" }].sort(
    (a, b): number => a.seconds - b.seconds,
  );
}

/** The part of a walking segment its instants are read from. */
interface ILocomotionSegment {
  /** Film seconds the segment starts. */
  start: IAutoMovieMotionHumanSegment["start"];

  /** Its plan's events and duration. */
  plan: Pick<IAutoMovieMotionHumanSegment["plan"], "events" | "duration">;
}

/** The performance's segments reader, all a walk's instants read. */
interface ILocomotionPerformance {
  /** A subject's segments in order. */
  segments(subject: string): readonly ILocomotionSegment[];
}
