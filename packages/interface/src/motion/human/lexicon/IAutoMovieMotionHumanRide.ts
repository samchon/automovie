/**
 * Riding: a seated person carried by a support that moves by itself, such
 * as a car, a bicycle or a horse given to the performance as a moving prop
 * (`HumanObject.prop` with a motion).
 *
 * The rider sits down on the support first (`sit` on its seat where it
 * stands at that second; `HumanObject.seat` reads a saddle with its pedals
 * or stirrups) and then rides it: the seated posture is carried rigidly
 * with the support, turning, leaning and pitching as it does, the seat and
 * each foot that rested on it bearing on it, so nothing slides in the
 * support's frame. The arms, the hands, the head and the trunk's turn are
 * yielded, so steering, holding on, waving, looking and aiming from the
 * saddle are actions performed over the ride. Register `HumanRide.ride` to use it.
 *
 * With `rising` the rider posts to a trot, by a stride time or on the
 * strides of a cue track; with `feet` each foot stays on a part that moves
 * within the support, a pedal on its crank or a stirrup; with `hands` each
 * hand holds a grip, a rein or a wheel's rim and follows it the same way,
 * the trunk leaning forward at each instant as far as the hands need to
 * reach what they hold (`HumanMountReach.reach`), as a fixed-seat rower
 * leans to the catch the oar's handle comes to. First pass: the rider
 * leans exactly as the support does and absorbs no bump, a pedalling foot
 * keeps its pitch to the frame except where the leg would run short and it
 * points down about its ball (`HumanMountRider`), and mounting and dismounting are the
 * sitting actions. The ride passes on the seat it was entered on as its
 * base, so `rise` after it gets off a saddle to the left unasked.
 *
 * @evidence contracts/development/common.md#meaningful-documentation seconds: Seconds ridden, more than none. Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. rising: A rising trot: the mount's stride time, seconds, or the cue track of the performance that holds its strides (the footfalls of one diagonal, as the mount's own ride publishes them). The rider stands in the stirrups and sits again once a stride, the seat rising `POST` thigh lengths off the saddle, so both feet must rest on the support. On a cue track the seat is down at each of its instants and seated before the first and after the last. Seated throughout when absent. seat: The support's point the seat stays on, by its id, where the seat itself moves within the support: a saddle on a horse's trunk, which rises and falls with the stride over the course its root follows. The body is carried with the support alone when absent.
 * @evidence contracts/development/design.md#principled-representation seconds: Seconds ridden, more than none. Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. rising: A rising trot: the mount's stride time, seconds, or the cue track of the performance that holds its strides (the footfalls of one diagonal, as the mount's own ride publishes them). The rider stands in the stirrups and sits again once a stride, the seat rising `POST` thigh lengths off the saddle, so both feet must rest on the support. On a cue track the seat is down at each of its instants and seated before the first and after the last. Seated throughout when absent. seat: The support's point the seat stays on, by its id, where the seat itself moves within the support: a saddle on a horse's trunk, which rises and falls with the stride over the course its root follows. The body is carried with the support alone when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanRide.ts (HumanRide.ride, context); lexicon/HumanRide.ts (HumanRide.ride).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The rider names an existing support prop and its affordances; no mount geometry or gait is fabricated when the support lacks them.
 */
export namespace IAutoMovieMotionHumanRide {
  /**
   * Parameters of a ride.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation seconds: Seconds ridden, more than none. Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. rising: A rising trot: the mount's stride time, seconds, or the cue track of the performance that holds its strides (the footfalls of one diagonal, as the mount's own ride publishes them). The rider stands in the stirrups and sits again once a stride, the seat rising `POST` thigh lengths off the saddle, so both feet must rest on the support. On a cue track the seat is down at each of its instants and seated before the first and after the last. Seated throughout when absent. seat: The support's point the seat stays on, by its id, where the seat itself moves within the support: a saddle on a horse's trunk, which rises and falls with the stride over the course its root follows. The body is carried with the support alone when absent.
   * @evidence contracts/development/design.md#principled-representation seconds: Seconds ridden, more than none. Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. rising: A rising trot: the mount's stride time, seconds, or the cue track of the performance that holds its strides (the footfalls of one diagonal, as the mount's own ride publishes them). The rider stands in the stirrups and sits again once a stride, the seat rising `POST` thigh lengths off the saddle, so both feet must rest on the support. On a cue track the seat is down at each of its instants and seated before the first and after the last. Seated throughout when absent. seat: The support's point the seat stays on, by its id, where the seat itself moves within the support: a saddle on a horse's trunk, which rises and falls with the stride over the course its root follows. The body is carried with the support alone when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanRide.ts (HumanRide.ride, context); lexicon/HumanRide.ts (HumanRide.ride).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional riding, restraint and rising choices refer to the support's declared affordances and cue tracks; the ride planner owns missing-support refusals.
   */
  export interface IParams {
    /** The moving prop ridden: its subject id in the performance. */
    on: string;

    /** Seconds ridden, more than none.
     * Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    seconds: number;

    /**
     * A rising trot: the mount's stride time, seconds, or the cue track of
     * the performance that holds its strides (the footfalls of one
     * diagonal, as the mount's own ride publishes them). The rider stands
     * in the stirrups and sits again once a stride, the seat rising `POST`
     * thigh lengths off the saddle, so both feet must rest on the support.
     * On a cue track the seat is down at each of its instants and seated
     * before the first and after the last. Seated throughout when absent.
     
 * Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 */
    rising?:
      | number
      | {
          /** Performance cue-track id publishing one diagonal's footfalls; the rising rider sits at each instant and before the first and after the last. */
          cue: string;
        };

    /**
     * The support's point each foot stays on, by its id, for a part that
     * moves within the support: a pedal on its turning crank, a stirrup on
     * a trotting horse (`IAutoMovieMotionHumanProp.point`). The foot keeps the place it
     * had on that point when the ride began. A foot not named, or a point
     * that only moves with the support, is carried rigidly.
     */
    feet?: Partial<Record<"left" | "right", string>>;

    /**
     * The support's point the seat stays on, by its id, where the seat
     * itself moves within the support: a saddle on a horse's trunk, which
     * rises and falls with the stride over the course its root follows.
     * The body is carried with the support alone when absent.
     */
    seat?: string;

    /**
     * The support's point each hand holds, by its id: a handlebar grip, a
     * rein, a wheel's rim. The hand goes to it over `TAKE` seconds from the
     * ride's start and stays on it, following a part that moves within the
     * support. The arms are still yielded, so an arm action over the ride
     * takes a hand off for as long as it lasts. The hand turns to the
     * point and closes on it (`HumanMountRider.hold`).
     */
    hands?: Partial<Record<"left" | "right", string>>;
  }
}
