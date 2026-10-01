import type { IHumanFaceIrisDisc } from "./structures/IHumanFaceIrisDisc";

/** Population horizontal visible iris diameter, millimetres. */
const HUMAN_FACE_LIMBAL_DIAMETER_MM = 11.71;

/** Population transverse globe diameter, millimetres. */
const HUMAN_FACE_GLOBE_DIAMETER_MM = 24.2;

/** Fixed pupil painting diameter convention, millimetres. */
const HUMAN_FACE_PUPIL_DIAMETER_MM = 3.5;

/**
 * Anatomical iris disc of one textured globe, found from its geometry alone.
 *
 * `createHumanFaceIrisPigment` calls this once per articulated eye with the
 * neutral positions of the globe's vertices (metres, basis frame). The globe
 * of a connected basis is a painted sphere whose cornea protrudes: the cornea
 * has a shorter radius of curvature than the sclera, so its vertices stand
 * outside the sphere that fits the rest of the globe. The optical axis is the
 * direction of that protrusion, and the limbus, where cornea meets sclera, is
 * a circle about it. No asset name, texture pixel or photograph is read.
 *
 * Processing order, and why:
 *
 * 1. Fit a least-squares sphere to every vertex and take the protrusion-
 *    weighted mean direction as a first axis. The cornea biases this fit
 *    forward, so
 * 2. fit the sphere again to the vertices more than 45 degrees from that
 *    axis and recompute the protrusion direction. This separation assumes a
 *    compact corneal protrusion and approximately spherical remaining sclera;
 *    it is not an anatomical proof for arbitrary input geometry.
 * 3. Take the limbal and pupillary half-angles from population anatomy in
 *    absolute size on the fitted sphere: the horizontal visible iris
 *    diameter 11.71 mm (Rüfer, Schröder & Erb, Cornea 2005, 390 subjects),
 *    asin(11.71 mm / 2r), and a fixed 3.5 mm pupil painting convention.
 *    Watson and Yellott (J Vis 2012) model the entrance pupil seen through
 *    the cornea from luminance, adapting field area, age and binocularity;
 *    luminance alone does not specify its diameter. This rule computes no
 *    light adaptation or physical pupil aperture. The visible iris is an
 *    absolute length of the face, one of
 *    its least variable: an asset globe larger than an eye (the source's
 *    fits 27.5 mm against the 24.2 mm transverse diameter of Bekerman,
 *    Gottlieb & Vaiman, J Ophthalmol 2014, 250 subjects) would otherwise
 *    carry its excess into the iris, 13.3 mm, and the eye reads as all iris.
 *    The asset's own painting follows its globe instead, so `painted` is the
 *    population ratio, asin(11.71 / 24.2) = 28.9 degrees: where the texture
 *    the rule paints over has its iris end.
 *
 * The reference direction for azimuth is world +Y projected into the plane
 * normal to the axis (world +X when the axis is vertical), so fibre patterns
 * are the same for every document. The function is pure; the caller owns
 * the positions. It refuses fewer than eight vertices, a degenerate fit and a
 * globe without a protruding cornea or without sclera vertices behind it,
 * because each leaves no axis to paint. A fitted globe smaller than the
 * declared iris is refused: a chord cannot exceed its globe's diameter.
 * Saturating the asin argument would silently shorten that absolute iris;
 * refusing the geometry also keeps the smaller pupil strictly inside it.
 *
 * The result is metres in the basis frame with angles in radians from the
 * optical axis, and the limbus and pupil are absolute lengths of the eye taken
 * from the population values above and not from the asset's painting. The
 * globe of the population is 24.2 mm across, so a globe fitted larger than
 * that carries the same absolute iris on a larger sphere and the iris then
 * covers a smaller angle.
 *
 * @evidence contracts/common.md#principled-implementation An algebraic least-squares sphere is linear in its centre and the constant term, so the four normal equations are solved directly by pivoted elimination after taking points about their mean. A compact corneal protrusion above approximately spherical sclera motivates the excess direction and the 45-degree refit separation; arbitrary anisotropic or broad-protrusion geometry is not certified by this approximation. On a sphere of radius r, 2 r sin(theta) equals the iris chord, so the fitted diameter must be at least that iris diameter before asin is used. A smaller globe refuses instead of shortening the absolute iris by saturating the argument; the fixed smaller pupil then has a strictly smaller angle. The numerical diameter boundary is representability, not an anatomical globe-size admission. Other degenerate inputs refuse when they leave no resolvable sphere, sclera sample or corneal axis.
 * @evidence contracts/common.md#clear-and-simple-design One pure function turns vertex positions into one disc description in the fixed order fit, axis, refit, axis and angles, with the fit and axis helpers private to it and no option.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No asset name, texture pixel, photograph or subject is read. The limbal and transverse lengths are published population values and the pupil diameter is an explicitly stated optical convention; neither the geometric sclera cut nor the numerical sphere-fit thresholds is fitted to a photograph.
 * @evidence contracts/common.md#meaningful-documentation The comment gives the processing order with the reason for each step, the units, the azimuth reference and its degenerate case, the population values and what each refusal means.
 * @evidence contracts/modeling.md#spatial-conventions Positions are basis-frame metres, the centre and radius are in metres, every angle is in radians, and the world +Y azimuth reference (world +X for a vertical axis) is stated; millimetre-to-metre conversion applies to the declared iris and conventional pupil lengths, while the painted half-angle uses a ratio of same-unit lengths.
 * @evidence contracts/anatomy.md#anatomical-source The iris proxy of 11.71 mm is the horizontal white-to-white corneal diameter that Ruefer, Schroeder and Erb (Cornea 2005;24:259-261) measured by Orbscan II in 390 healthy white subjects aged 10 to 80 (mean 11.71, standard deviation 0.42), read in their abstract. Bekerman, Gottlieb and Vaiman (J Ophthalmol 2014:503645) report transverse CT diameters for 250 healthy adults; their full text and Table 1 support the rounded 24.2 mm reference. This declaration extends the white population proxy to other ancestries and treats white-to-white as visible iris diameter, not as a per-subject measurement. The fixed 3.5 mm pupil is an optical painting convention. Watson and Yellott (J Vis 2012;12(10):12), read through the full author-repository text and appendices, describe the entrance pupil rather than the physical hole, and require adapting area, luminance, age and one/two-eye conditions. Those inputs are absent here, so this constant is not an evaluated prediction of their formula or a universal adaptation size.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function locates a disc on a globe and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface; the edge blend between the painted iris and the sclera belongs to the pigment rule that consumes this disc.
 * @evidenceExclude contracts/modeling.md#rendered-observation It derives disc coordinates and owns no displayed part or joint; the connected face builder owns the textured eye.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits no anatomical input; it derives the disc from geometry and three constants.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function has no caller input that shapes a face; the disc follows from the globe geometry.
 */
