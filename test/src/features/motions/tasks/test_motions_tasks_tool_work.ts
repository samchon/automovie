import { HumanToolWork } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/** A pot at (1, 0.8, 2): its inside's floor 0.02 m up, its rim 0.22 m up. */
const POT: HumanToolWork.IStir = {
  subject: "pot",
  inside: {
    frame: {
      translation: { x: 0, y: 0.02, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    width: 0.2,
  },
  rim: {
    frame: {
      translation: { x: 0, y: 0.22, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
  },
  frame: {
    position: { x: 1, y: 0.8, z: 2 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  },
  forward: { x: 0, y: 0, z: 1 },
  length: 0.25,
  forearm: 0.27,
};

/**
 * The `useTool` law's stir (`HumanToolWork.stir`): the spoon circles halfway
 * between the inside's floor and the rim, on the lesser of a third of the
 * forearm and a quarter of the inside's width, from its point nearest the
 * performer.
 *
 * Scenarios:
 *
 * 1. In the pot, the depth is 0.1 m, the radius min(0.09, 0.05) = 0.05 m, and the
 *    work point (1, 0.92, 1.95).
 * 2. A spoon of 0.08 m, short of the 0.1 m depth, or an inside of no width, is
 *    refused.
 */
export function test_motions_tasks_tool_work(): void {
  const work: HumanToolWork.IWork = HumanToolWork.stir(POT);
  TestValidator.predicate(
    "the stirring circle",
    nclose(work.radius, 0.05, 1e-12) &&
      vclose(work.on, { x: 1, y: 0.92, z: 1.95 }, 1e-12),
  );
  TestValidator.predicate(
    "a short spoon, a flat inside",
    throwsError(() => HumanToolWork.stir({ ...POT, length: 0.08 })) &&
      throwsError(() =>
        HumanToolWork.stir({ ...POT, inside: { ...POT.inside, width: 0 } }),
      ),
  );
}
