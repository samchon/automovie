import { createDentalCrownAxis } from "./createDentalCrownAxis";
import { evaluateDentalSurfaceAnchor } from "./evaluateDentalSurfaceAnchor";
import type { IDentalClinicalRegistration } from "./IDentalClinicalRegistration";

/**
 * Project registered gingival-zenith minus incisal/cusp displacement onto the
 * registered longitudinal crown axis. Melo et al. 2019, Scientific Reports
 * 9:730, measure this distance along the tooth axis on casts of 384 Spanish
 * subjects aged 14–35. Their sample means are not physiological bounds.
 *
 * Positions and registration are read-only, in the same basis metre frame.
 * An exact revision and nonblank provenance identifier keep registration
 * attached to its stated source. This validates arithmetic and correspondence,
 * not clinical landmark identification or an acquisition protocol. A highest
 * raster pixel or inferred mesh axis cannot be substituted for registration.
 * Signed output exposes reversed landmark order without clamping it. The
 * fixed crown axis and incisal anchors cannot move with the gingiva. For a Y
 * translation of `movingVertices`, the height derivative is the axis's Y
 * component times the moving weights of the zenith anchor. This converts an
 * axial metre shortfall to a Y-metre shift without confusing the two lengths.
 * Scaled displacement dot products avoid erasing subnormal terms before their
 * sum; unrepresentable height arithmetic refuses.
 *
 * @evidence contracts/common.md#principled-implementation Registered landmark displacement projected onto the registered unit axis owns signed axial height. A stationary crown gives the exact uniform-Y response from axis Y and moving zenith weights; scaled products retain subnormal sums. Clinical registration truth remains an external obligation.
 * @evidence contracts/common.md#clear-and-simple-design Shared anchor and axis owners supply one measured height and response to both gingival preparations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No raster pixel is relabelled a clinical zenith, no sample mean becomes a permitted range and no source is clamped or moved.
 * @evidence contracts/common.md#meaningful-documentation States the primary measurement definition and population, exact-revision registration, ownership, signed output, derivative and identification limits.
 * @evidence contracts/modeling.md#spatial-conventions Height uses one basis metre frame; the uniform-Y response is dimensionless axial metres per Y metre.
 */
export function measureDentalClinicalHeight(
  positions: readonly number[],
  basisRevision: string,
  registration: IDentalClinicalRegistration | undefined,
  movingVertices: ReadonlySet<number>,
): { measurement: "registered-landmark-axis-distance"; heightMetres: number; metresPerUpShift: number } {
  if (registration === undefined || registration.basisRevision !== basisRevision || registration.registrationId.trim() === "")
    throw new Error("Clinical crown height needs landmark registration for this exact basis and its provenance.");
  if ([registration.axis.incisal, registration.axis.cervical, registration.incisalOrCusp]
    .some((anchor) => anchor.vertices.some((vertex) => movingVertices.has(vertex))))
    throw new Error("Clinical gingival movement needs stationary crown axis and incisal landmarks.");
  const axis = createDentalCrownAxis(
    evaluateDentalSurfaceAnchor(positions, registration.axis.incisal),
    evaluateDentalSurfaceAnchor(positions, registration.axis.cervical),
  ).unit;
  const incisal = evaluateDentalSurfaceAnchor(positions, registration.incisalOrCusp);
  const zenith = evaluateDentalSurfaceAnchor(positions, registration.gingivalZenith);
  const displacement = zenith.map((value, at) => value - incisal[at]);
  const scale = Math.max(...displacement.map(Math.abs));
  if (!Number.isFinite(scale))
    throw new Error("Registered crown height arithmetic must remain finite.");
  const heightMetres = scale === 0 ? 0 :
    axis.reduce((sum, value, at) => sum + value * (displacement[at] / scale), 0) * scale;
  if (!Number.isFinite(heightMetres))
    throw new Error("Registered crown height arithmetic must remain finite.");
  const carried = registration.gingivalZenith.vertices.reduce((sum, vertex, at) =>
    sum + (movingVertices.has(vertex) ? registration.gingivalZenith.weights[at] : 0), 0);
  return {
    measurement: "registered-landmark-axis-distance",
    heightMetres,
    metresPerUpShift: axis[1] * carried,
  };
}
