import type {
  AutoMovieHumanSide,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";

/**
 * A stair climb's plant windows: each foot bears between its swings, from the
 * tread contact that brings it to a print to the next toe-off that leaves it,
 * on the floor at level 0 and on the flight above it, a flight on a named prop
 * bearing on that prop.
 *
 * @param prints Each foot's prints in order, with the step that brings it.
 * @param clock The climb's clock.
 * @param duration The climb's length, seconds.
 * @param flight The flight's floor height, its riser, its direction's sign and
 *   the prop it belongs to.
 * @returns The plant windows, as shares of the climb.
 */
export function climbStairsPlants(
  prints: Readonly<
    Record<AutoMovieHumanSide, readonly climbStairsPlants.IPrinted[]>
  >,
  clock: IAutoMovieMotionClock,
  duration: number,
  flight: climbStairsPlants.IFlight,
): IAutoMovieMotionHumanContactWindow[] {
  const contacts: IAutoMovieMotionHumanContactWindow[] = [];
  for (const side of ["left", "right"] as const) {
    const list: readonly climbStairsPlants.IPrinted[] = prints[side];
    for (let i: number = 0; i < list.length; i++) {
      const level: number = list[i]!.print.level;
      const from: number =
        i === 0 ? 0 : clock.at(`treadContact${list[i]!.step}`) / duration;
      const to: number =
        i + 1 < list.length
          ? clock.at(`toeOff${list[i + 1]!.step}`) / duration
          : 1;
      contacts.push({
        part: side === "left" ? "leftFoot" : "rightFoot",
        kind: "plant",
        from,
        to,
        support:
          level === 0
            ? { kind: "ground" }
            : flight.on === undefined
              ? {
                  kind: "ground",
                  height: flight.floor + flight.sign * level * flight.riser,
                }
              : { kind: "prop", subject: flight.on },
      });
    }
  }
  return contacts;
}

/** What a climb's plant windows read. */
export namespace climbStairsPlants {
  /** A print and the step that brings a foot to it. */
  export interface IPrinted {
    /** The print's level on the flight. */
    print: { level: number };

    /** The step, 0 for the entry's print. */
    step: number;
  }

  /** The flight's heights and owner. */
  export interface IFlight {
    /** The flight's floor height, world metres. */
    floor: number;

    /** One riser, metres. */
    riser: number;

    /** 1 climbing up, -1 down. */
    sign: number;

    /** The prop the flight belongs to; none on a fixed flight. */
    on?: string;
  }
}
