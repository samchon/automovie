import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSimulation,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/** One side's supports of a two-sided stance. */
export type PhysicalSupportSide = "left" | "right";

/**
 * The floor's support of one simulated body over a late window: the load
 * the floor's solver receipts delivered, how it split between two sides,
 * the share moment balance gives each side from the mass center's place
 * between them, and how far the mass center moved.
 */
export namespace PhysicalSupportLoads {
  /** The window's readings. */
  export interface IResult {
    /** Mean upward floor load, newtons. */
    total: number;
    /** The left side's share of that load. */
    left: number;
    /** The left side's share by moment balance about the line between the sides' contact centroids. */
    lever: number;
    /** The greatest distance the mass center moved from its first place in the window, metres. */
    drift: number;
  }

  /**
   * Read the window from `start` to the run's end.
   *
   * @param run The simulation.
   * @param profile The body's profile.
   * @param body The body's id in the run.
   * @param start The window's first second.
   * @param side The side a supporting bone belongs to; undefined for a bone that does not support.
   * @param centroid The side's contact centroid in a frame's poses, world metres.
   * @returns The readings.
   */
  export function measure(
    run: IAutoMoviePhysicalSimulation,
    profile: IAutoMoviePhysicalProfile,
    body: string,
    start: number,
    side: (bone: string) => PhysicalSupportSide | undefined,
    centroid: (
      poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
      side: PhysicalSupportSide,
    ) => IAutoMovieVector3,
  ): IResult {
    const window: number = run.cache.duration - start;
    const loads: Record<PhysicalSupportSide, number> = { left: 0, right: 0 };
    for (const receipt of run.cache.contacts) {
      if (receipt.source !== "solver") continue;
      const end: "a" | "b" | undefined =
        receipt.a.body === body && receipt.b.body === "floor"
          ? "a"
          : receipt.b.body === body && receipt.a.body === "floor"
            ? "b"
            : undefined;
      if (!end) continue;
      const owner: PhysicalSupportSide | undefined = side(receipt[end].bone);
      if (!owner) continue;
      for (const sample of receipt.samples ?? []) {
        if (sample.seconds <= start) continue;
        const load: number =
          ((sample.appliedImpulse?.[end] ?? sample.impulse) *
            (end === "a" ? -sample.normal.y : sample.normal.y)) /
          window;
        loads[owner] += load;
      }
    }
    const frames: IAutoMoviePhysicalSimulation["cache"]["frames"] =
      run.cache.frames.filter((frame) => frame.seconds >= start);
    const centers: IAutoMovieVector3[] = frames.map((frame) =>
      center(profile, frame.bodies[body]!),
    );
    const last: Readonly<Record<string, IAutoMovieRigidTransform>> =
      frames.at(-1)!.bodies[body]!;
    const left: IAutoMovieVector3 = centroid(last, "left");
    const right: IAutoMovieVector3 = centroid(last, "right");
    const across: IAutoMovieVector3 = {
      x: left.x - right.x,
      y: 0,
      z: left.z - right.z,
    };
    const total: number = loads.left + loads.right;
    return {
      total,
      left: loads.left / total,
      lever:
        Vector3.dot(Vector3.subtract(centers.at(-1)!, right), across) /
        Vector3.dot(across, across),
      drift: Math.max(
        ...centers.map((c: IAutoMovieVector3): number =>
          Vector3.length(Vector3.subtract(c, centers[0]!)),
        ),
      ),
    };
  }

  /** The mass center of a frame's segments, metres. */
  export function center(
    profile: IAutoMoviePhysicalProfile,
    poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
  ): IAutoMovieVector3 {
    return profile.segments.reduce(
      (
        sum: IAutoMovieVector3,
        segment: IAutoMoviePhysicalSegment,
      ): IAutoMovieVector3 =>
        Vector3.add(
          sum,
          Vector3.scale(
            Vector3.add(
              poses[segment.bone]!.position,
              Quaternion.rotateVector(
                poses[segment.bone]!.rotation,
                segment.centerOfMass,
              ),
            ),
            segment.mass / profile.mass,
          ),
        ),
      { x: 0, y: 0, z: 0 },
    );
  }
}
