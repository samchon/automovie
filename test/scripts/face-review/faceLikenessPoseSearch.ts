/**
 * A photograph's camera direction from its landmarks, by reprojection.
 *
 * The published poses carried the yaw the detector's transformation matrix
 * reads and a pitch of zero, and the detector's pose is itself a fit of its
 * own canonical face, so a head whose proportions differ from that face, or a
 * photograph taken from above or below, left the camera several degrees off
 * (the detector read 9 to 19 degrees between photograph and render for seven
 * of seventeen subjects). The camera that took a photograph is instead the
 * one under which the model's own landmarks project onto the photograph's:
 * the perspective-n-point problem (Lepetit, Moreno-Noguer and Fua, Int J
 * Comput Vis 2009;81:155-166), here restricted to the capture rig's two free
 * angles. The residual of a direction is what is left after the best 2D
 * similarity (Umeyama, IEEE TPAMI 1991;13:376-380) takes the projected model
 * points onto the photograph's, over the photograph points' own spread, so
 * image position, scale and roll cancel and only the view's perspective
 * remains. `searchFaceLikenessPose` scans yaw and pitch on a grid `step`
 * apart within `span` of the given pose, then again at a quarter step around
 * the best. The caller passes interior landmarks only: a silhouette landmark
 * is a different surface point from every direction
 * (`FACE_LIKENESS_SILHOUETTE`). Pure.
 */
import type { IFaceLikenessCamera } from "./faceLikenessFraming";
import { faceShapeFitProject, faceShapeFitView } from "./faceShapeFitCamera";

/**
 * The detector's face-oval landmarks, whose surface point depends on the
 * view (MediaPipe face mesh `FACEMESH_FACE_OVAL`).
 */
export const FACE_LIKENESS_SILHOUETTE: readonly number[] = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109,
];

/**
 * RMS distance, over the fixed points' RMS spread about their centroid,
 * after the least-squares 2D similarity that takes `moving` onto `fixed`.
 */
export function faceLikenessSimilarityResidual(
  moving: readonly (readonly [number, number])[],
  fixed: readonly (readonly [number, number])[],
): number {
  const n = moving.length;
  if (n < 3 || fixed.length !== n)
    throw new Error("A similarity residual needs three or more point pairs.");
  const mean = (points: readonly (readonly [number, number])[]) =>
    [0, 1].map((a) => points.reduce((sum, p) => sum + p[a]!, 0) / n);
  const [ma, mb] = [mean(moving), mean(fixed)];
  let dot = 0;
  let wedge = 0;
  let spread = 0;
  let target = 0;
  for (let i = 0; i < n; ++i) {
    const ax = moving[i]![0] - ma[0]!;
    const ay = moving[i]![1] - ma[1]!;
    const bx = fixed[i]![0] - mb[0]!;
    const by = fixed[i]![1] - mb[1]!;
    dot += ax * bx + ay * by;
    wedge += ax * by - ay * bx;
    spread += ax * ax + ay * ay;
    target += bx * bx + by * by;
  }
  if (!(spread > 0) || !(target > 0))
    throw new Error("A similarity residual needs points that spread.");
  // The optimal similarity leaves target - (dot^2 + wedge^2) / spread.
  const left = Math.max(0, target - (dot * dot + wedge * wedge) / spread);
  return Math.sqrt(left / target);
}

/** The camera direction whose projection best matches the photograph. */
export function searchFaceLikenessPose(props: {
  /** Model points in the basis frame, metres, paired with `photo`. */
  model: readonly (readonly [number, number, number])[];
  /** The photograph's landmarks, pixels. */
  photo: readonly (readonly [number, number])[];
  pose: IFaceLikenessCamera;
  span: number;
  step: number;
}): { yaw: number; pitch: number; residual: number; before: number } {
  const { pose, model, photo } = props;
  if (!(props.step > 0) || !(props.span >= props.step))
    throw new Error("A pose search needs a positive step within its span.");
  const residual = (yaw: number, pitch: number) => {
    const view = faceShapeFitView({ ...pose, yaw, pitch });
    return faceLikenessSimilarityResidual(
      model.map((point) => faceShapeFitProject(view, point)),
      photo,
    );
  };
  const scan = (
    centre: { yaw: number; pitch: number },
    span: number,
    step: number,
  ) => {
    let best = { ...centre, residual: residual(centre.yaw, centre.pitch) };
    const count = Math.round(span / step);
    for (let i = -count; i <= count; ++i)
      for (let j = -count; j <= count; ++j) {
        const yaw = centre.yaw + i * step;
        const pitch = centre.pitch + j * step;
        const value = residual(yaw, pitch);
        if (value < best.residual) best = { yaw, pitch, residual: value };
      }
    return best;
  };
  const coarse = scan(pose, props.span, props.step);
  const fine = scan(coarse, props.step, props.step / 4);
  return { ...fine, before: residual(pose.yaw, pose.pitch) };
}
