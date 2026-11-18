import { CatBody } from "./CatBody";
import { HorseGait } from "./HorseGait";
import type { QuadrupedGait } from "./QuadrupedGait";

/**
 * The representative overground level walk of an adult domestic cat.
 *
 * Verdugo et al. 2013 (https://doi.org/10.1186/1746-6148-9-129), Table 3,
 * reports a 0.80 ± 0.09 s male fore stride at a cohort mean of 0.63 m/s,
 * with separately averaged fore and hind stance fractions of 59.51% and
 * 54.87%. Both fractions use the one representative clock here. Published
 * hind stride duration and independent absolute stance means are separate
 * observations. The measured trial window does not establish a speed response.
 *
 * Audet et al. 2026 (https://doi.org/10.1152/jn.00240.2026) report mean
 * overground same-side fore contact 20.60% of a cycle after hind contact
 * across speeds. Use half-cycle left/right symmetry and rebase to left fore.
 * Farrell et al. 2015 (https://doi.org/10.1152/jn.00510.2014), Figure 3,
 * observes alternating two- and three-paw support during unconstrained walking.
 * Borrowed fold, lift, bob and top-joint follow are construction proxies.
 * Head rotation is unanimated. The source clocks and body come from separate
 * groups and are used without stature scaling.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States measured timing, units, phase reference, cohort transfer and unmeasured pose controls.
 * @evidence contracts/development/design.md#principled-representation One absolute walk point carries a common repeat period, separate stance fractions and lateral-sequence touchdown within the shared gait contract.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The existing quadruped species table and ride consume this data with no new motion solver.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No fitted speed response, faster gait, transition or equine pose claim as feline kinematics.
 */
export namespace CatGait {
  /** Male mean forelimb cycle period in seconds, Verdugo et al., Table 3. */
  const STRIDE: number = 0.8;

  /** Mean ipsilateral hind-to-fore offset, Audet et al., overground trials. */
  const FORE_LAG: number = 0.206;

  /** Level walking at the measured mean speed in metres per second. */
  export const TABLE: QuadrupedGait.ITable = {
    order: ["walk"],
    gaits: {
      walk: {
        ...HorseGait.TABLE.gaits.walk!,
        nod: { range: 0, timing: "support" },
        phases: {
          leftFore: 0,
          rightFore: 0.5,
          leftHind: 1 - FORE_LAG,
          rightHind: 0.5 - FORE_LAG,
        },
        rows: [
          {
            speed: 0.63,
            stride: STRIDE,
            deviation: 0.09,
            stance: STRIDE * 0.5951,
            hindStance: STRIDE * 0.5487,
          },
        ],
      },
    },
    reference: CatBody.REFERENCE.withers,
    scaling: "absolute",
    hysteresis: 0,
    follow: HorseGait.FOLLOW,
  };
}
