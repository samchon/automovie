/**
 * Camera framing that lets a render observe all of a photograph's hair.
 *
 * `plan-face-likeness-views.ts` calls this after a first capture at the
 * default portrait distance has been aligned to the photograph. The hair IoU
 * is only meaningful where the render sees the same image area as the
 * photograph, and long hair or a low ponytail leaves the 0.62 m portrait
 * frame. The same rule is applied to every subject: take the photograph
 * region to be observed (its hair mask bounds together with the head
 * region), map its corners back into the first render's pixels through the
 * inverse landmark similarity, convert them to metres on the plane through
 * the camera target, and choose the distance and target that fit that box
 * plus a margin into the square viewport at the same yaw and pitch.
 *
 * The camera model is `capture-articulation.mjs`'s: a square perspective
 * view of `fovDegrees` vertical field, camera at
 * `target + distance * (cos p sin y, sin p, cos p cos y)` in the export's
 * Y-up metre frame, looking at the target. The fit is exact for points on the
 * target plane and approximate for hair in front of or behind it, so the
 * measurement verifies the achieved coverage instead of trusting the plan.
 * It is framing only; it never changes the model or the camera direction.
 */
import {
  type IFaceLikenessSimilarity,
  applyFaceLikenessSimilarity,
  invertFaceLikenessSimilarity,
} from "./faceLikenessGeometry";
import type { IFaceLikenessRegion } from "./faceLikenessMasks";

/** One capture camera as the capture page reads it. */
export interface IFaceLikenessCamera {
  yaw: number;
  pitch: number;
  distance: number;
  target: [number, number, number];
}

/**
 * Fit a camera at the same direction as `camera` whose square frame holds
 * `region` (photograph pixels) with `margin` extra extent on its larger side.
 * `renderToReference` maps the `viewport`-pixel render taken with `camera`
 * into photograph pixels.
 */
export function planFaceLikenessFrame(props: {
  camera: IFaceLikenessCamera;
  renderToReference: IFaceLikenessSimilarity;
  region: IFaceLikenessRegion;
  viewport: number;
  fovDegrees: number;
  margin: number;
}): IFaceLikenessCamera {
  const { camera, region, viewport } = props;
  if (!(props.margin >= 0))
    throw new Error("A frame margin must be non-negative.");
  if (!(region.x1 > region.x0 && region.y1 > region.y0))
    throw new Error("A frame region must have positive area.");
  const halfTangent = Math.tan((props.fovDegrees * Math.PI) / 360);
  const metresPerPixel = (2 * camera.distance * halfTangent) / viewport;
  const inverse = invertFaceLikenessSimilarity(props.renderToReference);
  const plane = (
    [
      [region.x0, region.y0],
      [region.x1, region.y0],
      [region.x0, region.y1],
      [region.x1, region.y1],
    ] as const
  ).map((corner) => {
    const [x, y] = applyFaceLikenessSimilarity(inverse, corner);
    // Screen right is +u and screen up is +v, measured from the frame centre.
    return [
      (x - viewport / 2) * metresPerPixel,
      (viewport / 2 - y) * metresPerPixel,
    ];
  });
  const u0 = Math.min(...plane.map(([u]) => u!));
  const u1 = Math.max(...plane.map(([u]) => u!));
  const v0 = Math.min(...plane.map(([, v]) => v!));
  const v1 = Math.max(...plane.map(([, v]) => v!));
  const extent = Math.max(u1 - u0, v1 - v0) * (1 + props.margin);
  const uc = (u0 + u1) / 2;
  const vc = (v0 + v1) / 2;
  const yaw = (camera.yaw * Math.PI) / 180;
  const pitch = (camera.pitch * Math.PI) / 180;
  const right = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const up = [
    -Math.sin(pitch) * Math.sin(yaw),
    Math.cos(pitch),
    -Math.sin(pitch) * Math.cos(yaw),
  ];
  return {
    yaw: camera.yaw,
    pitch: camera.pitch,
    distance: extent / (2 * halfTangent),
    target: [0, 1, 2].map(
      (axis) => camera.target[axis]! + uc * right[axis]! + vc * up[axis]!,
    ) as [number, number, number],
  };
}

/** Smallest region holding every given region. */
export function faceLikenessRegionUnion(
  regions: readonly IFaceLikenessRegion[],
): IFaceLikenessRegion {
  if (regions.length === 0) throw new Error("No regions to join.");
  return {
    x0: Math.min(...regions.map((region) => region.x0)),
    y0: Math.min(...regions.map((region) => region.y0)),
    x1: Math.max(...regions.map((region) => region.x1)),
    y1: Math.max(...regions.map((region) => region.y1)),
  };
}
