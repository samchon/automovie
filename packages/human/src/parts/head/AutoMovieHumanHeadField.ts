import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanMeasurements } from "../../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { frameAutoMovieHumanHead } from "./frameAutoMovieHumanHead";

/**
 * The skin surface of the head as a signed distance field in the head frame, from which the head cage takes its positions.
 *
 * Three masses are joined by a smooth union: the vault, the face and the stem of the neck under the skull.
 *
 * - Vault: an egg superellipsoid, the classic shape of the braincase (Hrdlička's and Martin's head indices measure it by length, breadth and height). Its length runs from glabella to opisthocranion, its breadth is the measured head breadth, its top the vertex. The front and back halves of its horizontal section are superellipses of their own: the front exponent is solved so the forehead passes through frontotemporale, the narrowest forehead, and the back exponent so the section at glabella level has the measured head circumference, which is what makes the length, breadth and circumference of the vault agree with the identity together. Below glabella its front recedes into the orbital roofs, leaving the face to the face mass; at the sides and back it runs down to the mastoid level.
 * - Face: horizontal D-shaped sections from menton to above glabella. Each section's front follows the midline profile and its widest point follows the facial frame: the mandible's lower border from menton to gonion in the mandibular plane, the ramus up to zygion, the lateral orbital rim up to frontotemporale.
 * - Stem: the upper neck under the occiput, an elliptic cylinder of the measured neck circumference along the neck bone.
 *
 * Distances are millimetres, negative inside. Each mass gives its radial distance from its own section centre, exact along that radius, so the union is smooth where masses meet and exact elsewhere.
 *
 * @author Samchon
 */
export class AutoMovieHumanHeadField {
  private readonly vault_: IVault;
  private readonly face_: IFace;
  private readonly muzzle_: IFace;
  private readonly stem_: IStem;
  private readonly blend_: number;
  private readonly bumps_: IBump[];
  private readonly nose_: INose;

  /**
   * @param frame The head frame and its landmarks
   * @param measurements Resolved measurements of the person
   */
  public constructor(
    public readonly frame: frameAutoMovieHumanHead.IFrame,
    measurements: IAutoMovieHumanMeasurements,
  ) {
    const head: IAutoMovieHumanIdentity.IHead = measurements.identity.head;
    this.vault_ = shapeVault(frame, head, measurements.headBreadth);
    this.face_ = compileFace(shapeFace(frame, head));
    this.muzzle_ = shapeMuzzle(frame, head);
    this.stem_ = shapeStem(frame, measurements.identity.body.neckCircumference);
    this.blend_ = 0.06 * head.faceHeight;
    this.bumps_ = shapeRelief(frame, head, measurements.headBreadth);
    this.nose_ = shapeNose(frame, head);
  }

  /**
   * Signed distance of a local point from the skin, negative inside.
   *
   * @param p Point in the head frame, millimetres
   * @returns Approximate signed distance, millimetres
   */
  public distance(p: IAutoMovieVector3): number {
    const vault: number = distanceVault(this.vault_, p);
    const face: number = smoothMin(
      distanceFace(this.face_, p),
      distanceFace(this.muzzle_, p),
      1.5 * this.blend_,
    );
    const stem: number = distanceStem(this.stem_, p);
    let d: number = smoothMin(smoothMin(vault, face, this.blend_), stem, 2.5 * this.blend_);
    d = smoothMin(d, distanceNose(this.nose_, p), 0.5 * this.blend_);
    for (const bump of this.bumps_) d -= evaluateBump(bump, p);
    return d;
  }

  /**
   * The outermost skin point on a ray.
   *
   * Without a guess the search starts 400 mm out, beyond any head, and walks inward in 2 mm steps to the first point inside, then bisects; that is the first crossing seen from outside. With a guess, the distance along the ray where the skin was nearby, the walk starts just outside the guess instead, which is what relaxation needs on every sweep.
   *
   * @param from Start of the ray, inside the head
   * @param direction Direction of the ray, not necessarily unit
   * @param guess Distance along the ray near the skin, if known
   * @returns Where the ray leaves the head
   */
  public project(
    from: IAutoMovieVector3,
    direction: IAutoMovieVector3,
    guess?: number,
  ): IAutoMovieVector3 {
    const d: IAutoMovieVector3 = AutoMovieHumanVector.normalize(direction);
    const at = (t: number): IAutoMovieVector3 =>
      AutoMovieHumanVector.offset(from, [d, t]);
    const step: number = 2;
    let outer: number = guess === undefined ? 400 : guess + 3 * step;
    while (guess !== undefined && this.distance(at(outer)) < 0) outer += 3 * step;
    let inner: number = outer;
    while (inner > 0) {
      inner -= step;
      if (this.distance(at(inner)) < 0) break;
      outer = inner;
    }
    if (inner <= 0) return from;
    for (let i: number = 0; i < 18; ++i) {
      const mid: number = (inner + outer) / 2;
      if (this.distance(at(mid)) < 0) inner = mid;
      else outer = mid;
    }
    return at((inner + outer) / 2);
  }
}

