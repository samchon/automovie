import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyShared } from "./HumanAnatomyShared";
import { HumanAnatomyTrunkScan } from "./HumanAnatomyTrunkScan";
import { HumanSkinMemo } from "./HumanSkinMemo";

type V3 = HumanAnatomy.V3;
type ITrunk = HumanAnatomyShared.ITrunk;
type IStation = HumanAnatomyTrunkScan.IStation;
const A: typeof HumanAnatomy = HumanAnatomy;
const { extent, trunkCut, band }: typeof HumanAnatomyShared = HumanAnatomyShared;
const { least, sagittal, cutOrEmpty }: typeof HumanAnatomyTrunkScan = HumanAnatomyTrunkScan;

/** The trunk sites located so far, by skin; each dies with its skin. */
const SITES: HumanSkinMemo.Values<ITrunk> = new WeakMap();

/** The trunk's tape sites, located on a skin by their ISO 8559-1 and ANSUR II definitions. */
export namespace HumanAnatomyTrunkSites {
  /**
   * Locate the trunk's sites by their ISO 8559-1 and ANSUR II definitions,
   * once per skin. A site the skin does not carry reads as an empty section
   * with a NaN girth.
   *
   * Frame: x forward, y up, z the body's left, mm, floor at y = 0. S is the
   * stature input, mm, so every band below is a stature fraction. Scans step
   * 2 mm in height, half the 4 mm small-girth error of ISO 20685-1, so a site
   * is placed finer than any tape row can tell.
   *
   * @param skin Skin to read.
   * @param S Stature input, mm.
   */
  export function trunkSites(skin: HumanAnatomy.ISkin, S: number): ITrunk {
    return HumanSkinMemo.get(SITES, skin, (): ITrunk => locate(skin, S));
  }

  /** Locate the trunk's sites afresh; see {@link trunkSites}. */
  function locate(skin: HumanAnatomy.ISkin, S: number): ITrunk {
    let vertex: number = -Infinity;
    for (let v: number = 1; v < skin.P.length; v += 3) vertex = Math.max(vertex, skin.P[v]!);

    // Crotch: the lowest midline skin between the legs, above the knees
    // (ANSUR II midpatella height 0.276-0.278 S, so 0.3 S clears them) and
    // below the hip joint.
    const hip: V3 = A.joint(skin, "hips");
    let crotch: number = Infinity;
    for (const line of A.polylines(skin, A.MEDIAN, [0, 0, 1], band(skin, 0.3 * S, hip[1])))
      for (const p of line.points) if (p[1] > 0.3 * S && p[1] < hip[1]) crotch = Math.min(crotch, p[1]);
    if (!Number.isFinite(crotch)) crotch = NaN;

    // A section the trunk's spine line does not lie inside is a stray piece of
    // skin, not the trunk's tape.
    const at: (y: number) => HumanAnatomy.ICut | null = (y: number): HumanAnatomy.ICut | null => {
      const c: HumanAnatomy.ICut | null = trunkCut(skin, y);
      return c !== null && c.contained ? c : null;
    };
    const scan: (lo: number, hi: number, f: (c: HumanAnatomy.ICut) => number) => IStation[] = (
      lo: number,
      hi: number,
      f: (c: HumanAnatomy.ICut) => number,
    ): IStation[] => {
      const out: IStation[] = [];

      for (let y: number = lo; y <= hi; y += 2) {
        const c: HumanAnatomy.ICut | null = at(y);
        out.push({ y, v: c === null ? NaN : f(c) });
      }

      return out;
    };

    const axilla: number = axillaOf(skin, S);

    // Natural waist: least girth from 0.56 S to 0.70 S. ISO 8559-1 sets the
    // waist level midway between the lowest rib and the iliac crest, landmarks
    // the skin does not carry; ANSUR II's population bands put iliocristale
    // at 0.5747 S and above and the tenth rib at 0.6742 S and below
    // (`ansur-ii-trunk-ratios.md`), so the band holds both landmarks of every
    // adult in it with a margin.
    const waistY: number = least(scan(0.56 * S, 0.7 * S, (c: HumanAnatomy.ICut): number => c.girth));

    // Bust point: the most anterior point of the bust or chest (ISO 8559-1,
    // ANSUR II), the first forward prominence of the trunk's front below the
    // axilla. The abdomen below may stand further forward, so the global
    // maximum is not the bust; a front that only rises toward the abdomen has
    // no bust point. Each station reads the section's forward extent (largest
    // x, mm); scanning down from the axilla, the first station no lower than
    // the one above and higher than the one below is the prominence's apex.
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
    // bust point and the natural waist. The profile is the skin's forward
    // extent (x, mm) in the plane z = the bust point's z, read exactly on the
    // plane's section rather than over a strip, whose vertex scatter on a
    // captured mesh reads as curvature.
    let foldY: number = NaN;
    if (chest.points.length > 0) {
      const bust: V3 = chest.points.reduce((a: V3, b: V3): V3 => (b[0] > a[0] ? b : a));
      const profile: IStation[] = sagittal(skin, bust[2], waistY + 2, chestY - 4);

      foldY = least(profile);
    }
    const underbust: HumanAnatomy.ICut = cutOrEmpty(at(foldY));
    const waist: HumanAnatomy.ICut = cutOrEmpty(at(waistY));

    // Hip: the buttocks' most posterior point (least x, mm) between the crotch
    // and the waist, ISO 8559-1's "greatest projection of buttock". The scan
    // starts 4 mm, two stations, above the crotch, where the section is still
    // one loop round both buttocks; without a crotch it starts at 0.4 S, below
    // ANSUR II's buttock band (0.4672 S and above). The top hip lies midway
    // between waist and hip (ISO 8559-1 5.3.12).
    const back: IStation[] = scan(Number.isFinite(crotch) ? crotch + 4 : 0.4 * S, waistY, (c: HumanAnatomy.ICut): number =>
      Math.min(...c.points.map((p: V3): number => p[0])),
    );
    const hipY: number = least(back);
    const hipCut: HumanAnatomy.ICut = cutOrEmpty(at(hipY));
    const highHip: HumanAnatomy.ICut = cutOrEmpty(at((waistY + hipY) / 2));

    return {
      vertex,
      crotch,
      chest,
      underbust,
      waist,
      highHip,
      hip: hipCut,
      heights: { chest: chestY, underbust: foldY, waist: waistY, hip: hipY, axilla },
    };
  }

  /**
   * Axilla: the lowest height where the trunk's section takes in the arms'
   * roots, its breadth (z extent, mm) jumping by more than 30 mm in 2 mm.
   *
   * The trunk's own breadth changes by a few millimetres per 2 mm; an arm root
   * adds the upper arm's breadth at once, far past 30 mm. The scan spans 0.66
   * to 0.86 S around ANSUR II's axilla band (0.7357 to 0.7822 S,
   * `ansur-ii-trunk-ratios.md`), raised by the A-pose; without a jump the
   * axilla stands at ANSUR II's mean, 0.76 S. The axilla only bounds the bust
   * search from above.
   */
  function axillaOf(skin: HumanAnatomy.ISkin, S: number): number {
    let previous: number = NaN;

    for (let y: number = 0.66 * S; y <= 0.86 * S; y += 2) {
      const c: HumanAnatomy.ICut | null = trunkCut(skin, y);
      const w: number = c === null ? NaN : extent(c.points, 2);

      if (w - previous > 30) return y - 2;
      previous = w;
    }

    return 0.76 * S;
  }
}
