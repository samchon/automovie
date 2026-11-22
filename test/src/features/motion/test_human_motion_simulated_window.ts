import {
  AutoMovieGravity,
  Quaternion,
  ROM_TOLERANCE,
  Vector3,
  physicalShapeBounds,
  physicalShapePairDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanForceSite,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerturb,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSimulation,
  IAutoMovieMotionHumanSimulationWindow,
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalMaterial,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanVerdicts,
} from "@automovie/motions";

import { assertTakeClean } from "../internal/assertTakeClean";
import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/** A segment's solved world state. */
type IPose = IAutoMoviePhysicalFrame["bodies"][string][string];

/** Cache intervals per second the window issue fixes (#3434). */
const RATE: number = 120;

/** When the impulse lands and the reaction starts, film seconds. */
const STRUCK: number = 0.3;

/** A table in front of the body: a 1.2 m by 0.5 m top 0.75 m high, its front edge 0.3 m ahead of the feet. */
const TABLE: IAutoMovieMotionHumanProp = {
  subject: "table",
  frame: {
    position: { x: 0, y: 0.375, z: 0.55 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  },
  points: {},
  fixed: true,
  shapes: [
    {
      id: "solid",
      material: "table",
      kind: "box",
      halfExtents: { x: 0.6, y: 0.375, z: 0.25 },
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      },
    },
  ],
};

