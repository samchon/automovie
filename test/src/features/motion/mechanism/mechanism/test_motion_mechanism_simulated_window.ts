import {
  AutoMovieGravity,
  Quaternion,
  ROM_TOLERANCE,
  Vector3,
  physicalShapeBounds,
  physicalShapePairDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSimulation,
  IAutoMovieMotionHumanVerdicts,
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalMaterial,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanPerformance, HumanVerdicts } from "@automovie/motions";

import { assertTakeClean } from "../../../internal/assertTakeClean";
import { motionComplaints } from "../../../internal/motionComplaints";
import { motionHumanBody } from "../../../internal/motionHumanBody";
import { simulatedShoveTake } from "../../../internal/simulatedShoveTake";
import { simulationResiduals } from "../../../internal/simulationResiduals";

/** A segment's solved world state. */
type IPose = IAutoMoviePhysicalFrame["bodies"][string][string];

/** Cache intervals per second the window issue fixes (#3434). */
const RATE: number = 120;

/**
 * The checks a solved window hands from the declared plants to the solver's
 * contacts.
 */
const SUPERSEDED: readonly string[] = [
  "slip",
  "lift",
  "loose",
  "afloat",
  "skate",
  "balance",
  "unloaded",
];

/**
 * The fall's push: the impulse that changes the whole body's speed by this,
 * m/s.
 */
const PUSH: number = 3;

/** A desk-height table top, metres. */
const DESK: number = 0.75;

/** Half the table's depth along the push, metres. */
const DEPTH: number = 0.2;

/**
 * A table where the push carries the body: centred where the body's centre of
 * mass, leaving its standing height at the push's speed, falls to the table
 * top, `d = v sqrt(2 (h - top) / g)`, the drag-free projectile of a body whose
 * feet no longer hold it.
 */
