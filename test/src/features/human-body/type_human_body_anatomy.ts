import type {
  AutoMovieHumanBodyBoneId,
  IAutoMovieHumanBodyAnatomicalMeasurements,
  IAutoMovieHumanBodyGluteusMaximusAttachments,
  IAutoMovieHumanBodyParametricParameters,
  IAutoMovieHumanBodyPartResolution,
} from "@automovie/human";

/** Compile-time contract: physical tiers, anatomy, methods and side relations. */
const simple = {
  generatorRevision: "compile-only",
  tier: "simple",
  targets: {
    ageYears: 25,
    standingStatureMetres: 1.7,
    bodyMassKilograms: 60,
  },
} satisfies IAutoMovieHumanBodyParametricParameters;

const detailed = {
  generatorRevision: "compile-only",
  tier: "detailed",
  targets: {
    age: { kind: "target", years: 25 },
    surface: {
      stature: { kind: "target", metres: 1.7 },
      mass: { kind: "target", kilograms: 60 },
    },
    leftLowerLimb: {
      thigh: { femur: { anteversion: { kind: "target", degrees: 12 } } },
    },
  },
} satisfies IAutoMovieHumanBodyParametricParameters;

const incomplete: IAutoMovieHumanBodyParametricParameters = {
  generatorRevision: "compile-only",
  tier: "detailed",
  // @ts-expect-error A renderable detailed request needs stature and mass.
  targets: { age: { kind: "target", years: 25 } },
};

const oldMorph: IAutoMovieHumanBodyParametricParameters = {
  generatorRevision: "compile-only",
  tier: "simple",
  targets: {
    ageYears: 25,
    standingStatureMetres: 1.7,
    bodyMassKilograms: 60,
    // @ts-expect-error A legacy appearance gain is not an anatomical value.
    muscle: 1,
  },
};

const wrongDigit: IAutoMovieHumanBodyAnatomicalMeasurements = {
  leftUpperLimb: {
    hand: {
      thumb: {
        // @ts-expect-error A thumb has no middle phalanx.
        middlePhalanx: { maximumLength: { kind: "target", millimetres: 20 } },
      },
    },
  },
};

const biphalangealFifthToe: IAutoMovieHumanBodyAnatomicalMeasurements = {
  rightLowerLimb: {
    foot: { fifthToe: { phalangealPattern: "biphalangeal" } },
  },
};

const impossibleBiphalangealToe: IAutoMovieHumanBodyAnatomicalMeasurements = {
  rightLowerLimb: {
    foot: {
      fifthToe: {
        phalangealPattern: "biphalangeal",
        // @ts-expect-error A two-phalange ray has no separate middle bone.
        middlePhalanx: { boneVolume: { kind: "target", millilitres: 1 } },
      },
    },
  },
};

const wrongVolumeMethod: IAutoMovieHumanBodyAnatomicalMeasurements = {
  pelvis: {
    leftHip: {
      gluteusMaximus: {
        muscleBellyVolume: {
          kind: "observed",
          millilitres: 550,
          // @ts-expect-error A radiograph cannot segment a 3D muscle volume.
          modality: "radiograph",
          acquisitionPosture: "standing",
        },
      },
    },
  },
};

const projectedHipDistance: IAutoMovieHumanBodyAnatomicalMeasurements = {
  pelvis: {
    interFemoralHeadDistance: {
      kind: "observed",
      millimetres: 170,
      // @ts-expect-error A 2D projection is not a 3D head-centre distance.
      modality: "radiograph",
      acquisitionPosture: "supine",
    },
  },
};

const wrongSide: IAutoMovieHumanBodyGluteusMaximusAttachments<"left"> = {
  origins: [
    {
      // @ts-expect-error This origin belongs to the opposite coxal bone.
      structure: "rightCoxalBone",
      site: "posteriorIlium",
    },
  ],
  insertions: [{ structure: "leftFemur", site: "glutealTuberosity" }],
};

// @ts-expect-error The thumb has no generated middle-phalangeal bone ID.
const wrongBone: AutoMovieHumanBodyBoneId = "leftThumbMiddlePhalanx";

const wrongResult: Extract<
  IAutoMovieHumanBodyPartResolution,
  { id: "leftFemur" }
> = {
  id: "leftFemur",
  status: "resolved",
  source: "measurement-conditioned",
  generatorRevision: "compile-only",
  validation: {
    cohort: "compile-only",
    subjects: 2,
    ageYears: [20, 40],
    statureMetres: [1.5, 2],
    bodyMassIndex: [18, 30],
    posture: "standing",
    meanSurfaceErrorMillimetres: 1,
    p95SurfaceErrorMillimetres: 2,
  },
  value: {
    tissue: "bone",
    // @ts-expect-error A right femur cannot fulfill the left femur result.
    id: "rightFemur",
    solids: [{ positionsMetres: [], tetrahedra: [], boundaryTriangles: [], volumeCubicMetres: 1 }],
  },
};

void [simple, detailed, incomplete, oldMorph, wrongDigit, biphalangealFifthToe, impossibleBiphalangealToe, wrongVolumeMethod, projectedHipDistance, wrongSide, wrongBone, wrongResult];
