import { AutoMovieHumanHeadSkin } from "../../../../../packages/human/src/generation/AutoMovieHumanHeadSkin";
import type { IAutoMovieHumanHeadLayout } from "../../../../../packages/human/src/generation/IAutoMovieHumanHeadLayout";
import type { IAutoMovieHumanHeadSides } from "../../../../../packages/human/src/generation/IAutoMovieHumanHeadSides";
import type { HumanAnatomy } from "../HumanAnatomy";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanAnatomyShared } from "../HumanAnatomyShared";
import { HumanSagitta } from "../region/HumanSagitta";
import { HumanHeadPiece } from "./HumanHeadPiece";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
type Side = "left" | "right";

/**
 * Rows of the head's skin piece built alone (`HumanHeadPiece`), read
 * as an anthropometrist reads a face: vertical and horizontal profiles through
 * the temple, the forehead's median and paramedian profiles, the horizontal
 * sections of the chin and jaw under the lower lip and the submental profile
 * down to the neck ring. Every reading is a signed sagitta (`HumanSagitta`) in
 * input millimetres, so a step, cliff, ridge, dent or wave in the piece reads
 * against a limit that holds for any face.
 *
 * The bands are placed from the person's published landmarks (exocanthion,
 * otobasion, glabella, vertex) and the layout's stomion, menton and neck ring,
 * which only locate a site; no construction constant enters an expectation.
 */
export namespace HumanHeadSurfaceRows {
  /** The head's section at a station, both sides from the front midline to the back. */
  export type Cut = (station: number) => IAutoMovieHumanHeadSides;

  /** The piece's own cut. */
  export function cutOf(piece: HumanHeadPiece.IPiece): Cut {
    return (station: number): IAutoMovieHumanHeadSides => AutoMovieHumanHeadSkin.sides(piece.built.surface, station);
  }

  /**
   * Temple between the face's lateral edge and the ear (the eye-to-ear
   * groove, the cliff in half width and the vertical seam in front of the
   * ear): vertical profiles at five forward places from 8 mm in front of the
   * otobasion superius to 8 mm behind the exocanthion, from 15 mm under to
   * 30 mm over the exocanthion's level, and horizontal outlines over the same
   * forward span at every millimetre of that height. No named crease of the
   * face lies there (FLD-1), so every sagitta over a 10 mm chord stays within
   * `HumanAnatomyShared.CREASE` either way.
   */
  export function temple(piece: HumanHeadPiece.IPiece, cut: Cut): IRow[] {
    const k: number = piece.scale;
    const rows: IRow[] = [];
    for (const side of SIDES) {
      const sign: 1 | -1 = side === "left" ? 1 : -1;
      const ex: V3 = piece.landmarks.exocanthion[side];
      const ob: V3 = piece.landmarks.otobasion[side].superius;
      const front: number = ex[0] - 8 * k;
      const back: number = ob[0] + 8 * k;
      const heights: number[] = range(ex[1] - 15 * k, ex[1] + 30 * k, k);
      if (front <= back) {
        rows.push(row(piece.person, `temple, ${side}: forward span from otobasion to exocanthion, mm`, (front - back) / k, 0, Infinity));
        continue;
      }

      // Vertical profiles at fixed forward places: the half width per height.
      for (let i: number = 0; i < 5; i++) {
        const x: number = back + ((front - back) * i) / 4;
        const line: V3[] = [];
        for (const y of heights) {
          const z: number = halfWidth(cut(y)[side], x);
          if (Number.isFinite(z)) line.push([x, y, sign * z]);
        }
        rows.push(crease(piece, `temple vertical profile, ${side}, ${place(i)}`, line, (): V3 => [0, 0, sign]));
      }

      // Horizontal outlines across the same forward span.
      let worst: IRow | null = null;
      for (const y of heights) {
        const curve: V3[] = cut(y)[side];
        const ox: number = (curve[0]![0] + curve[curve.length - 1]![0]) / 2;
        const line: V3[] = lateral(curve, back - 5 * k, front + 5 * k);
        const r: IRow = crease(piece, `temple horizontal outline, ${side}, worst height`, line, (p: V3): V3 => [p[0] - ox, 0, p[2]]);
        if (worst === null || !Number.isFinite(r.value) || Math.abs(r.value) > Math.abs(worst.value)) worst = { ...r, site: `${r.site} ${((y - ex[1]) / k).toFixed(0)} mm from the exocanthion` };
        if (!Number.isFinite(r.value)) break;
      }
      if (worst !== null) rows.push(worst);
    }
    return rows;
  }

