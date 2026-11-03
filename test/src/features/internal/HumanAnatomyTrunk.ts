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
   * The trunk and neck: tapes at their ISO 8559-1 and ANSUR II sites, the
   * trunk's sections against ANSUR II shape ratios, the neck's girth profile
   * and the body's mirror symmetry.
   */
  export function trunk(subject: ISubject): IRow[] {
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
    const neck: INeck = neckSites(skin, S, t);
    tape("neck girth, least girth across the neck axis, mm", neck.neck, c.neck.value, SMALL);
    tape("neck base girth over cervicale and suprasternale, mm", neck.base, c.neckBase.value, SMALL);

    // ANSUR II shape ratios: mean +- 2.33 SD over both sexes.
    rows.push(ratio(name, "chest depth / breadth at the bust point", extent(t.chest.points, 0) / extent(t.chest.points, 2), 0.702, 1.095));
    rows.push(ratio(name, "waist depth / breadth", extent(t.waist.points, 0) / extent(t.waist.points, 2), 0.576, 0.853));
    rows.push(ratio(name, "buttock depth / hip breadth", extent(t.hip.points, 0) / extent(t.hip.points, 2), 0.548, 0.827));
    rows.push(ratio(name, "crotch height / stature", t.crotch / S, 0.445, 0.515));

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
    rows.push(...symmetry(name, skin, /^(trunk|upper|head\.lower|leg)/, "trunk, neck and legs"));
    return rows;
  }

  /** Locate the trunk's sites by their ISO 8559-1 and ANSUR II definitions. */
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
    const at = (y: number): HumanAnatomy.ICut | null => trunkCut(skin, y);
    const scan = (lo: number, hi: number, f: (c: HumanAnatomy.ICut) => number): { y: number; v: number }[] => {
      const out: { y: number; v: number }[] = [];
      for (let y: number = lo; y <= hi; y += 2) {
        const c: HumanAnatomy.ICut | null = at(y);
        out.push({ y, v: c === null ? NaN : f(c) });
      }
      return out;
    };
    // Axilla: the lowest height where the trunk's section takes in the arms'
    // roots, its breadth jumping by more than 30 mm in 2 mm.
    const widths = scan(0.66 * S, 0.86 * S, (c: HumanAnatomy.ICut): number => extent(c.points, 2));
    let axilla: number = 0.76 * S;
    for (let i: number = 1; i < widths.length; i++)
      if (widths[i]!.v - widths[i - 1]!.v > 30) {
        axilla = widths[i - 1]!.y;
        break;
      }
    // Bust point: the trunk's most anterior point from ANSUR II's chest height
    // band (0.720-0.735 S, widened to 0.64 S) up to the axilla.
    const front = scan(0.64 * S, axilla, (c: HumanAnatomy.ICut): number => Math.max(...c.points.map((p: V3): number => p[0])));
    const chestY: number = front.reduce((a, b) => (b.v > a.v ? b : a)).y;
    const chest: HumanAnatomy.ICut = at(chestY)!;
    const bust: V3 = chest.points.reduce((a: V3, b: V3): V3 => (b[0] > a[0] ? b : a));
    // Inframammary fold: the most concave point of the profile through the bust
    // point, within 0.12 S below it.
    const profile = scan(chestY - 0.12 * S, chestY, (c: HumanAnatomy.ICut): number => {
      let x: number = -Infinity;
      for (const p of c.points) if (Math.abs(p[2] - bust[2]) < 15) x = Math.max(x, p[0]);
      return x;
    });
    let foldY: number = chestY - 0.05 * S;
    let best: number = -Infinity;
    for (let i: number = 3; i + 3 < profile.length; i++) {
      if (profile[i]!.y > chestY - 10) continue;
      const c: number = profile[i - 3]!.v + profile[i + 3]!.v - 2 * profile[i]!.v;
      if (c > best) {
        best = c;
        foldY = profile[i]!.y;
      }
    }
    const underbust: HumanAnatomy.ICut = at(foldY)!;
    // Natural waist: least girth from 0.56 S to the fold (ANSUR II iliocristale
    // 0.605-0.611 S to tenth rib 0.638-0.649 S, widened past the 13-26 mm
    // residual of landmark heights).
    const girths = scan(0.56 * S, Math.min(0.7 * S, foldY - 10), (c: HumanAnatomy.ICut): number => c.girth);
    const waistY: number = girths.reduce((a, b) => (b.v < a.v ? b : a)).y;
    const waist: HumanAnatomy.ICut = at(waistY)!;
    // Hip: the buttocks' most posterior point between the crotch and the waist.
    const back = scan(crotch + 4, waistY, (c: HumanAnatomy.ICut): number => -Math.min(...c.points.map((p: V3): number => p[0])));
    const hipY: number = back.reduce((a, b) => (b.v > a.v ? b : a)).y;
    const hipCut: HumanAnatomy.ICut = at(hipY)!;
    const highHip: HumanAnatomy.ICut = at((waistY + hipY) / 2)!;
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

  /** Locate the neck's sites: ISO 8559-1 neck girth and ANSUR neck base girth. */
  export function neckSites(skin: HumanAnatomy.ISkin, S: number, t: ITrunk): INeck {
    const base: V3 = A.joint(skin, "neck");
    const top: V3 = A.joint(skin, "head");
    const axis: V3 = A.unit(A.sub(top, base));
    const length: number = A.dist(base, top);
    const region: Uint32Array = A.near(skin, A.sub(base, A.scale(axis, 0.05 * S)), top, 0.12 * S);
    const profile: number[] = [];
    let least: number = Infinity;
    let middle: number = length / 2;
    for (let s: number = 0; s <= length; s += 2) {
      const o: V3 = A.add(base, A.scale(axis, s));
      const c: HumanAnatomy.ICut | null = A.cut(skin, o, axis, o, region);
      const g: number = c === null ? NaN : c.girth;
      profile.push(g);
      if (g < least) {
        least = g;
        middle = s;
      }
    }
    // Suprasternale: the most concave point of the front midline profile between
    // the bust and the neck's least girth; cervicale: the most convex point of
    // the back midline profile within 0.06 S above it.
    const mid = A.polylines(skin, A.MEDIAN, [0, 0, 1], band(skin, t.heights.chest, top[1]));
    const crossings = (y: number): number[] => {
      const xs: number[] = [];
      for (const l of mid)
        for (let i: number = 0; i + 1 < l.points.length; i++) {
          const a: V3 = l.points[i]!;
          const b: V3 = l.points[i + 1]!;
          if (a[1] >= y !== b[1] >= y) xs.push(a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]));
        }
      return xs;
    };
    const frontAt = (y: number): number => Math.max(...crossings(y).filter((x: number): boolean => x > spineX(skin, y)));
    const backAt = (y: number): number => Math.min(...crossings(y).filter((x: number): boolean => x < spineX(skin, y)));
    let notch: number = base[1];
    let best: number = -Infinity;
    // Up to the neck's least girth, below the turn under the jaw.
    for (let y: number = t.heights.chest + 30; y <= base[1] + middle * axis[1]; y += 2) {
      const c: number = frontAt(y - 8) + frontAt(y + 8) - 2 * frontAt(y);
      if (c > best) {
        best = c;
        notch = y;
      }
    }
    let c7: number = notch + 0.04 * S;
    best = -Infinity;
    for (let y: number = notch; y <= notch + 0.06 * S; y += 2) {
      // The back faces -X, so a bump outward lies behind its chord: c > 0.
      const c: number = backAt(y - 8) + backAt(y + 8) - 2 * backAt(y);
      if (c > best) {
        best = c;
        c7 = y;
      }
    }
    const sn: V3 = [frontAt(notch), notch, 0];
    const cv: V3 = [backAt(c7), c7, 0];
    const normal: V3 = A.unit(A.cross([0, 0, 1], A.sub(sn, cv)));
    // The tape over cervicale and suprasternale rises over the side neck points,
    // so it is not planar; on a body whose trapezius stands above that plane the
    // plane runs out over the shoulders. The plane's section is therefore kept
    // within 1.25 times the neck's half-breadth at its least girth either side of
    // the median plane before the taut tape is drawn round it.
    const waist: HumanAnatomy.ICut | null = A.cut(skin, A.add(base, A.scale(axis, middle)), axis, A.add(base, A.scale(axis, middle)), region);
    const half: number = waist === null ? Infinity : Math.max(...waist.points.map((p: V3): number => Math.abs(p[2])));
    const o: V3 = A.lerp(sn, cv, 0.5);
    const n: V3 = normal[1] < 0 ? A.scale(normal, -1) : normal;
    const [bu, bw] = A.basis(n);
    const kept: [number, number][] = A.polylines(skin, o, n, region)
      .flatMap((l): V3[] => l.points)
      .filter((p: V3): boolean => Math.abs(p[2]) <= 1.25 * half && A.dist(p, o) < 0.12 * S)
      .map((p: V3): [number, number] => [A.dot(A.sub(p, o), bu), A.dot(A.sub(p, o), bw)]);
    const baseCut: { girth: number } | null = kept.length < 3 ? null : { girth: A.hull(kept) };
    // Creases across the neck: meridians every 15 degrees about the axis.
    // Creases across the neck: the skin's curve in twelve planes through the
    // neck's axis (24 meridians), from the shoulders to 20 mm past the least
    // girth, short of the turn under the jaw.
    const [u, w] = A.basis(axis);
    let crease: number = 0;
    for (let k: number = 0; k < 12; k++) {
      const dir: V3 = A.add(A.scale(u, Math.cos((k * Math.PI) / 12)), A.scale(w, Math.sin((k * Math.PI) / 12)));
      const plane: V3 = A.unit(A.cross(axis, dir));
      for (const line of A.polylines(skin, A.add(base, A.scale(plane, 1e-3)), plane, region))
        for (const sign of [1, -1]) {
          // The meridian on one side of the axis, between the neck's base station
          // and the head joint, split where it leaves that span.
          let run: V3[] = [];
          const flush = (): void => {
            if (run.length > 10) crease = Math.max(crease, curveCrease(run, base, axis));
            run = [];
          };
          for (const p of line.points) {
            const q: V3 = A.sub(p, base);
            const s: number = A.dot(q, axis);
            if (sign * A.dot(q, dir) > 0 && s > -0.04 * S && s < middle + 20) run.push(p);
            else flush();
          }
          flush();
        }
    }
    return { neck: least, base: baseCut === null ? NaN : baseCut.girth, profile, crease };
  }

}
