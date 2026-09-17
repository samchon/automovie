/**
 * Independent bindings input for humanFaceFixture unit scenarios.
 * Frozen from the pre-separation arrangement at 0f001f80, these values preserve
 * existing scenario inputs while removing the live portrait-study dependency.
 * They are test inputs, not expected outputs or a fitted anatomical standard.
 * The fixture factory clones this data before exposing it to any scenario.
 * Indices name the host vertices used by paired eyes, nose and mouth.
 * Updating topology requires updating these attachments in the same fixture.
 */
import type { IAutoMovieHumanFaceDocument } from "@automovie/human";

export const humanFaceBindingsFixture: IAutoMovieHumanFaceDocument["basis"]["bindings"] =
  {
    eyes: {
      right: {
        name: "right",
        top: [33, 246, 161, 160, 159, 158, 157, 173, 133],
        bottom: [33, 7, 163, 144, 145, 153, 154, 155, 133],
        iris: 468,
        browTop: [70, 63, 105, 66, 107],
        browBottom: [46, 53, 52, 65, 55],
      },
      left: {
        name: "left",
        top: [362, 398, 384, 385, 386, 387, 388, 466, 263],
        bottom: [362, 382, 381, 380, 374, 373, 390, 249, 263],
        iris: 473,
        browTop: [336, 296, 334, 293, 300],
        browBottom: [285, 295, 282, 283, 276],
      },
    },
    nose: {
      supportPlane: [6, 129, 358],
      midline: 0,
      tipY: -6,
      tipRadius: [8, 9],
      alarOffset: 12.5,
      alarY: -13.5,
      alarRadius: 5.5,
      sectionAnchor: 4,
      surface: [
        1, 2, 3, 4, 5, 19, 20, 44, 45, 47, 48, 49, 51, 59, 60, 64, 75, 79, 94,
        97, 98, 99, 100, 102, 114, 115, 120, 121, 125, 126, 128, 129, 131, 134,
        141, 142, 164, 165, 166, 167, 174, 188, 195, 196, 197, 198, 209, 217,
        218, 219, 220, 231, 232, 235, 236, 237, 238, 239, 240, 241, 242, 248,
        250, 274, 275, 277, 278, 279, 281, 289, 290, 294, 305, 309, 326, 327,
        328, 331, 343, 344, 350, 354, 355, 357, 358, 360, 363, 370, 371, 391,
        392, 393, 399, 419, 420, 429, 437, 438, 439, 440, 455, 456, 457, 458,
        459, 460, 461, 462,
      ],
      nostrils: [
        [759, 761, 815, 819, 821, 823, 825, 831, 833],
        [758, 760, 814, 818, 820, 822, 824, 830, 832],
      ],
    },
    mouth: {
      outer: [
        61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267,
        0, 37, 39, 40, 185,
      ],
      upper: [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308],
      lower: [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308],
      lipSeed: 11,
    },
  };
