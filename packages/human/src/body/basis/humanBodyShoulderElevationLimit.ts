import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";

type Shoulder = NonNullable<
  IAutoMovieHumanBodyBasis["joints"][number]["shoulder"]
>;

/**
 * The largest total elevation a basis admits for one thorax-relative humerus in a given plane of elevation: the plane's share of the clinical reach that `humanBodyShoulderReaches` judges a whole TT goal against.
 *
 * Independent plane and elevation intervals do not describe the basis's coupled directional reach. Its `range.envelope` contains `[plane, maximum total elevation]` degree knots, periodic in plane and linear between neighbours, with the last knot joined to the first across the -180/180 seam. One maximum per plane declares a star-shaped region about the hanging arm; this representation does not establish a population's clinical capacity.
 *
 * Elevation 0 has no plane, and every plane admits it because each knot's maximum is positive (`assertHumanBodyRig`). At elevation 180 the plane is not an attribute of the direction either; the envelope component admits overhead when some plane reaches 180, whatever plane the author wrote. The reach caller still tests the raw axialRotation interval first, so equivalent overhead gauges `(plane + d, axialRotation - 2d)` can receive different whole-pose admission. Canonicalizing that gauge requires a clinical contract choice beyond this scalar envelope reader.
 *
 * Consumers: `humanBodyShoulderReaches`, through which the builder refuses a document goal and basis admission a rest or kernel centre outside the reach, and the playground's shoulder controls, which show the limit of the painted plane. Changing a basis's envelope changes which documents replay, so it needs a new basis identity like any other joint range.
 *
 * The caller supplies an admitted finite plane and the basis's ordered, nonempty clinical-envelope record; this utility does not establish its population provenance or physiological suitability.
 *
 * @evidence contracts/common.md#principled-implementation A plane wraps onto the admitted knot period, then the enclosing segment linearly interpolates maximum elevation, joining the last knot to the first across the full-turn seam.
 * @evidence contracts/common.md#clear-and-simple-design One wrap, segment search and scalar interpolation serve both reach admission and the editor's envelope readout.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ordered nonempty knots and finite planes are admitted caller premises; interpolation neither invents universal clinical capacities nor independently certifies the envelope's physiological or population provenance.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies degree coordinates, periodic seam, star-shaped directional envelope, pole behavior and basis-revision consequences.
 * @evidence contracts/performance.md#efficient-algorithms A linear scan over K ordered knots selects one segment in O(K) time and constant storage; interpolation performs fixed scalar arithmetic.
 * @evidence contracts/performance.md#reuse-equivalent-work The same periodic envelope reader is reused by rig/rest/kernel admission, requested reach and editor controls rather than maintaining separate clinical-limit formulas.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Knot references remain borrowed and only an elevation number escapes; no copied table, geometry cache, external handle or task is retained.
 */
export function humanBodyShoulderElevationLimit(
  range: Pick<Shoulder["range"], "envelope">,
  plane: number,
): number {
  const knots: Shoulder["range"]["envelope"] = range.envelope;
  // the plane on the knots' own turn: from the first knot, one full period
  let x: number = ((((plane + 180) % 360) + 360) % 360) - 180;
  if (x < knots[0][0]) x += 360;
  // the segment that holds it; past the last knot, the seam segment that
  // joins the last knot to the first one period on
  let k: number = 0;
  while (k + 1 < knots.length && x > knots[k + 1][0]) k++;
  const [a, limitA]: [number, number] = knots[k];
  const [b, limitB]: [number, number] =
    k + 1 < knots.length ? knots[k + 1] : [knots[0][0] + 360, knots[0][1]];
  return limitA + ((limitB - limitA) * (x - a)) / (b - a);
}
