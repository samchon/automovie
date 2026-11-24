import type { IAutoMovieMotionHumanPerformance } from "@automovie/interface";

import type { IMotionCaptureCase } from "../IMotionCaptureCase";

/** Every 0.2 s, and every heel strike and toe-off, labelled. */
export function locomotionCaseInstants(
  performance: IAutoMovieMotionHumanPerformance,
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
