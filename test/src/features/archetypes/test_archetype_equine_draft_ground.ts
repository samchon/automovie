import {
  type AutoMovieArchetype,
  AutoMovieArchetypeEquine,
  AutoMovieArchetypeEquineDraggedLoad,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
  createDragged,
  createHorse,
  rideHorse,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** The plough's authored working depth and headland lift, metres. */
const DEPTH: number = 0.15;
const LIFT: number = 0.05;

/**
 * A harnessed horse drags a plough along a furrow and lifts it round the headland, and drags a log and a sledge round a turn, each load following its trace line on the ground.
 *
 * Scenarios:
 * 1. At work the plough's share runs the authored 0.15 m below the ground, read from the emitted share's lowest surface; fully lifted at the headland it rides 0.05 m above it, and no part of the plough ever goes deeper than the working depth.
 * 2. At every sampled second the load's forward axis points along the line from its coupling to the horse's points of draft within half a degree, and the coupling stays the trace's 2.5 m behind them within 2 cm, the stride's bob.
 * 3. Each trace runs from its posed point of draft to a point fixed on the load.
 * 4. A log and a sledge dragged round a turn keep their lowest surface on the ground.
 * 5. A load whose declared draught exceeds the horse's declared capacity is refused.
 * 6. Under a declared draught of 800 N against a 1200 N capacity the horse's trunk pitches nose-down by the authored full lean of 8 degrees times that share, 5.33 degrees, against the same ride without it; the planted hooves under a lean belong to the ride's own lean spec.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenarios and bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Drives public rides and reads the emitted loads' parts and traces; a share at the wrong depth, a plough sunk at the headland, a load sliding sideways off its trace line, a floating log or an admitted overload is caught.
 * @evidence contracts/development/testing.md#independent-expectations Depths are the authored values; the trace line is read from the posed horse's draft balls; ground contact from the emitted primitives' lowest surfaces.
 * @evidence contracts/development/testing.md#distinguishing-cases Work against headland, plough against log and sledge, admitted against overloaded draught.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name.
 */
export function test_archetype_equine_draft_ground(): void {
  const horse: AutoMovieArchetype<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  > = createHorse({ tack: "harness", withersHeight: 1.6, tempo: 0 }, 1);
  const ride: AutoMovieArchetypeRide.IRide<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  > = rideHorse(
    horse,
    {
      start: { x: 0, z: 0, heading: 0 },
      legs: [
        { kind: "straight", length: 10 },
        { kind: "turn", radius: 3, angle: 180 },
        { kind: "straight", length: 10 },
      ],
      cruise: 1.3,
      acceleration: 0.6,
      deceleration: 0.6,
    },
    "walk",
  );
  const issues: string[] = [];
  const from: number = ride.plan.when(10) - 1;
  const to: number = ride.plan.when(10 + 3 * Math.PI) + 1;
  const base: AutoMovieArchetypeEquineDraggedLoad.IParams = {
    length: 2.5,
    draught: 800,
    capacity: 1200,
  };
  const plough: AutoMovieArchetypeEquineDraggedLoad.IRide =
    AutoMovieArchetypeEquineDraggedLoad(
      ride,
      horse,
      createDragged({ kind: "plough" }),
      { ...base, depth: DEPTH, lift: LIFT, raise: 1, lifts: [{ from, to }] },
    );
  inspect(
    "plough",
    plough,
    (
      seconds: number,
      sample: AutoMovieArchetypeEquineDraggedLoad.ISample,
    ): void => {
      const share: number = lowest(sample, "share");
      if (seconds < from - 0.01 || seconds > to + 0.01) {
        if (Math.abs(share + DEPTH) > 1e-9)
          issues.push(`plough ${seconds}: share at ${share} m, not -${DEPTH}`);
      } else if (
        seconds > from + 1.01 &&
        seconds < to - 1.01 &&
        Math.abs(share - LIFT) > 1e-9
      )
        issues.push(
          `plough ${seconds}: lifted share at ${share} m, not ${LIFT}`,
        );
      for (const part of sample.archetype.parts)
        if (lowest(sample, part.id) < -DEPTH - 1e-9)
          issues.push(`plough ${seconds}: ${part.id} digs below the furrow`);
    },
  );
  for (const kind of ["log", "sledge"] as const)
    inspect(
      kind,
      AutoMovieArchetypeEquineDraggedLoad(
        ride,
        horse,
        createDragged({ kind }),
        base,
      ),
      (
        seconds: number,
        sample: AutoMovieArchetypeEquineDraggedLoad.ISample,
      ): void => {
        const least: number = Math.min(
          ...sample.archetype.parts.map((part: IAutoMovieModelPart): number =>
            lowest(sample, part.id),
          ),
        );
        if (Math.abs(least) > 1e-9)
          issues.push(
            `${kind} ${seconds}: lowest surface ${least} m off the ground`,
          );
      },
    );
  let refused: unknown = null;
  try {
    AutoMovieArchetypeEquineDraggedLoad(
      ride,
      horse,
      createDragged({ kind: "log" }),
      {
        ...base,
        draught: 2000,
      },
    );
  } catch (error) {
    refused = error;
  }
  if (
    !(
      refused instanceof AutoMovieArchetypeRefusal && refused.axis === "draught"
    )
  )
    issues.push(`an overload was not refused: ${String(refused)}`);

  // 6. The horse leans into the collar under its draught.
  const leaned: AutoMovieArchetypeRide.IRide<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  > = rideHorse(
    horse,
    {
      start: { x: 0, z: 0, heading: 0 },
      legs: [{ kind: "straight", length: 10 }],
      cruise: 1.3,
      acceleration: 0.6,
      deceleration: 0.6,
      lean: AutoMovieArchetypeEquineDraggedLoad.lean(800, 1200),
    },
    "walk",
  );
  const upright: AutoMovieArchetypeRide.IRide<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  > = rideHorse(
    horse,
    {
      start: { x: 0, z: 0, heading: 0 },
      legs: [{ kind: "straight", length: 10 }],
      cruise: 1.3,
      acceleration: 0.6,
      deceleration: 0.6,
    },
    "walk",
  );
  for (const seconds of [2, 4, 6]) {
    const axis = (
      sample: AutoMovieArchetypeRide.ISample<
        AutoMovieArchetypeEquine.Affordance,
        AutoMovieArchetypeEquine.Dimension
      >,
    ): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        AutoMovieArchetypeFrame.compose(
          sample.placement,
          sample.archetype.parts.find(
            (part: IAutoMovieModelPart): boolean => part.id === "trunk",
          )!.transform!,
        ).rotation,
        { x: 0, y: 1, z: 0 },
      );
    const a: IAutoMovieVector3 = axis(leaned.at(seconds));
    const b: IAutoMovieVector3 = axis(upright.at(seconds));
    const pitch: number =
      (Math.acos(Math.min(1, Math.abs(Vector3.dot(a, b)))) * 180) / Math.PI;
    if (Math.abs(pitch - (8 * 800) / 1200) > 0.01)
      issues.push(
        `lean at ${seconds} s is ${pitch} degrees, not ${(8 * 800) / 1200}`,
      );
  }
  TestValidator.equals(
    "ground-drawn loads follow their traces on the ground",
    issues,
    [],
  );

  /** Trace line, trace ends and the load's own check at every sampled second. */
  function inspect(
    label: string,
    load: AutoMovieArchetypeEquineDraggedLoad.IRide,
    own: (
      seconds: number,
      sample: AutoMovieArchetypeEquineDraggedLoad.ISample,
    ) => void,
  ): void {
    const fixed: Map<string, IAutoMovieVector3> = new Map();
    for (let seconds: number = 0.25; seconds < load.duration; seconds += 0.25) {
      const sample: AutoMovieArchetypeEquineDraggedLoad.ISample =
        load.at(seconds);
      const horseSample: AutoMovieArchetypeRide.ISample<
        AutoMovieArchetypeEquine.Affordance,
        AutoMovieArchetypeEquine.Dimension
      > = ride.at(seconds);
      const balls: IAutoMovieVector3[] = ["draft-left", "draft-right"].map(
        (id: string): IAutoMovieVector3 =>
          AutoMovieArchetypeFrame.compose(
            horseSample.placement,
            horseSample.archetype.parts.find(
              (p: IAutoMovieModelPart): boolean => p.id === id,
            )!.transform!,
          ).translation,
      );
      const middle: IAutoMovieVector3 = Vector3.lerp(balls[0]!, balls[1]!, 0.5);
      const coupling: IAutoMovieVector3 = AutoMovieArchetypeFrame.compose(
        sample.placement,
        sample.archetype.affordance("coupling").frame,
      ).translation;
      const line: IAutoMovieVector3 = {
        x: middle.x - coupling.x,
        y: 0,
        z: middle.z - coupling.z,
      };
      const forward: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
        sample.placement,
        "z",
      );
      const angle: number =
        (Math.acos(
          Math.min(
            1,
            Vector3.dot(
              Vector3.normalize(line),
              Vector3.normalize({ ...forward, y: 0 }),
            ),
          ),
        ) *
          180) /
        Math.PI;
      if (angle > 0.5)
        issues.push(
          `${label} ${seconds}: heading ${angle} degrees off its trace line`,
        );
      if (Math.abs(Vector3.length(line) - 2.5) > 0.02)
        issues.push(
          `${label} ${seconds}: coupling ${Vector3.length(line)} m behind`,
        );
      sample.traces.forEach(
        (trace: AutoMovieArchetypeRide.ILineState, k: number): void => {
          if (Vector3.distance(trace.points[0]!, balls[k]!) > 1e-9)
            issues.push(
              `${label} ${seconds}: ${trace.id} leaves its point of draft`,
            );
          const local: IAutoMovieVector3 = inverse(
            sample.placement,
            trace.points.at(-1)!,
          );
          const known: IAutoMovieVector3 | undefined = fixed.get(trace.id);
          if (known === undefined) fixed.set(trace.id, local);
          else if (Vector3.distance(known, local) > 1e-9)
            issues.push(`${label} ${seconds}: ${trace.id} slides on the load`);
        },
      );
      own(seconds, sample);
    }
  }
}

