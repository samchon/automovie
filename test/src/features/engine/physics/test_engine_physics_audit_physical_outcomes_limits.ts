import {
  AutoMovieEngineMotionAudit as Audit,
  AutoMovieEnginePhysicalSimulation,
} from "@automovie/engine";
import type {
  IAutoMovieAuditPhysicalOutcomes,
  IAutoMovieMotionAudit,
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalSegmentState,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../../internal/PhysicalFixtures";

/**
 * Invalid numeric promises and observations never become a successful audit.
 *
 * Scenarios:
 *
 * 1. A genuine finite floor violation is independently observable.
 * 2. Negative tolerances, missing references and an inconsistent clock refuse.
 * 3. Negative fall tolerances and fall times refuse.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes refusal of invalid promises and observations for floor overlap, fall and material-side policies.
 * @evidence contracts/development/testing.md#behavioral-verification Runs a real falling-sphere audit, changes tolerances, clocks and body references, then audits explicit fall and material overlap cases.
 * @evidence contracts/development/testing.md#independent-expectations A finite floor violation must remain visible. Declared soft depth, rigid geometry and undeformed geometry give distinct outcomes, while negative tolerances and noncausal timing are refused.
 */
export async function test_engine_physics_audit_physical_outcomes_limits(): Promise<void> {
  const fixture: () => IAutoMovieMotionAudit.IInput =
    (): IAutoMovieMotionAudit.IInput => ({
      bodies: [
        {
          id: "solid",
          profile: PhysicalFixtures.sphere(),
          speeds: { root: 1 },
          supports: [
            {
              bone: "root",
              start: 0,
              end: 0,
              point: { x: 0, y: 0.08, z: 0 },
              tolerance: 0.001,
            },
          ],
          floorTolerance: 0.001,
          overlapTolerance: 0.001,
          jointTolerance: 0.001,
        },
      ],
      start: 0,
      end: 0,
      rate: 120,
      floor: 0,
      allowed: (): boolean => false,
      sample: (seconds: number): IAutoMoviePhysicalFrame => ({
        seconds,
        bodies: {
          solid: {
            root: {
              position: { x: 0, y: 0.08, z: 0 },
              rotation: { x: 0, y: 0, z: 0, w: 1 },
              velocity: { x: 0, y: 0, z: 0 },
              angularVelocity: { x: 0, y: 0, z: 0 },
            },
          },
        },
      }),
    });
  const baseline: Awaited<ReturnType<typeof Audit.run>> =
    await Audit.run(fixture());
  TestValidator.predicate(
    "finite sphere actually violates the declared floor cap",
    baseline.findings.some(
      (finding: IAutoMovieMotionAudit.IFinding): boolean =>
        finding.kind === "floor" && finding.actual > 0.019,
    ),
  );
  const changes: ((input: IAutoMovieMotionAudit.IInput) => void)[] = [
    (input: IAutoMovieMotionAudit.IInput): void => {
      input.bodies[0]!.overlapTolerance = -1;
    },
    (input: IAutoMovieMotionAudit.IInput): void => {
      input.bodies[0]!.supports[0]!.tolerance = -1;
    },
    (input: IAutoMovieMotionAudit.IInput): void => {
      input.bodies[0]!.supports[0]!.bone = "absent";
    },
    (input: IAutoMovieMotionAudit.IInput): void => {
      const sample: IAutoMovieMotionAudit.IInput["sample"] = input.sample;
      input.sample = (seconds: number): IAutoMoviePhysicalFrame => ({
        ...sample(seconds),
        seconds: seconds + 0.01,
      });
    },
  ];
  for (const change of changes) {
    const invalid: IAutoMovieMotionAudit.IInput = fixture();
    change(invalid);
    await assert.rejects(
      (): ReturnType<typeof Audit.run> => Audit.run(invalid),
    );
  }
  const promise: IAutoMovieAuditPhysicalOutcomes.IInput = {
    actions: [],
    contacts: [],
    falls: [{ id: "fall", body: "solid", seconds: 1, tolerance: 0.1 }],
    observedFalls: { solid: 1 },
    missDistance: (): number => 0,
    allowUnplanned: (): boolean => false,
  };
  TestValidator.equals("valid observed fall qualifies", AutoMovieEnginePhysicalSimulation.auditOutcomes(promise), []);
  assert.throws((): IAutoMovieAuditPhysicalOutcomes.IFinding[] =>
    AutoMovieEnginePhysicalSimulation.auditOutcomes({
      ...promise,
      falls: [{ ...promise.falls[0]!, tolerance: -1 }],
      observedFalls: { solid: 1000 },
    }),
  );
  assert.throws((): IAutoMovieAuditPhysicalOutcomes.IFinding[] =>
    AutoMovieEnginePhysicalSimulation.auditOutcomes({ ...promise, observedFalls: { solid: -1 } }),
  );
  const findings: number[] = [];
  for (const scenario of [
    { compliance: 0.001, y: 0.08, account: false },
    { compliance: 0.001, y: 0.08, account: true },
    { compliance: 0, y: 0.08, account: true },
    { compliance: 0.001, y: 0.06, account: true },
  ]) {
    const profile: P = PhysicalFixtures.sphere(0.1, scenario.compliance);
    const result: Awaited<ReturnType<typeof Audit.run>> = await Audit.run({
      bodies: [
        {
          id: "ball",
          profile,
          speeds: {},
          supports: [],
          floorTolerance: 0.001,
          accountForCompression: scenario.account,
          overlapTolerance: 0,
          jointTolerance: 0.001,
        },
      ],
      start: 0,
      end: 0,
      rate: 120,
      floor: 0,
      allowed: (): boolean => false,
      sample: (): IAutoMoviePhysicalFrame => ({
        seconds: 0,
        bodies: {
          ball: {
            root: {
              position: { x: 0, y: scenario.y, z: 0 },
              rotation: { x: 0, y: 0, z: 0, w: 1 },
              velocity: { x: 0, y: 0, z: 0 },
              angularVelocity: { x: 0, y: 0, z: 0 },
            },
          },
        },
      }),
    });
    findings.push(
      result.findings.filter(
        (finding: IAutoMovieMotionAudit.IFinding): boolean =>
          finding.kind === "floor",
      ).length,
    );
  }
  TestValidator.equals(
    "undeformed, declared soft core, rigid, exceeded soft cap",
    findings,
    [1, 0, 1, 1],
  );
  const pairCases = [
    [0.02, true, true, false, false],
    [0.02, true, true, true, false],
    [0.02, true, true, false, true],
    [0.05, true, true, true, false],
    [0.05, true, true, true, true],
    [0.07, true, true, true, true],
    [0.02, false, true, true, false],
    [0.02, false, true, false, true],
    [0.02, false, false, true, true],
  ] as const;
  const pairFindings: number[] = [];
  for (const [depth, softA, softB, accountA, accountB] of pairCases) {
    const bodies: IAutoMovieMotionAudit.IBody[] = ["a", "b"].map(
      (id: string, index: number): IAutoMovieMotionAudit.IBody => ({
        id,
        profile: PhysicalFixtures.sphere(
          0.1,
          (index === 0 ? softA : softB) ? 0.001 : 0,
        ),
        speeds: {},
        supports: [],
        floorTolerance: 0.001,
        overlapTolerance: 0.001,
        jointTolerance: 0.001,
        accountForCompression: index === 0 ? accountA : accountB,
      }),
    );
    const result: Awaited<ReturnType<typeof Audit.run>> = await Audit.run({
      bodies,
      start: 0,
      end: 0,
      rate: 120,
      floor: -10,
      allowed: (): boolean => false,
      sample: (): IAutoMoviePhysicalFrame => ({
        seconds: 0,
        bodies: Object.fromEntries(
          bodies.map(
            (
              body: IAutoMovieMotionAudit.IBody,
              index: number,
            ): [string, Record<string, IAutoMoviePhysicalSegmentState>] => [
              body.id,
              {
                root: {
                  position: { x: index * (0.2 - depth), y: 1, z: 0 },
                  rotation: { x: 0, y: 0, z: 0, w: 1 },
                  velocity: { x: 0, y: 0, z: 0 },
                  angularVelocity: { x: 0, y: 0, z: 0 },
                },
              },
            ],
          ),
        ),
      }),
    });
    pairFindings.push(
      result.findings.filter(
        (finding: IAutoMovieMotionAudit.IFinding): boolean =>
          finding.kind === "overlap",
      ).length,
    );
  }
  TestValidator.equals(
    "every explicit material-side overlap policy",
    pairFindings,
    pairCases.map(([depth, softA, softB, accountA, accountB]) =>
      Number(
        depth >
          0.001 +
            0.03 * (Number(softA && accountA) + Number(softB && accountB)),
      ),
    ),
  );
}
