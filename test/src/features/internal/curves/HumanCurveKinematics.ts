import type { IAutoMovieHumanParameters } from "../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import type { IAutoMovieHumanPose } from "../../../../../packages/human/src/structures/pose/IAutoMovieHumanPose";
import { HumanAnatomy } from "../HumanAnatomy";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
const A: typeof HumanAnatomy = HumanAnatomy;

/**
 * Joint kinematics against their clinical definitions (catalog rules
 * KIN-LG-1, KIN-LG-2, KIN-LG-4, KIN-LG-5, KIN-LG-6, KIN-AR-1, KIN-AR-3): each
 * rule poses one joint through the public pose evaluator and reads where the
 * distal joint moves, in the body frame (forward +X, up +Y, the body's left
 * +Z). Directions follow the AAOS definitions of each motion from the
 * anatomical neutral; a rule reads the sign of a motion, never an amount the
 * construction chose.
 */
export namespace HumanCurveKinematics {
  /** Joint centres by bone, any unit. */
  export type Joints = Map<string, V3>;

  /** The poses the rules read, each moving one joint pair on both sides. */
  export const POSES: Record<string, IAutoMovieHumanPose> = {
    knee: { legs: { left: { knee: { flexion: 90 } }, right: { knee: { flexion: 90 } } } },
    hip: { legs: { left: { hip: { flexion: 90 } }, right: { hip: { flexion: 90 } } } },
    ankle: { legs: { left: { ankle: { dorsiflexion: 10 } }, right: { ankle: { dorsiflexion: 10 } } } },
    elbow: { arms: { left: { elbow: { flexion: 90 } }, right: { elbow: { flexion: 90 } } } },
    shoulder: { arms: { left: { shoulder: { abduction: 90 } }, right: { shoulder: { abduction: 90 } } } },
  };

  /**
   * Largest sideways swing of the ankle under pure knee flexion, as a share
   * of the shank: `sin 5 deg`, the knee's flexion axis leaving the frontal
   * plane by a few degrees at most (the transepicondylar axis; source note
   * owed, catalog section 6).
   */
  export const SWING: number = Math.sin((5 * Math.PI) / 180);

  /**
   * Largest frontal-plane angle between the femur and the tibia at neutral,
   * degrees: healthy young adults stand at 2.2 degrees of varus, SD 2.5
   * (women) and 2.7 (men) (Tang 2000, `tang-2000-lower-limb-alignment.md`),
   * so 2.326 SD reaches 8.5 degrees of varus and 4.1 of valgus; the angle is
   * read unsigned against the varus end, the wider of the two.
   */
  export const ALIGNMENT: number = 8.5;

  /**
   * The rows of one person from its joint centres at neutral and in each pose.
   *
   * @param person Name in the rows.
   * @param neutral Joint centres at the anatomical neutral.
   * @param posed Joint centres in each of {@link POSES}, by the pose's name.
   */
  export function rows(person: string, neutral: Joints, posed: Record<string, Joints>): IRow[] {
    const out: IRow[] = [];
    const at: (j: Joints, bone: string) => V3 = (j: Joints, bone: string): V3 => {
      const p: V3 | undefined = j.get(bone);
      if (p === undefined) throw new Error(`no ${bone} joint`);
      return p;
    };
    const sign: (site: string, value: number) => void = (site: string, value: number): void => {
      out.push({ person, site, value, low: Number.MIN_VALUE, high: Infinity, unit: "mm" });
    };

    for (const side of ["left", "right"] as const) {
      const lateral: number = side === "left" ? 1 : -1;
      const hip: V3 = at(neutral, `${side}UpperLeg`);
      const knee: V3 = at(neutral, `${side}LowerLeg`);
      const ankle: V3 = at(neutral, `${side}Foot`);
      const shank: number = A.dist(knee, ankle);

      // KIN-LG-1, KIN-LG-2: knee flexion carries the ankle behind the knee, in the thigh's sagittal plane.
      const k: Joints = posed.knee!;
      const kneeDrop: V3 = A.sub(at(k, `${side}Foot`), at(k, `${side}LowerLeg`));
      sign(`${side} knee flexed 90 deg: ankle behind the knee, mm (KIN-LG-1)`, -kneeDrop[0]);
      const swing: number = Math.abs(kneeDrop[2] - (ankle[2] - knee[2]));
      out.push({ person, site: `${side} knee flexed 90 deg: ankle's sideways swing over the shank (KIN-LG-2)`, value: swing / shank, low: 0, high: SWING, unit: "" });

      // KIN-LG-4: at neutral the knee stands on the hip-ankle line in the frontal plane.
      const femur: [number, number] = [knee[2] - hip[2], knee[1] - hip[1]];
      const tibia: [number, number] = [ankle[2] - knee[2], ankle[1] - knee[1]];
      const angle: number = (Math.abs(Math.atan2(femur[0] * tibia[1] - femur[1] * tibia[0], femur[0] * tibia[0] + femur[1] * tibia[1])) * 180) / Math.PI;
      out.push({ person, site: `${side} femur against tibia in the frontal plane at neutral, deg (KIN-LG-4)`, value: angle, low: 0, high: ALIGNMENT, unit: "deg" });

      // KIN-LG-5: hip flexion carries the knee forward.
      const h: Joints = posed.hip!;
      sign(`${side} hip flexed 90 deg: knee ahead of the hip, mm (KIN-LG-5)`, at(h, `${side}LowerLeg`)[0] - at(h, `${side}UpperLeg`)[0]);

      // KIN-LG-6: ankle dorsiflexion raises the toes.
      const a: Joints = posed.ankle!;
      sign(`${side} ankle dorsiflexed 10 deg: hallux tip raised, mm (KIN-LG-6)`, at(a, `${side}HalluxDistal`)[1] - at(neutral, `${side}HalluxDistal`)[1]);

      // KIN-AR-1: elbow flexion carries the wrist forward of the elbow.
      const e: Joints = posed.elbow!;
      sign(`${side} elbow flexed 90 deg: wrist ahead of the elbow, mm (KIN-AR-1)`, at(e, `${side}Hand`)[0] - at(e, `${side}LowerArm`)[0]);

      // KIN-AR-3: shoulder abduction raises the elbow outward.
      const s: Joints = posed.shoulder!;
      sign(`${side} shoulder abducted 90 deg: elbow raised, mm (KIN-AR-3)`, at(s, `${side}LowerArm`)[1] - at(neutral, `${side}LowerArm`)[1]);
      sign(`${side} shoulder abducted 90 deg: elbow outward, mm (KIN-AR-3)`, lateral * (at(s, `${side}LowerArm`)[2] - at(s, `${side}UpperArm`)[2]));
    }
    return out;
  }

