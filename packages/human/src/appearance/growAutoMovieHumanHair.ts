import { IAutoMovieMesh } from "@automovie/interface";

import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanAppearance } from "../structures/IAutoMovieHumanAppearance";
import { AutoMovieHumanCardBuilder } from "./AutoMovieHumanCardBuilder";
import { AutoMovieHumanHeadSurface } from "./AutoMovieHumanHeadSurface";
import { frameAutoMovieHumanScalp } from "./frameAutoMovieHumanScalp";
import { paintAutoMovieHumanHairStrands } from "./paintAutoMovieHumanHairStrands";

/**
 * Grow scalp hair as cards over the head's surface: an opaque cap inside the hairline, then shells of cards from the scalp outward.
 *
 * Roots are semantic addresses on the head's chart, a jittered grid of equal area on its canonical sphere, kept where the scalp's density allows; every root is evaluated on the head the skin generator built, so hair follows any head. Each root grows a guide curve (Scheuermann 2004 practice, generated directly rather than clustered from strands): it leaves the scalp along the style's direction field lifted by a small angle, bends under gravity, keeps at least its shell's clearance above the skin by a radial map of the head taken from the same surface, and waves by the curl type. A card is a strip along the guide that tapers to the tip, textured with one lock of the strand atlas, its shading normal pointing away from the head's centre so a shell of cards shades like a smooth mass of hair. Cards are emitted cap first, then inner shell to outer shell, so the index buffer is sorted from the scalp outward, the drawing order of layered hair cards.
 *
 * The appearance's style chooses among three short cuts: a crop whose hair lies away from the crown's whorl; a short cut with tapered back and sides, combed back from a side parting; a bob parted at the midline that hangs to a level cut the hair's length below the vertex, at most to the shoulders. Curl types I and II are straight; III to VIII wave with growing amplitude and shorter period, and the coiled types stand further off the scalp. All sizes are conventional, chosen to read as hair: strand density and diameter set no card count here because a card stands for a lock.
 *
 * @param props.surface The head's surface
 * @param props.scalp The scalp's centre and density
 * @param props.skeleton The skeleton at rest, for the shoulders' level
 * @param props.hair The appearance's hair
 * @returns The cards as one mesh, millimetres, model frame at rest; null for a shaved scalp
 */
