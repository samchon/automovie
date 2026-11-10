import type { AutoMoviePhysicalSimulation as Simulation } from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

/** Explicit SI fixtures shared by independent physical behavior cases. */
export namespace PhysicalFixtures {
  /** One one-kilogram sphere with analytic solid-sphere inertia. */
  export function sphere(radius: number = 0.1, compliance: number = 0): P {
    const neutral: P.ITransform = {
      position: { x: 0, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    };
    return {
      id: "sphere",
      mass: 1,
      centerOfMass: { ...neutral.position },
      provenance: "One kg uniform solid sphere; I=2mr²/5.",
      joints: [],
      materials: [
        {
          id: "solid",
          friction: 0,
          restitution: 0,
          compliance,
          damping: 0.02,
          ...(compliance > 0 ? { maximumCompression: radius * 0.3 } : {}),
        },
      ],
      segments: [
        {
          bone: "root",
          mass: 1,
          neutral,
          centerOfMass: { x: 0, y: 0, z: 0 },
          inertia: {
            x: 0.4 * radius ** 2,
            y: 0.4 * radius ** 2,
            z: 0.4 * radius ** 2,
          },
          inertiaRotation: { ...neutral.rotation },
          shapes: [
            {
              id: "surface",
              material: "solid",
              kind: "sphere",
              radius,
              transform: {
                position: { x: 0, y: 0, z: 0 },
                rotation: { ...neutral.rotation },
              },
            },
          ],
        },
      ],
    };
  }
  /** Explicit zero-strength body; no hidden root or weight compensation. */
  export function body(
    id: string,
    profile: P,
    duration: number,
    pose?: P.ITransform,
  ): Simulation.IBody {
    return {
      id,
      profile,
      mode: { kind: "simulated" },
      targets: Array.from(
        { length: Math.round(duration * 120) + 1 },
        (): Simulation.ITarget => ({
          strength: 0,
          segments: Object.fromEntries(
            profile.segments.map(
              (
                segment: (typeof profile.segments)[number],
              ): [string, P.ITransform] => [
                segment.bone,
                structuredClone(pose ?? segment.neutral),
              ],
            ),
          ),
        }),
      ),
      rootStiffness: 0,
      rootDamping: 0,
      maximumRootForce: 0,
      complianceSeconds: 0.1,
      complianceStrength: 0.3,
    };
  }
  /** Fixed 120 Hz native simulation with bounded work and no gravitational drift. */
  export function input(
    bodies: Simulation.IBody[],
    duration: number,
  ): Simulation.IInput {
    return {
      bodies,
      duration,
      rate: 120,
      gravity: { x: 0, y: 0, z: 0 },
      floor: -10,
      floorBounds: {
        min: { x: -20, z: -20 },
        max: { x: 20, z: 20 },
        thickness: 1,
      },
      impulses: [],
      checkpointEvery: 60,
      yieldEvery: 240,
      iterations: 12,
      maximumSteps: Math.round(duration * 120),
      maximumSegments: 100,
    };
  }
}
