import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanAnatomy } from "./HumanAnatomy";
import type { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanAnatomyShared } from "./HumanAnatomyShared";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
type ISubject = HumanAnatomyAudit.ISubject;
type ITrunk = HumanAnatomyShared.ITrunk;
type INeck = HumanAnatomyShared.INeck;
const A = HumanAnatomy;
const { LARGE, SMALL, CREASE, identity, ratio, extent, extraTurns, trunkCut, curveCrease, spineX, band, trunks, symmetry } = HumanAnatomyShared;

/** The trunk audit: its sites, located on a subject's skin by their published definitions, and their rows. */
export namespace HumanAnatomyTrunk {
  /**
   * ANSUR II chest height over stature: each sex's mean plus and minus 2.326
   * SD, the union of both sexes, from the public working databases.
   */
  export const CHEST_HEIGHT: readonly [number, number] = [0.6867, 0.7596];

  /** ANSUR II buttock height over stature, both sexes' mean plus and minus 2.326 SD. */
  export const BUTTOCK_HEIGHT: readonly [number, number] = [0.4672, 0.5482];

  /** ANSUR II suprasternale height over stature, both sexes' mean plus and minus 2.326 SD. */
  export const SUPRASTERNALE_HEIGHT: readonly [number, number] = [0.7999, 0.8355];

  /** ANSUR II cervicale height over stature, both sexes' mean plus and minus 2.326 SD. */
  export const CERVICALE_HEIGHT: readonly [number, number] = [0.8411, 0.8793];

  /** ANSUR II neck base circumference over neck circumference, both sexes' mean plus and minus 2.326 SD. */
  export const NECK_BASE_RATIO: readonly [number, number] = [1.0338, 1.1994];

