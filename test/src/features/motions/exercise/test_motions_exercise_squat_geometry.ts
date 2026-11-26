import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanExercise,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import {
  FamilyCaseKit,
  everydayVerdicts,
} from "@automovie/motions/executable/internal";
import {
  AutoMovieMotionHumanTrunk,
  HumanFoot,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

const ACTOR = "a";
const THIGH = { quarter: 60, half: 45, parallel: 0 } as const;

/** Squat depth, sole support and pace on the displayed exercise. */
export function test_motions_exercise_squat_geometry(): void {
  const { body }: FamilyCaseKit.IBody = FamilyCaseKit.body("m-average");
  for (const depth of ["quarter", "half", "parallel"] as const) {
    const take: HumanPerformance = squat(body, { depth });
    const bottom: number = FamilyCaseKit.event(take, "bottom1");
    const bones = take.bones(ACTOR, bottom);
    for (const side of ["left", "right"] as const) {
      const thigh = Vector3.subtract(
        bones.get(`${side}UpperLeg`)!.worldPosition,
        bones.get(`${side}LowerLeg`)!.worldPosition,
      );
      const angle: number =
        (Math.atan2(thigh.y, Math.hypot(thigh.x, thigh.z)) * 180) / Math.PI;
      TestValidator.predicate(
        `${side} ${depth} thigh`,
        () => Math.abs(angle - THIGH[depth]) <= 5,
      );
    }
    soles(body, take, depth);
  }

  const slow: HumanPerformance = squat(body, {
    manner: { pace: 0.75, intensity: 0.65 },
  });
  const brisk: HumanPerformance = squat(body, {
    manner: { pace: 1.25, intensity: 0.65 },
  });
  const hips = (take: HumanPerformance, share: number) =>
    take.bones(ACTOR, take.duration * share).get("hips")!.worldPosition;
  for (const share of [0, 0.25, 0.5, 0.8, 1])
    TestValidator.predicate(
      `cadences preserve the pose at phase ${share}`,
      () => Vector3.distance(hips(slow, share), hips(brisk, share)) <= 1e-9,
    );
  soles(body, brisk, "brisk reduced-depth squat");

  const standing = slow.posture(ACTOR, 0);
  const shape = { body, standing, depth: 0.12, pitch: 15 };
  const omitted = AutoMovieMotionHumanTrunk.prepareCrouch(shape);
  const zero = AutoMovieMotionHumanTrunk.prepareCrouch({ ...shape, back: 0 });
  for (const share of [0, 0.37, 1])
    TestValidator.equals(
      `omitted backward travel at ${share}`,
      omitted(standing, share),
      zero(standing, share),
    );
}

function soles(
  body: IAutoMovieMotionHumanBody,
  take: HumanPerformance,
  label: string,
): void {
  let heelGap: number = 0;
  let floorGap: number = 0;
  for (let frame: number = 0; frame <= Math.ceil(take.duration * 32); frame++) {
    const bones = take.bones(ACTOR, Math.min(frame / 32, take.duration));
    for (const side of ["left", "right"] as const) {
      const sockets = HumanFoot.sockets(body, bones, side);
      const low: number = Math.min(...sockets.map(({ point }) => point.y));
      heelGap = Math.max(heelGap, sockets[0]!.point.y - low);
      floorGap = Math.max(floorGap, Math.abs(low));
    }
  }
  TestValidator.predicate(
    `${label} soles keep heel and forefoot support`,
    () => heelGap <= HumanFoot.BEARING && floorGap <= 0.005,
  );
  TestValidator.predicate(
    `${label} stays inside joint ranges`,
    () => everydayVerdicts.overshoot(take, ACTOR) <= 1e-6,
  );
}

function squat(
  body: IAutoMovieMotionHumanBody,
  params: Omit<IAutoMovieMotionHumanExercise.IParams, "kind">,
): HumanPerformance {
  return new HumanPerformance({
    seed: "exercise",
    performers: [
      {
        subject: ACTOR,
        body,
        yaw: 0,
        at: { x: 0, y: 0, z: 0 },
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject(ACTOR).exercise({
      kind: "squat",
      count: 1,
      ...params,
    }).node,
  });
}
