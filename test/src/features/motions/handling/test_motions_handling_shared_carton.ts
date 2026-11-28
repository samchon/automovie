import {
  AutoMovieArchetypeBox,
  AutoMovieArchetypeTable,
} from "@automovie/archetypes";
import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanSharedCarry,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanObject,
  AutoMovieMotionHumanPerformance,
  AutoMovieMotionHumanRefusal,
  AutoMovieMotionHumanSharedCarry,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { FamilyCaseKit } from "../../../../../packages/motions/src/executable/cases/FamilyCaseKit";
import { HumanPropFrame } from "../../../../../packages/motions/src/perform/internal/HumanPropFrame";
import { HumanFoot } from "../../../../../packages/motions/src/posture/internal/HumanFoot";
import { HumanHand } from "../../../../../packages/motions/src/posture/internal/HumanHand";

const BENCH_HEIGHT = 0.9;
const SEED = "joint-approach-by-role";

/**
 * Two actors carry one real carton across a workbench, open one hand after it
 * settles, and continue with an ordinary pickup, socket mount or launch of that
 * carton.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the late grip, grounded rigid turn, finite bench, one-sided release, and the subsequent ordinary grip, mount and launch.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the stock shared-carry API, real capsule rails, two timed roles and the finite workbench. Reads prepared cue instants and actual displayed hands and carton, then runs an ordinary pickup, receiver mount and launch with that same prop.
 * @evidence contracts/development/testing.md#independent-expectations The authored second wait differs by 0.78 seconds, and the settled frame is 24 mm forward and turned 1.5 degrees. The four bottom corners lie on the 0.9 m horizontal workbench. The 400 ms release separation and subsequent lift, receiver frame, and flight expose which custody rule supplies the displayed prop.
 */
