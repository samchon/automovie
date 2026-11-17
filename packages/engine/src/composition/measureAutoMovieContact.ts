import type {
  IAutoMovieMeasureContact,
  IAutoMoviePhysicalProfile,
  IAutoMoviePreparePhysicalGeometry,
} from "@automovie/interface";

/**
 * Measure whether two displayed bodies meet: the least signed separation, in
 * metres, between every declared collider of one body's named segments (an
 * effector, such as a striking surface) and every declared collider of the
 * other's (a region), at their displayed world poses, by the native geometric
 * contact query. Negative is compression. A pair beyond the prediction
 * distance reads as no contact. The measurement is of the displayed bodies,
 * never of two landmarks, so a refused contact means the bodies did not meet.
 *
 * @returns The least separation and its colliders, and the contact record
 *   `auditAutoMovieOutcome` reads when the separation is within `tolerance`
 *   (an impulse of zero: a geometric touch, not a solved one).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Measure whether two displayed bodies meet: the least signed separation, in metres, between every declared collider of one body's named segments (an effector, such as a striking surface) and every declared collider of the other's (a region), at their displayed world poses, by the native geometric contact query) and documents the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Measure whether two displayed bodies meet: the least signed separation, in metres, between every declared collider of one body's named segments (an effector, such as a striking surface) and every declared collider of the other's (a region), at their displayed world poses, by the native geometric contact query) directly over its typed inputs (`input`) as nested iteration of depth 2 (flatMap over side.profile.segments .filter((seg; filter over side.profile.segments; map over segment.shapes), delegating to `colliders`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 52 lines and 8 top-level statements that reuses `colliders` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (flatMap over side.profile.segments .filter((seg; filter over side.profile.segments; map over segment.shapes), performed once per call with 8 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 8 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function measureAutoMovieContact(
  input: IAutoMovieMeasureContact.IInput,
): IAutoMovieMeasureContact.IResult {
  const colliders = (
    side: IAutoMovieMeasureContact.ISide,
  ): IAutoMoviePreparePhysicalGeometry.ICollider[] =>
    side.profile.segments
      .filter((segment: IAutoMoviePhysicalProfile.ISegment): boolean =>
        side.bones.includes(segment.bone),
      )
      .flatMap(
        (
          segment: IAutoMoviePhysicalProfile.ISegment,
        ): IAutoMoviePreparePhysicalGeometry.ICollider[] => {
          const pose: IAutoMoviePhysicalProfile.ITransform | undefined =
            side.segments[segment.bone];
          if (!pose)
            throw new Error(
              `Missing displayed pose ${side.subject}.${segment.bone}`,
            );
          return segment.shapes.map(
            (
              shape: IAutoMoviePhysicalProfile.IShape,
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