/** The vault's egg superellipsoid. */
interface IVault {
  centre: IAutoMovieVector3;
  halfBreadth: number;
  front: number;
  back: number;
  up: number;
  downBack: number;
  downFront: number;
  downTemple: number;
  frontExponent: number;
  backExponent: number;
}

/** One knot of the face's sections along its height. */
interface IFaceKnot {
  /** Height of the section. */
  y: number;
  /** Half-width of the section at its widest. */
  halfWidth: number;
  /** Depth of the widest point. */
  widest: number;
  /** Depth of the midline front. */
  front: number;
  /** Superellipse exponent of the section's front half. */
  exponent: number;
}

/** The neck stem under the occiput. */
interface IStem {
  /** Two points on its axis, the lower first. */
  lower: IAutoMovieVector3;
  upper: IAutoMovieVector3;
  halfWidth: number;
  halfDepth: number;
  top: number;
}

/**
 * Local relief of the bony face and the temple, each a swelling or hollow added to the distance. Grade: conventional, placed at the landmarks they belong to and sized as fractions of the face; checked on renders.
 *
 * - Zygomatic prominences, the cheek bones, which "set back from the front of the cage about one-third of the distance to the ear" (Bridgman 1920, Constructive Anatomy, p. 116).
 * - Superciliary arches over the medial half of each orbit, meeting at glabella.
 * - Temporal fossae, the hollow behind the forehead's lateral edge, where "the sides turn sharply to the plane of the temples" (Bridgman, p. 126).
 * - The mental protuberance of the chin and the mandibular angles at gonion.
 */
const shapeRelief = (
  frame: frameAutoMovieHumanHead.IFrame,
  head: IAutoMovieHumanIdentity.IHead,
  breadth: number,
): IBump[] => {
  const fh: number = head.faceHeight;
  const fw: number = head.faceWidth;
  const v = AutoMovieHumanVector.of;
  const bumps: IBump[] = [];
  for (const s of [1, -1]) {
    bumps.push({
      centre: v(s * 0.36 * fw, frame.eye.y - 0.2 * fh, frame.zygion.z + 0.12 * fh),
      radii: v(0.13 * fw, 0.13 * fh, 0.25 * fh),
      height: 0.035 * fh,
    });
    bumps.push({
      centre: v(s * 0.16 * fw, frame.eye.y + 0.16 * fh, frame.glabella.z),
      radii: v(0.17 * fw, 0.08 * fh, 0.25 * fh),
      height: 0.045 * fh,
    });
    bumps.push({
      centre: v(s * 0.5 * breadth, frame.eye.y + 0.12 * fh, frame.frontotemporale.z - 0.25 * fh),
      radii: v(0.15 * fw, 0.2 * fh, 0.22 * fh),
      height: -0.03 * fh,
    });
    bumps.push({
      centre: v(s * frame.gonion.x, frame.gonion.y + 0.02 * fh, frame.gonion.z + 0.03 * fh),
      radii: v(0.1 * fw, 0.12 * fh, 0.15 * fh),
      height: 0.02 * fh,
    });
  }
  bumps.push({
    centre: v(0, frame.menton.y + 0.1 * fh, frame.nasion.z),
    radii: v(0.13 * fw, 0.1 * fh, 0.2 * fh),
    height: 0.02 * fh,
  });
  return bumps;
};

/**
 * The neutral nose the nose module replaces: a tapered wedge from the nasal root to the tip with the alae at its base, from the 3D Facial Norms adult means over face height and width (nasal height n-sn 56.6 / 127.2, protrusion sn-prn 21.0 / 127.2, width al-al 36.1 / 137.6). Grade: derived.
 */
interface INose {
  root: IAutoMovieVector3;
  tip: IAutoMovieVector3;
  base: number;
  halfWidth: number;
  rootHalfWidth: number;
}

