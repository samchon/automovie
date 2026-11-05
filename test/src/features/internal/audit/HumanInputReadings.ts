import { HumanAnatomy } from "../HumanAnatomy";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanAnatomyShared } from "../HumanAnatomyShared";
import { HumanAnatomyTrunk } from "../HumanAnatomyTrunk";
import { HumanInputs } from "../HumanInputs";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
const A: typeof HumanAnatomy = HumanAnatomy;

/**
 * Identity readings of the trunk's breadths, depths, natural waist height and
 * crotch lengths on the finished skin, for the input-identity audit
 * (`HumanInputIdentity`): each measured at its published site, its row
 * centred on the input it reads and named by its measure, so the audit
 * matches it to the input.
 *
 * The sites are the trunk's own (`HumanAnatomyTrunk.trunkSites`): the chest
 * point's level, the natural waist (the least girth between 0.56 S and
 * 0.70 S), the buttocks' most posterior level and the crotch, each a
 * horizontal section of the trunk with the arms left out. The skin is in the
 * input's millimetres.
 */
export namespace HumanInputReadings {
  /**
   * Allowance of a trunk breadth or depth, mm: ANSUR II's allowable error for
   * chest breadth, the one its trunk calipers publish.
   */
  export const BREADTH: number = 7;

  /** Allowance of a height above the floor, mm: ISO 20685-1's crotch height error, as the course rows take it. */
  export const HEIGHT: number = 10;

  /** Allowance of a tape over the trunk's median skin, mm: the waist front length's error, as the course rows take it. */
  export const TAPE: number = 7;

  /** Every identity reading the subject's inputs ask for. */
  export function rows(subject: HumanAnatomyAudit.ISubject): IRow[] {
    const out: IRow[] = [];
    const c: Record<string, number | undefined> = subject.params.body.anatomy as unknown as Record<string, number | undefined>;
    const skin: HumanAnatomy.ISkin = subject.bind();
    const S: number = HumanInputs.stature(subject.params);
    const t: HumanAnatomyShared.ITrunk = HumanAnatomyTrunk.trunkSites(skin, S);
    const id: (site: string, value: number, input: number | undefined, tol: number) => void = (site: string, value: number, input: number | undefined, tol: number): void => {
      if (input !== undefined) out.push(HumanAnatomyShared.identity(subject.name, site, value, input, tol));
    };
    const depth: (points: V3[]) => number = (points: V3[]): number => (points.length === 0 ? NaN : HumanAnatomyShared.extent(points, 0));
    const breadth: (points: V3[]) => number = (points: V3[]): number => (points.length === 0 ? NaN : HumanAnatomyShared.extent(points, 2));

    // Breadths and depths at their levels; depths are x extents, breadths z.
    id("chest depth at the chest point's level, mm", depth(t.chest.points), c["chestDepth"], BREADTH);
    id("buttock depth at the buttocks' most posterior level, mm", depth(t.hip.points), c["buttockDepth"], BREADTH);
    id("natural waist height: the least trunk girth between 0.56 S and 0.70 S above the floor, mm", t.heights.waist, c["waistHeight"], HEIGHT);
    const waistY: number = c["waistHeight"] ?? t.heights.waist;
    const waist: V3[] = HumanAnatomyShared.trunkCut(skin, waistY)?.points ?? [];
    id("waist breadth at the waist height, mm", breadth(waist), c["waistBreadth"], BREADTH);
    id("waist depth at the waist height, mm", depth(waist), c["waistDepth"], BREADTH);

    // Hip breadth: the widest horizontal trunk section from 4 mm above the crotch to the natural waist.
    let widest: number = NaN;
    for (let y: number = (Number.isFinite(t.crotch) ? t.crotch + 4 : 0.4 * S); y <= t.heights.waist; y += 2) {
      const cut: HumanAnatomy.ICut | null = HumanAnatomyShared.trunkCut(skin, y);
      if (cut !== null && cut.contained && cut.points.length !== 0) widest = Number.isFinite(widest) ? Math.max(widest, breadth(cut.points)) : breadth(cut.points);
    }
    id("hip breadth: the widest horizontal trunk section between the crotch and the natural waist, mm", widest, c["hipBreadth"], BREADTH);

    // Crotch lengths: the median skin from the navel's level at the front, down through the crotch and up the back to the same level.
    const navel: number | null = omphalion(subject);
    if (navel !== null && Number.isFinite(t.crotch)) {
      const [front, back]: [number, number] = crotch(skin, t.crotch, navel);
      id("crotch length: the median skin from the navel's level down through the crotch and up to it again, mm", front + back, c["crotchLength"], TAPE);
      id("posterior crotch length: the median skin from the crotch up the back to the navel's level, mm", back, c["posteriorCrotchLength"], TAPE);
    }
    return out;
  }

  /**
   * The front and back lengths of the median skin from the crotch, its lowest
   * point between the legs, up to a height: the median section's polyline
   * through the crotch is walked both ways until it reaches the height; the
   * part ahead of the crotch (larger x) is the front.
   */
  export function crotch(skin: HumanAnatomy.ISkin, low: number, height: number): [number, number] {
    const lines: { points: V3[]; closed: boolean }[] = A.polylines(skin, A.MEDIAN, [0, 0, 1], HumanAnatomyShared.band(skin, low - 2, height + 2));
    let line: V3[] = [];
    let at: number = -1;
    let miss: number = Infinity;
    for (const l of lines)
      for (let i: number = 0; i < l.points.length; i++) {
        const d: number = Math.abs(l.points[i]![1] - low);
        if (d < miss) {
          miss = d;
          line = l.points;
          at = i;
        }
      }
    if (at < 0) return [NaN, NaN];
    const walk: (step: 1 | -1) => { length: number; x: number } = (step: 1 | -1): { length: number; x: number } => {
      let length: number = 0;
      let x: number = line[at]![0];
      for (let i: number = at; i + step >= 0 && i + step < line.length; i += step) {
        const a: V3 = line[i]!;
        const b: V3 = line[i + step]!;
        if (b[1] >= height) {
          const f: number = (height - a[1]) / (b[1] - a[1]);
          length += f * Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
          return { length, x };
        }
        length += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
        x = b[0];
      }
      return { length: NaN, x };
    };
    const one: { length: number; x: number } = walk(1);
    const two: { length: number; x: number } = walk(-1);
    return one.x > two.x ? [one.length, two.length] : [two.length, one.length];
  }

  /** The navel's height in the input's millimetres, from the generated body's trunk landmarks, or null without them. */
  function omphalion(subject: HumanAnatomyAudit.ISubject): number | null {
    const person: ReturnType<NonNullable<HumanAnatomyAudit.ISubject["person"]>> | undefined = subject.person?.();
    const trunk: { omphalion: number } | undefined = person?.body.trunk;
    if (person === undefined || trunk === undefined) return null;
    return (trunk.omphalion * HumanInputs.stature(person.params)) / person.body.stature;
  }
}
