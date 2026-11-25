import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";

/**
 * Look up clinical horse joint-angle observations for a distal bone.
 *
 * The bone identifies its proximal joint. Right-side lookup returns the same
 * study population, with its measured side retained; it asserts no symmetry.
 * These are included landmark angles, not offsets from the model's rest pose.
 * Means, standard deviations and standing extension are not anatomical bounds.
 * Shoulder, hip and axial observations, and every local rotation limit, remain
 * unknown. Skin-marker rays also differ from the model's coarse bone bars.
 *
 * @param bone The bone whose proximal joint is being inspected.
 * @returns Read-only source observations and explicitly unknown runtime limits.
 */
export function AutoMovieArchetypeEquineJointLimits(
  bone: AutoMovieArchetypeQuadrupedBody.Bone,
): AutoMovieArchetypeEquineJointLimits.IReference {
  let joint: AutoMovieArchetypeEquineJointLimits.Joint | null = null;
  switch (bone) {
    case "leftForeRadius":
    case "rightForeRadius":
      joint = "foreElbow";
      break;
    case "leftForeCannon":
    case "rightForeCannon":
      joint = "foreCarpus";
      break;
    case "leftForePastern":
    case "rightForePastern":
      joint = "foreFetlock";
      break;
    case "leftHindTibia":
    case "rightHindTibia":
      joint = "hindStifle";
      break;
    case "leftHindCannon":
    case "rightHindCannon":
      joint = "hindTarsus";
      break;
    case "leftHindPastern":
    case "rightHindPastern":
      joint = "hindFetlock";
      break;
    case "head":
    case "hindquarters":
    case "leftForeScapula":
    case "rightForeScapula":
    case "leftForeHumerus":
    case "leftHindFemur":
    case "neck":
    case "rightForeHumerus":
    case "rightHindFemur":
    case "tail":
    case "trunk":
      joint = null;
      break;
  }

  return joint === null
    ? { joint: null, observations: null, limits: null }
    : {
        joint,
        observations: OBSERVATIONS[joint].map(
          (
            row: AutoMovieArchetypeEquineJointLimits.IObservation,
          ): AutoMovieArchetypeEquineJointLimits.IObservation => ({
            ...row,
            study: { ...row.study },
            flexion: [row.flexion[0], row.flexion[1]],
            extension: [row.extension[0], row.extension[1]],
            reportedRom:
              row.reportedRom === null
                ? null
                : [row.reportedRom[0], row.reportedRom[1]],
          }),
        ),
        limits: null,
      };
}

/** Clinical reference types and comparison of measured included angles. */
export namespace AutoMovieArchetypeEquineJointLimits {
  /** Proximal joints for which the retained primary tables provide observations. */
  export type Joint =
    | "foreElbow"
    | "foreCarpus"
    | "foreFetlock"
    | "hindStifle"
    | "hindTarsus"
    | "hindFetlock";

  /** A reported mean and standard deviation, both in degrees, not endpoints. */
  export type Statistic = readonly [
    meanDegrees: number,
    standardDeviationDegrees: number,
  ];

  /** Acquisition conditions shared by one primary table's observation rows. */
  export interface IStudy {
    /** Persistent primary publication identifier. */
    readonly doi:
      | "10.3389/fvets.2021.752375"
      | "10.3389/fvets.2021.761500"
      | "10.3415/VCOT-15-11-0182";

    /** The table transcribed, not an inferred or secondary table. */
    readonly table: string;

    /** Enrolled population; each observation separately states its table sample. */
    readonly cohort: string;

    /** Sampled limbs; lookup of the opposite side does not change this. */
    readonly side: string;

    /** Reported sedation, with absence of reporting stated explicitly. */
    readonly sedation: string;

    /** Measurement technique and operator/repetition conditions. */
    readonly acquisition: string;

    /** Limits on what these reported observations establish. */
    readonly limitation: string;
  }

  /** One cohort's flexion and extension included-angle statistics. */
  export interface IObservation {
    /** The retained primary table and its acquisition conditions. */
    readonly study: IStudy;

    /** Number of horses stated for this joint by the table/caption. */
    readonly n: number;

    /** Included-angle side and rays/landmarks; smaller means more flexion. */
    readonly angleDefinition: string;

    /** Handler-produced maximal passive flexion, mean and SD in degrees. */
    readonly flexion: Statistic;

    /** Extension mean and SD in degrees under the explicit loading protocol. */
    readonly extension: Statistic;

    /** Whether extension was a standing observation or handler mobilization. */
    readonly extensionProtocol: "full-weight-standing" | "handler-passive";

    /** Separately reported ROM mean and SD in degrees, or null if not reported. */
    readonly reportedRom: Statistic | null;
  }