  /**
   * The trunk and neck: tapes at their ISO 8559-1 and ANSUR II sites, the
   * trunk's sections and landmark heights against ANSUR II, the neck's girth
   * profile, the back's sagittal curves and, for a constructed figure, its
   * mirror symmetry.
   */
  export function trunk(subject: ISubject, at?: ILocators): IRow[] {
    const name: string = subject.name;
    const rows: IRow[] = [];
    const p: IAutoMovieHumanParameters = subject.params;
    const c = p.body.controls;
    const skin: HumanAnatomy.ISkin = subject.bind();
    const S: number = c.height.value!;
    const t: ITrunk = trunkSites(skin, S);
    const tape = (site: string, value: number, input: number | null, tol: number): void => {
      if (input !== null) rows.push(identity(name, site, value, input, tol));
    };
    tape("chest girth at the bust point, mm", t.chest.girth, c.chest.value, LARGE);
    tape("underbust girth at the inframammary fold, mm", t.underbust.girth, c.underbust.value, LARGE);
    tape("waist girth, natural (least) waist, mm", t.waist.girth, c.waist.value, LARGE);
    tape("high hip girth, midway waist to hip, mm", t.highHip.girth, c.highHip.value, LARGE);
    tape("hip girth at the buttock prominence, mm", t.hip.girth, c.hip.value, LARGE);
    const neck: INeck = neckSites(skin, S, at);
    tape("neck girth, least girth across the neck axis, mm", neck.neck, c.neck.value, SMALL);
    tape("neck base girth along the neck's base, over the jugular notch, side neck points and nape, mm", neck.base, c.neckBase.value, SMALL);

    // ANSUR II shape ratios: mean +- 2.33 SD over both sexes.
    rows.push(ratio(name, "chest depth / breadth at the bust point", extent(t.chest.points, 0) / extent(t.chest.points, 2), 0.702, 1.095));
    rows.push(ratio(name, "waist depth / breadth", extent(t.waist.points, 0) / extent(t.waist.points, 2), 0.576, 0.853));
    rows.push(ratio(name, "buttock depth / hip breadth", extent(t.hip.points, 0) / extent(t.hip.points, 2), 0.548, 0.827));
    rows.push(ratio(name, "crotch height / stature", t.crotch / S, 0.445, 0.515));
    rows.push(ratio(name, "chest point height / stature", t.heights.chest / S, CHEST_HEIGHT[0], CHEST_HEIGHT[1]));
    rows.push(ratio(name, "buttock height / stature", t.heights.hip / S, BUTTOCK_HEIGHT[0], BUTTOCK_HEIGHT[1]));
    rows.push(ratio(name, "cervicale height / stature", neck.cervicale / S, CERVICALE_HEIGHT[0], CERVICALE_HEIGHT[1]));
    rows.push(ratio(name, "neck base girth / neck girth", neck.base / neck.neck, NECK_BASE_RATIO[0], NECK_BASE_RATIO[1]));

    // The neck's girth falls from its base to one least girth and rises to the
    // jaw: one turn, no step.
    rows.push({
      person: name,
      site: "neck girth profile, base to jaw: extra turns deeper than a small-girth error",
      value: extraTurns(neck.profile, SMALL),
      low: 0,
      high: 0,
      unit: "turns",
    });
    rows.push({
      person: name,
      site: "neck skin: deepest crease across the neck, sagitta over a 10 mm chord past a 12.5 mm radius, mm",
      value: neck.crease,
      low: 0,
      high: CREASE,
      unit: "mm",
    });

    // The vertebral column's lumbar curve is convex forward and its thoracic
    // curve concave forward (Gray 1918), and the back's median skin follows
    // the spinous processes.
    const back: ISpine = spine(skin, t, neck);
    rows.push({
      person: name,
      site: "back median profile: lumbar apex in front of the chord from the sacrum to the thoracic apex (lordosis), positive, mm",
      value: back.lordosis,
      low: Number.MIN_VALUE,
      high: Infinity,
      unit: "mm",
    });
    rows.push({
      person: name,
      site: "back median profile: thoracic apex behind the chord from the lumbar apex to cervicale (kyphosis), positive, mm",
      value: back.kyphosis,
      low: Number.MIN_VALUE,
      high: Infinity,
      unit: "mm",
    });

    // Mirror symmetry holds by construction, not by anatomy: a real body's two
    // sides differ.
    if (subject.construction) rows.push(...symmetry(name, skin, /^(trunk|upper|head\.lower|leg)/, "trunk, neck and legs"));
    return rows;
  }

