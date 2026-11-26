import type {
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalSimulationInput,
} from "@automovie/interface";

/** Contact withdrawal names actual other-body geometry and a local-time window. */
export function admitPhysicalReleasePolicy(
  input: IAutoMoviePhysicalSimulationInput.IInput,
  body: IAutoMoviePhysicalSimulationInput.IBody,
): void {
  if (body.releaseOnContact === undefined) return;
  const policy: NonNullable<
    IAutoMoviePhysicalSimulationInput.IBody["releaseOnContact"]
  > = body.releaseOnContact;
  const other: IAutoMoviePhysicalSimulationInput.IBody | undefined =
    input.bodies.find(
      (candidate: IAutoMoviePhysicalSimulationInput.IBody): boolean =>
        candidate.id === policy.otherBody,
    );
  const validShapes: (
    profile: IAutoMoviePhysicalProfile,
    selected: readonly string[],
  ) => boolean = (
    profile: IAutoMoviePhysicalProfile,
    selected: readonly string[],
  ): boolean =>
    selected.length > 0 &&
    new Set(selected).size === selected.length &&
    selected.every((id: string): boolean =>
      profile.segments.some((segment: IAutoMoviePhysicalSegment): boolean =>
        segment.shapes.some(
          (shape: IAutoMoviePhysicalShape): boolean => shape.id === id,
        ),
      ),
    );
  if (
    body.mode.kind === "kinematic" ||
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
