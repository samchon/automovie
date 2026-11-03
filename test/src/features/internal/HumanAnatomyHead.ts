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
const A = HumanAnatomy;
const { SIDES, SMALL, HEAD, identity, ratio, band, resample } = HumanAnatomyShared;

/** The head audit: its sites, located on a subject's skin by their published definitions, and their rows. */
export namespace HumanAnatomyHead {
  /**
   * The head and face: head and face dimensions at their Farkas, FaceBase and
   * ISO 7250-1 landmarks, the closed mouth, and population proportions.
   */
  export function head(subject: ISubject): IRow[] {
    const name: string = subject.name;
    const rows: IRow[] = [];
    const p: IAutoMovieHumanParameters = subject.params;
    const skin: HumanAnatomy.ISkin = subject.bind();
    const S: number = p.body.controls.height.value!;
    const f: IFace = faceSites(skin, S, subject.mouth);
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
    rows.push({ person: name, site: "lips at rest: gap between the lips at the midline, mm", value: f.lipGap, low: 0, high: HEAD, unit: "mm" });
    rows.push({ person: name, site: "lips at rest: widest gap along the middle half of the mouth, mm", value: f.mouthGap, low: 0, high: HEAD, unit: "mm" });
    if (subject.mouth) rows.push({ person: name, site: "teeth at rest: tooth points seen from the front", value: f.teethSeen, low: 0, high: 0, unit: "points" });
    rows.push(ratio(name, "nasolabial angle, deg", f.nasolabial, 83.4, 120.6));
    rows.push(ratio(name, "lower face height sn-gn / n-gn", f.lowerFace, 0.441, 0.694));
    rows.push(ratio(name, "upper lip height sn-sto / n-gn", f.upperLip, 0.12, 0.232));
    return rows;
  }

