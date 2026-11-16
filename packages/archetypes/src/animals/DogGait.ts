import { DogBody } from "./DogBody";
import { HorseGait } from "./HorseGait";
import type { QuadrupedGait } from "./QuadrupedGait";

/**
 * A provisional dog walk with canine pooled timing and explicit shape gaps.
 *
 * Light et al. 2010, AJVR 71:997, doi:10.2460/ajvr.71.9.997, measured 56
 * healthy Labradors walking at 0.6–0.9 m/s: stride 1.11 ± 0.13 s and left-fore
 * stance 0.62 s and hind stance 0.56 s. Both rows express one pooled interval;
 * they do not assert speed-stratified measurements or a fitted speed response.
 * The Labrador timing is provisional for these Husky prototypes. No reference
 * height was read for those Labradors, so absolute speeds/times are preserved.
 *
 * Griffin, Main and Farley 2004, JEB 207:3545, doi:10.1242/jeb.01177, report
 * fore contact 15% of a cycle after ipsilateral hind contact in their dogs.
 * Rebased to left fore zero, that gives phases LF=0, RH=.35, RF=.5, LH=.85.
 * This additional cohort is not a claim of paired Husky gait measurements.
 * The shared cycle retains the LF stride mean; the paper's separately averaged
 * hind stride mean and duty percentages are not asserted to be identical.
 *
 * The existing horse walk's fold, clearance, body oscillation and top-joint
 * follow remain explicitly borrowed construction kinematics, not measured
 * canine motion. The neck is unanimated: the current shared reposed
 * model cannot rotate a collar/lead affordance with the neck's parts, so no
 * unsupported nod is added that would separate contact and physical rope.
 * Trot, canter and gallop are deliberately unavailable.
 * This initial table is not completion of the species-specific gait contract.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Separates the pooled canine timing from every provisional borrowed motion quantity.
 * @evidence contracts/development/design.md#principled-representation Existing gait rows and the absolute-scaling option express exactly the experimental speed interval and pooled seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The actual dog species reads this table through the shared ride, including the separately declared hind stance without a species branch.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No unsupported faster gait or unmeasured reference-height scaling is fabricated.
 */
export namespace DogGait {
  /** Only the source's walking experiment is represented. */
  export const TABLE: QuadrupedGait.ITable = {
    order: ["walk"],
    gaits: {
      walk: {
        ...HorseGait.TABLE.gaits.walk!,
        nod: { range: 0, timing: "support" },
        phases: {
          leftFore: 0,
          rightFore: 0.5,
          leftHind: 0.85,
          rightHind: 0.35,
        },
        rows: [
          {
            speed: 0.6,
            stride: 1.11,
            deviation: 0.13,
            stance: 0.62,
            hindStance: 0.56,
          },
          {
            speed: 0.9,
            stride: 1.11,
            deviation: 0.13,
            stance: 0.62,
            hindStance: 0.56,
          },
        ],
      },
    },

    // Default query height only: absolute scaling never divides by this value.
    reference: DogBody.MEASURES.pet.withers / 100,
    scaling: "absolute",
    hysteresis: 0,
    follow: HorseGait.FOLLOW,
  };
}
