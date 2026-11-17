import {
  ArchetypeFrame,
  ArchetypeRefusal,
  type ArchetypeRide,
  type QuadrupedBody,
  type QuadrupedGait,
  createCamel,
  type rideQuadruped,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

/** Actual-model observations and generic numeric/refusal assertions shared by the locomotion units; no expected gait clocks or phase law lives here. */
export namespace animalLocomotionFixture {
  /** Actual cohort consumer, including its producer-owned contact vocabulary. */
  export type Animal = ReturnType<typeof createCamel>;

  /** The shared ride with the actual consumer's own contact and dimension types. */
  export type Ride = ArchetypeRide.IRide<
    Parameters<Animal["affordance"]>[0],
    QuadrupedBody.Dimension
  >;

  /** Four literal feet; their identifiers are the public quadruped bone contract. */
  export const FEET: readonly QuadrupedBody.Limb[] = [
    "leftFore",
    "rightFore",
    "leftHind",
    "rightHind",
  ];

  /** Six seconds at constant speed, under translation and yaw, without speed ramps. */
  export function course(
    speed: number,
    lead: QuadrupedGait.Lead = "left",
  ): rideQuadruped.ICourse {
    return {
      start: { x: 2, z: -3, heading: 29 },
      legs: [{ kind: "straight", length: speed * 6, lead }],
      cruise: speed,
      startSpeed: speed,
      endSpeed: speed,
    };
  }

  /** Observe a real terminal bar's distal centre through its actual pose and root transforms. */
  export function foot(
    ride: Ride,
    limb: QuadrupedBody.Limb,
    seconds: number,
  ): IAutoMovieVector3 {
    const sample: ReturnType<typeof ride.at> = ride.at(seconds);
    const part: IAutoMovieModelPart | undefined = sample.archetype.parts.find(
      (candidate: IAutoMovieModelPart): boolean =>
        candidate.id === `${limb}Pastern`,
    );
    if (part?.geometry.type !== "primitive" || part.transform === null || part.transform === undefined)
      throw new Error(
        "A real quadruped's lower bar must retain its placed primitive",
      );
    const shape: typeof part.geometry.shape = part.geometry.shape;
    if (shape.type !== "cylinder" && shape.type !== "capsule")
      throw new Error(
        "The actual terminal control bar must retain its rod height",
      );
    const endpoint: IAutoMovieVector3 = Vector3.add(
      part.transform.translation,
      Quaternion.rotateVector(part.transform.rotation, {
        x: 0,
        y: shape.height / 2,
        z: 0,
      }),
    );
    return ArchetypeFrame.point(sample.placement, endpoint);
  }

  /** Record a failed independently specified numeric bound, including nonfinite output. */
  export function near(
    findings: string[],
    label: string,
    actual: number,
    expected: number,
    bound: number,
  ): void {
    if (!Number.isFinite(actual) || Math.abs(actual - expected) > bound)
      findings.push(
        `${label}: ${actual}, expected ${expected} within ${bound}`,
      );
  }

  /** An invalid public request must produce an actionable parameter refusal, not an incidental exception. */
  export function refused(
    findings: string[],
    label: string,
    request: () => unknown,
  ): void {
    let error: unknown = null;
    try {
      request();
    } catch (caught) {
      error = caught;
    }
    if (
      !(error instanceof ArchetypeRefusal) ||
      error.kind !== "parameter" ||
      error.axis.length === 0
    )
      findings.push(`${label}: missing structured parameter refusal`);
  }
}
