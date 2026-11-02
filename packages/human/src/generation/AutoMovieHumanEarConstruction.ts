import { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";

/**
 * One auricle as curves in the horizontal sections of the head.
 *
 * The ear stands on a line of its own. Its centre runs up the side of the head,
 * leaning back by the ear's rotation, and off the head by the stand. Across it
 * lies a chord from the root to the helix, tilted out of the side of the head
 * so that its lateral reach is the protrusion and its length the breadth. A
 * side view of the ear is an egg over that plane, narrower at the lobe, and a
 * horizontal section cuts the egg along one chord.
 *
 * In a section the ear is a path from the head's outline in front of the ear,
 * out over the concha, antihelix, scapha and helix to the rim, and back along
 * the ear's posterior face to the head behind it. Over the chord the anterior
 * face is a height field of named reliefs: rings that follow the rim at fixed
 * distances from it (helix, scapha, antihelix), the concha's bowl, the tragus
 * and antitragus. Reliefs fade out over the lobe.
 *
 * All of it is written for the left ear; a right ear is the reflection of its
 * own measures.
 */
export namespace AutoMovieHumanEarConstruction {
  /** Points of the anterior face in a section; the path's rim is this index. */
  export const ANTERIOR: number = 96;

  /** A point `[x, z]` of a horizontal section. */
  export type P2 = [number, number];

  /** One ear's measures, calibration millimetres. */
  export interface IMeasures {
    /** Length along the ear. */
    length: number;

    /** Breadth, the chord's length at its widest. */
    breadth: number;

    /** Lateral reach of the rim from the head. */
    protrusion: number;
  }

  /** One ear placed on a head. */
  export interface IEar {
    /** Measures. */
    measures: IMeasures;

    /** Centre's height. */
    level: number;

    /** Centre ahead of the origin at that height. */
    x: number;

    /** Unit direction of the chord toward the rim, `[x, z]`. */
    along: P2;

    /** Unit normal of the anterior face, `[x, z]`. */
    normal: P2;

    /** Heights of the ear's ends and of its two free ends' joins. */
    bottom: number;

    /** See {@link bottom}. */
    lower: number;

    /** See {@link bottom}. */
    upper: number;

    /** Where the top section splits off the pocket. */
    split: number;

    /** Top of the pocket. */
    roof: number;

    /** See {@link bottom}. */
    top: number;
  }

  /** The head's outline at the ear, as the path needs it. */
  export interface IRoot {
    /** Where the anterior face leaves the head. */
    front: P2;

    /** Unit tangent of the outline there, pointing at the ear. */
    frontTangent: P2;

    /** Where the posterior face meets the head. */
    back: P2;

    /** Unit tangent of the outline there, pointing at the ear. */
    backTangent: P2;
  }

  /**
   * Place an ear beside a head.
   *
   * @param measures The ear's measures.
   * @param eye Eye level.
   * @param skull Skull centre ahead of the origin.
   * @param scale Calibration millimetres per world millimetre.
   */
  export function place(
    measures: IMeasures,
    eye: number,
    skull: number,
    scale: number,
  ): IEar {
    const e: AutoMovieHumanHeadPrior.IEar = AutoMovieHumanHeadPrior.PRIOR.ear;
    const L: number = measures.length * e.lengthRatio;
    const level: number = eye - e.drop * L;
    const beta: number = Math.asin(
      Math.min(0.95, measures.protrusion / (measures.breadth * e.breadthRatio)),
    );
    const bottom: number = level - L / 2;
    const top: number = level + L / 2;
    return {
      measures: {
        ...measures,
        length: L,
        breadth: measures.breadth * e.breadthRatio,
      },
      level,
      x: skull + e.forward * scale,
      along: [-Math.cos(beta), Math.sin(beta)],
      normal: [Math.sin(beta), Math.cos(beta)],
      bottom,
      lower: bottom + e.lobeFree * L,
      upper: top - e.topFree * L,
      split: top - e.splitFree * L,
      roof: top - e.roofFree * L,
      top,
    };
  }

  /** Half the chord at a height. */
  export function chord(ear: IEar, y: number): number {
    const e: AutoMovieHumanHeadPrior.IEar = AutoMovieHumanHeadPrior.PRIOR.ear;
    const u: number = (2 * (y - ear.level)) / ear.measures.length;
    return (
      (ear.measures.breadth / 2) *
      Math.sqrt(Math.max(0, 1 - u * u)) *
      (1 + e.egg * u)
    );
  }

  /** The chord's centre at a height: the ear's own line. */
  export function centre(ear: IEar, y: number, head: number): P2 {
    const e: AutoMovieHumanHeadPrior.IEar = AutoMovieHumanHeadPrior.PRIOR.ear;
    const u: number = (2 * (y - ear.level)) / ear.measures.length;
    return [
      ear.x - (y - ear.level) * Math.tan(e.lean),
      head +
        ear.measures.protrusion *
          (e.stand[0]! + e.stand[1]! * u + e.stand[2]! * u * u),
    ];
  }

  /** Outward height of the anterior face over the chord. */
  export function relief(ear: IEar, y: number, q: number): number {
    const e: AutoMovieHumanHeadPrior.IEar = AutoMovieHumanHeadPrior.PRIOR.ear;
    const L: number = ear.measures.length;
    const B: number = ear.measures.breadth;
    const half: number = chord(ear, y);
    const c: number = (2 * q - 1) * half;
    const u: number = (2 * (y - ear.level)) / L;

    // Distance in from the rim, millimetres, on the egg's own field.
    const across: number = c / (B / 2) / (1 + e.egg * u);
    const g: number = Math.hypot(across, u);
    const rim: number = (1 - g) * (B / 2);

    // The lobe has no rings; the front of the ear has no rim either.
    const lobe: number = smooth((u + e.lobeFrom) / e.lobeBlend);
    const hind: number =
      smooth((q - e.frontRim) / 0.25) + smooth((u - 0.45) / 0.2);
    const k: number = Math.min(1, hind) * lobe;
    const unit: number = B / 31;
    const ring = (at: number, width: number): number =>
      bell((rim - at * unit) / (width * unit));
    const fold: number =
      k *
      (e.helix[0]! * ring(e.helix[1]!, e.helix[2]!) +
        e.scapha[0]! * ring(e.scapha[1]!, e.scapha[2]!) +
        e.antihelix[0]! *
          ring(e.antihelix[1]!, e.antihelix[2]!) *
          smooth((u + 0.35) / 0.3));

    // Bowl and the two small lobes at its mouth.
    const bump = (p: readonly number[]): number =>
      p[0]! * bell2((q - p[1]!) / p[3]!, (u - p[2]!) / p[4]!);
    return (
      (fold + bump(e.concha) + bump(e.tragus) + bump(e.antitragus)) *
      unit *
      lobeThin(u)
    );
  }

  /** Anterior and posterior faces' reliefs shrink onto the thin lobe. */
  function lobeThin(u: number): number {
    return 0.35 + 0.65 * smooth((u + 0.95) / 0.35);
  }

  /**
   * The ear's path in one section, from the anterior root over the rim to the
   * posterior root.
   *
   * @param ear The ear.
   * @param y Section height.
   * @param root Where it leaves and meets the head.
   * @param rim Rim point.
   * @param folds Share of the anterior reliefs drawn.
   * @returns Dense points in order.
   */
  export function path(
    ear: IEar,
    y: number,
    root: IRoot,
    rim: P2,
    folds: number = 1,
  ): P2[] {
    const out: P2[] = [];
    const a: P2 = root.front;
    const span: number = Math.hypot(rim[0] - a[0], rim[1] - a[1]);
    const lead: number = Math.min(span * 0.3, 6);
    const c1: P2 = [
      a[0] + root.frontTangent[0] * lead,
      a[1] + root.frontTangent[1] * lead,
    ];
    for (let i: number = 0; i <= ANTERIOR; i++) {
      const q: number = i / ANTERIOR;
      const m: number = 1 - q;
      const p: P2 = [
        m * m * a[0] + 2 * m * q * c1[0] + q * q * rim[0],
        m * m * a[1] + 2 * m * q * c1[1] + q * q * rim[1],
      ];
      const h: number = folds * relief(ear, y, q);
      out.push([p[0] + ear.normal[0] * h, p[1] + ear.normal[1] * h]);
    }

    // Round the rim, then along the posterior face.
    const s: P2 = root.back;
    const thick: number =
      AutoMovieHumanHeadPrior.PRIOR.ear.rim *
      (ear.measures.breadth / 31) *
      lobeThin((2 * (y - ear.level)) / ear.measures.length);
    const end: P2 = out[out.length - 1]!;
    const dist: number = Math.hypot(s[0] - end[0], s[1] - end[1]) || 1;
    const b1: P2 = [
      end[0] - ear.normal[0] * thick + ear.along[0] * thick,
      end[1] - ear.normal[1] * thick + ear.along[1] * thick,
    ];
    const b2: P2 = [
      s[0] + root.backTangent[0] * Math.min(dist * 0.3, 6),
      s[1] + root.backTangent[1] * Math.min(dist * 0.3, 6),
    ];
    for (let i: number = 1; i <= POSTERIOR; i++) {
      const q: number = i / POSTERIOR;
      const m: number = 1 - q;
      out.push([
        m * m * m * end[0] +
          3 * m * m * q * b1[0] +
          3 * m * q * q * b2[0] +
          q * q * q * s[0],
        m * m * m * end[1] +
          3 * m * m * q * b1[1] +
          3 * m * q * q * b2[1] +
          q * q * q * s[1],
      ]);
    }
    return out;
  }

  /**
   * A free section as a closed loop whose points keep their place on the ear.
   *
   * {@link path} already samples each face at uniform `q`, so a point's index
   * names the same place on every section and the rim is always
   * {@link ANTERIOR}. Resampling by arclength would lose that: a section's
   * length changes as it rises, every phase slides with it, and the rings then
   * cut across the rim and the corners as a sawtooth.
   *
   * The closure stands inside the head while the section is attached, so it
   * bows inward by the concha's depth: a straight chord is shallower than the
   * bowl on a flat ear, and the anterior face would cross it. Once free of the
   * head the closure is the skin behind the ear and runs straight.
   *
   * @param ear The ear.
   * @param path The ear's path in one section.
   * @param count Points of the loop; those past the path close it.
   * @param bow Share of the closure's bow, 1 attached to 0 free.
   * @returns The path followed by its closure.
   */
  export function loop(
    ear: IEar,
    path: readonly P2[],
    count: number,
    bow: number,
  ): P2[] {
    const first: P2 = path[0]!;
    const last: P2 = path[path.length - 1]!;
    const chord: number = count - path.length + 1;
    const depth: number =
      bow *
      Math.abs(AutoMovieHumanHeadPrior.PRIOR.ear.concha[0]!) *
      (ear.measures.breadth / 31);
    return [
      ...path,
      ...Array.from({ length: chord - 1 }, (_: unknown, i: number): P2 => {
        const f: number = (i + 1) / chord;
        const sag: number = 4 * f * (1 - f) * depth;
        return [
          last[0] + f * (first[0] - last[0]) - sag * ear.normal[0],
          last[1] + f * (first[1] - last[1]) - sag * ear.normal[1],
        ];
      }),
    ];
  }

  /**
   * A stretch of anterior skin dented into a pit.
   *
   * The pit has no points of its own to appear from: a run of the skin's own
   * points, as wide as the pocket has points, carries the pocket scaled by `k`
   * while the skin beside it closes over its mouth. The pocket's width and the
   * mouth's add, so the pit's far wall stays beyond its near wall at any depth.
   * At `k = 0` the result is the skin and at `k = 1` it pinches at `at` round
   * the pocket. The rim and everything past it keep their indices.
   *
   * @param skin A loop from {@link loop}.
   * @param at Index of the pit's mouth, on the anterior face.
   * @param pocket The pocket's points, starting and ending at the mouth.
   * @param k Depth of the dent.
   * @returns `at + 1` skin points, the pocket's run, then the skin from `at`.
   */
  export function pitted(
    skin: readonly P2[],
    at: number,
    pocket: readonly P2[],
    k: number,
  ): P2[] {
    const open: number = (pocket.length / 2) * (1 - k);
    const before: number = at - open;
    const after: number = at + open;
    const mouth: P2 = pocket[0]!;
    const run = (from: number, to: number, count: number): P2[] =>
      Array.from({ length: count }, (_: unknown, i: number): P2 =>
        along(skin, from + ((to - from) * i) / Math.max(1, count - 1)),
      );
    return [
      ...run(0, before, at + 1),
      ...pocket.map((p: P2, i: number): P2 => {
        const q: P2 = along(
          skin,
          before + ((after - before) * (i + 1)) / (pocket.length + 1),
        );
        return [q[0] + k * (p[0] - mouth[0]), q[1] + k * (p[1] - mouth[1])];
      }),
      ...run(after, ANTERIOR, ANTERIOR - at + 1),
      ...skin.slice(ANTERIOR + 1),
    ];
  }

  /**
   * Unit tangent of a loop at an index, toward higher indices.
   *
   * A pocket lies along the skin it hangs from, not along the ear's chord: the
   * two differ by some degrees where the pit opens, and an oval set on the
   * chord pushes one flank out through the skin beside its mouth.
   */
  export function tangent(loop: readonly P2[], at: number): P2 {
    const a: P2 = loop[at - 1]!;
    const b: P2 = loop[at + 1]!;
    const l: number = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  }

  /**
   * Uniform control rings of a loop whose indices are its phases.
   *
   * @param loop Closed loop of points in order.
   * @param order Control points.
   * @returns One point per uniform phase, phase `2 pi i / length` at index `i`.
   */
  export function even(loop: readonly P2[], order: number): P2[] {
    return Array.from({ length: order }, (_: unknown, j: number): P2 =>
      along(loop, (j * loop.length) / order),
    );
  }

  /** An oval of points about a centre along the chord. */
  export function oval(
    c: P2,
    along: P2,
    a: number,
    b: number,
    count: number,
    sense: 1 | -1,
    start: number = 0,
  ): P2[] {
    const n: P2 = [-along[1], along[0]];
    return Array.from({ length: count }, (_: unknown, i: number): P2 => {
      const t: number = start + (sense * 2 * Math.PI * i) / count;
      return [
        c[0] + a * Math.cos(t) * along[0] + b * Math.sin(t) * n[0],
        c[1] + a * Math.cos(t) * along[1] + b * Math.sin(t) * n[1],
      ];
    });
  }
}

/** A point at a fractional index of a closed run of points. */
function along(
  loop: readonly AutoMovieHumanEarConstruction.P2[],
  index: number,
): AutoMovieHumanEarConstruction.P2 {
  const n: number = loop.length;
  const i: number = Math.floor(index);
  const f: number = index - i;
  const a: AutoMovieHumanEarConstruction.P2 = loop[((i % n) + n) % n]!;
  const b: AutoMovieHumanEarConstruction.P2 = loop[(((i + 1) % n) + n) % n]!;
  return [a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1])];
}

/** Points of the posterior face in a section. */
const POSTERIOR: number = 48;

/** A bell of unit height. */
function bell(x: number): number {
  return Math.exp(-x * x);
}

/** A two-dimensional bell of unit height. */
function bell2(x: number, y: number): number {
  return Math.exp(-x * x - y * y);
}

/** Smoothstep clamped to [0, 1]. */
function smooth(x: number): number {
  const t: number = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}
