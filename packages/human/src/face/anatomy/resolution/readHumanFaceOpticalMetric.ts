import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieHumanFaceOpticalMetric } from "./AutoMovieHumanFaceOpticalMetric";
import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * Measure one independent optical quantity on the final Float32 geometry.
 *
 * The regular iris annulus supplies its centroid and oriented plane. Radial
 * extrema of its emitted vertices supply its two diameters; cornea/sclera
 * projection extrema supply complete axial length. The highest corneal
 * projection is the anterior support, and the two axial cap points supply
 * central shell thickness. These are model-space quantities rather than
 * apparent diameters after corneal refraction or an illumination response.
 *
 * Near-apex curvature is a quartic-section reconstruction from the first two
 * resolved radial rings: solve their actual height differences for the r²
 * coefficient B, then radius=-1/(2B). This measures the generated polynomial
 * convention, not a clinical biconic cornea. Clustering uses eight Float32
 * relative epsilons of the observed coordinate scale, an arithmetic envelope
 * for rounded XYZ and plane transport. Unresolved rings or axial points return
 * a named instrument gap instead of an authored number or an infinite radius.
 */
export function readHumanFaceOpticalMetric(
  context: IHumanFaceMeasurementContext,
  side: "left" | "right",
  metric: AutoMovieHumanFaceOpticalMetric,
): number | IHumanFaceMeasurementGap {
  const iris = context.opticalMesh?.(side, "iris");
  const cornea = context.opticalMesh?.(side, "cornea");
  const sclera = context.opticalMesh?.(side, "sclera");
  const gap = (cause: string): IHumanFaceMeasurementGap => ({
    reason: `unread ${side} optical ${metric}: ${cause}`,
  });
  if (
    iris === undefined ||
    iris === null ||
    cornea === undefined ||
    cornea === null ||
    sclera === undefined ||
    sclera === null
  )
    return gap(
      "this build emits no independent iris, cornea and sclera assembly",
    );
  const point = (values: readonly number[], at: number): IAutoMovieVector3 =>
    Vector3.create(values[3 * at], values[3 * at + 1], values[3 * at + 2]);
  const arrays = [iris.positions, cornea.positions, sclera.positions];
  if (
    arrays.some(
      (values) =>
        values.length < 9 ||
        values.length % 3 !== 0 ||
        !values.every(Number.isFinite),
    )
  )
    return gap("incomplete or nonfinite final coordinate buffers");
  const count = iris.positions.length / 3;
  const sums = [0, 0, 0];
  for (let at = 0; at < iris.positions.length; at++)
    sums[at % 3] += iris.positions[at];
  const center = Vector3.create(
    sums[0] / count,
    sums[1] / count,
    sums[2] / count,
  );
  let area = Vector3.create();
  const indices = iris.indices ?? Array.from({ length: count }, (_, at) => at);
  for (let at = 0; at < indices.length; at += 3) {
    const [a, b, c] = indices
      .slice(at, at + 3)
      .map((id) => point(iris.positions, id));
    area = Vector3.add(
      area,
      Vector3.cross(Vector3.subtract(b, a), Vector3.subtract(c, a)),
    );
  }
  if (!Number.isFinite(Vector3.length(area)) || Vector3.length(area) === 0)
    return gap("iris plane has no resolved oriented area");
  const axis = Vector3.normalize(area);
  const irisRadii = Array.from({ length: count }, (_, at) =>
    Vector3.length(Vector3.subtract(point(iris.positions, at), center)),
  );
  if (metric === "irisOuterDiameter") return 2000 * Math.max(...irisRadii);
  if (metric === "irisApertureDiameter") return 2000 * Math.min(...irisRadii);
  const project = (p: IAutoMovieVector3): number =>
    Vector3.dot(Vector3.subtract(p, center), axis);
  const corneal = Array.from({ length: cornea.positions.length / 3 }, (_, at) =>
    point(cornea.positions, at),
  );
  const scleral = Array.from({ length: sclera.positions.length / 3 }, (_, at) =>
    point(sclera.positions, at),
  );
  const front = Math.max(...corneal.map(project));
  if (metric === "irisDepthFromAnteriorSupport") return 1000 * front;
  if (metric === "globeAxialLength")
    return 1000 * (front - Math.min(...scleral.map(project)));
  const apex = corneal.find((p) => project(p) === front)!;
  const radial = (p: IAutoMovieVector3): number => {
    const delta = Vector3.subtract(p, apex);
    return Vector3.length(
      Vector3.subtract(delta, Vector3.scale(axis, Vector3.dot(delta, axis))),
    );
  };
  const scale = Math.max(...arrays.flatMap((values) => values.map(Math.abs)));
  const uncertainty = 8 * 2 ** -23 * scale;
  const axial = corneal.filter((p) => radial(p) <= uncertainty).map(project);
  if (metric === "centralCornealThickness") {
    if (axial.length < 2)
      return gap(
        "the two axial shell points are unresolved at output precision",
      );
    return 1000 * (Math.max(...axial) - Math.min(...axial));
  }
  const rim = Math.max(...scleral.map(project));
  const limbal = scleral.filter(
    (p) => Math.abs(project(p) - rim) <= uncertainty,
  );
  if (metric === "horizontalLimbusDiameter")
    return (
      (2000 * limbal.reduce((sum, p) => sum + radial(p), 0)) / limbal.length
    );
  const radii = corneal
    .map(radial)
    .filter((r) => r > uncertainty)
    .sort((a, b) => a - b);
  const r1 = radii[0],
    r2 = radii.find((r) => r > r1 + 2 * uncertainty);
  if (r2 === undefined)
    return gap(
      "two separate near-apex rings cannot be resolved at output precision",
    );
  const h1 =
    Math.max(
      ...corneal
        .filter((p) => Math.abs(radial(p) - r1) <= uncertainty)
        .map(project),
    ) - front;
  const h2 =
    Math.max(
      ...corneal
        .filter((p) => Math.abs(radial(p) - r2) <= uncertainty)
        .map(project),
    ) - front;
  const q1 = r1 * r1,
    q2 = r2 * r2;
  const b = (h1 * q2 * q2 - h2 * q1 * q1) / (q1 * q2 * q2 - q2 * q1 * q1);
  const radius = -1 / (2 * b);
  return Number.isFinite(radius) && radius > 0
    ? radius * 1000
    : gap(
        "near-apex curvature is unresolved or has the wrong section orientation",
      );
}
