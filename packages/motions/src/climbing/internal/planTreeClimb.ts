import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanTreeClimb,
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { support } from "../../actions/internal/support";
import { poseBones } from "../../posture/internal/poseBones";
import { treeClimbDrop } from "../treeClimb/treeClimbDrop";
import { treeClimbRoute } from "../treeClimb/treeClimbRoute";
import { treeClimbRouteExpand } from "../treeClimb/treeClimbRouteExpand";
import { treeLimbs } from "../treeClimb/treeLimbs";

/*
 * Plan a tree climb, sit or descent on the shared support law over staged
 * points of the tree (`treeClimbRoute`). A climb starts from the feet where
 * they stand; a descent ends standing `STAND_OFF` from the bole, or hangs from
 * the lowest branch and drops (`treeClimbDrop`).
 * Parameter context: The action's context.
 * Returns: The plan.
 * If the tree has no such branch, the lowest is beyond
 * reach, or a stance overloads a branch.
 */
export function planTreeClimb(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanTreeClimb.IParams>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanTreeClimb.IParams = context.params;
  const tree: treeLimbs.ITree = treeLimbs.read(context, p.tree);
  const entry: ReturnType<typeof poseBones> = poseBones(
    context.body,
    context.entry.pose,
  );
  const hips: IAutoMovieVector3 = entry.get("hips")!.worldPosition;
  const toward: IAutoMovieVector3 = Vector3.normalize({
    x: hips.x - tree.bole.foot.x,
    y: 0,
    z: hips.z - tree.bole.foot.z,
  });
  const right: IAutoMovieVector3 = { x: toward.z, y: 0, z: -toward.x };
  const floor = (
    side: AutoMovieHumanSide,
    at?: IAutoMovieVector3,
  ): treeClimbRoute.IHold => ({
    part: `${side}Foot`,
    kind: "bear",
    key: `${side}Foot@ground`,
    point:
      at ??
      Vector3.add(
        Vector3.add(
          tree.bole.foot,
          Vector3.scale(toward, tree.bole.radius + STAND_OFF),
        ),
        Vector3.scale(right, side === "right" ? STANCE : -STANCE),
      ),
    normal: { x: 0, y: 1, z: 0 },
  });
  const ground: treeClimbRoute.IHold[] =
    p.kind === "climb"
      ? [
          floor("left", entry.get("leftToes")!.worldPosition),
          floor("right", entry.get("rightToes")!.worldPosition),
        ]
      : [floor("left"), floor("right")];
  const up: treeClimbRoute.IStance[] = treeClimbRoute.up(
    context.body,
    tree,
    ground,
    toward,
    p.branch,
  );

  let stances: treeClimbRoute.IStance[];
  let drop: boolean = false;
  if (p.kind === "climb") stances = up;
  else if (p.kind === "sit")
    stances = [up.at(-1)!, ...treeClimbRoute.sit(tree, up.at(-1)!, p.branch)];
  else {
    drop = p.drop !== false;
    const down: treeClimbRoute.IStance[] = [...up].reverse();
    if (drop) {
      // Down to standing on the lowest branch, then hang from it.
      const stood: number = down.findIndex(
        (stance: treeClimbRoute.IStance): boolean => stance.event === "stand0",
      );
      const grip: treeClimbRoute.IStance = down.find(
        (stance: treeClimbRoute.IStance): boolean => stance.event === "grip",
      )!;
      stances = [
        ...down.slice(0, stood + 1),
        {
          holds: grip.holds.filter(
            (hold: treeClimbRoute.IHold): boolean => hold.kind === "grip",
          ),
          event: "hang",
        },
      ];
    } else stances = down;
  }
  const route: treeClimbRoute.IRoute = treeClimbRouteExpand(
    context.body,
    tree,
    stances,
  );
  const aim: IAutoMovieMotionHumanActionContext["aim"] = (
    reference: IAutoMovieMotionTarget,
    seconds: number,
  ) => {
    const hold: treeClimbRoute.IHold | undefined =
      reference.kind === "prop" && reference.subject === tree.subject
        ? route.staged.get(reference.point)
        : undefined;
    return hold === undefined
      ? context.aim(reference, seconds)
      : { point: hold.point, normal: hold.normal };
  };
  const plan: IAutoMovieMotionHumanActionPlan = support.plan({
    ...context,
    params: { stances: route.stances },
    aim,
  });
  if (drop) return treeClimbDrop(context, plan, tree.bole.foot.y);
  return {
    ...plan,
    base: p.kind === "sit" ? { kind: "seated" } : { kind: "standing" },
  };
}

/*
 * How far from the bole's face the climber stands on the ground, metres
 * (provisional: a forearm's length).
 */
const STAND_OFF: number = 0.3;

/*
 * The feet's half spacing on the ground, metres (provisional).
 */
const STANCE: number = 0.12;