  /**
   * Locate the trunk's sites by their ISO 8559-1 and ANSUR II definitions. A
   * site the skin does not carry reads as an empty section with a NaN girth.
   */
  export function trunkSites(skin: HumanAnatomy.ISkin, S: number): ITrunk {
    const found: ITrunk | undefined = trunks.get(skin);
    if (found !== undefined) return found;
    let vertex: number = -Infinity;
    for (let v: number = 1; v < skin.P.length; v += 3) vertex = Math.max(vertex, skin.P[v]!);
    // Crotch: the lowest midline skin between the legs, above the knees.
    const hip: V3 = A.joint(skin, "hips");
    let crotch: number = Infinity;
    for (const line of A.polylines(skin, A.MEDIAN, [0, 0, 1], band(skin, 0.3 * S, hip[1])))
      for (const p of line.points) if (p[1] > 0.3 * S && p[1] < hip[1]) crotch = Math.min(crotch, p[1]);
    if (!Number.isFinite(crotch)) crotch = NaN;
    // A section the trunk's spine line does not lie inside is a stray piece of
    // skin, not the trunk's tape.
    const at = (y: number): HumanAnatomy.ICut | null => {
      const c: HumanAnatomy.ICut | null = trunkCut(skin, y);
      return c !== null && c.contained ? c : null;
    };
    const scan = (lo: number, hi: number, f: (c: HumanAnatomy.ICut) => number): IStation[] => {
      const out: IStation[] = [];
      for (let y: number = lo; y <= hi; y += 2) {
        const c: HumanAnatomy.ICut | null = at(y);
        out.push({ y, v: c === null ? NaN : f(c) });
      }
      return out;
    };
    // Axilla: the lowest height where the trunk's section takes in the arms'
    // roots, its breadth jumping by more than 30 mm in 2 mm.
    let axilla: number = 0.76 * S;
    let previous: number = NaN;
    for (let y: number = 0.66 * S; y <= 0.86 * S; y += 2) {
      const c: HumanAnatomy.ICut | null = trunkCut(skin, y);
      const w: number = c === null ? NaN : extent(c.points, 2);
      if (w - previous > 30) {
        axilla = y - 2;
        break;
      }
      previous = w;
    }
    // Natural waist: least girth from 0.56 S to 0.70 S. ISO 8559-1 sets the
    // waist level midway between the lowest rib and the iliac crest, landmarks
    // the skin does not carry; ANSUR II places iliocristale at 0.605-0.611 S
    // and the tenth rib at 0.638-0.649 S, and the band is widened past the
    // 13-26 mm residual of landmark heights.
    const waistY: number = least(scan(0.56 * S, 0.7 * S, (c: HumanAnatomy.ICut): number => c.girth));
    // Bust point: the most anterior point of the bust or chest (ISO 8559-1,
    // ANSUR II), the first forward prominence of the trunk's front below the
    // axilla. The abdomen below may stand further forward, so the global
    // maximum is not the bust; a front that only rises toward the abdomen has
    // no bust point.
    const fronts: IStation[] = scan(waistY + 2, axilla - 2, (c: HumanAnatomy.ICut): number =>
      Math.max(...c.points.map((p: V3): number => p[0])),
    ).reverse();
    let chestY: number = NaN;
    for (let i: number = 0; i + 1 < fronts.length; i++) {
      const v: number = fronts[i]!.v;
      const above: number = i === 0 ? -Infinity : fronts[i - 1]!.v;
      const below: number = fronts[i + 1]!.v;
      if (Number.isFinite(v) && !(v < above) && v > below) {
        chestY = fronts[i]!.y;
        break;
      }
    }
    const chest: HumanAnatomy.ICut = cutOrEmpty(at(chestY));
    // Inframammary fold: ISO 8559-1's under-bust level, directly below the
    // breast. In the sagittal plane through the bust point the breast's
    // underside falls back to the chest wall, which then runs down to the
    // abdomen: the fold is that profile's most posterior point between the
    // bust point and the natural waist.
    let foldY: number = NaN;
    if (chest.points.length > 0) {
      const bust: V3 = chest.points.reduce((a: V3, b: V3): V3 => (b[0] > a[0] ? b : a));
      const profile: IStation[] = sagittal(skin, bust[2], waistY + 2, chestY - 4);
      foldY = least(profile);
    }
    const underbust: HumanAnatomy.ICut = cutOrEmpty(at(foldY));
    const waist: HumanAnatomy.ICut = cutOrEmpty(at(waistY));
    // Hip: the buttocks' most posterior point between the crotch and the waist.
    const back: IStation[] = scan(Number.isFinite(crotch) ? crotch + 4 : 0.4 * S, waistY, (c: HumanAnatomy.ICut): number =>
      Math.min(...c.points.map((p: V3): number => p[0])),
    );
    const hipY: number = least(back);
    const hipCut: HumanAnatomy.ICut = cutOrEmpty(at(hipY));
    const highHip: HumanAnatomy.ICut = cutOrEmpty(at((waistY + hipY) / 2));
    const out: ITrunk = {
      vertex,
      crotch,
      chest,
      underbust,
      waist,
      highHip,
      hip: hipCut,
      heights: { chest: chestY, underbust: foldY, waist: waistY, hip: hipY, axilla },
    };
    trunks.set(skin, out);
    return out;
  }

