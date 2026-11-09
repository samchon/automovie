import type { NodeCanvasTypes } from "./NodeCanvasTypes";

/**
 * Cameras of the one-shot capture, in the existing Node display frame (+X
 * forward, +Y up, +Z anatomical left, metres; `NodeCanvasCamera`): the six
 * axis views, a high and a low oblique from the front-left, and an oblique
 * close-up at each joint or port. Each camera is orthographic and fitted to
 * the points it frames with the existing 12 % screen margin and caption
 * reserve, so the same points give the same resolved camera in every stage.
 */
export namespace CaptureCameras {
  type V3 = NodeCanvasTypes.Point;

  /** A named view direction: `back` points from the target toward the camera; `up` is the screen-up hint. */
  export interface IDirection {
    /** Camera name. */
    name: string;

    /** Unit direction toward the camera. */
    back: V3;

    /** Screen-up hint, not parallel to `back`. */
    up: V3;
  }

  /**
   * The standard views. Top looks down with +X (forward) toward the image
   * bottom, as `NodeCanvasCamera` does; bottom looks up with +X toward the
   * image top. The obliques stand front-left, atan(0.7 / sqrt 2) = 26.3
   * degrees above and below the horizontal; the vector is a display choice,
   * not an anatomical one.
   */
  export const STANDARD: readonly IDirection[] = [
    { name: "front", back: [1, 0, 0], up: [0, 1, 0] },
    { name: "left", back: [0, 0, 1], up: [0, 1, 0] },
    { name: "right", back: [0, 0, -1], up: [0, 1, 0] },
    { name: "back", back: [-1, 0, 0], up: [0, 1, 0] },
    { name: "top", back: [0, 1, 0], up: [-1, 0, 0] },
    { name: "bottom", back: [0, -1, 0], up: [1, 0, 0] },
    { name: "high-oblique", back: unit([1, 0.7, 1]), up: [0, 1, 0] },
    { name: "low-oblique", back: unit([1, -0.7, 1]), up: [0, 1, 0] },
  ];

  /** Close-up direction at a port: front-left, slightly above, as the arm experiment's elbow oblique. */
  export const CLOSEUP: V3 = unit([1, 0.4, 1]);

  /** Name of the close-up at a port. */
  export function closeupName(port: string): string {
    return `closeup.${port}`;
  }

  /** Standard camera names in capture order. */
  export function names(): string[] {
    return STANDARD.map((d: IDirection): string => d.name);
  }

  /**
   * Fit an orthographic camera looking along `-direction.back` to the given
   * points: target at the bounding-box centre, scale so the larger projected
   * half extent fills 88 % of the drawable area (width minus 40 px, height
   * minus the 110 px caption reserve of `NodeCanvasRaster`). `minimum` is the
   * smallest framed extent in metres, so a straight line seen end-on keeps a
   * finite scale.
   */
  export function fit(direction: IDirection, points: readonly V3[], width: number, height: number, minimum: number): NodeCanvasTypes.Camera {
    if (points.length === 0) throw new Error(`Cannot frame an empty selection for camera ${direction.name}`);
    const back: V3 = unit(direction.back);
    const right: V3 = unit(cross(direction.up, back));
    const up: V3 = cross(back, right);
    const low: V3 = [Infinity, Infinity, Infinity];
    const high: V3 = [-Infinity, -Infinity, -Infinity];
    for (const p of points)
      for (let c: number = 0; c < 3; ++c) {
        low[c] = Math.min(low[c]!, p[c]!);
        high[c] = Math.max(high[c]!, p[c]!);
      }
    const target: V3 = [(low[0] + high[0]) / 2, (low[1] + high[1]) / 2, (low[2] + high[2]) / 2];
    let ex: number = minimum / 2;
    let ey: number = minimum / 2;
    for (const p of points) {
      const d: V3 = [p[0] - target[0], p[1] - target[1], p[2] - target[2]];
      ex = Math.max(ex, Math.abs(dot(d, right)));
      ey = Math.max(ey, Math.abs(dot(d, up)));
    }
    const scale: number = 0.88 * Math.min((width - 40) / (2 * ex), (height - 110) / (2 * ey));
    return { name: direction.name, target: plain(target), back: plain(back), right: plain(right), up: plain(up), scale, width, height };
  }

  /**
   * The vector with negative zeros written as zero. JSON stores -0 as 0, so a
   * camera read back from a manifest would otherwise differ from the fitted
   * one in the reference-background cache key, which keeps -0 distinct.
   */
  function plain(v: V3): V3 {
    return [v[0] === 0 ? 0 : v[0], v[1] === 0 ? 0 : v[1], v[2] === 0 ? 0 : v[2]];
  }

  /**
   * Fields of a camera that are not finite (target, basis or scale). A
   * camera with any such field projects nothing onto the canvas, so a cell
   * holding one is reported unavailable with these fields as its cause.
   */
  export function invalid(camera: NodeCanvasTypes.Camera): string[] {
    const out: string[] = [];
    for (const [name, v] of [["target", camera.target], ["back", camera.back], ["right", camera.right], ["up", camera.up]] as const)
      for (let k: number = 0; k < 3; ++k) if (!Number.isFinite(v[k])) out.push(`${name}[${k}]`);
    if (!(Number.isFinite(camera.scale) && camera.scale > 0)) out.push("scale");
    return out;
  }

  /** A close-up at a port: the box of half size `radius` about the port centre, seen from {@link CLOSEUP}. */
  export function closeup(port: { name: string; point: V3; radius: number }, width: number, height: number): NodeCanvasTypes.Camera {
    const r: number = port.radius;
    const corners: V3[] = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) corners.push([port.point[0] + sx * r, port.point[1] + sy * r, port.point[2] + sz * r]);
    const camera: NodeCanvasTypes.Camera = fit({ name: closeupName(port.name), back: CLOSEUP, up: [0, 1, 0] }, corners, width, height, 2 * r);
    return { ...camera, target: plain(port.point) };
  }

  /**
   * Ports a curve row shows a close-up for: those whose centre lies within
   * its radius of some curve point, so a humerus outline gets the shoulder
   * and elbow close-ups but not the wrist.
   */
  export function near<P extends { point: V3; radius: number }>(ports: readonly P[], points: readonly V3[]): P[] {
    return ports.filter((port: P): boolean => points.some((p: V3): boolean => Math.hypot(p[0] - port.point[0], p[1] - port.point[1], p[2] - port.point[2]) <= port.radius));
  }

  function dot(a: V3, b: V3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function cross(a: V3, b: V3): V3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  function unit(a: V3): V3 {
    const n: number = Math.hypot(a[0], a[1], a[2]);
    if (!(n > 0 && Number.isFinite(n))) throw new Error("Invalid camera direction");
    return [a[0] / n, a[1] / n, a[2] / n];
  }
}
