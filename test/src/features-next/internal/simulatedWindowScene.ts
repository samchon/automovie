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

import { assertTakeClean } from "../../features/internal/assertTakeClean";
import type { motionComplaints } from "../../features/internal/motionComplaints";
import { simulatedShoveTake } from "../../features/internal/simulatedShoveTake";
import { simulationResiduals } from "../../features/internal/simulationResiduals";

/**
 * The simulated windows of `test_motion_mechanism_simulated_window`, staged as
 * that spec stages them, its scenarios split so the shove's kinematic mode, the
 * solved shove, the fall to the floor and the fall onto a table are units of
 * their own.
 */
export namespace simulatedWindowScene {
  /** A segment's solved world state. */
  type IPose = IAutoMoviePhysicalFrame["bodies"][string][string];

  /** A reading of one collider of a solved profile. */
  type Read = (
    pose: IPose,
    shape: IAutoMoviePhysicalShape,
    material: IAutoMoviePhysicalMaterial,
    segment: IAutoMoviePhysicalSegment,
  ) => number;

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
   * top, `d = v sqrt(2 (h - top) / g)`, as the original places it.
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
   * The original's scenario 1: a shove's window in kinematic mode shows the
   * performance's own poses bit for bit.
   */
  export async function shoveKinematic(
    all: motionComplaints.IGatherer,
    name: string,
    body: IAutoMovieMotionHumanBody,
  ): Promise<void> {
    const take: HumanPerformance = simulatedShoveTake.shove(body);
    const window: typeof simulatedShoveTake.WINDOW = simulatedShoveTake.WINDOW;
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
  }

  /**
   * The original's scenarios 2, 3 and 7 for the shove: two bakes agree, the
   * head responds, the body hands back with no step, the residuals hold, and
   * the verdicts.
   */
  export async function shoveSolved(
    all: motionComplaints.IGatherer,
    name: string,
    body: IAutoMovieMotionHumanBody,
  ): Promise<void> {
    const take: HumanPerformance = simulatedShoveTake.shove(body);
    const window: typeof simulatedShoveTake.WINDOW = simulatedShoveTake.WINDOW;
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

    // The head turns inside the window and the body hands back.
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
   * The original's scenarios 4 to 7 for a push from behind the body cannot
   * catch, onto the floor or onto a table.
   */
  export async function fall(
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

    // The window runs to the film's end, so its last solved frame is where
    // the fall came to rest.
    const from: number = simulatedShoveTake.STRUCK;
    const solved: HumanPerformance = await take.simulate(
      { from, to: from + Math.floor((take.duration - from) * RATE) / RATE },
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
            physicalShapePairDistance(
              pose,
              shape,
              desk.frame,
              desk.shapes![0]!,
            ) + resting(segment),
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
      for (const bone of ["hips", "head"] as const)
        all.check(
          `${label}: the ${bone} lies at ${last.bodies.a![bone]!.position.y} m, below the standing knee at ${knee} m`,
          last.bodies.a![bone]!.position.y < knee,
        );
    }

    // The solved window's report holds no superseded check.
    const report: IAutoMovieMotionHumanVerdicts.IReport = HumanVerdicts.of(
      solved,
      24,
      { from, to: solved.duration },
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
    const d: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.inverse(a),
      b,
    );
    return 2 * Math.atan2(Math.hypot(d.x, d.y, d.z), Math.abs(d.w));
  }

  /** A reading of every collider of the solved profile in a solved frame. */
  function shapes(
    profile: IAutoMoviePhysicalProfile,
    frame: IAutoMoviePhysicalFrame,
    read: Read,
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
}