  /**
   * The neck's base line of the last {@link neckSites} reading of a skin: a
   * point on each of 24 meridians in turn round the neck's axis, null where a
   * meridian has none.
   */
  export const lines: WeakMap<HumanAnatomy.ISkin, (V3 | null)[]> = new WeakMap();

  /**
   * Where the neck's landmarks were found on one reading of a skin, so that an
   * edited copy of it can be read at the same places: a made defect then
   * moves the reading, not the site.
   */
  export interface ILocators {
    /** Each meridian's base-line station along the neck's axis from the neck joint, mm; null where it has none. */
    stations: (number | null)[];

    /** Height of suprasternale, mm. */
    notch: number;

    /** Height of cervicale, mm. */
    cervicale: number;
  }

  /** The locators of the last {@link neckSites} reading of each skin. */
  export const located: WeakMap<HumanAnatomy.ISkin, ILocators> = new WeakMap();

  /**
   * Locate the neck's sites: ISO 8559-1 neck girth and neck base girth, and
   * suprasternale and cervicale.
   *
   * @param at Locators found on another reading of the same body; when given,
   *   the base line, suprasternale and cervicale are read there instead of
   *   being found again.
   */
  export function neckSites(skin: HumanAnatomy.ISkin, S: number, at?: ILocators): INeck {
    const base: V3 = A.joint(skin, "neck");
    const top: V3 = A.joint(skin, "head");
    const axis: V3 = A.unit(A.sub(top, base));
    const length: number = A.dist(base, top);
    const region: Uint32Array = A.near(skin, A.sub(base, A.scale(axis, 0.05 * S)), top, 0.12 * S);
    const girths: number[] = [];
    let least: number = Infinity;
    let middle: number = length / 2;
    for (let s: number = 0; s <= length; s += 2) {
      const o: V3 = A.add(base, A.scale(axis, s));
      const c: HumanAnatomy.ICut | null = A.cut(skin, o, axis, o, region);
      const g: number = c === null ? NaN : c.girth;
      girths.push(g);
      if (g < least) {
        least = g;
        middle = s;
      }
    }
    // The jaw: past the least girth, the first station whose girth stands a
    // small-girth error above it, where the section begins to take in the skin
    // under the chin. The neck's profile and creases end there; beyond it the
    // section is the face's.
    let jaw: number = length;
    for (let k: number = Math.round(middle / 2); k < girths.length; k++)
      if (girths[k]! > least + SMALL) {
        jaw = 2 * (k - 1);
        break;
      }
    const profile: number[] = girths.slice(0, Math.floor(jaw / 2) + 1);
    // Suprasternale: the most concave point of the front midline profile
    // within its ANSUR II height band.
    let notch: number = NaN;
    if (at !== undefined) notch = at.notch;
    else {
      const mid = A.polylines(skin, A.MEDIAN, [0, 0, 1], band(skin, SUPRASTERNALE_HEIGHT[0] * S - 20, SUPRASTERNALE_HEIGHT[1] * S + 20));
      const frontAt = (y: number): number => side(mid, y, spineX(skin, y), 1);
      let best: number = -Infinity;
      for (let y: number = SUPRASTERNALE_HEIGHT[0] * S; y <= SUPRASTERNALE_HEIGHT[1] * S; y += 2) {
        const c: number = frontAt(y - 8) + frontAt(y + 8) - 2 * frontAt(y);
        if (c > best) {
          best = c;
          notch = y;
        }
      }
    }
    // Creases across the neck: the skin's curve in twelve planes through the
    // neck's axis (24 meridians), from the shoulders to the jaw.
    //
    // The base of the neck on each meridian: where the neck's skin turns into
    // the trunk's, the meridian's most concave point below the least girth,
    // read over a 40 mm chord so that a fold or ring narrower than the turn
    // from trunk to neck does not stand in for it. The line through these
    // points runs over the jugular notch in front, the side neck points where
    // the neck meets the trapezius, and the nape's junction with the back, as
    // ISO 8559-1's neck base tape does over the front neck point, the side
    // neck points and cervicale. The search stays on the neck: within one and
    // a half times the least girth's mean radius of the axis, short of the
    // clavicles, the shoulders' tops and the chest.
    const reach: number = (0.75 * least) / Math.PI;
    const [u, w] = A.basis(axis);
    let crease: number = 0;
    const foot: (V3 | null)[] = new Array<V3 | null>(24).fill(null);
    const span: number[] = new Array<number>(24).fill(0);
    const meridian: V3[][] = Array.from({ length: 24 }, (): V3[] => []);
    const dirs: V3[] = [];
    for (let k: number = 0; k < 12; k++) {
      const dir: V3 = A.add(A.scale(u, Math.cos((k * Math.PI) / 12)), A.scale(w, Math.sin((k * Math.PI) / 12)));
      dirs[k] = dir;
      dirs[k + 12] = A.scale(dir, -1);
      const plane: V3 = A.unit(A.cross(axis, dir));
      for (const line of A.polylines(skin, A.add(base, A.scale(plane, 1e-3)), plane, region))
        for (const sign of [1, -1]) {
          // The meridian on one side of the axis, between the neck's base station
          // and the jaw, split where it leaves that span.
          const key: number = sign > 0 ? k : k + 12;
          let run: V3[] = [];
          const flush = (): void => {
            if (run.length > 10) {
              crease = Math.max(crease, curveCrease(run, base, axis));
              const below: V3[] = run.filter((p: V3): boolean => {
                const q: V3 = A.sub(p, base);
                return A.dot(q, axis) < middle && Math.hypot(...A.reject(q, axis)) <= reach;
              });
              if (below.length > span[key]!) {
                span[key] = below.length;
                foot[key] = deepest(below, base, axis);
                meridian[key] = run;
              }
            }
            run = [];
          };
          for (const p of line.points) {
            const q: V3 = A.sub(p, base);
            const s: number = A.dot(q, axis);
            if (sign * A.dot(q, dir) > 0 && s > -0.04 * S && s < jaw) run.push(p);
            else flush();
          }
          flush();
        }
    }
    // Sites located on another reading of this body are read again at the same
    // stations along the axis, each on its own meridian.
    if (at !== undefined)
      for (let k: number = 0; k < 24; k++) foot[k] = at.stations[k] === null ? null : station(meridian[k]!, base, axis, at.stations[k]!);
    lines.set(skin, foot);
    // Cervicale: where the base line crosses the back median line, the nape's
    // junction with the back; ISO 8559-1's neck base tape passes over it.
    let back: number = 0;
    for (let k: number = 1; k < 24; k++) if (dirs[k]![0] < dirs[back]![0]) back = k;
    const c7: number = at !== undefined ? at.cervicale : (foot[back]?.[1] ?? NaN);
    located.set(skin, {
      stations: foot.map((p: V3 | null): number | null => (p === null ? null : A.dot(A.sub(p, base), axis))),
      notch,
      cervicale: c7,
    });
    // The tape drawn taut over these points: the perimeter of their convex hull
    // in their least-squares plane. A taut tape bridges a meridian whose
    // concave point dips below its neighbours, and one without a concave
    // point; a line missing a quarter of its meridians is not read.
    const found: V3[] = foot.filter((p: V3 | null): p is V3 => p !== null);
    let baseGirth: number = NaN;
    if (found.length >= 18) {
      const o: V3 = found.reduce((a: V3, b: V3): V3 => A.add(a, A.scale(b, 1 / found.length)), [0, 0, 0]);
      const n: V3 = flattest(found.map((p: V3): V3 => A.sub(p, o)));
      const [bu, bw] = A.basis(n);
      baseGirth = A.hull(found.map((p: V3): [number, number] => [A.dot(A.sub(p, o), bu), A.dot(A.sub(p, o), bw)]));
    }
    return { neck: least, base: baseGirth, profile, crease, notch, cervicale: c7 };
  }

