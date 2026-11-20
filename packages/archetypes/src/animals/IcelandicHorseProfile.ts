import { ArchetypeBand } from "../core";
import { HorseGait } from "./HorseGait";
import type { QuadrupedGait } from "./QuadrupedGait";
import type { createHorse } from "./createHorse";

/**
 * The measured Icelandic cohort and the extra gaits a film author may select.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies cohort and alternatives, units, and the provenance distinction between measured clocks and posed proxy values.
 * @evidence contracts/development/design.md#principled-representation Measured height and heart girth give a typed horse profile. Repeated stride rows keep fore and hind contact and empirical spread separate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Supplies one actual existing horse producer variant and its alternate gait rows. Leaves the ordinary horse gait order and shared tack and body owners intact.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Only an explicit breed configuration declares this gait capacity. The two styles do not take over automatic ordinary gait selection.
 */
export namespace IcelandicHorseProfile {
  /** Measured mature Icelandic horses, Jensen et al. 2019 Table 2. */
  const JENSEN: string =
    "Jensen et al. 2019, Acta Vet Scand 61:63 Table 2, 43 adult Icelandic horses (https://doi.org/10.1186/s13028-019-0498-5)";

  /**
   * Give the existing horse geometry the Icelandic height band and cohort figures.
   *
   * @param base The ordinary producer's shared rig, material and tack profile.
   * @returns A horse profile with the same producer id, scaled cohort dimensions and distinct visible names.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the measured band, mean girth and mass and transferred body proportions.
   * @evidence contracts/development/implementation.md#principled-implementation Jensen Table 2 reports height 1.30–1.43 m, mean height 1.38 m, mean heart girth 1.66 m and mean mass 366 kg. The proportional girth is an authored size proxy. Mass holds the measured cohort mean.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Replace only the profile fields that carry the actual cohort and keep the standard horse builder.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The scaled horse geometry, mass distribution and tack are existing construction proxies. Cohort variation is claimed only for the measured height band.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant-size profile copy.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the horse rig, contact names and tack entry points.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only the returned static profile and no samples.
   */
  export function shape(base: createHorse.IProfile): createHorse.IProfile {
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
        withersHeight: ArchetypeBand.metres(1.3, 1.43, JENSEN),
      },
      girth: (height: number): number => (height * 1.66) / 1.38,
      mass: 366,
    };
  }

  /** The authored even four beat sequence, continuing support across successive steps. */
  const TOLT: QuadrupedGait.IGait = {
    ...HorseGait.TABLE.gaits.walk!,
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

  /** The flying end of measured pace. Model the near-synchronous lateral pairs as coincident. */
  const PACE: QuadrupedGait.IGait = {
    bob: HorseGait.TABLE.gaits.trot!.bob,
    nod: HorseGait.TABLE.gaits.trot!.nod,
    fold: HorseGait.TABLE.gaits.trot!.fold,
    lift: HorseGait.TABLE.gaits.trot!.lift,
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

  /**
   * Native Icelandic clock with explicit-only alternate gait rows.
   * Source for both measured gait clocks: Robilliard, Pfau and Wilson 2007, J Exp Biol 210:187, Tables 1 and 2 (https://journals.biologists.com/jeb/article/210/2/187/17107/Gait-characterisation-and-classification-in-horses).
   * The common horse's available walk and trot shape ranges are the authored
   * carriage proxies for tölt and pace, respectively. Both new gait tables
   * use left fore/hind stance means and the reported stride period and SD.
   * Table 1 describes the distinguishing footfall sequences. Even quarter
   * phases for tölt and exact coincidence for each lateral pace pair are
   * repeatable construction choices for representative takes. The four ordinary
   * gait rules and mean-height scaling remain from the standard table.
   */
  export const TABLE: QuadrupedGait.ITable = {
    ...HorseGait.TABLE,
    explicit: ["tolt", "pace"],
    gaits: { ...HorseGait.TABLE.gaits, tolt: TOLT, pace: PACE },
  };

  /** Convert observed milliseconds into a pure row in seconds. */
  function row(
    speed: number,
    period: number,
    spread: number,
    fore: number,
    hind: number,
  ): QuadrupedGait.IRow {
    return {
      speed,
      stride: period / 1_000,
      deviation: spread / 1_000,
      stance: fore / 1_000,
      hindStance: hind / 1_000,
    };
  }
}
