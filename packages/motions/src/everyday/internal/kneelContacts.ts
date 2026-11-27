import type {
  AutoMovieHumanSide,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";

import { HumanSupportFrame } from "../../carrier/internal/HumanSupportFrame";
import { kneelKeys } from "./kneelKeys";
import { prepareKneelFoot } from "./prepareKneelFoot";

/** The record of `IKneelContactsPhase4`'s site. */
type IKneelContactsPhase4 = { from: number; to: number };

/** The record of `IKneelContactsPhase3`'s site. */
type IKneelContactsPhase3 = { from: number; to: number };

/** The record of `IKneelContactsPhase2`'s site. */
type IKneelContactsPhase2 = { from: number; to: number };

/** The record of `IKneelContactsPhase`'s site. */
type IKneelContactsPhase = { from: number; to: number };

/** The record of `IKneelContactsSpanPhase`'s site. */
type IKneelContactsSpanPhase = { name: string; from: number; to: number };

/** The record of `ISpanLeavesPhase2`'s site. */
type ISpanLeavesPhase2 = { from: number; to: number };

/** The record of `ISpanLandsPhase2`'s site. */
type ISpanLandsPhase2 = { from: number; to: number };

/** The record of `ISpanBearsPhase2`'s site. */
type ISpanBearsPhase2 = { from: number; to: number };

/** The record of `ISpanLeavesPhase`'s site. */
type ISpanLeavesPhase = { from: number; to: number };

/** The record of `ISpanLandsPhase`'s site. */
type ISpanLandsPhase = { from: number; to: number };

/** The record of `ISpanBearsPhase`'s site. */
type ISpanBearsPhase = { from: number; to: number };

/** The record of `IKneelContactsPhasesItem`'s site. */
type IKneelContactsPhasesItem = { name: string; from: number; to: number };

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
  phases: readonly IKneelContactsPhasesItem[],
  clock: IAutoMovieMotionClock,
  k: AutoMovieHumanSide,
): IAutoMovieMotionHumanContactWindow[] {
  const contacts: IAutoMovieMotionHumanContactWindow[] = [];
  const span: (
    part: IAutoMovieMotionHumanContactWindow["part"],
    kind: IAutoMovieMotionHumanContactWindow["kind"],
    support: IAutoMovieMotionHumanContactWindow.Support,
    bears: (phase: ISpanBearsPhase) => boolean,
    lands?: (phase: ISpanLandsPhase) => number,
    leaves?: (phase: ISpanLeavesPhase) => number,
  ) => void = (
    part: IAutoMovieMotionHumanContactWindow["part"],
    kind: IAutoMovieMotionHumanContactWindow["kind"],
    support: IAutoMovieMotionHumanContactWindow.Support,
    bears: (phase: ISpanBearsPhase2) => boolean,
    lands?: (phase: ISpanLandsPhase2) => number,
    leaves?: (phase: ISpanLeavesPhase2) => number,
  ): void => {
    let open: number | undefined;
    phases.forEach((phase: IKneelContactsSpanPhase, i: number): void => {
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
    });
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
      (phase: IKneelContactsPhase): boolean =>
        kneelKeys.still(
          keys[phase.from]!.feet[side],
          keys[phase.to]!.feet[side],
        ),
      (phase: IKneelContactsPhase2): number =>
        prepareKneelFoot.arrival(
          keys[phase.from]!.feet[side],
          keys[phase.to]!.feet[side],
        ),
      (phase: IKneelContactsPhase3): number =>
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
      (phase: IKneelContactsPhase4): boolean =>
        Math.min(phase.from, phase.to) >= down,
    );
  }
  return contacts;
}
