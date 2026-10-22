import type { IAutoMovieHumanParameters } from "../../../human/src/structures/IAutoMovieHumanParameters";

/** Authored f2 example in the Human parameter units; null measurements remain unknown.
 *
 */
export const f2: IAutoMovieHumanParameters = {
  body: {
    controls: {
      height: {
        value: 1703.5589599609375,
        pinned: true,
      },
      fat: {
        value: -0.5042912364006042,
        pinned: true,
      },
      masculineFeminine: {
        value: 0.7907429337501526,
        pinned: true,
      },
      muscularity: {
        value: 0.15562009811401367,
        pinned: true,
      },
      chest: {
        value: 919.1614532470703,
        pinned: false,
      },
      bustSpan: {
        value: 186.75151824951172,
        pinned: false,
      },
      underbust: {
        value: 741.2198638916016,
        pinned: false,
      },
      frontInterscyeLength: {
        value: 328.59004974365234,
        pinned: false,
      },
      neckToWaist: {
        value: 349.1606140136719,
        pinned: false,
      },
      acrossShoulder: {
        value: 303.9740562438965,
        pinned: false,
      },
      shoulderToApex: {
        value: 268.69110107421875,
        pinned: false,
      },
      waist: {
        value: Number("681.0659790039062"),
        pinned: false,
      },
      hip: {
        value: 1006.4704132080078,
        pinned: false,
      },
      highHip: {
        value: 856.5824127197266,
        pinned: false,
      },
      neckBase: {
        value: 349.5635223388672,
        pinned: false,
      },
      neck: {
        value: 331.35772705078125,
        pinned: false,
      },
      neckLength: {
        value: 91.32719039916992,
        pinned: false,
      },
      upperArmLength: {
        value: 326.64955139160156,
        pinned: false,
      },
      lowerArmLength: {
        value: 246.33581161499023,
        pinned: false,
      },
      bicep: {
        value: 293.9323425292969,
        pinned: false,
      },
      elbow: {
        value: 240.5398178100586,
        pinned: false,
      },
      wrist: {
        value: 145.31728744506836,
        pinned: false,
      },
      forearm: {
        value: 234.40244674682617,
        pinned: false,
      },
      inseam: {
        value: 736.4272308349609,
        pinned: false,
      },
      thigh: {
        value: 568.3276748657227,
        pinned: false,
      },
      knee: {
        value: 331.46873474121094,
        pinned: false,
      },
      calf: {
        value: 355.2852249145508,
        pinned: false,
      },
      handCircumference: {
        value: 190.85552215576172,
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
    length: 182.0106077194214,
    cephalicIndex: 78.98439919046153,
    circumference: 561.1109904771974,
    height: 227.43331909179688,
    faceHeight: 113.91324454136128,
    faceWidth: 130.18957982114733,
    mandibularWidth: 115.62324689283679,
    minimumFrontalWidth: 91.62913683833455,
    mouthOpening: 48,
    mandibularLaterotrusion: 9,
    face: {
      eyePair: {
        left: {
          palpebralFissureLength: 33,
          palpebralFissureHeight: 10.51025390625,
        },
        right: {
          palpebralFissureLength: 33,
          palpebralFissureHeight: 10.511016845703125,
        },
      },
      intercanthalWidth: 32,
      nose: {
        width: 31.845096349716187,
        height: 45.99212646484375,
        protrusion: 4.5810329552852735,
      },
      mouth: {
        width: 54,
        upperVermilionHeight: 6,
        lowerVermilionHeight: 10,
      },
    },
    earPair: {
      left: {
        length: 57.86956787109375,
        breadth: 31.975817680358887,
        protrusion: 16.828594207763672,
      },
      right: {
        length: 57.394561767578125,
        breadth: 32.682044506073,
        protrusion: 16.092510223388672,
      },
    },
  },
  extremities: {
    hands: {
      left: {
        palmLength: 82.91030881586363,
        handLength: 159.0197910890635,
        handBreadth: 61.76422546373127,
        thumbLength: 70.72526214679591,
      },
      right: {
        palmLength: 82.91038074678414,
        handLength: 159.0199320272517,
        handBreadth: 61.76432533595288,
        thumbLength: 70.72522840503292,
      },
    },
    feet: {
      left: {
        footLength: 186.86891578247474,
        footBreadth: 95.382508993088,
        ankleHeight: 78.54168458181431,
      },
      right: {
        footLength: 186.87607073104544,
        footBreadth: 95.20917274894023,
        ankleHeight: 78.50128912955795,
      },
    },
  },
} satisfies IAutoMovieHumanParameters;
