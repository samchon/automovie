import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import type { preparePhysicalGeometry as Geometry } from "../physics/preparePhysicalGeometry";
import type { auditAutoMovieOutcome } from "./auditAutoMovieOutcome";

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
export function measureAutoMovieContact(input: {
  /** The acting side. */ a: measureAutoMovieContact.ISide;
  /** The receiving side. */ b: measureAutoMovieContact.ISide;
  /** Prepared native geometric queries. */ queries: Geometry.IQueries;
  /** Film seconds of the measurement. */ seconds: number;
  /** Farthest separation the query reports, metres; 1 by default. */ prediction?: number;
  /** Separation counted as contact, metres; 0 by default. */ tolerance?: number;
}): measureAutoMovieContact.IResult {
  const colliders = (
    side: measureAutoMovieContact.ISide,
  ): Geometry.ICollider[] =>
    side.profile.segments
      .filter((segment: P.ISegment): boolean =>
        side.bones.includes(segment.bone),
      )
      .flatMap((segment: P.ISegment): Geometry.ICollider[] => {
        const pose: P.ITransform | undefined = side.segments[segment.bone];
        if (!pose)
          throw new Error(
            `Missing displayed pose ${side.subject}.${segment.bone}`,
          );
        return segment.shapes.map(
          (shape: P.IShape): Geometry.ICollider => ({
            body: side.subject,
            bone: segment.bone,
            shape,
            pose,
          }),
        );
      });
  const sources: Geometry.ICollider[] = colliders(input.a);
  const targets: Geometry.ICollider[] = colliders(input.b);
  if (sources.length === 0 || targets.length === 0)
    throw new Error(
      `No declared colliders between ${input.a.subject} and ${input.b.subject}`,
    );
  let best: measureAutoMovieContact.IResult = {
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
/**
 * Companion types of {@link measureAutoMovieContact}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Companion types of ) and documents 2 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Companion types of : companion namespace of 2 members (`ISide`, `IResult`); units and frames named in its text: world, metres. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `measureAutoMovieContact` in packages/engine/src/composition/measureAutoMovieContact.ts; its surface is the 2 members listed and the text shows 3 other files naming it, mostly movies (1), packages/engine (1), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace measureAutoMovieContact {
  /** One measured side. */
  export interface ISide {
    /** Subject id. */
    subject: string;

    /** Region id reported in the contact record. */
    region: string;

    /** Its physical profile with declared colliders. */
    profile: P;

    /** Its displayed world pose by segment. */
    segments: Readonly<Record<string, P.ITransform>>;

    /** Segments whose colliders form the side. */
    bones: readonly string[];
  }

  /** A measurement. */
  export interface IResult {
    /** Least signed separation, metres; Infinity when no pair is within the prediction. */
    separation: number;

    /** The acting segment of the closest pair. */
    a: string | null;

    /** The receiving segment of the closest pair. */
    b: string | null;

    /** The contact record when the separation is within tolerance. */
    contact: auditAutoMovieOutcome.IContact | null;
  }
}
