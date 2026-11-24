import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRide,
  createBoat,
  createCanoe,
  createCarriage,
  createCart,
  createChariot,
  createHorseCart,
  createLimber,
  createPullingBoat,
  createRickshaw,
  createRowboat,
  createShoppingTrolley,
  createWagon,
  createWheelbarrow,
  rowBoat,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanSeated,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSwim,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanFrame } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";

/** The path used to compare independent wheel, tow and crew readbacks. */
const COURSE: AutoMovieArchetypeCourse.ICourse = {
  start: { x: 1.6, z: -2, heading: 35 },
  legs: [{ kind: "straight", length: 18 }],
  cruise: 1.5,
  acceleration: 0.5,
  deceleration: 0.5,
};

/**
 * The canonical land and water forms preserve saved geometry and real motion
 * support.
 *
 * Scenarios:
 *
 * 1. Every saved cart and boat kind builds the same model through its named
 *    producer.
 * 2. A towed cart's wheels meet the floor and its hitch follows a separately
 *    moving leader through both producer forms.
 * 3. The rowboat seats its rower facing aft with oars on their locks, the canoe
 *    faces its paddlers forward without oarlocks, and every pulling-boat thwart
 *    faces aft without an oarlock.
 * 4. A moving double-scull crew reads back the same stations from the saved and
 *    named rowboat.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers the seeded legacy selector, public detached producer, model-space wheels and tow hitch, and visible stations on a moving hull.
 * @evidence contracts/development/testing.md#behavioral-verification Builds all saved cart and boat variants through both SDK inputs and makes actual towing and row-crew reads.
 * @evidence contracts/development/testing.md#independent-expectations Pulls the wheel edge from rendered collider geometry, compares the hitch from a separately moving leader, and measures crew travel at named action events.
 * @evidence contracts/development/testing.md#distinguishing-cases The cart rotates its wheels while keeping its hitch aligned, and the rower travels while the canoe retains forward-facing seats without rowboat oar locks. The pulling boat's thwart count comes from its own profile.
 * @evidence contracts/development/testing.md#execution-ownership The in-memory feature runner owns all generated archetypes, tracks and performances.
 */
export function test_archetype_catalogue_transport_props_craft(): void {
  const seed: number = 1038;
  const id: string = "carrier";
  const trolley: ReturnType<typeof createShoppingTrolley> =
    createShoppingTrolley({ id }, seed);
  const wheelbarrow: ReturnType<typeof createWheelbarrow> = createWheelbarrow(
    { id },
    seed,
  );
  const cart: ReturnType<typeof createHorseCart> = createHorseCart(
    { id },
    seed,
  );
  const oldCart: ReturnType<typeof createCart> = createCart(
    { kind: "cart", id },
    seed,
  );
  const carts = {
    trolley,
    wheelbarrow,
    cart,
    rickshaw: createRickshaw({ id }, seed),
    chariot: createChariot({ id }, seed),
    limber: createLimber({ id }, seed),
    wagon: createWagon({ id }, seed),
    carriage: createCarriage({ id }, seed),
  } satisfies Record<createCart.Kind, ReturnType<typeof createCart>>;
  for (const kind of createCart.KINDS)
    sameModel(kind, carts[kind], createCart({ id, kind }, seed));
  TestValidator.equals(
    "pushed forms declare their own handle patterns",
    [
      trolley.affordances.map((contact) => contact.id),
      wheelbarrow.affordances.map((contact) => contact.id),
    ],
    [
      ["handle", "leftHandle", "rightHandle", "load"],
      ["leftHandle", "rightHandle", "load"],
    ],
  );
  const left: IAutoMovieVector3 = cart.affordance("leftSpin").frame.translation;
  const tire: ReturnType<typeof archetypeExtent> = archetypeExtent(cart, "y", [
    "wheel-left",
  ]);
  TestValidator.predicate(
    "visible wheel radius meets the floor under the axle",
    Math.abs(tire.low) <= 1e-8 &&
      Math.abs((tire.high + tire.low) / 2 - left.y) <= 1e-8,
  );
  const leader: AutoMovieArchetypeRide.IRide<"hitch", never> =
    AutoMovieArchetypeRide.along(
      new AutoMovieArchetypeBuilder<"hitch", never>({
        material: "wood",
        name: "tow-leader",
        draw: new AutoMovieArchetypeDrawSession<never>(
          "tow-leader",
          {},
          undefined,
        ),
      })
        .box("base", Vector3.create(1, 1, 1), Vector3.create(0, 0.5, 0))
        .affordance({
          id: "hitch",
          kind: "hook",
          frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, 1, -1)),
          extent: null,
        })
        .build(50),
      COURSE,
    );
  for (const pulled of [cart, oldCart]) {
    const ride = AutoMovieArchetypeRide.towed(
      leader,
      "hitch",
      pulled,
      "coupling",
      {
        support: createCart.towing(pulled),
      },
    );
    for (const seconds of [0, 1, 4]) {
      const hitch: IAutoMovieVector3 = leader.frame(
        "hitch",
        seconds,
      ).translation;
      const coupling: IAutoMovieVector3 = ride.frame(
        "coupling",
        seconds,
      ).translation;
      TestValidator.predicate(
        "the declared coupling follows an independent hitch",
        Vector3.length(Vector3.subtract(coupling, hitch)) <= 1e-6,
      );
    }
  }

  const rowboat: ReturnType<typeof createRowboat> = createRowboat(
    { id, model: "thamesSkiff" },
    seed,
  );
  const oldRowboat: ReturnType<typeof createBoat> = createBoat(
    { id, kind: "rowboat", model: "thamesSkiff" },
    seed,
  );
  const hulls = {
    rowboat,
    canoe: createCanoe({ id }, seed),
    launch: createPullingBoat({ id }, seed),
  } satisfies Record<createBoat.Kind, ReturnType<typeof createBoat>>;
  sameModel("fixed-seat skiff", rowboat, oldRowboat);
  sameModel("canoe", hulls.canoe, createBoat({ id, kind: "canoe" }, seed));
  sameModel(
    "pulling boat",
    hulls.launch,
    createBoat({ id, kind: "launch" }, seed),
  );
  TestValidator.predicate(
    "the rower and paddler face opposite ways with distinct oar support",
    AutoMovieArchetypeFrame.axis(rowboat.affordance("thwart0").frame, "z").z <
      -0.99 &&
      AutoMovieArchetypeFrame.axis(hulls.canoe.affordance("thwart0").frame, "z")
        .z > 0.99 &&
      rowboat.affordance("leftOar").rides === "leftOarlock" &&
      !hulls.canoe.affordances.some((contact) => contact.id === "leftOarlock"),
  );
  const thwarts: IAutoMovieAffordance[] = hulls.launch.affordances.filter(
    (contact: IAutoMovieAffordance): boolean =>
      contact.id.startsWith("thwart") && contact.id.length > "thwart".length,
  );
  const withoutOarlock: boolean = hulls.launch.affordances.every(
    (contact: IAutoMovieAffordance): boolean => !contact.id.endsWith("Oarlock"),
  );
  TestValidator.predicate(
    "every pulling-boat thwart seats a rower facing aft, without an oarlock",
    thwarts.length === createBoat.LAUNCH.thwarts &&
      thwarts.every(
        (contact: IAutoMovieAffordance): boolean =>
          -0.99 > AutoMovieArchetypeFrame.axis(contact.frame, "z").z,
      ) &&
      withoutOarlock,
  );
  TestValidator.equals(
    "both rowboat inputs support the same moving crew readbacks",
    crew(rowboat),
    crew(oldRowboat),
  );
}

