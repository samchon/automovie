import { AutoMovieArchetypeEquineGait } from "../AutoMovieArchetypeEquineGait";
import type { AutoMovieArchetypeQuadrupedGait } from "../AutoMovieArchetypeQuadrupedGait";
import { CatBody } from "./CatBody";
import * as CatGaitData from "./internal/CatGaitData";

/*
 * The representative overground level walk of an adult domestic cat.
 *
 * Verdugo et al. 2013 (https://doi.org/10.1186/1746-6148-9-129), Table 3,
 * reports a 0.80 ± 0.09 s male fore stride at a cohort mean of 0.63 m/s, with
 * separately averaged fore and hind stance fractions of 59.51% and 54.87%. Both
 * fractions use the one representative clock here. Published hind stride
 * duration and independent absolute stance means are separate observations. The
 * measured trial window does not establish a speed response.
 *
 * Audet et al. 2026 (https://doi.org/10.1152/jn.00240.2026) report mean
 * overground same-side fore contact 20.60% of a cycle after hind contact across
 * speeds. Use half-cycle left/right symmetry and rebase to left fore. Farrell
 * et al. 2015 (https://doi.org/10.1152/jn.00510.2014), Figure 3, observes
 * alternating two- and three-paw support during unconstrained walking. Borrowed
 * fold, lift, bob and top-joint follow are construction proxies. Head rotation
 * is unanimated. The source clocks and body come from separate groups and are
 * used without stature scaling.
 */
export namespace CatGait {
  /*
   * Level walking at the measured mean speed in metres per second, with
   * separate diagonal touchdown phases and fore and hind support fractions.
   */
  export const TABLE: AutoMovieArchetypeQuadrupedGait.ITable = {
    order: ["walk"],
    gaits: {
      walk: {
        ...AutoMovieArchetypeEquineGait.TABLE.gaits.walk!,
        nod: { range: 0, timing: "support" },
        phases: {
          leftFore: 0,
          rightFore: 0.5,
          leftHind: 1 - CatGaitData.FORE_LAG,
          rightHind: 0.5 - CatGaitData.FORE_LAG,
        },
        rows: [
          {
            speed: 0.63,
            stride: CatGaitData.STRIDE,
            deviation: 0.09,
            stance: CatGaitData.STRIDE * 0.5951,
            hindStance: CatGaitData.STRIDE * 0.5487,
          },
        ],
      },
    },
    reference: CatBody.REFERENCE.withers,
    scaling: "absolute",
    hysteresis: 0,
    follow: AutoMovieArchetypeEquineGait.FOLLOW,
  };
}
