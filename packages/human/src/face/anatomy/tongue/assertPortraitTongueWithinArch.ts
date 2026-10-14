import type { IPortraitDentalRow } from "../dental/structures/IPortraitDentalRow";
import { IPortraitTongueShape } from "./IPortraitTongueShape";
import { portraitTongueRingStation } from "./portraitTongueRingStation";
import { portraitTongueRows } from "./portraitTongueRows";
import { portraitTongueWidthEnvelope } from "./portraitTongueWidthEnvelope";
import type { IPortraitDentalCrown as IPortraitDentalCrownImported } from "../dental/structures/IPortraitDentalCrown";


/**
 * Refuse a tongue that a lower dental arch cannot contain at rest, in the
 * frame the two share: millimetres, X across the arch and depth `s` measured
 * posteriorly from the lower lip anchor's frame.
 *
 * The body lies between the lower teeth, so at every ring its half-width must
 * not exceed the arch's lingual half-width at that depth. The arch's guide is
 * the row's ellipse, `x = a sin(theta)`, `s = b (1 - cos(theta))`, entered
 * `rowRecess` behind the anchor, and its lingual face is that curve moved
 * inward along its normal by the largest crown half-depth: the inner point at
 * `theta` is `P - depth * n` with `n = (b sin(theta), -a cos(theta)) / |...|`.
 * The inner curve is sampled at 128 angles and the room at a depth is read by
 * linear interpolation, zero in front of the inner curve's first point (the
 * lingual face of the incisors, `depth` behind the guide) and `a - depth`
 * behind the ellipse's end at `s = b`. The tongue's ring at station `v` has
 * half-width `halfWidth * portraitTongueWidthEnvelope(v)` at depth
 * `shape.recess + shape.length * v - rowRecess`. Rings in front of the guide's
 * anterior midpoint, `s < 0`, are outside the arch, as a protruded tongue is,
 * and are not compared. This checks the plan containment of the resting body
 * only; it does not compare heights, the jaw's opening or the palate, and a
 * row whose inner curve turns back on itself in depth (a crown depth beyond
 * the arch's radius of curvature) is outside its limit. The cause names the
 * depth, the tongue's half-width there and the arch's, and no input is
 * changed.
 *
 * @evidence contracts/common.md#principled-implementation The authored ellipse offset by maximum crown half-depth supplies a sampled lingual boundary; built tongue rings compare their resting plan widths against its interpolated room. Finite positive axes and strictly increasing sampled depths admit that lookup.
 * @evidence contracts/common.md#clear-and-simple-design This gate owns resting plan fit; shared tongue station/width readers match the builder, while performed jaw, height and actual enamel collision checks remain separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 128-angle linear boundary is a construction approximation, not exact tooth clearance or measured anatomy; protruded rings are omitted by definition and reversed sampled depth refuses.
 * @evidence contracts/common.md#meaningful-documentation The prose gives millimetre frame, ellipse offset, sampling, protrusion omission, depth-order premise and absent vertical/performed containment proof.
 * @evidence contracts/performance.md#efficient-algorithms C crowns and A boundary samples are scanned once; R rings each scan up to A segments, O(C+A+RA) time and O(A) storage, with authored fixed A/R tessellation counts.
 * @evidence contracts/performance.md#reuse-equivalent-work Every ring reuses one sampled inner arch and the builder's station/envelope definitions; changed row geometry requires a new boundary.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Samples/interpolants are call-local; borrowed shape/row remain unchanged and no cache or external resource survives refusal.
 *
 * @author Samchon
 */
export function assertPortraitTongueWithinArch(
  shape: IPortraitTongueShape,
  row: IPortraitDentalRow,
  rowRecess: number,
): void {
  const depth: number = Math.max(...row.crowns.map((crown: IPortraitDentalCrownImported): number  => crown.depth));
  if (!Number.isFinite(depth) || !Number.isFinite(rowRecess))
    throw new Error("The lower arch needs finite crown depths and recess.");
  const { halfWidth: a, depth: b }: IPortraitDentalRow = row;
  if (![a, b].every((value: number): boolean => Number.isFinite(value) && value > 0) || depth < 0)
    throw new Error("The lower lingual arch needs positive finite ellipse axes and nonnegative crown half-depth.");
  const samples: number = 128;
  const inner: { s: number; x: number; }[] = Array.from({ length: samples + 1 }, (_v: unknown, i: number): { s: number; x: number; }  => {
    const theta: number = (Math.PI / 2) * (i / samples);
    const norm: number = Math.hypot(b * Math.sin(theta), a * Math.cos(theta));
    return {
      s: b * (1 - Math.cos(theta)) + (depth * a * Math.cos(theta)) / norm,
      x: a * Math.sin(theta) - (depth * b * Math.sin(theta)) / norm,
    };
  });
  if (inner.some((point: { s: number; x: number; }, at: number): boolean =>
    !Number.isFinite(point.s) || !Number.isFinite(point.x) ||
    (at > 0 && point.s <= inner[at - 1].s)))
    throw new Error("The lower lingual arch offset must have finite coordinates and strictly increasing sampled depth.");
  const room: (s: number) => number = (s: number): number => {
    if (s < inner[0].s) return 0;
    if (s >= inner[samples].s) return inner[samples].x;
    let at: number = 0;
    while (inner[at + 1].s <= s) at++;
    const t: number = (s - inner[at].s) / (inner[at + 1].s - inner[at].s);
    return inner[at].x + t * (inner[at + 1].x - inner[at].x);
  };
  for (let ring: number = 1; ring < portraitTongueRows; ring++) {
    const v: number = portraitTongueRingStation(ring);
    const s: number = shape.recess + shape.length * v - rowRecess;
    if (s < 0) continue;
    const width: number = shape.halfWidth * portraitTongueWidthEnvelope(v),
      available: number = room(s);
    if (width > available)
      throw new Error(
        `The tongue is wider than the lower dental arch that must contain it: at ${s.toFixed(1)} mm behind the incisors its half-width is ${width.toFixed(1)} mm and the arch's lingual half-width is ${available.toFixed(1)} mm.`,
      );
  }
}
