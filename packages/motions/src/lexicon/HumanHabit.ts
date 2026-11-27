import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { walk } from "../gait/internal/walk";
import { handToFace } from "../daily/internal/handToFace";
import { gesture } from "../everyday/internal/gesture";
import { AutoMovieMotionHumanActionRow } from "../law/AutoMovieMotionHumanActionRow";
import { touch } from "../touch/internal/touch";

/**
 * Habits: the small things people do with their hands, each a row of a shipped
 * action. Register the ones a film uses.
 */
export namespace HumanHabit {
  /**
   * A draw on a cigarette: held at the lips for a puff's length, drawn by the
   * seed between 1.6 and 2.1 s (mean puff durations of the Pennsylvania Adult
   * Smoking Study and NCT04844762; a cigarette's dozen puffs, their intervals
   * of 25 to 28 s and the decline of the puff over the cigarette are the
   * composition's), the head level, between fingers that point up and back at
   * the mouth with the palm toward the chin; its end stands 0.15 of a hand off
   * the fingertips' pads (provisional). With `prop`, the held cigarette's
   * `mouth` end meets the lips.
   */
  export const smoke: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["habit"]["smoke"]
  > = AutoMovieMotionHumanActionRow.of("smoke", handToFace, {
    kind: {
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
    hold: { between: [1.6, 2.1] },
  });

  /**
   * The walk under a screen read while walking (`handToFace({ kind: "read" })`
   * over it): the normal walk slowed by a third (a manner pace of 2/3), the
   * reduction Lamberg and Muratori 2012 report for texting walkers, inside the
   * 20 to 40 per cent band the research states (provisional until the paper's
   * table is read). The composition gives where to; a person walking while
   * reading or texting.
   */
  export const readingWalk: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["habit"]["readingWalk"]
  > = AutoMovieMotionHumanActionRow.of("readingWalk", walk, {
    manner: { pace: 2 / 3 },
  });

  /**
   * A photograph through a camera's viewfinder, with the camera in hand: the
   * right hand took it up by its `grip` for this use (`pickUp` with `use: {
   * tip: "screen", line: "across", at: { region: "noseBridge" } }`), brings its
   * back to the bridge of the nose as that grasp presents it, and the left hand
   * takes its `support` end, the device archetype's compact camera
   * (`AutoMovieArchetypeDevice.create({ kind: "camera" })`) declaring all three.
   * Without the camera in hand the row is refused: no hand holds the attitude an
   * implied camera would ask at the eye. The camera's own points replace the
   * task's implied effector.
   */
  export const photograph: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["habit"]["photograph"]
  > = AutoMovieMotionHumanActionRow.of("photograph", handToFace, {
    point: "screen",
    grasp: { handle: "grip", line: "across" },
    other: "support",
    kind: {
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

  /**
   * A look at a held screen, as a phone read at the reading distance. It holds
   * the screen at the reading distance for the `read` task's 3 s
   * (`handToFaceRows.ROWS`, provisional); glancing at a message.
   */
  export const checkPhone: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["habit"]["checkPhone"]
  > = AutoMovieMotionHumanActionRow.of("checkPhone", handToFace, {
    kind: "read",
  });

  /**
   * A look at a wristwatch: the left wrist raised before the eyes at the
   * reading distance (`handToFaceSheet.READING`), its back turned to them and
   * the forearm across the body, the head bowed 20 degrees to it (provisional),
   * held a second and a half (provisional).
   */
  export const checkWatch: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["habit"]["checkWatch"]
  > = AutoMovieMotionHumanActionRow.of("checkWatch", handToFace, {
    kind: {
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
    hand: "left",
  });

  /**
   * Lipstick or balm drawn across the lips. Two strokes of 0.5 s and 0.2 s on
   * the lips, about 1.2 s after the reach
   * (`AutoMovieMotionHumanTouchForm.FORMS`, provisional); grooming.
   */
  export const applyLipstick: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["habit"]["applyLipstick"]
  > = AutoMovieMotionHumanActionRow.of("applyLipstick", handToFace, {
    kind: {
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

  /**
   * A shave: the head of a held razor rubbed up the right jaw three times
   * (`touch` with the held prop's working point). The composition names the
   * razor (`prop`) taken up for its use, and its working point (`point`), the
   * head; without a razor the palm's rub is mimed. Three strokes of 0.5 s and
   * 0.2 s, about 1.7 s after the reach (provisional); grooming.
   */
  export const shave: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["habit"]["shave"]
  > = AutoMovieMotionHumanActionRow.of("shave", touch, {
    target: { kind: "self", region: "jawRight" },
    kind: "rub",
    count: 3,
    hold: 0.2,
    tangent: "up",
  });

  /**
   * A rub of tired eyes with the fingertips. Two rubs of 0.5 s and 0.2 s, about
   * 1.2 s after the reach (provisional); tiredness.
   */
  export const rubEyes: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["habit"]["rubEyes"]
  > = AutoMovieMotionHumanActionRow.of("rubEyes", handToFace, {
    kind: {
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

  /**
   * A scratch of the nape. Three scratches of 0.2 s, then 0.4 s (`touch`'s
   * defaults), 1.0 s after the reach (provisional); idle, itch, unease.
   */
  export const scratchNape: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["habit"]["scratchNape"]
  > = AutoMovieMotionHumanActionRow.of("scratchNape", touch, {
    target: { kind: "self", region: "nape" },
    effector: "fingertips",
    kind: "scratch",
  });

  /**
   * Blowing the nose: the hand, as with a tissue, held over the nose with the
   * head bowed a little (first pass; hold and bow provisional). Held 1 s
   * (provisional).
   */
  export const blowNose: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["habit"]["blowNose"]
  > = AutoMovieMotionHumanActionRow.of("blowNose", handToFace, {
    kind: {
      region: "nose",
      effector: { surface: "palm", shape: "flat" },
      kind: "hold",
      count: 1,
      hold: 1,
      tangent: "up",
      head: 10,
      at: "atNose",
    },
  });

  /**
   * Cream rubbed on the face with both palms, twice up the cheeks. Two rubs of
   * 0.5 s then 0.4 s, 1.4 s after the reach (provisional); grooming.
   */
  export const applyCream: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["habit"]["applyCream"]
  > = AutoMovieMotionHumanActionRow.of("applyCream", handToFace, {
    kind: "washFace",
    count: 2,
  });

  /**
   * Fanning oneself with a hand: six beats beside the face (first pass on the
   * wave's stroke, provisional). Six beats of 0.4 s, 2.4 s
   * (`AutoMovieMotionHumanTiming.PAUSES`); heat, impatience.
   */
  export const fanSelf: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["habit"]["fanSelf"]
  > = AutoMovieMotionHumanActionRow.of("fanSelf", gesture, {
    kind: "wave",
    count: 6,
  });

  /**
   * Smelling a held thing: brought under the nose and held, the head bowed to
   * it (first pass; values provisional). Held 0.6 s (provisional); checking
   * food, a flower, a smell.
   */
  export const sniff: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["habit"]["sniff"]
  > = AutoMovieMotionHumanActionRow.of("sniff", handToFace, {
    kind: {
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

  /**
   * Flicking the hair back: the back of the hand stroked up the temple. One
   * stroke lasting a flick's 0.151 s, a proxy from a flick gesture's duration
   * (`touch.FLICK`, Moyle and Cockburn 2003).
   */
  export const flickHair: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["habit"]["flickHair"]
  > = AutoMovieMotionHumanActionRow.of(
    "flickHair",
    touch.stroked(touch.FLICK),
    {
      target: { kind: "self", region: "templeRight" },
      effector: "handBack",
      kind: "stroke",
      hand: "right",
    },
  );

  /**
   * A selfie: a phone held out before the eyes at the reading distance, the
   * elbow-bent convention of about 30 cm, the head level, held a second and a
   * half (provisional).
   */
  export const selfie: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["habit"]["selfie"]
  > = AutoMovieMotionHumanActionRow.of("selfie", handToFace, {
    kind: {
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

  /**
   * Lighting a cigarette: a flame brought to the cigarette's end before the
   * lips, the head bowed to it (first pass with one hand; the second, cupping
   * hand is not placed). The flame held 0.8 s (provisional).
   */
  export const lightCigarette: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["habit"]["lightCigarette"]
  > = AutoMovieMotionHumanActionRow.of("lightCigarette", handToFace, {
    kind: {
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

  /**
   * Tapping the ash off a held cigarette: its lit end tapped twice on the place
   * the composition gives, such as an ashtray's surface (`target`); the
   * composition names the cigarette (`prop`). Two taps of 0.3 s, then 0.4 s,
   * 1.0 s after the reach (provisional).
   */
  export const ashTap: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["habit"]["ashTap"]
  > = AutoMovieMotionHumanActionRow.of("ashTap", touch, {
    kind: "tap",
    count: 2,
    point: "flame",
  });

  /**
   * Stubbing a held cigarette out: its lit end pressed on the place the
   * composition gives and held there (the twist of the stub is not moved yet);
   * the composition names the cigarette (`prop`). Pressed and held 1.2 s
   * (`touch`'s default for a press, provisional).
   */
  export const stubOut: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["habit"]["stubOut"]
  > = AutoMovieMotionHumanActionRow.of("stubOut", touch, {
    kind: "press",
    count: 1,
    point: "flame",
  });
}
