import { AutoMovieArchetypeBand } from "../core";
import { type AutoMovieArchetypeEquine } from "./AutoMovieArchetypeEquine";
import { AutoMovieArchetypeEquineGait } from "./AutoMovieArchetypeEquineGait";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";

/**
 * The ambling breeds' extra gaits, each a four-beat lateral-sequence stepping
 * gait a horse takes only when its breed declares it: the Tennessee Walking
 * Horse's running walk, the racking horse's rack, the Missouri Fox Trotter's
 * fox trot, the Peruvian Paso's paso llano and the Paso Fino's paso corto.
 *
 * Source for the measured clocks: "Laterally Coordinated Gaits in the Modern
 * Horse (Equus ferus caballus)", IntechOpen chapter 83285
 * (https://www.intechopen.com/chapters/83285), its text, Table 3 and
 * supplementary Tables S2 and S7, which also summarise the literature
 * (Nicodemus and Clayton 2003, Appl Anim Behav Sci 80:133, among others). A
 * footfall's phase follows the lateral advanced placement L, the share of a
 * stride by which each hind lands before its own side's fore: the left hind at
 * 1 - L, the right fore at one half and the right hind at one half less L, from
 * the left fore's landing.
 */
export namespace AutoMovieArchetypeEquineGaitedProfile {
  /** The ambling breeds. */
  export type Breed =
    | "walking"
    | "racking"
    | "foxTrotter"
    | "peruvian"
    | "pasoFino";

  /** The breeds, each also a horse's `breed` option. */
  export const BREEDS: readonly Breed[] = [
    "walking",
    "racking",
    "foxTrotter",
    "peruvian",
    "pasoFino",
  ];

  /**
   * Give the horse the gaited cohort's height band and names; the body, girth
   * and mass laws stay the horse's.
   *
   * @param base The ordinary horse's profile.
   * @returns The gaited profile.
   */
  export function shape(
    base: AutoMovieArchetypeEquine.IProfile,
  ): AutoMovieArchetypeEquine.IProfile {
    return {
      ...base,
      names: {
        saddle: "gaited saddle horse",
        harness: "gaited driving horse",
        both: "gaited postilion horse",
        pack: "gaited pack horse",
        bare: "untacked gaited horse",
      },
      bands: {
        ...base.bands,
        withersHeight: AutoMovieArchetypeBand.metres(1.42, 1.63, BAND),
      },
    };
  }

  /** The band's provenance. */
  const BAND: string =
    "the usual 1.42 to 1.63 m of the Tennessee Walking Horse, racking horse, Missouri Fox Trotter, Peruvian Paso and Paso Fino registries, provisional";

  /**
   * The gaited cohorts' height at the withers, metres: 1.52 m (15 hands), the
   * middle of these breeds' usual 1.42 to 1.63 m, standing for the unreported
   * heights of the measured horses; provisional. Their clocks are reduced to
   * `AutoMovieArchetypeEquineGait.REFERENCE` by the table's own dynamic
   * similarity.
   */
  export const COHORT: number = 1.52;

  /** The reduction of the cohort's clocks to the table's reference height. */
  const REDUCE: number = Math.sqrt(
    COHORT / AutoMovieArchetypeEquineGait.REFERENCE,
  );

  /**
   * Running walk (Tennessee Walking Horse): the literature's 2.7 to 4.5 m/s,
   * strides of 0.75 to 0.68 s and hind duty factors 0.58 to 0.52, paired slow
   * with long; the fore stance 0.91 of the hind's (author data); lateral
   * advanced placement 0.222 (author mean). No suspension.
   */
  const RUNNING_WALK: AutoMovieArchetypeQuadrupedGait.IGait = gait(0.222, [
    row(2.7, 0.75, 0.58, 0.91),
    row(4.5, 0.68, 0.52, 0.91),
  ]);

  /**
   * Rack (racking horse, fast rack): the authors' mean stride 0.53 s, hind duty
   * factor 0.48 and fore-to-hind stance 0.93, at both ends of the fast rack's
   * 3.9 to 7.6 m/s, provisional pairing; lateral advanced placement 0.212
   * (author mean). No four-limb suspension.
   */
  const RACK: AutoMovieArchetypeQuadrupedGait.IGait = gait(0.212, [
    row(3.9, 0.53, 0.48, 0.93),
    row(7.6, 0.53, 0.48, 0.93),
  ]);

