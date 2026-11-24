import {
  AutoMovieGravity,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditBalance,
  HumanFoot,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionAuditMoved } from "../../../../features/internal/motionAuditMoved";
import { motionBalancePhaseReaders } from "../../../../features/internal/motionBalancePhaseReaders";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { motionHumanStance } from "../../../../features/internal/motionHumanStance";
import { nclose } from "../../../../features/internal/nclose";

/**
 * The balance audit measures the extrapolated centre beyond the planted toes.
 *
 * Scenarios:
 * 1. Carry the same stance forward once with support and once without either contact.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The balance audit measures the extrapolated centre beyond the planted toes.
 * @evidence contracts/development/testing.md#independent-expectations Hof’s dimensionless pendulum gives a forward lead of v sqrt(1.34 hip height / g). The world sole points define the support boundary.
 * @evidence contracts/development/testing.md#distinguishing-cases The identical moving body has no stance margin when its feet are unloaded.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_balance_observation(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const stance = motionHumanStance(body);
  const motion = (loaded: boolean): IAutoMovieMotionHumanAuditMotion =>
    motionAuditMoved(
      stance,
      1,
      (_bone, t: number): IAutoMovieVector3 => ({ x: 0, y: 0, z: t }),
      [
        {
          name: "stand",
          start: 0,
          entryTime: 0,
          end: 1,
          physical: true,
          plan: {
            duration: 1,
            contacts: loaded
              ? [
                  {
                    part: "leftFoot",
                    kind: "plant",
                    from: 0,
                    to: 1,
                    support: { kind: "ground" },
                  },
                  {
                    part: "rightFoot",
                    kind: "plant",
                    from: 0,
                    to: 1,
                    support: { kind: "ground" },
                  },
                ]
              : [],
          },
        },
      ],
    );
  const centre = resolveAutoMovieCenterOfMass.place(body.massModel, stance);
  const toe: number = Math.max(
    ...HumanFoot.base(body, stance).map((p: IAutoMovieVector3): number => p.z),
  );
  const expected: number =
    centre.z +
    Math.sqrt((1.34 * body.measure.hipHeight) / AutoMovieGravity.STANDARD) -
    toe;
  TestValidator.predicate(
    "outside the front of the sole hull",
    nclose(
      AutoMovieMotionHumanAuditBalance.measure(motion(true), "a", body).value,
      expected,
    ),
  );
  TestValidator.predicate(
    "no unloaded support verdict",
    AutoMovieMotionHumanAuditBalance.measure(motion(false), "a", body).value ===
      0,
  );
  motionBalancePhaseReaders();
}