export function locateHumanFaceIrisDisc(
  positions: readonly (readonly [number, number, number])[],
): IHumanFaceIrisDisc {
  if (positions.length < 8)
    throw new Error("An iris disc needs at least eight globe vertices.");
  const first = fitSphere(positions);
  const firstAxis = protrusionAxis(positions, first);
  const sclera = positions.filter(
    (point) =>
      dot(unit(sub(point, first.centre)), firstAxis) < Math.cos(Math.PI / 4),
  );
  if (sclera.length < 4)
    throw new Error("An iris disc needs sclera vertices behind the cornea.");
  const sphere = fitSphere(sclera);
  if (2 * sphere.radius < HUMAN_FACE_LIMBAL_DIAMETER_MM / 1000)
    throw new Error("The globe diameter cannot be smaller than the absolute iris diameter.");
  const axis = protrusionAxis(positions, sphere);
  const up: [number, number, number] =
    Math.abs(axis[1]) > 0.999 ? [1, 0, 0] : [0, 1, 0];
  const reference = unit(sub(up, scale(axis, dot(up, axis))));
  return {
    centre: sphere.centre,
    radius: sphere.radius,
    axis,
    reference,
    limbus: Math.asin(HUMAN_FACE_LIMBAL_DIAMETER_MM / 1000 / (2 * sphere.radius)),
    pupil: Math.asin(HUMAN_FACE_PUPIL_DIAMETER_MM / 1000 / (2 * sphere.radius)),
    painted: Math.asin(
      HUMAN_FACE_LIMBAL_DIAMETER_MM / HUMAN_FACE_GLOBE_DIAMETER_MM,
    ),
  };
}

