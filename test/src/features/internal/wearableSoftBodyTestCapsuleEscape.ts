import {
  type IAutoMovieSoftBodyBoundarySample,
  simulateSoftBodyWithBoundaries,
} from "@automovie/engine";
import type { IAutoMovieSoftBodyDomain } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Preserve original Scenario 9 finite outputs for coincident capsule particles.
 *
 * @evidence contracts/testing.md#behavioral-verification Replays the actual lower solver against the original point, horizontal and diagonal capsules and checks every returned position for finiteness.
 * @evidence contracts/testing.md#independent-expectations Number.isFinite determines each expected Boolean independently; finite output alone does not prove escape distance, collision freedom or repeatability despite the retained historical assertion label.
 * @evidence contracts/testing.md#distinguishing-cases Keeps all three original orientations, rest coordinates, .25 radius and two absolute boundary rows in their original order; no new case or expected position is introduced.
 * @evidence contracts/testing.md#execution-ownership The main test lends the same mutable capsule-only domain, whose rest array is reassigned in the existing order for each case; returned state is local and no file/native/render host or foreign method is used.
 */
export function wearableSoftBodyTestCapsuleEscape(
  capsuleOnly: IAutoMovieSoftBodyDomain,
): void {
  /** Replay the original capsule-only object and preserve its sequential rest mutation. */
  const capsuleEscape: (
    from: { x: number; y: number; z: number },
    to: { x: number; y: number; z: number },
  ) => number[] = (
    from: { x: number; y: number; z: number },
    to: { x: number; y: number; z: number },
  ): number[] => {
    const moving: IAutoMovieSoftBodyDomain = capsuleOnly;
    moving.rest = [0, 0, 0, 5, 5, 5];
    const boundary: IAutoMovieSoftBodyBoundarySample = {
      step: 0,
      anchors: [],
      capsules: [{ id: "torso", from, to, radius: 0.25 }],
    };
    return simulateSoftBodyWithBoundaries(moving, 1, [
      boundary,
      { ...boundary, step: 1 },
    ]).positions;
  };
  TestValidator.equals(
    "coincident particles leave degenerate and differently oriented capsules deterministically",
    {
      point: capsuleEscape({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }).every(
        Number.isFinite,
      ),
      xAxis: capsuleEscape({ x: -1, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }).every(
        Number.isFinite,
      ),
      diagonal: capsuleEscape(
        { x: -1, y: -1, z: 0 },
        { x: 1, y: 1, z: 0 },
      ).every(Number.isFinite),
    },
    { point: true, xAxis: true, diagonal: true },
  );
}
