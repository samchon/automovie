import type { IAutoMovieHumanScalpHair } from "../structures/appearance/IAutoMovieHumanScalpHair";
import { AutoMovieHumanHairStyle } from "../typings/AutoMovieHumanHairStyle";
import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";
import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import { AutoMovieHumanScalpBoundary } from "./AutoMovieHumanScalpBoundary";
import { AutoMovieHumanShoulderField } from "./AutoMovieHumanShoulderField";

/**
 * Scalp hair guides: one polyline per root, solved from the root's scalp
 * address, the style's direction field, gravity and the head surface.
 *
 * Roots: a Fibonacci lattice of directions about the head chart's centre
 * (Gonzalez 2010, "Measurement of areas on a sphere using Fibonacci and
 * latitude-longitude lattices"), which spaces points almost evenly by
 * solid angle with no seam or pole cluster. Root `k` is the lattice's k-th
 * direction, kept when the skin there lies above the scalp boundary, so a
 * root's identity never depends on the skin's tessellation; it moves with
 * the skin when the head changes shape.
 *
 * Direction fields (unit tangents on the chart sphere), one per style as
 * the style's own definition reads:
 *
 * - `crop`: away from a crown whorl at the back of the vertex, with a weak
 *   swirl about it, so the hair points forward on the forehead and down at
 *   the nape;
 * - `short`: top hair combed back from a side parting on the person's
 *   left, back and sides combed down and back;
 * - `bob`: parted at the midline, top hair swept down to either side,
 *   back hair falling straight.
 *
 * Integration: each guide marches in equal steps along its length; the
 * heading relaxes toward the field and bends toward gravity in proportion
 * to the distance already grown (short hair stands in its field, long hair
 * falls). Every step keeps a clearance above the head skin: crop and
 * short hair is held at that clearance (it lies on the scalp and nape),
 * while a bob lies on the vault above the chart centre and hangs freely
 * below it, pushed out only where it would pass inside. A strand reaching
 * the shoulders' upper surface ends there (`AutoMovieHumanShoulderField`).
 * This is a kinematic sweep, not a strand simulation: there is no bending
 * energy or collision between strands, and its coefficients are
 * conventions of this prototype.
 *
 * Lengths follow the style definitions on {@link IAutoMovieHumanScalpHair.length}:
 * `crop` even; `short` tapering to a third at the nape and sides; `bob`
 * ending where it reaches a level `length` below the vertex.
 */
export namespace AutoMovieHumanHairGuide {
  /** One solved guide. */
  export interface IGuide {
    /** Root lattice index; stable across tessellation and shape changes. */
    root: number;

    /** Points from root to tip, head-local millimetres. */
    points: Array<[number, number, number]>;

    /** Outward unit chart direction at each point. */
    normals: Array<[number, number, number]>;

    /** Arc length of the polyline, millimetres. */
    length: number;
  }

  /**
   * Solve every guide of one haircut.
   *
   * @param field Head chart of the generated skin
   * @param shoulders Body surface heights under the head
   * @param hair Scalp hair input
   * @returns Guides, empty for zero length
   */
  export function generate(
    field: AutoMovieHumanHeadField.IField,
    shoulders: AutoMovieHumanShoulderField.IField,
    hair: IAutoMovieHumanScalpHair,
  ): IGuide[] {
    if (!(hair.length > 0)) return [];

    // Coverage convention: long hair overlaps more along its length, so
    // fewer roots carry cards (to be replaced by the measured policy of the
    // representation stage).
    const lattice: number = hair.length > 120 ? 3200 : 5000;
    const golden: number = Math.PI * (3 - Math.sqrt(5));
    const guides: IGuide[] = [];

    for (let k: number = 0; k < lattice; ++k) {
      const y: number = 1 - (2 * (k + 0.5)) / lattice;
      const r: number = Math.sqrt(1 - y * y);
      const u: [number, number, number] = [
        r * Math.cos(k * golden),
        y,
        r * Math.sin(k * golden),
      ];

      // Keep roots above the hair-bearing boundary.
      const distance: number = AutoMovieHumanHeadField.radius(field, u);
      if (distance <= 0) continue;
      const above: number = field.centre[1] + u[1] * distance - field.eyeLevel;
      const boundary: number = AutoMovieHumanScalpBoundary.height(
        hair.hairline,
        Math.atan2(u[2], u[0]),
        field.height,
      );
      if (above <= boundary) continue;

      const guide: IGuide | null = solve(field, shoulders, hair, k, u);
      if (guide !== null) guides.push(guide);
    }
    return guides;
  }
}

/** Downward unit vector. */
const DOWN: [number, number, number] = [0, -1, 0];