function table(body: IAutoMovieMotionHumanBody): IAutoMovieMotionHumanProp {
  const drop: number = Math.max(0, body.profile.centerOfMass.y - DESK);
  const reach: number =
    PUSH * Math.sqrt((2 * drop) / AutoMovieGravity.STANDARD);
  return {
    subject: "table",
    frame: {
      position: { x: 0, y: DESK / 2, z: reach },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    points: {},
    fixed: true,
    shapes: [
      {
        id: "solid",
        material: "table",
        kind: "box",
        halfExtents: { x: 0.6, y: DESK / 2, z: DEPTH },
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
      },
    ],
  };
}
/**
 * A window of a performance baked through the engine's solver (#3434), on the
 * average man and the smallest woman.
 *
 * Scenarios:
 *
 * 1. Mode contract: a shove's window in kinematic mode shows the performance's own
 *    poses bit for bit.
 * 2. Determinism: two simulated bakes of the shove give the same input identity
 *    and the same solved frames.
 * 3. Response and hand-back: the solved head turns away from the kinematic one
 *    inside the window, and at the window's end every joint centre is back on
 *    the kinematic motion, with no step in position and none in velocity beyond
 *    what gravity gives in one interval.
 * 4. A fall-sized push from behind ends with the released body lying on the floor:
 *    its lowest collider touching it, none below it beyond the solver's
 *    documented resting error, and its displayed hips and head lower than its
 *    knees stand (the head is welded into the chest's segment, as MuJoCo's
 *    humanoid carries it, so it is read where the display lays it, not as a
 *    solved body).
 * 5. The same push with a table placed where it carries the body (the centre of
 *    mass's drag-free fall from standing height to the desk top at the push's
 *    speed): the falling body never enters the table deeper than skin gives and
 *    comes to rest touching it within the same resting error.
 * 6. Verdicts in a solved window: the released fall's report holds none of the
 *    plant, balance and unloaded checks the solver's contacts supersede, while
 *    every check of the displayed bones still reads it.
 * 7. Joint residuals: every hand-back's post-stabilization and every fewer-axis
 *    joint's distance from its own limit box stay within the 0.01 degree guard,
 *    the engine's ROM_TOLERANCE (`simulationResiduals`), so a solver that fails
 *    to hold a joint fails the spec.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Bakes windows through `HumanPerformance.simulate` and reads the displayed poses and bones, the engine's solved frames and the shipped verdict report; catches a kinematic mode that departs from the authored motion, a bake that differs between runs, a window with no response, a hand-back with a step, a fall that floats or sinks, a body that passes through a scene solid, and a report that still judges a solved body by its kinematic plan.
 * @evidence contracts/development/testing.md#independent-expectations Equality for the mode contract and determinism. Resting contact is bounded by the engine's compliant contact (`solveXpbdContacts`; Macklin, Mueller and Chentanez 2016) under its configured parameters: depth within the allowed error (the engine's `contactTolerance`) is left uncorrected, and the excess is held by a contact of compliance `w / ω²` on the pair's inverse mass `w` with `ω = 2π f` at the engine's `contactFrequency`, so a segment bearing a load of `n` times its weight rests up to `tolerance + n g / ω²` deep; `n` is at most the body's mass over the segment's. Lying is measured against the body's own rest knee height; the response must exceed the range tolerance displayed poses are held to; the velocity bound is gravity's change over one cache interval; a body may enter a solid only as deep as the verdicts' skin (`HumanVerdicts.SKIN`).
 * @evidence contracts/development/testing.md#distinguishing-cases A kinematic and a simulated mode of one window; an absorbed shove whose root stays authored and a fall the solver owns whole; the same fall with and without a solid in its way; two bodies of opposite size.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory test entered through `test_motion_mechanism_simulated_window`; it runs the WASM solver in process and starts no viewer. Every scenario runs and every failure is gathered before the one assertion. The cross-platform digest of scenario 2's window is the `simulation` workflow's.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios and what each pins.
 */
export async function test_motion_mechanism_simulated_window(): Promise<void> {
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

/**
 * Run one scenario, recording a throw as a failure so later scenarios still
 * run.
 */
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

/**
 * Scenarios 1 to 3: a shove on the head the body absorbs, kinematic and
 * simulated.
 */
async function shove(
  all: motionComplaints.IGatherer,
  name: string,
  body: IAutoMovieMotionHumanBody,
): Promise<void> {
  const take: HumanPerformance = simulatedShoveTake.shove(body);
  const window: typeof simulatedShoveTake.WINDOW = simulatedShoveTake.WINDOW;

  // 1. Kinematic mode is the performance's own motion.
  const still: HumanPerformance = await take.simulate(window, {
    kind: "kinematic",
  });
  for (let step: number = 0; step <= 48; step++) {
    const at: number = window.from + step / 48;
    all.check(
      `${name}: the kinematic window shows the performance's own pose at ${at} s`,
      JSON.stringify(still.pose("a", at)) ===
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

  simulationResiduals(all, `${name}: simulated shove`, first, ["a"]);

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
    farthest = Math.max(
      farthest,
      Vector3.length(
        Vector3.subtract(
          placed.worldPosition,
          authored.get(bone)!.worldPosition,
        ),
      ),
    );
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

/**
 * Scenarios 4 to 6: a push from behind the body cannot catch, onto the floor or
 * onto a table.
 */
async function fall(
  all: motionComplaints.IGatherer,
  name: string,
  body: IAutoMovieMotionHumanBody,
  onto: boolean,
): Promise<void> {
  const desk: IAutoMovieMotionHumanProp = table(body);
  const take: HumanPerformance = simulatedShoveTake(
    body,
    { bone: "chest", point: { x: 0, y: 0, z: 0 } },
    { x: 0, y: 0, z: PUSH * body.profile.mass },
    "fall",
    onto ? [desk] : [],
  );

  // The window runs to the film's end, so the fallen body hands back to
  // nothing and its last solved frame is where the fall came to rest.
  const from: number = simulatedShoveTake.STRUCK;
  const to: number = from + Math.floor((take.duration - from) * RATE) / RATE;
  const solved: HumanPerformance = await take.simulate(
    { from, to },
    { kind: "simulated" },
  );
  const record: IAutoMovieMotionHumanSimulation = solved.simulations()[0]!;
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    record.simulation.input;
  const profile: IAutoMoviePhysicalProfile = input.bodies.find(
    (candidate: IAutoMoviePhysicalSimulationInput.IBody): boolean =>
      candidate.id === "a",
  )!.profile;
  const frames: readonly IAutoMoviePhysicalFrame[] =
    record.simulation.cache.frames;
  const last: IAutoMoviePhysicalFrame = frames.at(-1)!;
  const tolerance: number = input.contactTolerance!;
  const omega: number = 2 * Math.PI * input.contactFrequency!;

  // The documented resting depth of a segment bearing at most the whole body.
  const resting: (segment: IAutoMoviePhysicalSegment) => number = (
    segment: IAutoMoviePhysicalSegment,
  ): number =>
    tolerance +
    (Vector3.length(input.gravity) * (profile.mass / segment.mass)) /
      omega ** 2;
  const label: string = `${name}${onto ? " onto the table" : ""}`;
  simulationResiduals(all, label, record, ["a"]);
  all.equals(
    `${label}: the push releases the body`,
    record.simulation.cache.ownershipAt("a", "hips", last.seconds),
    "dynamic",
  );
  const sunk: number = Math.min(
    ...shapes(
      profile,
      last,
      (
        pose: IPose,
        shape: IAutoMoviePhysicalShape,
        material: IAutoMoviePhysicalMaterial,
        segment: IAutoMoviePhysicalSegment,
      ): number =>
        physicalShapeBounds.lowest(pose, shape) +
        (material.maximumCompression ?? 0) +
        resting(segment),
    ),
  );
  all.check(
    `${label}: nothing ends under the floor beyond its resting depth; least margin ${sunk} m`,
    sunk >= 0,
  );
  if (onto) {
    let deepest: number = 0;
    for (const frame of frames)
      deepest = Math.max(
        deepest,
        -Math.min(
          ...shapes(
            profile,
            frame,
            (pose: IPose, shape: IAutoMoviePhysicalShape): number =>
              physicalShapePairDistance(
                pose,
                shape,
                desk.frame,
                desk.shapes![0]!,
              ),
          ),
        ),
      );
    all.check(
      `${label}: the body enters the table at most ${deepest} m`,
      deepest <= HumanVerdicts.SKIN,
    );
    const gaps: number[] = shapes(
      profile,
      last,
      (pose: IPose, shape: IAutoMoviePhysicalShape): number =>
        physicalShapePairDistance(pose, shape, desk.frame, desk.shapes![0]!),
    );
    const pressed: number = Math.min(
      ...shapes(
        profile,
        last,
        (
          pose: IPose,
          shape: IAutoMoviePhysicalShape,
          _material: IAutoMoviePhysicalMaterial,
          segment: IAutoMoviePhysicalSegment,
        ): number =>
          physicalShapePairDistance(pose, shape, desk.frame, desk.shapes![0]!) +
          resting(segment),
      ),
    );
    all.check(
      `${label}: the body rests on the table, ${Math.min(...gaps)} m from it`,
      Math.min(...gaps) <= tolerance,
    );
    all.check(
      `${label}: nothing ends in the table beyond its resting depth; least margin ${pressed} m`,
      pressed >= 0,
    );
  } else {
    const lowest: number = Math.min(
      ...shapes(
        profile,
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
    const lying: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      solved.bones("a", to);
    for (const bone of ["hips", "head"] as const)
      all.check(
        `${label}: the ${bone} lies at ${lying.get(bone)!.worldPosition.y} m, below the standing knee at ${knee} m`,
        lying.get(bone)!.worldPosition.y < knee,
      );
  }

  // 6. The solved window's report holds no superseded check.
  const report: IAutoMovieMotionHumanVerdicts.IReport = HumanVerdicts(
    solved,
    24,
    {
      from,
      to: solved.duration,
    },
  );
  const kept: string[] = report.findings
    .filter((finding: IAutoMovieMotionHumanVerdicts.IFinding): boolean =>
      SUPERSEDED.includes(finding.check),
    )
    .map(
      (finding: IAutoMovieMotionHumanVerdicts.IFinding): string =>
        finding.check,
    );
  all.check(
    `${label}: the solved window's report judges no superseded plant check; found ${kept.join(", ")}`,
    kept.length === 0,
  );
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

/** The angle between two world rotations, radians. */
function angle(a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number {
  const d: IAutoMovieQuaternion = Quaternion.multiply(Quaternion.inverse(a), b);
  return 2 * Math.atan2(Math.hypot(d.x, d.y, d.z), Math.abs(d.w));
}

/** A reading of every collider of the solved profile in a solved frame. */
function shapes(
  profile: IAutoMoviePhysicalProfile,
  frame: IAutoMoviePhysicalFrame,
  read: (
    pose: IPose,
    shape: IAutoMoviePhysicalShape,
    material: IAutoMoviePhysicalMaterial,
    segment: IAutoMoviePhysicalSegment,
  ) => number,
): number[] {
  return profile.segments.flatMap(
    (segment: IAutoMoviePhysicalSegment): number[] =>
      segment.shapes.map((shape: IAutoMoviePhysicalShape): number =>
        read(
          frame.bodies.a![segment.bone]!,
          shape,
          profile.materials.find(
            (material: IAutoMoviePhysicalMaterial): boolean =>
              material.id === shape.material,
          )!,
          segment,
        ),
      ),
  );
}