  /** The back's sagittal curves on its median skin, mm. */
  export interface ISpine {
    /** Lumbar apex in front of the chord from the sacral apex to the thoracic apex. */
    lordosis: number;

    /** Thoracic apex behind the chord from the lumbar apex to cervicale. */
    kyphosis: number;

    /** Heights of the sacral, lumbar and thoracic apices and of cervicale. */
    heights: { sacral: number; lumbar: number; thoracic: number; cervicale: number };
  }

  /**
   * The back's median profile from the buttock level to cervicale: its
   * thoracic apex, the most posterior point above the natural waist; its
   * lumbar apex, the most anterior point below that; and its sacral apex, the
   * most posterior point below the lumbar apex.
   */
  export function spine(skin: HumanAnatomy.ISkin, t: ITrunk, neck: INeck): ISpine {
    const lo: number = t.heights.hip;
    const hi: number = neck.cervicale;
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || !Number.isFinite(t.heights.waist))
      return { lordosis: NaN, kyphosis: NaN, heights: { sacral: NaN, lumbar: NaN, thoracic: NaN, cervicale: NaN } };
    const mid = A.polylines(skin, A.MEDIAN, [0, 0, 1], band(skin, lo - 10, hi + 10));
    const profile: IStation[] = [];
    for (let y: number = lo; y <= hi; y += 2) profile.push({ y, v: side(mid, y, spineX(skin, y), -1) });
    const within = (a: number, b: number): IStation[] => profile.filter((s: IStation): boolean => s.y >= a && s.y <= b);
    const thoracic: number = least(within(t.heights.waist, hi));
    const lumbar: number = least(within(lo, thoracic).map((s: IStation): IStation => ({ y: s.y, v: -s.v })));
    const sacral: number = least(within(lo, lumbar));
    const x = (y: number): number => profile.find((s: IStation): boolean => s.y === y)?.v ?? NaN;
    const chord = (a: number, b: number, y: number): number => x(a) + ((x(b) - x(a)) * (y - a)) / (b - a);
    const cervicale: number = profile[profile.length - 1]!.y;
    // An apex at an end of its span is no curve: its sagitta reads zero.
    return {
      lordosis: x(lumbar) - chord(sacral, thoracic, lumbar),
      kyphosis: chord(lumbar, cervicale, thoracic) - x(thoracic),
      heights: { sacral, lumbar, thoracic, cervicale },
    };
  }
}

