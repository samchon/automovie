import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyShared } from "./HumanAnatomyShared";
import { HumanAnatomyTrunkBand } from "./HumanAnatomyTrunkBand";
import { HumanAnatomyTrunkScan } from "./HumanAnatomyTrunkScan";
import { HumanNeckReadingSingleton } from "./HumanNeckReadingSingleton";

type V3 = HumanAnatomy.V3;
type INeck = HumanAnatomyShared.INeck;
const A: typeof HumanAnatomy = HumanAnatomy;
const { SMALL, curveCrease, spineX, band }: typeof HumanAnatomyShared = HumanAnatomyShared;
const { side, station, deepest, flattest }: typeof HumanAnatomyTrunkScan = HumanAnatomyTrunkScan;

/** The neck's sites: ISO 8559-1 neck girth, neck base girth, suprasternale and cervicale, and the skin's creases. */
export namespace HumanAnatomyNeckSites {
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
   * @param skin Skin to read.
   * @param S Stature input, mm.
   * @param known Locators found on another reading of the same body; when
   *   given, the base line, suprasternale and cervicale are read there instead
   *   of being found again.
   */
  export function neckSites(skin: HumanAnatomy.ISkin, S: number, known?: ILocators): INeck {
    // A skin is read once: the sections and meridians below cost seconds, and
    // a reading found without locators is a pure function of the skin. A copy
    // read at given locators is a different reading and is not remembered.
    if (known === undefined) return HumanNeckReadingSingleton.get(skin, (): INeck => reading(skin, S));
    return reading(skin, S, known);
  }

