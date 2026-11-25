import type {
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanPropFlight } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { standingPerformanceState } from "../../internal/fixtures/standingPerformanceState";
import { vclose } from "../../internal/vclose";

/** Quaternion rotation, a metre-scale translation and input rounding fit 32 ulps. */
const FRAME_ROUNDING_METRES: number = 32 * Number.EPSILON;

/** The displayed origin sits beside the centre in the prop's own X direction. */
const CENTRE: IAutoMovieVector3 = { x: 0.25, y: 0, z: 0 };

/** A quarter turn about world up sends local +X to world -Z. */
const QUARTER: IAutoMovieQuaternion = { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 };

/**
 * A prop's prepared launches own its display until the next grip or launch.
 * Reading an approach uses the same launch at both seconds and expresses its
 * sphere's centre in the displayed prop frame.
 *
 * Scenarios:
 *
 * 1. The first launch at 1 s owns its interval. A launch at its exact
 *    superseding instant, 2 s, owns the tie. A grip at 1.25 s excludes it.
 * 2. A constant-speed first flight centres advance 2 metres per second. Its
 *    displayed origin is 0.25 m toward +Z from its physical centre.
 * 3. An approach spanning two launches or ending before its own earlier
 *    sample cannot report both frames. Equal requested seconds share one frame.
 * 4. Ground contact takes ownership of the display at its exact time.
 */
export async function test_motions_perform_prop_flight_playback(): Promise<void> {
  const { state } = await standingPerformanceState();
  const segment: IAutoMovieMotionHumanSegment = state.people.get("actor")!.segments[0]!;
  const source: IAutoMovieMotionHumanPropFlight.IFlight["source"] = { ...segment, subject: "actor" };
  const origin: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const velocity: IAutoMovieVector3 = { x: 2, y: 0, z: 0 };
  const first: IAutoMovieMotionHumanPropFlight.IFlight = {
    prop: "ball",
    launch: 1,
    source,
    published: { prop: "ball", point: origin, velocity, seconds: 0, sphere: { centre: CENTRE, radius: 0.1 } },
    projectile: { origin, velocity, gravity: { x: 0, y: 0, z: 0 }, attitude: { kind: "fixed", rotation: QUARTER } },
    end: Infinity,
    supersededAt: 2,
  };
  const second: IAutoMovieMotionHumanPropFlight.IFlight = {
    ...first,
    launch: 2,
    end: 3,
    supersededAt: 4,
    contact: {
      struck: { kind: "ground" },
      outcome: "stick",
      point: { x: 2, y: 0, z: 0 },
      normal: { x: 0, y: 1, z: 0 },
      velocity,
      offset: { position: { x: 2, y: 0.1, z: 0.25 }, rotation: QUARTER },
    },
  };
  const self: IAutoMovieMotionHumanPerformanceState = { ...state, flights: new Map([["ball", [first, second]]]) };
  const active = (seconds: number, since?: number): IAutoMovieMotionHumanPropFlight.IFlight | undefined => HumanPropFlight.active(self, "ball", seconds, since);
  TestValidator.predicate(
    "the last eligible launch owns each instant",
    active(0.875) === undefined && active(1) === first && active(1.5) === first &&
      active(1.5, 1.25) === undefined && active(2) === second &&
      active(4) === second && active(4.125) === undefined,
  );

  const approach: IAutoMovieMotionHumanPropReader.IFlightApproach | undefined = HumanPropFlight.approach(self, "ball", 1.5, 1.25);
  TestValidator.predicate(
    "the centre is turned back into the prop's frame at both reads",
    approach !== undefined && approach.launch === first.published &&
      vclose(approach.before.position, { x: 0.5, y: 1, z: 0.25 }, FRAME_ROUNDING_METRES) &&
      vclose(approach.frame.position, { x: 1, y: 1, z: 0.25 }, FRAME_ROUNDING_METRES),
  );
  const same: IAutoMovieMotionHumanPropReader.IFlightApproach = HumanPropFlight.approach(self, "ball", 1.5, 1.5)!;
  TestValidator.predicate(
    "only one launch can be read as an approach",
    same.frame === same.before &&
      HumanPropFlight.approach(self, "ball", 2.25, 1.75) === undefined &&
      HumanPropFlight.approach(self, "ball", 1.25, 1.5) === undefined,
  );

  TestValidator.predicate(
    "ground contact takes ownership at the exact instant",
    HumanPropFlight.frame(self, "ball", 3, 2) === second.contact!.offset,
  );
}
