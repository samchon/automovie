import {
  Quaternion,
  Vector3,
  measurePhysicalJointLimits,
  physicalShapeBounds,
  physicalSupportPoint,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalPlayback,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { createHash } from "node:crypto";

/** One observed maximum and its location in completed film seconds. */
interface Maximum {
  value: number;
  seconds: number;
  body: string;
  feature: string;
}

/** All-frame quality and independent left/right elbow movement per provider. */
interface Result {
  limits: {
    floorMetres: number;
    romRadians: number;
    anchorMetres: number;
    targetMetres: number;
  };
  maxima: { floor: Maximum; rom: Maximum; anchor: Maximum; target: Maximum };
  elbows: {
    body: string;
    bone: string;
    authoredRadians: number;
    observedRadians: number;
  }[];
  withinHistoricalLimits: boolean;
  active: boolean;
}

/**
 * Measure the historical penetration, angular limit, anchor and target maxima
 * over every completed state. Compare elbow articulation relative to its
 * parent so whole-body movement cannot supply evidence of bilateral activity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States completed-frame scope, historical bounds and parent-relative activity in radians.
 * @evidence contracts/development/implementation.md#principled-implementation Reads every authored and simulated transform, measuring shape minima, joint limits, anchor distances and segment distances directly.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Shape extents, joint range and anchor projection stay with Engine owners; one pass collects all maxima and motion evidence.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Prepares no synthetic states and reports actual maxima with body, bone or shape, and film second. Every observed collider and joint is included.
 * @evidence contracts/development/implementation.md#efficient-algorithms One frame traversal per provider with scalar shape minima and bounded result state; each convex hull's actual support vertices remain in the scan.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The immutable first elbow angles are reused only for relative excursion; independent observed transforms are measured fully.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No frame copies, source buffers or external handles are retained; only four extrema and two elbow summaries per body survive.
 */
export function measurePhysicalActiveHumanFrames(
  input: IAutoMoviePhysicalSimulationInput.IInput,
  frames: readonly IAutoMoviePhysicalFrame[],
): Result {
  const limits: Result["limits"] = {
    floorMetres: 0.005,
    romRadians: 0.01,
    anchorMetres: 0.005,
    targetMetres: 0.05,
  };
  const maxima: Result["maxima"] = {
    floor: initialMaximum(),
    rom: initialMaximum(),
    anchor: initialMaximum(),
    target: initialMaximum(),
  };
  const elbows: Result["elbows"] = [];
  for (const body of input.bodies) {
    const arms = (["left", "right"] as const).map((side: "left" | "right") => {
      const parent: string = `${side}UpperArm`;
      const bone: string = `${side}LowerArm`;
      return {
        parent,
        bone,
        authored: relativeRotation(body.targets[0]!.segments, parent, bone),
        observed: relativeRotation(frames[0]!.bodies[body.id]!, parent, bone),
        result: { body: body.id, bone, authoredRadians: 0, observedRadians: 0 },
      };
    });
    for (const [step, frame] of frames.entries()) {
      const states: IAutoMoviePhysicalFrame["bodies"][string] =
        frame.bodies[body.id]!;
      const targets: Readonly<Record<string, IAutoMovieRigidTransform>> =
        body.targets[step]!.segments;
      for (const segment of body.profile.segments) {
        const pose: IAutoMovieRigidTransform = states[segment.bone]!;
        observe(
          maxima.target,
          Vector3.length(
            Vector3.subtract(pose.position, targets[segment.bone]!.position),
          ),
          frame.seconds,
          body.id,
          segment.bone,
        );
        for (const shape of segment.shapes) {
          const penetration: number =
            input.floor - physicalShapeBounds.lowest(pose, shape);
          if (penetration > maxima.floor.value)
            observe(
              maxima.floor,
              penetration,
              frame.seconds,
              body.id,
              `${segment.bone}/${shape.id}`,
            );
        }
      }
      for (const joint of body.profile.joints) {
        const parent: IAutoMovieRigidTransform = states[joint.parent]!;
        const child: IAutoMovieRigidTransform = states[joint.child]!;
        const mismatch: number = Vector3.length(
          Vector3.subtract(
            physicalSupportPoint(parent, joint.parentFrame.position),
            physicalSupportPoint(child, joint.childFrame.position),
          ),
        );
        observe(maxima.anchor, mismatch, frame.seconds, body.id, joint.id);
        for (const coordinate of measurePhysicalJointLimits(
          joint,
          parent,
          child,
        ))
          if (coordinate.violation > maxima.rom.value)
            observe(
              maxima.rom,
              coordinate.violation,
              frame.seconds,
              body.id,
              `${joint.id}/${coordinate.axis}`,
            );
      }
      for (const arm of arms) {
        arm.result.authoredRadians = Math.max(
          arm.result.authoredRadians,
          Quaternion.angle(
            arm.authored,
            relativeRotation(targets, arm.parent, arm.bone),
          ),
        );
        arm.result.observedRadians = Math.max(
          arm.result.observedRadians,
          Quaternion.angle(
            arm.observed,
            relativeRotation(states, arm.parent, arm.bone),
          ),
        );
      }
    }
    for (const arm of arms) elbows.push(arm.result);
  }
  return {
    limits,
    maxima,
    elbows,
    withinHistoricalLimits:
      maxima.floor.value <= limits.floorMetres &&
      maxima.rom.value <= limits.romRadians &&
      maxima.anchor.value <= limits.anchorMetres &&
      maxima.target.value <= limits.targetMetres,
    active: elbows.every(
      (elbow: Result["elbows"][number]): boolean =>
        elbow.authoredRadians > Math.PI / 180 &&
        elbow.observedRadians >= elbow.authoredRadians / 2,
    ),
  };
}

/** Zero penetration or error is an admissible initial maximum. */
function initialMaximum(): Maximum {
  return { value: 0, seconds: 0, body: "", feature: "" };
}

/** Keep the first location attaining each positive maximum. */
function observe(
  maximum: Maximum,
  value: number,
  seconds: number,
  body: string,
  feature: string,
): void {
  if (value > maximum.value) {
    maximum.value = value;
    maximum.seconds = seconds;
    maximum.body = body;
    maximum.feature = feature;
  }
}

/** Child orientation in its parent's frame, ruling out whole-body turns. */
function relativeRotation(
  poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
  parent: string,
  child: string,
): IAutoMovieQuaternion {
  return Quaternion.multiply(
    Quaternion.inverse(poses[parent]!.rotation),
    poses[child]!.rotation,
  );
}

/** Compare completed playback with its source cache using selected film times. */
export namespace measurePhysicalActiveHumanFrames {
  /**
   * Verify exact state from one baked cache and its decoded archive, first in
   * increasing time and then in seek order. Read the two endpoint frames and
   * an interior fractional frame. The digest preserves all Float64 state bits.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes the completed cache, archive reader, exact selected instants and digest.
   * @evidence contracts/development/implementation.md#principled-implementation Hashes concrete Float64 coordinates in declared body and segment order on each cache or archive read.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One frame digest serves the consecutive and reordered checks. The contact episode spot check uses the existing public fields.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pose rounding or approximate equality masks differences. The check does not assert contact equality outside selected episodes.
   * @evidence contracts/development/implementation.md#efficient-algorithms A constant set of time reads touches each segment and holds only one frame-sized digest buffer at a time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same admitted archive and segment order serve every seek. Independent repeated cache and archive reads provide the actual determinism check.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The function retains only selected digests and episode indices; temporary frames and buffers end with their reads.
   */
  export function compareReplay(
    input: IAutoMoviePhysicalSimulationInput.IInput,
    run: IAutoMoviePhysicalSimulation,
    reader: IAutoMoviePhysicalPlayback,
  ): {
    frames: { seconds: number; sha256: string }[];
    selectedFramesSha256: string;
    checkedContactEpisodes: number[];
  } {
    const seconds: readonly number[] = [
      0,
      1 / input.rate,
      0.25,
      input.duration / 2 + 0.5 / input.rate,
      input.duration,
    ];
    const keys: [string, string][] = input.bodies.flatMap(
      (body: IAutoMoviePhysicalSimulationInput.IBody): [string, string][] =>
        body.profile.segments.map(
          (segment: IAutoMoviePhysicalSegment): [string, string] => [
            body.id,
            segment.bone,
          ],
        ),
    );
    const serializedKeys: string = JSON.stringify(keys);
    const frames: { seconds: number; sha256: string }[] = seconds.map(
      (time: number) => ({
        seconds: time,
        sha256: frameDigest(run.cache.at(time)),
      }),
    );
    for (const index of [0, 1, 2, 3, 4, 4, 0, 3, 2, 1, 3, 0]) {
      const { seconds: time, sha256 }: (typeof frames)[number] = frames[index]!;
      if (
        frameDigest(reader.at(time)) !== sha256 ||
        frameDigest(run.cache.at(time)) !== sha256
      )
        throw new Error(
          `A sequential or reordered seek disagrees with the live cache at ${time} s`,
        );
    }

    const count: number = run.cache.contacts.length;
    if (reader.contacts.length !== count)
      throw new Error("Archive has a different contact episode population");
    const checkedContactEpisodes: number[] =
      count === 0 ? [] : [...new Set([0, Math.floor(count / 2), count - 1])];
    for (const index of checkedContactEpisodes)
      if (
        JSON.stringify(reader.contacts[index]) !==
        JSON.stringify(run.cache.contacts[index])
      )
        throw new Error(
          `Archive contact episode ${index} disagrees with the live cache`,
        );

    return {
      frames,
      selectedFramesSha256: createHash("sha256")
        .update(JSON.stringify(frames))
        .digest("hex"),
      checkedContactEpisodes,
    };

    /** Hash keys in workload order and the frame's IEEE 754 fields in archive order. */
    function frameDigest(frame: IAutoMoviePhysicalFrame): string {
      const bytes: Buffer = Buffer.allocUnsafe((1 + 13 * keys.length) * 8);
      let offset: number = bytes.writeDoubleLE(frame.seconds, 0);
      for (const [body, bone] of keys) {
        const state: IAutoMoviePhysicalFrame["bodies"][string][string] =
          frame.bodies[body]![bone]!;
        for (const component of [
          state.position.x,
          state.position.y,
          state.position.z,
          state.rotation.x,
          state.rotation.y,
          state.rotation.z,
          state.rotation.w,
          state.velocity.x,
          state.velocity.y,
          state.velocity.z,
          state.angularVelocity.x,
          state.angularVelocity.y,
          state.angularVelocity.z,
        ])
          offset = bytes.writeDoubleLE(component, offset);
      }
      return createHash("sha256")
        .update(serializedKeys)
        .update(bytes)
        .digest("hex");
    }
  }
}