  /** Locate the face's landmarks by their Farkas and FaceBase definitions. */
  export function faceSites(skin: HumanAnatomy.ISkin, S: number, mouth: boolean): IFace {
    // Openings: the mouth spans the midline lowest, the eyes are the two highest
    // off it.
    const loops: V3[][] = A.openings(skin);
    const centre = (l: V3[]): V3 => A.scale(l.reduce((s: V3, p: V3): V3 => A.add(s, p), [0, 0, 0]), 1 / l.length);
    const mouthLoop: V3[] | undefined = loops
      .filter((l: V3[]): boolean => Math.min(...l.map((p: V3): number => p[2])) < 0 && Math.max(...l.map((p: V3): number => p[2])) > 0)
      .sort((a: V3[], b: V3[]): number => centre(a)[1] - centre(b)[1])[0];
    const eyes: V3[][] = loops
      .filter((l: V3[]): boolean => Math.abs(centre(l)[2]) > 15)
      .sort((a: V3[], b: V3[]): number => centre(b)[1] - centre(a)[1])
      .slice(0, 2);
    const lines = A.polylines(skin, A.MEDIAN, [0, 0, 1], band(skin, 0.78 * S, S + 10));
    // Walk the median profile from the vertex forward and down the face. An
    // opening of the mouth across the midline ends that walk at the upper lip;
    // the walk then resumes from the lower lip's end of the nearest other curve.
    let top: V3 = [0, -Infinity, 0];
    let topLine: { points: V3[]; closed: boolean } = lines[0]!;
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
    const walk = (line: { points: V3[]; closed: boolean }, start: number, dir: 1 | -1): { points: V3[]; open: boolean } => {
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
    const forward: 1 | -1 =
      tp[(topIdx + 1) % tp.length]![0] > tp[(topIdx - 1 + tp.length) % tp.length]![0] ? 1 : -1;
    const down = walk(topLine, topIdx, forward);
    let up: V3[];
    let lo: V3[];
    let eUp: V3;
    let eLo: V3;
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
      up = [...upper].reverse();
      lo = resample(lowerLine.filter((p: V3): boolean => p[1] > floor), 0.5);
      eUp = upper[upper.length - 1]!;
      eLo = lo[0] ?? eUp;
    } else {
      // The lips meet on the midline: stomion is the labial fissure's crease,
      // the sharpest notch (the profile behind the chord of its neighbours 2 mm
      // of arc either side) from 4 to 35 mm below subnasale. The labiomental
      // fold is broad, so it never out-notches the fissure.
      const d: V3[] = resample(down.points, 0.5);
      let p0: number = 0;
      for (let i: number = 0; i < d.length; i++) if (d[i]![0] > d[p0]![0]) p0 = i;
      const s0: number = subnasale(d, p0, 1);
      const notch = (i: number): number => (d[i - 4]![0] + d[i + 4]![0]) / 2 - d[i]![0];
      let st: number = s0 + 8;
      for (let i: number = s0 + 8; i < Math.min(d.length - 4, s0 + 70); i++) if (notch(i) > notch(st)) st = i;
      up = d.slice(0, st + 1).reverse();
      lo = d.slice(st);
      eUp = d[st]!;
      eLo = d[st]!;
    }
    // Upward from the lip: pronasale the most anterior point before the vertex.
    let vertexIdx: number = 0;
    for (let i: number = 0; i < up.length; i++) if (up[i]![1] > up[vertexIdx]![1]) vertexIdx = i;
    let prn: number = 0;
    for (let i: number = 0; i < vertexIdx; i++) if (up[i]![0] > up[prn]![0]) prn = i;
    // Walking up from the lip the body lies behind, on the walker's left, so a
    // concave corner turns right (negative).
    const sn: number = subnasale(up, prn, -1);
    // Labrale superius: the upper lip's most prominent point between stomion
    // and subnasale.
    let ls: number = 0;
    for (let i: number = 0; i < sn; i++) if (up[i]![0] > up[ls]![0]) ls = i;
    // Glabella: the forehead's most prominent point within 45 mm above the eye
    // openings' centre; nasion: the deepest point between it and pronasale.
    const eyeLevel: number = eyes.length === 0 ? up[prn]![1] + 40 : eyes.reduce((s: number, e: V3[]): number => s + centre(e)[1], 0) / eyes.length;
    let g: number = vertexIdx;
    for (let i: number = prn; i < vertexIdx; i++)
      if (up[i]![1] >= eyeLevel && up[i]![1] <= eyeLevel + 45 && (g === vertexIdx || up[i]![0] > up[g]![0])) g = i;
    let n: number = prn;
    for (let i: number = prn; i < g; i++) if (up[i]![0] < up[n]![0]) n = i;
    const glabella: V3 = up[g]!;
    let op: V3 = glabella;
    for (const p of topLine.points) if (p[1] > glabella[1] - 60 && A.dist(p, glabella) > A.dist(op, glabella)) op = p;
    // Downward from the lower lip: labrale inferius the lip's most prominent
    // point in its first 12 mm; gnathion the chin's support point toward the
    // front and down within 60 mm; menton the lowest point within 40 mm past
    // gnathion.
    let li: number = 0;
    for (let i: number = 0; i < Math.min(lo.length, 24); i++) if (lo[i]![0] > lo[li]![0]) li = i;
    let gn: number = li;
    for (let i: number = li; i < Math.min(lo.length, li + 120); i++) if (lo[i]![0] - lo[i]![1] > lo[gn]![0] - lo[gn]![1]) gn = i;
    let me: number = gn;
    for (let i: number = gn; i < Math.min(lo.length, gn + 80); i++) if (lo[i]![1] < lo[me]![1]) me = i;
    const sto: V3 = A.lerp(eUp, eLo, 0.5);
    const diameter = (l: V3[]): [V3, V3] => {
      let best: [V3, V3] = [l[0]!, l[0]!];
      for (const a of l) for (const b of l) if (A.dist(a, b) > A.dist(best[0], best[1])) best = [a, b];
      return best;
    };
    const fissure: Record<"left" | "right", { length: number; height: number }> = {
      left: { length: NaN, height: NaN },
      right: { length: NaN, height: NaN },
    };
    const canthi: Record<"left" | "right", V3> = { left: [NaN, NaN, NaN], right: [NaN, NaN, NaN] };
    for (const eye of eyes) {
      const side: "left" | "right" = centre(eye)[2] > 0 ? "left" : "right";
      const [a, b] = diameter(eye);
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
      canthi[side] = en;
    }
    let mouthWidth: number = NaN;
    let mouthGap: number = 0;
    if (mouthLoop === undefined) {
      // Closed lips: the corners are where the labial fissure's crease ends.
      // Sagittal planes outward from the midline cut the lips; the fissure is
      // the deepest notch within 8 mm of stomion's height, and the crease has
      // ended where that notch sits less than 0.3 mm inside its 4 mm chord.
      let width: number = 0;
      for (const side of [1, -1]) {
        let reach: number = NaN;
        for (let c: number = 0.5; c <= 45; c += 0.5) {
          const near: Uint32Array = band(skin, eUp[1] - 10, eUp[1] + 10);
          let notch: number = 0;
          for (const line of A.polylines(skin, [0, 0, side * c], [0, 0, 1], near)) {
            const pts: V3[] = resample(line.points, 0.5);
            for (let i: number = 4; i + 4 < pts.length; i++) {
              const p: V3 = pts[i]!;
              if (Math.abs(p[1] - eUp[1]) > 8 || p[0] < eUp[0] - 20) continue;
              notch = Math.max(notch, (pts[i - 4]![0] + pts[i + 4]![0]) / 2 - p[0]);
            }
          }
          if (notch < 0.3) break;
          reach = c;
        }
        width += reach;
      }
      mouthWidth = width;
    } else {
      mouthGap = NaN;
      const [a, b] = diameter(mouthLoop);
      mouthWidth = A.dist(a, b);
      mouthGap = 0;
      for (let z: number = -mouthWidth / 4; z <= mouthWidth / 4; z += 0.5) {
        const ys: number[] = mouthLoop.filter((p: V3): boolean => Math.abs(p[2] - z) < 0.5).map((p: V3): number => p[1]);
        if (ys.length >= 2) mouthGap = Math.max(mouthGap, Math.max(...ys) - Math.min(...ys));
      }
    }
    // Ears: the auricle's chains; tragion at the auricle's front, at its middle
    // height, where the tragus stands.
    const ears: V3[] = A.vertices(skin, /^ear\./);
    let earLow: number = Infinity;
    let earTop: number = -Infinity;
    let earFront: number = -Infinity;
    for (const p of ears) {
      earLow = Math.min(earLow, p[1]);
      earTop = Math.max(earTop, p[1]);
      earFront = Math.max(earFront, p[0]);
    }
    const tragion: V3 = [earFront, (earLow + earTop) / 2, 0];
    const headPoints: V3[] = A.vertices(skin, /^head/);
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
    const eyeLow: number = Math.min(...eyes.flatMap((e: V3[]): number[] => e.map((p: V3): number => p[1])));
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
    const ring: HumanAnatomy.ICut | null = A.cut(skin, glabella, across, A.lerp(glabella, op, 0.5), A.triangles(skin, /^head/));
    // Nose width: on horizontal cuts from subnasale up, the last point of each
    // side before the contour's concave turn onto the cheek.
    const snP: V3 = up[sn]!;
    const prnP: V3 = up[prn]!;
    let noseWidth: number = 0;
    for (let y: number = snP[1] - 1; y <= snP[1] + 0.4 * (prnP[1] - snP[1] + 15); y += 0.5) {
      const tris: Uint32Array = band(skin, y - 1, y + 1);
      const parts = A.polylines(skin, [0, y, 0], [0, 1, 0], tris);
      let left: number = NaN;
      let right: number = NaN;
      for (const part of parts) {
        const pts: V3[] = part.points.filter((p: V3): boolean => p[0] > snP[0] - 25 && Math.abs(p[2]) < 35);
        if (pts.length < 10) continue;
        for (const sign of [1, -1]) {
          const half: V3[] = pts.filter((p: V3): boolean => p[2] * sign > 0).sort((a: V3, b: V3): number => sign * (a[2] - b[2]));
          const line: V3[] = resample(half, 0.25);
          let groove: number = -1;
          let deepest: number = 0;
          for (let i: number = 4; i + 4 < line.length; i++) {
            if (Math.abs(line[i]![2]) < 5) continue;
            // Concave corner of the frontal contour: the point sits behind the
            // chord of its neighbours.
            const sag: number = (line[i - 4]![0] + line[i + 4]![0]) / 2 - line[i]![0];
            if (sag > deepest) {
              deepest = sag;
              groove = i;
            }
          }
          if (groove >= 0) {
            const z: number = line[groove]![2];
            if (sign > 0) left = Number.isNaN(left) ? z : Math.max(left, z);
            else right = Number.isNaN(right) ? z : Math.min(right, z);
          }
        }
      }
      if (!Number.isNaN(left) && !Number.isNaN(right)) noseWidth = Math.max(noseWidth, left - right);
    }
    // Teeth seen from the front through the mouth's opening.
    // Skin closed over the mouth hides whatever lies behind it.
    const teethSeen: number = !mouth || mouthLoop === undefined ? 0 : teeth(skin, sto[1] - 40, sto[1] + 40);
    // Nasolabial angle at subnasale: columella tangent against the upper lip's.
    const colum: V3 = A.unit(A.sub(up[Math.min(prn, sn + 10)]!, snP));
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
      intercanthal: A.dist(canthi.left, canthi.right),
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