const shapeNose = (
  frame: frameAutoMovieHumanHead.IFrame,
  head: IAutoMovieHumanIdentity.IHead,
): INose => {
  const fh: number = head.faceHeight;
  const snY: number = frame.menton.y + 0.567 * fh;
  const subnasale: number = frame.nasion.z + 0.081 * fh;
  return {
    root: AutoMovieHumanVector.of(0, frame.nasion.y - 0.05 * fh, frame.nasion.z - 0.01 * fh),
    tip: AutoMovieHumanVector.of(0, snY + 0.05 * fh, subnasale + 0.15 * fh),
    base: snY,
    halfWidth: 0.131 * head.faceWidth,
    rootHalfWidth: 0.06 * head.faceWidth,
  };
};

/** Distance from the nose wedge: a section that is a rounded triangle, its ridge on the dorsum line from root to tip. */
const distanceNose = (nose: INose, p: IAutoMovieVector3): number => {
  if (p.y > nose.root.y + 2 || p.y < nose.base - 2) return 1e3;
  const t: number = Math.min(1, Math.max(0, (nose.root.y - p.y) / (nose.root.y - nose.base)));
  const ridgeZ: number = nose.root.z + (nose.tip.z - nose.root.z) * Math.min(1, t / ((nose.root.y - nose.tip.y) / (nose.root.y - nose.base)));
  const half: number = nose.rootHalfWidth + (nose.halfWidth - nose.rootHalfWidth) * Math.pow(t, 1.6);
  const depth: number = Math.max(1, ridgeZ - (nose.root.z - 0.4 * half - 10));
  const centre: number = ridgeZ - depth;
  const dx: number = Math.abs(p.x);
  const dz: number = p.z - centre;
  const s: number = dz > 0 ? Math.pow(dx / half, 1.6) + Math.pow(dz / depth, 1.6) : (dx / half) ** 2 + (dz / depth) ** 2;
  const under: number = nose.base + (t >= 1 ? 0 : 0) - p.y;
  return Math.max(radial(Math.hypot(dx, dz), s, 1.6), under);
};

/** A local swelling or hollow of the skin. */
interface IBump {
  centre: IAutoMovieVector3;
  radii: IAutoMovieVector3;
  height: number;
}

/** Exponent of the vault's top half, a conventional dome a little fuller than an ellipse. */
const VAULT_TOP_EXPONENT: number = 2.05;

/** Exponent of the vault's lower half, flat under the cranial base and steep at its walls. */
const VAULT_BOTTOM_EXPONENT: number = 4;

const shapeVault = (
  frame: frameAutoMovieHumanHead.IFrame,
  head: IAutoMovieHumanIdentity.IHead,
  breadth: number,
): IVault => {
  const centre: IAutoMovieVector3 = AutoMovieHumanVector.of(
    0,
    frame.glabella.y,
    frame.vertex.z,
  );
  const halfBreadth: number = breadth / 2;
  const front: number = frame.glabella.z - centre.z;
  const back: number = centre.z - frame.opisthocranion.z;
  const up: number = frame.vertex.y - centre.y;
  // forehead through frontotemporale: solve the front exponent at its height
  const ft: IAutoMovieVector3 = frame.frontotemporale;
  const rise: number = Math.max(0, ft.y - centre.y) / up;
  const level: number = Math.pow(
    Math.max(1e-6, 1 - Math.pow(rise, VAULT_TOP_EXPONENT)),
    1 / VAULT_TOP_EXPONENT,
  );
  const frontExponent: number = solve(
    (n: number): number =>
      Math.pow(ft.x / halfBreadth, n) +
      Math.pow(Math.max(0, ft.z - centre.z) / front, n) -
      Math.pow(level, n),
    1.5,
    5,
  );
  // circumference at glabella level: solve the back exponent
  const frontHalf: number = halfPerimeter(halfBreadth, front, frontExponent);
  const backExponent: number = solve(
    (n: number): number =>
      frontHalf + halfPerimeter(halfBreadth, back, n) - head.headCircumference,
    1.5,
    8,
  );
  return {
    centre,
    halfBreadth,
    front,
    back,
    up,
    downBack: centre.y - frame.tragion.y + 0.14 * head.headHeight,
    downFront: 0.12 * head.headHeight,
    downTemple: centre.y - frame.tragion.y + 0.04 * head.headHeight,
    frontExponent,
    backExponent,
  };
};

