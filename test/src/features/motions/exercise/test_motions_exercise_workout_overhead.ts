import { Vector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanChain, AutoMovieMotionHumanPerformance } from "@automovie/motions";
import { FamilyCaseKit } from "@automovie/motions/executable/internal";
import {
  HumanColliders,
  HumanFrame,
  workout,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

const ACTOR = "a";
const ORIGIN: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
const ARMS: ReadonlySet<AutoMovieHumanoidBone> = new Set([
  "leftLowerArm",
  "leftHand",
  "rightLowerArm",
  "rightHand",
]);
const HEAD: ReadonlySet<AutoMovieHumanoidBone> = new Set(["head", "neck"]);

/** An unloaded two-arm lift keeps each grip outboard through the turnover. */
export function test_motions_exercise_workout_overhead(): void {
  for (const [id, yaw] of [
    ["m-average", 0],
    ["f-small", 28],
    ["m-large", -35],
  ] as const) {
    const { body }: FamilyCaseKit.IBody = FamilyCaseKit.body(id);
    for (const kind of ["snatch", "cleanAndJerk"] as const) {
      const take = new AutoMovieMotionHumanPerformance({
        seed: "unloaded-overhead",
        performers: [
          {
            subject: ACTOR,
            body,
            yaw,
            at: { x: 0.4, y: 0, z: -0.2 },
            proficiency: { level: "trained" },
          },
        ],
        composition: AutoMovieMotionHumanChain.subject(ACTOR).registered("workout", {
          kind,
          count: 1,
        }).node,
        laws: [workout],
      });
      verify(take, id, body, yaw, kind);
    }
  }
}

function verify(
  take: AutoMovieMotionHumanPerformance,
  id: string,
  body: IAutoMovieMotionHumanBody,
  yaw: number,
  kind: "snatch" | "cleanAndJerk",
): void {
  const snatch: boolean = kind === "snatch";
  const at = (event: string): number => FamilyCaseKit.event(take, event);
  const first: number = at(snatch ? "pull1" : "drive1");
  const last: number = at(snatch ? "overhead1" : "jerkOverhead1");
  const left: IAutoMovieVector3 = HumanFrame.point(
    { origin: ORIGIN, yaw },
    { x: 1, y: 0, z: 0 },
  );
  const armShapes = HumanColliders.preparePlaced(body, ARMS);
  const headShapes = HumanColliders.preparePlaced(body, HEAD);
  const shoulder = take.bones(ACTOR, last);
  const shoulderWidth: number = Vector3.dot(
    Vector3.subtract(
      shoulder.get("leftUpperArm")!.worldPosition,
      shoulder.get("rightUpperArm")!.worldPosition,
    ),
    left,
  );

  const count: number = Math.ceil((last - first) * 120);
  const step: number = (last - first) / count;
  let previous: IAutoMovieVector3 | undefined;
  let minimum: number = Infinity;
  let maximum: number = -Infinity;
  let speed: number = 0;
  let clearance: number = Infinity;
  for (let i: number = 0; i <= count; ++i) {
    const bones = take.bones(ACTOR, first + i * step);
    const wrist = bones.get("leftHand")!.worldPosition;
    const width: number = Vector3.dot(
      Vector3.subtract(wrist, bones.get("rightHand")!.worldPosition),
      left,
    );
    minimum = Math.min(minimum, width);
    maximum = Math.max(maximum, width);
    if (previous !== undefined)
      speed = Math.max(speed, Vector3.distance(previous, wrist) / step);
    previous = wrist;
    if (i % 4 === 0)
      for (const hand of armShapes(bones))
        for (const head of headShapes(bones))
          for (const a of hand.shapes)
            for (const b of head.shapes)
              clearance = Math.min(
                clearance,
                AutoMovieEnginePhysics.physicalShapePairDistance(hand.pose, a, head.pose, b),
              );
  }
  TestValidator.predicate(
    `${id} ${kind} uncrossed turnover and clear head`,
    () =>
      minimum >= shoulderWidth * (snatch ? 1.8 : 0.6) &&
      clearance > 0 &&
      speed < 6,
  );
  if (snatch)
    TestValidator.predicate(
      `${id} snatch retains its wide grip`,
      () => maximum - minimum <= 0.04,
    );
  else
    TestValidator.predicate(
      `${id} jerk uses a slightly outboard grip overhead`,
      () => {
        const width: number = Vector3.dot(
          Vector3.subtract(
            shoulder.get("leftHand")!.worldPosition,
            shoulder.get("rightHand")!.worldPosition,
          ),
          left,
        );
        return width >= 1.15 * shoulderWidth && width <= 1.6 * shoulderWidth;
      },
    );
}