/**
 * A window of a performance baked through the engine's solver (#3434), on
 * the average man and the smallest woman.
 *
 * Scenarios:
 * 1. Mode contract: a shove's window in kinematic mode shows the performance's own poses bit for bit.
 * 2. Determinism: two simulated bakes of the shove give the same input identity and the same solved frames.
 * 3. Response and hand-back: the solved head turns away from the kinematic one inside the window, and at the window's end every joint centre is back on the kinematic motion, with no step in position and none in velocity beyond what gravity gives in one interval.
 * 4. A fall-sized push from behind ends with the released body lying on the floor: its lowest collider within the solver's contact tolerance of the floor, none below it, and its hips and head lower than its knees stand.
 * 5. The same push with a table ahead: the falling body never enters the table deeper than skin gives and comes to rest touching it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Bakes windows through `HumanPerformance.simulate` and reads the displayed poses and bones and the engine's solved frames; catches a kinematic mode that departs from the authored motion, a bake that differs between runs, a window with no response, a hand-back with a step, a fall that floats or sinks, and a body that passes through a scene solid.
 * @evidence contracts/development/testing.md#independent-expectations Equality for the mode contract and determinism; contact by the engine's own tolerance read from the admitted input; lying measured against the body's own rest knee height; the response must exceed the range tolerance displayed poses are held to; the velocity bound is gravity's change over one cache interval, which a hand-back that drops the response's velocity exceeds; a body may enter a solid only as deep as the verdicts' skin (`HumanVerdicts.SKIN`).
 * @evidence contracts/development/testing.md#distinguishing-cases A kinematic and a simulated mode of one window; an absorbed shove that hands back and a fall that does not stand again; the same fall with and without a solid in its way; two bodies of opposite size.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory test entered through `test_human_motion_simulated_window`; it runs the WASM solver in process and starts no viewer. Every scenario runs and every failure is gathered before the one assertion.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export async function test_human_motion_simulated_window(): Promise<void> {
  const all: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    await guarded(
      all,
      `${name} shove`,
      (): Promise<void> => shove(all, name, body),
    );
    await guarded(
      all,
      `${name} fall`,
      (): Promise<void> => fall(all, name, body, false),
    );
    await guarded(
      all,
      `${name} fall onto a table`,
      (): Promise<void> => fall(all, name, body, true),
    );
  }
  all.assert("simulated windows");
}

/** Run one scenario, recording a throw as a failure so later scenarios still run. */
async function guarded(
  all: motionComplaints.IGatherer,
  title: string,
  task: () => Promise<void>,
): Promise<void> {
  try {
    await task();
  } catch (error: unknown) {
    all.check(
      `${title} threw: ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  }
}

/** Scenarios 1 to 3: a shove on the head the body absorbs, kinematic and simulated. */
async function shove(
  all: motionComplaints.IGatherer,
  name: string,
  body: IAutoMovieMotionHumanBody,
): Promise<void> {
  const take: HumanPerformance = perform(
    body,
    { bone: "head", point: { x: 0, y: 0.1, z: 0 } },
    { x: 0, y: 0, z: -0.05 * body.profile.mass },
    "absorb",
    [],
  );
  const window: IAutoMovieMotionHumanSimulationWindow = {
    from: STRUCK,
    to: STRUCK + 1,
  };

  // 1. Kinematic mode is the performance's own motion.
  const still: HumanPerformance = await take.simulate(window, {
    kind: "kinematic",
  });
  for (let step: number = 0; step <= 48; step++) {
    const at: number = window.from + step / 48;
    all.equals(
      `${name}: kinematic window pose at ${at} s`,
      JSON.stringify(still.pose("a", at)),
      JSON.stringify(take.pose("a", at)),
    );
  }

  // 2. Two bakes agree.
  const solved: HumanPerformance = await take.simulate(window, {
    kind: "simulated",
  });
  const again: HumanPerformance = await take.simulate(window, {
    kind: "simulated",
  });
  const first: IAutoMovieMotionHumanSimulation = solved.simulations()[0]!;
  const second: IAutoMovieMotionHumanSimulation = again.simulations()[0]!;
  all.equals(
    `${name}: bake identity`,
    second.simulation.cache.identity,
    first.simulation.cache.identity,
  );
  all.check(
    `${name}: two bakes solve the same frames`,
    JSON.stringify(second.simulation.cache.frames) ===
      JSON.stringify(first.simulation.cache.frames),
  );

  // 3. The head turns inside the window and the body hands back.
  let turn: number = 0;
  for (let step: number = 1; step < RATE; step++) {
    const at: number = window.from + step / RATE;
    turn = Math.max(
      turn,
      angle(
        solved.bones("a", at).get("head")!.worldRotation,
        take.bones("a", at).get("head")!.worldRotation,
      ),
    );
  }
  all.check(
    `${name}: the solved head turns ${turn} rad from the kinematic one`,
    turn > (ROM_TOLERANCE * Math.PI) / 180,
  );
  const end: number = window.to;
  const tolerance: number = first.simulation.input.contactTolerance!;
  const delta: number = 1 / RATE;
  const before: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    solved.bones("a", end - delta);
  const at: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = solved.bones(
    "a",
    end,
  );
  const after: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    solved.bones("a", end + delta);
  const authored: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    take.bones("a", end);
  let farthest: number = 0;
  let sharpest: number = 0;
  let where: string = "";
  for (const [bone, placed] of at) {
    const gap: number = Vector3.length(
      Vector3.subtract(placed.worldPosition, authored.get(bone)!.worldPosition),
    );
    farthest = Math.max(farthest, gap);
    const incoming: IAutoMovieVector3 = Vector3.scale(
      Vector3.subtract(placed.worldPosition, before.get(bone)!.worldPosition),
      1 / delta,
    );
    const outgoing: IAutoMovieVector3 = Vector3.scale(
      Vector3.subtract(after.get(bone)!.worldPosition, placed.worldPosition),
      1 / delta,
    );
    const step: number = Vector3.length(Vector3.subtract(outgoing, incoming));
    if (step > sharpest) {
      sharpest = step;
      where = bone;
    }
  }
  all.check(
    `${name}: every joint centre is back on the kinematic motion at the window's end; farthest ${farthest} m`,
    farthest <= tolerance,
  );
  all.check(
    `${name}: no joint centre's velocity changes by more than gravity's ${AutoMovieGravity.STANDARD * delta} m/s across the hand-back; ${where} by ${sharpest} m/s`,
    sharpest <= AutoMovieGravity.STANDARD * delta,
  );
  verdicts(all, `${name}: simulated shove`, solved);
}

/** Scenarios 4 and 5: a push from behind the body cannot catch, onto the floor or onto a table. */
async function fall(
  all: motionComplaints.IGatherer,
  name: string,
  body: IAutoMovieMotionHumanBody,
  table: boolean,
): Promise<void> {
  const take: HumanPerformance = perform(
    body,
    { bone: "chest", point: { x: 0, y: 0, z: 0 } },
    { x: 0, y: 0, z: 3 * body.profile.mass },
    "fall",
    table ? [TABLE] : [],
  );

  // The window runs to the film's end, so the fallen body hands back to
  // nothing and its last solved frame is where the fall came to rest.
  const solved: HumanPerformance = await take.simulate(
    {
      from: STRUCK,
      to: STRUCK + Math.floor((take.duration - STRUCK) * RATE) / RATE,
    },
    { kind: "simulated" },
  );
  const record: IAutoMovieMotionHumanSimulation = solved.simulations()[0]!;
  const frames: readonly IAutoMoviePhysicalFrame[] =
    record.simulation.cache.frames;
  const last: IAutoMoviePhysicalFrame = frames.at(-1)!;
  const tolerance: number = record.simulation.input.contactTolerance!;
  const label: string = `${name}${table ? " onto the table" : ""}`;
  all.equals(
    `${label}: the push releases the body`,
    record.simulation.cache.ownershipAt("a", "hips", last.seconds),
    "dynamic",
  );
  const sunk: number = Math.min(
    ...shapes(
      body,
      last,
      (
        pose: IPose,
        shape: IAutoMoviePhysicalShape,
        material: IAutoMoviePhysicalMaterial,
      ): number =>
        physicalShapeBounds.lowest(pose, shape) +
        (material.maximumCompression ?? 0),
    ),
  );
  all.check(
    `${label}: nothing ends under the floor, ${sunk} m`,
    sunk >= -tolerance,
  );
  if (table) {
    let deepest: number = 0;
    for (const frame of frames) {
      const depth: number = Math.min(
        ...shapes(
          body,
          frame,
          (pose: IPose, shape: IAutoMoviePhysicalShape): number =>
            physicalShapePairDistance(
              pose,
              shape,
              TABLE.frame,
              TABLE.shapes![0]!,
            ),
        ),
      );
      deepest = Math.max(deepest, -depth);
    }
    all.check(
      `${label}: the body enters the table at most ${deepest} m`,
      deepest <= HumanVerdicts.SKIN,
    );
    const gap: number = Math.min(
      ...shapes(
        body,
        last,
        (pose: IPose, shape: IAutoMoviePhysicalShape): number =>
          physicalShapePairDistance(
            pose,
            shape,
            TABLE.frame,
            TABLE.shapes![0]!,
          ),
      ),
    );
    all.check(
      `${label}: the body rests on the table, ${gap} m from it`,
      Math.abs(gap) <= tolerance,
    );
  } else {
    const lowest: number = Math.min(
      ...shapes(
        body,
        last,
        (pose: IPose, shape: IAutoMoviePhysicalShape): number =>
          physicalShapeBounds.lowest(pose, shape),
      ),
    );
    all.check(
      `${label}: the body touches the floor, lowest ${lowest} m`,
      lowest <= tolerance,
    );
    const knee: number = body.rest.get("leftLowerLeg")!.y;
    for (const bone of ["hips", "head"] as const)
      all.check(
        `${label}: the ${bone} lies at ${last.bodies.a![bone]!.position.y} m, below the standing knee at ${knee} m`,
        last.bodies.a![bone]!.position.y < knee,
      );
  }
  verdicts(all, `${label}: simulated fall`, solved);
}

/** The shipped verdicts over the take, a fault recorded as a failure. */
function verdicts(
  all: motionComplaints.IGatherer,
  label: string,
  take: HumanPerformance,
): void {
  try {
    assertTakeClean(label, take);
  } catch (error: unknown) {
    all.check(error instanceof Error ? error.message : String(error), false);
  }
}

/** One performer standing, then struck at a site and answering the impulse with the named outcome. */
function perform(
  body: IAutoMovieMotionHumanBody,
  at: AutoMovieHumanForceSite,
  impulse: IAutoMovieVector3,
  outcome: IAutoMovieMotionHumanPerturb.IParams["outcome"],
  props: IAutoMovieMotionHumanProp[],
): HumanPerformance {
  return new HumanPerformance({
    seed: "simulated-window",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props,
    forces: [{ kind: "impulse", subject: "a", at, seconds: STRUCK, impulse }],
    composition: HumanChain.subject("a")
      .stand({ seconds: STRUCK, sway: 0 })
      .perturb({ outcome }).node,
  });
}

/** The angle between two world rotations, radians. */
function angle(a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number {
  const d: IAutoMovieQuaternion = Quaternion.multiply(Quaternion.inverse(a), b);
  return 2 * Math.atan2(Math.hypot(d.x, d.y, d.z), Math.abs(d.w));
}

/** A reading of every collider of the body in a solved frame. */
function shapes(
  body: IAutoMovieMotionHumanBody,
  frame: IAutoMoviePhysicalFrame,
  read: (
    pose: IPose,
    shape: IAutoMoviePhysicalShape,
    material: IAutoMoviePhysicalMaterial,
  ) => number,
): number[] {
  return body.profile.segments.flatMap(
    (segment: IAutoMoviePhysicalSegment): number[] =>
      segment.shapes.map((shape: IAutoMoviePhysicalShape): number =>
        read(
          frame.bodies.a![segment.bone]!,
          shape,
          body.profile.materials.find(
            (material: IAutoMoviePhysicalMaterial): boolean =>
              material.id === shape.material,
          )!,
        ),
      ),
  );
}
