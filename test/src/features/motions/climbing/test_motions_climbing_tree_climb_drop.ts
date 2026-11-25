import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import {
  poseBones,
  resolveHumanPosture,
  stand,
  treeClimbDrop,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";
import { syntheticHumanPlan } from "../../internal/synthetic/syntheticHumanPlan";

/**
 * Tree drop joins are bound to the displayed predecessor.
 *
 * Scenarios:
 *
 * 1. A target prepared 0.1 m higher updates the hang without moving the already
 *    published release and touchdown.
 * 2. At and after release, the dropped posture has no material hand constraint. At
 *    touchdown the first sole actually bears on the floor.
 * 3. Shuffled time queries select the same hang, flight and landing.
 */
export async function test_motions_climbing_tree_climb_drop(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const base = stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  let raised: number = 0;
  const source: IAutoMovieMotionHumanActionPlan = {
    ...syntheticHumanPlan({
      duration: 1,
      contacts: [
        {
          part: "leftHand",
          kind: "grip",
          from: 0,
          to: 1,
          support: { kind: "prop", subject: "branch" },
        },
      ],
    }),
    prepare: (): void => {
      raised = 0.1;
    },
    posture: (): IAutoMovieMotionHumanPosture => {
      const hang: IAutoMovieMotionHumanPosture = {
        ...base,
        root: { ...base.root, y: base.root.y + 0.7 + raised },
        limbs: {},
      };
      const bones: ReturnType<typeof poseBones> = poseBones(
        body,
        resolveHumanPosture(body, hang),
      );
      return {
        ...hang,
        limbs: {
          leftArm: {
            point: bones.get("leftHand")!.worldPosition,
            rotation: bones.get("leftHand")!.worldRotation,
            bend: bones.get("leftLowerArm")!.worldPosition,
            planted: true,
          },
        },
      };
    },
  };
  const plan: IAutoMovieMotionHumanActionPlan = treeClimbDrop(
    { body },
    source,
    0,
  );
  const seconds = (name: string): number =>
    plan.events.find((event): boolean => event.name === name)!.share *
    plan.duration;
  const release: number = seconds("release");
  const touchdown: number = seconds("touchdown");
  plan.prepare?.();
  TestValidator.predicate(
    "preparation refreshes the hang, leaving the event clock fixed",
    seconds("release") === release &&
      seconds("touchdown") === touchdown &&
      nclose(plan.posture(release).root.y, base.root.y + 0.8, 1e-10) &&
      nclose(plan.posture(release + 1e-6).root.y, base.root.y + 0.8, 1e-5),
  );
  for (const at of [
    touchdown + 0.1,
    release - 0.001,
    release + 0.001,
    touchdown,
    release + 0.001,
  ]) {
    const raw: IAutoMovieMotionHumanPosture = plan.posture(at);
    TestValidator.equals(
      "the branch owns the hand exactly through release",
      raw.limbs.leftArm?.planted === true,
      at <= release,
    );
    TestValidator.equals(
      "an actual foot goal takes the floor at touchdown",
      raw.limbs.leftLeg?.planted === true ||
        raw.limbs.rightLeg?.planted === true,
      at >= touchdown,
    );
  }
}
