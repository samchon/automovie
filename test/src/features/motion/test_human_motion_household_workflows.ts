import {
  type Archetype,
  ArchetypeRefusal,
  createAppliance,
  createCleaning,
  createLongTool,
  createTable,
  createTool,
  createTray,
  createVessel,
} from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  adjacentAutoMovieFloat64,
  physicalShapePairDistance,
  physicalShapeSpan,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanHand,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  putDownAperture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";

/** Bound for a rigid grasp or a resting object's anchored position, metres. */
const GRIP: number = 0.001;
/** Working surface and fit allowance, metres. */
const CONTACT: number = 0.01;
/** The height of the counter top in the kitchen and laundry, metres. */
const TOP: number = 0.914;
/** The world frame's vertical unit vector. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
/** The actor's stationary floor origin. */
const ORIGIN: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
/** The quarter turn that lies a +Y spoon along +Z. */
const SPOON_REST: IAutoMovieRigidTransform["rotation"] =
  Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90);

/**
 * A kitchen item, folded cloth, and mop retain their own scene identities
 * through full household performances.
 *
 * Scenarios:
 * 1. On two canonical actors, take the spoon from the counter, stir inside
 *    the saucepan, park the spoon in the cleaning tray and wipe the counter.
 * 2. Open a physically hollow washer, take the same folded cloth from the
 *    basket, move it through the real opening, seat it in the drum, and
 *    close the door. A missing loading socket refuses.
 * 3. Take the floor tool by its shaft, advance during the supported working
 *    stroke and leave the tool stationary on the floor after releasing it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three public workflows, their observable transitions, and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Resolves the whole public actor chains and measures the actual prop frames, hands, door state and colliders at their contact and release phases.
 * @evidence contracts/development/testing.md#independent-expectations The modeled pan rim, cleanup tray floor, counter height, washer lip and drum boundaries, and horizontal floor determine the expected paths. The campaign's 1 mm rigid and 10 mm working bounds are checked against the displayed outputs.
 * @evidence contracts/development/testing.md#distinguishing-cases Holds, supported working and released poses are distinguished for each workflow, and two actor sizes exercise reach. The loading approach operates on one real articulated washer and refuses a missing socket.
 * @evidence contracts/development/testing.md#execution-ownership Runs each in-memory performance through the public chains on canonical bodies without a capture host.
 */
