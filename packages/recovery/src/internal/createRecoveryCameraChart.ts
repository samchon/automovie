import { AutoMovieMatrix3 } from "@automovie/engine";
import type { IAutoMovieRecoveryCameraChartCreationOperation } from "@automovie/interface";

/**
 * Build a supplied pinhole K and its analytic inverse in the resident pixel
 * chart. Check pixel-step round trips before any correspondence is normalized.
 * A large principal offset may destroy pixel differences even when each scalar
 * is finite. Such a chart refuses rather than being recentered with unknown
 * provenance.
 */
export function createRecoveryCameraChart(
  view: Parameters<IAutoMovieRecoveryCameraChartCreationOperation.Operation>[0],
): ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation> {
  const [fx, fy]: [number, number] = view.camera.focalPx;
  const [cx, cy]: [number, number] = view.camera.principalPointPx;
  const skew: number = view.camera.skewPx;
  const sx: number = 1 / fx,
    sy: number = 1 / fy,
    skewRatio: number = skew / fy;
  const matrix: number[] = [fx, skew, cx, 0, fy, cy, 0, 0, 1];
  const inverse: number[] = [
    sx,
    -skewRatio * sx,
    (skewRatio * cy - cx) * sx,
    0,
    sy,
    -cy * sy,
    0,
    0,
    1,
  ];
  if (!(fx > 0 && fy > 0))
    throw new Error(
      "camera-chart: pinhole calibration inverse is not representable",
    );
  const coordinates: [number, number][] = [
    [0, 0],
    [1, 0],
    [0, 1],
    [view.width - 1, 0],
    [view.width - 1, view.height - 1],
  ];
  const rays: [number, number, number][] = [];
  const tolerance: number =
    256 * Number.EPSILON * Math.max(1, view.width, view.height);
  for (const point of coordinates) {
    const ray: [number, number, number] = AutoMovieMatrix3.apply(inverse, [
      ...point,
      1,
    ]);
    const back: [number, number, number] = AutoMovieMatrix3.apply(matrix, ray);
    if (
      Math.abs(back[0] - point[0]) > tolerance ||
      Math.abs(back[1] - point[1]) > tolerance ||
      back[2] !== 1
    )
      throw new Error(
        "camera-chart: supplied pixel-centre round trip loses image increments",
      );
    rays.push(ray);
  }
  if (!(rays[1]![0] > rays[0]![0] && rays[2]![1] > rays[0]![1]))
    throw new Error(
      "camera-chart: distinct image-axis increments are not representable",
    );
  return { matrix, inverse };
}
