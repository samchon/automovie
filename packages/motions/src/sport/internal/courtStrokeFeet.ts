import type {
  AutoMovieHumanSide,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

import { AutoMovieMotionHumanLeg } from "../../compose/internal/AutoMovieMotionHumanLeg";

/*
 * Prepare the two court stroke foot placements and the corresponding
 * ground-support windows. Use the vertical flight curve shared with the
 * pelvis.
 * Parameter support: Entry and landing anchors, local clock and flight state.
 * Returns: Leg rows and their ground contacts in left-to-right order.
 */
export function courtStrokeFeet({
  body,
  stance,
  landings,
  stepFoot,
  clock,
  clearance,
  flight,
}: ISupport): ICourtStrokeFeetResult {
  const duration: number = clock.duration;
  const primitives: IAutoMovieMotionHumanPrimitive[] = [];
  const contacts: IAutoMovieMotionHumanContactWindow[] = [];
  for (const foot of ["left", "right"] as const) {
    const from: IAutoMovieMotionHumanFoot.IPlacement = stance[foot];
    const stepping: boolean = foot === stepFoot;
    const to: IAutoMovieMotionHumanFoot.IPlacement = landings[foot];
    const move: (progress: number) => IAutoMovieMotionHumanFoot.IPlacement =
      AutoMovieMotionHumanLeg.prepareArc(from, to, clearance);
    const leave: number = stepping ? clock.at("stepStart") : 0;
    const plant: number = stepping ? clock.at("plant") : 0;
    const relax: number = clock.at("relax");
    const planted = (s: number): boolean =>
      !flight.airborne(s) &&
      (!stepping || s <= leave || (s >= plant && s <= relax) || s >= duration);
    primitives.push(
      AutoMovieMotionHumanLeg.place({
        body,
        side: foot,
        from: 0,
        to: duration,
        placement: (
          _: IAutoMovieMotionHumanPosture,
          s: number,
        ): IAutoMovieMotionHumanFoot.IPlacement => {
          const progress: number =
            s <= relax
              ? clock.progress("stepStart", "plant", s)
              : 1 - clock.progress("relax", "end", s);
          const at: IAutoMovieMotionHumanFoot.IPlacement = stepping
            ? move(progress)
            : from;
          return {
            ...at,
            ankle: { ...at.ankle, y: at.ankle.y + flight.lift(s) },
          };
        },
        planted,
      }),
    );
    const contact = (a: number, b: number): void => {
      if (a < b)
        contacts.push({
          part: `${foot}Foot`,
          kind: "plant",
          from: a / duration,
          to: b / duration,
          support: { kind: "ground" },
        });
    };
    if (stepping) contact(0, leave);
    if (flight.enabled) {
      contact(plant, flight.takeoff);
      contact(flight.landing, stepping ? relax : duration);
    } else contact(plant, stepping ? relax : duration);
  }
  return { primitives, contacts };
}

/*
 * The record of `ISupportFlight`'s site.
 */
type ISupportFlight = {
  /*
   * Whether the profile calls for flight.
   */
  enabled: boolean;

  /*
   * Local second of liftoff.
   */
  takeoff: number;

  /*
   * Local second of touchdown.
   */
  landing: number;

  /*
   * Whether the given action-local second is strictly inside flight.
   */
  airborne: (seconds: number) => boolean;

  /*
   * Current flight height in metres, zero outside flight.
   */
  lift: (seconds: number) => number;
};
/*
 * The actual anchoring and flight phases available to the stroke's feet.
 */
interface ISupport {
  /*
   * Body used to fit both leg goals.
   */
  body: IAutoMovieMotionHumanBody;

  /*
   * Both feet's world placements at entry.
   */
  stance: Readonly<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>
  >;

  /*
   * World placements at plant or jump landing.
   */
  landings: Readonly<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>
  >;

  /*
   * The traveling foot, when the profile calls for a step.
   */
  stepFoot: AutoMovieHumanSide | undefined;

  /*
   * Full local action clock in seconds.
   */
  clock: IAutoMovieMotionClock;

  /*
   * Swing clearance in metres.
   */
  clearance: number;

  /*
   * Optional jump phase and shared ballistic displacement.
   */
  flight: ISupportFlight;
}

/*
 * The record of `ICourtStrokeFeetResult`'s site.
 */
type ICourtStrokeFeetResult = {
  /*
   * The two leg placement rows.
   */
  primitives: IAutoMovieMotionHumanPrimitive[];

  /*
   * Their ordered plant windows.
   */
  contacts: IAutoMovieMotionHumanContactWindow[];
};
