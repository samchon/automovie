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

  /** A toast: the glasses meet as fists do at chest height, each role performing `fistBump` (provisional until a held glass is the effector). */
  export const toast: IHumanMutual<object, "host" | "guest"> = {
    name: "toast",
    roles: ["host", "guest"],
    act: (role, _params, cast) => ({
      name: "fistBump",
      params: { partner: cast[role === "host" ? "guest" : "host"] },
    }),
  };
}
