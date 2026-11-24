import {
  type AutoMovieArchetype,
  AutoMovieArchetypeRefusal,
  createAppliance,
  createCleaning,
  createTable,
  createTray,
} from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  adjacentAutoMovieFloat64,
  physicalShapePairDistance,
  physicalShapeSpan,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { householdFilm } from "../../../../features/internal/householdFilm";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../../features/internal/motionHumanLaw";

/** Bound for a rigid grasp or a resting object's anchored position, metres. */
const GRIP: number = 0.001;

/** The height of the counter top the washer and basket stand on, metres. */
const TOP: number = 0.914;

/** The world frame's vertical unit vector. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** The washer's outward front in the world, +Z. */
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/** The washer's model. */
type Washer = AutoMovieArchetype<
  createAppliance.Affordance,
  createAppliance.Dimension
>;

/** The basket's model. */
type Basket = AutoMovieArchetype<createTray.Affordance, createTray.Dimension>;

/**
 * A folded cloth keeps its own scene identity from a basket through the real
 * opening of a physically hollow washer whose door is opened and closed.
 *
 * Scenarios, on the canonical average man and small woman:
 * 1. Open the washer by its door handle, take the cloth from the basket,
 *    move it through the real opening and seat it in the drum, then close the
 *    door to its zero-angle state at the last beat.
 * 2. The door stays at its 94-degree authored swing while the cloth enters,
 *    and its handle clears the loading opening.
 * 3. The door's displayed state repeats under reverse seeks, including the
 *    eight representable instants before the closing stroke's end.
 * 4. The cloth clears the basket and the open washer at 24 Hz, crosses the
 *    mouth from outside and rests wholly inside on the drum seat.
 * 5. On the small body, a missing loading opening or waypoint refuses, and a
 *    stroke past the door's closed stop is refused by the archetype.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the workflow, the door, clearance, seek and refusal cases and the bodies.
 * @evidence contracts/development/testing.md#behavioral-verification Resolves the whole public chain and measures the displayed cloth frame, washer state and convex shapes; a cloth through the wall, a door left open, an unrepeatable seek or an admitted missing socket fails.
 * @evidence contracts/development/testing.md#independent-expectations The modeled basket floor, drum aperture, seat and opening plane and the authored 94-degree swing give the expectations; the 1 mm rigid bound is the campaign's.
 * @evidence contracts/development/testing.md#distinguishing-cases Open, carried, seated and closed phases on two body sizes, the endpoint's representable neighbours, and the refused missing opening, missing waypoint and over-travel; the kitchen and floor workflows own their own specifications.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory performance on canonical bodies through the public chain, without a capture host.
 */