/**
 * Solve one guide from its root direction.
 *
 * @param field Head chart
 * @param shoulders Body surface heights under the head
 * @param hair Scalp hair input
 * @param root Root lattice index
 * @param u Unit root direction from the chart centre
 * @returns The guide, or null when it would be shorter than one step
 */
function solve(
  field: AutoMovieHumanHeadField.IField,
  shoulders: AutoMovieHumanShoulderField.IField,
  hair: IAutoMovieHumanScalpHair,
  root: number,
  u: [number, number, number],
): AutoMovieHumanHairGuide.IGuide | null {
  const style: AutoMovieHumanHairStyle = hair.style;

  // Length of this root's hair.
  const top: number = AutoMovieHumanAppearanceNoise.smoothstep(0.3, 0.75, u[1]);
  const length: number =
    style === AutoMovieHumanHairStyle.Short
      ? hair.length * (1 / 3 + (2 / 3) * top)
      : style === AutoMovieHumanHairStyle.Bob
        ? hair.length * 1.6
        : hair.length;
  const cut: number = field.top - hair.length;

  // Steps of at most 10 mm, at least three.
  const steps: number = Math.min(40, Math.max(3, Math.ceil(length / 10)));
  const step: number = length / steps;

  // Field adherence and gravity per step, per style (conventions).
  const adherence: number =
    style === AutoMovieHumanHairStyle.Crop
      ? 0.5
      : style === AutoMovieHumanHairStyle.Short
        ? 0.4
        : 0.25;
  const gravity: number =
    style === AutoMovieHumanHairStyle.Crop
      ? 0.02
      : style === AutoMovieHumanHairStyle.Short
        ? 0.1
        : 0.45;

  // Clearance growth per millimetre grown: later hair stacks over earlier
  // hair, giving the cut its volume (conventions).
  const stack: number =
    style === AutoMovieHumanHairStyle.Crop
      ? 0.03
      : style === AutoMovieHumanHairStyle.Short
        ? 0.07
        : 0.04;

  // Layer clearance: each root lies at its own height above the skin so
  // overlapping cards never share a depth.
  const layer: number = 0.8 + 3.5 * AutoMovieHumanAppearanceNoise.hash(7, root);

  const start: number = AutoMovieHumanHeadField.radius(field, u) + layer;
  let p: [number, number, number] = scale(u, start);
  let heading: [number, number, number] = tangent(flow(style, u), u);
  const points: Array<[number, number, number]> = [p];
  const normals: Array<[number, number, number]> = [u];
  let travelled: number = 0;

  for (let i: number = 1; i <= steps && travelled < length; ++i) {
    const n: [number, number, number] = unit(p);
    const progress: number = travelled / Math.max(length, 1);
    const target: [number, number, number] = tangent(flow(style, n), n);
    heading = unit([
      heading[0] +
        adherence * (1 - progress) * (target[0] - heading[0]) +
        gravity * progress * DOWN[0],
      heading[1] +
        adherence * (1 - progress) * (target[1] - heading[1]) +
        gravity * progress * DOWN[1],
      heading[2] +
        adherence * (1 - progress) * (target[2] - heading[2]) +
        gravity * progress * DOWN[2],
    ]);

    // Advance, then push out to the clearance, which grows slowly with
    // length as later hair stacks over earlier hair.
    let next: [number, number, number] = add(p, scale(heading, step));
    const dir: [number, number, number] = unit(next);
    const floor: number =
      AutoMovieHumanHeadField.radius(field, dir) +
      layer +
      stack * (travelled + step);
    // Short cuts lie on the head everywhere; a bob lies on the vault above
    // the chart centre and hangs freely below it.
    const lies: boolean = style !== AutoMovieHumanHairStyle.Bob || next[1] > 0;
    if (norm(next) < floor || lies) {
      const projected: [number, number, number] = scale(dir, floor);

      // The chart is only star-shaped over the vault: where it jumps (an
      // ear, the open neck end, the flare toward the shoulders) a projection
      // can move a point much further than one step. Lying hair cannot
      // follow such a jump, so it ends there; hanging hair is outside the
      // head anyway and keeps its free step.
      if (norm(sub(projected, p)) > 2.5 * step) {
        if (lies) break;
      } else {
        next = projected;
        heading = unit(sub(next, p));
      }
    }

    // Reaching the shoulders ends the strand: it rests there.
    const rest: number =
      AutoMovieHumanShoulderField.height(
        shoulders,
        next[0] + field.centre[0],
        next[2] + field.centre[2],
      ) + 2;
    if (next[1] + field.centre[1] < rest) break;

    // A bob ends at its level cut: stop at the crossing of that plane.
    const model: number = next[1] + field.centre[1];
    if (style === AutoMovieHumanHairStyle.Bob && model < cut) {
      const above: number = p[1] + field.centre[1] - cut;
      const below: number = cut - model;
      const t: number = above / Math.max(above + below, 1e-9);
      next = add(p, scale(sub(next, p), t));
      travelled += norm(sub(next, p));
      points.push(next);
      normals.push(unit(next));
      break;
    }

    travelled += norm(sub(next, p));
    points.push(next);
    normals.push(unit(next));
    p = next;
  }

  if (points.length < 2 || travelled < 1) return null;
  return { root, points, normals, length: travelled };
}