  /** A bone's available clinical references and unknown local rotation bounds. */
  export type IReference =
    | {
        /** An unsupported proximal joint. */
        readonly joint: null;

        /** No retained observation for this joint. */
        readonly observations: null;

        /** Unknown local bounds on every axis; never an immobile box. */
        readonly limits: null;
      }
    | {
        /** The measured proximal joint. */
        readonly joint: Joint;

        /** Read-only rows in their individual landmark conventions. */
        readonly observations: readonly IObservation[];

        /** Unknown local bounds on every axis; never an immobile box. */
        readonly limits: null;
      };

  /** Position of one supplied included angle relative to one study's means. */
  export interface IComparison {
    /** Source row whose angle convention the caller must reproduce. */
    readonly observation: IObservation;

    /** Caller-measured included angle, degrees within [0, 360]. */
    readonly includedAngle: number;

    /** Pure ordering against the reported endpoint means, inclusive inside. */
    readonly position:
      | "below-flexion-mean"
      | "between-endpoint-means"
      | "above-extension-mean";

    /** (Included angle - flexion mean) / flexion SD; not a probability. */
    readonly flexionStandardDeviations: number;

    /** (Included angle - extension mean) / extension SD; not a probability. */
    readonly extensionStandardDeviations: number;
  }

  /**
   * Compare an independently measured angle in one selected study's convention.
   *
   * Callers must reproduce the selected row's landmark rays and included-angle
   * side. Model-local Euler offsets cannot be passed as included angles. This
   * reports observed differences; it neither admits nor rejects an anatomical
   * pose.
   *
   * @param bone Distal bone identifying the joint.
   * @param studyDoi The source whose angle convention the caller reproduced.
   * @param includedAngle Included landmark angle in degrees within [0, 360].
   * @returns That source's diagnostic, or null for an unmeasured joint.
   * @throws {RangeError} For an invalid angle or a source that did not measure
   *   this joint.
   */
  export function compare(
    bone: AutoMovieArchetypeQuadrupedBody.Bone,
    studyDoi: IStudy["doi"],
    includedAngle: number,
  ): IComparison | null {
    if (!(includedAngle >= 0 && includedAngle <= 360))
      throw new RangeError(
        "An equine included angle must be within [0, 360] degrees",
      );

    const reference: IReference = AutoMovieArchetypeEquineJointLimits(bone);
    if (reference.observations === null) return null;
    const observation: IObservation | undefined = reference.observations.find(
      (row: IObservation): boolean => row.study.doi === studyDoi,
    );
    if (observation === undefined)
      throw new RangeError(
        `The selected study did not measure ${reference.joint}`,
      );

    return {
      observation,
      includedAngle,
      position:
        includedAngle < observation.flexion[0]
          ? "below-flexion-mean"
          : includedAngle > observation.extension[0]
            ? "above-extension-mean"
            : "between-endpoint-means",
      flexionStandardDeviations:
        (includedAngle - observation.flexion[0]) / observation.flexion[1],
      extensionStandardDeviations:
        (includedAngle - observation.extension[0]) / observation.extension[1],
    };
  }
}

/**
 * Primary acquisition conditions; source tables supply aggregate observations
 * only.
 */
const STUDIES: Readonly<
  Record<
    "fore" | "hind" | "goniometry",
    AutoMovieArchetypeEquineJointLimits.IStudy
  >
> = {
  fore: {
    doi: "10.3389/fvets.2021.752375",
    table: "Table 3",
    cohort:
      "11 sound elite endurance horses; 7 geldings/4 mares; age 13.8 +/- 3.2 years; mass 427 +/- 41.1 kg",
    side: "left forelimb",
    sedation: "not reported",
    acquisition:
      "2D skin-marker video; two trained handlers, three repetitions each; static overground passive mobilization",
    limitation:
      "Elbow extension may be underestimated by cooperation. Means and SDs do not establish population bounds.",
  },
  hind: {
    doi: "10.3389/fvets.2021.761500",
    table: "Table 3",
    cohort:
      "11 sound elite Arabian endurance horses; 7 geldings/4 mares; age 13.8 +/- 3.2 years; mass 427 +/- 41.1 kg",
    side: "left hindlimb",
    sedation: "not reported",
    acquisition:
      "2D skin-marker video; two trained handlers, three repetitions; safe passive mobilization without discomfort or loss of balance",
    limitation:
      "Table caption: stifle n=8, tarsus/fetlock n=9; text: nine horses underwent mobilization. Stifle extension text says 141.5; table says 141.4. ROM is retained as reported. Swimming produced more stifle flexion than passive mobilization.",
  },
  goniometry: {
    doi: "10.3415/VCOT-15-11-0182",
    table: "Table 1, goniometric measurements",
    cohort:
      "17 sound Quarter Horses, Thoroughbreds and Tennessee Walking Horses; age 4-19 years; height 139.7-157.5 cm; no radiographic osteoarthritis",
    side: "randomly selected; 12 right limbs, 5 left limbs",
    sedation: "detomidine HCl; article reports 0.2-0.4 micrograms/kg IV",
    acquisition:
      "Three blinded investigators, triplicate plastic goniometry; lifted maximal passive flexion and square full-weight standing extension",
    limitation:
      "Extension is standing posture, not forced maximal extension. Normal sedated light-breed cohort; no universal breed or subject bounds. ROM not reported in Table 1.",
  },
};