const distanceVault = (v: IVault, p: IAutoMovieVector3): number => {
  const dx: number = Math.abs(p.x - v.centre.x);
  const dy: number = p.y - v.centre.y;
  const dz: number = p.z - v.centre.z;
  const forward: number = dz / (dz > 0 ? v.front : v.back);
  const temple: number =
    v.downBack + (v.downTemple - v.downBack) * smoothStep(-0.15, 0.1, forward);
  const down: number =
    temple + (v.downFront - temple) * smoothStep(0.55, 0.95, forward);
  const n: number = dz > 0 ? v.frontExponent : v.backExponent;
  const horizontal: number = Math.pow(
    Math.pow(dx / v.halfBreadth, n) +
      Math.pow(Math.abs(dz) / (dz > 0 ? v.front : v.back), n),
    1 / n,
  );
  const q: number = dy > 0 ? VAULT_TOP_EXPONENT : VAULT_BOTTOM_EXPONENT;
  const s: number = Math.pow(horizontal, q) + Math.pow(Math.abs(dy) / (dy > 0 ? v.up : down), q);
  const r: number = Math.sqrt(dx * dx + dy * dy + dz * dz);
  return radial(r, s, q);
};

const shapeFace = (
  frame: frameAutoMovieHumanHead.IFrame,
  head: IAutoMovieHumanIdentity.IHead,
): IFaceKnot[] => {
  const fh: number = head.faceHeight;
  const fw: number = head.faceWidth;
  const me: IAutoMovieVector3 = frame.menton;
  const n: IAutoMovieVector3 = frame.nasion;
  const g: IAutoMovieVector3 = frame.glabella;
  const go: IAutoMovieVector3 = frame.gonion;
  const zy: IAutoMovieVector3 = frame.zygion;
  const ft: IAutoMovieVector3 = frame.frontotemporale;
  const sto: IAutoMovieVector3 = frame.stomion;
  // midline profile without nose and lips, depths from the 3D Facial Norms tragion depths
  const subnasale: number = n.z + 0.081 * fh;
  const gnathion: number = n.z - 0.042 * fh;
  const pogonion: number = gnathion + 0.035 * fh;
  const snY: number = me.y + 0.567 * fh;
  // the mandible's lower border, a parabola in the mandibular plane from menton to gonion
  const border = (t: number): { x: number; y: number; z: number } => ({
    x: Math.max(0.1 * fw, go.x * Math.sqrt(t)),
    y: me.y + (go.y - me.y) * t,
    z: me.z + (go.z - me.z) * t,
  });
  // the mask: brow, cheeks and jaw, its midline recessed behind the muzzle and the nose
  const profile: Array<[number, number]> = [
    [me.y, me.z - 0.06 * fh],
    [sto.y - 0.15 * fh, pogonion - 0.12 * fh],
    [sto.y, subnasale - 0.14 * fh],
    [snY, n.z - 0.06 * fh],
    [frame.eye.y - 0.1 * fh, n.z - 0.03 * fh],
    [n.y, n.z],
    [g.y, g.z],
    [g.y + 0.15 * fh, g.z - 0.08 * fh],
  ];
  const front = (y: number): number => interpolate(profile, y);
  const knots: IFaceKnot[] = [];
  for (const t of [0, 0.08, 0.2, 0.4, 0.65, 1]) {
    const b = border(t);
    knots.push({ y: b.y, halfWidth: b.x, widest: b.z, front: front(b.y), exponent: 1.8 });
  }
  const upper: Array<[number, number, number, number]> = [
    [(go.y + zy.y) / 2, (go.x + zy.x) / 2, (go.z + zy.z) / 2, 1.85],
    [zy.y, zy.x, zy.z, 1.95],
    [frame.eye.y, 0.42 * fw, frame.cornea.z - 0.12 * fh, 2.3],
    [g.y, ft.x, ft.z - 0.1 * fh, 2.6],
    [g.y + 0.15 * fh, 0.6 * ft.x, ft.z - 0.15 * fh, 2.6],
  ];
  for (const [y, halfWidth, widest, exponent] of upper)
    knots.push({ y, halfWidth, widest, front: front(y), exponent });
  return knots;
};

/**
 * The muzzle: the barrel of the dental arches under the lips, from the nose base to the chin, the central mass of the lower face in figure drawing ("the plane of the face ... broken on each side by a line from the outer corner of the cheek bone to the center of the upper lip", Bridgman 1920, Constructive Anatomy, p. 126). Its front follows the midline profile through subnasale, stomion, sublabiale and pogonion; its half-width is the mouth's at the lips and narrows to the chin.
 */
