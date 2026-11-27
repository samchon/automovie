import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";

/*
 * A foot strike's contact windows: the kicking foot planted until it is
 * released, and the support foot on its ball throughout, or around a jump's
 * flight; risen with the strike, a spin or a back kick turns it there.
 * Parameter prepared: The strike's prepared values.
 * Returns: The windows, shares of the strike's duration.
 */
export function footStrikeContacts(
  prepared: footStrikeContacts.IPrepared,
): IAutoMovieMotionHumanContactWindow[] {
  const {
    side,
    support,
    release,
    duration,
    jump,
    flight,
  }: footStrikeContacts.IPrepared = prepared;
  const contacts: IAutoMovieMotionHumanContactWindow[] = [
    {
      part: `${side}Foot`,
      kind: "plant",
      from: 0,
      to: release / duration,
      support: { kind: "ground" },
    },
  ];
  contacts.push(
    ...(jump
      ? [
          [0, flight[0]],
          [flight[1], 1],
        ]
      : [[0, 1]]
    ).map(
      ([from, to]: readonly number[]): IAutoMovieMotionHumanContactWindow => ({
        part: `${support}Foot`,
        // The support stands on its ball, risen with the strike, and a
        // spin or a back kick turns it there.
        kind: "pivot",
        from: from!,
        to: to!,
        support: { kind: "ground" },
      }),
    ),
  );
  return contacts;
}

/*
 * Companion types of footStrikeContacts.
 */
export namespace footStrikeContacts {
  /*
   * What `footStrike.plan` prepared before its contacts.
   */
  export interface IPrepared {
    /*
     * The kicking side.
     */
    side: AutoMovieHumanSide;

    /*
     * The support side.
     */
    support: AutoMovieHumanSide;

    /*
     * The second the kicking foot leaves its plant.
     */
    release: number;

    /*
     * The strike's duration, seconds.
     */
    duration: number;

    /*
     * Whether the strike is jumped.
     */
    jump: boolean;

    /*
     * A jump's flight, shares of the duration.
     */
    flight: readonly [number, number];
  }
}
