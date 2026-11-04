import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyShared } from "./HumanAnatomyShared";
import { HumanAnatomyTrunkScan } from "./HumanAnatomyTrunkScan";

type V3 = HumanAnatomy.V3;
type IStation = HumanAnatomyTrunkScan.IStation;
const A: typeof HumanAnatomy = HumanAnatomy;
const { spineX, band }: typeof HumanAnatomyShared = HumanAnatomyShared;
const { least, side }: typeof HumanAnatomyTrunkScan = HumanAnatomyTrunkScan;

/** The back's sagittal curves read on its median skin: lumbar lordosis and thoracic kyphosis. */
export namespace HumanAnatomySpine {
  /**
   * The least sagitta that counts as a curve, mm: the 2 mm station step of the
   * profile. A back bowing by less than one step cannot be told from a
   * straight one, and a straightened back still reads a fraction of a
   * millimetre where its apex falls at an end of the span.
   */
  export const FLOOR: number = 2;

  /** The back's sagittal curves on its median skin, mm. */
  export interface ISpine {
    /** Lumbar apex in front of the chord from the sacral apex to the thoracic apex. */
    lordosis: number;

    /** Thoracic apex behind the chord from the lumbar apex to cervicale. */
    kyphosis: number;

    /** Heights of the sacral, lumbar and thoracic apices and of cervicale, mm. */
    heights: { sacral: number; lumbar: number; thoracic: number; cervicale: number };
  }

  /**
   * The back's median profile from the buttock level to cervicale: its
   * thoracic apex, the most posterior point above the natural waist; its
   * lumbar apex, the most anterior point below that; and its sacral apex, the
   * most posterior point below the lumbar apex.
   *
   * The profile is the back's x (mm, forward positive) on the median plane
   * every 2 mm of height; x of the most posterior crossing behind the spine's
   * joint line. A sagitta is the apex's horizontal offset from the straight
   * chord between its two neighbouring apices at the apex's height, positive
   * when the curve bows the way Gray 1918 gives it: the lumbar apex in front
   * (convex forward), the thoracic apex behind (concave forward). An apex at an
   * end of its span is no curve: its sagitta reads zero. Cervicale is the
   * profile's top station, the 2 mm grid's nearest to it.
   *
   * @param skin Skin to read.
   * @param hip Height of the buttock prominence, mm; the profile's bottom.
   * @param waist Height of the natural waist, mm; the thoracic apex lies above it.
   * @param cervicale Height of cervicale, mm; the profile's top.
   */
  export function spine(skin: HumanAnatomy.ISkin, hip: number, waist: number, cervicale: number): ISpine {
    if (!Number.isFinite(hip) || !Number.isFinite(cervicale) || !Number.isFinite(waist))
      return { lordosis: NaN, kyphosis: NaN, heights: { sacral: NaN, lumbar: NaN, thoracic: NaN, cervicale: NaN } };

    const mid: { points: V3[]; closed: boolean }[] = A.polylines(skin, A.MEDIAN, [0, 0, 1], band(skin, hip - 10, cervicale + 10));
    const profile: IStation[] = [];
    for (let y: number = hip; y <= cervicale; y += 2) profile.push({ y, v: side(mid, y, spineX(skin, y), -1) });

    const within: (a: number, b: number) => IStation[] = (a: number, b: number): IStation[] => profile.filter((s: IStation): boolean => s.y >= a && s.y <= b);
    const thoracic: number = least(within(waist, cervicale));
    const lumbar: number = least(within(hip, thoracic).map((s: IStation): IStation => ({ y: s.y, v: -s.v })));
    const sacral: number = least(within(hip, lumbar));

    // The grid's top station stands in for cervicale, so every chord ends on a sampled height.
    const top: number = profile[profile.length - 1]!.y;
    const x: (y: number) => number = (y: number): number => profile.find((s: IStation): boolean => s.y === y)?.v ?? NaN;
    const chord: (a: number, b: number, y: number) => number = (a: number, b: number, y: number): number => x(a) + ((x(b) - x(a)) * (y - a)) / (b - a);

    return {
      lordosis: x(lumbar) - chord(sacral, thoracic, lumbar),
      kyphosis: chord(lumbar, top, thoracic) - x(thoracic),
      heights: { sacral, lumbar, thoracic, cervicale: top },
    };
  }
}
