import type {
  IAutoMovieConvexSupportLoftSpan,
  IAutoMovieEllipticLoftSpan,
  IAutoMoviePhysicalYInterval,
} from "@automovie/interface";

/* Saved recipes used two endpoints before the SDK introduced named Y fields. */
export function scaleRecoveryLoftIntervals(
  spans: readonly (IAutoMovieConvexSupportLoftSpan | IAutoMovieEllipticLoftSpan)[],
  scale: number,
): IAutoMoviePhysicalYInterval[] {
  const intervals: IAutoMoviePhysicalYInterval[] = spans.map(
    ({ interval }): IAutoMoviePhysicalYInterval => {
      if (!Array.isArray(interval))
        return checkedInterval(interval?.lowerY, interval?.upperY);
      if (interval.length !== 2)
        throw new Error("A saved loft span requires two Y endpoints");
      return checkedInterval(interval[0], interval[1]);
    },
  );
  const anchor: number = intervals[0]!.lowerY;
  return intervals.map(
    ({ lowerY, upperY }): IAutoMoviePhysicalYInterval =>
      checkedInterval(
        anchor + (lowerY - anchor) * scale,
        anchor + (upperY - anchor) * scale,
      ),
  );
}

function checkedInterval(
  lowerY: unknown,
  upperY: unknown,
): IAutoMoviePhysicalYInterval {
  if (
    typeof lowerY !== "number" ||
    typeof upperY !== "number" ||
    !Number.isFinite(lowerY) ||
    !Number.isFinite(upperY) ||
    lowerY >= upperY
  )
    throw new Error("A saved loft span requires finite, increasing Y endpoints");
  return { lowerY, upperY };
}