/** One height of a scan and its reading; NaN where the section is missing. */
interface IStation {
  y: number;
  v: number;
}

/** The height of a scan's least finite reading; NaN when none is finite. */
function least(stations: IStation[]): number {
  let y: number = NaN;
  let v: number = Infinity;
  for (const s of stations)
    if (Number.isFinite(s.v) && s.v < v) {
      v = s.v;
      y = s.y;
    }
  return y;
}

/**
 * The skin point of a meridian at a station along an axis, interpolated
 * between the meridian's points either side of it; null when the meridian
 * does not reach it.
 */
function station(curve: V3[], origin: V3, axis: V3, s: number): V3 | null {
  for (let i: number = 0; i + 1 < curve.length; i++) {
    const a: number = A.dot(A.sub(curve[i]!, origin), axis) - s;
    const b: number = A.dot(A.sub(curve[i + 1]!, origin), axis) - s;
    if (a === 0) return curve[i]!;
    if (a < 0 !== b < 0) return A.lerp(curve[i]!, curve[i + 1]!, a / (a - b));
  }
  return null;
}

/**
 * The most concave point of a planar skin curve about an axis: the point
 * lying deepest inside the chord of its neighbours 20 mm of arc either side,
 * inside meaning toward the axis; null when no point lies inside its chord.
 */
