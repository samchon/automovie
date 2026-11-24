import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSignature,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import { HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { auditStanceMotion } from "../../../internal/auditStanceMotion";
import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";

/** How high a lifted foot is held, metres: well past `HumanSignature.CONTACT`. */
const LIFT: number = 0.1;

/**
 * `HumanSignature.gait` reads the gait over a window: the duty factor, the
 * share of samples each foot bears; the strikes, a foot's landing counted once
 * a stride; the cadence, 60 times the strikes' intervals over their span.
 *
 * Scenario, the average man's quiet stance over 2 s at 120 Hz with each foot
 * lifted 0.1 m in turn: the left over [0.25, 0.75) and [1.25, 1.75) s, the
 * right over [0.75, 1.25) and [1.75, 2] s:
 *
 * 1. The strikes are the left at 0.75 s, the right at 1.25 s and the left at
 *    1.75 s; the right's lift at the end lands no more.
 * 2. Three strikes over 1 s: a cadence of 120 steps a minute.
 * 3. The left foot bears 30 + 60 + 31 samples and the right 90 + 60 of the 241,
 *    a duty factor of 271 / 482.
 *
 * The body is built whole (`humanFixtureBody`): bearing reads the body's sole
 * sockets on the displayed foot bones.
 */
export async function test_unit_motions_audit_human_signature_gait(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const lifted = (side: "left" | "right", t: number): boolean =>
    side === "left"
      ? (t >= 0.25 && t < 0.75) || (t >= 1.25 && t < 1.75)
      : (t >= 0.75 && t < 1.25) || t >= 1.75;
  const stance = auditStanceMotion(body, { duration: 2 });
  const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
    {
      duration: 2,
      bones: (subject: string, t: number) =>
        new Map(
          [...stance.bones(subject, t)].map(
            ([name, bone]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): [
              AutoMovieHumanoidBone,
              IAutoMovieResolvedBone,
            ] => {
            const side: "left" | "right" | null = name.startsWith("left")
              ? "left"
              : name.startsWith("right")
                ? "right"
                : null;
            return [
              name,
              side !== null && /(Foot|Toes)$/.test(name) && lifted(side, t)
                ? {
                    ...bone,
                    worldPosition: {
                      ...bone.worldPosition,
                      y: bone.worldPosition.y + LIFT,
                    },
                  }
                : bone,
            ];
          },
          ),
        ),
    },
    "a",
    body,
    0,
  );
  const gait: IAutoMovieMotionHumanSignature.IGait = HumanSignature.gait(
    reader,
    0,
    2,
  );
  TestValidator.equals("the strikes", gait.strikes, [
    { seconds: 0.75, side: "left" },
    { seconds: 1.25, side: "right" },
    { seconds: 1.75, side: "left" },
  ]);
  TestValidator.predicate(
    "the cadence and the duty",
    nclose(gait.cadence, 120, 1e-9) && nclose(gait.duty, 271 / 482, 1e-12),
  );
}
