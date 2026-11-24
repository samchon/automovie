import { createTree } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanClimb,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanRefusal } from "../../../features/internal/motionHumanRefusal";

/** A hand's or foot's largest gap from the surface it holds, metres. */
const ON: number = 0.06;

/** How far a landed foot may slide before the take ends, metres. */
const SLIDE: number = 0.02;

/** The lowest branch's height, metres: within the small woman's standing reach. */
const LOWEST: number = 1.45;

/** The trunk's diameter, metres. */
const DBH: number = 0.95;

/** A round bar of the tree in world metres. */
interface ILimb {
  /** One end of its axis. */
  from: IAutoMovieVector3;

  /** The other end. */
  to: IAutoMovieVector3;

  /** Its radius. */
  radius: number;
}

/**
 * Tree climbing (#4000).
 *
 * Scenarios, on the average man and the small woman:
 * 1. Climbing to stand on the second branch puts every hand and foot of
 *    every stance on a branch or the bole, with at least three contacts
 *    bearing throughout.
 * 2. Sitting astride the lowest branch puts the seat on it and the feet
 *    either side of it.
 * 3. Climbing down hangs from the lowest branch and drops to the floor,
 *    where the landed feet do not slide.
 * 4. A tree whose lowest branch is beyond the standing reach is refused.
 * 5. A tree drawn without branches keeps its trunk face exactly as before.
 * Every take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each move, the checks and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed hands, feet and seat against the tree's own bars, the plan's contact windows and the floor, and the take through the shipped verdicts.
 * @evidence contracts/development/testing.md#independent-expectations The bars come from the tree's affordances; the gaps are named here.
 * @evidence contracts/development/testing.md#distinguishing-cases Climb, sit and descent on two bodies, the refusal and the unchanged branchless tree.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain.
 */
