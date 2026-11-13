import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAudit,
  type IAutoMovieMotionHumanAuditMotion,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionAuditMoved } from "../internal/motionAuditMoved";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanStance } from "../internal/motionHumanStance";

/**
 * The whole audit on a real body: which checks it reads, which readings
 * become findings, and that it resolves each instant's pose once.
 *
 * The body is the average man in his quiet stance for 1 s, both feet
 * declared planted on the ground, carried rigidly by a translation the test
 * writes.
 *
 * Scenarios:
 * 1. Standing still is clean: no finding, no pair, all eight checks read,
 *    described as `clean`.
 * 2. Sunk 20 mm and sliding along x at 60 mm/s, the findings are the floor
 *    (over 5 mm), the slip (60 mm over 5 mm, at 1 s, on the left foot) and
 *    the lift (the sole is under the floor by more than 5 mm), in the
 *    checks' order, each with the default limit it exceeds; the description
 *    names the slip in millimetres.
 * 3. A `null` limit leaves its check unread: no measure, no finding; the
 *    three continuity checks unread together leave none of their measures,
 *    and one of them unread leaves the other two.
 * 4. A limit replaces its default: the 60 mm slip is no finding under a
 *    100 mm limit, and none at a limit equal to the reading, since a finding
 *    is a reading above its limit.
 * 5. Carried at 40 m/s with only the speed read, the finding is the speed,
 *    described in metres per second.
 * 6. One audit asks the motion for each instant once: the 25 grid instants
 *    of 1 s at 24 Hz, however many checks read them.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public report; a check read despite a null limit, a finding at its limit, findings out of order or a pose resolved once per check fails.
 * @evidence contracts/development/testing.md#independent-expectations The slip and the speed are the written translation over the written time; the instant count is the grid's own.
 * @evidence contracts/development/testing.md#distinguishing-cases A clean film, three defects at once, unread checks, replaced limits at and above the reading, and a speed finding.
 * @evidence contracts/development/testing.md#execution-ownership In memory on one prepared body; named `test_human_` because preparing a body takes seconds, so the CI test job leaves it to local runs.
 * @evidence contracts/development/common.md#meaningful-documentation States the film and lists the 6 scenarios with their numbers.
 */
