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
 * falls). Every step above the menton keeps a clearance above the head
 * as hair drapes over it, spreading from bumps such as the ears at 45
 * degrees: crop and short hair is held at that clearance (it lies on the
 * scalp and nape),
 * while a bob lies on the vault above the chart centre and hangs freely
 * below it, pushed out only where it would pass inside. The clearance is
 * a common layer height with a small per-root jitter plus a growth with
 * the length already grown, so each strand lies over the strands whose
 * roots it passed and the cards form one continuous mass rather than a
 * random stack. A strand reaching the body below the head
 * (`AutoMovieHumanShoulderField`) rests on it: it settles at a clearance
 * above the skin and descends the surface in its vertical plane through
 * the head's axis, out from the neck, down and off the shoulders and the
 * upper back, instead of stopping where it touched.
 * This is a kinematic sweep, not a strand simulation: there is no bending
 * energy or collision between strands, and its coefficients are
 * conventions of this prototype.
 *
 * Lengths follow the style definitions on {@link IAutoMovieHumanScalpHair.length}:
 * `crop` even; `short` tapering to a third at the nape and sides; `bob`
 * ending where it reaches a level `length` below the vertex, or, once
 * resting on the body, after laying along it the drop it still had to
 * that level. Every root's length, and with it a bob's level, varies by up
 * to 6 percent either way in locks and 2 percent per root, so the ends
 * never line up along one cut. Roots within {@link FEATHER} mm above the
 * hairline grow shorter hair the closer they lie, against a boundary
 * raised per root, so the hairline feathers in instead of starting as a
 * comb of full-length cards along one line.
 *
 * Normals: the scalp chart's outward direction where a strand lies on the
 * head, the outward normal of a capsule about the chart centre (radial
 * above the centre, horizontal below it) where it hangs, so hanging hair
 * shades as the side of one hair mass, and halfway between that and the
 * body's surface normal where it rests on the body.
 */
export namespace AutoMovieHumanHairGuide {
  /** One solved guide. */
  export interface IGuide {
    /** Root lattice index; stable across tessellation and shape changes. */
    root: number;

    /** Points from root to tip, head-local millimetres. */
    points: Array<[number, number, number]>;

    /** Outward unit normal of the hair mass at each point. */
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

      // Keep roots on measured skin above the hair-bearing boundary.
      if (!AutoMovieHumanHeadField.covered(field, u)) continue;
      const distance: number = AutoMovieHumanHeadField.radius(field, u);
      const above: number = field.centre[1] + u[1] * distance - field.eyeLevel;
      const boundary: number = AutoMovieHumanScalpBoundary.height(
        hair.hairline,
        Math.atan2(u[2], u[0]),
        field.height,
      );
      // Feather the hairline: the roots within FEATHER mm above it grow
      // shorter hair the closer they are, each against the boundary raised
      // by its own jitter of up to half that, so the edge breaks into fine
      // short hair instead of a comb of full-length cards along one line.
      // The jitter only raises the boundary: lowering it grew hair below
      // the sideburns, a dark strip in front of each ear.
      const margin: number =
        above -
        boundary -
        0.5 * FEATHER * AutoMovieHumanAppearanceNoise.hash(14, k);
      if (margin <= 0) continue;
      const feather: number = AutoMovieHumanAppearanceNoise.smoothstep(
        0,
        FEATHER,
        margin,
      );

      const guide: IGuide | null = solve(field, shoulders, hair, k, u, feather);
      if (guide !== null) guides.push(guide);
    }
    return guides;
  }
}

/** Downward unit vector. */
const DOWN: [number, number, number] = [0, -1, 0];

/** Height above the hairline over which hair grows to its full length, mm. */
const FEATHER: number = 8;

/**
 * Solve one guide from its root direction.
 *
 * @param field Head chart
 * @param shoulders Body surface heights under the head
 * @param hair Scalp hair input
 * @param root Root lattice index
 * @param u Unit root direction from the chart centre
 * @param feather Share of the length grown at the hairline's edge, 0 to 1
 * @returns The guide, or null when it would be shorter than one step
 */
