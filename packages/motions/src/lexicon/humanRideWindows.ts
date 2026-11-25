import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";

/**
 * A ride's support windows on its support: the seat bears on it throughout,
 * except that an equestrian articulation lifts it off between its lift and its
 * settle and a rising trot leaves it to the stirrups; each resting foot plants
 * on the support or on a named moving part. A retained stirrup plant keeps
 * its entering socket; a newly placed foot plants by its ball from `take` on. The
 * windows a held prop keeps come first.
 *
 * @param input The support, the ride's seconds and its feet and seat.
 * @returns The windows.
 */
export function humanRideWindows(
  input: humanRideWindows.IInput,
): IAutoMovieMotionHumanContactWindow[] {
  const { on, seconds } = input;
  const bears = (
    part: IAutoMovieMotionHumanContactWindow["part"],
    kind: IAutoMovieMotionHumanContactWindow["kind"],
  ): IAutoMovieMotionHumanContactWindow => ({
    part,
    kind,
    from: 0,
    to: 1,
    support: {
      kind: "prop",
      subject: on,
      ...(part === "seat" && input.seat !== undefined
        ? { point: input.seat }
        : {}),
    },
    ...(kind === "plant" ? { socket: "ball" } : {}),
  });
  const contacts: IAutoMovieMotionHumanContactWindow[] = [...input.kept];
  for (const foot of input.resting)
    contacts.push(
      foot.pedal === undefined
        ? bears(`${foot.side}Foot`, "plant")
        : {
            ...bears(`${foot.side}Foot`, "plant"),
            support: { kind: "prop", subject: on, point: foot.pedal },
            ...(foot.socket === undefined ? {} : { socket: foot.socket }),
          },
    );
  for (const side of input.placed)
    contacts.push({
      ...bears(`${side}Foot`, "plant"),
      from: input.take / seconds,
    });
  if (input.offSeat !== undefined) {
    const [lift, settle]: readonly [number, number] = input.offSeat;
    contacts.unshift(
      { ...bears("seat", "seat"), to: lift / seconds },
      { ...bears("seat", "seat"), from: settle / seconds },
    );
  } else if (!input.rising) contacts.unshift(bears("seat", "seat"));
  return contacts;
}

/** The ride's windows. */
export namespace humanRideWindows {
  /** A foot resting on the support as the ride begins. */
  export interface IResting {
    /** The foot. */
    side: AutoMovieHumanSide;

    /** The pedal or stirrup point it rests on, when it moves within the support. */
    pedal?: string;

    /** The socket of a retained stirrup plant, when the entry names it. */
    socket?: IAutoMovieMotionHumanContactWindow.Socket;
  }

  /** What the ride's windows read. */
  export interface IInput {
    /** The support's subject. */
    on: string;

    /** The actual seat affordance on that support, when named by the ride. */
    seat?: string;

    /** The ride's seconds. */
    seconds: number;

    /** The windows a held prop keeps. */
    kept: readonly IAutoMovieMotionHumanContactWindow[];

    /** The feet resting on the support. */
    resting: readonly IResting[];

    /** The feet the ride places on their rests. */
    placed: readonly AutoMovieHumanSide[];

    /** The seconds a placed foot takes to its rest. */
    take: number;

    /** The seat's lift and settle off the saddle, seconds, if it leaves it. */
    offSeat?: readonly [number, number];

    /** Whether the rider posts to a trot. */
    rising: boolean;
  }
}
