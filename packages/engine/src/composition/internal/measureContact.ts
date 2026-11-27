import type {
  IAutoMovieMeasureContact,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMoviePreparePhysicalGeometry,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

/*
 * Measure whether two displayed bodies meet: the least signed separation, in
 * metres, between every declared collider of one body's named segments (an
 * effector, such as a striking surface) and every declared collider of the
 * other's (a region), at their displayed world poses, by the native geometric
 * contact query. Negative is compression. A pair beyond the prediction distance
 * reads as no contact. The measurement is of the displayed bodies, never of two
 * landmarks, so a refused contact means the bodies did not meet.
 * Returns: The least separation and its colliders, and the contact record
 * `auditOutcome` reads when the separation is within `tolerance` (an
 * impulse of zero: a geometric touch, not a solved one).
 */
export function measureContact(
  input: IAutoMovieMeasureContact.IInput,
): IAutoMovieMeasureContact.IResult {
  const colliders = (
    side: IAutoMovieMeasureContact.ISide,
  ): IAutoMoviePreparePhysicalGeometry.ICollider[] =>
    side.profile.segments
      .filter((segment: IAutoMoviePhysicalSegment): boolean =>
        side.bones.includes(segment.bone),
      )
      .flatMap(
        (
          segment: IAutoMoviePhysicalSegment,
        ): IAutoMoviePreparePhysicalGeometry.ICollider[] => {
          const pose: IAutoMovieRigidTransform | undefined =
            side.segments[segment.bone];
          if (!pose)
            throw new Error(
              `Missing displayed pose ${side.subject}.${segment.bone}`,
            );
          return segment.shapes.map(
            (
              shape: IAutoMoviePhysicalShape,
            ): IAutoMoviePreparePhysicalGeometry.ICollider => ({
              body: side.subject,
              bone: segment.bone,
              shape,
              pose,
            }),
          );
        },
      );
  const sources: IAutoMoviePreparePhysicalGeometry.ICollider[] = colliders(
    input.a,
  );
  const targets: IAutoMoviePreparePhysicalGeometry.ICollider[] = colliders(
    input.b,
  );
  if (sources.length === 0 || targets.length === 0)
    throw new Error(
      `No declared colliders between ${input.a.subject} and ${input.b.subject}`,
    );
  let best: IAutoMovieMeasureContact.IResult = {
    separation: Infinity,
    a: null,
    b: null,
    contact: null,
  };
  for (const a of sources)
    for (const b of targets) {
      const separation: number =
        input.queries.contact(a, b, input.seconds, input.prediction ?? 1)
          ?.separation ?? Infinity;
      if (separation < best.separation)
        best = { separation, a: a.bone, b: b.bone, contact: null };
    }
  if (best.separation <= (input.tolerance ?? 0))
    best.contact = {
      a: { subject: input.a.subject, region: input.a.region },
      b: { subject: input.b.subject, region: input.b.region },
      seconds: input.seconds,
      impulse: 0,
    };
  return best;
}
