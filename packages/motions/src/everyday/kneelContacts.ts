import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";

import { HumanSupportFrame } from "../carrier/HumanSupportFrame";
import { kneelKeys } from "./kneelKeys";
import { prepareKneelFoot } from "./prepareKneelFoot";

/**
 * A kneel's contact windows: each foot plants while it keeps its floor point
 * between two keys, from when its toes strike as it lands heel up, and until it
 * lifts off its toe pads as it leaves heel up (`prepareKneelFoot.arrival` and
 * `departure`), and each knee bears on the floor (a `bear` window on its lower
 * leg, at the knee region `HumanContactWindow.REGIONS` gives it) from the key
 * it comes down in until a phase lifts it: the first knee from the third key,
 * the second knee from the fourth. Both lie on the floor the entry's feet stand
 * on, so a kneel on a deck bears on the deck.
 *
 * @param context The action's context, read for the feet's supports.
 * @param keys The solved key states.
 * @param phases The ordered phases indexing those keys, each named on the
 *   clock.
 * @param clock The kneel's clock.
 * @param k The knee that goes down first.
 * @returns The windows, as shares of the clock's duration.
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
    lands?: (phase: { from: number; to: number }) => number,
    leaves?: (phase: { from: number; to: number }) => number,
  ) => void = (
    part: IAutoMovieMotionHumanContactWindow["part"],
    kind: IAutoMovieMotionHumanContactWindow["kind"],
    support: IAutoMovieMotionHumanContactWindow.Support,
    bears: (phase: { from: number; to: number }) => boolean,
    lands?: (phase: { from: number; to: number }) => number,
    leaves?: (phase: { from: number; to: number }) => number,
  ): void => {
    let open: number | undefined;
    phases.forEach(
      (phase: { name: string; from: number; to: number }, i: number): void => {
        const on: boolean = bears(phase);
        const t: number = clock.at(phase.name) / clock.duration;
        const next: number =
          i + 1 < phases.length
            ? clock.at(phases[i + 1]!.name) / clock.duration
            : 1;
        if (on && open === undefined) open = t;
        // A foot that leaves on its toe pads bears until it lifts.
        if (!on && open !== undefined) {
          contacts.push({
            part,
            kind,
            from: open,
            to: t + (leaves?.(phase) ?? 0) * (next - t),
            support,
          });
          open = undefined;
        }
        // A foot that strikes its toes before its phase ends bears from then.
        const strike: number = lands?.(phase) ?? 1;
        if (!on && strike < 1) open = t + strike * (next - t);
      },
    );
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
      (phase: { from: number; to: number }): number =>
        prepareKneelFoot.arrival(
          keys[phase.from]!.feet[side],
          keys[phase.to]!.feet[side],
        ),
      (phase: { from: number; to: number }): number =>
        prepareKneelFoot.departure(
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