/**
 * Compare the authored model, its explicit measured dimensions and its
 * provenance.
 */
function sameModel(
  label: string,
  canonical: AutoMovieArchetype,
  legacy: AutoMovieArchetype,
): void {
  TestValidator.equals(
    label,
    JSON.stringify(canonical),
    JSON.stringify(legacy),
  );
  TestValidator.equals(
    label + " dimensions",
    canonical.dimensions,
    legacy.dimensions,
  );
  TestValidator.equals(
    label + " provenance",
    canonical.provenance,
    legacy.provenance,
  );
}

/** Run a seated sculler on the actual skiff track and read two displayed frames. */
function crew(
  boat: ReturnType<typeof createBoat>,
): readonly IAutoMovieVector3[] {
  const carrier: ReturnType<typeof rowBoat> = rowBoat(boat, COURSE, {
    sea: { height: 0.7, seed: 7 },
  });
  const track: ReturnType<typeof rowBoat.bind> = rowBoat.bind(carrier, 1.4);
  const initial: IAutoMovieRigidTransform = track.motion(0);
  const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
    boat,
    initial,
    "thwart0",
  );
  const floor: IAutoMovieVector3 = track.point("floor", 0).translation;
  const start: IAutoMovieVector3 = HumanFrame.point(
    { origin: { ...seat.at, y: floor.y }, yaw: seat.yaw },
    { x: 0, y: 0, z: 0.4 },
  );
  const performance: HumanPerformance = new HumanPerformance({
    seed: "canonical-transport-crew",
    laws: [AutoMovieMotionHumanSwim.aquatic],
    performers: [
      {
        subject: "crew",
        body: motionHumanBody("m-average"),
        at: start,
        yaw: seat.yaw,
        proficiency: { level: "trained" },
      },
    ],
    props: [HumanObject.prop("hull", boat, initial, track.motion, track.point)],
    composition: HumanChain.subject("crew")
      .stand({ hold: 0.3, on: { prop: "hull" } })
      .sit({ seat, hold: 0.5 })
      .registered("aquatic", { kind: "doubleScull", support: "hull" }).node,
  });
  const film: motionHumanLaw.IFilm = motionHumanLaw.film(performance);
  const catchTime: number = motionHumanLaw.event(film, "catch2", "crew");
  const finish: number = motionHumanLaw.event(film, "extract2", "crew");
  TestValidator.predicate(
    "the rowboat really travels during the sampled stroke",
    Vector3.length(
      Vector3.subtract(
        performance.prop("hull", finish).position,
        performance.prop("hull", catchTime).position,
      ),
    ) > 0.25,
  );
  return [catchTime, finish].flatMap((seconds: number): IAutoMovieVector3[] => [
    performance.bones("crew", seconds).get("hips")!.worldPosition,
    performance.prop("hull", seconds).position,
    track.point("leftHandle", seconds).translation,
  ]);
}
