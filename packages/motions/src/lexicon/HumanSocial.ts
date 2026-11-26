import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
  IAutoMovieMotionHumanMutual,
  IAutoMovieMotionHumanSocial,
  IAutoMovieMotionMeeting,
} from "@automovie/interface";

import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { handToFace } from "../daily/handToFace";
import { AutoMovieMotionHumanActionRow } from "../law/AutoMovieMotionHumanActionRow";
import { HUMAN_TOUCH_SOCIAL_COMFORT } from "../next/presets/HUMAN_TOUCH_SOCIAL_COMFORT";
import { HUMAN_TOUCH_SOCIAL_FIRM_PRESS } from "../next/presets/HUMAN_TOUCH_SOCIAL_FIRM_PRESS";
import { HUMAN_TOUCH_SOCIAL_SHOULDER_PAT } from "../next/presets/HUMAN_TOUCH_SOCIAL_SHOULDER_PAT";
import { highFive } from "../touch/highFive";
import { kiss } from "../touch/kiss";
import { touch } from "../touch/touch";

/** The alternatives of `CastEntryItem5`'s site. */
type CastEntryItem5 = "host" | "guest" | "third" | "fourth";

/** The alternatives of `ToastOfFourRole`'s site. */
type ToastOfFourRole = "host" | "guest" | "third" | "fourth";

/** The alternatives of `ToastOfFour`'s site. */
type ToastOfFour = "host" | "guest" | "third" | "fourth";

/** The alternatives of `CastEntryItem4`'s site. */
type CastEntryItem4 = "one" | "other";

/** The alternatives of `ThumbWrestleRole`'s site. */
type ThumbWrestleRole = "one" | "other";

/** The alternatives of `ThumbWrestle`'s site. */
type ThumbWrestle = "one" | "other";

/** The alternatives of `CastEntryItem3`'s site. */
type CastEntryItem3 = "one" | "other";

/** The alternatives of `ArmWrestleRole`'s site. */
type ArmWrestleRole = "one" | "other";

/** The alternatives of `ArmWrestle`'s site. */
type ArmWrestle = "one" | "other";

/** The alternatives of `RockPaperScissors`'s site. */
type RockPaperScissors = "one" | "other";

/** The alternatives of `CastEntryItem2`'s site. */
type CastEntryItem2 = "host" | "guest";

/** The alternatives of `ToastRole`'s site. */
type ToastRole = "host" | "guest";

/** The alternatives of `Toast`'s site. */
type Toast = "host" | "guest";

/** The alternatives of `CastEntryItem`'s site. */
type CastEntryItem = "one" | "other";

/** The record of `IBumpParams`'s site. */
type IBumpParams = { window?: IAutoMovieMotionMeeting.IWindow };

/** The alternatives of `BumpRole`'s site. */
type BumpRole = "one" | "other";

/** The alternatives of `Bump`'s site. */
type Bump = "one" | "other";

/** The record of `IBump`'s site. */
type IBump = { window?: IAutoMovieMotionMeeting.IWindow };

/**
 * Things two people do together or to each other in company, as rows of shipped
 * actions and as mutual records over them (`HumanChain.mutual`). Register the
 * rows a film uses.
 */
export namespace HumanSocial {
  /**
   * A whisper: the lips brought to the partner's ear and held (two seconds,
   * provisional).
   */
  export const whisper: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["whisper"]
  > = AutoMovieMotionHumanActionRow.of("whisper", kiss, {
    region: "earLeft",
    hold: 2,
  });

  /**
   * A kiss on the cheek. The lips stay 0.6 s (`kiss.HOLD`, provisional);
   * greeting, affection.
   */
  export const cheekKiss: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["cheekKiss"]
  > = AutoMovieMotionHumanActionRow.of("cheekKiss", kiss, {
    region: "cheekLeft",
  });

  /**
   * A kiss on the forehead. The lips stay 0.6 s (`kiss.HOLD`, provisional);
   * tenderness, farewell.
   */
  export const foreheadKiss: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["foreheadKiss"]
  > = AutoMovieMotionHumanActionRow.of("foreheadKiss", kiss, {
    region: "forehead",
  });

