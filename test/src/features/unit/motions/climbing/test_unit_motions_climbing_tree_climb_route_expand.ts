import type { IAutoMovieMotionHumanSupport } from "@automovie/interface";
import {
  HumanRefusal,
  type treeClimbRoute,
  treeClimbRouteExpand,
  type treeLimbs,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `treeClimbRouteExpand` expands a tree climb's stances so the holds change a
 * group at a time, each group one stance named after it: holds taken, then the
 * feet moved, then the hands, then the holds let go, the last carrying the
 * stance's own event; each stance shares the body's weight over its holds and
 * is refused where a hold loads its branch past the branch's limit.
 *
 * Scenarios, a 70 kg climber on an oak with one 2 m branch:
 *
 * 1. Starting on four holds and then taking the left knee onto a seat hold, moving
 *    the left foot and letting go of the right hand gives the stances `start`,
 *    `stepTake`, `stepFeet` and `step`, with 4, 5, 5 and 4 contacts, and stages
 *    every hold by its key.
 * 2. A hand on the branch 1 m out, sharing 70 g / 4 = 171.6 N, is refused on
 *    `branch` where the branch bears 100 N times its half length over the
 *    reach, 100 N, and admitted where it bears 1000.
 */
export function test_unit_motions_climbing_tree_climb_route_expand(): void {
  const hold: (
    part: IAutoMovieMotionHumanSupport.Part,
    key: string,
    branch?: { index: number; out: number },
  ) => treeClimbRoute.IHold = (
    part: IAutoMovieMotionHumanSupport.Part,
    key: string,
    branch?: { index: number; out: number },
  ): treeClimbRoute.IHold => ({
    part,
    kind: part.endsWith("Hand") ? "grip" : "bear",
    key,
    point: { x: 0, y: 0, z: 0 },
    normal: { x: 0, y: 1, z: 0 },
    ...(branch === undefined ? {} : { branch }),
  });
  const tree: (load: number) => treeLimbs.ITree = (
    load: number,
  ): treeLimbs.ITree => ({
    subject: "oak",
    bole: { foot: { x: 0, y: 0, z: 0 }, radius: 0.3 },
    branches: [
      {
        index: 0,
        root: { x: 0, y: 2, z: 0 },
        direction: { x: 1, y: 0, z: 0 },
        length: 2,
        radius: 0.1,
        load,
      },
    ],
  });
  const body: Parameters<typeof treeClimbRouteExpand>[0] = {
    massModel: { mass: 70 },
  };
  const start: treeClimbRoute.IStance = {
    event: "start",
    holds: [
      hold("leftFoot", "b1"),
      hold("rightFoot", "b2"),
      hold("leftHand", "b3"),
      hold("rightHand", "b4"),
    ],
  };
  const route: treeClimbRoute.IRoute = treeClimbRouteExpand(body, tree(1000), [
    start,
    {
      event: "step",
      holds: [
        hold("leftFoot", "b5"),
        hold("rightFoot", "b2"),
        hold("leftHand", "b3"),
        hold("leftKnee", "s1"),
      ],
    },
  ]);
  TestValidator.equals(
    "the expansion",
    [
      route.stances.map((s: IAutoMovieMotionHumanSupport.IStance): unknown => [
        s.event,
        s.contacts.length,
      ]),
      [...route.staged.keys()].sort(),
    ],
    [
      [
        ["start", 4],
        ["stepTake", 5],
        ["stepFeet", 5],
        ["step", 4],
      ],
      ["b1", "b2", "b3", "b4", "b5", "s1"],
    ],
  );
  const onBranch: treeClimbRoute.IStance = {
    event: "start",
    holds: [
      hold("leftFoot", "b1"),
      hold("rightFoot", "b2"),
      hold("leftHand", "b3"),
      hold("rightHand", "branch", { index: 0, out: 1 }),
    ],
  };
  let axis: string | undefined;
  try {
    treeClimbRouteExpand(body, tree(100), [onBranch]);
  } catch (error: unknown) {
    if (error instanceof HumanRefusal) axis = error.axis;
  }
  TestValidator.predicate(
    "the branch's load",
    axis === "branch" &&
      treeClimbRouteExpand(body, tree(1000), [onBranch]).stances.length === 1,
  );
}