const shapeMuzzle = (
  frame: frameAutoMovieHumanHead.IFrame,
  head: IAutoMovieHumanIdentity.IHead,
): IFace => {
  const fh: number = head.faceHeight;
  const fw: number = head.faceWidth;
  const me: IAutoMovieVector3 = frame.menton;
  const n: IAutoMovieVector3 = frame.nasion;
  const sto: IAutoMovieVector3 = frame.stomion;
  const subnasale: number = n.z + 0.081 * fh;
  const gnathion: number = n.z - 0.042 * fh;
  const pogonion: number = gnathion + 0.035 * fh;
  const snY: number = me.y + 0.567 * fh;
  const knots: IFaceKnot[] = [
    { y: me.y, halfWidth: 0.1 * fw, widest: me.z - 0.2 * fh, front: me.z, exponent: 2 },
    { y: me.y + 0.04 * fh, halfWidth: 0.15 * fw, widest: gnathion - 0.22 * fh, front: gnathion, exponent: 2 },
    { y: me.y + 0.11 * fh, halfWidth: 0.17 * fw, widest: pogonion - 0.22 * fh, front: pogonion, exponent: 2 },
    { y: sto.y - 0.15 * fh, halfWidth: 0.2 * fw, widest: pogonion - 0.24 * fh, front: pogonion - 0.015 * fh, exponent: 2 },
    { y: sto.y, halfWidth: 0.24 * fw, widest: subnasale - 0.3 * fh, front: subnasale - 0.03 * fh, exponent: 2 },
    { y: snY, halfWidth: 0.2 * fw, widest: subnasale - 0.26 * fh, front: subnasale, exponent: 2 },
    { y: snY + 0.05 * fh, halfWidth: 0.12 * fw, widest: subnasale - 0.24 * fh, front: subnasale - 0.06 * fh, exponent: 2 },
  ];
  return compileFace(knots);
};

/** The face's sections as functions of height. */
interface IFace {
  bottom: number;
  top: number;
  halfWidth: (y: number) => number;
  widest: (y: number) => number;
  front: (y: number) => number;
  exponent: (y: number) => number;
}

const compileFace = (knots: IFaceKnot[]): IFace => {
  const of = (key: "halfWidth" | "widest" | "front" | "exponent"): ((y: number) => number) =>
    curve(knots.map((k: IFaceKnot): [number, number] => [k.y, k[key]]));
  return {
    bottom: Math.min(...knots.map((k: IFaceKnot): number => k.y)),
    top: Math.max(...knots.map((k: IFaceKnot): number => k.y)),
    halfWidth: of("halfWidth"),
    widest: of("widest"),
    front: of("front"),
    exponent: of("exponent"),
  };
};

const distanceFace = (face: IFace, p: IAutoMovieVector3): number => {
  const first = { y: face.bottom };
  const last = { y: face.top };
  if (p.y < first.y - 1 || p.y > last.y) return 1e3;
  const at = (key: "halfWidth" | "widest" | "front" | "exponent"): number => face[key](p.y);
  const fade: number =
    smoothStep(first.y - 1, first.y + 2, p.y) * (1 - smoothStep(last.y - 8, last.y, p.y));
  const halfWidth: number = Math.max(1, at("halfWidth") * fade);
  const widest: number = at("widest");
  const depth: number = Math.max(1, at("front") - widest);
  const n: number = at("exponent");
  const dx: number = Math.abs(p.x);
  const dz: number = p.z - widest;
  const s: number =
    dz > 0
      ? Math.pow(dx / halfWidth, n) + Math.pow(dz / depth, n)
      : Math.pow(dx / halfWidth, n) + Math.pow(-dz / (0.3 * depth), n);
  return radial(Math.sqrt(dx * dx + dz * dz), s, n);
};

const shapeStem = (
  frame: frameAutoMovieHumanHead.IFrame,
  circumference: number,
): IStem => {
  const r: number = circumference / (2 * Math.PI);
  return {
    lower: frame.neckJoint,
    upper: frame.headJoint,
    halfWidth: 0.9 * r,
    halfDepth: 0.95 * r,
    top: frame.tragion.y,
  };
};