/**
 * Each angle definition follows its own study; the two methods use different
 * rays.
 */
const OBSERVATIONS: Readonly<
  Record<
    AutoMovieArchetypeEquineJointLimits.Joint,
    readonly AutoMovieArchetypeEquineJointLimits.IObservation[]
  >
> = {
  foreElbow: [
    {
      study: STUDIES.fore,
      n: 9,
      angleDefinition:
        "Dorsal angle: ulnar carpal bone, lateral humeral epicondyle, greater humeral tubercle; vertex at humeral epicondyle.",
      flexion: [58.1, 8.2],
      extension: [129.8, 9.4],
      extensionProtocol: "handler-passive",
      reportedRom: [71.7, 11.6],
    },
  ],
  foreCarpus: [
    {
      study: STUDIES.fore,
      n: 9,
      angleDefinition:
        "Palmar angle: lateral metacarpal epicondyle, ulnar carpal bone, lateral humeral epicondyle; vertex at ulnar carpal bone.",
      flexion: [30.6, 4.9],
      extension: [184.1, 3.1],
      extensionProtocol: "full-weight-standing",
      reportedRom: [153.5, 4.3],
    },
    {
      study: STUDIES.goniometry,
      n: 17,
      angleDefinition:
        "Flexion-side angle at the carpal axis; proximal ray along lateral antebrachium midpoint to radial tuberosity; distal ray along third metacarpal shaft.",
      flexion: [31, 4],
      extension: [183, 3],
      extensionProtocol: "full-weight-standing",
      reportedRom: null,
    },
  ],
  foreFetlock: [
    {
      study: STUDIES.fore,
      n: 9,
      angleDefinition:
        "Palmar angle: lateral hoof wall, lateral metacarpal epicondyle, ulnar carpal bone; vertex at metacarpal epicondyle.",
      flexion: [120.4, 7.7],
      extension: [218.2, 5.1],
      extensionProtocol: "full-weight-standing",
      reportedRom: [97.7, 5.9],
    },
    {
      study: STUDIES.goniometry,
      n: 17,
      angleDefinition:
        "Flexion-side angle at fetlock axis; rays along third metacarpal shaft and proximal phalanx toward lateral middle-phalangeal eminence.",
      flexion: [120, 4],
      extension: [210, 6],
      extensionProtocol: "full-weight-standing",
      reportedRom: null,
    },
  ],
  hindStifle: [
    {
      study: STUDIES.hind,
      n: 8,
      angleDefinition:
        "Caudal angle: lateral talar tubercle, lateral femoral epicondyle, greater femoral trochanter; vertex at femoral epicondyle.",
      flexion: [79.9, 12.7],
      extension: [141.4, 11.5],
      extensionProtocol: "handler-passive",
      reportedRom: [60.9, 13.9],
    },
  ],
  hindTarsus: [
    {
      study: STUDIES.hind,
      n: 9,
      angleDefinition:
        "Dorsal/cranial angle: lateral metatarsal epicondyle, lateral talar tubercle, lateral femoral epicondyle; vertex at talar tubercle.",
      flexion: [44.9, 4.7],
      extension: [155.1, 6.2],
      extensionProtocol: "full-weight-standing",
      reportedRom: [110.2, 6.5],
    },
    {
      study: STUDIES.goniometry,
      n: 17,
      angleDefinition:
        "Flexion-side angle at tarsal axis; proximal ray along tibial shaft toward lateral tibial condyle; distal ray along third metatarsal shaft.",
      flexion: [40, 7],
      extension: [159, 5],
      extensionProtocol: "full-weight-standing",
      reportedRom: null,
    },
  ],
  hindFetlock: [
    {
      study: STUDIES.hind,
      n: 9,
      angleDefinition:
        "Plantar angle: lateral hoof wall, lateral metatarsal epicondyle, lateral talar tubercle; vertex at metatarsal epicondyle.",
      flexion: [89.5, 7.1],
      extension: [212.7, 4.3],
      extensionProtocol: "full-weight-standing",
      reportedRom: [123.7, 5.7],
    },
    {
      study: STUDIES.goniometry,
      n: 17,
      angleDefinition:
        "Flexion-side angle at fetlock axis; rays along third metatarsal shaft and proximal phalanx toward lateral middle-phalangeal eminence.",
      flexion: [95, 5],
      extension: [206, 7],
      extensionProtocol: "full-weight-standing",
      reportedRom: null,
    },
  ],
};