export function test_human_motion_household_workflows(): void {
  const failures: string[] = [];
  for (const fit of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(fit);
    for (const [name, measure] of [
      ["kitchen", kitchen],
      ["laundry", laundry],
      ["floor", mopFloor],
    ] as const) {
      try {
        measure(body, failures);
      } catch (error: unknown) {
        failures.push(
          `${fit} ${name}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
  TestValidator.equals("complete household workflows", failures, []);
}

/** Resolve the SDK performance for one actor and a list of actual props. */
function stage(
  body: IAutoMovieMotionHumanBody,
  chain: IAutoMovieMotionHumanChain,
  props: IAutoMovieMotionHumanProp[],
): motionHumanLaw.IFilm {
  return motionHumanLaw.film(
    new HumanPerformance({
      seed: "household",
      performers: [
        {
          subject: "a",
          body,
          at: ORIGIN,
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      laws: [putDownAperture],
      props,
      composition: chain.node,
    }),
  );
}

/** Place a static archetype with its own contacts in the public scene. */
function fixed(
  id: string,
  model: Archetype,
  at: IAutoMovieVector3,
  yaw: number = 0,
): IAutoMovieMotionHumanProp {
  return HumanObject.prop(id, model, { at, yaw, fixed: true });
}

/** Transform a model-local point by the prop's displayed frame. */
function point(
  frame: IAutoMovieRigidTransform,
  local: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, local),
  );
}

/** Times of a selected segment's public events in film seconds. */
function events(
  film: motionHumanLaw.IFilm,
  name: string,
  ordinal: number = 0,
): Record<string, number> {
  const segment: IAutoMovieMotionHumanSegment = film.performance
    .segments("a")
    .filter((part) => part.name === name)[ordinal]!;
  return Object.fromEntries(
    segment.plan.events.map((event) => [
      event.name,
      segment.start + event.share * segment.plan.duration,
    ]),
  );
}

/** Compare a named contact's actual clearance, with its measurement on failure. */
function near(
  failures: string[],
  label: string,
  miss: number,
  limit: number,
): void {
  if (!(miss <= limit))
    failures.push(
      `${label}: ${(1000 * miss).toFixed(3)} mm exceeds ${1000 * limit} mm`,
    );
}

/** A prop must keep the same wrist-local offset throughout a rigid grip. */
function keep(
  film: motionHumanLaw.IFilm,
  prop: string,
  from: number,
  to: number,
  failures: string[],
  side: AutoMovieHumanSide = "right",
): void {
  const handLocal = (t: number): IAutoMovieVector3 => {
    const hand = film.bones("a", t).get(`${side}Hand`)!;
    return Quaternion.rotateVector(
      Quaternion.inverse(hand.worldRotation),
      Vector3.subtract(
        film.performance.prop(prop, t).position,
        hand.worldPosition,
      ),
    );
  };
  const start: IAutoMovieVector3 = handLocal(from);
  for (const u of [0.25, 0.5, 0.75, 1]) {
    const t: number = from + u * (to - from);
    near(
      failures,
      `${prop} in ${side} grip at ${t.toFixed(2)} s`,
      Vector3.distance(handLocal(t), start),
      GRIP,
    );
  }
}

/** Read the spoon, saucepan, tray and actual palm in the complete kitchen take. */
function kitchen(body: IAutoMovieMotionHumanBody, failures: string[]): void {
  const counter = createTable({ kind: "counter", height: TOP });
  const pan = createVessel({ kind: "saucepan" });
  const spoon = createTool({ kind: "spoon", gripDiameter: 0.01, length: 0.15 });
  const tray = createTray({ kind: "tray" });
  const panAt: IAutoMovieVector3 = { x: 0.02, y: TOP, z: 0.39 };
  const trayAt: IAutoMovieVector3 = { x: -0.31, y: TOP, z: 0.42 };
  const fit: number = spoon.affordance("grip").aperture! / 2;
  const home: IAutoMovieVector3 = {
    ...trayAt,
    y: TOP + tray.site("inside").translation.y + fit,
    z: trayAt.z - spoon.dimensions.length! / 2,
  };
  const stageProps: IAutoMovieMotionHumanProp[] = [
    fixed("counter", counter, { x: 0, y: 0, z: 0.6 }, 180),
    fixed("pan", pan, panAt),
    fixed("tray", tray, trayAt),
    HumanObject.prop("spoon", spoon, {
      position: { x: -0.18, y: TOP + fit, z: 0.27 },
      rotation: SPOON_REST,
    }),
  ];
  const film: motionHumanLaw.IFilm = stage(
    body,
    HumanChain.subject("a")
      .pickUp({
        prop: "spoon",
        handle: "grip",
        use: { tip: "face", line: "square" },
      })
      .useTool({
        tool: "stir",
        prop: "spoon",
        on: { kind: "prop", subject: "pan", point: "inside" },
        cycles: 2,
      })
      .putDown({ prop: "spoon", at: home, yaw: 0 })
      .wipe({
        hand: "left",
        on: { kind: "point", at: { x: 0.28, y: TOP, z: 0.35 }, frame: "world" },
        cycles: 1,
      })
      .stand({ seconds: 0.3 }),
    stageProps,
  );
  const stir: Record<string, number> = events(film, "useTool");
  const inside: number = pan.affordance("inside").width! / 2;
  const bottom: number = panAt.y + pan.site("inside").translation.y;
  const rim: number = panAt.y + pan.site("rim").translation.y;
  for (const [event, t] of Object.entries(stir)) {
    if (!event.startsWith("contact")) continue;
    const tip: IAutoMovieVector3 = point(
      film.performance.prop("spoon", t),
      spoon.site("face").translation,
    );
    const radial: number = Math.hypot(tip.x - panAt.x, tip.z - panAt.z);
    near(
      failures,
      "spoon bowl inside the actual pan",
      Math.max(radial - inside, bottom - tip.y, tip.y - rim),
      0,
    );
  }
  const pick: Record<string, number> = events(film, "pickUp");
  const place: Record<string, number> = events(film, "putDown");
  keep(film, "spoon", pick.gripClosed!, place.placed! - 1e-5, failures);
  for (const t of [place.release!, film.duration]) {
    const rest: IAutoMovieRigidTransform = film.performance.prop("spoon", t);
    near(
      failures,
      "spoon at the cleanup tray",
      Vector3.distance(rest.position, home),
      GRIP,
    );
    const y: number = Math.min(
      ...spoon.shapes().map((item) => physicalShapeSpan(rest, item, UP)[0]),
    );
    near(
      failures,
      "spoon bottom rests on the cleaning tray",
      Math.abs(y - (TOP + tray.site("inside").translation.y)),
      GRIP,
    );
  }
  const wipe: Record<string, number> = events(film, "wipe");
  const t: number = (wipe.strokeStart! + wipe.strokeEnd!) / 2;
  const socket = body.surfaces.sockets.palmLeft;
  const palm = resolveAutoMovieHumanoidSurfaces.place(
    socket,
    film.bones("a", t).get(socket.bone)!,
  ).point;
  near(
    failures,
    "cleanup palm at the counter",
    Math.abs(palm.y - TOP),
    CONTACT,
  );
}

/** Verify the carried load against both the real opening and the final close. */
function laundry(body: IAutoMovieMotionHumanBody, failures: string[]): void {
  const support = createTable({ kind: "counter", height: TOP });
  const machine = createAppliance({ kind: "washingMachine" });
  const basket = createTray({ kind: "basket", model: "risatorp42" });
  const cloth = createCleaning({ kind: "cloth" });
  const basketAt: IAutoMovieVector3 = { x: -0.54, y: TOP, z: 0.38 };
  const basketFrame: IAutoMovieRigidTransform = {
    position: basketAt,
    rotation: Quaternion.fromAxisAngle(UP, 90),
  };
  const washer = fixed("washer", machine, { x: 0, y: TOP, z: 0.77 }, 180);
  const clothAt: IAutoMovieVector3 = {
    x: basketAt.x + 0.005,
    y: TOP + basket.site("inside").translation.y,
    z: basketAt.z - 0.1,
  };
  const props: IAutoMovieMotionHumanProp[] = [
    fixed("stand", support, { x: -0.04, y: 0, z: 0.56 }, 180),
    washer,
    fixed("basket", basket, basketAt, 90),
    HumanObject.prop("cloth", cloth, { at: clothAt, yaw: 90 }),
  ];
  const action = (
    aperture: string,
    lead: string = "loadApproach",
  ): IAutoMovieMotionHumanChain =>
    HumanChain.subject("a")
      .operate({
        hand: "left",
        mechanism: {
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
      .stand({ seconds: 0.2 })
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
      .stand({ seconds: 0.2 })
      .operate({
        hand: "right",
        mechanism: {
          kind: "hinge",
          at: { kind: "prop", subject: "washer", point: "doorHandle" },
          swing: -94,
        },
      })
      .stand({ seconds: 0.3 });
  const film: motionHumanLaw.IFilm = stage(body, action("loadOpening"), props);
  const pick: Record<string, number> = events(film, "pickUp");
  const transfer: Record<string, number> = events(film, "putDownAperture");
  const closing: Record<string, number> = events(film, "operate", 1);
  const opening: IAutoMovieVector3 = point(
    washer.frame,
    machine.site("drumAperture").translation,
  );
  const seat: IAutoMovieVector3 = point(
    washer.frame,
    machine.site("drumSeat").translation,
  );
  const load = cloth.shapes()[0]!;
  const forward: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const door: number = film.performance.state(
    "washer",
    transfer.aperture!,
  ).door!;
  const initialDoor = machine.articulate({ door: 0 }).affordance("doorHandle");
  const open: typeof machine = machine.articulate({ door });
  const openTravel: number = Vector3.distance(
    open.affordance("doorHandle").frame.translation,
    initialDoor.frame.translation,
  );
  if (!(openTravel > machine.dimensions.door! / 2))
    failures.push("open washer door clears the loading opening");
  if (film.performance.state("washer", film.duration).door !== 0)
    failures.push(
      "washer closes to the same zero-angle state at the last beat",
    );
  near(
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
  for (let i = 0; i < 8; ++i) {
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
  const doorAt = (t: number): IAutoMovieVector3 => {
    const state = film.performance.state("washer", t);
    return machine.articulate(state).affordance("doorHandle").frame.translation;
  };
  const seen = seek.map(doorAt);
  for (let i = seek.length - 1; i >= 0; --i)
    near(
      failures,
      "washer door is repeatable under reverse seeks",
      Vector3.distance(doorAt(seek[i]!), seen[i]!),
      0,
    );

  const start: IAutoMovieRigidTransform = film.performance.prop("cloth", 0);
  near(
    failures,
    "cloth starts in the basket",
    Vector3.distance(start.position, clothAt),
    GRIP,
  );
  near(
    failures,
    "the basket supports the initial cloth",
    Math.abs(
      physicalShapeSpan(start, load, UP)[0] -
        (TOP + basket.site("inside").translation.y),
    ),
    GRIP,
  );
  let crossedMouth: boolean = false;
  // Evaluate the actual convex pieces through extraction and insertion. A
  // valid cloth route can pass off-centre as long as its whole volume fits.
  const samples: number = Math.ceil((transfer.placed! - pick.gripClosed!) * 24);
  for (let i = 0; i <= samples; ++i) {
    const t: number =
      pick.gripClosed! + ((transfer.placed! - pick.gripClosed!) * i) / samples;
    const pose: IAutoMovieRigidTransform = film.performance.prop("cloth", t);
    const [back, front] = physicalShapeSpan(pose, load, forward);
    const dx: number = pose.position.x - opening.x;
    const dy: number = pose.position.y - opening.y;
    crossedMouth ||=
      back < opening.z &&
      opening.z < front &&
      Math.hypot(dx, dy) < machine.affordance("drumAperture").width! / 2;
    const basketClearance: number = Math.min(
      ...basket
        .shapes()
        .map((part) =>
          physicalShapePairDistance(pose, load, basketFrame, part),
        ),
    );
    const drumClearance: number = Math.min(
      ...open
        .shapes()
        .map((part) =>
          physicalShapePairDistance(pose, load, washer.frame, part),
        ),
    );
    near(
      failures,
      `cloth clears the basket in sample ${i}`,
      -basketClearance,
      GRIP,
    );
    near(
      failures,
      `cloth clears the open washer in sample ${i}`,
      -drumClearance,
      GRIP,
    );
  }
  if (!crossedMouth)
    failures.push("cloth crosses the washer mouth from outside");
  for (const t of [transfer.release!, closing.strokeEnd!, film.duration]) {
    const rest: IAutoMovieRigidTransform = film.performance.prop("cloth", t);
    near(
      failures,
      "cloth sits at the same drum seat",
      Vector3.distance(rest.position, seat),
      GRIP,
    );
    near(
      failures,
      "the drum floor supports the resting cloth",
      Math.abs(physicalShapeSpan(rest, load, UP)[0] - seat.y),
      GRIP,
    );
    if (!(physicalShapeSpan(rest, load, forward)[0] > opening.z))
      failures.push("cloth ends wholly inside the washer mouth");
  }
  keep(film, "cloth", pick.gripClosed!, transfer.placed! - 1e-5, failures);
  if (body.measure.stature < 1.6) {
    for (const [aperture, lead, label] of [
      ["missingOpening", "loadApproach", "missing washer opening"],
      ["loadOpening", "missingLead", "missing washer waypoint"],
    ] as const) {
      let refusal: unknown;
      try {
        stage(body, action(aperture, lead), props);
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
      if (!(error instanceof ArchetypeRefusal)) throw error;
    }
  }
}

/** Push a real floor-contact head forward and release both hands at the park. */
function mopFloor(body: IAutoMovieMotionHumanBody, failures: string[]): void {
  const mop = createLongTool({ kind: "mop" });
  const start: IAutoMovieVector3 = { x: 0, y: 0, z: 0.41 };
  const film: motionHumanLaw.IFilm = stage(
    body,
    HumanChain.subject("a")
      .pushPull({
        prop: "mop",
        way: "push",
        left: "upperGrip",
        right: "lowerGrip",
        load: "light",
        to: { x: 0, y: 0, z: 0.38 },
      })
      .stand({ seconds: 0.35 }),
    [HumanObject.prop("mop", mop, { at: start, yaw: 0 })],
  );
  const work: IAutoMovieMotionHumanSegment = film.performance.segments("a")[0]!;
  const gripped: number = events(film, "pushPull").gripped!;
  const parked: IAutoMovieRigidTransform = film.performance.prop(
    "mop",
    film.duration,
  );
  if (!(parked.position.z > start.z + 0.2))
    failures.push("the floor tool travels forward in the pass");
  for (const u of [0.2, 0.4, 0.6, 0.8, 1]) {
    const t: number = gripped + (work.end - 1e-5 - gripped) * u;
    const pose: IAutoMovieRigidTransform = film.performance.prop("mop", t);
    const tip: IAutoMovieVector3 = point(pose, mop.site("face").translation);
    near(
      failures,
      "mop face at floor during the pass",
      Math.abs(tip.y),
      CONTACT,
    );
    const head = mop.shapes().find((item) => item.id === "head")!;
    near(
      failures,
      "mop head does not enter the floor",
      -physicalShapeSpan(pose, head, UP)[0],
      CONTACT,
    );
    const hands = film.bones("a", t);
    const left = HumanHand.frame(body, hands, "left", "grip").point;
    const right = HumanHand.frame(body, hands, "right", "grip").point;
    if (!(Vector3.distance(left, right) > body.measure.hand / 2))
      failures.push("the two hands keep distinct sites on the same mop shaft");
    near(
      failures,
      "mop left hand at upper shaft mark",
      Vector3.distance(left, point(pose, mop.site("upperGrip").translation)),
      CONTACT,
    );
    near(
      failures,
      "mop right hand at lower shaft mark",
      Vector3.distance(right, point(pose, mop.site("lowerGrip").translation)),
      CONTACT,
    );
  }
  // Seek out of order around both grip windows' shared endpoint.
  for (const t of [work.end + 1e-5, work.end, work.end - 1e-5]) {
    const released: IAutoMovieRigidTransform = film.performance.prop("mop", t);
    near(
      failures,
      "the mop stays where the two grips release",
      Vector3.distance(parked.position, released.position),
      GRIP,
    );
    if (!(Quaternion.angle(parked.rotation, released.rotation) <= 1e-4))
      failures.push(
        "the mop does not change its attitude as the two grips release",
      );
  }
  near(
    failures,
    "the parked mop rests on its face",
    Math.abs(point(parked, mop.site("face").translation).y),
    CONTACT,
  );
}
