import { walk } from "../actions/walk";
import { handToFace } from "../daily/handToFace";
import { gesture } from "../everyday/gesture";
import { HumanActionRow } from "../law/HumanActionRow";
import { touch } from "../touch/touch";

/**
 * Habits: the small things people do with their hands, each a row of a
 * shipped action. Register the ones a film uses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is, the action it is a row of and what its parameters fix.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped action (`HumanActionRow`), so it is data over a law that already fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's rows and nothing else; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; values not yet read at a source are marked provisional on the row.
 */
export namespace HumanHabit {
  /** A draw on a cigarette: held at the lips for a puff's length, drawn by the seed between 1.6 and 2.1 s (#3346: mean puff durations of the Pennsylvania Adult Smoking Study and NCT04844762; a cigarette's dozen puffs, their intervals of 25 to 28 s and the decline of the puff over the cigarette are the composition's), the head level, between fingers that point up and back at the mouth with the palm toward the chin; its end stands 0.15 of a hand off the fingertips' pads (provisional). With `prop`, the held cigarette's `mouth` end meets the lips. */
  export const smoke = HumanActionRow.of("smoke", handToFace, {
    task: {
      region: "mouth",
      effector: {
        surface: "indexTip",
        shape: "relaxed",
        tool: { palm: 0.15 },
        facing: { fingers: 1, palm: 1 },
        along: { fingers: 1, palm: -1 },
      },
      kind: "hold",
      count: 1,
      hold: 1,
      tangent: "up",
      point: "mouth",
      head: 0,
      at: "atLips",
    },
    seconds: { between: [1.6, 2.1] },
  });

  /** The walk under a screen read while walking (`handToFace({ task: "read" })` over it): the slow pace, 0.77 of the free walk's speed, inside the 20 to 40 per cent reduction #3338 states for texting walkers (Lamberg and Muratori 2012 report about a third; the band is provisional until the paper's table is read). The composition gives where to. */
  export const readingWalk = HumanActionRow.of("readingWalk", walk, {
    pace: "slow",
  });

  /** A photograph through a camera's viewfinder: both hands bring it to the eye, one at each side of it with the palms toward each other, the fingers ahead and the thumbs up; the viewfinder lies 0.4 of a hand inside each palm and 0.2 behind the grip (provisional, half a compact camera's width and depth). */
  export const photograph = HumanActionRow.of("photograph", handToFace, {
    task: {
      region: "noseBridge",
      other: "noseBridge",
      effector: {
        surface: "grip",
        shape: "fist",
        tool: { palm: 0.4, fingers: -0.2 },
        facing: "-fingers",
        along: "thumb",
      },
      kind: "hold",
      count: 1,
      hold: 1.5,
      tangent: "up",
      head: 0,
      at: "atEye",
    },
  });

  /** A look at a held screen, as a phone read at the reading distance. */
  export const checkPhone = HumanActionRow.of("checkPhone", handToFace, {
    task: "read",
  });

  /** A look at a wristwatch: the left wrist raised before the eyes at the reading distance (`handToFaceSheet.READING`), its back turned to them and the forearm across the body, the head bowed 20 degrees to it (provisional), held a second and a half (provisional). */
  export const checkWatch = HumanActionRow.of("checkWatch", handToFace, {
    task: {
      region: null,
      effector: {
        surface: "wrist",
        shape: "relaxed",
        facing: "palm",
        along: "fingers",
      },
      kind: "hold",
      count: 1,
      hold: 1.5,
      tangent: "across",
      head: 20,
      at: "atWatch",
    },
    side: "left",
  });

  /** Lipstick or balm drawn across the lips. */
  export const applyLipstick = HumanActionRow.of("applyLipstick", handToFace, {
    task: {
      region: "mouth",
      effector: {
        surface: "grip",
        shape: "fist",
        tool: { thumb: 0.3 },
        facing: "thumb",
        along: "palm",
      },
      kind: "rub",
      count: 2,
      hold: 0.2,
      tangent: "across",
      head: 0,
      at: "atLips",
    },
  });

