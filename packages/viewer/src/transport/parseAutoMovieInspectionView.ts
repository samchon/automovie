/**
 * An inspection camera view written as `x,y,z:tx,ty,tz` (camera position and
 * look-at target, metres), refusing anything else. Review-only: a host
 * applies it to its inspection camera and redraws the same displayed second;
 * it never changes a delivered camera plan.
 *
 * @param value The written view.
 * @returns The position and target.
 */
export function parseAutoMovieInspectionView(value: string): {
  position: [number, number, number];
  target: [number, number, number];
} {
  const parts: number[][] = value
    .split(":")
    .map((part: string): number[] => part.split(",").map(Number));
  if (
    parts.length !== 2 ||
    parts.some(
      (p: number[]): boolean => p.length !== 3 || !p.every(Number.isFinite),
    )
  )
    throw new Error("An inspection view is x,y,z:tx,ty,tz");
  return {
    position: parts[0] as [number, number, number],
    target: parts[1] as [number, number, number],
  };
}