  /**
   * Fox trot (Missouri Fox Trotter): stride 0.62 s and fore-to-hind stance 0.86
   * (author data, Table S7) over the discussion's 3.0 to 3.7 m/s; lateral
   * advanced placement 0.384, diagonal couplets. The hind duty factor 0.623 is
   * derived: the supports' mean limb count, 2 x 0.628 diagonal + 3 x 0.344
   * tripedal + 1 x 0.028 single, equals twice the fore and hind duty factors'
   * sum.
   */
  const FOX_TROT: AutoMovieArchetypeQuadrupedGait.IGait = gait(0.384, [
    row(3.0, 0.62, 0.623, 0.86),
    row(3.7, 0.62, 0.623, 0.86),
  ]);

  /**
   * Paso llano (Peruvian Paso): two measured horses, Table S2: 2.93 m/s, hind
   * stance 0.565 of the stride and fore 0.84 of the hind; 3.42 m/s, stride 0.57
   * s, hind 0.553 and fore 0.89; the first horse's stride is the authors' 0.58
   * s mean. Lateral advanced placement 0.231, the two horses' mean. No
   * suspension.
   */
  const PASO_LLANO: AutoMovieArchetypeQuadrupedGait.IGait = gait(0.231, [
    row(2.93, 0.58, 0.565, 0.84),
    row(3.42, 0.57, 0.553, 0.89),
  ]);

  /**
   * Paso corto (Paso Fino): classed with the fox trot as a diagonal-couplet
   * stepping gait (Nicodemus and Clayton 2003 as the chapter reports), with no
   * measured clock read; the fox trot's clock and placement stand for it,
   * provisional.
   */
  const PASO_CORTO: AutoMovieArchetypeQuadrupedGait.IGait = FOX_TROT;

  /** Each breed's gait name and gait. */
  const GAITS: Readonly<
    Record<
      Breed,
      readonly [
        AutoMovieArchetypeQuadrupedGait.Gait,
        AutoMovieArchetypeQuadrupedGait.IGait,
      ]
    >
  > = {
    walking: ["runningWalk", RUNNING_WALK],
    racking: ["rack", RACK],
    foxTrotter: ["foxTrot", FOX_TROT],
    peruvian: ["pasoLlano", PASO_LLANO],
    pasoFino: ["pasoCorto", PASO_CORTO],
  };

  /**
   * A breed's table: the ordinary horse's, with its ambling gait explicit-only.
   *
   * @param breed The breed.
   * @returns The table.
   */
  export function table(breed: Breed): AutoMovieArchetypeQuadrupedGait.ITable {
    const [name, entry] = GAITS[breed];
    return {
      ...AutoMovieArchetypeEquineGait.TABLE,
      explicit: [...(AutoMovieArchetypeEquineGait.TABLE.explicit ?? []), name],
      gaits: { ...AutoMovieArchetypeEquineGait.TABLE.gaits, [name]: entry },
    };
  }

  /**
   * A lateral-sequence stepping gait with the walk's carriage, from its lateral
   * advanced placement.
   */
  function gait(
    lateral: number,
    rows: readonly AutoMovieArchetypeQuadrupedGait.IRow[],
  ): AutoMovieArchetypeQuadrupedGait.IGait {
    const phases: Readonly<
      Record<AutoMovieArchetypeQuadrupedBody.Limb, number>
    > = {
      leftFore: 0,
      rightFore: 0.5,
      leftHind: 1 - lateral,
      rightHind: 0.5 - lateral,
    };
    return { ...AutoMovieArchetypeEquineGait.TABLE.gaits.walk!, phases, rows };
  }

  /**
   * A row from a speed, a stride, the hind duty factor and the fore stance's
   * share of the hind's, reduced to the reference height.
   */
  function row(
    speed: number,
    stride: number,
    hindDuty: number,
    foreShare: number,
  ): AutoMovieArchetypeQuadrupedGait.IRow {
    return {
      speed: speed / REDUCE,
      stride: stride / REDUCE,
      deviation: 0,
      stance: (stride * hindDuty * foreShare) / REDUCE,
      hindStance: (stride * hindDuty) / REDUCE,
    };
  }
}