  /** A shave: the head of a held razor rubbed up the right jaw three times (`touch` with the held prop's working point). The composition names the razor (`prop`) taken up for its use, and its working point (`point`), the head; without a razor the palm's rub is mimed. */
  export const shave = HumanActionRow.of("shave", touch, {
    target: { kind: "self", region: "jawRight" },
    kind: "rub",
    count: 3,
    hold: 0.2,
    tangent: "up",
  });

  /** A rub of tired eyes with the fingertips. */
  export const rubEyes = HumanActionRow.of("rubEyes", handToFace, {
    task: {
      region: "noseBridge",
      effector: { surface: "indexTip", shape: "flat" },
      kind: "rub",
      count: 2,
      hold: 0.2,
      tangent: "across",
      head: 10,
      at: "atEyes",
    },
  });

  /** A scratch of the nape. */
  export const scratchNape = HumanActionRow.of("scratchNape", touch, {
    target: { kind: "self", region: "nape" },
    with: "fingertips",
    kind: "scratch",
  });

  /** Blowing the nose: the hand, as with a tissue, held over the nose with the head bowed a little (first pass; hold and bow provisional). */
  export const blowNose = HumanActionRow.of("blowNose", handToFace, {
    task: {
      region: "nose",
      effector: { surface: "palm", shape: "relaxed" },
      kind: "hold",
      count: 1,
      hold: 1,
      tangent: "up",
      head: 10,
      at: "atNose",
    },
  });

  /** Cream rubbed on the face with both palms, twice up the cheeks. */
  export const applyCream = HumanActionRow.of("applyCream", handToFace, {
    task: "washFace",
    count: 2,
  });

  /** Fanning oneself with a hand: six beats beside the face (first pass on the wave's stroke, provisional). */
  export const fanSelf = HumanActionRow.of("fanSelf", gesture, {
    kind: "wave",
    count: 6,
  });

  /** Smelling a held thing: brought under the nose and held, the head bowed to it (first pass; values provisional). */
  export const sniff = HumanActionRow.of("sniff", handToFace, {
    task: {
      region: "nose",
      effector: {
        surface: "grip",
        shape: "fist",
        tool: { thumb: 0.3 },
        facing: "thumb",
        along: "palm",
      },
      kind: "hold",
      count: 1,
      hold: 0.6,
      tangent: "up",
      head: 5,
      at: "atNose",
    },
  });

  /** Flicking the hair back: the back of the hand stroked up the temple. */
  export const flickHair = HumanActionRow.of("flickHair", touch, {
    target: { kind: "self", region: "templeRight" },
    with: "handBack",
    kind: "stroke",
    side: "right",
  });

  /** A selfie: a phone held out before the eyes at the reading distance, the elbow-bent convention of about 30 cm (#3346), the head level, held a second and a half (provisional). */
  export const selfie = HumanActionRow.of("selfie", handToFace, {
    task: {
      region: null,
      effector: {
        surface: "grip",
        shape: "fist",
        tool: { thumb: 0.3 },
        facing: "-palm",
        along: "thumb",
      },
      kind: "hold",
      count: 1,
      hold: 1.5,
      tangent: "up",
      head: 0,
      at: "shutter",
    },
  });

  /** Lighting a cigarette: a flame brought to the cigarette's end before the lips, the head bowed to it (first pass with one hand; the second, cupping hand is not placed). */
  export const lightCigarette = HumanActionRow.of("lightCigarette", handToFace, {
    task: {
      region: "mouth",
      effector: {
        surface: "grip",
        shape: "fist",
        tool: { thumb: 0.5 },
        facing: "thumb",
        along: "palm",
      },
      kind: "hold",
      count: 1,
      hold: 0.8,
      tangent: "up",
      head: 10,
      at: "atLips",
    },
  });

  /** Tapping the ash off a held cigarette: its lit end tapped twice on the place the composition gives, such as an ashtray's surface (`target`); the composition names the cigarette (`prop`). */
  export const ashTap = HumanActionRow.of("ashTap", touch, {
    kind: "tap",
    count: 2,
    point: "flame",
  });

  /** Stubbing a held cigarette out: its lit end pressed on the place the composition gives and held there (the twist of the stub is not moved yet); the composition names the cigarette (`prop`). */
  export const stubOut = HumanActionRow.of("stubOut", touch, {
    kind: "press",
    count: 1,
    point: "flame",
  });
}
