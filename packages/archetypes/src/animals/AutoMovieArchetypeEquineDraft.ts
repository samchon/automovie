import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieTransform,
} from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeRide,
} from "../core";
import type { ArchetypeTowing } from "../core/ArchetypeTowing";
import { createCart } from "../vehicles/createCart";
import { type AutoMovieArchetypeEquine } from "./AutoMovieArchetypeEquine";
import type { AutoMovieArchetypeEquineDraftPlan } from "./AutoMovieArchetypeEquineDraftPlan";
import { AutoMovieArchetypeQuadrupedFooting } from "./AutoMovieArchetypeQuadrupedFooting";
import { EquineHarness } from "./EquineHarness";
import { rideHorse } from "./rideHorse";
import type { rideQuadruped } from "./rideQuadruped";

/** Points a slack trace is laid through, ends included. */
const SAG_POINTS: number = 9;

/**
 * A harnessed horse put to a two-wheeled cart, drawing it and taken out again,
 * on one film clock: it backs between the parked cart's shafts, stands while
 * the traces are hooked, draws the cart through the authored legs, brakes into
 * the breeching to a stop, stands while the traces are unhooked, and walks out
 * of the shafts, leaving the cart standing.
 *
 * The horse is the ordinary ride (`rideHorse`) on one course: a rein-back of
 * `approach` metres pausing `connect` seconds, the `pull` legs at `cruise`
 * ending in a stop that pauses `release` seconds, and the `depart` legs. The
 * cart is the existing vehicle contract (`createCart`, `createCart.towing`,
 * `createCart.lines`, `AutoMovieArchetypeRide.towed`), towed by the horse's
 * `hitch` while the horse stands in the shafts, from the end of the approach to
 * the start of the walk out; before and after, it stands at the coupled pose of
 * those two seconds, so the parked cart is exactly where the hitch meets its
 * coupling. With `footing` the horse walks the authored planes and the cart's
 * wheels stand on the plane under their axle (`ArchetypeTowing.Ground`);
 * without it the ground is level Y=0 and a graded leg is refused. The towing
 * clock runs only over the coupled interval, so the cart's heading integrates
 * only while it is drawn.
 *
 * The traces' visible states are authored by stage: detached while backing in
 * and after unhooking; hanging slack while hooked at a stand and while the
 * horse brakes, when the breeching rather than the collar holds the cart back
 * (the breeching `EquineHarness` lays); drawn straight between the collar's
 * points of draft and the single tree's ends while the horse pulls. A slack
 * trace sags `sag` metres at its middle along a parabola through `SAG_POINTS`
 * points; this is a look, not a cable simulation or a measured draught force.
 * The driving lines are laid while the horse stands in the shafts.
 *
 * @param horse A horse in `harness` tack.
 * @param cart A `cart` kind built for that horse.
 * @param params The course stages, their durations, the trace sag and optional
 *   footing.
 * @returns The take.
 * @throws {AutoMovieArchetypeRefusal} For a horse without the harness's hitch,
 *   a cart whose coupling or single tree does not fit the horse's hitch and
 *   points of draft, nonpositive stage values, and as the ride and the towing
 *   refuse.
 */
export function AutoMovieArchetypeEquineDraft(
  horse: AutoMovieArchetype<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  >,
  cart: AutoMovieArchetype<createCart.Affordance, createCart.Dimension>,
  params: AutoMovieArchetypeEquineDraftPlan.IParams,
): AutoMovieArchetypeEquineDraftPlan.ITake<
  AutoMovieArchetypeEquine.Affordance,
  AutoMovieArchetypeEquine.Dimension,
  createCart.Affordance,
  createCart.Dimension