/** An emitted part's lowest world surface. */
function lowest(
  sample: AutoMovieArchetypeEquineDraggedLoad.ISample,
  id: string,
): number {
  const part: IAutoMovieModelPart = sample.archetype.parts.find(
    (p: IAutoMovieModelPart): boolean => p.id === id,
  )!;
  if (part.geometry.type !== "primitive")
    throw new Error(`${id} is not a primitive`);
  const shape: typeof part.geometry.shape = part.geometry.shape;
  const frame: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
    sample.placement,
    part.transform!,
  );
  const along: (local: IAutoMovieVector3) => number = (
    local: IAutoMovieVector3,
  ): number => Math.abs(Quaternion.rotateVector(frame.rotation, local).y);
  if (shape.type === "box")
    return (
      frame.translation.y -
      along({ x: shape.width / 2, y: 0, z: 0 }) -
      along({ x: 0, y: shape.height / 2, z: 0 }) -
      along({ x: 0, y: 0, z: shape.depth / 2 })
    );
  if (shape.type === "cylinder") {
    const up: number = along({ x: 0, y: 1, z: 0 });
    return (
      frame.translation.y -
      (up * shape.height) / 2 -
      shape.radius * Math.sqrt(Math.max(0, 1 - up * up))
    );
  }
  if (shape.type === "capsule")
    return (
      frame.translation.y -
      along({ x: 0, y: shape.height / 2, z: 0 }) -
      shape.radius
    );
  if (shape.type === "sphere") return frame.translation.y - shape.radius;
  throw new Error(`${id} has an unsupported ${shape.type}`);
}

/** A world point in a placement's own frame. */
function inverse(
  placement: IAutoMovieTransform,
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    Quaternion.inverse(placement.rotation),
    Vector3.subtract(point, placement.translation),
  );
}
