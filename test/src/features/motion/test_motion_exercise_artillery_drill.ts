import {
  createCannon,
  createLongTool,
  createProjectile,
} from "@automovie/archetypes";
import {
  AutoMovieComposition,
  Quaternion,
  Transform,
  Vector3,
} from "@automovie/engine";
import type {
  IAutoMovieComposition,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGunCrew,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanGunCrew,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";

import { assertTakeClean } from "../internal/assertTakeClean";
import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/** The gunner's command to fire, film seconds on the scene's cue track: after the drill's duties. */
const FIRE: number = 40;
/** A placed prop sits within this of its gun mark, metres: a hand's width. */
const PLACED: number = 0.08;

/** The crew by role, alternating the two canonical bodies. */
const ROLES: IAutoMovieMotionHumanGunCrew.IRoles = {
  gunner: "gunner",
  n1: "n1",
  n2: "n2",
  n3: "n3",
  n4: "n4",
  n5: "n5",
};

/** Each role's start, world metres, around a field gun pointing down +z. */
const STATIONS: Readonly<
  Record<keyof IAutoMovieMotionHumanGunCrew.IRoles, IAutoMovieVector3>
> = {
  gunner: { x: 0, y: 0, z: -2.4 },
  n1: { x: 0.9, y: 0, z: 1.2 },
  n2: { x: -0.9, y: 0, z: 1.2 },
  n3: { x: 0.7, y: 0, z: -0.9 },
  n4: { x: -0.7, y: 0, z: -0.9 },
  n5: { x: -1.6, y: 0, z: -3.2 },
};

/** The drill's duties in their order, by anchor. */
const ORDER: readonly string[] = [
  "coverVent",
  "spongeBore",
  "passCharge",
  "loadCharge",
  "ramCharge",
  "prickVent",
  "layGun",
  "hookPrimer",
];

/**
 * A field gun's crew serving one load and fire (#3718): the implements
 * taken up, then HumanGunCrew's drill: the vent covered, the bore sponged,
 * the charge passed, placed and rammed, the vent pricked, the gun laid, the
 * primer hooked, the crew clear, and the lanyard pulled on the command.
 *
 * Scenarios:
 * 1. Every duty starts after the one before it ends, in the drill's order.
 * 2. The charge passes from No. 5's hand to No. 2's and is set at the muzzle;
 *    the primer ends at the vent.
 * 3. The lanyard is pulled on the command's cue.
 * 4. The take passes the shipped verdict report over all six crew members.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the drill, its props and what each check pins.
 * @evidence contracts/development/testing.md#behavioral-verification Composes pick-ups and HumanGunCrew.drill through HumanPerformance with a cue track and reads the schedule, the props and the verdict report.
 * @evidence contracts/development/testing.md#independent-expectations The order is the drill's (NPS); the stations and the command are authored; the placement bound is a hand's width.
 * @evidence contracts/development/testing.md#distinguishing-cases Each duty, each prop's custody span, both bodies across the roles.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_exercise_artillery_drill(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  try {
    const gun: ReturnType<typeof createCannon> = createCannon({
      kind: "fieldGun",
    });
    const scene: IAutoMovieMotionHumanGunCrew.IScene = {
      gun: "gun",
      rammer: "rammer",
      charge: "charge",
      wire: "wire",
      primer: "primer",
      lanyard: "lanyard",
      bore: 1.2,
      vent: 0.05,
      lay: 90,
      pull: 0.3,
      clear: {
        n1: { x: 1.6, y: 0, z: 0.4 },
        n2: { x: -1.6, y: 0, z: 0.4 },
        n3: { x: 1.4, y: 0, z: -1.2 },
      },
      command: { of: "command", event: "fire" },
    };
    const vent: IAutoMovieVector3 = gun.affordance("vent").frame.translation;
    const muzzle: IAutoMovieVector3 =
      gun.affordance("muzzle").frame.translation;
    const props: IAutoMovieMotionHumanProp[] = [
      HumanObject.prop("gun", gun, {
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        fixed: true,
      }),
      rammer(Vector3.add(STATIONS.n1, { x: -0.2, y: 0.95, z: 0.35 })),
      HumanObject.prop("charge", createProjectile({ kind: "cartridge" }), {
        at: Vector3.add(STATIONS.n5, { x: -0.22, y: 0.85, z: 0.35 }),
        yaw: 0,
      }),
      small("wire", Vector3.add(STATIONS.n3, { x: -0.22, y: 0.9, z: 0.3 })),
      small("primer", Vector3.add(STATIONS.n4, { x: -0.22, y: 0.9, z: 0.3 })),
      lanyard(Vector3.add(vent, { x: -0.4, y: -0.2, z: -0.3 })),
    ];
    const taking: IAutoMovieComposition = AutoMovieComposition.parallel(
      HumanChain.subject("n1").pickUp({
        prop: "rammer",
        handle: "shaft",
        hand: "right",
      }).node,
      HumanChain.subject("n5").pickUp({
        prop: "charge",
        handle: "body",
        hand: "right",
      }).node,
      HumanChain.subject("n3").pickUp({
        prop: "wire",
        handle: "grip",
        hand: "right",
      }).node,
      HumanChain.subject("n4").pickUp({
        prop: "primer",
        handle: "grip",
        hand: "right",
      }).node,
    );
    const film: HumanPerformance = new HumanPerformance({
      seed: "artillery-drill",
      laws: Object.values(HUMAN_LEXICON).flat(),
      props,
      cues: { command: [{ name: "fire", seconds: FIRE }] },
      performers: (
        Object.keys(STATIONS) as (keyof IAutoMovieMotionHumanGunCrew.IRoles)[]
      ).map(
        (
          role: keyof IAutoMovieMotionHumanGunCrew.IRoles,
          k: number,
        ): IAutoMovieMotionHumanPerformer => ({
          subject: ROLES[role],
          body: motionHumanBody(k % 2 === 0 ? "m-average" : "f-small"),
          at: STATIONS[role],
          yaw: 0,
          proficiency: { level: "trained" },
        }),
      ),
      composition: AutoMovieComposition.sequence(
        taking,
        HumanGunCrew.drill(ROLES, scene),
      ),
    });
    const entry: (anchor: string) => IAutoMovieScheduleEntry = (
      anchor: string,
    ): IAutoMovieScheduleEntry =>
      film.schedule.entries.find(
        (e: IAutoMovieScheduleEntry): boolean => e.intent?.anchor === anchor,
      )!;
    for (let k: number = 1; k < ORDER.length; ++k)
      checks.check(
        `${ORDER[k]} starts after ${ORDER[k - 1]} ends`,
        entry(ORDER[k]!).start >= entry(ORDER[k - 1]!).end - 1e-6,
      );
    const loaded: number = entry("loadCharge").end;
    const charge: IAutoMovieVector3 = film.prop("charge", loaded).position;
    checks.check(
      `the charge is set at the muzzle (${Vector3.distance(charge, muzzle).toFixed(3)} m)`,
      Vector3.distance(charge, muzzle) <= PLACED + 0.1,
    );
    const primed: IAutoMovieVector3 = film.prop(
      "primer",
      entry("hookPrimer").end,
    ).position;
    checks.check(
      `the primer is hooked at the vent (${Vector3.distance(primed, vent).toFixed(3)} m)`,
      Vector3.distance(primed, vent) <= PLACED,
    );
    const pulled: IAutoMovieMotionHumanSegment | undefined = film
      .segments("n4")
      .find(
        (s: IAutoMovieMotionHumanSegment): boolean => s.name === "pullLanyard",
      );
    checks.check(
      "the lanyard is pulled on the command",
      pulled !== undefined && Math.abs(pulled.start - FIRE) <= 1,
    );
    assertTakeClean("artillery drill", film);
  } catch (error: unknown) {
    checks.check("artillery drill refused: " + String(error), false);
  }
  checks.assert("artillery drill");
}

/** The field sponge and rammer, its `sponge` and `rammer` heads as the drill inserts them, leaning so its shaft's grip lies at a point. */
function rammer(at: IAutoMovieVector3): IAutoMovieMotionHumanProp {
  const model: ReturnType<typeof createLongTool> = createLongTool({
    kind: "spongeRammer",
  });
  const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 1, y: 0, z: 0 },
    75,
  );
  return HumanObject.prop("rammer", model, {
    position: Vector3.subtract(
      at,
      Quaternion.rotateVector(
        rotation,
        model.affordance("shaft").frame.translation,
      ),
    ),
    rotation,
  });
}

