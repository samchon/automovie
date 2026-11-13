import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { AutoMovieMotionMeeting } from "../compose/AutoMovieMotionMeeting";
import { handToFace } from "../daily/handToFace";
import { HumanActionRow } from "../law/HumanActionRow";
import type { IHumanMutual } from "../law/IHumanMutual";
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
  export const whisper = HumanActionRow.of("whisper", kiss, {
    region: "earLeft",
    hold: 2,
  });

  /** A kiss on the cheek. */
  export const cheekKiss = HumanActionRow.of("cheekKiss", kiss, {
    region: "cheekLeft",
  });

  /** A kiss on the forehead. */
  export const foreheadKiss = HumanActionRow.of("foreheadKiss", kiss, {
    region: "forehead",
  });

  /** A pat on the partner's shoulder; the composition gives the shoulder as the target. */
  export const shoulderPat = HumanActionRow.of("shoulderPat", touch, {
    with: "palm",
    kind: "pat",
    count: 2,
  });

  /** A comforting hand held on the partner. */
  export const comfort = HumanActionRow.of("comfort", touch, {
    with: "palm",
    kind: "hold",
    hold: 2,
  });

  /** A fist bump, one role of it. */
  export const fistBump = HumanActionRow.of("fistBump", highFive, {
    kind: "fist",
  });

  /** A low five, one role of it. */
  export const lowFive = HumanActionRow.of("lowFive", highFive, {
    kind: "low",
  });

  /** A sip taken after a toast. */
  export const toastSip = HumanActionRow.of("toastSip", handToFace, {
    task: "sip",
  });

  /** A fist bump between two people: both perform `fistBump`. With `window`, film seconds, the fists meet no earlier than its `from` and part at its `to` (`AutoMovieMotionMeeting.IWindow`). */
  export const bump: IHumanMutual<
    { window?: AutoMovieMotionMeeting.IWindow },
    "one" | "other"
  > = {
    name: "fistBump",
    roles: ["one", "other"],
    act: (
      role: "one" | "other",
      params: { window?: AutoMovieMotionMeeting.IWindow },
      cast: Readonly<Record<"one" | "other", string>>,
    ): IHumanMutual.IAct => ({
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
   */
  export const toast: IHumanMutual<IToast, "host" | "guest"> = {
    name: "toast",
    roles: ["host", "guest"],
    act: (
      role: "host" | "guest",
      params: IToast,
      cast: Readonly<Record<"host" | "guest", string>>,
    ): IHumanMutual.IAct => ({
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

  /** A pinky promise, one role of it: the hands meet at chest height as fists do (first pass; the hooked little fingers are not shaped). */
  export const pinkyPromise = HumanActionRow.of("pinkyPromise", highFive, {
    kind: "fist",
  });

  /** Rock, paper, scissors: both players pump a fist three times on one start (first pass: each performs `shakeFist` three times; the shared count is the common start, and the throw's hand shape is not set). */
  export const rockPaperScissors: IHumanMutual<object, "one" | "other"> = {
    name: "rockPaperScissors",
    roles: ["one", "other"],
    act: (): IHumanMutual.IAct => ({
      name: "shakeFist",
      params: { count: 3 },
    }),
  };

  /** A firm, slow pat or press of the palm on the partner (Laban's press: strong, sustained, direct); the composition gives the region. */
  export const firmPress = HumanActionRow.of("firmPress", touch, {
    with: "palm",
    kind: "press",
    manner: AutoMovieMotionManner.PRESETS.press,
  });

  /** A light, quick flick of the fingertips on the partner, as brushing lint off a shoulder (Laban's flick: light, sudden, indirect); the composition gives the region. */
  export const flickOff = HumanActionRow.of("flickOff", touch, {
    with: "fingertips",
    kind: "stroke",
    manner: AutoMovieMotionManner.PRESETS.flick,
  });

  /** Arm wrestling across a table: both perform `armWrestle` on one point of the table's top, `table` in world metres, and `winner` pins the other after `seconds` of struggle (3 when absent), the forearms ending `pin` degrees from upright (the law's own when absent; an angle past either arm's range is refused with the angle it holds). Register the `armWrestle` law with it. */
  export const armWrestle: IHumanMutual<IArmWrestle, "one" | "other"> = {
    name: "armWrestle",
    roles: ["one", "other"],
    act: (
      role: "one" | "other",
      params: IArmWrestle,
      cast: Readonly<Record<"one" | "other", string>>,
    ): IHumanMutual.IAct => {
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

  /** Thumb wrestling, first pass: the clasp of a handshake held through five small pumps (the thumbs' own play is not staged yet). */
  export const thumbWrestle: IHumanMutual<object, "one" | "other"> = {
    name: "thumbWrestle",
    roles: ["one", "other"],
    act: (
      role: "one" | "other",
      _params: object,
      cast: Readonly<Record<"one" | "other", string>>,
    ): IHumanMutual.IAct => ({
      name: "handshake",
      params: { partner: cast[role === "one" ? "other" : "one"], pumps: 5 },
    }),
  };

  /** A toast of four: two pairs clink at once, host with guest and third with fourth, each as `toast` does. With `at`, a world point in metres, all four bring their glasses to that one point (first pass: the four rims are asked to the same point, so they overlap there; each pair keeps its own instants). `glasses` names each role's held glass; mimed with fists without it. */
  export const toastOfFour: IHumanMutual<
    IToastOfFour,
    "host" | "guest" | "third" | "fourth"
  > = {
    name: "toastOfFour",
    roles: ["host", "guest", "third", "fourth"],
    act: (
      role: "host" | "guest" | "third" | "fourth",
      params: IToastOfFour,
      cast: Readonly<Record<"host" | "guest" | "third" | "fourth", string>>,
    ): IHumanMutual.IAct => ({
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

  /**
   * The shared parameters of `toast`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it names and its default.
   * @evidence contracts/development/design.md#principled-representation The glasses by role and the clink's window.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two optional members, both read by the record's act.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A glass is a prop id the performance already holds.
   */
  export interface IToast {
    /** Each role's held glass, by its prop id; mimed with fists when absent. */
    glasses?: Record<"host" | "guest", string>;

    /** Film seconds the clink is held over. */
    window?: AutoMovieMotionMeeting.IWindow;
  }

  /**
   * The shared parameters of `armWrestle`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation The table's point, the winner and the struggle's time and end.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, all read by the record's act.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The pin's angle is checked against the arms' range by the law, not here.
   */
  export interface IArmWrestle {
    /** The table's point the hands meet over, world metres. */
    table: { x: number; y: number; z: number };

    /** The role that pins the other. */
    winner: "one" | "other";

    /** Seconds of struggle; 3 when absent. */
    seconds?: number;

    /** The forearms' angle from upright at the pin, degrees; the law's own when absent. */
    pin?: number;
  }

  /**
   * The shared parameters of `toastOfFour`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it names and its default.
   * @evidence contracts/development/design.md#principled-representation The glasses by role and the one meeting point.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two optional members, both read by the record's act.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A glass is a prop id the performance already holds.
   */
  export interface IToastOfFour {
    /** Each role's held glass, by its prop id; mimed with fists when absent. */
    glasses?: Record<"host" | "guest" | "third" | "fourth", string>;

    /** The one world point all four glasses come to, metres. */
    at?: { x: number; y: number; z: number };
  }
}