/**
 * Unnormalised style direction at a chart direction.
 *
 * @param style Haircut
 * @param u Unit chart direction
 * @returns Preferred growth direction before tangent projection
 */
function flow(
  style: AutoMovieHumanHairStyle,
  u: [number, number, number],
): [number, number, number] {
  if (style === AutoMovieHumanHairStyle.Crop) {
    // Away from a whorl at azimuth 180 degrees, elevation 55 degrees, with a
    // swirl (w x u) of a third of that strength.
    const w: [number, number, number] = AutoMovieHumanHeadField.direction(
      Math.PI,
      (55 * Math.PI) / 180,
    );
    const swirl: [number, number, number] = cross(w, u);
    return add(sub(u, w), scale(swirl, 0.35));
  }

  const upper: number = AutoMovieHumanAppearanceNoise.smoothstep(
    0.35,
    0.7,
    u[1],
  );
  if (style === AutoMovieHumanHairStyle.Short) {
    // Side parting at a fifth of the radius toward the person's left (+Z).
    const side: number = Math.sign(u[2] - 0.2) || 1;
    const top: [number, number, number] = [-1, 0, 0.7 * side];
    const rest: [number, number, number] = [-0.4, -1, 0];

    // The front of the head, temples included, is combed back like the top
    // rather than down over the forehead.
    const front: number = AutoMovieHumanAppearanceNoise.smoothstep(
      0.25,
      0.6,
      u[0],
    );
    const w: number = Math.max(upper, front);
    return add(scale(top, w), scale(rest, 1 - w));
  }

  // Bob: midline parting; back hair falls straight.
  const side: number = Math.sign(u[2]) || 1;
  const back: number = AutoMovieHumanAppearanceNoise.smoothstep(
    -0.1,
    -0.5,
    u[0],
  );
  const swept: [number, number, number] = [-0.15, -0.4, side];
  const fall: [number, number, number] = [-0.3, -1, 0];
  const mix: number = upper * (1 - back);
  return add(scale(swept, mix), scale(fall, 1 - mix));
}

/**
 * Component of a vector tangent to the sphere at a unit direction, unit
 * length; falls back to the downward tangent where the vector is radial.
 *
 * @param v Vector
 * @param n Unit normal
 * @returns Unit tangent
 */
function tangent(
  v: [number, number, number],
  n: [number, number, number],
): [number, number, number] {
  const t: [number, number, number] = sub(v, scale(n, dot(v, n)));
  if (norm(t) > 1e-9) return unit(t);
  const d: [number, number, number] = sub(DOWN, scale(n, dot(DOWN, n)));
  return norm(d) > 1e-9 ? unit(d) : [1, 0, 0];
}

/**
 * Sum.
 *
 * @param a Left
 * @param b Right
 * @returns `a + b`
 */
function add(
  a: [number, number, number],
  b: [number, number, number],
): [number, number, number] {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

/**
 * Difference.
 *
 * @param a Left
 * @param b Right
 * @returns `a - b`
 */
function sub(
  a: [number, number, number],
  b: [number, number, number],
): [number, number, number] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/**
 * Scalar multiple.
 *
 * @param a Vector
 * @param s Factor
 * @returns `s a`
 */
function scale(
  a: [number, number, number],
  s: number,
): [number, number, number] {
  return [a[0] * s, a[1] * s, a[2] * s];
}

/**
 * Dot product.
 *
 * @param a Left
 * @param b Right
 * @returns `a . b`
 */
function dot(a: [number, number, number], b: [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * Cross product.
 *
 * @param a Left
 * @param b Right
 * @returns `a x b`
 */
function cross(
  a: [number, number, number],
  b: [number, number, number],
): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/**
 * Euclidean length.
 *
 * @param a Vector
 * @returns `|a|`
 */
function norm(a: [number, number, number]): number {
  return Math.hypot(a[0], a[1], a[2]);
}

/**
 * Unit vector.
 *
 * @param a Nonzero vector
 * @returns `a / |a|`
 */
function unit(a: [number, number, number]): [number, number, number] {
  return scale(a, 1 / (norm(a) || 1));
}
