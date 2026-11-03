import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { AutoMovieHumanBodySurface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import { AutoMovieHumanOralCavity } from "../../../../packages/human/src/generation/AutoMovieHumanOralCavity";
import { HumanPeople } from "./HumanPeople";
import { HumanAnatomy } from "./HumanAnatomy";
import type { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanAnatomyShared } from "./HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
type ISubject = HumanAnatomyAudit.ISubject;
type IFace = HumanAnatomyShared.IFace;
type ILine = { points: V3[]; closed: boolean };
const A = HumanAnatomy;
const { SIDES, SMALL, HEAD, identity, ratio, band, resample } = HumanAnatomyShared;

/** The head audit: its sites, located on a subject's skin by their published definitions, and their rows. */
export namespace HumanAnatomyHead {
  /** The face's landmarks themselves, besides the dimensions between them. */
  export interface ISites extends IFace {
    /** Median landmarks on the outer skin, mm. */
    median: {
      vertex: V3;
      glabella: V3;
      nasion: V3;
      pronasale: V3;
      subnasale: V3;
      labraleSuperius: V3;
      stomion: V3;
      labraleInferius: V3;
      sublabiale: V3;
      pogonion: V3;
      gnathion: V3;
      menton: V3;
      opisthocranion: V3;
    };

    /** Endocanthion and exocanthion by side, mm; NaN when the eye has no fissure. */
    canthi: Record<"left" | "right", { en: V3; ex: V3 }>;

    /** Auricles by side. */
    ears: Record<"left" | "right", IEar>;
  }

  /** One auricle's landmarks and dimensions. */
  export interface IEar {
    /** Superaurale, the auricle's highest point, mm. */
    superaurale: V3;

    /** Subaurale, the lobule's lowest point, mm. */
    subaurale: V3;

    /** Tragion: the auricle's front at the tragus, mm. */
    tragion: V3;

    /** Superaurale to subaurale, mm. */
    length: number;

    /** Breadth perpendicular to the long axis, from the front attachment to the posterior helix, mm. */
    breadth: number;

    /** Helix rim from the scalp behind it at the tragus' level, mm. */
    protrusion: number;

    /** Inclination of the long axis behind the vertical, seen from the side, degrees. */
    inclination: number;

    /** Auricle vertices. */
    points: V3[];
  }

  /**
   * The head and face: head and face dimensions at their Farkas, FaceBase and
   * ISO 7250-1 landmarks, the ears, the closed mouth, and population
   * proportions and profile angles.
   */
  export function head(subject: ISubject): IRow[] {
    const name: string = subject.name;
    const rows: IRow[] = [];
    const p: IAutoMovieHumanParameters = subject.params;
    const skin: HumanAnatomy.ISkin = subject.bind();
    const S: number = p.body.controls.height.value!;
    const f: ISites = faceSites(skin, S, subject.mouth);
    const h = p.head;
    const id = (site: string, value: number, input: number): void => {
      rows.push(identity(name, site, value, input, HEAD));
    };
    id("head length, glabella to opisthocranion, mm", f.length, h.length);
    id("head breadth, eurion to eurion, mm", f.breadth, (h.length * h.cephalicIndex) / 100);
    id("head height, menton to vertex, mm", f.height, h.height);
    id("face height, nasion to gnathion, mm", f.faceHeight, h.faceHeight);
    id("face width, zygion to zygion, mm", f.faceWidth, h.faceWidth);
    id("mandibular width, gonion to gonion, mm", f.mandibular, h.mandibularWidth);
    rows.push(identity(name, "head circumference over glabella and opisthocranion, mm", f.circumference, h.circumference, SMALL));
    id("intercanthal width, en to en, mm", f.intercanthal, h.face.intercanthalWidth);
    for (const side of SIDES) {
      id(`${side} palpebral fissure length, en to ex, mm`, f.fissure[side].length, h.face.eyePair[side].palpebralFissureLength);
      id(`${side} palpebral fissure height at the pupil, mm`, f.fissure[side].height, h.face.eyePair[side].palpebralFissureHeight);
    }
    id("nasal width, al to al, mm", f.noseWidth, h.face.nose.width);
    id("nasal height, n to sn, mm", f.noseHeight, h.face.nose.height);
    id("nasal protrusion, sn to prn, mm", f.noseProtrusion, h.face.nose.protrusion);
    id("mouth width, ch to ch, mm", f.mouthWidth, h.face.mouth.width);
    id("upper vermilion height, ls to sto, mm", f.upperVermilion, h.face.mouth.upperVermilionHeight);
    id("lower vermilion height, sto to li, mm", f.lowerVermilion, h.face.mouth.lowerVermilionHeight);
    for (const side of SIDES) {
      const ear: IEar = f.ears[side];
      id(`${side} ear length, sa to sba, mm`, ear.length, h.earPair[side].length);
      id(`${side} ear breadth, perpendicular to the long axis, mm`, ear.breadth, h.earPair[side].breadth);
      id(`${side} ear protrusion at the tragus' level, mm`, ear.protrusion, h.earPair[side].protrusion);
    }
    rows.push({ person: name, site: "lips at rest: gap between the lips at the midline, mm", value: f.lipGap, low: 0, high: HEAD, unit: "mm" });
    rows.push({ person: name, site: "lips at rest: widest gap along the middle half of the mouth, mm", value: f.mouthGap, low: 0, high: HEAD, unit: "mm" });
    if (subject.mouth) rows.push({ person: name, site: "teeth at rest: tooth points seen from the front", value: f.teethSeen, low: 0, high: 0, unit: "points" });
    rows.push(ratio(name, "nasolabial angle, deg", f.nasolabial, 83.4, 120.6));
    rows.push(ratio(name, "lower face height sn-gn / n-gn", f.lowerFace, 0.441, 0.694));
    rows.push(ratio(name, "upper lip height sn-sto / n-gn", f.upperLip, 0.12, 0.232));
    for (const row of proportions(name, f)) rows.push(row);
    return rows;
  }

  /**
   * Population proportions and profile angles of the located face. Each range
   * spans the cited adult samples, the lowest mean less 2.326 SD to the
   * highest mean plus 2.326 SD, a ratio's SD taken from its parts as
   * uncorrelated: fissure over intercanthal width and the nasal index from
   * Weinberg 2016, Gao 2025 and Virdi 2019 (European, Chinese and Kenyan
   * adults); canthal tilt from Gao 2025; facial convexity and upper lip
   * protrusion from Legan and Burstone's European-American norms and Celebi
   * 2013's Turkish adults.
   */
  export function proportions(name: string, f: ISites): IRow[] {
    const rows: IRow[] = [];
    const m = f.median;
    // Orbits: fissure length over intercanthal width, and canthal tilt.
    for (const side of SIDES)
      rows.push(ratio(name, `${side} palpebral fissure over intercanthal width, en-ex / en-en`, f.fissure[side].length / f.intercanthal, 0.598, 1.341));
    for (const side of SIDES)
      rows.push(ratio(name, `${side} canthal tilt, exocanthion above endocanthion across the face, deg`, tilt(f.canthi[side].en, f.canthi[side].ex), -5.6, 12.8));
    rows.push(ratio(name, "nasal index al-al / n-sn", f.noseWidth / f.noseHeight, 0.457, 1.077));
    // Profile in the median plane (Legan and Burstone 1980).
    rows.push(ratio(name, "facial convexity angle g-sn-pg, deg", convexity(m.glabella, m.subnasale, m.pogonion), 2.7, 26.6));
    rows.push(ratio(name, "upper lip protrusion, ls ahead of sn-pg, mm", ahead(m.labraleSuperius, m.subnasale, m.pogonion), -2.1, 7.9));
    return rows;
  }

  /**
   * Canthal tilt: the angle of the exocanthion above the endocanthion in the
   * frontal plane, against the face's transverse axis, the normal of the
   * median plane, degrees. Gao 2025 reads it against the intercanthal line;
   * on a face held level the two agree, and the transverse axis spares each
   * side the other endocanthion's error.
   */
  export function tilt(en: V3, ex: V3): number {
    return (Math.atan2(ex[1] - en[1], Math.abs(ex[2] - en[2])) * 180) / Math.PI;
  }

  /**
   * Facial convexity: the angle at subnasale between glabella-subnasale and
   * subnasale-pogonion in the median plane, positive when pogonion lies behind
   * the line from glabella through subnasale, degrees.
   */
  export function convexity(g: V3, sn: V3, pg: V3): number {
    const d1: [number, number] = [sn[0] - g[0], sn[1] - g[1]];
    const d2: [number, number] = [pg[0] - sn[0], pg[1] - sn[1]];
    return (-Math.atan2(d1[0] * d2[1] - d1[1] * d2[0], d1[0] * d2[0] + d1[1] * d2[1]) * 180) / Math.PI;
  }

  /** Signed distance of a point ahead of the line from a to b in the median plane, mm. */
  export function ahead(p: V3, a: V3, b: V3): number {
    const e: [number, number] = [b[0] - a[0], b[1] - a[1]];
    const l: number = Math.hypot(e[0], e[1]);
    // The forward normal of a line running down the face.
    const n: [number, number] = [-e[1] / l, e[0] / l];
    return (p[0] - a[0]) * n[0] + (p[1] - a[1]) * n[1];
  }

  /** Locate the face's landmarks by their Farkas and FaceBase definitions. */
  export function faceSites(skin: HumanAnatomy.ISkin, S: number, mouth: boolean): ISites {
    const loops: V3[][] = A.openings(skin);
    const profile: IProfile = medianProfile(skin, S, loops);
    const { up, lo, eUp, eLo, top, topLine, mouthLoop } = profile;
    // Upward from the lip: pronasale the most anterior point before the vertex.
    let vertexIdx: number = 0;
    for (let i: number = 0; i < up.length; i++) if (up[i]![1] > up[vertexIdx]![1]) vertexIdx = i;
    let prn: number = 0;
    for (let i: number = 0; i < vertexIdx; i++) if (up[i]![0] > up[prn]![0]) prn = i;
    // Walking up from the lip the body lies behind, on the walker's left, so a
    // concave corner turns right (negative).
    const sn: number = subnasale(up, prn, -1);
    // Labrale superius: the upper lip's most prominent point, farthest ahead
    // of the chord from subnasale down to stomion, so a lip that slopes back
    // still shows its own prominence.
    let ls: number = 0;
    for (let i: number = 0; i < sn; i++) if (ahead(up[i]!, up[sn]!, up[0]!) > ahead(up[ls]!, up[sn]!, up[0]!)) ls = i;
    const prnP: V3 = up[prn]!;
    const snP: V3 = up[sn]!;
    // Eyes: on each side the widest opening of the skin between pronasale and
    // the vertex, off the midline: the palpebral fissure's lid margins. A real
    // head may hold other, smaller boundaries round the eye; the margin is the
    // widest of them.
    const eyes: Record<"left" | "right", V3[] | undefined> = { left: undefined, right: undefined };
    const width: Map<V3[], [V3, V3]> = new Map();
    for (const l of loops) {
      const c: V3 = centre(l);
      if (c[1] < prnP[1] || c[1] > top[1] - 30 || Math.abs(c[2]) < 12 || Math.abs(c[2]) > 80 || c[0] < prnP[0] - 70) continue;
      const side: "left" | "right" = c[2] > 0 ? "left" : "right";
      width.set(l, diameter(l));
      const was: V3[] | undefined = eyes[side];
      if (was === undefined || span(width.get(l)!) > span(width.get(was)!)) eyes[side] = l;
    }
    const found: V3[][] = [eyes.left, eyes.right].filter((e: V3[] | undefined): e is V3[] => e !== undefined);
    // Glabella by the profile's own shape, so a nasal root standing ahead of
    // the brow cannot take its place: the brow's most prominent point,
    // farthest ahead of the chord from the nasofrontal hollow (the deepest
    // point behind the chord from pronasale to the forehead 45 mm above the
    // eye openings' centre) to that forehead point. Nasion: the most posterior
    // point between glabella and pronasale, or the hollow itself when the brow
    // recedes behind the nasal root.
    const eyeLevel: number = found.length === 0 ? prnP[1] + 40 : found.reduce((s: number, e: V3[]): number => s + centre(e)[1], 0) / found.length;
    let F: number = prn;
    while (F < vertexIdx && up[F]![1] < eyeLevel + 45) F++;
    let hollow: number = prn;
    for (let i: number = prn; i <= F; i++) if (ahead(up[i]!, up[F]!, up[prn]!) < ahead(up[hollow]!, up[F]!, up[prn]!)) hollow = i;
    let g: number = hollow;
    for (let i: number = hollow; i <= F; i++) if (ahead(up[i]!, up[F]!, up[hollow]!) > ahead(up[g]!, up[F]!, up[hollow]!)) g = i;
    let n: number = prn;
    for (let i: number = prn; i <= g; i++) if (up[i]![0] < up[n]![0]) n = i;
    if (n === g) n = hollow;
    const glabella: V3 = up[g]!;
    // Opisthocranion: the vault's point farthest from glabella, behind it.
    let op: V3 = glabella;
    for (const p of topLine.points)
      if (p[1] > glabella[1] - 60 && p[0] < glabella[0] - 100 && A.dist(p, glabella) > A.dist(op, glabella)) op = p;
    // Downward from the lower lip: labrale inferius the lip's most prominent
    // point in its first 12 mm; gnathion the chin's support point toward the
    // front and down within 60 mm; menton the lowest point within 40 mm past
    // gnathion. Sublabiale, the mentolabial sulcus, is the deepest point
    // behind the chord from labrale inferius to gnathion, read on the
    // profile's own shape; pogonion is the chin's most anterior point between
    // sublabiale and gnathion.
    let li: number = 0;
    for (let i: number = 0; i < Math.min(lo.length, 24); i++) if (lo[i]![0] > lo[li]![0]) li = i;
    let gn: number = li;
    for (let i: number = li; i < Math.min(lo.length, li + 120); i++) if (lo[i]![0] - lo[i]![1] > lo[gn]![0] - lo[gn]![1]) gn = i;
    let me: number = gn;
    for (let i: number = gn; i < Math.min(lo.length, gn + 80); i++) if (lo[i]![1] < lo[me]![1]) me = i;
    let sl: number = li;
    for (let i: number = li; i <= gn; i++) if (ahead(lo[i]!, lo[li]!, lo[gn]!) < ahead(lo[sl]!, lo[li]!, lo[gn]!)) sl = i;
    let pg: number = sl;
    for (let i: number = sl; i <= gn; i++) if (lo[i]![0] > lo[pg]![0]) pg = i;
    const sto: V3 = A.lerp(eUp, eLo, 0.5);
    const fissure: Record<"left" | "right", { length: number; height: number }> = {
      left: { length: NaN, height: NaN },
      right: { length: NaN, height: NaN },
    };
    const nan: V3 = [NaN, NaN, NaN];
    const canthi: Record<"left" | "right", { en: V3; ex: V3 }> = { left: { en: nan, ex: nan }, right: { en: nan, ex: nan } };
    for (const side of SIDES) {
      const eye: V3[] | undefined = eyes[side];
      if (eye === undefined) continue;
      const [a, b] = width.get(eye)!;
      const en: V3 = Math.abs(a[2]) < Math.abs(b[2]) ? a : b;
      const ex: V3 = en === a ? b : a;
      const d: V3 = A.unit(A.sub(ex, en));
      const L: number = A.dist(en, ex);
      let over: number = 0;
      let under: number = 0;
      for (const p of eye) {
        const s: number = A.dot(A.sub(p, en), d);
        if (Math.abs(s - L / 2) > 0.1 * L) continue;
        const off: number = A.dot(A.reject(A.sub(p, en), d), [0, 1, 0]);
        over = Math.max(over, off);
        under = Math.min(under, off);
      }
      fissure[side] = { length: L, height: over - under };
      canthi[side] = { en, ex };
    }
    let mouthWidth: number = NaN;
    let mouthGap: number = 0;
    if (mouthLoop === undefined) mouthWidth = labialFissure(skin, sto, profile.cavity);
    else {
      const [a, b] = diameter(mouthLoop);
      mouthWidth = A.dist(a, b);
      for (let z: number = -mouthWidth / 4; z <= mouthWidth / 4; z += 0.5) {
        const ys: number[] = mouthLoop.filter((p: V3): boolean => Math.abs(p[2] - z) < 0.5).map((p: V3): number => p[1]);
        if (ys.length >= 2) mouthGap = Math.max(mouthGap, Math.max(...ys) - Math.min(...ys));
      }
    }
    const ears: Record<"left" | "right", IEar> = { left: auricle(skin, "left"), right: auricle(skin, "right") };
    // Head points: the skin above the chin, the auricles left out.
    const auricles: Set<string> = new Set([...ears.left.points, ...ears.right.points].map(key));
    const headPoints: V3[] = [];
    for (let v: number = 0; v < skin.P.length / 3; v++) {
      const p: V3 = A.point(skin, v);
      if (p[1] > lo[me]![1] - 10 && !auricles.has(key(p))) headPoints.push(p);
    }
    const widest = (keep: (p: V3) => boolean): number => {
      const rows: Map<number, [number, number]> = new Map();
      for (const p of headPoints) {
        if (!keep(p)) continue;
        const k: number = Math.round(p[1]);
        const r: [number, number] = rows.get(k) ?? [Infinity, -Infinity];
        rows.set(k, [Math.min(r[0], p[2]), Math.max(r[1], p[2])]);
      }
      let best: number = 0;
      for (const [lo2, hi2] of rows.values()) best = Math.max(best, hi2 - lo2);
      return best;
    };
    const tragion: V3 = A.lerp(ears.left.tragion, ears.right.tragion, 0.5);
    const earTop: number = Math.max(ears.left.superaurale[1], ears.right.superaurale[1]);
    const eyeLow: number = Math.min(...found.flatMap((e: V3[]): number[] => e.map((p: V3): number => p[1])));
    // Zygion: the widest face over the arches, in front of the tragion and
    // between its height and the lower lids. Gonion: the widest lower face from
    // menton to stomion within 40 mm in front of the tragion. Eurion: the widest
    // vault above the auricles, clear of their roots.
    const faceWidth: number = widest((p: V3): boolean => p[0] > tragion[0] + 10 && p[1] < eyeLow && p[1] > tragion[1] - 5);
    const mandibular: number = widest(
      (p: V3): boolean => p[0] > tragion[0] - 10 && p[0] < tragion[0] + 40 && p[1] < sto[1] && p[1] > lo[me]![1],
    );
    const breadthHead: number = widest((p: V3): boolean => p[1] > earTop + 3);
    // Head circumference: the plane through glabella and opisthocranion, across.
    const across: V3 = A.unit(A.cross(A.sub(op, glabella), [0, 0, 1]));
    const ring: HumanAnatomy.ICut | null = A.cut(
      skin,
      glabella,
      across,
      A.lerp(glabella, op, 0.5),
      band(skin, Math.min(glabella[1], op[1]) - 40, top[1] + 1),
    );
    const noseWidth: number = alare(skin, snP, prnP);
    // Teeth seen from the front through the mouth's opening.
    // Skin closed over the mouth hides whatever lies behind it.
    const teethSeen: number = !mouth || mouthLoop === undefined ? 0 : teeth(skin, sto[1] - 40, sto[1] + 40);
    // Nasolabial angle Cm-Sn-Ls: the columella point Cm is where the line from
    // subnasale touches the nose's lower border, the least steep line from
    // subnasale to the profile on the way to pronasale.
    let cm: number = prn;
    const rise = (p: V3): number => Math.atan2(p[1] - snP[1], p[0] - snP[0]);
    for (let i: number = sn + 2; i < prn; i++) if (up[i]![0] > snP[0] + 1 && rise(up[i]!) < rise(up[cm]!)) cm = i;
    const colum: V3 = A.unit(A.sub(up[cm]!, snP));
    const lip: V3 = A.unit(A.sub(up[Math.max(0, ls)]!, snP));
    const nasolabial: number = (Math.acos(Math.max(-1, Math.min(1, A.dot(colum, lip)))) * 180) / Math.PI;
    const nasion: V3 = up[n]!;
    const gnathion: V3 = lo[gn]!;
    return {
      length: A.dist(glabella, op),
      breadth: breadthHead,
      height: top[1] - lo[me]![1],
      circumference: ring === null ? NaN : ring.girth,
      faceHeight: A.dist(nasion, gnathion),
      faceWidth,
      mandibular,
      intercanthal: A.dist(canthi.left.en, canthi.right.en),
      fissure,
      noseWidth,
      noseHeight: A.dist(nasion, snP),
      noseProtrusion: A.dist(snP, prnP),
      mouthWidth,
      upperVermilion: A.dist(up[ls]!, sto),
      lowerVermilion: A.dist(sto, lo[li]!),
      lipGap: A.dist(eUp, eLo),
      mouthGap,
      teethSeen,
      nasolabial,
      lowerFace: A.dist(snP, gnathion) / A.dist(nasion, gnathion),
      upperLip: A.dist(snP, sto) / A.dist(nasion, gnathion),
      median: {
        vertex: top,
        glabella,
        nasion,
        pronasale: prnP,
        subnasale: snP,
        labraleSuperius: up[ls]!,
        stomion: sto,
        labraleInferius: lo[li]!,
        sublabiale: lo[sl]!,
        pogonion: lo[pg]!,
        gnathion,
        menton: lo[me]!,
        opisthocranion: op,
      },
      canthi,
      ears,
    };
  }

  /** The outer median profile, split at the lips. */
  export interface IProfile {
    /** From the upper lip's end up the face, over the vertex and down the back, every 0.5 mm. */
    up: V3[];

    /** From the lower lip's end down the chin and neck, every 0.5 mm. */
    lo: V3[];

    /** Upper lip's end at the labial fissure. */
    eUp: V3;

    /** Lower lip's end at the labial fissure. */
    eLo: V3;

    /** Vertex, the skin's highest median point. */
    top: V3;

    /** The median section holding the vertex. */
    topLine: ILine;

    /** The mouth's opening when the lips are parted by one. */
    mouthLoop: V3[] | undefined;

    /** Whether the lips close over an oral cavity the median curve enters. */
    cavity: boolean;
  }

  /**
   * The outer median profile walked down from the vertex over the face.
   *
   * The lips end the walk in one of three ways. An opening of the mouth across
   * the midline ends the median curve at the upper lip, and the walk resumes
   * from the lower lip's end of the nearest other curve. Lips that close over
   * an oral cavity carry the curve through the labial fissure into the mouth
   * and back out; every such excursion is cut out of the profile (see
   * {@link outer}), and the longest one below pronasale is the mouth's, its
   * bridge the stomion. Lips sealed without a cavity leave only the labial
   * fissure's crease, the sharpest 2 mm notch from 4 to 35 mm below
   * subnasale; the labiomental fold is broad, so it never out-notches the
   * fissure.
   */
  export function medianProfile(skin: HumanAnatomy.ISkin, S: number, loops: V3[][]): IProfile {
    const lines: ILine[] = A.polylines(skin, A.MEDIAN, [0, 0, 1], band(skin, 0.78 * S, S + 10));
    let top: V3 = [0, -Infinity, 0];
    let topLine: ILine = lines[0]!;
    let topIdx: number = 0;
    for (const l of lines)
      l.points.forEach((p: V3, i: number): void => {
        if (p[1] > top[1]) {
          top = p;
          topLine = l;
          topIdx = i;
        }
      });
    const floor: number = top[1] - 0.2 * S;
    const walk = (line: ILine, start: number, dir: 1 | -1): { points: V3[]; open: boolean } => {
      const n: number = line.points.length;
      const out: V3[] = [];
      for (let k: number = 0; k < n; k++) {
        const i: number = start + dir * k;
        if (!line.closed && (i < 0 || i >= n)) return { points: out, open: true };
        const p: V3 = line.points[((i % n) + n) % n]!;
        out.push(p);
        if (p[1] < floor) break;
      }
      return { points: out, open: false };
    };
    const tp: V3[] = topLine.points;
    const forward: 1 | -1 = tp[(topIdx + 1) % tp.length]![0] > tp[(topIdx - 1 + tp.length) % tp.length]![0] ? 1 : -1;
    const down = walk(topLine, topIdx, forward);
    const last: V3 = down.points[down.points.length - 1]!;
    if (down.open && last[1] > floor) {
      let lowerLine: V3[] = [];
      let gap: number = Infinity;
      for (const l of lines) {
        if (l === topLine) continue;
        for (const [k, p] of [l.points[0]!, l.points[l.points.length - 1]!].entries()) {
          const d: number = A.dist(p, last);
          if (d < gap) {
            gap = d;
            lowerLine = k === 0 ? l.points : [...l.points].reverse();
          }
        }
      }
      const upper: V3[] = resample(down.points, 0.5);
      const lo: V3[] = resample(lowerLine.filter((p: V3): boolean => p[1] > floor), 0.5);
      const eUp: V3 = upper[upper.length - 1]!;
      // The opening the curve ends at is the mouth's.
      let mouthLoop: V3[] | undefined;
      let near: number = Infinity;
      for (const l of loops)
        for (const p of l)
          if (A.dist(p, eUp) < near) {
            near = A.dist(p, eUp);
            mouthLoop = l;
          }
      return { up: [...upper].reverse(), lo, eUp, eLo: lo[0] ?? eUp, top, topLine, mouthLoop, cavity: false };
    }
    const { line: d, entrances } = outer(resample(down.points, 0.5));
    let p0: number = 0;
    for (let i: number = 0; i < d.length; i++) if (d[i]![0] > d[p0]![0]) p0 = i;
    // The oral cavity is the face's largest: its entrance below pronasale is
    // the excursion that runs longest.
    let lips: { at: number; arc: number } | undefined;
    for (const e of entrances)
      if (e.at > p0 && d[e.at]![1] < d[p0]![1] - 5 && (lips === undefined || e.arc > lips.arc)) lips = e;
    if (lips !== undefined)
      return { up: d.slice(0, lips.at + 1).reverse(), lo: d.slice(lips.at + 1), eUp: d[lips.at]!, eLo: d[lips.at + 1]!, top, topLine, mouthLoop: undefined, cavity: true };
    const s0: number = subnasale(d, p0, 1);
    const notch = (i: number): number => (d[i - 4]![0] + d[i + 4]![0]) / 2 - d[i]![0];
    let st: number = s0 + 8;
    for (let i: number = s0 + 8; i < Math.min(d.length - 4, s0 + 70); i++) if (notch(i) > notch(st)) st = i;
    return { up: d.slice(0, st + 1).reverse(), lo: d.slice(st), eUp: d[st]!, eLo: d[st]!, top, topLine, mouthLoop: undefined, cavity: false };
  }

  /**
   * A curve sampled every 0.5 mm with its excursions cut out: wherever it comes
   * back within {@link GAP} of itself across more than 10 mm of arc it has
   * entered a cavity (the mouth between closed lips, a nostril the median
   * plane strays into) and left it again; the outer skin bridges the
   * entrance. Each entrance is bridged where its walls meet: the outermost
   * pair closer than {@link CONTACT}, else, when they never touch, the closest
   * pair. Entrances are the indices after which the bridge falls.
   */
  export function outer(d: V3[]): { line: V3[]; entrances: { at: number; arc: number }[] } {
    const line: V3[] = [];
    const entrances: { at: number; arc: number }[] = [];
    let i: number = 0;
    while (i < d.length) {
      const pair: [number, number] | null = excursion(d, i, d.length);
      if (pair === null) {
        line.push(...d.slice(i));
        break;
      }
      line.push(...d.slice(i, pair[0] + 1));
      entrances.push({ at: line.length - 1, arc: (pair[1] - pair[0]) / 2 });
      i = pair[1];
    }
    return { line, entrances };
  }

  /** Distance within which a curve returning to itself has made an excursion, mm. */
  export const GAP: number = 3;

  /** Distance within which an excursion's walls meet, the closed lips' allowance, mm. */
  export const CONTACT: number = HEAD;

  /**
   * The entrance of the first excursion a curve sampled every 0.5 mm makes
   * from an index range, as the pair of its walls' points where they meet (see
   * {@link outer}); null when the curve makes none.
   */
  export function excursion(d: V3[], from: number, to: number): [number, number] | null {
    // The nearest point across an excursion: more than 10 mm of arc on.
    const partner = (i: number): number => {
      let best: number = -1;
      for (let j: number = i + 21; j < d.length; j++)
        if (A.dist(d[i]!, d[j]!) < GAP && (best < 0 || A.dist(d[i]!, d[j]!) < A.dist(d[i]!, d[best]!))) best = j;
      return best;
    };
    for (let i: number = Math.max(0, from); i < to; i++) {
      if (partner(i) < 0) continue;
      // Walk inward along the entrance's walls until they meet.
      let closest: [number, number] = [i, partner(i)];
      for (let k: number = i; k < d.length; k++) {
        const j: number = partner(k);
        if (j < 0 || j <= k + 20) break;
        const gap: number = A.dist(d[k]!, d[j]!);
        if (gap < CONTACT) return [k, j];
        if (gap < A.dist(d[closest[0]]!, d[closest[1]]!)) closest = [k, j];
      }
      return closest;
    }
    return null;
  }

  /**
   * Mouth width of closed lips: cheilion to cheilion, where the lips stop
   * meeting. Sagittal planes outward from the midline cut the lips; on each,
   * the outer skin's section is the curve reaching farthest forward at the
   * fissure's height. Over an oral cavity the lips are two walls that touch,
   * so the fissure goes on while the section, within 8 mm of stomion's
   * height, folds into a slit whose walls stay within {@link CONTACT} across
   * at least 1.5 mm of arc. Lips sealed without a cavity leave a crease, and
   * the fissure goes on while its deepest notch there sits 0.3 mm or more
   * under its 4 mm chord.
   */
  export function labialFissure(skin: HumanAnatomy.ISkin, sto: V3, cavity: boolean): number {
    const near: Uint32Array = band(skin, sto[1] - 45, sto[1] + 45);
    let width: number = 0;
    for (const side of [1, -1]) {
      let reach: number = NaN;
      for (let c: number = 0.5; c <= 45; c += 0.5) {
        // The outer skin's section: the curve reaching farthest forward at the
        // fissure's height; the oral cavity's own walls are other curves.
        let pts: V3[] = [];
        let front: number = -Infinity;
        for (const line of A.polylines(skin, [0, 0, side * c], [0, 0, 1], near)) {
          const r: V3[] = resample(line.points, 0.5);
          for (const p of r)
            if (Math.abs(p[1] - sto[1]) <= 8 && p[0] > front) {
              front = p[0];
              pts = r;
            }
        }
        let notch: number = 0;
        let slit: boolean = false;
        for (let i: number = 0; i < pts.length; i++) {
          const p: V3 = pts[i]!;
          if (Math.abs(p[1] - sto[1]) > 8 || p[0] < sto[0] - 20) continue;
          if (i >= 4 && i + 4 < pts.length) notch = Math.max(notch, (pts[i - 4]![0] + pts[i + 4]![0]) / 2 - p[0]);
          for (let j: number = i + 3; cavity && !slit && j < pts.length; j++) if (A.dist(p, pts[j]!) < CONTACT) slit = true;
        }
        if (cavity ? !slit : notch < 0.3) break;
        reach = c;
      }
      width += reach;
    }
    return width;
  }

  /**
   * Nasal width, alare to alare: on horizontal cuts from subnasale up, the
   * face's contour on each side walked inward from 35 mm off the midline. The
   * cheek beside the nose faces forward, so the contour runs across; the ala's
   * lateral wall faces outward, so the contour there runs within
   * {@link WALL} degrees of straight back. Alare is where the inward walk first
   * meets that wall, the ala's most lateral point at that height; a cut with
   * no such wall passes above or below the alae.
   */
  export function alare(skin: HumanAnatomy.ISkin, sn: V3, prn: V3): number {
    let noseWidth: number = 0;
    for (let y: number = sn[1] - 1; y <= sn[1] + 0.4 * (prn[1] - sn[1] + 15); y += 0.5) {
      const parts: ILine[] = A.polylines(skin, [0, y, 0], [0, 1, 0], band(skin, y - 1, y + 1));
      let line: V3[] = [];
      let closed: boolean = false;
      let at: number = -1;
      for (const part of parts) {
        const r: V3[] = resample(part.points, 0.25);
        r.forEach((p: V3, i: number): void => {
          if (Math.abs(p[2]) < 1 && p[0] > sn[0] - 5 && (at < 0 || p[0] > line[at]![0])) {
            line = r;
            closed = part.closed;
            at = i;
          }
        });
      }
      if (at < 0) continue;
      const n: number = line.length;
      const get = (i: number): V3 | undefined => (closed ? line[((i % n) + n) % n] : line[i]);
      let left: number = NaN;
      let right: number = NaN;
      for (const dir of [1, -1]) {
        // Outward to 35 mm off the midline, staying on the face.
        let end: number = 0;
        for (let k: number = 1; k < n; k++) {
          const p: V3 | undefined = get(at + dir * k);
          if (p === undefined || p[0] < sn[0] - 40) break;
          end = k;
          if (Math.abs(p[2]) > 35) break;
        }
        // Back inward, every 1 mm of arc, until the contour turns to run back.
        let reach: number = NaN;
        for (let k: number = end; k - 4 > 0; k--) {
          const p: V3 = get(at + dir * k)!;
          const q: V3 = get(at + dir * (k - 4))!;
          if (Math.abs(q[2]) < 5) break;
          const run: number = Math.abs(q[2] - p[2]) / Math.max(1e-9, Math.hypot(q[0] - p[0], q[2] - p[2]));
          if (run < Math.sin((WALL * Math.PI) / 180)) {
            reach = p[2];
            break;
          }
        }
        if (reach > 0) left = reach;
        else if (reach < 0) right = reach;
      }
      if (!Number.isNaN(left) && !Number.isNaN(right)) noseWidth = Math.max(noseWidth, left - right);
    }
    return noseWidth;
  }

  /** Angle off straight back within which a horizontal contour reads as the ala's lateral wall, degrees. */
  export const WALL: number = 20;

  /**
   * One auricle, found by its shape: a plate of cartilage standing off the
   * head. Near the auricle's chains, every vertex whose skin, seen from just
   * inside it, meets skin again within 15 mm toward the median plane belongs
   * to that thin plate; the scalp, cheek and concha's floor have the head
   * behind them. Superaurale and subaurale are the plate's highest and lowest
   * points, its long axis the line between them; breadth runs perpendicular
   * to that axis from otobasion superius to the helix's farthest point back;
   * tragion is its most anterior point in the middle third of its height;
   * protrusion is how far the helix rim, the plate's most lateral point at
   * the tragion's level, stands from the nearest scalp behind the auricle.
   */
  export function auricle(skin: HumanAnatomy.ISkin, side: "left" | "right"): IEar {
    const nan: V3 = [NaN, NaN, NaN];
    const none: IEar = { superaurale: nan, subaurale: nan, tragion: nan, length: NaN, breadth: NaN, protrusion: NaN, inclination: NaN, points: [] };
    const seed: V3[] = A.vertices(skin, new RegExp(`^ear\\..*${side}$`));
    if (seed.length === 0) return none;
    const c: V3 = centre(seed);
    const normals: Float64Array = vertexNormalsOf(skin);
    const inward: 1 | -1 = side === "left" ? -1 : 1;
    const plate: V3[] = [];
    const scalp: V3[] = [];
    for (let v: number = 0; v < skin.P.length / 3; v++) {
      const p: V3 = A.point(skin, v);
      if (A.dist(p, c) > 45) continue;
      const nrm: V3 = [normals[3 * v]!, normals[3 * v + 1]!, normals[3 * v + 2]!];
      const hit = A.ray(skin, A.sub(p, A.scale(nrm, 0.1)), 2, inward);
      if (hit.crossings > 0 && hit.nearest < 15) plate.push(p);
      else scalp.push(p);
    }
    if (plate.length < 10) return none;
    let sa: V3 = plate[0]!;
    let sba: V3 = plate[0]!;
    for (const p of plate) {
      if (p[1] > sa[1]) sa = p;
      if (p[1] < sba[1]) sba = p;
    }
    // Breadth: backward perpendicular to the long axis, from otobasion
    // superius, the most anterior point of the upper half where the plate
    // meets the head, to the helix's farthest point back.
    const u: V3 = A.unit(A.sub(sa, sba));
    const w: V3 = A.unit(A.reject([-1, 0, 0], u));
    const cells: Map<string, V3[]> = new Map();
    const cell = (p: V3): string => `${Math.floor(p[0] / 2)},${Math.floor(p[1] / 2)},${Math.floor(p[2] / 2)}`;
    for (const q of scalp) {
      const k: string = cell(q);
      const list: V3[] | undefined = cells.get(k);
      if (list === undefined) cells.set(k, [q]);
      else list.push(q);
    }
    const meets = (p: V3): boolean => {
      for (let a: number = -1; a <= 1; a++)
        for (let b: number = -1; b <= 1; b++)
          for (let d: number = -1; d <= 1; d++)
            for (const q of cells.get(`${Math.floor(p[0] / 2) + a},${Math.floor(p[1] / 2) + b},${Math.floor(p[2] / 2) + d}`) ?? [])
              if (A.dist(p, q) < 2) return true;
      return false;
    };
    let back: number = -Infinity;
    let obs: number = Infinity;
    const middle: number = (sa[1] + sba[1]) / 2;
    for (const p of plate) {
      const s: number = A.dot(p, w);
      back = Math.max(back, s);
      if (p[1] > middle && s < obs && meets(p)) obs = s;
    }
    const H: number = sa[1] - sba[1];
    let tragion: V3 = nan;
    for (const p of plate)
      if (p[1] > sba[1] + H / 3 && p[1] < sa[1] - H / 3 && (Number.isNaN(tragion[0]) || p[0] > tragion[0])) tragion = p;
    // Protrusion, in the horizontal section at the tragion's level: the helix
    // rim, the plate's most lateral point there, from the nearest section
    // point behind the whole auricle, the mastoid skin a ruler rests on.
    const level: V3[] = plate.filter((p: V3): boolean => Math.abs(p[1] - tragion[1]) <= 1);
    let rim: V3 = level[0] ?? nan;
    for (const p of level) if (Math.abs(p[2]) > Math.abs(rim[2])) rim = p;
    const cut: V3[] = A.polylines(skin, [0, tragion[1], 0], [0, 1, 0], band(skin, tragion[1] - 1, tragion[1] + 1))
      .flatMap((l: ILine): V3[] => resample(l.points, 0.5))
      .filter((q: V3): boolean => Math.sign(q[2]) === -inward && A.dist(q, tragion) < 60);
    const onPlate: boolean[] = cut.map((q: V3): boolean => level.some((p: V3): boolean => A.dist(p, q) < 1.5));
    let rear: number = Infinity;
    cut.forEach((q: V3, i: number): void => {
      if (onPlate[i]) rear = Math.min(rear, q[0]);
    });
    let protrusion: number = Infinity;
    cut.forEach((q: V3, i: number): void => {
      if (!onPlate[i] && q[0] < rear) protrusion = Math.min(protrusion, A.dist(rim, q));
    });
    if (!Number.isFinite(protrusion)) protrusion = NaN;
    return {
      superaurale: sa,
      subaurale: sba,
      tragion,
      length: A.dist(sa, sba),
      breadth: back - obs,
      protrusion,
      inclination: (Math.atan2(sa[0] - sba[0], sa[1] - sba[1]) * -180) / Math.PI,
      points: plate,
    };
  }

  /**
   * Subnasale on a median profile sampled every 0.5 mm, the apex of the
   * nasolabial angle: walking from pronasale toward the lips, the sharpest
   * concave turn over 2 mm of arc before the deepest point the walk reaches ere
   * the profile comes forward again by 1.5 mm onto the upper lip. That hollow
   * bounds the search, so the labial fissure beyond it never competes.
   *
   * @param step +1 or -1, the index direction from pronasale toward the lips.
   */
  export function subnasale(line: V3[], prn: number, step: 1 | -1): number {
    let deepest: number = prn;
    for (let i: number = prn; i >= 0 && i < line.length; i += step) {
      if (line[i]![0] < line[deepest]![0]) deepest = i;
      else if (line[i]![0] > line[deepest]![0] + 1.5) break;
    }
    // Walking toward the lips (down), the body lies on the walker's right, so a
    // concave corner turns left: a positive cross product.
    const turn = (i: number): number => {
      const a: V3 = line[i - 4 * step]!;
      const b: V3 = line[i]!;
      const c: V3 = line[i + 4 * step]!;
      const t1: [number, number] = [b[0] - a[0], b[1] - a[1]];
      const t2: [number, number] = [c[0] - b[0], c[1] - b[1]];
      return Math.atan2(t1[0] * t2[1] - t1[1] * t2[0], t1[0] * t2[0] + t1[1] * t2[1]);
    };
    let best: number = deepest;
    let sharpest: number = -Infinity;
    for (let i: number = prn + 4 * step; step * (i - deepest) <= 0; i += step) {
      if (i - 4 < 0 || i + 4 >= line.length) continue;
      const t: number = turn(i);
      if (t > sharpest) {
        sharpest = t;
        best = i;
      }
    }
    return best;
  }

  /** Tooth points no skin hides from the front: rays forward from each meet no skin. */
  export function teeth(skin: HumanAnatomy.ISkin, lo: number, hi: number): number {
    const person: HumanPeople.IRigged = HumanPeople.rigged(skin.name);
    const mouth = person.body.mouth;
    const aperture = person.body.apertures.find((a): boolean => a.name === "mouth");
    if (mouth === undefined || aperture === undefined) return NaN;
    const surface: AutoMovieHumanBodySurface.IOutput = AutoMovieHumanBodySurface.generate(person.body, []);
    let interior: AutoMovieHumanOralCavity.IOutput;
    try {
      interior = AutoMovieHumanOralCavity.generate(surface.mesh, mouth, aperture, 1);
    } catch {
      // A mouth whose interior cannot be built shows nothing to count; the row
      // then fails as unmeasured instead of hiding the head's other rows.
      return NaN;
    }
    let seen: number = 0;
    for (const part of interior.parts) {
      if (part.geometry.type !== "mesh" || !/tooth|teeth|incisor|molar/i.test(part.id)) continue;
      const P: number[] = part.geometry.mesh.positions;
      for (let v: number = 0; v < P.length; v += 3) {
        const p: V3 = [P[v]!, P[v + 1]!, P[v + 2]!];
        if (p[1] < lo || p[1] > hi) continue;
        if (A.ray(skin, p, 0, 1).crossings === 0) seen++;
      }
    }
    return seen;
  }
}

/** Mean of points. */
function centre(l: V3[]): V3 {
  return A.scale(l.reduce((s: V3, p: V3): V3 => A.add(s, p), [0, 0, 0]), 1 / l.length);
}

/** The farthest pair of points. */
function diameter(l: V3[]): [V3, V3] {
  let best: [V3, V3] = [l[0]!, l[0]!];
  for (const a of l) for (const b of l) if (A.dist(a, b) > A.dist(best[0], best[1])) best = [a, b];
  return best;
}

/** Length of a pair's segment. */
function span(pair: [V3, V3]): number {
  return A.dist(pair[0], pair[1]);
}

/** A point's identity among a skin's vertices. */
function key(p: V3): string {
  return `${p[0]},${p[1]},${p[2]}`;
}

/** Vertex normals, once per skin. */
function vertexNormalsOf(skin: HumanAnatomy.ISkin): Float64Array {
  let found: Float64Array | undefined = normalCache.get(skin);
  if (found === undefined) {
    found = A.vertexNormals(skin);
    normalCache.set(skin, found);
  }
  return found;
}

const normalCache: WeakMap<HumanAnatomy.ISkin, Float64Array> = new WeakMap();
