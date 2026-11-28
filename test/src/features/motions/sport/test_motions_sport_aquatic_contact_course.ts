import {
  AutoMovieEngineKinematics,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanAquatic,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanPerformance,
  AutoMovieMotionHumanSwim,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { courseArmGoal } from "../../../../../packages/motions/src/compose/internal/courseArmGoal";
import { AquaticPosture } from "../../../../../packages/motions/src/sport/internal/AquaticPosture";
import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../internal/motionActionContext";

/**
 * An artistic support arm starts and returns on the base's sculling pose. The
 * palm moves to the offered support position during the figure. The offered
 * palm faces up below the water in the displayed pose throughout support.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the take-over, return and held figure as distinct choices of wrist target.
 * @evidence contracts/development/testing.md#behavioral-verification Plans one base through the public aquatic law on a stored body and reads its goal at both course endpoints and at the figure. Plays another base through the native performance and samples its posed palm at nine times across support.
 * @evidence contracts/development/testing.md#independent-expectations Uses the fixed figure clock and grip timing. Compares the planned wrist target against the forward-kinematic wrist from the scull joints, independently of the arm goal, and distinguishes the nonzero separation during the offer. Reads the resolved palm normal and depth on the support beat, independently of the planned wrist orientation.
 */
export async function test_motions_sport_aquatic_contact_course(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  shownPalm(body);
  const base: IAutoMovieMotionHumanActionPlan =
    AutoMovieMotionHumanSwim.aquatic.plan(
      motionActionContext<IAutoMovieMotionHumanAquatic.IParams>(
        body,
        {
          kind: "artisticSwim",
          role: "base",
          side: "right",
          phase: 1,
          water: 0.41,
        },
        { at: { x: 0.4, y: 0.41, z: -0.2 }, yaw: 0 },
      ),
    );
  const offer: IAutoMovieMotionHumanActionPlan = courseArmGoal.goals(base);
  TestValidator.predicate(
    "the scull owns both course endpoints",
    [2.65 - 0.14 - 0.5, 2.65 + 0.14 + 0.5].every(
      (seconds: number): boolean =>
        neutralGap(body, offer.posture(seconds), "right") < 1e-8,
    ),
  );
  TestValidator.predicate(
    "the palm offer replaces the scull wrist during support",
    neutralGap(body, offer.posture(2.65), "right") > 0.01,
  );
}

/** Read the palm the native performance shows over the bearing window. */
function shownPalm(body: IAutoMovieMotionHumanBody): void {
  const subject = "base";
  const water: number = 0.41;
  const phase: number = 0.23;
  const film = new AutoMovieMotionHumanPerformance({
    seed: "artistic-group",
    laws: [AutoMovieMotionHumanSwim.aquatic],
    performers: [
      {
        subject,
        body,
        at: { x: 0.4, y: water, z: -0.2 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: AutoMovieMotionHumanChain.subject(subject).registered(
      "aquatic",
      {
        kind: "artisticSwim",
        water,
        role: "base",
        phase,
        side: "right",
      },
    ).node,
  });
  const region = body.surfaces.regions.palmRight;
  const apex: number = 2.3 + phase * 0.35;
  TestValidator.predicate(
    "the displayed base offers an upward submerged palm over the support beat",
    Array.from({ length: 9 }, (_, i) => apex - 0.14 + i * 0.035).every(
      (seconds: number): boolean => {
        const palm =
          AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
            region,
            film.bones(subject, seconds).get(region.bone)!,
          );
        return palm.normal.y > 0.9 && palm.point.y < water;
      },
    ),
  );
}

/** Distance from an authored goal to the wrist posed by the joints alone. */
function neutralGap(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  side: AutoMovieHumanSide,
): number {
  const goal = posture.limbs[`${side}Arm`];
  if (goal === undefined) throw new Error(`${side} arm has no course goal`);
  const hand = `${side}Hand` as const;
  const neutral = AquaticPosture.markers(body, [hand])({
    ...posture,
    limbs: {},
  });
  return AutoMovieEngineVector3.distance(
    goal.point,
    neutral.get(hand)!.worldPosition,
  );
}
