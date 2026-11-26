import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGesture,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { FamilyCaseKit } from "@automovie/motions/executable/internal";
import { HumanHand, gesture } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

const ACTOR = "a";

/** The wave's transport rates and the shoulder level of the displayed stop palm. */
export function test_motions_everyday_gesture_geometry(): void {
  const { body }: FamilyCaseKit.IBody = FamilyCaseKit.body("m-average");
  for (const side of ["right", "left"] as const) {
    const wave: HumanPerformance = perform(body, {
      kind: "wave",
      hand: side,
      ...(side === "right"
        ? {}
        : { manner: { variation: 0.5, consistency: 0.5 } }),
    });
    const start: number = FamilyCaseKit.event(wave, "strokeStart");
    const end: number = FamilyCaseKit.event(wave, "strokeEnd");
    const retract: number = FamilyCaseKit.event(wave, "retract");
    TestValidator.predicate(
      `${side} wave retains its stroke`,
      () => Math.abs(end - start - 1.2) < 1e-9,
    );
    for (const joint of ["LowerArm", "Hand"] as const) {
      const bone = `${side}${joint}` as const;
      const step = 1 / 120;
      const at = (t: number) => wave.bones(ACTOR, t).get(bone)!.worldPosition;
      for (const [a, b] of [
        [0, start],
        [retract, wave.duration],
      ] as const) {
        let peak: number = 0;
        for (let t: number = a; t + step <= b + 1e-9; t += step)
          peak = Math.max(peak, Vector3.distance(at(t), at(t + step)) / step);
        TestValidator.predicate(
          `${bone} transport stays within its rate`,
          () => peak <= gesture.WAVE_TRANSPORT_SPEED,
        );
      }
    }
    stopPalm(body, side);
  }
}

function stopPalm(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
): void {
  const take: HumanPerformance = perform(body, {
    kind: "stopPalm",
    hand: side,
  });
  const start: number = FamilyCaseKit.event(take, "strokeStart");
  const end: number = FamilyCaseKit.event(take, "strokeEnd");
  const bones = take.bones(ACTOR, (start + end) / 2);
  const palm = HumanHand.frame(body, bones, side, "palm", "flat");
  const shoulder = bones.get(`${side}UpperArm`)!.worldPosition;
  TestValidator.predicate(
    `${side} palm at the displayed shoulder level`,
    () => Math.abs(palm.point.y - shoulder.y) <= 0.01 && palm.normal.z > 0.98,
  );
}

function perform(
  body: IAutoMovieMotionHumanBody,
  params: IAutoMovieMotionHumanGesture.IParams,
): HumanPerformance {
  return new HumanPerformance({
    seed: "everyday",
    performers: [
      {
        subject: ACTOR,
        body,
        yaw: 0,
        at: { x: 0, y: 0, z: 0 },
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject(ACTOR).gesture(params).node,
  });
}