  /**
   * SEG-7: the fingertip span with both arms abducted 90 degrees against
   * stature: ANSUR II span over stature 1.019 (SD 0.029) women and 1.033
   * (SD 0.027) men, each sex's own band of 2.326 SD. Each middle fingertip
   * stands on its hand's axis (wrist centre to the third knuckle) at the
   * person's hand length less the 1.5 mm the wrist centre lies distal of
   * stylion (de Leva 1996), since hand length runs from stylion to the
   * middle fingertip (ANSUR II).
   */
  export function span(person: string, abducted: Joints, params: IAutoMovieHumanParameters, sex: "female" | "male", S: number): IRow {
    const [mean, sd]: [number, number] = sex === "female" ? [1.019, 0.029] : [1.033, 0.027];
    const tip: (side: "left" | "right") => V3 = (side: "left" | "right"): V3 => {
      const wrist: V3 = abducted.get(`${side}Hand`)!;
      const knuckle: V3 = abducted.get(`${side}MiddleProximal`)!;
      const length: number = params.extremities?.hands?.[side]?.handLength ?? NaN;
      return A.add(wrist, A.scale(A.unit(A.sub(knuckle, wrist)), length - 1.5));
    };
    return { person, site: "fingertip span over stature, both arms abducted 90 degrees (SEG-7)", value: A.dist(tip("left"), tip("right")) / S, low: mean - 2.326 * sd, high: mean + 2.326 * sd, unit: "" };
  }

  /**
   * ANSUR II joint-centre heights at the standing neutral, arms hanging, on
   * stature S in mm (`packages/human/docs/anatomy/skeleton.md`): each fit's
   * intercept, slope and residual SD by sex.
   */
  export const HEIGHTS: Record<"female" | "male", Record<"elbow" | "wrist", readonly [number, number, number]>> = {
    female: { elbow: [-48.9, 0.6673, 14.7], wrist: [-35.0, 0.5083, 19.9] },
    male: { elbow: [-91.6, 0.6898, 16.5], wrist: [-67.9, 0.5204, 21.5] },
  };

  /**
   * OBS-AR-1: at the anatomical neutral the elbow and wrist centres stand
   * at the heights the person's stature gives them, within 2.326 residual SD
   * of the sex's ANSUR II fit (the 1st to 99th percentile of people of that
   * stature), so the arms hang neither shrugged nor dropped.
   */
  export function heights(person: string, neutral: Joints, sex: "female" | "male", S: number): IRow[] {
    const out: IRow[] = [];
    for (const side of ["left", "right"] as const)
      for (const [joint, bone] of [["elbow", `${side}LowerArm`], ["wrist", `${side}Hand`]] as const) {
        const [a, b, sd]: readonly [number, number, number] = HEIGHTS[sex][joint];
        const expected: number = a + b * S;
        const p: V3 | undefined = neutral.get(bone);
        out.push({ person, site: `${side} ${joint} centre height at neutral, arms hanging, mm (OBS-AR-1)`, value: p === undefined ? NaN : p[1], low: expected - 2.326 * sd, high: expected + 2.326 * sd, unit: "mm" });
      }
    return out;
  }
}
