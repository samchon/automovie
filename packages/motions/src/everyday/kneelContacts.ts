import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";

import { HumanSupportFrame } from "../carrier/HumanSupportFrame";
import { kneelKeys } from "./kneelKeys";

/**
 * A kneel's contact windows: each foot plants while it keeps its floor point
 * between two keys, and each knee bears on the floor (a `bear` window on its
 * lower leg, at the knee region `HumanContactWindow.REGIONS` gives it) from
 * the key it comes down in until a phase lifts it: the first knee from the
 * third key, the second knee from the fourth. Both lie on the floor the
 * entry's feet stand on, so a kneel on a deck bears on the deck.
 *
 * @param context The action's context, read for the feet's supports.
 * @param keys The solved key states.
 * @param phases The ordered phases indexing those keys, each named on the clock.
 * @param clock The kneel's clock.
 * @param k The knee that goes down first.
 * @returns The windows, as shares of the clock's duration.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which part bears when, on which floor, and the share timebase.
 * @evidence contracts/development/implementation.md#principled-implementation A window opens at the start of the first phase whose two keys both hold the contact and closes at the start of the first that does not; a foot holds when `kneelKeys.still`, a knee when both keys are at or past the one it lands in.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One open/close scan per part over the phases, four parts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The knees' windows come from the keys that put them on the floor, never from a sampled height; the support is the entry's, defaulting to the ground only when the entry declares none.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four scans of the P phases, O(P) once per plan.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each side's floor support is read once and serves its foot and its knee.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
 */
export function kneelContacts(
  context: Pick<IAutoMovieMotionHumanActionContext, "entry">,
  keys: readonly kneelKeys.IKey[],
  phases: readonly { name: string; from: number; to: number }[],
  clock: IAutoMovieMotionClock,
  k: "left" | "right",
): IAutoMovieMotionHumanContactWindow[] {
  const contacts: IAutoMovieMotionHumanContactWindow[] = [];
  const span: (
    part: IAutoMovieMotionHumanContactWindow["part"],
    kind: IAutoMovieMotionHumanContactWindow["kind"],
    support: IAutoMovieMotionHumanContactWindow.Support,
    bears: (phase: { from: number; to: number }) => boolean,
  ) => void = (
    part: IAutoMovieMotionHumanContactWindow["part"],
    kind: IAutoMovieMotionHumanContactWindow["kind"],
    support: IAutoMovieMotionHumanContactWindow.Support,
    bears: (phase: { from: number; to: number }) => boolean,
  ): void => {
    let open: number | undefined;
    for (const phase of phases) {
      const on: boolean = bears(phase);
      const t: number = clock.at(phase.name) / clock.duration;
      if (on && open === undefined) open = t;
      if (!on && open !== undefined) {
        contacts.push({ part, kind, from: open, to: t, support });
        open = undefined;
      }
    }
    if (open !== undefined)
      contacts.push({ part, kind, from: open, to: 1, support });
  };
  for (const side of ["left", "right"] as const) {
    const floor: IAutoMovieMotionHumanContactWindow.Support =
      HumanSupportFrame.contact(context, `${side}Foot`);
    span(
      `${side}Foot`,
      "plant",
      floor,
      (phase: { from: number; to: number }): boolean =>
        kneelKeys.still(
          keys[phase.from]!.feet[side],
          keys[phase.to]!.feet[side],
        ),
    );
    const down: number = side === k ? 2 : 3;
    span(
      `${side}LowerLeg`,
      "bear",
      floor,
      (phase: { from: number; to: number }): boolean =>
        Math.min(phase.from, phase.to) >= down,
    );
  }
  return contacts;
}
