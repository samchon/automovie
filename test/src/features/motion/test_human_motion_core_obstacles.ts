import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanObstacle,
  HumanPerformance,
  type IHumanActionContext,
  type IHumanActionLaw,
  type IHumanActionPlan,
  type IHumanBody,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A scene's solids stand in a path's way, their openings let a body through
 * when they are wide and tall enough, and a law reads them from its context.
 *
 * The scene: a wall 0.2 m thick and 2.5 m high across the way at 2 m ahead,
 * from 2 m left to 2 m right, with a doorway 0.9 m wide and 2 m high whose
 * middle is 0.5 m to the left; a second wall the same 3 m ahead with no
 * opening; and a beam, a solid 0.2 m thick from 1.6 m to 1.8 m up, across
 * the way 1 m behind. A body 0.45 m broad and 1.75 m tall walks straight
 * stretches from the origin's line.
 *
 * Scenarios:
 * 1. A stretch 1 m to the right of the origin, 4 m ahead, is blocked by the
 *    first wall as a solid, 1.9 m along, where it meets the wall's near face.
 * 2. A stretch through the doorway's middle that stops between the walls is
 *    free; carried on to 4 m it is blocked by the second wall, 2.9 m along.
 * 3. A stretch 0.35 m off the doorway's middle is blocked as too narrow: the
 *    doorway leaves 0.2 m about it and the body needs 0.45 m.
 * 4. A body 2.1 m tall through the doorway's middle is blocked for headroom:
 *    it has 2 m and needs 2.1 m.
 * 5. A stretch that stops 0.5 m short of the wall is free.
 * 6. A stretch backward under the beam is blocked for headroom, with 1.6 m
 *    against 1.75 m, 0.9 m along; a body 1.5 m tall passes under it.
 * 7. An object's `aperture` affordance, 0.5 m along its own `+X`, 0.9 m wide
 *    and 2 m high, on an object placed 2 m ahead and turned a quarter turn
 *    to the left, is an opening 1.5 m ahead whose width runs along the
 *    world's Z.
 * 8. A registered law reads from its context the obstacles the performance
 *    was given, by their subjects and in their order.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Asks the public query about stretches of the stated scene and reads the context of a performed law; a wall that lets a path through, a doorway that blocks its middle, a narrow or low passage accepted, or a context without the obstacles fails.
 * @evidence contracts/development/testing.md#independent-expectations Every distance is the scene's own arithmetic: the wall's near face is half its thickness before its line, the room about a crossing is the doorway's width less twice the offset.
 * @evidence contracts/development/testing.md#distinguishing-cases A solid, an opening that clears, one too narrow, one too low, a stretch that stops short, a solid passed under by a short body and not by a tall one, the nearer of two walls, an object's own opening and the context's reader.
 * @evidence contracts/development/testing.md#execution-ownership Plain arithmetic and one performance of half a second of standing on one prepared body; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the scene with its measures and the 8 scenarios with their numbers.
 */