export function growAutoMovieHumanHair(props: {
  surface: AutoMovieHumanHeadSurface;
  scalp: frameAutoMovieHumanScalp.IScalp;
  skeleton: IAutoMovieHumanSkeleton;
  hair: IAutoMovieHumanAppearance.IHair;
}): IAutoMovieMesh | null {
  const { surface, scalp, hair } = props;
  if (hair.length <= 0) return null;
  const C: readonly number[] = scalp.centre;
  const style: IAutoMovieHumanAppearance.IHair["style"] = hair.style;
  const curl: number = CURLS.indexOf(hair.curl);
  const wave: { amplitude: number; period: number; stand: number } = {
    amplitude: curl < 2 ? 0 : [0, 0, 1.2, 2, 3, 3.5, 4, 4][curl]!,
    period: [1, 1, 40, 30, 20, 14, 9, 6][curl]!,
    stand: [1, 1, 1, 1.1, 1.3, 1.5, 1.9, 2.2][curl]!,
  };
  const radius: (p: readonly number[]) => number = surface.radii(C);
  const l = props.skeleton.landmarks;
  const R: number = l.vertex.position.y - C[1]!;
  const shoulders: number =
    (l.left.acromion.position.y + l.right.acromion.position.y) / 2 + 25;
  const crown: number[] = [0, C[1]! + 0.85 * R, C[2]! - 0.45 * (C[2]! - l.opisthocranion.position.z)];
  const part: number = style === "bob" ? 0 : 0.3 * (l.left.eurion.position.x - l.right.eurion.position.x) / 2;
  const cut: number = Math.max(shoulders, l.vertex.position.y - hair.length);
  const builder: AutoMovieHumanCardBuilder = new AutoMovieHumanCardBuilder();

  // the cap: the scalp's own surface lifted a little, opaque, inset from the hairline
  const capRows: number = 96;
  const capCols: number = 192;
  const grid: Array<Array<AutoMovieHumanHeadSurface.IPoint | null>> = [];
  for (let i: number = 0; i <= capRows; ++i) {
    const row: Array<AutoMovieHumanHeadSurface.IPoint | null> = [];
    for (let j: number = 0; j <= capCols; ++j) {
      const u: number = 0.3 + (0.7 * i) / capRows;
      const point: AutoMovieHumanHeadSurface.IPoint | null = surface.toward(C, Math.min(u, 0.9999), j / capCols);
      row.push(point !== null && scalp.density(point.position) >= 0.99 ? point : null);
    }
    grid.push(row);
  }
  const cap: number = 0.25 * wave.stand;
  // the middle fifth of the opaque band: wide enough for a tangent frame from texture derivatives, narrow enough to stay opaque at small mip levels
  const capU: number = (paintAutoMovieHumanHairStrands.COLUMNS.solid[0] + paintAutoMovieHumanHairStrands.COLUMNS.solid[1]) / 2;
  for (let i: number = 0; i < capRows; ++i)
    for (let j: number = 0; j < capCols; ++j) {
      const a = grid[i]![j]!;
      const b = grid[i]![j + 1]!;
      const c = grid[i + 1]![j]!;
      const d = grid[i + 1]![j + 1]!;
      if (a === null || b === null || c === null || d === null) continue;
      const lift = (p: AutoMovieHumanHeadSurface.IPoint): [number, number, number] => [
        p.position[0] + cap * p.normal[0],
        p.position[1] + cap * p.normal[1],
        p.position[2] + cap * p.normal[2],
      ];
      const pa = lift(a);
      const pb = lift(b);
      const across: number[] = sub(pb, pa);
      const width: number = Math.hypot(across[0]!, across[1]!, across[2]!);
      if (width < 1e-6) continue;
      const side: [number, number, number] = [across[0]! / width, across[1]! / width, across[2]! / width];
      const mid = (p: [number, number, number], q: [number, number, number]): [number, number, number] => [
        (p[0] + q[0]) / 2,
        (p[1] + q[1]) / 2,
        (p[2] + q[2]) / 2,
      ];
      builder.card({
        points: [mid(pa, pb), mid(lift(c), lift(d))],
        sides: [side, side],
        normals: [a.normal, c.normal],
        widths: [width, Math.hypot(...(sub(lift(d), lift(c)) as [number, number, number]))],
        column: [capU - 0.02, capU + 0.02],
        v: [0.4, 0.6],
      });
    }

  // shells of cards, inner first
  const shells: Array<{ offset: number; spacing: number; length: number }> =
    style === "crop"
      ? [
          { offset: 0.5, spacing: 5, length: 1 },
          { offset: 1.2, spacing: 6, length: 1 },
        ]
      : [
          { offset: 0.6, spacing: 4.5, length: 0.85 },
          { offset: 1.8, spacing: 5, length: 0.95 },
          { offset: 3.0, spacing: 5.5, length: 1 },
        ];
  shells.forEach((shell, layer: number): void => {
    // equal-area rows on the chart's canonical sphere, the step set from the head's radius
    const step: number = shell.spacing / R;
    const rows: number = Math.ceil((0.7 * Math.PI) / step);
    for (let i: number = 0; i < rows; ++i) {
      const latitude: number = -0.2 * Math.PI + (i + 0.5) * ((0.7 * Math.PI) / rows);
      const cols: number = Math.max(1, Math.round((2 * Math.PI * Math.cos(latitude)) / step));
      for (let j: number = 0; j < cols; ++j) {
        const jitterU: number = hash(layer, i, j, 0) - 0.5;
        const jitterV: number = hash(layer, i, j, 1) - 0.5;
        const lat: number = latitude + jitterU * ((0.7 * Math.PI) / rows);
        const u: number = Math.min(0.9999, (lat + Math.PI / 2) / Math.PI);
        const v: number = (j + 0.5 + jitterV) / cols;
        const root: AutoMovieHumanHeadSurface.IPoint | null = surface.toward(C, u, v);
        if (root === null) continue;
        const density: number = scalp.density(root.position);
        if (density <= hash(layer, i, j, 2)) continue;
        const card: AutoMovieHumanCardBuilder.ICard | null = growCard({
          root,
          density,
          shell,
          style,
          wave,
          seed: [layer, i, j],
          C,
          R,
          crown,
          part,
          cut,
          length: hair.length,
          radius,
        });
        if (card !== null) builder.card(card);
      }
    }
  });
  return builder.build();
}

/** Curl types in order. */
const CURLS: readonly string[] = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

