import type { IPortraitDentalRow } from "../dental/structures/IPortraitDentalRow";
import { IPortraitTongueShape } from "./IPortraitTongueShape";
import { portraitTongueRingStation } from "./portraitTongueRingStation";
import { portraitTongueRows } from "./portraitTongueRows";
import { portraitTongueWidthEnvelope } from "./portraitTongueWidthEnvelope";

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
 * @evidence contracts/common.md#principled-implementation Containment in plan is compared ring by ring: the lingual face of the arch is the row's guide ellipse moved inward along its normal by the crown half-depth (the parallel curve, sampled at 128 angles and read by linear interpolation), and the tongue's ring half-width is its authored half-width times the ellipse envelope at that station. The inner curve's depth is monotone for a crown depth below the arch's radius of curvature, which the comment states as the limit; behind the ellipse's end the room is the full lingual half-width.
 * @evidence contracts/common.md#clear-and-simple-design One function of two profiles and a shared recess, called once by document resolution; it changes no input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is named, and no threshold is tuned: the bound is the geometry of the caller's own arch and tongue.
 * @evidence contracts/common.md#meaningful-documentation The comment states the frame, the arch construction, what is compared, what is not (heights, the jaw, the palate, a protruded tongue) and the limit of the offset curve, and the refusal names the depth and both widths.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in the shared lower-lip-anchor frame with X across the arch and depth posterior; the depth of a tongue ring is its recess plus its length times its station, less the row's recess.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function compares two profiles and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes profile dimensions and defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidence contracts/modeling.md#shared-boundaries It defines, once, where the tongue's lateral boundary meets the lower arch's lingual face at rest, so the two parts cannot be authored to interpenetrate laterally; it does not cover the height, the palate, the opening jaw or the lining.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function stores no anatomical value; it derives the bound from the arch the caller supplies.
 * @evidence contracts/anatomy.md#permitted-range The bound on the tongue's width is derived from the structure that limits it, the lower dental arch: at each depth the half-width may not exceed the arch's lingual half-width, and a tongue tip inside the incisors is refused because it would share a volume with enamel. It is a combination check, since each of the tongue's and the arch's dimensions is admitted alone. A refusal reports the depth and both widths and leaves the caller's values unchanged; a tongue wholly in front of the arch is outside the check.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no input through which a caller shapes a face; it refuses a combination of inputs declared elsewhere.
 * @author Samchon
 */
export function assertPortraitTongueWithinArch(
  shape: IPortraitTongueShape,
  row: IPortraitDentalRow,
  rowRecess: number,
): void {
  const depth = Math.max(...row.crowns.map((crown) => crown.depth));
  if (!Number.isFinite(depth) || !Number.isFinite(rowRecess))
    throw new Error("The lower arch needs finite crown depths and recess.");
  const { halfWidth: a, depth: b } = row;
  const samples = 128;
  const inner = Array.from({ length: samples + 1 }, (_v, i) => {
    const theta = (Math.PI / 2) * (i / samples);
    const norm = Math.hypot(b * Math.sin(theta), a * Math.cos(theta));
    return {
      s: b * (1 - Math.cos(theta)) + (depth * a * Math.cos(theta)) / norm,
      x: a * Math.sin(theta) - (depth * b * Math.sin(theta)) / norm,
    };
  });
  const room = (s: number): number => {
    if (s < inner[0].s) return 0;
    if (s >= inner[samples].s) return inner[samples].x;
    let at = 0;
    while (inner[at + 1].s <= s) at++;
    const t = (s - inner[at].s) / (inner[at + 1].s - inner[at].s);
    return inner[at].x + t * (inner[at + 1].x - inner[at].x);
  };
  for (let ring = 1; ring < portraitTongueRows; ring++) {
    const v = portraitTongueRingStation(ring);
    const s = shape.recess + shape.length * v - rowRecess;
    if (s < 0) continue;
    const width = shape.halfWidth * portraitTongueWidthEnvelope(v),
      available = room(s);
    if (width > available)
      throw new Error(
        `The tongue is wider than the lower dental arch that must contain it: at ${s.toFixed(1)} mm behind the incisors its half-width is ${width.toFixed(1)} mm and the arch's lingual half-width is ${available.toFixed(1)} mm.`,
      );
  }
}
