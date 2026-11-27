import { AutoMovieArchetypeBand } from "../../core";
import { type AutoMovieArchetypeEquine } from "../AutoMovieArchetypeEquine";
import { AutoMovieArchetypeEquineGait } from "../AutoMovieArchetypeEquineGait";
import type { AutoMovieArchetypeQuadrupedGait } from "../AutoMovieArchetypeQuadrupedGait";

/*
 * The measured Icelandic cohort and the extra gaits a film author may select.
 */
export namespace EquineIcelandicProfile {
  /*
   * Measured mature Icelandic horses, Jensen et al. 2019 Table 2.
   */
  const JENSEN: string =
    "Jensen et al. 2019, Acta Vet Scand 61:63 Table 2, 43 adult Icelandic horses (https://doi.org/10.1186/s13028-019-0498-5)";

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
   * The authored even four beat sequence, continuing support across successive
   * steps.
   */
  const TOLT: AutoMovieArchetypeQuadrupedGait.IGait = {
    ...AutoMovieArchetypeEquineGait.TABLE.gaits.walk!,
    phases: { leftFore: 0, rightFore: 0.5, leftHind: 0.75, rightHind: 0.25 },
    rows: [
      row(1.5, 659, 85, 295, 326),
      row(2, 587, 71, 262, 285),
      row(2.5, 583, 74, 264, 317),
      row(3, 571, 48, 254, 285),
      row(3.5, 538, 32, 225, 253),
      row(4, 524, 28, 210, 229),
      row(4.5, 501, 28, 194, 207),
      row(5, 486, 21, 184, 194),
      row(5.5, 479, 24, 168, 186),
      row(6, 468, 18, 157, 181),
      row(6.5, 449, 24, 138, 158),
      row(7.5, 422, 10, 119, 139),
    ],
  };

  /*
   * The flying end of measured pace. Model the near-synchronous lateral pairs
   * as coincident.
   */
  const PACE: AutoMovieArchetypeQuadrupedGait.IGait = {
    bob: AutoMovieArchetypeEquineGait.TABLE.gaits.trot!.bob,
    nod: AutoMovieArchetypeEquineGait.TABLE.gaits.trot!.nod,
    fold: AutoMovieArchetypeEquineGait.TABLE.gaits.trot!.fold,
    lift: AutoMovieArchetypeEquineGait.TABLE.gaits.trot!.lift,
    phases: { leftFore: 0, rightFore: 0.5, leftHind: 0, rightHind: 0.5 },
    rows: [
      row(7, 444, 25, 138, 148),
      row(7.5, 431, 29, 132, 147),
      row(8, 426, 25, 125, 138),
      row(8.5, 427, 23, 128, 131),
      row(9, 399, 16, 126, 122),
      row(9.5, 400, 14, 114, 121),
      row(10, 389, 8, 113, 125),
      row(10.5, 386, 21, 110, 117),
    ],
  };

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
      tolt: TOLT,
      pace: PACE,
    },
  };

  /*
   * Convert observed milliseconds into a pure row in seconds.
   */
  function row(
    speed: number,
    period: number,
    spread: number,
    fore: number,
    hind: number,
  ): AutoMovieArchetypeQuadrupedGait.IRow {
    return {
      speed,
      stride: period / 1_000,
      deviation: spread / 1_000,
      stance: fore / 1_000,
      hindStance: hind / 1_000,
    };
  }
}
