import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanPropReader,
} from "@automovie/interface";

import { HumanBound } from "../../law/internal/HumanBound";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanMountedSeats } from "./HumanMountedSeats";

/*
 * Admit one figure of a mounted performance (`HumanMounted`): its transfer and
 * hold seconds, its supports against what its seat kind reads and the carrier
 * declares, each hand keeping one contact through the whole performance, and
 * the transfer into it keeping a support held through it, the seat or a part on
 * the same contact, so weight passes to the next support before the last is
 * released.
 * Parameter on: The carrier's subject id.
 * Parameter support: The carrier.
 * Parameter figures: Every figure, in order.
 * Parameter index: The figure admitted.
 * Parameter parts: Every supporting part, in the order the law lists them.
 * Parameter hands: The contact each hand holds so far, filled as figures are
 * admitted.
 * Parameter planted: Whether each entry foot stands on something.
 * Parameter stride: The performance's stride, seconds, when given.
 * For a transfer of no time, a negative hold, a support
 * the seat kind lacks or does not read, a contact the carrier lacks, a hand
 * that changes contact, a transfer that holds no support through it, an
 * entered figure naming a stirrup the entry's foot is not in, or a hand ride
 * without a stride and both reins.
 */
export function admitHumanMountedFigure(
  on: string,
  support: IAutoMovieMotionHumanPropReader,
  figures: readonly IAutoMovieMotionHumanMounted.IFigure[],
  index: number,
  parts: readonly HumanMountedSeats.Part[],
  hands: Partial<Record<AutoMovieHumanSide, string>>,
  planted: Readonly<Record<AutoMovieHumanSide, boolean>>,
  stride: number | undefined,
): void {
  const figure: IAutoMovieMotionHumanMounted.IFigure = figures[index]!;
  HumanBound.above(`figures.${index}.transfer`, figure.transfer, 0, "s");
  HumanBound.least(`figures.${index}.seconds`, figure.hold, 0, "s");
  const [required, optional]: readonly [
    readonly HumanMountedSeats.Part[],
    readonly HumanMountedSeats.Part[],
  ] = HumanMountedSeats.parts(figure.seat);
  const contacts: readonly IAutoMovieAffordance[] =
    support.prop.affordances ?? [];
  for (const part of parts) {
    const id: string | undefined = figure.supports?.[part];
    const axis: string = `figures.${index}.supports.${part}`;
    if (id === undefined) {
      if (required.includes(part))
        throw new HumanRefusal({
          kind: "parameter",
          axis,
          value: undefined,
          feasible: null,
          reason: `the ${figure.seat} seat needs the ${part} support`,
          fix: `name the carrier contact the ${part} bears on`,
        });
      continue;
    }
    if (!required.includes(part) && !optional.includes(part))
      throw new HumanRefusal({
        kind: "parameter",
        axis,
        value: id,
        feasible: null,
        reason: `the ${figure.seat} seat does not use the ${part}`,
        fix: "leave that support out of the figure",
      });
    if (!contacts.some((a: IAutoMovieAffordance): boolean => a.id === id))
      throw new HumanRefusal({
        kind: "affordance",
        axis,
        value: id,
        feasible: {
          kind: "alternatives",
          values: contacts.map((a: IAutoMovieAffordance): string => a.id),
        },
        reason: `${on} declares no contact ${id}`,
        fix: "name one of the carrier's contacts",
      });
    if (part === "leftHand" || part === "rightHand") {
      const side: AutoMovieHumanSide = part === "leftHand" ? "left" : "right";
      const held: string | undefined = hands[side];
      if (held !== undefined && held !== id)
        throw new HumanRefusal({
          kind: "parameter",
          axis,
          value: id,
          feasible: { kind: "alternatives", values: [held] },
          reason: `the ${side} hand already holds ${held} in this performance`,
          fix: "keep each hand on one contact, or split the performance",
        });
      hands[side] = id;
    }
  }

  // A transfer keeps the seat, or one part on the same contact, through it.
  const before: IAutoMovieMotionHumanMounted.IFigure | undefined =
    figures[index - 1];
  const seat: boolean =
    HumanMountedSeats.sits(figure.seat) &&
    (before === undefined || HumanMountedSeats.sits(before.seat));
  const kept: boolean =
    before !== undefined &&
    parts.some(
      (part: HumanMountedSeats.Part): boolean =>
        figure.supports?.[part] !== undefined &&
        before.supports?.[part] === figure.supports[part],
    );
  if (!seat && !kept)
    throw new HumanRefusal({
      kind: "parameter",
      axis: `figures.${index}.supports`,
      value: figure.seat,
      feasible: null,
      reason: `the transfer into figure ${index} keeps neither the seat nor a support on the same contact, so the body would let go of every support`,
      fix: "hold a handle or a stirrup through the transfer, or keep the seat",
    });
  // An entered figure's stirrups are the entry's own, and a hand ride pushes both reins once a stride.
  for (const side of ["left", "right"] as const)
    if (
      figure.seat === "entered" &&
      figure.supports?.[`${side}Foot`] !== undefined &&
      !planted[side]
    )
      throw new HumanRefusal({
        kind: "affordance",
        axis: `figures.${index}.supports.${side}Foot`,
        value: figure.supports[`${side}Foot`],
        feasible: null,
        reason: `the entered seat names the ${side} stirrup, and the entry's ${side} foot rests on nothing`,
        fix: "enter with that foot in its stirrup, or leave it out of the entered figure",
      });
  if (
    figure.handRide === true &&
    (stride === undefined ||
      figure.supports?.leftHand === undefined ||
      figure.supports.rightHand === undefined)
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: `figures.${index}.handRide`,
      value: true,
      feasible: null,
      reason:
        "a hand ride pushes both held reins once a stride, and the performance names no stride or the figure holds no two reins",
      fix: "give the carrier's stride and both hands' reins",
    });
}
