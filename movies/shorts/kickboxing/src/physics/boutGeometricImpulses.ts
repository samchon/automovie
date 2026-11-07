import {
  type AutoMoviePhysicsCache as Cache,
  Vector3,
  resolveImpact,
} from "@automovie/engine";
import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";

/** Explicit comparison-only two-segment normal impulse estimate. It omits articulated effective mass and never changes a geometric receipt's null solver impulse. */
export function boutGeometricImpulses(
  contacts: readonly Receipt[],
  profiles: Readonly<Record<string, P>>,
  at: (seconds: number) => Cache.IFrame,
): Record<string, number> {
  const estimates: Record<string, number> = Object.create(null);
  for (const receipt of contacts) {
    if (receipt.source !== "geometric") continue;
    // Comparison floor arrivals provide timing and compression, without an estimated impact force.
    if (receipt.a.body === "floor" || receipt.b.body === "floor") {
      estimates[receipt.id] = 0;
      continue;
    }
    const frame: Cache.IFrame = at(receipt.seconds);
    /** Evaluate velocity at the actual witness, including the segment's angular motion. */
    const body: (side: Receipt["a"]) => Parameters<typeof resolveImpact>[0] = (
      side: Receipt["a"],
    ): Parameters<typeof resolveImpact>[0] => {
      const profile: P = profiles[side.body]!;
      const segment: P.ISegment = profile.segments.find(
        (candidate: P.ISegment): boolean => candidate.bone === side.bone,
      )!;
      const state: Cache.ISegment = frame.bodies[side.body]![side.bone]!;
      const velocity: IAutoMovieVector3 = Vector3.add(
        state.velocity,
        Vector3.cross(
          state.angularVelocity,
          Vector3.subtract(receipt.point, state.position),
        ),
      );
      return {
        mass: segment.mass,
        velocity,
        restitution: profile.materials.find(
          (material: P.IMaterial): boolean => material.id === side.material,
        )!.restitution,
        hardness: 1,
        penetrability: 0,
      };
    };
    estimates[receipt.id] = Vector3.length(
      resolveImpact(body(receipt.a), body(receipt.b), receipt.normal).impulse,
    );
  }
  return estimates;
}