  /**
   * Forehead and vault front (the forehead plateau and its edges): the median
   * profile and the paramedian profiles 20 and 35 mm either side, from the
   * glabella's level to 6 mm under the vertex. The frontal bone is convex in
   * both directions and no crease lies there (FLD-1, HD-9), so a 10 mm chord's
   * sagitta stays under `CREASE` outward (no ridge) and under `CREASE` inward
   * (no dent).
   */
  export function forehead(piece: HumanHeadPiece.IPiece, cut: Cut): IRow[] {
    const k: number = piece.scale;
    const plan: IAutoMovieHumanHeadLayout = piece.built.plan;
    const g: V3 = piece.landmarks.glabella;
    const eye: IAutoMovieHumanHeadSides = cut(plan.eye);
    const ox: number = (eye.left[0]![0] + eye.left[eye.left.length - 1]![0]) / 2;
    const stations: number[] = range(g[1], piece.landmarks.vertex[1] - 6 * k, 0.5 * k);
    const rows: IRow[] = [];
    for (const offset of [0, 20, -20, 35, -35]) {
      const d: number = Math.abs(offset) * k;
      const side: Side = offset >= 0 ? "left" : "right";
      const line: V3[] = [];
      for (const s of stations) {
        const p: V3 | null = offset === 0 ? cut(s).left[0]! : frontAt(cut(s)[side], d);
        if (p === null) break;
        line.push(p);
      }
      const label: string = offset === 0 ? "median" : `${offset > 0 ? "left" : "right"} paramedian ${Math.abs(offset)} mm`;
      const readings: HumanSagitta.IReading[] = HumanSagitta.along(line, 5 * k, 0.5 * k, (p: V3): V3 => [p[0] - ox, p[1] - plan.eye, 0]);
      rows.push(signed(piece, `forehead ${label} profile: most convex sagitta (ridge)`, readings, 1));
      rows.push(signed(piece, `forehead ${label} profile: most concave sagitta (dent)`, readings, -1));
    }
    return rows;
  }

  /**
   * Chin and jaw under the lower lip (the blocky jaw step): horizontal
   * sections from 30 percent of the way from stomion to menton down to 15
   * percent above the menton, each side from the midline back to 10 mm in
   * front of the otobasion inferius. Below the vermilion the face's horizontal
   * outline is convex with no named crease across it (the mentolabial sulcus
   * runs across the vertical profile, not the horizontal section), so the
   * sagitta stays within `CREASE` either way.
   */
  export function jaw(piece: HumanHeadPiece.IPiece, cut: Cut): IRow[] {
    const k: number = piece.scale;
    const plan: IAutoMovieHumanHeadLayout = piece.built.plan;
    const span: number = plan.stomion - plan.menton;
    const rows: IRow[] = [];
    for (const side of SIDES) {
      const limit: number = piece.landmarks.otobasion[side].inferius[0] + 10 * k;
      let worst: IRow | null = null;
      for (const s of range(plan.menton + 0.15 * span, plan.stomion - 0.3 * span, k)) {
        const curve: V3[] = cut(s)[side];
        const ox: number = (curve[0]![0] + curve[curve.length - 1]![0]) / 2;
        const line: V3[] = [];
        for (const p of curve) {
          if (p[0] < limit) break;
          line.push(p);
        }
        const r: IRow = crease(piece, `jaw horizontal section under the lower lip, ${side}, at ${((s - plan.menton) / span).toFixed(2)} of menton to stomion`, line, (p: V3): V3 => [p[0] - ox, 0, p[2]]);
        if (worst === null || !Number.isFinite(r.value) || Math.abs(r.value) > Math.abs(worst.value)) worst = r;
      }
      if (worst !== null) rows.push(worst);
    }
    return rows;
  }

  /**
   * Under the chin (the neck waves): the median profile and the paramedian
   * profiles 15 mm either side, from 3 mm over the neck ring up to 15 percent
   * of the way from menton to stomion, round the chin's underside. The
   * profile runs throat, cervicomental angle, chin: at most one convex, one
   * concave and one convex run from the neck up (the thyroid cartilage, the
   * angle, the chin), read on a 15 mm chord whose 1 mm floor is the ISO
   * 20685-1 head error, a bending of radius 28 mm: the chin and the angle bend
   * more, a lean throat less. A wave of 1 mm amplitude and 20 mm wavelength
   * reads 1.7 mm on that chord and adds two runs.
   */
  export function submental(piece: HumanHeadPiece.IPiece, cut: Cut): IRow[] {
    const k: number = piece.scale;
    const plan: IAutoMovieHumanHeadLayout = piece.built.plan;
    const span: number = plan.stomion - plan.menton;
    const stations: number[] = range(plan.y0 + 3 * k, plan.menton + 0.15 * span, 0.5 * k);
    const centre: V3 = [plan.neck.x, plan.menton, 0];
    const rows: IRow[] = [];
    for (const offset of [0, 15, -15]) {
      const side: Side = offset >= 0 ? "left" : "right";
      const line: V3[] = [];
      for (const s of stations) {
        const p: V3 | null = offset === 0 ? cut(s).left[0]! : frontAt(cut(s)[side], Math.abs(offset) * k);
        if (p !== null) line.push(p);
      }
      const label: string = offset === 0 ? "median" : `${offset > 0 ? "left" : "right"} paramedian ${Math.abs(offset)} mm`;
      const readings: HumanSagitta.IReading[] = HumanSagitta.along(line, 7.5 * k, 0.5 * k, (p: V3): V3 => [p[0] - centre[0], p[1] - centre[1], 0]);
      const runs: number[] = HumanSagitta.runs(readings, HumanAnatomyShared.HEAD * k);
      const shape: boolean = runs.length <= 3 && runs.join(",") !== "-1,1,-1";
      rows.push({
        person: piece.person,
        site: `submental ${label} profile from the neck up: sign runs ${runs.map((r: number): string => (r > 0 ? "convex" : "concave")).join(" ") || "none"} (0 when within convex, concave, convex)`,
        value: shape ? 0 : runs.length,
        low: 0,
        high: 0,
        unit: "runs",
      });
    }
    return rows;
  }

