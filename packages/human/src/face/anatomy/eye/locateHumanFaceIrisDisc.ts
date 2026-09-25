import type { IHumanFaceIrisDisc } from "./structures/IHumanFaceIrisDisc";

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
 */

/** Population horizontal visible iris diameter, millimetres. */
const HUMAN_FACE_LIMBAL_DIAMETER_MM = 11.71;

/** Population transverse globe diameter, millimetres. */
const HUMAN_FACE_GLOBE_DIAMETER_MM = 24.2;

/** Light-adapted pupil diameter of an indoor portrait, millimetres. */
const HUMAN_FACE_PUPIL_DIAMETER_MM = 3.5;

/**
 * Locate the optical axis and anatomical iris disc of a textured globe.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Places the iris of each eye by the globe's own corneal protrusion and population ocular proportions.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-iris Fits the sclera sphere twice, weights the corneal protrusion into an axis and derives the limbal and pupillary half-angles from anatomical ratios.
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