/** A small hand-held stage piece with a `grip` and a `tip`: the priming wire or the friction primer. */
function small(
  subject: string,
  at: IAutoMovieVector3,
): IAutoMovieMotionHumanProp {
  return {
    subject,
    frame: { position: at, rotation: Quaternion.identity() },
    points: {},
    affordances: [
      {
        id: "grip",
        kind: "handle",
        frame: Transform.of({ x: 0, y: 0.02, z: 0 }, Quaternion.identity()),
        extent: null,
        grip: "power",
        symmetry: "round",
        aperture: 0.02,
      },
      {
        id: "tip",
        kind: "surface",
        frame: Transform.of({ x: 0, y: -0.08, z: 0 }, Quaternion.identity()),
        extent: null,
      },
    ],
    shapes: [
      {
        id: "body",
        kind: "capsule",
        radius: 0.008,
        halfLength: 0.05,
        material: "steel",
        transform: {
          position: { x: 0, y: -0.03, z: 0 },
          rotation: Quaternion.identity(),
        },
      },
    ],
  };
}

/** The lanyard, fixed beside the vent, its `handle` point drawn by the pull. */
function lanyard(at: IAutoMovieVector3): IAutoMovieMotionHumanProp {
  const frame: IAutoMovieRigidTransform = {
    position: at,
    rotation: Quaternion.identity(),
  };
  return {
    subject: "lanyard",
    fixed: true,
    frame,
    // The toggle's point, its normal along the pull toward No. 4's hand.
    points: {
      handle: { point: { x: 0, y: 0, z: 0 }, normal: { x: -1, y: 0, z: 0 } },
    },
    affordances: [],
    shapes: [
      {
        id: "toggle",
        kind: "capsule",
        radius: 0.012,
        halfLength: 0.04,
        material: "wood",
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: Quaternion.identity(),
        },
      },
    ],
  };
}