function fitSphere(points: readonly (readonly [number, number, number])[]): {
  centre: [number, number, number];
  radius: number;
} {
  // |p|^2 = 2 c.p + k with k = r^2 - |c|^2 is linear in (c, k); solve the
  // 4x4 normal equations by Gaussian elimination with partial pivoting. The
  // points are first taken about their mean, which keeps the equations well
  // conditioned when the globe sits far from the origin.
  const mean = scale(
    points.reduce<[number, number, number]>(
      (sum, point) => add(sum, point),
      [0, 0, 0],
    ),
    1 / points.length,
  );
  const matrix = Array.from({ length: 4 }, () => [0, 0, 0, 0, 0]);
  for (const [x, y, z] of points.map((point) => sub(point, mean))) {
    const row = [2 * x, 2 * y, 2 * z, 1];
    const value = x * x + y * y + z * z;
    for (let i = 0; i < 4; ++i) {
      for (let j = 0; j < 4; ++j) matrix[i][j] += row[i] * row[j];
      matrix[i][4] += row[i] * value;
    }
  }
  for (let column = 0; column < 4; ++column) {
    let pivot = column;
    for (let row = column + 1; row < 4; ++row)
      if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column]))
        pivot = row;
    if (Math.abs(matrix[pivot][column]) < 1e-18)
      throw new Error("The globe vertices do not determine a sphere.");
    [matrix[column], matrix[pivot]] = [matrix[pivot], matrix[column]];
    for (let row = 0; row < 4; ++row) {
      if (row === column) continue;
      const factor = matrix[row][column] / matrix[column][column];
      for (let k = column; k < 5; ++k)
        matrix[row][k] -= factor * matrix[column][k];
    }
  }
  const solution = matrix.map((row, index) => row[4] / row[index]);
  const local: [number, number, number] = [
    solution[0],
    solution[1],
    solution[2],
  ];
  // k + |c|^2 is the fitted mean squared distance to the centre, positive
  // whenever the points were not coincident, which the pivot test refused.
  return {
    centre: add(local, mean),
    radius: Math.sqrt(solution[3] + dot(local, local)),
  };
}

function protrusionAxis(
  points: readonly (readonly [number, number, number])[],
  sphere: { centre: [number, number, number]; radius: number },
): [number, number, number] {
  let sum: [number, number, number] = [0, 0, 0];
  let largest = 0;
  for (const point of points) {
    const offset = sub(point, sphere.centre);
    const excess = Math.hypot(...offset) - sphere.radius;
    largest = Math.max(largest, excess);
    if (excess > 0) sum = add(sum, scale(unit(offset), excess));
  }
  // A cornea stands out by about a millimetre on a 12 mm globe. A largest
  // excess below a millionth of the radius is rounding in the fit, not
  // tissue, and would give an arbitrary axis.
  if (largest <= 1e-6 * sphere.radius)
    throw new Error("The globe has no corneal protrusion to define its axis.");
  return unit(sum);
}

function sub(
  a: readonly number[],
  b: readonly number[],
): [number, number, number] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function add(
  a: readonly number[],
  b: readonly number[],
): [number, number, number] {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scale(a: readonly number[], s: number): [number, number, number] {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function dot(a: readonly number[], b: readonly number[]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function unit(a: readonly number[]): [number, number, number] {
  const length = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / length, a[1] / length, a[2] / length];
}