function solve(
  field: AutoMovieHumanHeadField.IField,
  shoulders: AutoMovieHumanShoulderField.IField,
  hair: IAutoMovieHumanScalpHair,
  root: number,
  u: [number, number, number],
  feather: number,
): AutoMovieHumanHairGuide.IGuide | null {
  const style: AutoMovieHumanHairStyle = hair.style;

  // Length of this root's hair, varied so ends never line up along one
  // cut: by up to 6 percent either way in locks (value noise over the
  // root's chart angles, twelve cells around the head) and a further 2
  // percent per root (conventions). Per-root variation alone made every
  // card end at its own height, a saw edge along the bob's line.
  const vary: number =
    1 +
    0.12 *
      (AutoMovieHumanAppearanceNoise.value2(
        13,
        (Math.atan2(u[2], u[0]) / (2 * Math.PI)) * 12,
        (Math.asin(Math.max(-1, Math.min(1, u[1]))) / Math.PI) * 6,
        12,
      ) -
        0.5) +
    0.04 * (AutoMovieHumanAppearanceNoise.hash(12, root) - 0.5);
  const top: number = AutoMovieHumanAppearanceNoise.smoothstep(0.3, 0.75, u[1]);
  const length: number =
    feather *
    vary *
    (style === AutoMovieHumanHairStyle.Short
      ? hair.length * (1 / 3 + (2 / 3) * top)
      : style === AutoMovieHumanHairStyle.Bob
        ? hair.length * 1.6
        : hair.length);
  const cut: number = field.top - vary * hair.length;

  // The head chart keeps strands outside the head down to the menton;
  // below it the body field does (`AutoMovieHumanShoulderField`).
  const menton: number = field.top - field.height;

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

  // Layer clearance: a common base with a jitter of 0.4 mm, below the
  // stack gained between neighbouring roots, so a strand lies over the
  // strands whose roots it has passed (the upstream hair on top) and the
  // mass stays one continuous surface, while side-by-side cards never
  // share a depth.
  const layer: number = 1.2 + 0.4 * AutoMovieHumanAppearanceNoise.hash(7, root);

  const start: number = AutoMovieHumanHeadField.radius(field, u) + layer;
  let p: [number, number, number] = scale(u, start);
  let heading: [number, number, number] = tangent(flow(style, u), u);
  const points: Array<[number, number, number]> = [p];
  const normals: Array<[number, number, number]> = [u];
  let travelled: number = 0;

  // Once a strand reaches the body it rests there: `surface` is the body
  // normal under its last point (null while off the body) and `resting`
  // the arc it may still lay along the body (null before the first
  // contact).
  let surface: [number, number, number] | null = null;
  let resting: number | null = null;

  for (let i: number = 1; i <= steps && travelled < length; ++i) {
    if (surface !== null) {
      // On the body: down its surface, out from the neck, and off the
      // shoulders and the upper back.
      heading = descend(surface, p);
    } else if (resting !== null) {
      // Slid off the body: hangs freely, gravity at least equal to the
      // heading per step so it does not fly out past the hair above it.
      heading = unit(add(heading, scale(DOWN, Math.max(gravity, 1))));
    } else {
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
    }

    let next: [number, number, number] = add(p, scale(heading, step));
    let normal: [number, number, number] = capsule(next);
    if (resting === null && next[1] + field.centre[1] > menton) {
      // Push out to the clearance over the draped head ({@link envelope}),
      // which grows slowly with length as later hair stacks over earlier
      // hair.
      const dir: [number, number, number] = unit(next);
      const floor: number =
        envelope(field, dir) + layer + stack * (travelled + step);
      // Short cuts lie on the head everywhere; a bob lies on the vault
      // above the chart centre and hangs freely below it.
      const lies: boolean =
        style !== AutoMovieHumanHairStyle.Bob || next[1] > 0;
      if (norm(next) < floor || lies) {
        const projected: [number, number, number] = scale(dir, floor);

        // The chart is only star-shaped over the vault: where it jumps (an
        // ear, the open neck end, the flare toward the shoulders) a
        // projection can move a point much further than one step. Lying
        // hair cannot follow such a jump, so it ends there; hanging hair is
        // outside the head anyway and keeps its free step.
        if (norm(sub(projected, p)) > 2.5 * step) {
          if (lies) break;
        } else {
          next = projected;
          heading = unit(sub(next, p));
          if (lies) normal = dir;
        }
      }
    }

    // Reaching the body: the strand settles on it and slides along it.
    const contact: ISettled | null = settle(
      field,
      shoulders,
      next,
      layer + 1.5,
      step,
      resting !== null,
    );
    if (contact === null) break;
    surface = contact.normal;
    if (contact.normal !== null) {
      // The settling displacement is not the strand's motion; from here it
      // descends the body's surface, never climbing.
      next = contact.point;
      heading = descend(contact.normal, next);

      // Shade as halfway between the hanging mass and the body under it,
      // so the hair keeps its tone where it meets the shoulders instead of
      // turning into a separately lit shelf.
      normal = unit(add(capsule(next), contact.normal));

      // A bob rests along the body for the drop it still had to its level
      // cut; other cuts for the rest of their length.
      if (resting === null) {
        resting =
          style === AutoMovieHumanHairStyle.Bob
            ? Math.min(length - travelled, next[1] + field.centre[1] - cut)
            : length - travelled;
        if (resting <= 0) break;
      }
    }

    // A hanging bob ends at its level cut: stop at the crossing of that
    // plane.
    const model: number = next[1] + field.centre[1];
    if (
      resting === null &&
      style === AutoMovieHumanHairStyle.Bob &&
      model < cut
    ) {
      const above: number = p[1] + field.centre[1] - cut;
      const below: number = cut - model;
      const t: number = above / Math.max(above + below, 1e-9);
      next = add(p, scale(sub(next, p), t));
      travelled += norm(sub(next, p));
      points.push(next);
      normals.push(normal);
      break;
    }

    // A resting strand ends when it has laid its remaining arc.
    const advance: number = norm(sub(next, p));
    if (resting !== null) {
      if (advance >= resting) {
        next = add(p, scale(sub(next, p), resting / Math.max(advance, 1e-9)));
        travelled += resting;
        points.push(next);
        normals.push(normal);
        break;
      }
      resting -= advance;
    }

    travelled += advance;
    points.push(next);
    normals.push(normal);
    p = next;
  }

  if (points.length < 2 || travelled < 1) return null;
  return { root, points, normals, length: travelled };
}

