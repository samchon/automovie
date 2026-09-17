/**
 * Independent recipe input for humanFaceFixture unit scenarios.
 * Frozen from the pre-separation arrangement at 0f001f80, these values preserve
 * existing scenario inputs while removing the live portrait-study dependency.
 * They are test inputs, not expected outputs or a fitted anatomical standard.
 * The fixture factory clones this data before exposing it to any scenario.
 * Lengths are millimetres; angular and dimensionless fields follow the public
 * component contracts. Geometry tests independently check resulting behavior.
 */
import type { IAutoMovieHumanFaceDocument } from "@automovie/human";

export const humanFaceRecipeFixture: IAutoMovieHumanFaceDocument["basis"]["recipe"] =
  {
    eye: {
      widthScale: 1.06,
      openingScale: 1.04,
      outerCornerLift: 0,
      socketLift: 0,
      blendReach: 18,
      skinAttachment: "reserve",
      foldWidth: 1.15,
      foldDepth: 0.14,
      upperLidVolume: 0.18,
      lowerLidWidth: 0.55,
      lowerLidVolume: 0,
      aegyoSal: {
        offset: 0.6,
        projection: 0.6,
        width: 23,
        height: 1,
        reach: 24,
        weights: [0.1, 0.55, 0.9, 1, 0.9, 0.55, 0.1],
      },
      lowerLidProfile: {
        sections: [
          {
            at: 0,
            section: {
              margin: {
                offset: 0.16,
                projection: 0.12,
              },
              pretarsalCrest: {
                offset: 0.77,
                projection: 0.016,
              },
              pretarsalLower: {
                offset: 1.3299999999999998,
                projection: 0.006,
              },
              subtarsalInner: {
                offset: 1.89,
                projection: 0.002,
              },
              subtarsalOuter: {
                offset: 2.6599999999999997,
                projection: 0,
              },
              preseptal: {
                offset: 5.2,
                projection: 0,
              },
              attachment: 6.2,
            },
          },
          {
            at: 0.16,
            section: {
              margin: {
                offset: 0.16,
                projection: 0.12,
              },
              pretarsalCrest: {
                offset: 0.9900000000000001,
                projection: 0.048,
              },
              pretarsalLower: {
                offset: 1.71,
                projection: 0.018,
              },
              subtarsalInner: {
                offset: 2.43,
                projection: 0.006,
              },
              subtarsalOuter: {
                offset: 3.42,
                projection: 0,
              },
              preseptal: {
                offset: 5.2,
                projection: 0,
              },
              attachment: 6.2,
            },
          },
          {
            at: 0.34,
            section: {
              margin: {
                offset: 0.16,
                projection: 0.12,
              },
              pretarsalCrest: {
                offset: 1.1,
                projection: 0.0736,
              },
              pretarsalLower: {
                offset: 1.9,
                projection: 0.0276,
              },
              subtarsalInner: {
                offset: 2.7,
                projection: 0.0092,
              },
              subtarsalOuter: {
                offset: 3.8,
                projection: 0,
              },
              preseptal: {
                offset: 5.2,
                projection: 0,
              },
              attachment: 6.2,
            },
          },
          {
            at: 0.5,
            section: {
              margin: {
                offset: 0.16,
                projection: 0.12,
              },
              pretarsalCrest: {
                offset: 1.1,
                projection: 0.08,
              },
              pretarsalLower: {
                offset: 1.9,
                projection: 0.03,
              },
              subtarsalInner: {
                offset: 2.7,
                projection: 0.01,
              },
              subtarsalOuter: {
                offset: 3.8,
                projection: 0,
              },
              preseptal: {
                offset: 5.2,
                projection: 0,
              },
              attachment: 6.2,
            },
          },
          {
            at: 0.66,
            section: {
              margin: {
                offset: 0.16,
                projection: 0.12,
              },
              pretarsalCrest: {
                offset: 1.1,
                projection: 0.0736,
              },
              pretarsalLower: {
                offset: 1.9,
                projection: 0.0276,
              },
              subtarsalInner: {
                offset: 2.7,
                projection: 0.0092,
              },
              subtarsalOuter: {
                offset: 3.8,
                projection: 0,
              },
              preseptal: {
                offset: 5.2,
                projection: 0,
              },
              attachment: 6.2,
            },
          },
          {
            at: 0.84,
            section: {
              margin: {
                offset: 0.16,
                projection: 0.12,
              },
              pretarsalCrest: {
                offset: 0.9900000000000001,
                projection: 0.048,
              },
              pretarsalLower: {
                offset: 1.71,
                projection: 0.018,
              },
              subtarsalInner: {
                offset: 2.43,
                projection: 0.006,
              },
              subtarsalOuter: {
                offset: 3.42,
                projection: 0,
              },
              preseptal: {
                offset: 5.2,
                projection: 0,
              },
              attachment: 6.2,
            },
          },
          {
            at: 1,
            section: {
              margin: {
                offset: 0.16,
                projection: 0.12,
              },
              pretarsalCrest: {
                offset: 0.77,
                projection: 0.016,
              },
              pretarsalLower: {
                offset: 1.3299999999999998,
                projection: 0.006,
              },
              subtarsalInner: {
                offset: 1.89,
                projection: 0.002,
              },
              subtarsalOuter: {
                offset: 2.6599999999999997,
                projection: 0,
              },
              preseptal: {
                offset: 5.2,
                projection: 0,
              },
              attachment: 6.2,
            },
          },
        ],
      },
      lidThickness: 0.18,
      surfaceRadius: 18,
      cornealRadius: 7.8,
      cornealThickness: 0.55,
      cornealRimLift: 0.65,
      cornealBoundary: "limbus",
      lidContact: "cornea",
      lidContactReach: 3,
      irisRadius: 6.1,
      pupilRadius: 2.35,
      irisPigment: {
        base: [0.015, 0.009, 0.005],
        variation: [0.055, 0.03, 0.012],
      },
      tissues: {
        cornerLength: 1.4,
        caruncleProjection: 0.18,
        plicaProjection: 0.08,
        lowerMarginWidth: 0.15,
        lowerMarginLift: 0.035,
      },
      browFibres: 800,
      browProfile: {
        radius: 0.0475,
        radiusStep: 0.0075,
        taper: 0.58,
        clearance: 0.03,
        arch: 0.1,
        outwardBend: 1.4,
        segments: 5,
        rootBand: [0.05, 0.55],
        span: 0.3,
        endFade: [0.12, 0.25],
      },
      upperLashes: 64,
      sampling: {
        eyeColumns: 80,
        eyeRows: 28,
        irisColumns: 84,
        irisRows: 20,
      },
    },
    nose: {
      widthScale: 1,
      depthScale: 0.78,
      tipProjection: 0.85,
      alarProjection: 0.45,
      nostrilWidthScale: 0.88,
      nostrilHeightScale: 0.65,
      nostrilRise: 0,
      nostrilTilt: 8,
      cavityContraction: 0.6,
      rimSupport: 0.1,
      rimRoundness: 0.55,
      cavityOffset: [0, 3, -5],
      blendReach: 14,
    },
    mouth: {
      borderRefinement: "curve",
      widthScale: 1.03,
      openingScale: 0.9,
      cornerLift: 1,
      upperLipProjection: 0,
      lowerLipProjection: 0,
      band: {
        upper: 1.1,
        lower: 1.08,
      },
      section: {
        upperBody: 0.6,
        upperTubercle: 0.2,
        upperTubercleWidth: 0.33,
        lowerBody: 0.6,
        lowerPads: 0.12,
        lowerPadOffset: 0.28,
        lowerPadWidth: 0.26,
      },
      blendReach: 14,
      cavityDepth: 5,
      dentalOffset: -1.15,
      dentalRecess: 3.4,
      dentalDrop: 5.2,
      dentalDepth: 1.5,
      toothGap: 0.08,
      crowns: [
        {
          width: 4.4,
          height: 8,
        },
        {
          width: 5.1,
          height: 8.3,
        },
        {
          width: 6,
          height: 8.8,
          cervicalWidth: 0.72,
          edgeRise: 1.05,
        },
        {
          width: 6.8,
          height: 9.2,
          cervicalWidth: 0.76,
          edgeRise: 0.65,
          contour: {
            mesial: {
              contactHeight: 0.29,
              incisalRise: 0.35,
              cervicalWidth: 0.81,
            },
            distal: {
              contactHeight: 0.43,
              incisalRise: 0.82,
              cervicalWidth: 0.74,
            },
          },
        },
        {
          width: 8.1,
          height: 9.7,
          cervicalWidth: 0.82,
          edgeRise: 0.9,
          contour: {
            mesial: {
              contactHeight: 0.22,
              incisalRise: 0.32,
              cervicalWidth: 0.85,
            },
            distal: {
              contactHeight: 0.35,
              incisalRise: 0.8,
              cervicalWidth: 0.78,
            },
          },
        },
        {
          width: 8.1,
          height: 9.8,
          cervicalWidth: 0.82,
          edgeRise: 0.95,
          contour: {
            mesial: {
              contactHeight: 0.2,
              incisalRise: 0.34,
              cervicalWidth: 0.84,
            },
            distal: {
              contactHeight: 0.36,
              incisalRise: 0.83,
              cervicalWidth: 0.77,
            },
          },
        },
        {
          width: 6.8,
          height: 9.2,
          cervicalWidth: 0.76,
          edgeRise: 0.65,
          contour: {
            mesial: {
              contactHeight: 0.29,
              incisalRise: 0.35,
              cervicalWidth: 0.81,
            },
            distal: {
              contactHeight: 0.43,
              incisalRise: 0.82,
              cervicalWidth: 0.74,
            },
          },
        },
        {
          width: 6,
          height: 8.8,
          cervicalWidth: 0.72,
          edgeRise: 1.05,
        },
        {
          width: 5.1,
          height: 8.3,
        },
        {
          width: 4.4,
          height: 8,
        },
      ],
    },
  };
