import type {
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";
import { FootSlip } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** A sole's sockets, the ball lowest. */
const SOLE: IAutoMovieMotionHumanFoot.ISocket[] = [
  { socket: "heel", point: { x: 0, y: 0.02, z: 0 } },
  { socket: "ball", point: { x: 0, y: 0, z: 0.18 } },
  { socket: "toe", point: { x: 0, y: 0.01, z: 0.24 } },
];

/**
 * A capture case's foot-slip verdict: the sole's contact is its lowest socket,
 * and a window's drift is that socket's level distance from where the window
 * first saw it.
 *
 * Scenarios:
 *
 * 1. The ball, the lowest socket, is the contact.
 * 2. The first read of a window anchors it, drifting 0; a read 3 cm along and 4 cm
 *    aside drifts 5 cm, its height ignored.
 */
export function test_unit_motions_executable_foot_slip(): void {
  TestValidator.equals(
    "the lowest socket",
    FootSlip.contact(SOLE).socket,
    "ball",
  );
  const anchors: Map<string, IAutoMovieVector3> = new Map();
  const first: number = FootSlip.drift(anchors, "stance", SOLE[1]!);
  const moved: number = FootSlip.drift(anchors, "stance", {
    socket: "ball",
    point: { x: 0.04, y: 0.1, z: 0.21 },
  });
  TestValidator.predicate(
    "the window's drift",
    first === 0 && nclose(moved, 0.05, 1e-12),
  );
}