export function test_motion_household_laundry(): void {
  const failures: string[] = [];
  for (const fit of ["m-average", "f-small"] as const) {
    try {
      laundry(motionHumanBody(fit), failures);
    } catch (error: unknown) {
      failures.push(
        `${fit} laundry: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  TestValidator.equals("complete laundry workflow", failures, []);
}

/** Verify the carried load against both the real opening and the final close. */
function laundry(body: IAutoMovieMotionHumanBody, failures: string[]): void {
  const support: AutoMovieArchetype<
    createTable.Affordance,
    createTable.Dimension
  > = createTable({ kind: "counter", height: TOP });
  const machine: Washer = createAppliance({ kind: "washingMachine" });
  const basket: Basket = createTray({ kind: "basket", model: "risatorp42" });
  const cloth: AutoMovieArchetype<
    createCleaning.Affordance,
    createCleaning.Dimension
  > = createCleaning({ kind: "cloth" });
  const basketAt: IAutoMovieVector3 = { x: -0.54, y: TOP, z: 0.38 };
  const basketFrame: IAutoMovieRigidTransform = {
    position: basketAt,
    rotation: Quaternion.fromAxisAngle(UP, 90),
  };
  const washer: IAutoMovieMotionHumanProp = householdFilm.fixed(
    "washer",
    machine,
    { x: 0, y: TOP, z: 0.77 },
    180,
  );
  const clothAt: IAutoMovieVector3 = {
    x: basketAt.x + 0.005,
    y: TOP + basket.site("inside").translation.y,
    z: basketAt.z - 0.1,
  };
  const props: IAutoMovieMotionHumanProp[] = [
    householdFilm.fixed("stand", support, { x: -0.04, y: 0, z: 0.56 }, 180),
    washer,
    householdFilm.fixed("basket", basket, basketAt, 90),
    HumanObject.prop("cloth", cloth, { at: clothAt, yaw: 90 }),
  ];
  const film: motionHumanLaw.IFilm = householdFilm.stage(
    body,
    load("loadOpening", "loadApproach"),
    props,
  );
  const pick: householdFilm.EventTimes = householdFilm.events(film, "pickUp");
  const transfer: householdFilm.EventTimes = householdFilm.events(
    film,
    "putDownAperture",
  );
  const closing: householdFilm.EventTimes = householdFilm.events(
    film,
    "operate",
    1,
  );
  const opening: IAutoMovieVector3 = householdFilm.point(
    washer.frame,
    machine.site("drumAperture").translation,
  );
  const seat: IAutoMovieVector3 = householdFilm.point(
    washer.frame,
    machine.site("drumSeat").translation,
  );
  const shape: IAutoMoviePhysicalShape = cloth.shapes()[0]!;
  const door: number = film.performance.state(
    "washer",
    transfer.aperture!,
  ).door!;
  const open: Washer = machine.articulate({ door });
  const openTravel: number = Vector3.distance(
    open.affordance("doorHandle").frame.translation,
    machine.articulate({ door: 0 }).affordance("doorHandle").frame.translation,
  );
  if (!(openTravel > machine.dimensions.door! / 2))
    failures.push("open washer door clears the loading opening");
  if (film.performance.state("washer", film.duration).door !== 0)
    failures.push(
      "washer closes to the same zero-angle state at the last beat",
    );
  householdFilm.near(
    failures,
    "the door stays open as the cloth enters",
    Math.abs(door - 94),
    1e-6,
  );

  // Read the actual articulated model at exact and arbitrary film seconds,
  // including the representable neighbors of the closing stroke endpoint.
  const closeFrom: number = closing.strokeStart!;
  const closeEnd: number = closing.strokeEnd!;
  const adjacent: number[] = [];
  let before: number = closeEnd;
  for (let i: number = 0; i < 8; ++i) {
    before = adjacentAutoMovieFloat64(before, false);
    adjacent.push(before);
  }
  const seek: readonly number[] = [
    film.duration,
    ...adjacent,
    closeFrom + 0.368 * (closeEnd - closeFrom),
    closeEnd,
    closeFrom,
    adjacentAutoMovieFloat64(closeEnd, true),
    closeFrom + 0.793 * (closeEnd - closeFrom),
  ];
  const doorAt: (t: number) => IAutoMovieVector3 = (
    t: number,
  ): IAutoMovieVector3 =>
    machine
      .articulate(film.performance.state("washer", t))
      .affordance("doorHandle").frame.translation;
  const seen: IAutoMovieVector3[] = seek.map(doorAt);
  for (let i: number = seek.length - 1; i >= 0; --i)
    householdFilm.near(
      failures,
      "washer door is repeatable under reverse seeks",
      Vector3.distance(doorAt(seek[i]!), seen[i]!),
      0,
    );

  const start: IAutoMovieRigidTransform = film.performance.prop("cloth", 0);
  householdFilm.near(
    failures,
    "cloth starts in the basket",
    Vector3.distance(start.position, clothAt),
    GRIP,
  );
  householdFilm.near(
    failures,
    "the basket supports the initial cloth",
    Math.abs(
      physicalShapeSpan(start, shape, UP)[0] -
        (TOP + basket.site("inside").translation.y),
    ),
    GRIP,
  );
  let crossedMouth: boolean = false;

  // Evaluate the actual convex pieces through extraction and insertion. A
  // valid cloth route can pass off-centre as long as its whole volume fits.
  const samples: number = Math.ceil((transfer.placed! - pick.gripClosed!) * 24);
  for (let i: number = 0; i <= samples; ++i) {
    const t: number =
      pick.gripClosed! + ((transfer.placed! - pick.gripClosed!) * i) / samples;
    const pose: IAutoMovieRigidTransform = film.performance.prop("cloth", t);
    const [back, front]: ReturnType<typeof physicalShapeSpan> =
      physicalShapeSpan(pose, shape, FORWARD);
    const dx: number = pose.position.x - opening.x;
    const dy: number = pose.position.y - opening.y;
    crossedMouth ||=
      back < opening.z &&
      opening.z < front &&
      Math.hypot(dx, dy) < machine.affordance("drumAperture").width! / 2;
    householdFilm.near(
      failures,
      `cloth clears the basket in sample ${i}`,
      -clearance(basket, basketFrame, pose, shape),
      GRIP,
    );
    householdFilm.near(
      failures,
      `cloth clears the open washer in sample ${i}`,
      -clearance(open, washer.frame, pose, shape),
      GRIP,
    );
  }
  if (!crossedMouth)
    failures.push("cloth crosses the washer mouth from outside");
  for (const t of [transfer.release!, closing.strokeEnd!, film.duration]) {
    const rest: IAutoMovieRigidTransform = film.performance.prop("cloth", t);
    householdFilm.near(
      failures,
      "cloth sits at the same drum seat",
      Vector3.distance(rest.position, seat),
      GRIP,
    );
    householdFilm.near(
      failures,
      "the drum floor supports the resting cloth",
      Math.abs(physicalShapeSpan(rest, shape, UP)[0] - seat.y),
      GRIP,
    );
    if (!(physicalShapeSpan(rest, shape, FORWARD)[0] > opening.z))
      failures.push("cloth ends wholly inside the washer mouth");
  }
  householdFilm.keep(
    film,
    "cloth",
    pick.gripClosed!,
    transfer.placed! - 1e-5,
    GRIP,
    failures,
  );
  if (body.measure.stature < 1.6) refusals(body, props, machine, failures);
}

/**
 * The authored laundry chain: open, take the cloth, load it through the named
 * opening and approach waypoint, then close.
 */
function load(aperture: string, lead: string): IAutoMovieMotionHumanChain {
  return HumanChain.subject("a")
    .operate({
      hand: "left",
      kind: {
        kind: "hinge",
        at: { kind: "prop", subject: "washer", point: "doorHandle" },
        swing: 94,
      },
    })
    .pickUp({ prop: "cloth", handle: "grip", hand: "right", lift: 0.29 })
    .walk({
      to: { x: 0.02, y: 0, z: 0.08 },
      facing: { yaw: 0 },
      pace: "slow",
    })
    .stand({ hold: 0.2 })
    .registered("putDownAperture", {
      prop: "cloth",
      onto: {
        prop: "washer",
        aperture,
        point: "drumSeat",
        approach: [lead, "loadAlign"],
        insertion: ["drumEntry"],
      },
    })
    .walk({
      to: { x: 0.12, y: 0, z: -0.13 },
      facing: { yaw: 0 },
      pace: "slow",
    })
    .stand({ hold: 0.2 })
    .operate({
      hand: "right",
      kind: {
        kind: "hinge",
        at: { kind: "prop", subject: "washer", point: "doorHandle" },
        swing: -94,
      },
    })
    .stand({ hold: 0.3 });
}

/** The least signed distance, metres, from the cloth to any piece of a placed model. */
function clearance(
  model: AutoMovieArchetype,
  frame: IAutoMovieRigidTransform,
  pose: IAutoMovieRigidTransform,
  shape: IAutoMoviePhysicalShape,
): number {
  return Math.min(
    ...model
      .shapes()
      .map((part: IAutoMoviePhysicalShape): number =>
        physicalShapePairDistance(pose, shape, frame, part),
      ),
  );
}

/** A missing loading socket refuses, and the door refuses travel past its closed stop. */
function refusals(
  body: IAutoMovieMotionHumanBody,
  props: IAutoMovieMotionHumanProp[],
  machine: Washer,
  failures: string[],
): void {
  for (const [aperture, lead, label] of [
    ["missingOpening", "loadApproach", "missing washer opening"],
    ["loadOpening", "missingLead", "missing washer waypoint"],
  ] as const) {
    let refusal: unknown;
    try {
      householdFilm.stage(body, load(aperture, lead), props);
    } catch (error: unknown) {
      refusal = error;
    }
    if (
      !(
        refusal instanceof HumanRefusal &&
        refusal.kind === "affordance" &&
        refusal.axis === "onto"
      )
    )
      failures.push(`loading refuses a ${label}`);
  }
  try {
    machine.articulate({ door: -1 });
    failures.push("the washer refuses a real stroke past its closed stop");
  } catch (error: unknown) {
    if (!(error instanceof AutoMovieArchetypeRefusal)) throw error;
  }
}