  /**
   * A pat on the partner's shoulder; the composition gives the shoulder as the
   * target. Two pats of 0.4 s, then 0.4 s, 1.2 s after the reach
   * (`AutoMovieMotionHumanTouchForm.FORMS`, provisional); encouragement,
   * praise.
   */
  export const shoulderPat: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["shoulderPat"]
  > = AutoMovieMotionHumanActionRow.of(
    "shoulderPat",
    touch,
    HUMAN_TOUCH_SOCIAL_SHOULDER_PAT,
  );

  /**
   * A comforting hand held on the partner. Held 2 s after the reach
   * (provisional); condolence, reassurance.
   */
  export const comfort: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["comfort"]
  > = AutoMovieMotionHumanActionRow.of(
    "comfort",
    touch,
    HUMAN_TOUCH_SOCIAL_COMFORT,
  );

  /**
   * A fist bump, one role of it. The fists stay together 0.1 s, then return in
   * the reach's time (`highFive.REBOUND`, provisional); a friendly greeting
   * between peers.
   */
  export const fistBump: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["fistBump"]
  > = AutoMovieMotionHumanActionRow.of("fistBump", highFive, {
    kind: "fist",
  });

  /**
   * A low five, one role of it. The hands stay together 0.1 s, then return in
   * the reach's time (`highFive.REBOUND`, provisional); a low-key greeting, a
   * child's game.
   */
  export const lowFive: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["lowFive"]
  > = AutoMovieMotionHumanActionRow.of("lowFive", highFive, {
    kind: "low",
  });

  /**
   * A sip taken after a toast. Takes the sip as the `sip` drink row does: held
   * 0.5 s at the mouth (`handToFaceRows.ROWS`, provisional).
   */
  export const toastSip: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["toastSip"]
  > = AutoMovieMotionHumanActionRow.of("toastSip", handToFace, {
    kind: "sip",
  });

