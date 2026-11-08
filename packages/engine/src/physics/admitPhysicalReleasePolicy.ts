import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";

/** Contact withdrawal names actual other-body geometry and a finite local-time window. */
export function admitPhysicalReleasePolicy(
  input: Simulation.IInput,
  body: Simulation.IBody,
): void {
  if (body.releaseOnContact === undefined) return;
  const policy: NonNullable<Simulation.IBody["releaseOnContact"]> =
    body.releaseOnContact;
  if (!policy || typeof policy !== "object")
    throw new Error(`${body.id}: invalid contact-triggered release policy`);
  const other: Simulation.IBody | undefined = input.bodies.find(
    (candidate: Simulation.IBody): boolean => candidate.id === policy.otherBody,
  );
  const validShapes: (profile: P, selected: readonly string[]) => boolean = (
    profile: P,
    selected: readonly string[],
  ): boolean =>
    Array.isArray(selected) &&
    selected.length > 0 &&
    new Set(selected).size === selected.length &&
    Array.from(selected).every(
      (id: string): boolean =>
        typeof id === "string" &&
        profile.segments.some((segment: P.ISegment): boolean =>
          segment.shapes.some((shape: P.IShape): boolean => shape.id === id),
        ),
    );
  if (
    body.mode.kind === "kinematic" ||
    !Number.isFinite(policy.earliest) ||
    !Number.isFinite(policy.latest) ||
    policy.earliest < 0 ||
    policy.latest < policy.earliest ||
    policy.latest > input.duration ||
    !other ||
    other === body ||
    !validShapes(body.profile, policy.shapes) ||
    !validShapes(other.profile, policy.otherShapes)
  )
    throw new Error(`${body.id}: invalid contact-triggered release policy`);
}
