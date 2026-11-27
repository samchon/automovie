import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBallPlay,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPerformanceRead } from "../../perform/internal/HumanPerformanceRead";
import { HumanPropFlight } from "../../perform/internal/HumanPropFlight";

/*
 * Read one ball's play from a placed performance and test it against the gates
 * a sport credits (a hoop, a goal mouth, a cup).
 *
 * `read` joins the ball's hand grips into possessions and merges them with its
 * engine flights, so the same prop's custody and travel are one film-ordered
 * log. `crossing` scans the displayed ball, the frame every consumer renders,
 * for the first passage through a gate toward its credited side.
 */
export namespace HumanBallPlay {
  /*
   * The ball's holds, launches and contacts in film order.
   * Parameter self: The placed performance.
   * Parameter ball: Scene subject id of the ball.
   * Returns: The play; empty events for a ball never held or launched.
   */
  export function read(
    self: IAutoMovieMotionHumanPerformanceState,
    ball: string,
  ): IAutoMovieMotionHumanBallPlay {
    const events: IAutoMovieMotionHumanBallPlay.Event[] = [];

    // A possession is one performer's unbroken custody: hand grips by the
    // same performer that overlap or touch (a pickup handing over to a
    // two-hand pass hold) join into one span.
    const grips: IAutoMovieMotionHumanPerformanceState.IGrip[] = [
      ...HumanPerformanceRead.grips(self, ball),
    ]
      .filter(
        (grip: IAutoMovieMotionHumanPerformanceState.IGrip): boolean =>
          grip.bone === undefined && grip.mount === undefined,
      )
      .sort(
        (
          a: IAutoMovieMotionHumanPerformanceState.IGrip,
          b: IAutoMovieMotionHumanPerformanceState.IGrip,
        ): number => a.from - b.from,
      );
    // A launch ends a possession: a grip that closes after the ball left the
    // hand begins a new one, however the hands' windows overlap (a dribbler
    // releasing and gathering the bounce).
    const flights: ReturnType<typeof HumanPropFlight.flights> =
      HumanPropFlight.flights(self, ball);
    let open: IAutoMovieMotionHumanBallPlay.IHold | undefined;
    for (const grip of grips) {
      if (
        open !== undefined &&
        open.subject === grip.subject &&
        grip.from <= open.to &&
        !flights.some(
          (flight: (typeof flights)[number]): boolean =>
            flight.launch > open!.from && flight.launch <= grip.from,
        )
      ) {
        open.to = Math.max(open.to, grip.to);
        if (!open.hands.includes(grip.side)) open.hands.push(grip.side);
        continue;
      }
      open = {
        kind: "hold",
        subject: grip.subject,
        hands: [grip.side],
        from: grip.from,
        to: grip.to,
        caught: grip.capture !== undefined,
      };
      events.push(open);
    }
    for (const event of events)
      if (event.kind === "hold")
        event.hands.sort(
          (a: AutoMovieHumanSide, b: AutoMovieHumanSide): number =>
            a.localeCompare(b),
        );
    for (const flight of flights) {
      events.push({
        kind: "launch",
        seconds: flight.launch,
        subject: flight.source.subject,
        action: flight.source.law.name,
        point: flight.projectile.origin,
        velocity: flight.projectile.velocity,
      });
      if (flight.contact !== undefined)
        events.push(contact(flight.end, flight.contact));

      // A continuation leg is timed from its flight's launch.
      for (const leg of flight.legs ?? [])
        if (leg.contact !== undefined)
          events.push(contact(flight.launch + leg.end, leg.contact));
    }
    events.sort(
      (
        a: IAutoMovieMotionHumanBallPlay.Event,
        b: IAutoMovieMotionHumanBallPlay.Event,
      ): number => start(a) - start(b),
    );
    return { ball, events };
  }

