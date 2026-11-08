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
/** Companion types of {@link measureAutoMovieContact}. */
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
