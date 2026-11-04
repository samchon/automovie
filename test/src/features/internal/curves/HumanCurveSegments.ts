import type { IAutoMovieHumanParameters } from "../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanAnatomy } from "../HumanAnatomy";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import type { HumanCurveJoints } from "./HumanCurveJoints";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
const A: typeof HumanAnatomy = HumanAnatomy;

/**
 * The arm's bones against the person's own arm lengths (catalog rule SEG-1):
 * the joint centres the pose evaluator places at the neutral stand where the
 * person's acromion-radiale and radiale-stylion inputs and de Leva 1996's
 * landmark-to-centre offsets put them.
 *
 * de Leva 1996 Table 2 places the shoulder centre 33.7 (women) and 34.5
 * (men) mm below the acromion, the elbow centre 13.9 and 14.3 mm above
 * radiale (on acromion-radiale) or 16.6 and 16.8 mm (on radiale-stylion), and
 * the wrist centre 1.5 mm distal of stylion. So the shoulder-to-elbow centre
 * length is acromion-radiale less 47.6 (women) or 48.8 (men) mm, which
 * reproduces his Table 4 upper arm of 275.1 mm from Table 1's 322.7 mm, and
 * the elbow-to-wrist centre length is radiale-stylion plus 18.1 or 18.3 mm.
 */
export namespace HumanCurveSegments {
  /** Shoulder-to-elbow centre length less acromion-radiale, mm, by sex (de Leva 1996 Table 2). */
  export const UPPER: Record<"female" | "male", number> = { female: -(33.7 + 13.9), male: -(34.5 + 14.3) };

  /** Elbow-to-wrist centre length less radiale-stylion, mm, by sex (de Leva 1996 Table 2). */
  export const FORE: Record<"female" | "male", number> = { female: 16.6 + 1.5, male: 16.8 + 1.5 };

  /**
   * Allowance, mm: ANSUR II's allowable errors of acromion-radiale (4 mm) and
   * radiale-stylion (6 mm), each with the 1 mm difference between de Leva's
   * two offsets for one landmark.
   */
  export const ERROR: Record<"upper" | "fore", number> = { upper: 4 + 1, fore: 6 + 1 };

  /** The segment rows of one person's neutral joints. */
  export function rows(person: string, params: IAutoMovieHumanParameters, sex: "female" | "male", j: HumanCurveJoints.Joints): IRow[] {
    const out: IRow[] = [];
    const c: IAutoMovieHumanParameters["body"]["anatomy"] = params.body.anatomy;
    const at: (bone: string) => V3 = (bone: string): V3 => {
      const p: V3 | undefined = j.get(bone);
      if (p === undefined) throw new Error(`no ${bone} joint`);
      return p;
    };
    for (const side of ["left", "right"] as const) {
      const shoulder: V3 = at(`${side}UpperArm`);
      const elbow: V3 = at(`${side}LowerArm`);
      const wrist: V3 = at(`${side}Hand`);
      if (c.upperArmLength !== undefined) {
        const expected: number = c.upperArmLength + UPPER[sex];
        out.push({ person, site: `${side} shoulder-to-elbow centre length against acromion-radiale less de Leva's offsets, mm (SEG-1)`, value: A.dist(shoulder, elbow), low: expected - ERROR.upper, high: expected + ERROR.upper, unit: "mm" });
      }
      if (c.forearmLength !== undefined) {
        const expected: number = c.forearmLength + FORE[sex];
        out.push({ person, site: `${side} elbow-to-wrist centre length against radiale-stylion plus de Leva's offsets, mm (SEG-1)`, value: A.dist(elbow, wrist), low: expected - ERROR.fore, high: expected + ERROR.fore, unit: "mm" });
      }
    }
    return out;
  }

  /**
   * The joints' vertical order at the anatomical neutral (catalog rule
   * LMK-1 on the skeleton): head above the neck, the neck above the
   * shoulders, the shoulders above the chest's joint, the chest above the
   * lumbar joint, that above the hips, the hips above the knees, the knees
   * above the ankles; with the arms hanging, the shoulder above the elbow,
   * the elbow above the wrist and the wrist above the knee (ANSUR II joint
   * heights: shoulder 0.799 S, elbow 0.637, wrist 0.487, hip 0.521, knee
   * 0.287, ankle 0.039 for women; men alike). Each gap must exceed 1 mm.
   */
  export function order(person: string, j: HumanCurveJoints.Joints): IRow[] {
    const out: IRow[] = [];
    const y: (bone: string) => number = (bone: string): number => {
      const p: V3 | undefined = j.get(bone);
      if (p === undefined) throw new Error(`no ${bone} joint`);
      return p[1];
    };
    const above: (upper: string, lower: string) => void = (upper: string, lower: string): void => {
      out.push({ person, site: `${upper} above ${lower} at neutral, mm (LMK-1)`, value: y(upper) - y(lower), low: 1, high: Infinity, unit: "mm" });
    };
    for (const [u, l] of [["head", "neck"], ["neck", "chest"], ["chest", "spine"], ["spine", "hips"]] as const) above(u, l);
    for (const side of ["left", "right"] as const) {
      above("neck", `${side}UpperArm`);
      above(`${side}UpperArm`, `${side}LowerArm`);
      above(`${side}LowerArm`, `${side}Hand`);
      above(`${side}Hand`, `${side}LowerLeg`);
      above("hips", `${side}LowerLeg`);
      above(`${side}UpperLeg`, `${side}LowerLeg`);
      above(`${side}LowerLeg`, `${side}Foot`);
    }
    return out;
  }
}