> {
  type HorseSample = AutoMovieArchetypeRide.ISample<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  >;
  type CartSample = AutoMovieArchetypeRide.ISample<
    createCart.Affordance,
    createCart.Dimension
  >;
  const refuse = (axis: string, value: unknown, reason: string): never => {
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: horse.archetype,
      axis,
      value,
      feasible: null,
      reason,
      fix: "Put a harnessed horse to a cart built for it, with positive stage durations and sag.",
    });
  };
  for (const key of [
    "approach",
    "connect",
    "release",
    "cruise",
    "acceleration",
    "deceleration",
    "sag",
  ] as const)
    if (!(params[key] > 0))
      refuse(key, params[key], "must be finite and positive");
  if (params.pull.length === 0 || params.depart.length === 0)
    refuse(
      "pull",
      params.pull.length,
      "the pull and the walk out need a leg each",
    );
  if (
    !horse.affordances.some(
      (a: IAutoMovieAffordance): boolean => a.id === "hitch",
    )
  )
    refuse("tack", horse.name, "the horse wears no driving harness hitch");
  fit();
  if (
    params.footing === undefined &&
    [...params.pull, ...params.depart].some(
      (leg: rideQuadruped.ILeg): boolean => (leg.rise ?? 0) !== 0,
    )
  )
    refuse(
      "footing",
      params.pull,
      "a graded leg needs authored footing under the cart's wheels",
    );

  // One course: back in, pull and stop, walk out.
  const last: number = params.pull.length;
  const legs: rideQuadruped.ILeg[] = [
    {
      kind: "straight",
      length: params.approach,
      reverse: true,
      pause: params.connect,
      equineFootwork: { kind: "rein-back" },
      gait: "walk",
    },
    ...params.pull.map(
      (leg: rideQuadruped.ILeg, k: number): rideQuadruped.ILeg =>
        k === last - 1 ? { ...leg, pause: params.release } : leg,
    ),
    ...params.depart,
  ];
  const ride: AutoMovieArchetypeRide.IRide<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  > = rideHorse(horse, {
    start: params.start,
    legs,
    cruise: params.cruise,
    acceleration: params.acceleration,
    deceleration: params.deceleration,
    speeds: legs.map((_: rideQuadruped.ILeg, k: number): number =>
      k === 0 || k === last || k === legs.length - 1 ? 0 : params.cruise,
    ),
    footing: params.footing,
  });
  const instant = (label: string): number =>
    ride.instants.find(
      (candidate: AutoMovieArchetypeEquineDraftPlan.IInstant): boolean =>
        candidate.label === label,
    )?.seconds ?? refuse("course", label, `the course has no ${label} instant`);
  const events: AutoMovieArchetypeEquineDraftPlan.IEvents = {
    connect: instant("stop1"),
    pull: instant("depart1"),
    brake:
      instant(`stop${last + 1}`) -
      ride.plan.legSpans[last]!.fastest / params.deceleration,
    release: instant(`stop${last + 1}`),
    depart: instant(`depart${last + 1}`),
  };
  if (!(events.brake > events.pull))
    refuse(
      "pull",
      params.pull,
      "the pull is too short to brake from its speed",
    );

  // The cart is drawn only while the horse stands in the shafts: its towing clock starts at the connection and holds outside it.
  const coupled: number = events.depart - events.connect;
  const hold = (seconds: number): number =>
    Math.min(coupled, Math.max(0, seconds));
  const leader: AutoMovieArchetypeRide.IRide<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  > = {
    plan: ride.plan,
    duration: coupled,
    instants: [],
    at: (seconds: number): HorseSample =>
      ride.at(events.connect + hold(seconds)),
    frame: (
      id: AutoMovieArchetypeEquine.Affordance,
      seconds: number,
    ): IAutoMovieTransform => ride.frame(id, events.connect + hold(seconds)),
  };
  const traces: AutoMovieArchetypeRide.ILine[] = createCart.lines(cart);
  const footing: AutoMovieArchetypeQuadrupedFooting.IPlan | undefined =
    params.footing === undefined
      ? undefined
      : AutoMovieArchetypeQuadrupedFooting.prepare(
          horse.archetype,
          params.footing,
          false,
        );
  const ground: ArchetypeTowing.Ground =
    footing === undefined
      ? (): ArchetypeTowing.IPlane => ({
          point: { x: 0, y: 0, z: 0 },
          normal: { x: 0, y: 1, z: 0 },
        })
      : (x: number, z: number): ArchetypeTowing.IPlane => {
          const landing: AutoMovieArchetypeQuadrupedFooting.ILanding =
            footing.landing({ x, y: 0, z }, Quaternion.identity());
          return { point: landing.point, normal: landing.normal };
        };
  const towed: AutoMovieArchetypeRide.ITowedRide<
    createCart.Affordance,
    createCart.Dimension
  > = AutoMovieArchetypeRide.towed(leader, "hitch", cart, "coupling", {
    support: createCart.towing(cart),
    lines: traces,
    ground,
  });

  return { duration: ride.duration, events, ride, at };

  /** One displayed second. */
  function at(
    seconds: number,
  ): AutoMovieArchetypeEquineDraftPlan.ISample<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension,
    createCart.Affordance,
    createCart.Dimension
  > {
    const stage: AutoMovieArchetypeEquineDraftPlan.Stage =
      seconds < events.connect
        ? "approach"
        : seconds < events.pull
          ? "connection"
          : seconds < events.brake
            ? "pull"
            : seconds < events.release
              ? "brake"
              : seconds < events.depart
                ? "release"
                : "depart";
    const tension: AutoMovieArchetypeEquineDraftPlan.Tension =
      stage === "pull"
        ? "taut"
        : stage === "connection" || stage === "brake"
          ? "slack"
          : "detached";
    const sample: CartSample = towed.at(hold(seconds - events.connect));
    const laid: readonly AutoMovieArchetypeRide.ILineState[] =
      sample.lines ?? [];
    const standing: boolean =
      seconds >= events.connect && seconds < events.depart;
    return {
      stage,
      tension,
      breeching: stage === "brake",
      horse: ride.at(seconds),
      cart: sample.archetype,
      placement: sample.placement,
      traces:
        tension === "detached"
          ? []
          : laid
              .filter((line: AutoMovieArchetypeRide.ILineState): boolean =>
                line.id.startsWith("trace"),
              )
              .map(
                (
                  line: AutoMovieArchetypeRide.ILineState,
                ): AutoMovieArchetypeRide.ILineState =>
                  tension === "taut" ? line : slack(line),
              ),
      lines: standing
        ? laid.filter((line: AutoMovieArchetypeRide.ILineState): boolean =>
            line.id.startsWith("line"),
          )
        : [],
    };
  }

  /** A trace hanging below its chord on a parabola of the authored sag. */
  function slack(
    line: AutoMovieArchetypeRide.ILineState,
  ): AutoMovieArchetypeRide.ILineState {
    return {
      ...line,
      points: EquineHarness.slack(
        line.points[0]!,
        line.points.at(-1)!,
        params.sag,
        SAG_POINTS,
      ),
    };
  }

  /**
   * Refuse a cart whose coupling and single tree were not built for this
   * horse's hitch and points of draft.
   */
  function fit(): void {
    if (
      cart.archetype !== "cart" ||
      !cart.affordances.some(
        (a: IAutoMovieAffordance): boolean => a.id === "coupling",
      )
    )
      refuse(
        "cart",
        cart.name,
        "the carrier is not a horse-drawn two-wheeled cart",
      );
    const hitch: number = horse.affordance("hitch").frame.translation.y;
    const coupling: number = cart.affordance("coupling").frame.translation.y;
    if (Math.abs(hitch - coupling) > 1e-9 * Math.max(1, Math.abs(hitch)))
      refuse(
        "cart",
        coupling,
        `the cart's coupling stands ${coupling} m high, the horse's hitch ${hitch} m: the cart was built for another horse`,
      );
    const spread: number = cart.dimensions.withersHeight ?? Number.NaN;
    if (
      !(
        Math.abs(spread - horse.dimensions.withersHeight!) <=
        1e-9 * Math.max(1, Math.abs(spread))
      )
    )
      refuse(
        "cart",
        spread,
        `the cart's single tree and shafts were fitted to a horse ${spread} m at the withers, not ${horse.dimensions.withersHeight} m`,
      );
  }
}