  /**
   * A fist bump between two people: both perform `fistBump`. With `window`,
   * film seconds, the fists meet no earlier than its `from` and part at its
   * `to` (`AutoMovieMotionMeeting.IWindow`).
   */
  export const bump: IAutoMovieMotionHumanMutual<IBump, Bump> = {
    name: "fistBump",
    roles: ["one", "other"],
    act: (
      role: BumpRole,
      params: IBumpParams,
      cast: Readonly<Record<CastEntryItem, string>>,
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
   * performs `fistBump` with its glass as the prop. `glasses` names each role's
   * held glass; without it the toast is mimed and the fists meet. `window`,
   * film seconds, holds the clink over it as `bump`'s does.
   *
   * Each glass reaches the shared point in the reach-to-grasp time of its
   * travel, about 0.5 s for 0.4 m (`IAutoMovieMotionHumanPickUp`), and the
   * glasses stay together 0.1 s (`highFive.REBOUND`, provisional); a
   * celebration, a dinner.
   */
  export const toast: IAutoMovieMotionHumanMutual<
    IAutoMovieMotionHumanSocial.IToast,
    Toast
  > = {
    name: "toast",
    roles: ["host", "guest"],
    act: (
      role: ToastRole,
      params: IAutoMovieMotionHumanSocial.IToast,
      cast: Readonly<Record<CastEntryItem2, string>>,
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

  /**
   * A pinky promise, one role of it: the hands meet at chest height as fists do
   * (first pass; the hooked little fingers are not shaped). The fists meet as a
   * fist bump does (`highFive.REBOUND`, 0.1 s); the hooked fingers are not
   * shaped; a promise between friends.
   */
  export const pinkyPromise: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["pinkyPromise"]
  > = AutoMovieMotionHumanActionRow.of("pinkyPromise", highFive, {
    kind: "fist",
  });

  /**
   * Rock, paper, scissors: both players pump a fist three times on one start
   * (first pass: each performs `shakeFist` three times; the shared count is the
   * common start, and the throw's hand shape is not set). Three fist pumps on
   * one start; the pump's period is the `shakeFist` law's (provisional, missing
   * a source); settling a choice between two people.
   */
  export const rockPaperScissors: IAutoMovieMotionHumanMutual<
    object,
    RockPaperScissors
  > = {
    name: "rockPaperScissors",
    roles: ["one", "other"],
    act: (): IAutoMovieMotionHumanMutual.IAct => ({
      name: "shakeFist",
      params: { count: 3 },
    }),
  };

  /**
   * A firm, slow pat or press of the palm on the partner (Laban's press:
   * strong, sustained, direct); the composition gives the region. The press
   * takes 0.4 s and holds 1.2 s (`touch`'s defaults, provisional); steadying,
   * emphasis.
   */
  export const firmPress: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["firmPress"]
  > = AutoMovieMotionHumanActionRow.of(
    "firmPress",
    touch,
    HUMAN_TOUCH_SOCIAL_FIRM_PRESS,
  );

  /**
   * A light, quick flick of the fingertips on the partner, as brushing lint off
   * a shoulder (Laban's flick: light, sudden, indirect); the composition gives
   * the region. One stroke lasting a flick's 0.151 s, a proxy from a flick
   * gesture's duration (`touch.FLICK`, Moyle and Cockburn 2003), sped further
   * by the flick manner; brushing lint off, dismissing.
   */
  export const flickOff: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["flickOff"]
  > = AutoMovieMotionHumanActionRow.of("flickOff", touch.stroked(touch.FLICK), {
    effector: "fingertips",
    kind: "stroke",
    manner: AutoMovieMotionManner.PRESETS.flick,
  });

  /**
   * Arm wrestling across a table: both perform `armWrestle` on one point of the
   * table's top, `table` in world metres, and `winner` pins the other after
   * `seconds` of struggle (3 when absent), the forearms ending `pin` degrees
   * from upright (the law's own when absent; an angle past either arm's range
   * is refused with the angle it holds). Register the `armWrestle` law with it.
   * The pin lands 3 s after the go when `seconds` is absent, the forearms
   * ending 70 degrees from upright (`armWrestle.PIN`, provisional: no timing or
   * angle study); a friendly contest, a show of strength.
   */
  export const armWrestle: IAutoMovieMotionHumanMutual<
    IAutoMovieMotionHumanSocial.IArmWrestle,
    ArmWrestle
  > = {
    name: "armWrestle",
    roles: ["one", "other"],
    act: (
      role: ArmWrestleRole,
      params: IAutoMovieMotionHumanSocial.IArmWrestle,
      cast: Readonly<Record<CastEntryItem3, string>>,
    ): IAutoMovieMotionHumanMutual.IAct => {
      if (params === undefined)
        throw new Error("An arm wrestle states its table point and its winner");
      return {
        name: "armWrestle",
        params: {
          partner: cast[role === "one" ? "other" : "one"],
          table: params.table,
          wins: params.winner === role,
          ...(params.pads?.[role] === undefined
            ? {}
            : { pad: params.pads[role] }),
          ...(params.seconds === undefined ? {} : { seconds: params.seconds }),
          ...(params.pin === undefined ? {} : { pin: params.pin }),
        },
      };
    },
  };

  /**
   * Thumb wrestling, first pass: the clasp of a handshake held through five
   * small pumps (the thumbs' own play is not staged yet). Five pumps at the
   * handshake's 2.43 Hz, about 2.1 s (Tagne et al. 2016; `handshake`), after
   * the clasp; a playful contest between friends or siblings.
   */
  export const thumbWrestle: IAutoMovieMotionHumanMutual<object, ThumbWrestle> =
    {
      name: "thumbWrestle",
      roles: ["one", "other"],
      act: (
        role: ThumbWrestleRole,
        _params: object,
        cast: Readonly<Record<CastEntryItem4, string>>,
      ): IAutoMovieMotionHumanMutual.IAct => ({
        name: "handshake",
        params: { partner: cast[role === "one" ? "other" : "one"], pumps: 5 },
      }),
    };

  /**
   * A toast of four: two pairs clink at once, host with guest and third with
   * fourth, each as `toast` does. With `at`, a world point in metres, all four
   * bring their glasses to that one point (first pass: the four rims are asked
   * to the same point, so they overlap there; each pair keeps its own
   * instants). `glasses` names each role's held glass; mimed with fists without
   * it. Timing as `toast`; all four glasses meet at once.
   */
  export const toastOfFour: IAutoMovieMotionHumanMutual<
    IAutoMovieMotionHumanSocial.IToastOfFour,
    ToastOfFour
  > = {
    name: "toastOfFour",
    roles: ["host", "guest", "third", "fourth"],
    act: (
      role: ToastOfFourRole,
      params: IAutoMovieMotionHumanSocial.IToastOfFour,
      cast: Readonly<Record<CastEntryItem5, string>>,
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