export function test_human_motion_core_obstacles(): void {
  const at = (x: number, z: number): IAutoMovieVector3 => ({ x, y: 0, z });
  const north: HumanObstacle.IObstacle = HumanObstacle.wall(
    "north",
    at(-2, 2),
    at(2, 2),
    0.2,
    2.5,
    [
      {
        id: "door",
        at: at(0.5, 2),
        across: { x: 1, y: 0, z: 0 },
        width: 0.9,
        height: 2,
      },
    ],
  );
  const far: HumanObstacle.IObstacle = HumanObstacle.wall(
    "far",
    at(-2, 3),
    at(2, 3),
    0.2,
    2.5,
  );
  const beam: HumanObstacle.IObstacle = {
    ...HumanObstacle.wall("beam", at(-2, -1), at(2, -1), 0.2, 1.8),
    bottom: 1.6,
  };
  const scene: readonly HumanObstacle.IObstacle[] = [north, far, beam];
  const body: HumanObstacle.INeed = { breadth: 0.45, height: 1.75 };
  const read = (
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    need: HumanObstacle.INeed = body,
  ): unknown => {
    const block: HumanObstacle.IBlock | null = HumanObstacle.blocking(
      scene,
      from,
      to,
      need,
    );
    return block === null
      ? "free"
      : [
          block.subject,
          block.cause,
          Number(block.distance.toFixed(6)),
          block.aperture ?? "",
          block.short === undefined
            ? ""
            : `${block.short.has.toFixed(3)} of ${block.short.needs.toFixed(3)}`,
        ];
  };

  TestValidator.equals("a wall blocks a path", read(at(-1, 0), at(-1, 4)), [
    "north",
    "solid",
    1.9,
    "",
    "",
  ]);
  TestValidator.equals(
    "a doorway's middle lets a body through",
    [read(at(0.5, 0), at(0.5, 2.5)), read(at(0.5, 0), at(0.5, 4))],
    ["free", ["far", "solid", 2.9, "", ""]],
  );
  TestValidator.equals(
    "a doorway's edge is too narrow",
    read(at(0.85, 0), at(0.85, 2.5)),
    ["north", "narrow", 1.9, "door", "0.200 of 0.450"],
  );
  TestValidator.equals(
    "a doorway is too low for a taller body",
    read(at(0.5, 0), at(0.5, 2.5), { breadth: 0.45, height: 2.1 }),
    ["north", "headroom", 1.9, "door", "2.000 of 2.100"],
  );
  TestValidator.equals(
    "a path that stops short is free",
    read(at(-1, 0), at(-1, 1.5)),
    "free",
  );
  TestValidator.equals(
    "a beam is passed under by a body that fits",
    [
      read(at(0, 0), at(0, -2)),
      read(at(0, 0), at(0, -2), { breadth: 0.45, height: 1.5 }),
    ],
    [["beam", "headroom", 0.9, "", "1.600 of 1.750"], "free"],
  );

  // 7. An object's own opening.
  const opening: HumanObstacle.IAperture | undefined = HumanObstacle.apertures(
    {
      affordances: [
        {
          id: "doorway",
          kind: "aperture",
          frame: {
            translation: { x: 0.5, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 1, y: 1, z: 1 },
          },
          extent: null,
          width: 0.9,
          height: 2,
        },
      ],
    },
    { at: at(0, 2), yaw: 90 },
  )[0];
  TestValidator.equals(
    "an object's aperture is an opening in the world",
    opening === undefined
      ? "none"
      : [
          opening.id,
          Number(opening.at.x.toFixed(6)) + 0,
          Number(opening.at.z.toFixed(6)) + 0,
          Number(Math.abs(opening.across.x).toFixed(6)),
          Number(Math.abs(opening.across.z).toFixed(6)),
          opening.width,
          opening.height,
        ],
    ["doorway", 0, 1.5, 0, 1, 0.9, 2],
  );

  // 8. A law reads the scene from its context.
  const man: IHumanBody = motionHumanBody("m-average");
  let seen: readonly string[] = [];
  const look: IHumanActionLaw<stand.IParams> = {
    ...stand,
    name: "survey",
    plan: (context: IHumanActionContext<stand.IParams>): IHumanActionPlan => {
      seen = context
        .obstacles()
        .map((obstacle: HumanObstacle.IObstacle): string => obstacle.subject);
      return stand.plan(context);
    },
  };
  new HumanPerformance({
    seed: "obstacles",
    performers: [
      {
        subject: "a",
        body: man,
        at: at(0, 0),
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    laws: [look],
    obstacles: scene,
    composition: HumanChain.subject("a").registered("survey", { seconds: 0.5 })
      .node,
  });
  TestValidator.equals("a law reads the obstacles", seen, [
    "north",
    "far",
    "beam",
  ]);
}
