import { createCanvas, type Canvas, type SKRSContext2D } from "@napi-rs/canvas";

type V3 = [number, number, number];

/**
 * Orthographic Node canvas for the arm experiment (`node:arm-specs`): a camera
 * framed on given world bounds, polylines, point clouds, labels and a flat
 * Lambert clay raster of triangles drawn back to front (painter's order).
 * Display only: it measures nothing and owns no geometry.
 */
export namespace NodeArmDraw {
  /** A framed orthographic view. */
  export interface IView {
    /** Canvas context. */
    g: SKRSContext2D;

    /** The canvas. */
    canvas: Canvas;

    /** World point to pixel. */
    project: (p: V3) => [number, number];

    /** Unit viewing direction (camera into the scene). */
    forward: V3;
  }

  /** Canvas edge, px. */
  export const SIZE: number = 1000;

  /** Open a white canvas framing every given point with a 6 % margin. */
  export function open(forward: V3, bounds: readonly V3[]): IView {
    const f: V3 = unit(forward);
    const up0: V3 = Math.abs(f[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    const right: V3 = unit(cross(f, up0));
    const up: V3 = cross(right, f);
    const xs: number[] = bounds.map((p: V3): number => dot(p, right));
    const ys: number[] = bounds.map((p: V3): number => dot(p, up));
    const [x0, x1, y0, y1]: number[] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const scale: number = (SIZE * 0.88) / Math.max(x1 - x0, y1 - y0, 1);
    const cx: number = (x0 + x1) / 2;
    const cy: number = (y0 + y1) / 2;
    const canvas: Canvas = createCanvas(SIZE, SIZE);
    const g: SKRSContext2D = canvas.getContext("2d");
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, SIZE, SIZE);
    return { g, canvas, forward: f, project: (p: V3): [number, number] => [SIZE / 2 + (dot(p, right) - cx) * scale, SIZE / 2 - (dot(p, up) - cy) * scale] };
  }

  /** Stroke a polyline. */
  export function line(v: IView, points: readonly V3[], colour: string, width: number, dash: number[] = []): void {
    if (points.length < 2) return;
    v.g.strokeStyle = colour;
    v.g.lineWidth = width;
    v.g.setLineDash(dash);
    v.g.beginPath();
    points.forEach((p: V3, k: number): void => {
      const [x, y]: [number, number] = v.project(p);
      if (k === 0) v.g.moveTo(x, y);
      else v.g.lineTo(x, y);
    });
    v.g.stroke();
    v.g.setLineDash([]);
  }

  /** Square markers. */
  export function dots(v: IView, points: readonly V3[], colour: string, size: number): void {
    v.g.fillStyle = colour;
    for (const p of points) {
      const [x, y]: [number, number] = v.project(p);
      v.g.fillRect(x - size / 2, y - size / 2, size, size);
    }
  }

  /** A text label at a point. */
  export function text(v: IView, p: V3, value: string, colour: string): void {
    const [x, y]: [number, number] = v.project(p);
    v.g.fillStyle = colour;
    v.g.font = "11px sans-serif";
    v.g.fillText(value, x + 4, y - 4);
  }

  /** Caption in the top-left corner. */
  export function caption(v: IView, lines: readonly string[]): void {
    v.g.fillStyle = "#000000";
    v.g.font = "13px sans-serif";
    lines.forEach((l: string, k: number): void => v.g.fillText(l, 10, 18 + 16 * k));
  }

  /**
   * Flat clay: each triangle filled with a grey of Lambert shading under a
   * light from the camera, raised 30 degrees, and drawn far to near.
   */
  export function clay(v: IView, triangles: readonly [V3, V3, V3][], colour: [number, number, number] = [196, 190, 182]): void {
    const light: V3 = unit(add(scale(v.forward, -1), [0, 0.6, 0]));
    const order: { t: [V3, V3, V3]; depth: number }[] = triangles.map((t: [V3, V3, V3]): { t: [V3, V3, V3]; depth: number } => ({ t, depth: dot(add(add(t[0], t[1]), t[2]), v.forward) }));
    order.sort((a: { depth: number }, b: { depth: number }): number => b.depth - a.depth);
    for (const { t } of order) {
      const n0: V3 = cross(sub(t[1], t[0]), sub(t[2], t[0]));
      const len: number = Math.hypot(...n0);
      if (!(len > 0)) continue;
      const n: V3 = scale(n0, (dot(n0, v.forward) > 0 ? -1 : 1) / len);
      const k: number = 0.28 + 0.72 * Math.max(0, dot(n, light));
      v.g.fillStyle = `rgb(${Math.round(colour[0] * k)},${Math.round(colour[1] * k)},${Math.round(colour[2] * k)})`;
      v.g.strokeStyle = v.g.fillStyle;
      v.g.lineWidth = 0.6;
      v.g.beginPath();
      const [a, b, c]: [number, number][] = t.map((p: V3): [number, number] => v.project(p));
      v.g.moveTo(a![0], a![1]);
      v.g.lineTo(b![0], b![1]);
      v.g.lineTo(c![0], c![1]);
      v.g.closePath();
      v.g.fill();
      v.g.stroke();
    }
  }

  /** PNG bytes. */
  export function png(v: IView): Buffer {
    return v.canvas.toBuffer("image/png");
  }

  /** Vector sum. */
  export function add(a: V3, b: V3): V3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /** Vector difference. */
  export function sub(a: V3, b: V3): V3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /** Vector times a scalar. */
  export function scale(a: V3, s: number): V3 {
    return [a[0] * s, a[1] * s, a[2] * s];
  }

  /** Dot product. */
  export function dot(a: V3, b: V3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** Cross product. */
  export function cross(a: V3, b: V3): V3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  /** Unit vector (no zero guard; display only). */
  export function unit(a: V3): V3 {
    const n: number = Math.hypot(a[0], a[1], a[2]);
    return [a[0] / n, a[1] / n, a[2] / n];
  }
}
