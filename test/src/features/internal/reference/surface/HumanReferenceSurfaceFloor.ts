/**
 * The least deviation counted as gross, by region, from published human
 * variation.
 *
 * The reference population barely varies the hands, fingers, toes and feet
 * and carries four fitted heads, so its spread there is no measure of how far
 * real people differ. A region's floor is 2.576 times the standard deviation of
 * the nearest measured dimension, of the sex with the larger one, turned into
 * one surface point's offset at that site: half a breadth's deviation, a
 * girth's over 2 pi, or a protrusion's whole. No finger, thumb or toe breadth
 * spread is in the sources, so the digits take the nearest measured dimension
 * of their hand or foot, which is wider than a digit's own spread. The
 * published spreads are of adults unscaled by stature, wider than among
 * people of one stature.
 */
export namespace HumanReferenceSurfaceFloor {
  /** The two-sided 99 % quantile of the standard normal distribution. */
  export const QUANTILE: number = 2.576;

  /**
   * Smallest limit, mm: ISO 20685-1:2018 Table 4's foot dimensions, the
   * largest single-point allowance the anatomy tests cite. Below it a
   * deviation is measurement noise.
   */
  export const FLOOR: number = 2;

  /**
   * A region's floor from published human variation: the standard deviation
   * of the nearest measured dimension, of the sex with the larger one, turned
   * into the offset of one surface point at that site.
   */
  export interface IFloor {
    /** Which regions take this floor, by their readable name. */
    match: RegExp;

    /** The dimension and its source. */
    basis: string;

    /** Its standard deviation, mm. */
    sd: number;

    /** How the dimension moves one surface point: half a breadth, a girth over 2 pi, or a whole protrusion. */
    kind: "breadth" | "girth" | "protrusion";
  }

  /** A region's floor, mm, and the dimension it stands on. */
  export interface IValue {
    /** The floor, mm; NaN for an unlabelled vertex, which takes its neighbours' floor. */
    value: number;

    /** The dimension and source the floor stands on. */
    basis: string;
  }

  /** Floors by region, first match wins. */
  export const FLOORS: readonly IFloor[] = [
    { match: /\(ear\./, basis: "ear protrusion at the tragus, Cho 2025, women SD 4.6", sd: 4.6, kind: "protrusion" },
    {
      match: /\(head\.middle\)/,
      basis: "maximum facial width zy-zy, Weinberg 2016, men SD 6.4",
      sd: 6.4,
      kind: "breadth",
    },
    {
      match: /\(head\.lower\)/,
      basis: "mandibular width go-go, Weinberg 2016, men SD 7.5",
      sd: 7.5,
      kind: "breadth",
    },
    {
      match: /\(head\.upper\)/,
      basis: "maximum cranial width eu-eu, Weinberg 2016, men SD 5.6",
      sd: 5.6,
      kind: "breadth",
    },
    { match: /\(head\)/, basis: "neck circumference, ANSUR II, men SD 25.8", sd: 25.8, kind: "girth" },
    { match: /\((finger|thumb|hand)\./, basis: "hand breadth, ANSUR II, men SD 4.4", sd: 4.4, kind: "breadth" },
    { match: /\((toe|forefoot|foot)\./, basis: "foot breadth, ANSUR II, men SD 5.2", sd: 5.2, kind: "breadth" },
    {
      match: /forearm/,
      basis: "forearm circumference, flexed, ANSUR II, men SD 22.0",
      sd: 22,
      kind: "girth",
    },
    {
      match: /upper arm/,
      basis: "biceps circumference, flexed, ANSUR II, men SD 34.6",
      sd: 34.6,
      kind: "girth",
    },
    { match: /thigh/, basis: "thigh circumference, ANSUR II, men SD 58.5", sd: 58.5, kind: "girth" },
    { match: /lower leg/, basis: "calf circumference, ANSUR II, men SD 29.7", sd: 29.7, kind: "girth" },
    { match: /\(upper\)/, basis: "shoulder circumference, ANSUR II, men SD 63.6", sd: 63.6, kind: "girth" },
    { match: /^chest/, basis: "chest circumference, ANSUR II, men SD 87.4", sd: 87.4, kind: "girth" },
    {
      match: /^abdomen/,
      basis: "waist (omphalion) circumference, ANSUR II, men SD 111.7",
      sd: 111.7,
      kind: "girth",
    },
    { match: /^pelvis/, basis: "buttock circumference, ANSUR II, men SD 76.7", sd: 76.7, kind: "girth" },
  ];

  /**
   * A region's floor, mm, and its basis. A region no published spread covers
   * takes the ISO floor, and unlabelled vertices take their labelled
   * neighbours' floor, which is NaN here.
   *
   * @param region The region's readable name.
   */
  export function floor(region: string): IValue {
    if (region === "unassigned") return { value: NaN, basis: "the floor of its labelled neighbours" };

    const f: IFloor | undefined = FLOORS.find((x: IFloor): boolean => x.match.test(region));
    if (f === undefined) return { value: FLOOR, basis: "ISO 20685-1:2018 Table 4 floor" };

    const site: number = f.kind === "breadth" ? f.sd / 2 : f.kind === "girth" ? f.sd / (2 * Math.PI) : f.sd;

    return { value: Math.max(FLOOR, QUANTILE * site), basis: f.basis };
  }
}
