import { AutoMovieArchetypeBand } from "../../core";
import { type AutoMovieArchetypeEquine } from "../AutoMovieArchetypeEquine";
import { AutoMovieArchetypeEquineGait } from "../AutoMovieArchetypeEquineGait";
import type { AutoMovieArchetypeQuadrupedGait } from "../AutoMovieArchetypeQuadrupedGait";
import * as EquineIcelandicProfileData from "./internal/EquineIcelandicProfileData";

/*
 * The measured Icelandic cohort and the extra gaits a film author may select.
 */
export namespace EquineIcelandicProfile {
  /*
   * Give the existing horse geometry the Icelandic height band and cohort
   * figures.
   * Parameter base: The ordinary producer's shared rig, material and tack profile.
   * Returns: A horse profile with the same producer id, scaled cohort
   * dimensions and distinct visible names.
   */
  export function shape(
    base: AutoMovieArchetypeEquine.IProfile,
  ): AutoMovieArchetypeEquine.IProfile {
    return {
      ...base,
      names: {
        saddle: "Icelandic saddle horse",
        harness: "Icelandic driving horse",
        both: "Icelandic postilion horse",
        pack: "Icelandic pack horse",
        bare: "untacked Icelandic horse",
      },
      bands: {
        ...base.bands,
        withersHeight: AutoMovieArchetypeBand.metres(1.3, 1.43, JENSEN),
      },
      girth: (height: number): number => (height * 1.66) / 1.38,
      mass: 366,
    };
  }

  /*
   * Native Icelandic clock with explicit-only alternate gait rows. Source for
   * both measured gait clocks: Robilliard, Pfau and Wilson 2007, J Exp Biol
   * 210:187, Tables 1 and 2
   * (https://journals.biologists.com/jeb/article/210/2/187/17107/Gait-characterisation-and-classification-in-horses).
   * The common horse's available walk and trot shape ranges are the authored
   * carriage proxies for tölt and pace, respectively. Both new gait tables use
   * left fore/hind stance means and the reported stride period and SD. Table 1
   * describes the distinguishing footfall sequences. Even quarter phases for
   * tölt and exact coincidence for each lateral pace pair are repeatable
   * construction choices for representative takes. The four ordinary gait rules
   * and mean-height scaling remain from the standard table.
   */
  export const TABLE: AutoMovieArchetypeQuadrupedGait.ITable = {
    ...AutoMovieArchetypeEquineGait.TABLE,
    explicit: [
      ...(AutoMovieArchetypeEquineGait.TABLE.explicit ?? []),
      "tolt",
      "pace",
    ],
    gaits: {
      ...AutoMovieArchetypeEquineGait.TABLE.gaits,
      tolt: EquineIcelandicProfileData.TOLT,
      pace: EquineIcelandicProfileData.PACE,
    },
  };

  /*
   * Measured mature Icelandic horses, Jensen et al. 2019 Table 2.
   */
  const JENSEN: string =
    "Jensen et al. 2019, Acta Vet Scand 61:63 Table 2, 43 adult Icelandic horses (https://doi.org/10.1186/s13028-019-0498-5)";
}
