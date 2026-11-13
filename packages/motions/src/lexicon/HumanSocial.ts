import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
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
    region: "jawLeft",
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

  /** A fist bump between two people: both perform `fistBump`. */
  export const bump: IHumanMutual<object, "one" | "other"> = {
    name: "fistBump",
    roles: ["one", "other"],
    act: (role, _params, cast) => ({
      name: "fistBump",
      params: { partner: cast[role === "one" ? "other" : "one"] },
    }),
  };

  /**
   * A toast: each role brings the glass its right hand holds to one shared
   * point at the mean of the two chest heights (provisional: no source for a
   * clink's height was read), the glass upright, so the rims meet. Each
   * performs `fistBump` with its glass as the prop. `glasses` names each
   * role's held glass; without it the toast is mimed and the fists meet.
   */
  export const toast: IHumanMutual<
    { glasses?: Record<"host" | "guest", string> },
    "host" | "guest"
  > = {
    name: "toast",
    roles: ["host", "guest"],
    act: (role, params, cast) => ({
      name: "fistBump",
      params: {
        partner: cast[role === "host" ? "guest" : "host"],
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
    act: () => ({ name: "shakeFist", params: { count: 3 } }),
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

  /** Arm wrestling, first pass: both clasp right hands and hold the clasp through three slow pumps (the elbows on a table, the struggle and the pin are not staged yet). */
  export const armWrestle: IHumanMutual<object, "one" | "other"> = {
    name: "armWrestle",
    roles: ["one", "other"],
    act: (role, _params, cast) => ({
      name: "handshake",
      params: { partner: cast[role === "one" ? "other" : "one"], pumps: 3 },
    }),
  };

  /** Thumb wrestling, first pass: the clasp of a handshake held through five small pumps (the thumbs' own play is not staged yet). */
  export const thumbWrestle: IHumanMutual<object, "one" | "other"> = {
    name: "thumbWrestle",
    roles: ["one", "other"],
    act: (role, _params, cast) => ({
      name: "handshake",
      params: { partner: cast[role === "one" ? "other" : "one"], pumps: 5 },
    }),
  };

  /** A toast of four: two pairs clink at once, host with guest and third with fourth, each as `toast` does. With `at`, a world point in metres, all four bring their glasses to that one point (first pass: the four rims are asked to the same point, so they overlap there; each pair keeps its own instants). `glasses` names each role's held glass; mimed with fists without it. */
  export const toastOfFour: IHumanMutual<
    {
      glasses?: Record<"host" | "guest" | "third" | "fourth", string>;
      at?: { x: number; y: number; z: number };
    },
    "host" | "guest" | "third" | "fourth"
  > = {
    name: "toastOfFour",
    roles: ["host", "guest", "third", "fourth"],
    act: (role, params, cast) => ({
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