/** A point settled against the body. */
interface ISettled {
  /** Point, head-local millimetres. */
  point: [number, number, number];

  /** Body normal under it, or null when it is clear of the body. */
  normal: [number, number, number] | null;
}

/**
 * Radius of the head as hair drapes over it along a direction: the largest
 * of the skin radius there and, for skin above the menton within 0.3
 * radian, its radius less its arc distance, as if the hair fell from every
 * bump at 45 degrees to the surface.
 *
 * Over the rounded vault the skin's own radius wins. Over the auricle,
 * which stands about 25 mm off the side of the head, hair passes over the
 * ear on a slope and returns to the head about 25 mm beyond it, rather
 * than stepping out at its rim and back in behind it. Sampled on six rings
 * of eight directions, 0.05 radian apart.
 *
 * @param field Head chart
 * @param d Unit direction
 * @returns Draped radius, millimetres
 */
function envelope(
  field: AutoMovieHumanHeadField.IField,
  d: [number, number, number],
): number {
  let best: number = AutoMovieHumanHeadField.radius(field, d);
  const a: [number, number, number] =
    Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const e1: [number, number, number] = unit(cross(a, d));
  const e2: [number, number, number] = cross(d, e1);
  for (let ring: number = 1; ring <= 6; ++ring) {
    const theta: number = 0.05 * ring;
    for (let k: number = 0; k < 8; ++k) {
      const phi: number = ((k + 0.5 * (ring % 2)) / 8) * 2 * Math.PI;
      const q: [number, number, number] = add(
        scale(d, Math.cos(theta)),
        add(
          scale(e1, Math.sin(theta) * Math.cos(phi)),
          scale(e2, Math.sin(theta) * Math.sin(phi)),
        ),
      );
      const r: number = AutoMovieHumanHeadField.radius(field, q);
      // Only head skin above the menton drapes the hair; below it the
      // chart also measures the neck and shoulders the head chains loft.
      if (field.centre[1] + q[1] * r > field.top - field.height)
        best = Math.max(best, r * (1 - theta));
    }
  }
  return best;
}

/**
 * Settle a strand point against the body below the head.
 *
 * The body is the shoulder field's upper surface. Where it slopes by at
 * most 45 degrees, a point less than half a step beyond `clearance` from
 * it (height over the surface times the cosine of the slope), or inside
 * it, lies on it: it moves vertically to that clearance and takes the
 * surface normal. Once the strand rests, the margin is a step and a half,
 * so resting hair follows a convex surface over its edge instead of
 * leaving it on a tangent. A point is not lifted by more than two and a half
 * steps. Where the field is steeper (the side of the neck, the back below
 * a shoulder blade, or the edge between one surface and a lower one, where
 * the gradient measures a step rather than a slope), a point lies on it
 * only when it is less than `clearance` above the surface in its own
 * column. Such a point, or one too deep for a lift, steps out horizontally
 * down the gradient, a millimetre at a time up to three steps, to the
 * first column it clears by `clearance`; lifting a strand up a wall would
 * make it climb the body instead of hanging beside it.
 *
 * @param field Head chart, for the model offset
 * @param shoulders Body surface heights
 * @param next Candidate point, head-local millimetres
 * @param clearance Distance from the skin, millimetres
 * @param step Guide step, millimetres
 * @param resting Whether the strand already rests on the body
 * @returns The settled point, or null when no clear point is found
 */
