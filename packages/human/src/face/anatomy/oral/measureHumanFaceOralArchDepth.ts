import type { IHumanFaceOralToothStation } from "./IHumanFaceOralToothStation";

/**
 * Signed distance to the station arch and its two posterior terminal rays. The finite station polyline joins right terminal, midline and left terminal source centres. Each terminal continues at constant u toward negative v. These unbounded half-rays complete the declared side convention without introducing a finite posterior wall into any query or authored reach.
 *
 * A horizontal ray toward positive u counts the finite segments with the usual half-open vertex rule. A posterior half-ray crosses it precisely when v is below its terminal and u is left of that ray. Odd parity is the lingual side. The nearest point on a terminal ray has that terminal's u and min(v,terminal.v), so the same two rays own both sign and distance. This authored continuation is not acquired pharyngeal or soft-palate anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Odd horizontal-ray parity and nearest distance read the finite station arch with two unbounded posterior terminal rays.
 * @evidence contracts/common.md#clear-and-simple-design The same boundary geometry supplies sign and distance for lining side selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Terminal rays are an authored continuation rather than acquired soft-palate/pharyngeal anatomy; valid nonempty station data is a caller premise.
 * @evidence contracts/common.md#meaningful-documentation Arch u/v are metres and positive depth denotes lingual side.
 * @evidence contracts/performance.md#efficient-algorithms A linear station-segment scan plus two ray reads takes O(stations) work and fixed temporary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared open-arch owner serves all lingual-depth samples without a separate finite query rectangle.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the signed scalar escapes and borrowed station arrays are not retained.
 *
 * @author Samchon
 */
export function measureHumanFaceOralArchDepth(
  stations: readonly IHumanFaceOralToothStation[],
  u: number,
  v: number,
): number {
  let inside: boolean = false;
  let nearest: number = Infinity;
  for (let k: number = 0; k + 1 < stations.length; k++) {
    const a: number[] = stations[k].centre;
    const b: number[] = stations[k + 1].centre;
    if (
      a[1] > v !== b[1] > v &&
      u < a[0] + ((v - a[1]) * (b[0] - a[0])) / (b[1] - a[1])
    )
      inside = !inside;
    const dx: number = b[0] - a[0],
      dy: number = b[1] - a[1];
    const squared: number = dx * dx + dy * dy;
    const t: number =
      squared === 0
        ? 0
        : Math.min(
            1,
            Math.max(0, ((u - a[0]) * dx + (v - a[1]) * dy) / squared),
          );
    nearest = Math.min(
      nearest,
      Math.hypot(u - a[0] - t * dx, v - a[1] - t * dy),
    );
  }
  for (const terminal of [
    stations[0].centre,
    stations[stations.length - 1].centre,
  ]) {
    if (terminal[1] > v && u < terminal[0]) inside = !inside;
    nearest = Math.min(
      nearest,
      Math.hypot(u - terminal[0], Math.max(0, v - terminal[1])),
    );
  }
  return inside ? nearest : -nearest;
}
