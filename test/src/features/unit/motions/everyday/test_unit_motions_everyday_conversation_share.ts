import type {
  IAutoMovieMotionHumanGaze,
  IAutoMovieMotionTarget,
} from "@automovie/interface";
import { conversationShare } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a few sums of film seconds and one quotient, unitless. */
const ROUNDING: number = 1e-12;

/**
 * `conversationShare` is the share of a film span the gaze requests spend on a
 * person's face: each request runs from its start to its release or the next
 * request, whichever is first, clipped to the span.
 *
 * Over the span 0 to 10 s: a face from 1 s released at 3 s, a point from 4 s, a
 * face from 6 s with no release, and a face from 8 s.
 *
 * Scenarios:
 *
 * 1. The faces hold 2 + 2 + 2 = 6 of the 10 s: 0.6. The point's 2 s do not
 *    count, and the face from 6 s ends where the next request begins.
 * 2. Clipped to 2 to 7 s: the first face's 1 s and the third's 1 s, 2 of 5 s.
 */
export function test_unit_motions_everyday_conversation_share(): void {
  const face: IAutoMovieMotionTarget = {
    kind: "person",
    subject: "b",
    region: "forehead",
  };
  const point: IAutoMovieMotionTarget = {
    kind: "point",
    at: { x: 0, y: 1.6, z: 3 },
    frame: "world",
  };
  const requests: IAutoMovieMotionHumanGaze.ILayer[] = [
    { target: face, from: 1, to: 3 },
    { target: point, from: 4 },
    { target: face, from: 6 },
    { target: face, from: 8 },
  ];
  TestValidator.predicate(
    "the faces' share of the span",
    nclose(conversationShare({ requests, from: 0, to: 10 }), 0.6, ROUNDING),
  );
  TestValidator.predicate(
    "clipped to a part of the span",
    nclose(conversationShare({ requests, from: 2, to: 7 }), 0.4, ROUNDING),
  );
}
