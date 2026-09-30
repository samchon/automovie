import type { IHumanFaceIrisDisc } from "./structures/IHumanFaceIrisDisc";

/** Population horizontal visible iris diameter, millimetres. */
const HUMAN_FACE_LIMBAL_DIAMETER_MM = 11.71;

/** Population transverse globe diameter, millimetres. */
const HUMAN_FACE_GLOBE_DIAMETER_MM = 24.2;

/** Light-adapted pupil diameter of an indoor portrait, millimetres. */
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
 *    axis, which are sclera by any anatomical proportion, and recompute the
 *    axis from the protrusion above this unbiased sphere.
 * 3. Take the limbal and pupillary half-angles from population anatomy in
 *    absolute size on the fitted sphere: the horizontal visible iris
 *    diameter 11.71 mm (Rüfer, Schröder & Erb, Cornea 2005, 390 subjects),
 *    asin(11.71 mm / 2r), and a 3.5 mm pupil, within the 2.8 to 3.7 mm the
 *    Stanley and Davies formula in Watson and Yellott (J Vis 2012) gives a
 *    young adult under a wide field of 10 to 100 cd/m2, an ordinary indoor
 *    portrait. The visible iris is an absolute length of the face, one of
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
 * because each leaves no axis to paint.
 *
 * The result is metres in the basis frame with angles in radians from the
 * optical axis, and the limbus and pupil are absolute lengths of the eye taken
 * from the population values above and not from the asset's painting. The
 * globe of the population is 24.2 mm across, so a globe fitted larger than
 * that carries the same absolute iris on a larger sphere and the iris then
 * covers a smaller angle.
 *
 * @evidence contracts/common.md#principled-implementation An algebraic least-squares sphere is linear in its centre and the constant term, so the four normal equations are solved directly by pivoted elimination after taking points about their mean, which keeps the equations well conditioned far from the origin. The cornea stands outside the sphere of the rest of the globe, so the direction of that excess is the optical axis; the first fit is biased forward by the cornea, so refitting on vertices more than 45 degrees from the first axis, which no anatomical proportion lets be cornea, removes the bias. On a chord of a sphere of radius r, 2 r sin(theta) equals the iris diameter, which is the asin used for the half-angle. Degenerate inputs (fewer than eight vertices, no sclera behind the cornea, an unresolved fit, no protrusion above rounding) are refused because each leaves no axis.
 * @evidence contracts/common.md#clear-and-simple-design One pure function turns vertex positions into one disc description in the fixed order fit, axis, refit, axis and angles, with the fit and axis helpers private to it and no option.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No asset name, texture pixel, photograph or subject is read; the only constants are three published population lengths. The 45 degree sclera cut is a geometric margin, not a tuned value.
 * @evidence contracts/common.md#meaningful-documentation The comment gives the processing order with the reason for each step, the units, the azimuth reference and its degenerate case, the population values and what each refusal means.
 * @evidence contracts/modeling.md#spatial-conventions Positions are basis-frame metres, the centre and radius are in metres, every angle is in radians, and the world +Y azimuth reference (world +X for a vertical axis) is stated; the only unit conversion is millimetre to metre applied to the three population lengths.
 * @evidence contracts/anatomy.md#anatomical-source The visible iris diameter of 11.71 mm is the horizontal white-to-white corneal diameter that Ruefer, Schroeder and Erb (Cornea 2005;24:259-261) measured with the Orbscan II in 390 healthy white subjects aged 10 to 80 (mean 11.71, standard deviation 0.42), and the globe diameter of 24.2 mm is the mean transverse diameter Bekerman, Gottlieb and Vaiman (J Ophthalmol 2014:503645) measured on CT of 250 healthy adults (range 21 to 27 mm); both were read as published abstracts. The two are measured values. The declaration applies the white population's iris length to every ancestry and takes the horizontal white-to-white diameter as the visible iris diameter. The 3.5 mm pupil is a convention: it is stated to lie inside the range Watson and Yellott (J Vis 2012) give for a young adult at indoor luminance, but that range was not re-derived when this answer was written.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function locates a disc on a globe and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface; the edge blend between the painted iris and the sclera belongs to the pigment rule that consumes this disc.
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
  const axis = protrusionAxis(positions, sphere);
  const up: [number, number, number] =
    Math.abs(axis[1]) > 0.999 ? [1, 0, 0] : [0, 1, 0];
  const reference = unit(sub(up, scale(axis, dot(up, axis))));
  return {
    centre: sphere.centre,
    radius: sphere.radius,
    axis,
    reference,
    limbus: Math.asin(
      Math.min(1, HUMAN_FACE_LIMBAL_DIAMETER_MM / 1000 / (2 * sphere.radius)),
    ),
    pupil: Math.asin(
      Math.min(1, HUMAN_FACE_PUPIL_DIAMETER_MM / 1000 / (2 * sphere.radius)),
    ),
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