function deepest(curve: V3[], origin: V3, axis: V3): V3 | null {
  const line: V3[] = HumanAnatomyShared.resample(curve, 1);
  const depth = (p: V3): number => A.dist(p, A.add(origin, A.scale(axis, A.dot(A.sub(p, origin), axis))));
  let best: number = 0;
  let at: V3 | null = null;
  for (let i: number = 20; i + 20 < line.length; i++) {
    const m: V3 = line[i]!;
    const chord: V3 = A.lerp(line[i - 20]!, line[i + 20]!, 0.5);
    const sag: number = A.dist(m, chord) * (depth(m) < depth(chord) ? 1 : -1);
    if (sag > best) {
      best = sag;
      at = m;
    }
  }
  return at;
}

/**
 * Normal of the least-squares plane through centred points: the covariance's
 * eigenvector of least eigenvalue, by inverse iteration.
 */
function flattest(points: V3[]): V3 {
  const c: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (const p of points)
    for (let i: number = 0; i < 3; i++) for (let j: number = 0; j < 3; j++) c[i]![j] = c[i]![j]! + p[i]! * p[j]!;
  const det = (m: number[][]): number =>
    m[0]![0]! * (m[1]![1]! * m[2]![2]! - m[1]![2]! * m[2]![1]!) -
    m[0]![1]! * (m[1]![0]! * m[2]![2]! - m[1]![2]! * m[2]![0]!) +
    m[0]![2]! * (m[1]![0]! * m[2]![1]! - m[1]![1]! * m[2]![0]!);
  const d: number = det(c);
  let x: V3 = [0, 1, 0];
  if (d === 0) return x;
  for (let k: number = 0; k < 30; k++) {
    // Cramer's rule for c y = x.
    const y: V3 = [0, 0, 0];
    for (let i: number = 0; i < 3; i++) {
      const m: number[][] = c.map((row: number[]): number[] => [...row]);
      for (let r: number = 0; r < 3; r++) m[r]![i] = x[r]!;
      y[i] = det(m) / d;
    }
    x = A.unit(y);
  }
  return x;
}

/** A section, or an empty one with a NaN girth when the site was not found. */
function cutOrEmpty(c: HumanAnatomy.ICut | null): HumanAnatomy.ICut {
  return c ?? { girth: NaN, area: NaN, points: [], contained: false, outside: NaN };
}

/**
 * The front (+1) or back (-1) of a sagittal profile at a height: the most
 * anterior crossing in front of the spine line or the most posterior behind
 * it; NaN when the plane holds none.
 */
function side(lines: { points: V3[] }[], y: number, spine: number, sign: 1 | -1): number {
  let out: number = NaN;
  for (const l of lines)
    for (let i: number = 0; i + 1 < l.points.length; i++) {
      const a: V3 = l.points[i]!;
      const b: V3 = l.points[i + 1]!;
      if (a[1] >= y === b[1] >= y) continue;
      const x: number = a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]);
      if (sign * (x - spine) <= 0) continue;
      if (Number.isNaN(out) || sign * x > sign * out) out = x;
    }
  return out;
}

/**
 * The forward extent of the trunk's front in the sagittal plane at a lateral
 * offset, every 2 mm from one height to another, the arms left out.
 */
function sagittal(skin: HumanAnatomy.ISkin, z: number, lo: number, hi: number): IStation[] {
  const arm: boolean[] = skin.chains.map((c: string): boolean => /^(arm|thumb|hand|finger)/.test(c));
  const tris: Uint32Array = band(skin, lo - 10, hi + 10).filter((t: number): boolean => !arm[skin.tri[t]!]);
  const lines = A.polylines(skin, [0, 0, z], [0, 0, 1], tris);
  const out: IStation[] = [];
  for (let y: number = lo; y <= hi; y += 2) out.push({ y, v: side(lines, y, spineX(skin, y), 1) });
  return out;
}
