import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";

export function sameAutoMovieInspectionShotClock(
  left: IAutoMovieInspectionDiagnostics.ITime,
  right: IAutoMovieInspectionDiagnostics.ITime,
): boolean {
  if (left.shot === undefined || right.shot === undefined)
    return left.shot === right.shot;
  if (left.shot.path !== right.shot.path) return false;
  const a: number = left.filmSeconds - left.shot.seconds;
  const b: number = right.filmSeconds - right.shot.seconds;
  return (
    Number.isFinite(a) &&
    Number.isFinite(b) &&
    Math.abs(a - b) <=
      2 *
        Number.EPSILON *
        Math.max(
          Math.abs(left.filmSeconds),
          Math.abs(right.filmSeconds),
          Math.abs(left.shot.seconds),
          Math.abs(right.shot.seconds),
        )
  );
}
