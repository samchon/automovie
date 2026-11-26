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
  const findings: string[] = [];
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
    if (!(Math.abs(end - start - 1.2) < 1e-9))
      findings.push(
        `${side} wave stroke is ${end - start} s at [${start}, ${end}], expected 1.2 s`,
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
        if (!(peak <= gesture.WAVE_TRANSPORT_SPEED))
          findings.push(
            `${bone} transport at [${a}, ${b}] peaks at ${peak} m/s, above ${gesture.WAVE_TRANSPORT_SPEED} m/s`,
          );
      }
    }
    const palm = stopPalm(body, side);
    if (!(Math.abs(palm.height) <= 0.01 && palm.forward > 0.98))
      findings.push(
        `${side} stop palm is ${palm.height} m from shoulder height and its forward normal is ${palm.forward}`,
      );
  }
  TestValidator.equals("gesture timing and display geometry", findings, []);
}

function stopPalm(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
): { height: number; forward: number } {
  const take: HumanPerformance = perform(body, {
    kind: "stopPalm",
    hand: side,
  });
  const start: number = FamilyCaseKit.event(take, "strokeStart");
  const end: number = FamilyCaseKit.event(take, "strokeEnd");
  const bones = take.bones(ACTOR, (start + end) / 2);
  const palm = HumanHand.frame(body, bones, side, "palm", "flat");
  const shoulder = bones.get(`${side}UpperArm`)!.worldPosition;
  return { height: palm.point.y - shoulder.y, forward: palm.normal.z };
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
