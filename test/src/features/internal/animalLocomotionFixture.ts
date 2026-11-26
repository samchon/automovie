import { AutoMovieArchetypeFrame, type AutoMovieArchetypeQuadrupedBody, type AutoMovieArchetypeQuadrupedGait, AutoMovieArchetypeRefusal, type AutoMovieArchetypeRide, type rideQuadruped, AutoMovieArchetypeCamel } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { animalTerminalSole } from "./animalTerminalSole";

/**
 * Actual-model observations and generic numeric/refusal assertions shared by
 * the locomotion units; no expected gait clocks or phase law lives here.
 */
export namespace animalLocomotionFixture {
  /** Actual cohort consumer, including its producer-owned contact vocabulary. */
  export type Animal = ReturnType<typeof AutoMovieArchetypeCamel.create>;

  /** The shared ride with the actual consumer's own contact and dimension types. */
  export type Ride = AutoMovieArchetypeRide.IRide<
    Parameters<Animal["affordance"]>[0],
    AutoMovieArchetypeQuadrupedBody.Dimension
  >;

  /**
   * Four literal feet; their identifiers are the public quadruped bone
   * contract.
   */
  export const FEET: readonly AutoMovieArchetypeQuadrupedBody.Limb[] = [
    "leftFore",
    "rightFore",
    "leftHind",
    "rightHind",
  ];

  /**
   * Six seconds at constant speed, under translation and yaw, without speed
   * ramps.
   */
  export function course(
    speed: number,
    lead: AutoMovieArchetypeQuadrupedGait.Lead = "left",
  ): rideQuadruped.ICourse {
    return {
      start: { x: 2, z: -3, heading: 29 },
      legs: [{ kind: "straight", length: speed * 6, lead }],
      cruise: speed,
      startSpeed: speed,
      endSpeed: speed,
    };
  }

  /**
   * Observe a real terminal bar's distal centre through its actual pose and
   * root transforms.
   */
  export function foot(
    ride: Ride,
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
    seconds: number,
  ): IAutoMovieVector3 {
    const sample: ReturnType<typeof ride.at> = ride.at(seconds);
    const part: IAutoMovieModelPart | undefined = sample.archetype.parts.find(
      (candidate: IAutoMovieModelPart): boolean =>
        candidate.id === `${limb}Pastern`,
    );
    if (
      part?.geometry.type !== "primitive" ||
      part.transform === null ||
      part.transform === undefined
    )
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
    return AutoMovieArchetypeFrame.point(sample.placement, endpoint);
  }

  /**
   * Lowest actual terminal solid surface, distinct from foot()'s distal joint.
   *
   * @param ride Actual public ride supplying current primitives and placement.
   * @param limb The declared terminal bar to observe.
   * @param seconds Film seconds sampled through the actual public at() seam.
   * @returns Lowest complete terminal surface in world metres.
   * @throws {Error} For missing or unsupported actual terminal geometry.
   * @evidence contracts/development/common.md#meaningful-documentation States actual source ownership, film-second input, complete world-space primitive support and its distinction from the distal control endpoint.
   * @evidence contracts/development/implementation.md#principled-implementation Finds the actual posed terminal primitive and delegates its complete world support to the single independent analytic test oracle; no producer floor clearance is read.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Sample the real ride, find the named terminal and measure its actual world sole.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing/unsupported primitive fails the observation, and an elevated endpoint is never projected to the floor or substituted for a sole.
   * @evidence contracts/development/implementation.md#efficient-algorithms One actual public sample and one O(P) part search, then constant-size shape support arithmetic.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses animalTerminalSole shared by legacy ground assertions and new independent attachment observations, without copying a production clearance solver.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one number and retains no sample or external handle.
   */
  export function sole(
    ride: Ride,
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
    seconds: number,
  ): number {
    const sample: ReturnType<typeof ride.at> = ride.at(seconds);
    const part: IAutoMovieModelPart | undefined = sample.archetype.parts.find(
      (candidate: IAutoMovieModelPart): boolean =>
        candidate.id === `${limb}Pastern`,
    );
    if (part === undefined) throw new Error(`Missing actual terminal ${limb}`);
    return animalTerminalSole(part, sample.placement);
  }

  /**
   * Record a failed independently specified numeric bound, including nonfinite
   * output.
   */
  export function near(
    findings: string[],
    label: string,
    actual: number,
    expected: number,
    bound: number,
  ): void {
    if (Math.abs(actual - expected) > bound)
      findings.push(
        `${label}: ${actual}, expected ${expected} within ${bound}`,
      );
  }

  /**
   * An invalid public request must produce an actionable parameter refusal, not
   * an incidental exception.
   */
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
      !(error instanceof AutoMovieArchetypeRefusal) ||
      error.kind !== "parameter" ||
      error.axis.length === 0
    )
      findings.push(`${label}: missing structured parameter refusal`);
  }
}