const distanceStem = (s: IStem, p: IAutoMovieVector3): number => {
  if (p.y > s.top) return 1e3;
  const t: number = (p.y - s.lower.y) / (s.upper.y - s.lower.y);
  const cz: number = s.lower.z + (s.upper.z - s.lower.z) * t;
  const dx: number = Math.abs(p.x);
  const dz: number = p.z - cz;
  const v: number = Math.pow(dx / s.halfWidth, 2) + Math.pow(dz / (dz > 0 ? 0.8 : 1) / s.halfDepth, 2);
  return radial(Math.sqrt(dx * dx + dz * dz), v, 2);
};

const evaluateBump = (b: IBump, p: IAutoMovieVector3): number => {
  const q: number =
    ((p.x - b.centre.x) / b.radii.x) ** 2 +
    ((p.y - b.centre.y) / b.radii.y) ** 2 +
    ((p.z - b.centre.z) / b.radii.z) ** 2;
  return q >= 1 ? 0 : b.height * (1 - q) ** 2;
};

/** Signed distance along a radius from a superellipse value `s` of exponent `n` at radius `r`. */
const radial = (r: number, s: number, n: number): number =>
  s <= 0 ? -1e3 : r * (1 - Math.pow(s, -1 / n));

/** Polynomial smooth minimum of two distances with blend width `k` (Quilez). */
const smoothMin = (a: number, b: number, k: number): number => {
  const h: number = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - (h * h * k) / 4;
};

const smoothStep = (a: number, b: number, x: number): number => {
  const t: number = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Monotone piecewise cubic (Fritsch-Carlson) through knots, held flat outside. */
const interpolate = (knots: Array<[number, number]>, x: number): number =>
  curve(knots)(x);

/** The monotone piecewise cubic through knots as a function, its tangents computed once. */
const curve = (knots: Array<[number, number]>): ((x: number) => number) => {
  const k: Array<[number, number]> = [...knots].sort(
    (a: [number, number], b: [number, number]): number => a[0] - b[0],
  );
  const slopes: number[] = [];
  for (let i: number = 0; i + 1 < k.length; ++i)
    slopes.push((k[i + 1]![1] - k[i]![1]) / Math.max(1e-9, k[i + 1]![0] - k[i]![0]));
  const tangents: number[] = k.map((_: [number, number], i: number): number => {
    if (i === 0) return slopes[0]!;
    if (i === k.length - 1) return slopes[slopes.length - 1]!;
    const a: number = slopes[i - 1]!;
    const b: number = slopes[i]!;
    return a * b <= 0 ? 0 : (2 * a * b) / (a + b);
  });
  return (x: number): number => evaluate(k, tangents, x);
};

const evaluate = (k: Array<[number, number]>, tangents: number[], x: number): number => {
  if (x <= k[0]![0]) return k[0]![1];
  if (x >= k[k.length - 1]![0]) return k[k.length - 1]![1];
  const tangent = (i: number): number => tangents[i]!;
  let i: number = 0;
  while (x > k[i + 1]![0]) ++i;
  const h: number = Math.max(1e-9, k[i + 1]![0] - k[i]![0]);
  const t: number = (x - k[i]![0]) / h;
  const t2: number = t * t;
  const t3: number = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * k[i]![1] +
    (t3 - 2 * t2 + t) * h * tangent(i) +
    (-2 * t3 + 3 * t2) * k[i + 1]![1] +
    (t3 - t2) * h * tangent(i + 1)
  );
};

/** Half the perimeter of a superellipse quadrant pair with semi-axes `a` across and `b` along, exponent `n`. */
const halfPerimeter = (a: number, b: number, n: number): number => {
  const steps: number = 256;
  let sum: number = 0;
  let prev: [number, number] = [a, 0];
  for (let i: number = 1; i <= steps; ++i) {
    const theta: number = ((Math.PI / 2) * i) / steps;
    const c: number = Math.cos(theta);
    const s: number = Math.sin(theta);
    const point: [number, number] = [
      a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n),
      b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n),
    ];
    sum += Math.hypot(point[0] - prev[0], point[1] - prev[1]);
    prev = point;
  }
  return 2 * sum;
};

/** Root of an increasing or decreasing function by bisection, clamped to the bracket. */
const solve = (f: (x: number) => number, lo: number, hi: number): number => {
  let a: number = lo;
  let b: number = hi;
  const fa: number = f(a);
  const fb: number = f(b);
  if (fa * fb > 0) return Math.abs(fa) < Math.abs(fb) ? a : b;
  for (let i: number = 0; i < 60; ++i) {
    const m: number = (a + b) / 2;
    if (f(m) * fa > 0) a = m;
    else b = m;
  }
  return (a + b) / 2;
};
