import type { NodeArmDraw } from "./NodeArmDraw";

type V3 = [number, number, number];

/**
 * Smooth clay for `node:f1-body`: the skin's triangles drawn far to near
 * (painter's order) with Gouraud shading (Gouraud 1971): the Lambert
 * intensity is evaluated at each vertex from the skin's own unit vertex
 * normal (`AutoMovieHumanBodySurface.IOutput.normals`, read from the surfaces'
 * jets), not from the triangle's flat normal, and interpolated linearly
 * across the triangle. A flat face normal shades every facet of a tessellated
 * curved surface differently, which reads as faceting and as stripes along
 * the phase columns; the analytic normal is continuous wherever the surface
 * is (across a C2 continuation ring, for one), so the shading is too.
 *
 * The linear interpolation is exact on the canvas: an intensity linear in
 * screen space is a linear gradient along its screen gradient, from the
 * point of the triangle's least intensity to the point of its greatest. A
 * triangle whose intensities differ by under one grey level is filled flat.
 * Light: from the camera, raised 30 degrees, as `NodeArmDraw.clay`; a
 * triangle seen from behind shades with its normals reversed.
 */
export namespace NodeF1Shade {
  /** Draw the skin's triangles, `indices` into `positions` and `normals` (flat xyz). */
  export function clay(v: NodeArmDraw.IView, positions: readonly number[], normals: readonly number[], indices: readonly number[], colour: [number, number, number] = [196, 190, 182]): void {
    const f: V3 = v.forward;
    const lift: V3 = [-f[0], -f[1] + 0.6, -f[2]];
    const l: number = Math.hypot(...lift);
    const light: V3 = [lift[0] / l, lift[1] / l, lift[2] / l];
    const at: (i: number) => V3 = (i: number): V3 => [positions[3 * i]!, positions[3 * i + 1]!, positions[3 * i + 2]!];
    const normal: (i: number) => V3 = (i: number): V3 => [normals[3 * i]!, normals[3 * i + 1]!, normals[3 * i + 2]!];
    const order: { k: number; depth: number }[] = [];
    for (let k: number = 0; k + 2 < indices.length; k += 3) {
      const a: V3 = at(indices[k]!);
      const b: V3 = at(indices[k + 1]!);
      const c: V3 = at(indices[k + 2]!);
      order.push({ k, depth: (a[0] + b[0] + c[0]) * f[0] + (a[1] + b[1] + c[1]) * f[1] + (a[2] + b[2] + c[2]) * f[2] });
    }
    order.sort((x: { depth: number }, y: { depth: number }): number => y.depth - x.depth);
    const grey: (intensity: number) => string = (intensity: number): string => `rgb(${Math.round(colour[0] * intensity)},${Math.round(colour[1] * intensity)},${Math.round(colour[2] * intensity)})`;
    for (const { k } of order) {
      const ids: [number, number, number] = [indices[k]!, indices[k + 1]!, indices[k + 2]!];
      const p: V3[] = ids.map(at);
      const e1: V3 = [p[1]![0] - p[0]![0], p[1]![1] - p[0]![1], p[1]![2] - p[0]![2]];
      const e2: V3 = [p[2]![0] - p[0]![0], p[2]![1] - p[0]![1], p[2]![2] - p[0]![2]];
      const g: V3 = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      if (!(Math.hypot(...g) > 0)) continue;
      const back: number = g[0] * f[0] + g[1] * f[1] + g[2] * f[2] > 0 ? -1 : 1;
      const shade: number[] = ids.map((i: number): number => {
        const n: V3 = normal(i);
        const s: number = n[0] * light[0] + n[1] * light[1] + n[2] * light[2];
        // The vertex normal's own facing: a normal turned from this triangle's
        // side (a crease shared by two faces) takes the triangle's side.
        const side: number = (n[0] * g[0] + n[1] * g[1] + n[2] * g[2]) * back >= 0 ? back : -back;
        return 0.28 + 0.72 * Math.max(0, Number.isFinite(s) ? side * s : 0);
      });
      const screen: [number, number][] = p.map((q: V3): [number, number] => v.project(q));
      const [a, b, c]: [number, number][] = screen as [[number, number], [number, number], [number, number]];
      const det: number = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      const low: number = Math.min(...shade);
      const high: number = Math.max(...shade);
      if (high - low < 1 / 255 || !(Math.abs(det) > 1e-9)) v.g.fillStyle = grey((shade[0]! + shade[1]! + shade[2]!) / 3);
      else {
        // The screen gradient of the linear intensity I(x, y) = alpha x + beta y + gamma.
        const di1: number = shade[1]! - shade[0]!;
        const di2: number = shade[2]! - shade[0]!;
        const alpha: number = (di1 * (c[1] - a[1]) - di2 * (b[1] - a[1])) / det;
        const beta: number = (di2 * (b[0] - a[0]) - di1 * (c[0] - a[0])) / det;
        const g2: number = alpha * alpha + beta * beta;
        const from: number = (low - shade[0]!) / g2;
        const to: number = (high - shade[0]!) / g2;
        const gradient: ReturnType<typeof v.g.createLinearGradient> = v.g.createLinearGradient(a[0] + alpha * from, a[1] + beta * from, a[0] + alpha * to, a[1] + beta * to);
        gradient.addColorStop(0, grey(low));
        gradient.addColorStop(1, grey(high));
        v.g.fillStyle = gradient;
      }
      v.g.strokeStyle = grey((shade[0]! + shade[1]! + shade[2]!) / 3);
      v.g.lineWidth = 0.4;
      v.g.beginPath();
      v.g.moveTo(a[0], a[1]);
      v.g.lineTo(b[0], b[1]);
      v.g.lineTo(c[0], c[1]);
      v.g.closePath();
      v.g.fill();
      v.g.stroke();
    }
  }
}
