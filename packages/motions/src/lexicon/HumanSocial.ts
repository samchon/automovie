import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
  IAutoMovieMotionHumanMutual,
  IAutoMovieMotionHumanSocial,
  IAutoMovieMotionMeeting,
} from "@automovie/interface";

import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { handToFace } from "../daily/handToFace";
import { HumanActionRow } from "../law/HumanActionRow";
import { highFive } from "../touch/highFive";
import { kiss } from "../touch/kiss";
import { touch } from "../touch/touch";

/**
 * Things two people do together or to each other in company, as rows of
 * shipped actions and as mutual records over them (`HumanChain.mutual`).
 * Register the rows a film uses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is, the action it is a row of and what its parameters fix.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped action (`HumanActionRow`), so it is data over a law that already fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's rows and nothing else; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; values not yet read at a source are marked provisional on the row.
 */
export namespace HumanSocial {
  /** A whisper: the lips brought to the partner's ear and held (two seconds, provisional). */
  export const whisper: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["whisper"]
  > = HumanActionRow.of("whisper", kiss, {
    region: "earLeft",
    hold: 2,
  });

  /** A kiss on the cheek. The lips stay 0.6 s (`kiss.HOLD`, provisional); greeting, affection. */
  export const cheekKiss: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["cheekKiss"]
  > = HumanActionRow.of("cheekKiss", kiss, {
    region: "cheekLeft",
  });

  /** A kiss on the forehead. The lips stay 0.6 s (`kiss.HOLD`, provisional); tenderness, farewell. */
  export const foreheadKiss: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["foreheadKiss"]
  > = HumanActionRow.of("foreheadKiss", kiss, {
    region: "forehead",
  });

  /** A pat on the partner's shoulder; the composition gives the shoulder as the target. Two pats of 0.4 s, then 0.4 s, 1.2 s after the reach (`AutoMovieMotionHumanTouchForm.FORMS`, provisional); encouragement, praise. */
  export const shoulderPat: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["shoulderPat"]
  > = HumanActionRow.of("shoulderPat", touch, {
    with: "palm",
    kind: "pat",
    count: 2,
  });

  /** A comforting hand held on the partner. Held 2 s after the reach (provisional); condolence, reassurance. */
  export const comfort: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["comfort"]
  > = HumanActionRow.of("comfort", touch, {
    with: "palm",
    kind: "hold",
    hold: 2,
  });

  /** A fist bump, one role of it. The fists stay together 0.1 s, then return in the reach's time (`highFive.REBOUND`, provisional); a friendly greeting between peers. */
  export const fistBump: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["fistBump"]
  > = HumanActionRow.of("fistBump", highFive, {
    kind: "fist",
  });

  /** A low five, one role of it. The hands stay together 0.1 s, then return in the reach's time (`highFive.REBOUND`, provisional); a low-key greeting, a child's game. */
  export const lowFive: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["lowFive"]
  > = HumanActionRow.of("lowFive", highFive, {
    kind: "low",
  });

  /** A sip taken after a toast. Takes the sip as the `sip` drink row does: held 0.5 s at the mouth (`handToFaceRows.ROWS`, provisional). */
  export const toastSip: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["toastSip"]
  > = HumanActionRow.of("toastSip", handToFace, {
    task: "sip",
  });

  /** A fist bump between two people: both perform `fistBump`. With `window`, film seconds, the fists meet no earlier than its `from` and part at its `to` (`AutoMovieMotionMeeting.IWindow`). */
  export const bump: IAutoMovieMotionHumanMutual<
    { window?: IAutoMovieMotionMeeting.IWindow },
    "one" | "other"
  > = {
    name: "fistBump",
    roles: ["one", "other"],
    act: (
      role: "one" | "other",
      params: { window?: IAutoMovieMotionMeeting.IWindow },
      cast: Readonly<Record<"one" | "other", string>>,
    ): IAutoMovieMotionHumanMutual.IAct => ({
      name: "fistBump",
      params: {
        partner: cast[role === "one" ? "other" : "one"],
        ...(params?.window === undefined ? {} : { window: params.window }),
      },
    }),
  };

  /**
   * A toast: each role brings the glass its right hand holds to one shared
   * point at the mean of the two chest heights (provisional: no source for a
   * clink's height was read), the glass upright, so the rims meet. Each
   * performs `fistBump` with its glass as the prop. `glasses` names each
   * role's held glass; without it the toast is mimed and the fists meet.
   * `window`, film seconds, holds the clink over it as `bump`'s does.
 *
   * Each glass reaches the shared point in the reach-to-grasp time of its travel, about 0.5 s for 0.4 m (`IAutoMovieMotionHumanPickUp`), and the glasses stay together 0.1 s (`highFive.REBOUND`, provisional); a celebration, a dinner.
   */
  export const toast: IAutoMovieMotionHumanMutual<
    IAutoMovieMotionHumanSocial.IToast,
    "host" | "guest"
  > = {
    name: "toast",
    roles: ["host", "guest"],
    act: (
      role: "host" | "guest",
      params: IAutoMovieMotionHumanSocial.IToast,
      cast: Readonly<Record<"host" | "guest", string>>,
    ): IAutoMovieMotionHumanMutual.IAct => ({
      name: "fistBump",
      params: {
        partner: cast[role === "host" ? "guest" : "host"],
        ...(params?.window === undefined ? {} : { window: params.window }),
        ...(params?.glasses === undefined
          ? {}
          : { prop: params.glasses[role] }),
      },
    }),
  };

