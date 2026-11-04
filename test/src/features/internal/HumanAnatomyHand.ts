import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanAnatomy } from "./HumanAnatomy";
import type { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanAnatomyHandDigits } from "./HumanAnatomyHandDigits";
import { HumanAnatomyHandSites } from "./HumanAnatomyHandSites";
import { HumanAnatomyShared } from "./HumanAnatomyShared";

type IRow = HumanAnatomyAudit.IRow;
type ISubject = HumanAnatomyAudit.ISubject;
type IHand = HumanAnatomyShared.IHand;
type IHandInputs = NonNullable<NonNullable<IAutoMovieHumanParameters["extremities"]>["hands"]>["left"];
const { SIDES, SMALL, HAND, identity, ratio }: typeof HumanAnatomyShared = HumanAnatomyShared;

/**
 * The hand audit: its rows, and the entry to the sites they are read at. The
 * sites live in their own pieces: {@link HumanAnatomyHandSites} for the
 * hand's lengths, breadth and girth, {@link HumanAnatomyHandDigits} for the
 * fingers along their own paths.
 */
export namespace HumanAnatomyHand {
  /** The four fingers, radial to ulnar. */
  export const FINGERS: typeof HumanAnatomyHandDigits.FINGERS = HumanAnatomyHandDigits.FINGERS;

  /** A finger by its rig name. */
  export type Finger = HumanAnatomyHandDigits.Finger;

  /** One finger's own path on a skin. */
  export type IDigit = HumanAnatomyHandDigits.IDigit;

  /** Follow each finger along its own sections, so a bent finger keeps the length it has. */
  export const digits: typeof HumanAnatomyHandDigits.digits = HumanAnatomyHandDigits.digits;

  /** Locate a hand's sites at the neutral pose. */
  export const handSites: typeof HumanAnatomyHandSites.handSites = HumanAnatomyHandSites.handSites;

  /**
   * The hands at the neutral pose: ANSUR II and ISO 7250-1 lengths, breadth and
   * circumference, and the order of the fingers' lengths along their own paths.
   *
   * Hand length and thumb length run from stylion or the thumb's crease to a
   * fingertip with the digit extended, so a subject whose neutral does not
   * straighten its digits cannot be read by their definitions and gives no
   * such row; breadth over length goes with the length. Palm length,
   * breadth and circumference end at the knuckles, which flexion of the
   * fingers beyond them leaves in place, and the finger order follows each
   * finger's own centreline, which flexion bends but does not shorten.
   */
  export function hand(subject: ISubject): IRow[] {
    const name: string = subject.name;
    const rows: IRow[] = [];
    const p: IAutoMovieHumanParameters = subject.params;
    const skin: HumanAnatomy.ISkin = subject.neutral();

    for (const side of SIDES) {
      const h: IHand = handSites(skin, side);
      const own: IHandInputs | undefined = p.extremities?.hands?.[side];
      if (own !== undefined) {
        if (subject.straightened)
          rows.push(identity(name, `${side} hand length, stylion to dactylion III, mm`, h.length, own.handLength, HAND));
        rows.push(identity(name, `${side} hand breadth across metacarpals II to V, mm`, h.breadth, own.handBreadth, HAND));
        rows.push(identity(name, `${side} palm length, stylion to the middle finger's base, mm`, h.palm, own.palmLength, HAND));
        if (subject.straightened) {
          rows.push(identity(name, `${side} thumb length, MCP crease to tip, mm`, h.thumb, own.thumbLength, HAND));

          // ANSUR II means: breadth over length 78.2 / 181.1 = 0.4318 (women) and
          // 88.3 / 193.3 = 0.4568 (men). Coefficients of variation of breadth
          // (3.8 / 78.2 = 0.0486; 4.4 / 88.3 = 0.0498) and length (10.1 / 181.1 =
          // 0.0558; 9.9 / 193.3 = 0.0512) taken as uncorrelated give SD 0.0319
          // and 0.0326, and 2.326 SD below the women's and above the men's mean
          // give 0.3575 to 0.5327.
          rows.push(ratio(name, `${side} hand breadth / length`, h.breadth / h.length, 0.3575, 0.5327));
        }
      }
      const circumference: number | null = p.body.anatomy.handCircumference ?? null;
      if (circumference !== null)
        rows.push(identity(name, `${side} hand circumference over metacarpals II to V, mm`, h.circumference, circumference, SMALL));
      rows.push(...fingerOrder(name, side, digits(skin, side)));
    }
    return rows;
  }

  /**
   * The order of the fingers' lengths: the middle finger the longest and the
   * little finger the shortest of the four. Bridgman 1920 states the order as
   * anatomy ("The middle finger is the longest and largest"; "The little finger
   * is the smallest and shortest"), and in the 1987-1988 Army hand survey
   * (Greiner 1991) the middle finger exceeds the ring finger, the longer of
   * its neighbours, by 5.0 mm in women and 4.6 mm in men on average, and the
   * index finger, the shortest of the other three, exceeds the little finger
   * by 11.3 and 10.6 mm; the order of the index and ring fingers (2D:4D)
   * varies between people and is not read.
   */
  export function fingerOrder(name: string, side: "left" | "right", d: Record<Finger, IDigit>): IRow[] {
    const len: (f: Finger) => number = (f: Finger): number => d[f].length;
    return [
      {
        person: name,
        site: `${side} middle finger's length along its own path past the longest other finger's, mm`,
        value: len("Middle") - Math.max(len("Index"), len("Ring"), len("Little")),
        low: 0,
        high: Infinity,
        unit: "mm",
      },
      {
        person: name,
        site: `${side} little finger's length along its own path short of the shortest other finger's, mm`,
        value: Math.min(len("Index"), len("Middle"), len("Ring")) - len("Little"),
        low: 0,
        high: Infinity,
        unit: "mm",
      },
    ];
  }
}
