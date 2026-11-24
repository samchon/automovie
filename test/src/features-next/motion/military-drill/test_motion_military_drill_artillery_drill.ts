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
  IAutoMovieAffordance,
  IAutoMovieComposition,
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
  AutoMovieMotionHumanMilitaryDrill,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HUMAN_LEXICON } from "@automovie/motions/internal";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

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
  // No. 5 has brought the charge up beside No. 2, within the handover's reach.
  n5: { x: -1.6, y: 0, z: 0.7 },
};

/** Where No. 2 loads from, metres from the muzzle's face: to its left (`-x`) and a little behind it, facing it, so the charge goes in from his right hand within its reach. */
const LOADER: IAutoMovieVector3 = { x: -0.4, y: 0, z: -0.15 };

/** No. 2's heading at the muzzle, degrees: facing the gun's left side (`+x`). */
const LOADER_YAW: number = 90;

/** No. 5 beside No. 2, metres in No. 2's frame at the muzzle: the offset the original stations had (0.7 m to his right, 0.5 m behind), turned with him. */
const BRINGER: IAutoMovieVector3 = { x: -0.5, y: 0, z: 0.7 };

/** Where No. 1 sponges and rams from, metres from the middle of the rammer grip's travel along the bore: to the gun's right (`+x`), a forearm's reach from the staff, and back along the bore by the shoulder's half width, so his right hand works the staff abeam of his shoulder. */
const RAMMER_AT: IAutoMovieVector3 = { x: 0.45, y: 0, z: 0.17 };

/** No. 1's heading beside the staff, degrees: facing the gun's axis (`-x`). */
const RAMMER_YAW: number = -90;

/** The rammer's start in No. 1's frame turned with him, metres: the original stations' 0.2 m to his right, 0.35 m ahead and 0.95 m up. */
const RAMMER_REST: IAutoMovieVector3 = { x: -0.35, y: 0.95, z: -0.2 };

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
export function test_motion_military_drill_artillery_drill(): void {
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
    // No. 2 loads beside the muzzle, facing it; No. 5 brings the charge up
    // beside him. The gun stands at the origin unturned, so its marks are
    // world points.
    const loader: IAutoMovieVector3 = {
      x: muzzle.x + LOADER.x,
      y: 0,
      z: muzzle.z + LOADER.z,
    };
    // No. 1 works the staff beside the middle of its grip's travel: the
    // grip starts the staff's reach (its shaft grip to its sponge) out of
    // the muzzle along the bore and goes the bore's depth in.
    const staff: ReturnType<typeof createLongTool> = createLongTool({
      kind: "spongeRammer",
    });
    const along: number = Vector3.distance(
      staff.affordance("shaft").frame.translation,
      staff.affordance("sponge").frame.translation,
    );
    const out: IAutoMovieVector3 = Quaternion.rotateVector(
      gun.affordance("muzzle").frame.rotation,
      { x: 0, y: 1, z: 0 },
    );
    const travelled: IAutoMovieVector3 = Vector3.add(
      muzzle,
      Vector3.scale(out, along - scene.bore / 2),
    );
    const rammerAt: IAutoMovieVector3 = {
      x: travelled.x + RAMMER_AT.x,
      y: 0,
      z: travelled.z + RAMMER_AT.z,
    };
    const stations: Record<
      keyof IAutoMovieMotionHumanGunCrew.IRoles,
      IAutoMovieVector3
    > = {
      ...STATIONS,
      n1: rammerAt,
      n2: loader,
      n5: Vector3.add(loader, BRINGER),
    };
    const yaws: Partial<
      Record<keyof IAutoMovieMotionHumanGunCrew.IRoles, number>
    > = { n1: RAMMER_YAW, n2: LOADER_YAW, n5: LOADER_YAW };
    const props: IAutoMovieMotionHumanProp[] = [
      HumanObject.prop("gun", gun, {
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        fixed: true,
      }),
      rammer(Vector3.add(rammerAt, RAMMER_REST)),
      HumanObject.prop("charge", createProjectile({ kind: "roundShot" }), {
        // At No. 5's right front, as he faces with No. 2.
        at: Vector3.add(stations.n5, { x: 0.35, y: 0.85, z: 0.22 }),
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
          at: stations[role],
          yaw: yaws[role] ?? 0,
          proficiency: { level: "trained" },
        }),
      ),
      composition: AutoMovieComposition.sequence(
        taking,
        AutoMovieMotionHumanMilitaryDrill.HumanGunCrew.drill(ROLES, scene),
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
    // A gun mark where the gun shows it at a second: posed by its
    // articulations (the elevation the laying gave), on its frame.
    const mark: (point: string, seconds: number) => IAutoMovieVector3 = (
      point: string,
      seconds: number,
    ): IAutoMovieVector3 => {
      const frame: IAutoMovieRigidTransform = film.prop("gun", seconds);
      const posed: IAutoMovieAffordance = props[0]!.articulate!(
        film.state("gun", seconds),
      ).affordances.find((a: IAutoMovieAffordance): boolean => a.id === point)!;
      return Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, posed.frame.translation),
      );
    };
    const loaded: number = entry("loadCharge").end;
    const charge: IAutoMovieVector3 = film.prop("charge", loaded).position;
    const mouth: IAutoMovieVector3 = mark("muzzle", loaded);
    checks.check(
      `the charge is set at the muzzle (${Vector3.distance(charge, mouth).toFixed(3)} m)`,
      Vector3.distance(charge, mouth) <= PLACED + 0.1,
    );
    const hooked: number = entry("hookPrimer").end;
    const primed: IAutoMovieVector3 = film.prop("primer", hooked).position;
    const orifice: IAutoMovieVector3 = mark("vent", hooked);
    checks.check(
      `the primer is hooked at the vent (${Vector3.distance(primed, orifice).toFixed(3)} m)`,
      Vector3.distance(primed, orifice) <= PLACED,
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