  /** Both sides. */
  const SIDES: readonly Side[] = ["left", "right"];

  /** A forward place's name. */
  function place(i: number): string {
    return ["in front of the ear", "a quarter forward", "midway", "three quarters forward", "behind the eye"][i]!;
  }

  /** Even stations from a to b inclusive of a. */
  function range(a: number, b: number, step: number): number[] {
    const out: number[] = [];
    for (let s: number = a; s <= b + 1e-9; s += step) out.push(s);
    return out;
  }

  /** The largest half width where a side's curve crosses a forward place, NaN when it does not. */
  function halfWidth(curve: readonly V3[], x: number): number {
    let best: number = NaN;
    for (let i: number = 1; i < curve.length; i++) {
      const a: V3 = curve[i - 1]!;
      const b: V3 = curve[i]!;
      if ((a[0] - x) * (b[0] - x) > 0 || a[0] === b[0]) continue;
      const t: number = (x - a[0]) / (b[0] - a[0]);
      const z: number = Math.abs(a[2] + t * (b[2] - a[2]));
      if (!(z <= best)) best = z;
    }
    return best;
  }

  /** The contiguous run of a side's curve about its widest point whose forward places lie between two bounds. */
  function lateral(curve: readonly V3[], from: number, to: number): V3[] {
    const inside: (i: number) => boolean = (i: number): boolean => i >= 0 && i < curve.length && curve[i]![0] >= from && curve[i]![0] <= to;
    let widest: number = -1;
    for (let i: number = 0; i < curve.length; i++) if (inside(i) && (widest < 0 || Math.abs(curve[i]![2]) > Math.abs(curve[widest]![2]))) widest = i;
    if (widest < 0) return [];
    let lo: number = widest;
    let hi: number = widest;
    while (inside(lo - 1)) lo--;
    while (inside(hi + 1)) hi++;
    return curve.slice(lo, hi + 1);
  }

  /** The first point from the front midline where a side's curve reaches a half width, null when it does not. */
  function frontAt(curve: readonly V3[], d: number): V3 | null {
    for (let i: number = 1; i < curve.length; i++) {
      const a: V3 = curve[i - 1]!;
      const b: V3 = curve[i]!;
      if (Math.abs(a[2]) <= d && Math.abs(b[2]) >= d && Math.abs(b[2]) !== Math.abs(a[2])) {
        const t: number = (d - Math.abs(a[2])) / (Math.abs(b[2]) - Math.abs(a[2]));
        return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2])];
      }
    }
    return null;
  }

  /** The crease row of a line: its largest sagitta either way over a 10 mm chord, input mm, within `CREASE`. */
  function crease(piece: HumanHeadPiece.IPiece, site: string, line: V3[], outward: (p: V3) => V3): IRow {
    const k: number = piece.scale;
    const r: HumanSagitta.IReading | null = HumanSagitta.extreme(HumanSagitta.along(line, 5 * k, 0.5 * k, outward), 0);
    const at: string = r === null ? "" : ` at [${r.point.map((v: number): string => (v / k).toFixed(0)).join(", ")}]`;
    return row(piece.person, `${site}: largest sagitta over a 10 mm chord${at}, mm`, r === null ? NaN : r.value / k, -HumanAnatomyShared.CREASE, HumanAnatomyShared.CREASE);
  }

  /** A one-signed crease row: the most convex (or concave) sagitta, input mm, under `CREASE`. */
  function signed(piece: HumanHeadPiece.IPiece, site: string, readings: HumanSagitta.IReading[], sign: 1 | -1): IRow {
    const k: number = piece.scale;
    if (readings.length === 0) return row(piece.person, `${site}: no profile was read, mm`, NaN, 0, 0);
    const r: HumanSagitta.IReading | null = HumanSagitta.extreme(readings, sign);
    const value: number = r === null ? 0 : (sign * r.value) / k;
    const at: string = r === null ? "" : ` at ${(r.arc / k).toFixed(0)} mm of arc`;
    return row(piece.person, `${site}${at}, mm`, value, 0, HumanAnatomyShared.CREASE);
  }

  /** A row. */
  function row(person: string, site: string, value: number, low: number, high: number): IRow {
    return { person, site, value, low, high, unit: "mm" };
  }
}
