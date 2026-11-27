import { Quaternion, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanProp,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanChain, AutoMovieMotionHumanPerformance } from "@automovie/motions";
import {
  HumanColliders,
  workout,
  workoutWallSit,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";

/**
 * A frictionless wall can bear a horizontal normal while the floor carries the
 * entire vertical weight.
 *
 * Scenarios:
 *
 * 1. At a contact height of 1 m, the centre at 0.25 m and the pressure point at
 *    0.50 m need a normal and floor tangent of magnitude W/4.
 * 2. Friction 0.249 cannot admit that demand, while 0.25 suffices.
 * 3. With a stocked body and a finite wall just behind the unloaded posture, the
 *    actual pose reaches the named panel during the hold.
 * 4. A reversed normal refuses that same wall.
 */
export async function test_motions_exercise_wall_sit(): Promise<void> {
  const reaction: number = workoutWallSit.reaction(0.5, 0.25, 1);
  TestValidator.predicate(
    "the moment arms determine the horizontal reaction",
    nclose(reaction, 0.25, 1e-12),
  );
  TestValidator.predicate(
    "friction must meet the required ratio",
    reaction > 0.249 && reaction <= 0.25,
  );

  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const chain = AutoMovieMotionHumanChain.extend({ workout });
  const build = (prop?: IAutoMovieMotionHumanProp): AutoMovieMotionHumanPerformance =>
    new AutoMovieMotionHumanPerformance({
      seed: "wall sit",
      performers: [
        {
          subject: "actor",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      laws: [workout],
      props: prop === undefined ? [] : [prop],
      composition: chain.subject("actor").workout({
        kind: "wallSit",
        hold: 1.5,
        floorFriction: 1,
        ...(prop === undefined
          ? {}
          : { on: { prop: "wall", affordance: "face" } }),
      }).node,
    });
  const unloaded: AutoMovieMotionHumanPerformance = build();
  const sample: number = 1.6;
  const rear: IAutoMovieVector3 = { x: 0, y: 0, z: -1 };
  const torso: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "hips",
    "spine",
    "chest",
  ]);
  const outside = (film: AutoMovieMotionHumanPerformance): number =>
    Math.min(
      ...HumanColliders.placed(body, film.bones("actor", sample))
        .filter(({ bone }): boolean => torso.has(bone))
        .flatMap(({ pose, shapes }) =>
          shapes.map(
            (shape): number => AutoMovieEnginePhysics.physicalShapeSupport(pose, shape, rear).z,
          ),
        ),
    );
  const surface: number = outside(unloaded) - 0.005;
  const panel = (turn: number): IAutoMovieMotionHumanProp => {
    const translation: IAutoMovieVector3 = { x: 0, y: 1, z: surface };
    const rotation = Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, turn);
    return {
      subject: "wall",
      fixed: true,
      frame: {
        position: { x: 0, y: 0, z: 0 },
        rotation: Quaternion.identity(),
      },
      points: {
        face: {
          point: translation,
          normal: { x: 0, y: 0, z: Math.sign(turn) },
        },
      },
      affordances: [
        {
          id: "face",
          kind: "surface",
          width: 2,
          depth: 2,
          extent: null,
          frame: { translation, rotation, scale: { x: 1, y: 1, z: 1 } },
        },
      ],
    };
  };
  const loaded: AutoMovieMotionHumanPerformance = build(panel(90));
  const contact: IAutoMovieMotionHumanContactWindow | undefined = loaded
    .segments("actor")[0]!
    .plan.contacts.find((item): boolean => item.part === "back");
  TestValidator.predicate(
    "displayed back meets the wall and carries horizontal force only",
    contact?.material !== undefined &&
      contact.load === 0 &&
      contact.support.kind === "prop" &&
      contact.support.point === "face" &&
      nclose(outside(loaded), surface, 1e-5),
  );
  let reversed: boolean = false;
  try {
    build(panel(-90));
  } catch (error: unknown) {
    reversed = String(error).includes("upright and face");
  }
  TestValidator.predicate("the back side of the panel is refused", reversed);
}
