import { type IAutoMovieResolveOutput, resolveFrame } from "@automovie/engine";
import {
  IAutoMovieCopyDriver,
  IAutoMovieIKDriver,
  IAutoMovieNode,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

const node: (id: string, x: number) => IAutoMovieNode = (
  id: string,
  x: number,
): IAutoMovieNode => ({
  id,
  name: null,
  parent: null,
  kind: "group",
  transform: {
    translation: { x, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  mesh: null,
  camera: null,
  light: null,
  skin: null,
});

/**
 * Frame resolution applies value drivers before composition, then applies supported world drivers and returns the remaining descriptors.
 *
 * Scenarios:
 *
 * 1. With no clip, full-influence copying makes node a follow node b's x=5 translation in its world matrix.
 * 2. A twoBone descriptor with only two chain nodes remains deferred because the analytic solve needs three.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls resolveFrame with a rest-pose copy driver and short twoBone chain, observing the copied translation in world output and one deferred descriptor.
 * @evidence contracts/testing.md#independent-expectations Full translation influence copies source x=5; a two-node chain lacks the mid/tip structure required by the analytic three-node solve. The count alone does not assert deferred descriptor identity.
 * @evidence contracts/testing.md#distinguishing-cases The authored rest x=1 must change to5, while the unsupported-length IK descriptor remains deferred; full world aim/parent/IK and stateful spring execution have separate owners.
 * @evidence contracts/testing.md#execution-ownership The named test_resolve_frame_drivers entry executes real synchronous CPU frame composition through direct source imports and never starts a viewer or changes solver policy.
 */
export function test_resolve_frame_drivers(): void {
  const nodes: IAutoMovieNode[] = [node("a", 1), node("b", 5)];
  const copy: IAutoMovieCopyDriver = {
    type: "copy",
    owner: "a",
    source: "b",
    translation: true,
    rotation: false,
    scale: false,
    influence: 1,
  };
  const ik: IAutoMovieIKDriver = {
    type: "ik",
    chain: ["a", "b"],
    goal: "b",
    pole: null,
    solver: "twoBone",
    iterations: null,
    influence: 1,
  };

  const out: IAutoMovieResolveOutput = resolveFrame({
    nodes,
    clip: null,
    limits: [],
    drivers: [copy, ik],
    seconds: 0,
  });

  TestValidator.predicate(
    "copy driver reaches the world matrix",
    nclose(out.world.get("a")![12]!, 5),
  );
  TestValidator.equals("ik driver deferred", out.deferredDrivers.length, 1);
}