  /*
   * The first film second in a window at which a point fixed in the ball's
   * frame passes through a gate toward its credited side.
   *
   * The displayed frame is sampled every 1/240 s. A sign change of the signed
   * distance to the gate plane brackets a crossing, which bisection closes; the
   * crossing counts when it lies inside the gate. A ball that enters and leaves
   * the plane within one interval is not seen, which at 240 Hz needs a reversal
   * within about 4 ms.
   * Parameter performance: The placed performance.
   * Parameter ball: Scene subject id of the ball.
   * Parameter gate: The gate.
   * Parameter from: First film second of the window.
   * Parameter to: Last film second of the window.
   * Parameter offset: The tested point in the ball's frame, metres: its centre for
   * a sphere; the frame origin when absent.
   * Returns: The crossing, or undefined when the ball does not pass the gate in
   * the window.
   * For a malformed window, a non-unit normal, or a
   * rectangle whose up is not in its plane.
   */
  export function crossing(
    performance: Pick<IAutoMovieMotionHumanPerformance, "prop">,
    ball: string,
    gate: IAutoMovieMotionHumanBallPlay.Gate,
    from: number,
    to: number,
    offset: IAutoMovieVector3 = { x: 0, y: 0, z: 0 },
  ): IAutoMovieMotionHumanBallPlay.ICrossing | undefined {
    if (!(to > from))
      throw new RangeError("A gate window needs finite seconds with to > from");
    if (Math.abs(Vector3.length(gate.normal) - 1) > 1e-9)
      throw new RangeError("A gate normal must be a unit vector");
    if (
      gate.kind === "rectangle" &&
      (Math.abs(Vector3.length(gate.up) - 1) > 1e-9 ||
        Math.abs(Vector3.dot(gate.up, gate.normal)) > 1e-9)
    )
      throw new RangeError(
        "A rectangle gate's up must be a unit vector in its plane",
      );

    const point = (seconds: number): IAutoMovieVector3 => {
      const frame: IAutoMovieRigidTransform = performance.prop(ball, seconds);
      return Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, offset),
      );
    };
    const side = (at: IAutoMovieVector3): number =>
      Vector3.dot(Vector3.subtract(at, gate.centre), gate.normal);

    const count: number = Math.ceil((to - from) / STEP);
    let before: number = from;
    let distance: number = side(point(before));
    for (let index: number = 1; index <= count; ++index) {
      const after: number = Math.min(to, from + index * STEP);
      const next: number = side(point(after));
      if (distance < 0 && next >= 0) {
        let low: number = before;
        let high: number = after;
        for (let round: number = 0; round < ROUNDS; ++round) {
          const middle: number = (low + high) / 2;
          if (side(point(middle)) < 0) low = middle;
          else high = middle;
        }
        const met: IAutoMovieVector3 = point(high);
        if (inside(gate, met)) return { seconds: high, point: met };
      }
      before = after;
      distance = next;
    }
    return undefined;
  }

  /*
   * Whether a point on the gate plane lies inside the gate's region.
   */
  function inside(
    gate: IAutoMovieMotionHumanBallPlay.Gate,
    at: IAutoMovieVector3,
  ): boolean {
    const local: IAutoMovieVector3 = Vector3.subtract(at, gate.centre);
    if (gate.kind === "disc") {
      const along: number = Vector3.dot(local, gate.normal);
      return (
        Vector3.length(local) ** 2 - along ** 2 <= gate.radius ** 2 + 1e-12
      );
    }
    const across: IAutoMovieVector3 = Vector3.cross(gate.up, gate.normal);
    return (
      Math.abs(Vector3.dot(local, across)) <= gate.halfWidth &&
      Math.abs(Vector3.dot(local, gate.up)) <= gate.halfHeight
    );
  }

  /*
   * A flight or leg contact as a play event.
   */
  function contact(
    seconds: number,
    met: IAutoMovieMotionHumanPropFlight.IContact,
  ): IAutoMovieMotionHumanBallPlay.IContact {
    return {
      kind: "contact",
      seconds,
      struck: met.struck,
      point: met.point,
      outcome: met.outcome,
    };
  }

  /*
   * An event's first film second.
   */
  function start(event: IAutoMovieMotionHumanBallPlay.Event): number {
    return event.kind === "hold" ? event.from : event.seconds;
  }
}

/*
 * Sampling interval of a gate scan, seconds: 240 Hz, ten times a 24 fps film
 * frame.
 */
const STEP: number = 1 / 240;

/*
 * Bisection rounds closing a bracketed crossing: 2^-40 of one step, below 1e-14
 * s.
 */
const ROUNDS: number = 40;