export function test_human_motion_audit_run(): void {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  const body: IHumanBody = motionHumanBody("m-average");
  const stance: Bones = motionHumanStance(body);
  const film = (
    x: number,
    y: number,
    duration: number = 1,
  ): IAutoMovieMotionHumanAuditMotion =>
    motionAuditMoved(
      stance,
      duration,
      (_bone: AutoMovieHumanoidBone, t: number): IAutoMovieVector3 => ({
        x: x * t,
        y,
        z: 0,
      }),
      [
        {
          name: "stand",
          start: 0,
          entryTime: 0,
          end: duration,
          plan: {
            duration,
            contacts: [
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
            ],
          },
        },
      ],
    );
  const checks = (report: AutoMovieMotionHumanAudit.IReport): string[] =>
    report.findings.map(
      (f: AutoMovieMotionHumanAudit.IFinding): string => f.check,
    );
  const read = (report: AutoMovieMotionHumanAudit.IReport): string[] =>
    AutoMovieMotionHumanAudit.CHECKS.filter(
      (check: AutoMovieMotionHumanAudit.Check): boolean =>
        report.measures[check] !== undefined,
    );

  const clean: AutoMovieMotionHumanAudit.IReport =
    AutoMovieMotionHumanAudit.run(film(0, 0), "a", body);
  TestValidator.equals(
    "standing still is clean",
    AutoMovieMotionHumanAudit.describe(clean),
    "clean",
  );
  TestValidator.equals("no pair", clean.pairs, []);
  TestValidator.equals("all eight checks are read", read(clean), [
    ...AutoMovieMotionHumanAudit.CHECKS,
  ]);

  const broken: AutoMovieMotionHumanAudit.IReport =
    AutoMovieMotionHumanAudit.run(film(0.06, -0.02), "a", body);
  TestValidator.equals("the findings in check order", checks(broken), [
    "floor",
    "slip",
    "lift",
  ]);
  const slip: AutoMovieMotionHumanAudit.IFinding = broken.findings[1]!;
  TestValidator.predicate(
    "a finding carries its reading and its limit",
    Math.abs(slip.value - 0.06) <= 1e-9 &&
      Math.abs(slip.seconds - 1) <= 1e-9 &&
      slip.where === "stand leftFoot" &&
      slip.limit === AutoMovieMotionHumanAudit.LIMITS.slip &&
      broken.findings[0]!.limit === AutoMovieMotionHumanAudit.LIMITS.floor,
  );
  TestValidator.predicate(
    "the description names the slip",
    AutoMovieMotionHumanAudit.describe(broken).includes(
      "slip 60.0 mm > 5.0 at 1.000 s (stand leftFoot)",
    ),
  );

  const unread: AutoMovieMotionHumanAudit.IReport =
    AutoMovieMotionHumanAudit.run(film(0.06, -0.02), "a", body, {
      limits: { floor: null, lift: null, tangle: null },
    });
  TestValidator.predicate(
    "a null limit leaves its check unread",
    unread.measures.floor === undefined &&
      unread.measures.lift === undefined &&
      unread.measures.tangle === undefined &&
      unread.measures.slip !== undefined,
  );
  TestValidator.equals("only the read checks find", checks(unread), ["slip"]);
  const still: AutoMovieMotionHumanAudit.IReport =
    AutoMovieMotionHumanAudit.run(film(0, 0), "a", body, {
      limits: { jump: null, reversal: null, speed: null },
    });
  TestValidator.equals("the continuity checks unread together", read(still), [
    "tangle",
    "floor",
    "slip",
    "lift",
    "balance",
  ]);
  const partly: AutoMovieMotionHumanAudit.IReport =
    AutoMovieMotionHumanAudit.run(film(0, 0), "a", body, {
      limits: { reversal: null },
    });
  TestValidator.predicate(
    "one continuity check unread leaves the other two",
    partly.measures.reversal === undefined &&
      partly.measures.jump !== undefined &&
      partly.measures.speed !== undefined,
  );

  const only = (slipLimit: number): AutoMovieMotionHumanAudit.IReport =>
    AutoMovieMotionHumanAudit.run(film(0.06, 0), "a", body, {
      limits: { slip: slipLimit },
    });
  TestValidator.equals("a looser limit", checks(only(0.1)), []);
  TestValidator.equals(
    "a reading at its limit is no finding",
    checks(only(only(0.1).measures.slip!.value)),
    [],
  );
  TestValidator.equals("a tighter limit", checks(only(0.059)), ["slip"]);

  const fast: AutoMovieMotionHumanAudit.IReport = AutoMovieMotionHumanAudit.run(
    film(40, 0, 0.25),
    "a",
    body,
    {
      limits: {
        tangle: null,
        floor: null,
        slip: null,
        lift: null,
        jump: null,
        reversal: null,
        balance: null,
      },
    },
  );
  TestValidator.predicate(
    "a speed finding is described in metres per second",
    checks(fast).length === 1 &&
      /^speed 40\.00 m\/s > 30 at 0\.\d{3} s \(\w+\)$/u.test(
        AutoMovieMotionHumanAudit.describe(fast),
      ),
  );

  const asked: number[] = [];
  const source: IAutoMovieMotionHumanAuditMotion = film(0.06, -0.02);
  AutoMovieMotionHumanAudit.run(
    {
      duration: source.duration,
      segments: source.segments,
      bones: (subject: string, seconds: number): Bones => {
        asked.push(seconds);
        return source.bones(subject, seconds);
      },
    },
    "a",
    body,
  );
  TestValidator.predicate(
    `each instant is resolved once, ${asked.length} asked for ${new Set(asked).size} instants`,
    asked.length === new Set(asked).size && asked.length === 25,
  );
}
