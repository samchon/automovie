import type { IAutoMovieHumanHermiteCurve } from "../../lofting/IAutoMovieHumanHermiteCurve";

/**
 * External vermilion boundary of the shared calibration specimen.
 *
 * Exact saved Recovery/Hermite spans from the manifest-selected
 * `head-features-ordered-v3.json`, with named endpoint identities and
 * reversed physical derivatives where the closed traversal reverses a span.
 * These six exterior courses exclude the oral zipper and all inner-mouth
 * arcs. This identifies the f1 colour boundary; it does not establish a
 * multi-specimen shape law or reconstruct external skin from an oral chord.
 * Numbers retain the original binary64 values as exact dyadic constants;
 * no decimal trimming changes a short physical interval or endpoint jet.
 */
export const AutoMovieHumanVermilionCalibration: IAutoMovieHumanHermiteCurve = {
  name: "mouth.vermilion",
  chain: "head.lower",
  closed: true,
  spans: [
    {
      address: "crv_lip_philtrum_l/span0/forward",
      interval: 0x314dc85bef3a3 * 2 ** -47,
      start: [0x3d92ff3 * 2 ** -19, 0x17f23ed * 2 ** -14, 0x2a7d55d * 2 ** -27],
      end: [0x3d0f239 * 2 ** -19, 0x17f7dc5 * 2 ** -14, -0x1635f69 * 2 ** -22],
      startDerivative: [
        -0x50a486b035b63 * 2 ** -54,
        0x1f0914213a197f * 2 ** -56,
        -0x10217c3235cafd * 2 ** -52,
      ],
      endDerivative: [
        -0x1ec2ba58e91e21 * 2 ** -55,
        0x1b6c811b374cb * 2 ** -51,
        -0x1ec49678d0c005 * 2 ** -53,
      ],
    },
    {
      address: "crv_lip_upper_outer_l/span0/forward",
      interval: 0x122d2eedfb41c9 * 2 ** -48,
      start: [
        0x3d0f239 * 2 ** -19,
        0x17f7dc5 * 2 ** -14,
        -0x1635f69 * 2 ** -22,
      ],
      end: [0x398a4b * 2 ** -15, 0x17d501d * 2 ** -14, -0x4d773c9 * 2 ** -22],
      startDerivative: [
        -0xd3b86d4782fa5 * 2 ** -54,
        -0x1aa67b3e27f02b * 2 ** -56,
        -0x78430f506d975 * 2 ** -51,
      ],
      endDerivative: [
        -0x12318c488cf37d * 2 ** -53,
        -0x113978bbbc7da7 * 2 ** -53,
        -0x10c9bd93c4bd23 * 2 ** -53,
      ],
    },
    {
      address: "crv_lip_upper_outer_l/span1/forward",
      interval: 0x1897f1799d04d * 2 ** -46,
      start: [0x398a4b * 2 ** -15, 0x17d501d * 2 ** -14, -0x4d773c9 * 2 ** -22],
      end: [0x37668cd * 2 ** -19, 0x2f8efa1 * 2 ** -15, -0x2c573f1 * 2 ** -21],
      startDerivative: [
        -0x13502e83c8c639 * 2 ** -53,
        -0x1248d6991d2b89 * 2 ** -53,
        -0x11d23b273f32d5 * 2 ** -53,
      ],
      endDerivative: [
        -0xc570985e2500d * 2 ** -52,
        -0x2173b7f547193 * 2 ** -50,
        -0x170caed7b03fb9 * 2 ** -54,
      ],
    },
    {
      address: "crv_lip_upper_outer_l/span2/forward",
      interval: 0x286f4d7c4d8cb * 2 ** -47,
      start: [
        0x37668cd * 2 ** -19,
        0x2f8efa1 * 2 ** -15,
        -0x2c573f1 * 2 ** -21,
      ],
      end: [0x1ab6a9d * 2 ** -18, 0x2f78ad * 2 ** -11, -0x175aeb7 * 2 ** -20],
      startDerivative: [
        -0x11f25a3532a3ad * 2 ** -53,
        -0x185354bf197cb9 * 2 ** -54,
        -0x8616aec20c8b * 2 ** -49,
      ],
      endDerivative: [
        -0x455a998ce99af * 2 ** -52,
        -0x4d9662e8cd3af * 2 ** -51,
        -0x4c58bab796697 * 2 ** -56,
      ],
    },
    {
      address: "crv_lip_lower_outer_l/span2/reverse",
      interval: 0x514233f6583b3 * 2 ** -48,
      start: [0x1ab6a9d * 2 ** -18, 0x2f78ad * 2 ** -11, -0x175aeb7 * 2 ** -20],
      end: [0x36ddf5f * 2 ** -19, 0x2f5cb19 * 2 ** -15, -0xaa3e99 * 2 ** -19],
      startDerivative: [
        0x13dd6ef8cd4089 * 2 ** -55,
        -0x6e33b4bdae6c7 * 2 ** -51,
        0x318405f37f0b1 * 2 ** -52,
      ],
      endDerivative: [
        0x9238b7ba81761 * 2 ** -52,
        -0x1bd43b65029d33 * 2 ** -54,
        0x7a48c8303a479 * 2 ** -52,
      ],
    },
    {
      address: "crv_lip_lower_outer_l/span1/reverse",
      interval: 0x7c9a2f6372563 * 2 ** -48,
      start: [0x36ddf5f * 2 ** -19, 0x2f5cb19 * 2 ** -15, -0xaa3e99 * 2 ** -19],
      end: [0x394dfb * 2 ** -15, 0x2f429ad * 2 ** -15, -0x10308df * 2 ** -20],
      startDerivative: [
        0x535eddf19027d * 2 ** -51,
        -0x1fbbfdc4799739 * 2 ** -54,
        0x22dc767dd68cb * 2 ** -50,
      ],
      endDerivative: [
        0x841d6abf414a5 * 2 ** -52,
        -0x176fe94158690f * 2 ** -54,
        0x60e6b8c18b967 * 2 ** -51,
      ],
    },
    {
      address: "crv_lip_lower_outer_l/span0/reverse",
      interval: 0x2285a0d52fd11 * 2 ** -45,
      start: [0x394dfb * 2 ** -15, 0x2f429ad * 2 ** -15, -0x10308df * 2 ** -20],
      end: [0x3b3adf5 * 2 ** -19, 0x2f2af83 * 2 ** -15, -0x2ff1241 * 2 ** -32],
      startDerivative: [
        0x8e09f247b2efd * 2 ** -52,
        -0x193299b77d6051 * 2 ** -54,
        0x1a0b869cb14d41 * 2 ** -53,
      ],
      endDerivative: [
        0x10e7e9b13ff23f * 2 ** -57,
        -0x9b3e3748be3ff * 2 ** -57,
        0x20a0dba8792f * 2 ** -45,
      ],
    },
    {
      address: "crv_lip_lower_outer_r/span0/forward",
      interval: 0x9ba9f9b03f1 * 2 ** -39,
      start: [
        0x3b3adf5 * 2 ** -19,
        0x2f2af83 * 2 ** -15,
        -0x2ff1241 * 2 ** -32,
      ],
      end: [0xe1f113 * 2 ** -17, 0x5e8b43 * 2 ** -12, 0x2351851 * 2 ** -21],
      startDerivative: [
        -0x127cdeaab365b * 2 ** -54,
        -0x62acc476dc40d * 2 ** -60,
        0x8d671c5ba3a7b * 2 ** -51,
      ],
      endDerivative: [
        -0x5a527f30a2bdf * 2 ** -51,
        0x6d8c13f65926d * 2 ** -52,
        0x66e9a79b1d5cb * 2 ** -51,
      ],
    },
    {
      address: "crv_lip_lower_outer_r/span1/forward",
      interval: 0x591498b371d19 * 2 ** -47,
      start: [0xe1f113 * 2 ** -17, 0x5e8b43 * 2 ** -12, 0x2351851 * 2 ** -21],
      end: [0x1a86be5 * 2 ** -18, 0x2f75e7 * 2 ** -11, 0x2f466a7 * 2 ** -21],
      startDerivative: [
        -0xdc2c19aaace85 * 2 ** -53,
        0x10b09188aa7671 * 2 ** -54,
        0xfadcf7be4d43 * 2 ** -49,
      ],
      endDerivative: [
        -0x544f0dad735d9 * 2 ** -53,
        0x57731e504385b * 2 ** -51,
        0x1206b183823eb5 * 2 ** -55,
      ],
    },
    {
      address: "crv_lip_upper_outer_r/span2/reverse",
      interval: 0x15a772011ba15 * 2 ** -46,
      start: [0x1a86be5 * 2 ** -18, 0x2f75e7 * 2 ** -11, 0x2f466a7 * 2 ** -21],
      end: [0x6e421d * 2 ** -16, 0x17c6fd1 * 2 ** -14, 0x588da1 * 2 ** -18],
      startDerivative: [
        0x1eb48935750ca9 * 2 ** -55,
        0x109c0014baec9f * 2 ** -53,
        -0x12b7060f4218c1 * 2 ** -58,
      ],
      endDerivative: [
        0x100bf154a34327 * 2 ** -53,
        0x167a7369274079 * 2 ** -54,
        -0xe3f67b4dbf071 * 2 ** -54,
      ],
    },
    {
      address: "crv_lip_upper_outer_r/span1/reverse",
      interval: 0xf6e22b2c9e7f * 2 ** -45,
      start: [0x6e421d * 2 ** -16, 0x17c6fd1 * 2 ** -14, 0x588da1 * 2 ** -18],
      end: [0x39c91e7 * 2 ** -19, 0x17d8655 * 2 ** -14, 0x255912b * 2 ** -21],
      startDerivative: [
        0xc3fe3618d756b * 2 ** -52,
        0x44a3253071763 * 2 ** -51,
        -0x15c0a748ea50cb * 2 ** -54,
      ],
      endDerivative: [
        0x12e200ebe77b * 2 ** -45,
        0x49cd7daa53a81 * 2 ** -51,
        -0x23bb7546b9b3d * 2 ** -50,
      ],
    },
    {
      address: "crv_lip_upper_outer_r/span0/reverse",
      interval: 0x4278d4e2e6dc5 * 2 ** -46,
      start: [0x39c91e7 * 2 ** -19, 0x17d8655 * 2 ** -14, 0x255912b * 2 ** -21],
      end: [0x3d00bd * 2 ** -15, 0xbfc197 * 2 ** -13, 0x17f94e5 * 2 ** -22],
      startDerivative: [
        0x245bea73b39af * 2 ** -50,
        0x8e1b9497dae65 * 2 ** -52,
        -0x113360a1c5b843 * 2 ** -53,
      ],
      endDerivative: [
        0x834ae284af69d * 2 ** -53,
        0x1f338f9c9c708d * 2 ** -56,
        -0xee8555cd7fc9f * 2 ** -52,
      ],
    },
    {
      address: "crv_lip_philtrum_r/span0/reverse",
      interval: 0x17f521cb72791 * 2 ** -46,
      start: [0x3d00bd * 2 ** -15, 0xbfc197 * 2 ** -13, 0x17f94e5 * 2 ** -22],
      end: [0x3d92ff3 * 2 ** -19, 0x17f23ed * 2 ** -14, 0x2a7d55d * 2 ** -27],
      startDerivative: [
        0x7f6b1041c1255 * 2 ** -53,
        -0x723dea01585a5 * 2 ** -53,
        -0xf5be417f3c2e9 * 2 ** -52,
      ],
      endDerivative: [
        0x1a5ca9e309721 * 2 ** -52,
        -0x13712245c6c325 * 2 ** -55,
        -0x1015ecfcea72d7 * 2 ** -52,
      ],
    },
  ],
};
