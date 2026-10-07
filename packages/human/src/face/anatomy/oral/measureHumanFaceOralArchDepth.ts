import type { IHumanFaceOralToothStation } from "./IHumanFaceOralToothStation";

/**
 * Signed distance to the station arch and its two posterior terminal rays.
 * The finite station polyline joins right terminal, midline and left terminal
 * source centres. Each terminal continues at constant u toward negative v.
 * These unbounded half-rays complete the declared side convention without
 * introducing a finite posterior wall into any query or authored reach.
 *
 * A horizontal ray toward positive u counts the finite segments with the
 * usual half-open vertex rule. A posterior half-ray crosses it precisely
 * when v is below its terminal and u is left of that ray. Odd parity is the
 * lingual side. The nearest point on a terminal ray has that terminal's u
 * and min(v,terminal.v), so the same two rays own both sign and distance.
 * This authored continuation is not acquired pharyngeal or soft-palate anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Analytic half-ray crossing and nearest-point rules evaluate the same unbounded boundary for side and distance.
 * @evidence contracts/common.md#clear-and-simple-design One owner supplies the boundary reading shared by lining rise and posterior wall omission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No finite far distance, source-specific closure, clinical cap or posterior-reach change enters.
 * @evidence contracts/common.md#meaningful-documentation States the actual primitive domain, parity convention, distance and anatomical limitation.
 * @evidence contracts/modeling.md#spatial-conventions Arch lateral u and anterior v are metres; negative v is posterior and returned positive distance is lingual.
 * @evidence contracts/modeling.md#shared-boundaries The same native finite arch and terminal continuations supply the side and distance consumed by every lining region.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Uses existing source stations without adding a control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive mesh.
 * @evidenceExclude contracts/modeling.md#rendered-observation Oral assembly owns observation.
 * @evidence contracts/anatomy.md#anatomical-source The station source owns crown registration; posterior half-rays are the existing authored boundary convention and do not reconstruct a pharynx.
 * @evidenceExclude contracts/anatomy.md#permitted-range No clinical range or finite query-domain cap is imposed.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no authored shape input.
 * @author Samchon
 */
export function measureHumanFaceOralArchDepth(
  stations: readonly IHumanFaceOralToothStation[],
  u: number,
  v: number,
): number {
  let inside = false;
  let nearest = Infinity;
  for (let k = 0; k + 1 < stations.length; k++) {
    const a = stations[k].centre;
    const b = stations[k + 1].centre;
    if (a[1] > v !== b[1] > v && u < a[0] + ((v - a[1]) * (b[0] - a[0])) / (b[1] - a[1]))
      inside = !inside;
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const squared = dx * dx + dy * dy;
    const t = squared === 0 ? 0 :
      Math.min(1, Math.max(0, ((u - a[0]) * dx + (v - a[1]) * dy) / squared));
    nearest = Math.min(nearest, Math.hypot(u - a[0] - t * dx, v - a[1] - t * dy));
  }
  for (const terminal of [stations[0].centre, stations[stations.length - 1].centre]) {
    if (terminal[1] > v && u < terminal[0]) inside = !inside;
    nearest = Math.min(nearest, Math.hypot(u - terminal[0], Math.max(0, v - terminal[1])));
  }
  return inside ? nearest : -nearest;
}