  /** A pinky promise, one role of it: the hands meet at chest height as fists do (first pass; the hooked little fingers are not shaped). The fists meet as a fist bump does (`highFive.REBOUND`, 0.1 s); the hooked fingers are not shaped; a promise between friends. */
  export const pinkyPromise: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["pinkyPromise"]
  > = HumanActionRow.of("pinkyPromise", highFive, {
    kind: "fist",
  });

  /** Rock, paper, scissors: both players pump a fist three times on one start (first pass: each performs `shakeFist` three times; the shared count is the common start, and the throw's hand shape is not set). Three fist pumps on one start; the pump's period is the `shakeFist` law's (provisional, missing a source); settling a choice between two people. */
  export const rockPaperScissors: IAutoMovieMotionHumanMutual<
    object,
    "one" | "other"
  > = {
    name: "rockPaperScissors",
    roles: ["one", "other"],
    act: (): IAutoMovieMotionHumanMutual.IAct => ({
      name: "shakeFist",
      params: { count: 3 },
    }),
  };

  /** A firm, slow pat or press of the palm on the partner (Laban's press: strong, sustained, direct); the composition gives the region. The press takes 0.4 s and holds 1.2 s (`touch`'s defaults, provisional); steadying, emphasis. */
  export const firmPress: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["firmPress"]
  > = HumanActionRow.of("firmPress", touch, {
    with: "palm",
    kind: "press",
    manner: AutoMovieMotionManner.PRESETS.press,
  });

  /** A light, quick flick of the fingertips on the partner, as brushing lint off a shoulder (Laban's flick: light, sudden, indirect); the composition gives the region. A stroke at the caress's 5 cm/s peak, about 5 s for a 0.2 m hand (`AutoMovieMotionHumanTouchForm.FORMS`): far slower than a flick (wrong value, #4020); brushing lint off, dismissing. */
  export const flickOff: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["flickOff"]
  > = HumanActionRow.of("flickOff", touch, {
    with: "fingertips",
    kind: "stroke",
    manner: AutoMovieMotionManner.PRESETS.flick,
  });

  /** Arm wrestling across a table: both perform `armWrestle` on one point of the table's top, `table` in world metres, and `winner` pins the other after `seconds` of struggle (3 when absent), the forearms ending `pin` degrees from upright (the law's own when absent; an angle past either arm's range is refused with the angle it holds). Register the `armWrestle` law with it. The pin lands 3 s after the go when `seconds` is absent, the forearms ending 70 degrees from upright (`armWrestle.PIN`, provisional: no timing or angle study); a friendly contest, a show of strength. */
  export const armWrestle: IAutoMovieMotionHumanMutual<
    IAutoMovieMotionHumanSocial.IArmWrestle,
    "one" | "other"
  > = {
    name: "armWrestle",
    roles: ["one", "other"],
    act: (
      role: "one" | "other",
      params: IAutoMovieMotionHumanSocial.IArmWrestle,
      cast: Readonly<Record<"one" | "other", string>>,
    ): IAutoMovieMotionHumanMutual.IAct => {
      if (params === undefined)
        throw new Error("An arm wrestle states its table point and its winner");
      return {
        name: "armWrestle",
        params: {
          partner: cast[role === "one" ? "other" : "one"],
          table: params.table,
          wins: params.winner === role,
          ...(params.seconds === undefined ? {} : { seconds: params.seconds }),
          ...(params.pin === undefined ? {} : { pin: params.pin }),
        },
      };
    },
  };

  /** Thumb wrestling, first pass: the clasp of a handshake held through five small pumps (the thumbs' own play is not staged yet). Five pumps at the handshake's 2.43 Hz, about 2.1 s (Tagne et al. 2016; `handshake`), after the clasp; a playful contest between friends or siblings. */
  export const thumbWrestle: IAutoMovieMotionHumanMutual<
    object,
    "one" | "other"
  > = {
    name: "thumbWrestle",
    roles: ["one", "other"],
    act: (
      role: "one" | "other",
      _params: object,
      cast: Readonly<Record<"one" | "other", string>>,
    ): IAutoMovieMotionHumanMutual.IAct => ({
      name: "handshake",
      params: { partner: cast[role === "one" ? "other" : "one"], pumps: 5 },
    }),
  };

  /** A toast of four: two pairs clink at once, host with guest and third with fourth, each as `toast` does. With `at`, a world point in metres, all four bring their glasses to that one point (first pass: the four rims are asked to the same point, so they overlap there; each pair keeps its own instants). `glasses` names each role's held glass; mimed with fists without it. Timing as `toast`; all four glasses meet at once. */
  export const toastOfFour: IAutoMovieMotionHumanMutual<
    IAutoMovieMotionHumanSocial.IToastOfFour,
    "host" | "guest" | "third" | "fourth"
  > = {
    name: "toastOfFour",
    roles: ["host", "guest", "third", "fourth"],
    act: (
      role: "host" | "guest" | "third" | "fourth",
      params: IAutoMovieMotionHumanSocial.IToastOfFour,
      cast: Readonly<Record<"host" | "guest" | "third" | "fourth", string>>,
    ): IAutoMovieMotionHumanMutual.IAct => ({
      name: "fistBump",
      params: {
        partner:
          cast[
            role === "host"
              ? "guest"
              : role === "guest"
                ? "host"
                : role === "third"
                  ? "fourth"
                  : "third"
          ],
        ...(params?.at === undefined ? {} : { at: params.at }),
        ...(params?.glasses === undefined
          ? {}
          : { prop: params.glasses[role] }),
      },
    }),
  };
}