function settle(
  field: AutoMovieHumanHeadField.IField,
  shoulders: AutoMovieHumanShoulderField.IField,
  next: [number, number, number],
  clearance: number,
  step: number,
  resting: boolean,
): ISettled | null {
  const [cx, cy, cz] = field.centre;
  const x: number = next[0] + cx;
  const y: number = next[1] + cy;
  const z: number = next[2] + cz;
  const h: number = AutoMovieHumanShoulderField.height(shoulders, x, z);
  if (h === -Infinity) return { point: next, normal: null };

  const [gx, gz] = AutoMovieHumanShoulderField.gradient(shoulders, x, z);
  const g: number = Math.hypot(gx, gz);
  const normal: [number, number, number] = unit([-gx, 1, -gz]);
  if (g <= 1) {
    const secant: number = Math.hypot(1, g);
    if (y - h >= (clearance + (resting ? 1.5 : 0.5) * step) * secant)
      return { point: next, normal: null };
    const lift: number = h + clearance * secant - y;
    if (lift <= 2.5 * step)
      return {
        point: [next[0], next[1] + lift, next[2]],
        normal,
      };
  } else if (y >= h + clearance) return { point: next, normal: null };

  if (g < 1e-9) return null;
  const dx: number = -gx / g;
  const dz: number = -gz / g;
  for (let d: number = 1; d <= 3 * step; d += 1) {
    const hx: number = x + dx * d;
    const hz: number = z + dz * d;
    const below: number = AutoMovieHumanShoulderField.height(shoulders, hx, hz);
    if (y >= below + clearance)
      return { point: [hx - cx, next[1], hz - cz], normal };
  }
  return null;
}

/**
 * Heading of a strand resting on the body: down the body's surface within
 * the vertical plane through the head's vertical axis, so resting strands
 * move out from the neck and down the shoulders and back without parting
 * along a ridge such as the spine, where the surface's own fall line turns
 * to either side; level where the surface rises outward, since resting
 * hair never climbs.
 *
 * @param n Unit body normal, upward component positive
 * @param p Current point, head-local millimetres
 * @returns Unit heading
 */
function descend(
  n: [number, number, number],
  p: [number, number, number],
): [number, number, number] {
  const r: number = Math.hypot(p[0], p[2]);
  const d: [number, number, number] =
    r > 1e-9 ? [p[0] / r, 0, p[2] / r] : [1, 0, 0];
  const s: number = Math.min(0, -dot(n, d) / Math.max(n[1], 1e-3));
  return unit([d[0], s, d[2]]);
}

/**
 * Outward normal of the hair mass at a free point: a capsule about the
 * chart centre, radial above the centre and horizontal below it, so
 * hanging hair shades like the side of a column rather than the underside
 * of a sphere.
 *
 * @param p Point, head-local millimetres
 * @returns Unit normal
 */
function capsule(p: [number, number, number]): [number, number, number] {
  const q: [number, number, number] = [p[0], Math.max(0, p[1]), p[2]];
  return norm(q) > 1e-9 ? unit(q) : [1, 0, 0];
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
    // Side parting at a fifth of the radius toward the person's left (+Z),
    // its side ramped over 0.01 either way (see {@link parting}).
    const side: number = parting(u[2] - 0.2);
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

  // Bob: midline parting, ramped like the side parting; back hair falls
  // straight.
  const side: number = parting(u[2]);
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
 * Side of a parting, ramped linearly across a band of 0.01 either way
 * (about 1 mm on an adult scalp) instead of switching sign, so a strand
 * whose path grazes the parting line meets a continuous field rather than
 * one flipping it back and forth across the line, which zigzags and twists
 * its card.
 *
 * @param offset Signed lateral chart coordinate from the parting line
 * @returns Side in `[-1, 1]`
 */
function parting(offset: number): number {
  return Math.max(-1, Math.min(1, offset / 0.01));
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