  /** One reading of the neck's sites, found afresh; see {@link neckSites}. */
  function reading(skin: HumanAnatomy.ISkin, S: number, known?: ILocators): INeck {
    // Neck frame: the axis runs from the rig's neck joint (the base station,
    // s = 0) to its head joint, s in mm along it. The region is the skin within
    // 0.12 S of that segment, from 0.05 S below the base station: the whole
    // neck, the trapezius and the upper chest and back, so every section and
    // meridian below closes on skin. Stations step 2 mm, half the 4 mm
    // small-girth error. The neck girth is the least station girth
    // perpendicular to the axis, ISO 8559-1's perpendicular neck girth below
    // the larynx, which the skin does not mark.
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
    // section is the face's. On f1's and f2's references the girth past the
    // least rises 1 to 2 mm per station until the chin, then 23 to 62 mm in
    // one station as the section takes in the submental skin, which runs
    // across the axis; the small-girth error separates the two without a limit
    // of its own.
    let jaw: number = length;
    for (let k: number = Math.round(middle / 2); k < girths.length; k++)
      if (girths[k]! > least + SMALL) {
        jaw = 2 * (k - 1);
        break;
      }
    const profile: number[] = girths.slice(0, Math.floor(jaw / 2) + 1);

    const notch: number = known !== undefined ? known.notch : suprasternale(skin, S);

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
    // a half times the least girth's mean radius (least / 2 pi) of the axis,
    // short of the clavicles, the shoulders' tops and the chest; on f1's
    // reference the base points lie within 1.25 times that radius, and the
    // clavicle hollow a 20 mm chord picked lay at 1.74 times. Meridians are 15
    // degrees apart, half-planes about the axis numbered in turn from the
    // basis direction u, so keys 0 and 12 are opposite.
    const reach: number = (0.75 * least) / Math.PI;
    const [u, w]: [V3, V3] = A.basis(axis);
    let crease: number = 0;
    const foot: (V3 | null)[] = new Array<V3 | null>(24).fill(null);
    const span: number[] = new Array<number>(24).fill(0);
    const meridian: V3[][] = Array.from({ length: 24 }, (): V3[] => []);
    const dirs: V3[] = [];

    for (let k: number = 0; k < 12; k++) {
      const dir: V3 = A.add(A.scale(u, Math.cos((k * Math.PI) / 12)), A.scale(w, Math.sin((k * Math.PI) / 12)));
      const plane: V3 = A.unit(A.cross(axis, dir));
      dirs[k] = dir;
      dirs[k + 12] = A.scale(dir, -1);

      for (const line of A.polylines(skin, A.add(base, A.scale(plane, 1e-3)), plane, region))
        for (const sign of [1, -1]) {
          // The meridian on one side of the axis, between the neck's base
          // station and the jaw, split where it leaves that span.
          const key: number = sign > 0 ? k : k + 12;
          let run: V3[] = [];
          const flush: () => void = (): void => {
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
    if (known !== undefined)
      for (let k: number = 0; k < 24; k++)
        foot[k] = known.stations[k] === null ? null : station(meridian[k]!, base, axis, known.stations[k]!);
    lines.set(skin, foot);

    // Cervicale: where the base line crosses the back median line, the nape's
    // junction with the back; ISO 8559-1's neck base tape passes over it. The
    // back median line is the meridian whose direction points furthest back
    // (least x).
    let back: number = 0;
    for (let k: number = 1; k < 24; k++) if (dirs[k]![0] < dirs[back]![0]) back = k;
    const c7: number = known !== undefined ? known.cervicale : (foot[back]?.[1] ?? NaN);
    located.set(skin, {
      stations: foot.map((p: V3 | null): number | null => (p === null ? null : A.dot(A.sub(p, base), axis))),
      notch,
      cervicale: c7,
    });

    return { neck: least, base: baseGirth(foot), profile, crease, notch, cervicale: c7 };
  }

  /**
   * Suprasternale: the most concave point of the front median profile within
   * its ANSUR II height band (0.7999 to 0.8355 S). Concavity is the second
   * difference of the forward extent x (mm) over 8 mm either side: positive
   * where the skin lies behind the chord of its neighbours, as the jugular
   * notch does. The band bounds the search, so its height is not a row.
   */
  function suprasternale(skin: HumanAnatomy.ISkin, S: number): number {
    const [lo, hi]: readonly [number, number] = HumanAnatomyTrunkBand.SUPRASTERNALE_HEIGHT;
    const mid: { points: V3[]; closed: boolean }[] = A.polylines(skin, A.MEDIAN, [0, 0, 1], band(skin, lo * S - 20, hi * S + 20));
    const frontAt: (y: number) => number = (y: number): number => side(mid, y, spineX(skin, y), 1);
    let notch: number = NaN;
    let best: number = -Infinity;

    for (let y: number = lo * S; y <= hi * S; y += 2) {
      const c: number = frontAt(y - 8) + frontAt(y + 8) - 2 * frontAt(y);

      if (c > best) {
        best = c;
        notch = y;
      }
    }

    return notch;
  }

  /**
   * The tape drawn taut over the base line: the perimeter (mm) of the points'
   * convex hull in their least-squares plane. A taut tape bridges a meridian
   * whose concave point dips below its neighbours, and one without a concave
   * point; a line missing a quarter of its meridians (more than 6 of 24) is
   * not read. Projecting the line onto its plane drops its rise over the side
   * neck points, so the hull reads a little shorter than a tape laid on the
   * skin.
   */
  function baseGirth(foot: (V3 | null)[]): number {
    const found: V3[] = foot.filter((p: V3 | null): p is V3 => p !== null);
    if (found.length < 18) return NaN;

    const o: V3 = found.reduce((a: V3, b: V3): V3 => A.add(a, A.scale(b, 1 / found.length)), [0, 0, 0]);
    const n: V3 = flattest(found.map((p: V3): V3 => A.sub(p, o)));
    const [bu, bw]: [V3, V3] = A.basis(n);

    return A.hull(found.map((p: V3): [number, number] => [A.dot(A.sub(p, o), bu), A.dot(A.sub(p, o), bw)]));
  }
}
