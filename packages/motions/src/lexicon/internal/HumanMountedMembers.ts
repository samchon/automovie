import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanMounted,
} from "@automovie/interface";

import { HumanMountedPaths } from "./HumanMountedPaths";
import { HumanMountedSeats } from "./HumanMountedSeats";

/**
 * The supports each figure holds, as contact windows by support: the seat while
 * a figure sits, each part's named support, and for an entered figure that
 * names none the entry's planted feet on the stirrups the first figure names,
 * or on whatever they rest on; with the supports held at the start (the seat,
 * the entering hands' grips and those feet).
 *
 * @param context The mounted performance's context.
 * @param gripped The hands that enter holding.
 * @returns The supports held at the start and each figure's windows.
 */
export function HumanMountedMembers(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanMounted>,
  gripped: ReadonlySet<AutoMovieHumanSide>,
): HumanMountedMembers.IMembers {
  const { on, figures }: IAutoMovieMotionHumanMounted = context.params;
  // The windows each support holds.
  // The entry's planted feet are held on the stirrups the first figure names, or on whatever they rest on.
  const held: Set<string> = new Set(["seat"]);
  for (const side of gripped)
    held.add(`${side}Hand:${figures[0]!.supports![`${side}Hand`]}`);
  const kept: Map<string, IAutoMovieMotionHumanContactWindow> = new Map();
  for (const side of ["left", "right"] as const)
    if (context.entry.feet[side].planted) {
      const named: string | undefined = figures[0]!.supports?.[`${side}Foot`];
      const key: string = `${side}Foot:${named ?? "entry"}`;
      held.add(key);
      kept.set(key, HumanMountedPaths.window(`${side}Foot`, on, named));
    }
  const members: Map<string, IAutoMovieMotionHumanContactWindow>[] =
    figures.map(
      (
        figure: IAutoMovieMotionHumanMounted.IFigure,
      ): Map<string, IAutoMovieMotionHumanContactWindow> => {
        const member: Map<string, IAutoMovieMotionHumanContactWindow> =
          figure.seat === "entered" && !HumanMountedPaths.names(figure)
            ? new Map(kept)
            : new Map();
        if (HumanMountedSeats.sits(figure.seat))
          member.set("seat", {
            part: "seat",
            kind: "seat",
            from: 0,
            to: 1,
            support: { kind: "prop", subject: on },
          });
        for (const part of HumanMountedMembers.PARTS) {
          const id: string | undefined = figure.supports?.[part];
          if (id !== undefined)
            member.set(`${part}:${id}`, HumanMountedPaths.window(part, on, id));
        }
        return member;
      },
    );
  return { held, members };
}

/** The records of HumanMountedMembers and the parts the admission shares. */
export namespace HumanMountedMembers {
  /** The supports a mounted performance holds. */
  export interface IMembers {
    /** The supports held at the start, by key. */
    held: Set<string>;

    /** Each figure's contact windows, by support key. */
    members: Map<string, IAutoMovieMotionHumanContactWindow>[];
  }

  /** A supporting part a figure can name. */
  export type Part = HumanMountedSeats.Part;

  /** Every supporting part, in the order the contact windows list them. */
  export const PARTS: readonly Part[] = [
    "leftHand",
    "rightHand",
    "leftFoot",
    "rightFoot",
    "leftKnee",
    "rightKnee",
    "rightThigh",
  ];
}
