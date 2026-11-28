import { AutoMovieArchetypeBox } from "@automovie/archetypes";
import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPutDown,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanObject,
  AutoMovieMotionHumanPerformance,
  AutoMovieMotionHumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { vclose } from "../../internal/vclose";

/** The held object task's position bound, metres. */
const PLACEMENT: number = 0.01;

/**
 * A lateral grip can deposit a carton at its marked origin.
 *
 * A stock carton is held by one side. Free and authored attitude choices both
 * place its origin on the same mark and keep it there after release. A mark
 * beyond the arm's reach refuses instead of accepting a near placement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the lateral grip, free and fixed attitude, retained origin and infeasible mark cases.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public chain and performance against a stock carton and a stored body, then samples the displayed origin after placement and release.
 * @evidence contracts/development/testing.md#independent-expectations Compares the world-space origin directly with the authored mark at the ordinary held-object task bound of 0.01 m. A mark 3 m in front exceeds the actor's arm reach.
 */
export async function test_motions_handling_put_down_origin(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const carton: IAutoMovieMotionHumanProp = AutoMovieMotionHumanObject.prop(
    "carton",
    AutoMovieArchetypeBox.create({ width: 0.43, height: 0.33, depth: 0.36 }),
    { at: { x: -0.32, y: 0.73, z: 0.37 }, yaw: 0 },
  );
  const mark: IAutoMovieVector3 = { x: 0, y: 0.86, z: 0.57 };
  const rehearse = (
    options: Omit<IAutoMovieMotionHumanPutDown.IParams, "prop" | "hand">,
  ): AutoMovieMotionHumanPerformance =>
    new AutoMovieMotionHumanPerformance({
      seed: "marked-carton",
      performers: [
        {
          subject: "actor",
          body,
          at: { x: -0.32, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [carton],
      composition: AutoMovieMotionHumanChain.subject("actor")
        .stand({ hold: 0.4 })
        .pickUp({ prop: "carton", handle: "right", hand: "left" })
        .walk({ to: { x: -0.32, y: 0, z: 0.2 } })
        .putDown({ ...options, prop: "carton", hand: "left" })
        .stand({ hold: 0.4 }).node,
    });

  for (const [mode, options] of [
    ["free", { to: mark }],
    [
      "authored",
      { to: mark, yaw: 0, rotation: AutoMovieEngineQuaternion.identity() },
    ],
  ] as const) {
    const scene: AutoMovieMotionHumanPerformance = rehearse(options);
    const deposit: IAutoMovieMotionHumanSegment = scene
      .segments("actor")
      .find(
        (segment: IAutoMovieMotionHumanSegment): boolean =>
          segment.name === "putDown",
      )!;
    for (const name of ["placed", "release"]) {
      const seconds: number =
        deposit.start +
        deposit.plan.events.find((event) => event.name === name)!.share *
          deposit.plan.duration;
      const position: IAutoMovieVector3 = scene.prop(
        "carton",
        seconds + 1e-6,
      ).position;
      TestValidator.predicate(
        `${mode} origin after ${name}: ${JSON.stringify(position)}`,
        vclose(position, mark, PLACEMENT),
      );
    }
    TestValidator.predicate(
      `${mode} origin during the following stand`,
      vclose(scene.prop("carton", scene.duration).position, mark, PLACEMENT),
    );
  }

  let refused: boolean = false;
  try {
    rehearse({ to: { x: 0, y: 0.86, z: 3 } });
  } catch (error: unknown) {
    refused = error instanceof AutoMovieMotionHumanRefusal;
  }
  TestValidator.predicate("the impossible mark refuses", refused);
}
