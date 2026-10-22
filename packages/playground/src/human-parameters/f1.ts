import type { IAutoMovieHumanParameters } from "../../../human/src/structures/IAutoMovieHumanParameters";

/** Authored f1 example in the Human parameter units; null measurements remain unknown.
 *
 * @evidence contracts/common.md#principled-implementation The literal preserves the published example fields and values and satisfies the existing generator input types.
 * @evidence contracts/common.md#clear-and-simple-design One abbreviated example is owned by one typed module.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No generated shape, per-person control-point table or source fallback is embedded here.
 * @evidence contracts/common.md#meaningful-documentation States that this is an authored parameter example and retains the existing null and unit semantics.
 * @evidence contracts/performance.md#efficient-algorithms The literal is allocated once when Vite loads its module; no geometry is generated.
 * @evidence contracts/performance.md#reuse-equivalent-work Both parameter JSON routes serialize this typed example through HumanImageRegistry without an independent JSON copy.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Vite owns module retention; the literal owns no external handles or files.
 */
export const f1: IAutoMovieHumanParameters = {
  body: {
    controls: {
      height: {
        value: 1696.9285583496094,
        pinned: true,
      },
      fat: {
        value: -0.6499820947647095,
        pinned: true,
      },
      masculineFeminine: {
        value: 0.9449925422668457,
        pinned: true,
      },
      muscularity: {
        value: 0.07685086876153946,
        pinned: true,
      },
      chest: {
        value: Number("851.5725708007812"),
        pinned: false,
      },
      bustSpan: {
        value: 180.9891700744629,
        pinned: false,
      },
      underbust: {
        value: 741.7649841308594,
        pinned: false,
      },
      frontInterscyeLength: {
        value: 324.3755340576172,
        pinned: false,
      },
      neckToWaist: {
        value: 330.7135772705078,
        pinned: false,
      },
      acrossShoulder: {
        value: 296.65414810180664,
        pinned: false,
      },
      shoulderToApex: {
        value: 243.9493751525879,
        pinned: false,
      },
      waist: {
        value: 666.32080078125,
        pinned: false,
      },
      hip: {
        value: 983.2448577880859,
        pinned: false,
      },
      highHip: {
        value: 820.6779479980469,
        pinned: false,
      },
      neckBase: {
        value: 359.11495208740234,
        pinned: false,
      },
      neck: {
        value: 332.83763885498047,
        pinned: false,
      },
      neckLength: {
        value: 79.85565185546875,
        pinned: false,
      },
      upperArmLength: {
        value: 321.1808776855469,
        pinned: false,
      },
      lowerArmLength: {
        value: 241.26361846923828,
        pinned: false,
      },
      bicep: {
        value: 262.2895050048828,
        pinned: false,
      },
      elbow: {
        value: 219.84554290771484,
        pinned: false,
      },
      wrist: {
        value: 142.9803466796875,
        pinned: false,
      },
      forearm: {
        value: 227.94408798217773,
        pinned: false,
      },
      inseam: {
        value: 744.5504760742188,
        pinned: false,
      },
      thigh: {
        value: Number("556.6152954101562"),
        pinned: false,
      },
      knee: {
        value: 327.44773864746094,
        pinned: false,
      },
      calf: {
        value: 341.2932586669922,
        pinned: false,
      },
      handCircumference: {
        value: 179.6338653564453,
        pinned: false,
      },
    },
    measurements: {
      height: null,
      chest: null,
      bustSpan: null,
      underbust: null,
      frontInterscyeLength: null,
      neckToWaist: null,
      acrossShoulder: null,
      shoulderToApex: null,
      waist: null,
      hip: null,
      highHip: null,
      neckBase: null,
      neck: null,
      neckLength: null,
      upperArmLength: null,
      lowerArmLength: null,
      bicep: null,
      elbow: null,
      wrist: null,
      forearm: null,
      inseam: null,
      thigh: null,
      knee: null,
      calf: null,
      handCircumference: null,
    },
    diagnostics: {
      rise: null,
      shoulderHeight: null,
    },
  },
  head: {
    length: 174.03330326080322,
    cephalicIndex: 84.6387426358169,
    circumference: 553.157598384104,
    height: 216.1962890625,
    faceHeight: 105.18691739664612,
    faceWidth: 126.630033866968,
    mandibularWidth: 113.70094763251657,
    minimumFrontalWidth: 87.7465237916954,
    mouthOpening: 48,
    mandibularLaterotrusion: 9,
    face: {
      eyePair: {
        left: {
          palpebralFissureLength: 32,
          palpebralFissureHeight: 10.472869873046875,
        },
        right: {
          palpebralFissureLength: 32,
          palpebralFissureHeight: 10.603485107421875,
        },
      },
      intercanthalWidth: 31,
      nose: {
        width: 27.52245783805847,
        height: 44.57237243652344,
        protrusion: 5.605043064464219,
      },
      mouth: {
        width: 47,
        upperVermilionHeight: 8,
        lowerVermilionHeight: 10,
      },
    },
    earPair: {
      left: {
        length: 59.331817626953125,
        breadth: 31.191883981227875,
        protrusion: 24.00130271911621,
      },
      right: {
        length: 60.705108642578125,
        breadth: 31.43091857433319,
        protrusion: 24.8519229888916,
      },
    },
  },
  extremities: {
    hands: {
      left: {
        palmLength: 80.05427979232506,
        handLength: 151.0669116689678,
        handBreadth: 57.271229292681326,
        thumbLength: 68.35595547575947,
      },
      right: {
        palmLength: 80.05431319666398,
        handLength: 151.0670425149865,
        handBreadth: 57.27125918822559,
        thumbLength: 68.35594485848765,
      },
    },
    feet: {
      left: {
        footLength: 176.23597452190864,
        footBreadth: 90.19352375312418,
        ankleHeight: 75.92569320673266,
      },
      right: {
        footLength: 176.2357525111699,
        footBreadth: 90.07814933414397,
        ankleHeight: 75.87674536778414,
      },
    },
  },
} satisfies IAutoMovieHumanParameters;
