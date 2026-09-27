import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";

type Shoulder = NonNullable<
  IAutoMovieHumanBodyBasis["joints"][number]["shoulder"]
>;

/**
 * The largest total elevation a basis admits for one thorax-relative
 * humerus in a given plane of elevation: the plane's share of the clinical
 * reach that `humanBodyShoulderReaches` judges a whole TT goal against.
 *
 * Clinical shoulder ranges are single-plane figures: flexion 180 in the
 * anterior plane, abduction 180 in the lateral one, extension 60 in the
 * posterior one, horizontal flexion and extension measured at 90 degrees of
 * elevation. Read as independent limits on plane and elevation they admit
 * directions no shoulder reaches, such as the arm raised 120 degrees behind
 * the trunk or carried horizontally through the chest. The reachable
 * humerothoracic directions form one region on the sphere around the hanging
 * arm (the humeral joint sinus), so the basis declares that region as
 * `range.envelope`: `[plane, maximum total elevation]` knots, periodic in the
 * plane and linear between neighbours, the last knot joined to the first
 * across the -180/180 seam. The region is star-shaped about the hanging arm,
 * which is what makes one maximum per plane a complete description.
 *
 * Elevation 0 has no plane, and every plane admits it because each knot's
 * maximum is positive (`assertHumanBodyRig`). At elevation 180 the plane is
 * not an attribute of the direction either; the overhead arm is admitted
 * when some plane reaches 180, whatever plane the author wrote, so the pole
 * equivalence `(plane + d, axialRotation - 2d)` never admits one spelling of
 * the same orientation and refuses another. Axial rotation keeps its own
 * range, which the pinned clinical record states independently of plane.
 *
 * Consumers: `humanBodyShoulderReaches`, through which the builder refuses a
 * document goal and basis admission a rest or kernel centre outside the
 * reach, and the playground's shoulder controls, which show the limit of the
 * painted plane.
 * Changing a basis's envelope changes which documents replay, so it needs a
 * new basis identity like any other joint range.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-joints Refuses a humeral direction past the clinical reach of its plane instead of treating plane and elevation as independent limits.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints Evaluates the periodic piecewise-linear plane envelope, admits both poles by direction and checks axial rotation separately.
 */
export function humanBodyShoulderElevationLimit(
  range: Pick<Shoulder["range"], "envelope">,
  plane: number,
): number {
  const knots = range.envelope;
  // the plane on the knots' own turn: from the first knot, one full period
  let x = ((((plane + 180) % 360) + 360) % 360) - 180;
  if (x < knots[0][0]) x += 360;
  // the segment that holds it; past the last knot, the seam segment that
  // joins the last knot to the first one period on
  let k = 0;
  while (k + 1 < knots.length && x > knots[k + 1][0]) k++;
  const [a, limitA] = knots[k];
  const [b, limitB] =
    k + 1 < knots.length ? knots[k + 1] : [knots[0][0] + 360, knots[0][1]];
  return limitA + ((limitB - limitA) * (x - a)) / (b - a);
}
