import type { IHumanFaceIrisDisc } from "./structures/IHumanFaceIrisDisc";

/** Population horizontal visible iris diameter, millimetres. */
const HUMAN_FACE_LIMBAL_DIAMETER_MM: number = 11.71 as const;

/** Population transverse globe diameter, millimetres. */
const HUMAN_FACE_GLOBE_DIAMETER_MM: number = 24.2 as const;

/** Fixed pupil painting diameter convention, millimetres. */
const HUMAN_FACE_PUPIL_DIAMETER_MM: number = 3.5 as const;

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
 * @evidence contracts/common.md#principled-implementation Two geometry-only sphere fits separate a compact corneal protrusion from approximately spherical sclera, then declared absolute iris/pupil sizes define angles.
 * @evidence contracts/common.md#clear-and-simple-design Neutral metric geometry owns the fitted axis/radius while pigment and texture preparation remain separate consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Population constants and fixed pupil painting do not infer personal anatomy; fit thresholds and compact-protrusion/spherical-sclera premises remain explicit limitations.
 * @evidence contracts/common.md#meaningful-documentation The prose gives metre geometry, radian chart, population provenance, painting convention and oversized-globe interpretation.
 * @evidence contracts/performance.md#efficient-algorithms Fixed four-variable normal equations and two protrusion scans require O(V) work/storage for neutral globe vertices.
 * @evidence contracts/performance.md#reuse-equivalent-work Each fitted sphere and axis is reused for its classification/angles, and texture preparation compiles the disc once per selected eye.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a small owned disc record escapes; mean-centred point/fit/classification arrays expire without resources.
 */
export function locateHumanFaceIrisDisc(
  positions: readonly (readonly [number, number, number])[],
): IHumanFaceIrisDisc {
  if (positions.length < 8)
    throw new Error("An iris disc needs at least eight globe vertices.");
  const first: { centre: [number, number, number]; radius: number } =
    fitSphere(positions);
  const firstAxis: [number, number, number] = protrusionAxis(positions, first);
  const sclera: (readonly [number, number, number])[] = positions.filter(
    (point: readonly [number, number, number]): boolean =>
      dot(unit(sub(point, first.centre)), firstAxis) < Math.cos(Math.PI / 4),
  );
  if (sclera.length < 4)
    throw new Error("An iris disc needs sclera vertices behind the cornea.");
  const sphere: { centre: [number, number, number]; radius: number } =
    fitSphere(sclera);
  if (2 * sphere.radius < HUMAN_FACE_LIMBAL_DIAMETER_MM / 1000)
    throw new Error(
      "The globe diameter cannot be smaller than the absolute iris diameter.",
    );
  const axis: [number, number, number] = protrusionAxis(positions, sphere);
  const up: [number, number, number] =
    Math.abs(axis[1]) > 0.999 ? [1, 0, 0] : [0, 1, 0];
  const reference: [number, number, number] = unit(
    sub(up, scale(axis, dot(up, axis))),
  );
  return {
    centre: sphere.centre,
    radius: sphere.radius,
    axis,
    reference,
    limbus: Math.asin(
      HUMAN_FACE_LIMBAL_DIAMETER_MM / 1000 / (2 * sphere.radius),
    ),
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
  // Mean centering reduces coordinate-origin contributions; conditioning
  // still depends on the actual sampled geometry.
  const mean: [number, number, number] = scale(
    points.reduce<[number, number, number]>(
      (
        sum: [number, number, number],
        point: readonly [number, number, number],
      ): [number, number, number] => add(sum, point),
      [0, 0, 0],
    ),
    1 / points.length,
  );
  const matrix: number[][] = Array.from({ length: 4 }, (): number[] => [
    0, 0, 0, 0, 0,
  ]);
  for (const [x, y, z] of points.map(
    (point: readonly [number, number, number]): [number, number, number] =>
      sub(point, mean),
  )) {
    const row: number[] = [2 * x, 2 * y, 2 * z, 1];
    const value: number = x * x + y * y + z * z;
    for (let i: number = 0; i < 4; ++i) {
      for (let j: number = 0; j < 4; ++j) matrix[i][j] += row[i] * row[j];
      matrix[i][4] += row[i] * value;
    }
  }
  for (let column: number = 0; column < 4; ++column) {
    let pivot: number = column;
    for (let row: number = column + 1; row < 4; ++row)
      if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column]))
        pivot = row;
    if (Math.abs(matrix[pivot][column]) < 1e-18)
      throw new Error("The globe vertices do not determine a sphere.");
    [matrix[column], matrix[pivot]] = [matrix[pivot], matrix[column]];
    for (let row: number = 0; row < 4; ++row) {
      if (row === column) continue;
      const factor: number = matrix[row][column] / matrix[column][column];
      for (let k: number = column; k < 5; ++k)
        matrix[row][k] -= factor * matrix[column][k];
    }
  }
  const solution: number[] = matrix.map(
    (row: number[], index: number): number => row[4] / row[index],
  );
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
  let largest: number = 0;
  for (const point of points) {
    const offset: [number, number, number] = sub(point, sphere.centre);
    const excess: number = Math.hypot(...offset) - sphere.radius;
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
  const length: number = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / length, a[1] / length, a[2] / length];
}