export function test_motion_climb_tree_climb(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const oak = createTree({
    kind: "whiteOak",
    dbh: DBH,
    branches: 3,
    branchHeight: LOWEST,
    branchGap: 0.7,
  });
  const high = createTree({
    kind: "whiteOak",
    dbh: DBH,
    branches: 3,
    branchHeight: 3.2,
  });
  const tree: IAutoMovieMotionHumanProp = HumanObject.prop("tree", oak, {
    at: { x: 0, y: 0, z: 0 },
    yaw: 0,
    fixed: true,
  });
  const tall: IAutoMovieMotionHumanProp = HumanObject.prop("tall", high, {
    at: { x: 6, y: 0, z: 0 },
    yaw: 0,
    fixed: true,
  });
  const limbs: ILimb[] = oak.affordances
    .filter((a: IAutoMovieAffordance): boolean => a.kind === "bar")
    .map((a: IAutoMovieAffordance): ILimb => {
      const axis: IAutoMovieVector3 = Quaternion.rotateVector(
        a.frame.rotation,
        { x: 1, y: 0, z: 0 },
      );
      const half: IAutoMovieVector3 = Vector3.scale(axis, a.length! / 2);
      return {
        from: Vector3.subtract(a.frame.translation, half),
        to: Vector3.add(a.frame.translation, half),
        radius: a.radius!,
      };
    });
  const gap = (point: IAutoMovieVector3): number =>
    Math.min(
      ...limbs.map(
        (limb: ILimb): number =>
          segmentDistance(point, limb.from, limb.to) - limb.radius,
      ),
    );
  const stand: IAutoMovieVector3 = { x: 0, y: 0, z: DBH / 2 + 0.35 };
  for (const fit of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(fit);
    const perform = (
      chain: IAutoMovieMotionHumanChain,
      at: IAutoMovieVector3 = stand,
    ): HumanPerformance =>
      new HumanPerformance({
        seed: "tree-climb",
        performers: [
          {
            subject: "a",
            body,
            at,
            yaw: 180,
            proficiency: { level: "trained" },
          },
        ],
        props: [tree, tall],
        laws: [AutoMovieMotionHumanClimb.treeClimb.climbTree],
        composition: chain.node,
      });
    const climb: IAutoMovieMotionHumanChain = HumanChain.subject(
      "a",
    ).registered("climbTree", { kind: "climb", tree: "tree", branch: 1 });

    // 1. The climb's holds and its three contacts.
    try {
      const take: HumanPerformance = perform(climb);
      assertTakeClean(`${fit} tree climb`, take);
      const up: IAutoMovieMotionHumanSegment = take
        .segments("a")
        .find(
          (s: IAutoMovieMotionHumanSegment): boolean =>
            s.law.name === "climbTree",
        )!;
      for (const event of up.plan.events.filter(
        (e: IAutoMovieMotionEvent): boolean => e.name !== "floor",
      )) {
        const t: number = up.start + event.share * (up.end - up.start);
        const bones = take.bones("a", t);
        for (const window of up.plan.contacts.filter(
          (w: IAutoMovieMotionHumanContactWindow): boolean =>
            w.from <= event.share &&
            event.share <= w.to &&
            w.support.kind === "prop",
        )) {
          const bone: AutoMovieHumanoidBone =
            window.part === "leftFoot" || window.part === "rightFoot"
              ? (window.part.replace("Foot", "Toes") as AutoMovieHumanoidBone)
              : (window.part as AutoMovieHumanoidBone);
          const off: number = gap(bones.get(bone)!.worldPosition);
          all.check(
            `${fit} climb: the ${window.part} holds a branch or the bole at ${event.name} (${off.toFixed(3)} m off)`,
            off <= ON,
          );
        }
      }
      for (let k: number = 1; k < 48; k++) {
        const share: number = k / 48;
        const bearing: number = up.plan.contacts.filter(
          (w: IAutoMovieMotionHumanContactWindow): boolean =>
            w.from <= share && share <= w.to,
        ).length;
        all.check(
          `${fit} climb bears on at least three contacts at ${share.toFixed(2)} (${bearing})`,
          bearing >= 3,
        );
      }
    } catch (error: unknown) {
      all.check(`${fit} tree climb: ${String(error)}`, false);
    }

    // 2. Astride the lowest branch.
    try {
      const take: HumanPerformance = perform(
        HumanChain.subject("a")
          .registered("climbTree", { kind: "climb", tree: "tree", branch: 0 })
          .registered("climbTree", { kind: "sit", tree: "tree", branch: 0 }),
      );
      assertTakeClean(`${fit} sit astride`, take);
      const end = take.bones("a", take.duration);
      const branch: ILimb = limbs.find(
        (l: ILimb): boolean => Math.abs(l.from.y - LOWEST) < 0.01,
      )!;
      const across: IAutoMovieVector3 = Vector3.normalize({
        x: -(branch.to.z - branch.from.z),
        y: 0,
        z: branch.to.x - branch.from.x,
      });
      const side = (b: AutoMovieHumanoidBone): number =>
        Vector3.dot(
          Vector3.subtract(end.get(b)!.worldPosition, branch.from),
          across,
        );
      all.check(
        `${fit} astride: the feet hang either side of the branch`,
        side("leftFoot") * side("rightFoot") < 0,
      );
      all.check(
        `${fit} astride: the seat rests on the branch`,
        gap(end.get("hips")!.worldPosition) <= 0.2,
      );
    } catch (error: unknown) {
      all.check(`${fit} sit astride: ${String(error)}`, false);
    }

    // 3. Down by the drop.
    try {
      const take: HumanPerformance = perform(
        climb.registered("climbTree", {
          kind: "descend",
          tree: "tree",
          branch: 1,
        }),
      );
      assertTakeClean(`${fit} climb down and drop`, take);
      const down: IAutoMovieMotionHumanSegment = take
        .segments("a")
        .filter(
          (s: IAutoMovieMotionHumanSegment): boolean =>
            s.law.name === "climbTree",
        )
        .at(-1)!;
      const touch: IAutoMovieMotionEvent = down.plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === "touchdown",
      )!;
      const landed = take.bones(
        "a",
        down.start + touch.share * (down.end - down.start),
      );
      const end = take.bones("a", down.end);
      for (const b of ["leftToes", "rightToes"] as const) {
        const moved: number = Vector3.distance(
          landed.get(b)!.worldPosition,
          end.get(b)!.worldPosition,
        );
        all.check(
          `${fit} drop: the ${b} does not slide after touchdown (${moved.toFixed(3)} m)`,
          moved <= SLIDE,
        );
        all.check(
          `${fit} drop: the ${b} ends on the floor`,
          end.get(b)!.worldPosition.y <= 0.03,
        );
      }
    } catch (error: unknown) {
      all.check(`${fit} climb down and drop: ${String(error)}`, false);
    }

    // 4. The lowest branch out of reach.
    all.check(
      `${fit} a lowest branch beyond reach is refused`,
      motionHumanRefusal(
        () =>
          perform(
            HumanChain.subject("a").registered("climbTree", {
              kind: "climb",
              tree: "tall",
              branch: 0,
            }),
            { x: 6, y: 0, z: DBH / 2 + 0.35 },
          ).bones("a", 0.5),
        { kind: "reach", axis: "branch", act: "climbTree" },
      ),
    );
  }

  // 5. The branchless tree's trunk face, unchanged.
  const bare = createTree({ kind: "whiteOak", dbh: DBH });
  TestValidator.equals(
    "a branchless tree keeps only its trunk face",
    bare.affordances.map((a: IAutoMovieAffordance): string => a.id),
    ["trunk"],
  );
  TestValidator.equals(
    "the trunk face is the same with branches",
    oak.affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === "trunk",
    )!.frame,
    bare.affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === "trunk",
    )!.frame,
  );
  all.assert("tree climb");
}

/** A point's distance from a segment. */
function segmentDistance(
  p: IAutoMovieVector3,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): number {
  const ab: IAutoMovieVector3 = Vector3.subtract(b, a);
  const u: number = Math.max(
    0,
    Math.min(1, Vector3.dot(Vector3.subtract(p, a), ab) / Vector3.dot(ab, ab)),
  );
  return Vector3.distance(p, Vector3.add(a, Vector3.scale(ab, u)));
}