/** Grow one card's guide from its root and build the card. */
function growCard(p: {
  root: AutoMovieHumanHeadSurface.IPoint;
  density: number;
  shell: { offset: number; spacing: number; length: number };
  style: "crop" | "short" | "bob";
  wave: { amplitude: number; period: number; stand: number };
  seed: [number, number, number];
  C: readonly number[];
  R: number;
  crown: number[];
  part: number;
  cut: number;
  length: number;
  radius: (q: readonly number[]) => number;
}): AutoMovieHumanCardBuilder.ICard | null {
  const { root, C, R } = p;
  const at: number[] = root.position;
  const n: number[] = root.normal;
  const h = (k: number): number => hash(p.seed[0], p.seed[1], p.seed[2], 3 + k);
  // the style's direction field
  let g: number[];
  const high: number = Math.max(0, Math.min(1, (at[1]! - C[1]!) / (0.6 * R)));
  if (p.style === "crop") g = sub(at, p.crown);
  else if (p.style === "short") {
    const side: number = at[0]! > p.part ? 1 : -1;
    g = [0.5 * side * high, -1.6 * (1 - high), -1];
  } else {
    const side: number = at[0]! >= p.part ? 1 : -1;
    const back: number = Math.max(0, Math.min(1, (C[2]! - at[2]!) / (0.5 * R)));
    g = [side * (1 - back), -0.7, -0.4 * back];
  }
  let t: number[] = tangent(g, n);
  if (t === null) t = tangent([0, 0, -1], n) ?? [1, 0, 0];
  const twist: number = (h(0) - 0.5) * 0.35;
  const sideVec: number[] = normalize(cross(n, t));
  t = normalize(add(t, scale(sideVec, twist)));
  const lift: number = (p.style === "crop" ? 0.45 : 0.25) * p.wave.stand;
  let d: number[] = normalize(add(scale(t, Math.cos(lift)), scale(n, Math.sin(lift))));
  // length by style: tapered sides for the short cut, a level cut for the bob
  let length: number = p.length * p.shell.length * (0.85 + 0.3 * h(1));
  if (p.style === "short") length *= 0.3 + 0.7 * high;
  if (p.style === "crop") length = Math.max(3, length);
  const segments: number = Math.max(3, Math.min(12, Math.ceil(length / 10)));
  const stepLength: number = length / segments;
  const offset: number = p.shell.offset * p.wave.stand;
  const points: Array<[number, number, number]> = [add(at, scale(n, offset)) as [number, number, number]];
  const phase: number = 2 * Math.PI * h(2);
  let travelled: number = 0;
  for (let k: number = 0; k < segments; ++k) {
    // gravity, and the pull back onto the head for combed and lying hair
    const radial: number[] = normalize(sub(points[k]!, C));
    const gravity: number = p.style === "bob" ? 0.35 : p.style === "short" ? 0.12 : 0;
    d = normalize(add(d, [0, -gravity, 0]));
    const out: number = dot(d, radial);
    if (out > 0 && p.style !== "bob") d = normalize(sub(d, scale(radial, out * 0.6)));
    let next: number[] = add(points[k]!, scale(d, stepLength));
    travelled += stepLength;
    if (p.wave.amplitude > 0) {
      const w: number =
        p.wave.amplitude * (Math.sin(phase + (2 * Math.PI * travelled) / p.wave.period) - Math.sin(phase + (2 * Math.PI * (travelled - stepLength)) / p.wave.period));
      next = add(next, scale(normalize(cross(d, radial)), w));
    }
    // keep the shell's clearance above the skin
    const dir: number[] = normalize(sub(next, C));
    const floor: number = p.radius(dir);
    const r: number = Math.hypot(...sub(next, C));
    if (floor > 0 && r < floor + offset) next = add(C, scale(dir, floor + offset));
    points.push(next as [number, number, number]);
    if (p.style === "bob" && next[1]! < p.cut) break;
  }
  if (points.length < 2) return null;
  const sides: Array<[number, number, number]> = [];
  const normals: Array<[number, number, number]> = [];
  const widths: number[] = [];
  const base: number = (p.style === "bob" ? 9 : p.style === "short" ? 5.5 : 4.5) * (0.85 + 0.3 * h(4));
  for (let k: number = 0; k < points.length; ++k) {
    const along: number[] = normalize(sub(points[Math.min(k + 1, points.length - 1)]!, points[Math.max(k - 1, 0)]!));
    const radial: number[] = normalize(sub(points[k]!, C));
    sides.push(normalize(cross(radial, along)) as [number, number, number]);
    normals.push(radial as [number, number, number]);
    widths.push(base * (1 - (0.35 * k) / (points.length - 1)) * Math.max(0.5, p.density));
  }
  const column = paintAutoMovieHumanHairStrands.COLUMNS.locks[Math.floor(h(5) * 4)]!;
  return { points, sides, normals, widths, column, v: [0, 1] };
}

/** Integer hash to `[0, 1)`. */
function hash(a: number, b: number, c: number, k: number): number {
  let h: number = Math.imul(a + 7, 0x27d4eb2d) ^ Math.imul(b + 1, 0x165667b1) ^ Math.imul(c + 1, 0x9e3779b9) ^ Math.imul(k + 3, 0x85ebca77);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function tangent(g: number[], n: number[]): number[] {
  const t: number[] = sub(g, scale(n, dot(g, n)));
  const length: number = Math.hypot(t[0]!, t[1]!, t[2]!);
  return length < 1e-9 ? (null as unknown as number[]) : scale(t, 1 / length);
}

function add(a: readonly number[], b: readonly number[]): number[] {
  return [a[0]! + b[0]!, a[1]! + b[1]!, a[2]! + b[2]!];
}

function sub(a: readonly number[], b: readonly number[]): number[] {
  return [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
}

function scale(a: readonly number[], s: number): number[] {
  return [a[0]! * s, a[1]! * s, a[2]! * s];
}

function dot(a: readonly number[], b: readonly number[]): number {
  return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
}

function cross(a: readonly number[], b: readonly number[]): number[] {
  return [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
}

function normalize(a: readonly number[]): number[] {
  const length: number = Math.hypot(a[0]!, a[1]!, a[2]!);
  return length === 0 ? [0, 1, 0] : scale(a, 1 / length);
}