export function test_motions_handling_shared_carton(): void {
  const { body } = FamilyCaseKit.body("m-average");
  const actor = (
    subject: string,
    x: number,
  ): IAutoMovieMotionHumanPerformer => ({
    subject,
    body,
    at: { x, y: 0, z: 0 },
    yaw: 0,
    proficiency: { level: "trained" },
  });
  const first = actor("first", -0.57);
  const second = actor("second", 0.57);
  const carton = AutoMovieMotionHumanObject.prop(
    "carton",
    AutoMovieArchetypeBox.create({
      width: 0.43,
      height: 0.33,
      depth: 0.36,
      sideHandles: true,
    }),
    { at: { x: 0, y: BENCH_HEIGHT, z: 0.37 }, yaw: 0 },
  );
  const bench = AutoMovieMotionHumanObject.prop(
    "bench",
    AutoMovieArchetypeTable.create({ kind: "workbench", height: BENCH_HEIGHT }),
    { at: { x: 0, y: 0, z: 0.37 }, yaw: 0, fixed: true },
  );
  const support = { prop: bench, point: "top" };
  const rest: IAutoMovieRigidTransform = {
    position: { x: 0, y: BENCH_HEIGHT, z: 0.394 },
    rotation: AutoMovieEngineQuaternion.fromAxisAngle(
      { x: 0, y: 1, z: 0 },
      1.5,
    ),
  };
  const input: IAutoMovieMotionHumanSharedCarry.IStage = {
    id: "checkout",
    seed: SEED,
    prop: carton,
    start: support,
    end: support,
    course: { duration: 0.8, rise: 0.034, to: rest },
    carriers: [
      {
        performer: first,
        hand: "left",
        handle: "right",
        wait: 0.4,
        releaseAfter: 0.08,
      },
      {
        performer: second,
        hand: "right",
        handle: "left",
        wait: 1.18,
        releaseAfter: 0.48,
      },
    ],
  };
  const staged = AutoMovieMotionHumanSharedCarry.stage(input);
  const pickup = staged.chains[1]
    .stand({ hold: 0.25 })
    .pickUp(
      { prop: "carton", handle: "left", hand: "right", lift: 0.06 },
      "takeAgain",
    );
  const rehearse = (
    episodes: readonly IAutoMovieMotionHumanSharedCarry.IPreparedEpisode[],
    continuation = pickup.stand({ hold: 0.2 }),
  ): AutoMovieMotionHumanPerformance =>
    new AutoMovieMotionHumanPerformance({
      seed: SEED,
      performers: [first, second],
      props: [carton, bench],
      laws: [staged.law],
      sharedCarry: episodes,
      composition: staged.chains[0].with(continuation).node,
    });
  const film = rehearse([staged.episode]);
  refuses(() => rehearse([staged.episode, staged.episode]));
  const firstGrip = film.instant({ of: "checkout/first", event: "gripClosed" });
  const secondGrip = film.instant({
    of: "checkout/second",
    event: "gripClosed",
  });
  const settled = film.instant({ of: "checkout/first", event: "settled" });
  const firstOpen = film.instant({ of: "checkout/first", event: "release" });
  const finalOpen = film.instant({ of: "checkout/second", event: "release" });
  const visible = (time: number) => film.prop("carton", time);
  const distance = AutoMovieEngineVector3.distance;
  TestValidator.predicate(
    "a late role takes its material grip before lift",
    secondGrip - firstGrip > 0.7 &&
      film.instant({ of: "checkout/first", event: "lift" }) === secondGrip &&
      distance(visible(firstGrip).position, visible(secondGrip).position) <
        1e-7,
  );
  for (const time of [secondGrip, (secondGrip + settled) / 2, settled]) {
    for (const [performer, hand, x] of [
      [first, "left", -0.28],
      [second, "right", 0.28],
    ] as const) {
      const bones = film.bones(performer.subject, time);
      for (const pad of ["indexPad", "middlePad"] as const)
        TestValidator.predicate(
          performer.subject + " keeps " + pad + " on its own rail",
          Math.abs(
            railGap(
              visible(time),
              x,
              HumanHand.frame(body, bones, hand, pad).point,
            ),
          ) < 0.004,
        );
      for (const side of ["left", "right"] as const) {
        const foot = bones.get(side === "left" ? "leftFoot" : "rightFoot")!;
        const sole = HumanFoot.sole(body, side, {
          ankle: foot.worldPosition,
          rotation: foot.worldRotation,
        });
        TestValidator.predicate(
          performer.subject + " remains grounded",
          Math.abs(Math.min(...sole.map(({ y }) => y))) < 0.004,
        );
      }
    }
  }
  const target = visible(settled);
  const middle = visible((secondGrip + settled) / 2);
  TestValidator.predicate(
    "one elevated carton turns to its marked receiving frame",
    middle.position.y > BENCH_HEIGHT + 0.025 &&
      distance(target.position, rest.position) < 1e-7 &&
      Math.abs(
        AutoMovieEngineQuaternion.angle(
          target.rotation,
          carton.frame.rotation,
        ) -
          Math.PI / 120,
      ) < 1e-7,
  );
  const lip = film.site("bench", "top", settled).position;
  for (const x of [-0.215, 0.215])
    for (const z of [-0.18, 0.18]) {
      const corner = AutoMovieEngineVector3.add(
        target.position,
        AutoMovieEngineQuaternion.rotateVector(target.rotation, { x, y: 0, z }),
      );
      TestValidator.predicate(
        "each bottom corner lies within the workbench",
        Math.abs(corner.y - lip.y) < 1e-7 &&
          Math.abs(corner.x - lip.x) <= 0.6 &&
          Math.abs(corner.z - lip.z) <= 0.3175,
      );
    }
  const between = finalOpen - 0.08;
  TestValidator.predicate(
    "one actor leaves the carton still on the bench with the other hand holding",
    firstOpen > settled &&
      finalOpen - firstOpen > 0.39 &&
      Math.abs(padAt(film, first, "left", between, -0.28)) > 0.15 &&
      Math.abs(padAt(film, second, "right", between, 0.28)) < 0.004 &&
      distance(visible(between).position, rest.position) < 1e-7,
  );
  const takeAgain = film.instant({ of: "takeAgain", event: "gripClosed" });
  const lifted = film.instant({ of: "takeAgain", event: "lifted" });
  TestValidator.predicate(
    "the following ordinary grip takes the actual settled carton",
    takeAgain > finalOpen &&
      distance(
        visible(takeAgain - 0.00005).position,
        visible(takeAgain + 0.00005).position,
      ) < 0.01 &&
      visible(lifted).position.y - BENCH_HEIGHT > 0.03,
  );
  const remounted = rehearse(
    [staged.episode],
    pickup.putDown(
      {
        prop: "carton",
        hand: "right",
        onto: { prop: "bench", point: "stack" },
      },
      "mountAgain",
    ),
  );
  const placed = remounted.instant({ of: "mountAgain", event: "placed" });
  const unheld = remounted.instant({ of: "mountAgain", event: "release" });
  const receiver = remounted.site("bench", "stack", placed);
  const mounted = remounted.prop("carton", unheld + 0.00005);
  TestValidator.predicate(
    "a later ordinary mount owns the returned carton",
    () =>
      placed > finalOpen &&
      distance(mounted.position, receiver.position) < 0.001 &&
      distance(mounted.position, rest.position) > 0.02 &&
      remounted
        .segments(second.subject)
        .at(-1)!
        .plan.mounts?.some(
          (mount) =>
            mount.prop === "carton" &&
            mount.onto === "bench" &&
            mount.point === "stack",
        ) === true,
  );

  const launched = rehearse(
    [staged.episode],
    pickup.throwObject(
      {
        prop: "carton",
        hand: "right",
        style: "underarm",
        target: {
          kind: "point",
          frame: "world",
          at: { x: 0.57, y: 0.75, z: 2 },
        },
      },
      "throwAgain",
    ),
  );
  const thrown = launched.instant({ of: "throwAgain", event: "release" });
  TestValidator.predicate(
    "a later ordinary launch owns the returned carton",
    thrown > finalOpen &&
      launched.flights("carton").length === 1 &&
      distance(
        launched.prop("carton", thrown).position,
        launched.prop("carton", thrown + 0.08).position,
      ) > 0.05,
  );

  refuses(() =>
    AutoMovieMotionHumanSharedCarry.stage({
      ...input,
      carriers: [
        input.carriers[0],
        { ...input.carriers[1], performer: actor("second", 2.2) },
      ],
    }),
  );
  refuses(() =>
    AutoMovieMotionHumanSharedCarry.stage({
      ...input,
      carriers: [input.carriers[0], { ...input.carriers[1], handle: "right" }],
    }),
  );
  refuses(() =>
    AutoMovieMotionHumanSharedCarry.stage({
      ...input,
      course: {
        ...input.course,
        to: { ...rest, position: { ...rest.position, z: 1.0 } },
      },
    }),
  );
}

function railGap(
  frame: IAutoMovieRigidTransform,
  x: number,
  point: IAutoMovieVector3,
): number {
  const local = HumanPropFrame.relative(frame, {
    position: point,
    rotation: AutoMovieEngineQuaternion.identity(),
  }).position;
  return (
    Math.hypot(
      local.x - x,
      local.y - 0.165,
      Math.max(0, Math.abs(local.z) - 0.11),
    ) - 0.018
  );
}

function padAt(
  film: AutoMovieMotionHumanPerformance,
  performer: IAutoMovieMotionHumanPerformer,
  side: AutoMovieHumanSide,
  time: number,
  x: number,
): number {
  const pad = HumanHand.frame(
    performer.body,
    film.bones(performer.subject, time),
    side,
    "indexPad",
  ).point;
  return railGap(film.prop("carton", time), x, pad);
}

function refuses(run: () => unknown): void {
  let error: unknown;
  try {
    run();
  } catch (caught: unknown) {
    error = caught;
  }
  TestValidator.predicate(
    "inadmissible material or role is refused",
    error instanceof AutoMovieMotionHumanRefusal,
  );
}
