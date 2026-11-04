import type { IAutoMovieHumanBodyAnatomy } from "../../../../../packages/human/src/structures/body/IAutoMovieHumanBodyAnatomy";
import type { HumanAnatomy } from "../HumanAnatomy";
import { HumanAnatomyArm } from "../HumanAnatomyArm";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanAnatomyHand } from "../HumanAnatomyHand";
import { HumanAnatomyLeg } from "../HumanAnatomyLeg";
import { HumanAnatomyShared } from "../HumanAnatomyShared";
import { HumanAnatomyTrunk } from "../HumanAnatomyTrunk";

type IRow = HumanAnatomyAudit.IRow;
type ISubject = HumanAnatomyAudit.ISubject;
const { SIDES, SMALL, LARGE } = HumanAnatomyShared;

/**
 * The order of a person's girths, rule ORD-0 of the consistency catalog: the
 * generated skin's girths at their ISO 8559-1 and ANSUR sites stand in the
 * order of the person's own tape inputs. For every pair of tapes whose inputs
 * differ by more than the sum of their two ISO 20685-1:2018 Table 4 errors,
 * the generated pair must differ the same way; a pair closer than that may
 * read either way, since neither tape resolves the difference.
 *
 * The girths are read by the region audits' own site locators, so this rule
 * adds relations between sites, not new sites.
 */
export namespace HumanCurveOrder {
  /** One tape at its site: the generated girth, its input and its allowable error. */
  export interface ITape {
    /** Tape name in rows, with its side for a paired tape. */
    name: string;

    /** Generated girth at the tape's site, mm; NaN when the site was not found. */
    value: number;

    /** The person's input for the tape, mm. */
    input: number;

    /** ISO 20685-1:2018 Table 4 maximum allowable error for that circumference, mm. */
    error: number;
  }

  /**
   * A subject's tapes, one side at a time for the paired limbs: the trunk's
   * and the neck's tapes with each side's arm, leg and hand tapes, so a pair
   * is only ever read within one side of the body.
   */
  export function tapes(subject: ISubject, side: "left" | "right"): ITape[] {
    const c: IAutoMovieHumanBodyAnatomy = subject.params.body.anatomy;
    const S: number = c.stature!;
    const skin: HumanAnatomy.ISkin = subject.bind();
    const t: HumanAnatomyShared.ITrunk = HumanAnatomyTrunk.trunkSites(skin, S);
    const neck: HumanAnatomyShared.INeck = HumanAnatomyTrunk.neckSites(skin, S);
    const arm: HumanAnatomyShared.IArm = HumanAnatomyArm.armSites(skin, side);
    const leg: HumanAnatomyShared.ILeg = HumanAnatomyLeg.legSites(skin, side, { crotch: t.crotch, vertex: HumanAnatomyLeg.vertexHeight(skin) });
    const hand: HumanAnatomyShared.IHand = HumanAnatomyHand.handSites(subject.neutral(), side);
    const out: ITape[] = [];

    // A tape without an input orders nothing.
    const tape: (name: string, value: number, input: number | null, error: number) => void = (name: string, value: number, input: number | null, error: number): void => {
      if (input !== null) out.push({ name, value, input, error });
    };
    tape("chest", t.chest.girth, (c.chestCircumference ?? null), LARGE);
    tape("underbust", t.underbust.girth, (c.underbustCircumference ?? null), LARGE);
    tape("waist", t.waist.girth, (c.waistCircumference ?? null), LARGE);
    tape("high hip", t.highHip.girth, (c.highHipCircumference ?? null), LARGE);
    tape("hip", t.hip.girth, (c.hipCircumference ?? null), LARGE);
    tape("neck", neck.neck, (c.neckCircumference ?? null), SMALL);
    tape("neck base", neck.base, (c.neckBaseCircumference ?? null), SMALL);
    tape(`${side} bicep`, arm.bicep, (c.upperArmCircumference ?? null), SMALL);
    tape(`${side} elbow`, arm.elbow, (c.elbowCircumference ?? null), SMALL);
    tape(`${side} forearm`, arm.forearm, (c.forearmCircumference ?? null), SMALL);
    tape(`${side} wrist`, arm.wrist, (c.wristCircumference ?? null), SMALL);
    tape(`${side} thigh`, leg.thigh, (c.thighCircumference ?? null), LARGE);
    tape(`${side} knee`, leg.knee, (c.kneeCircumference ?? null), SMALL);
    tape(`${side} calf`, leg.calf, (c.calfCircumference ?? null), SMALL);
    tape(`${side} hand circumference`, hand.circumference, (c.handCircumference ?? null), SMALL);
    return out;
  }

  /**
   * The order rows of one subject: for every resolved pair on each side, the
   * generated difference in the input's direction, which must be positive.
   * A midline pair is read once, on the left side's pass.
   */
  export function rows(subject: ISubject): IRow[] {
    const out: IRow[] = [];
    const seen: Set<string> = new Set();
    for (const side of SIDES) {
      const list: ITape[] = tapes(subject, side);
      for (let i: number = 0; i < list.length; i++)
        for (let j: number = i + 1; j < list.length; j++) {
          const a: ITape = list[i]!;
          const b: ITape = list[j]!;
          const key: string = `${a.name}|${b.name}`;
          if (seen.has(key) || Math.abs(a.input - b.input) <= a.error + b.error) continue;
          seen.add(key);

          // The larger input names the pair, so the row reads "larger over smaller".
          const [hi, lo]: [ITape, ITape] = a.input > b.input ? [a, b] : [b, a];
          out.push({
            person: subject.name,
            site: `${hi.name} girth over ${lo.name} girth, inputs ${hi.input.toFixed(1)} over ${lo.input.toFixed(1)}, mm (ORD-0)`,
            value: hi.value - lo.value,
            low: Number.MIN_VALUE,
            high: Infinity,
            unit: "mm",
          });
        }
    }
    return out;
  }
}
