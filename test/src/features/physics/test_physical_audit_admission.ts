import type { IAutoMovieAuditPhysicalOutcomes, IAutoMovieMotionAudit, IAutoMoviePhysicsCache } from "@automovie/interface";
import { AutoMovieMotionAudit as Audit, auditPhysicalOutcomes as outcomes } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/** Invalid numeric promises and observations never become a successful audit.
 *
 * Scenarios:
 * 1. A genuine finite floor violation is independently observable.
 * 2. Every acceptance family rejects NaN, infinity, negatives or missing references.
 * 3. Nonfinite consumer poses, velocities and inconsistent clocks refuse.
 * 4. Fall timing and miss-distance validation match action timing admission.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMovieMotionAudit`, `AutoMoviePhysicsCache`, `auditPhysicalOutcomes` on in-memory inputs and asserts the returned observations through 1x TestValidator.predicate, 1x TestValidator.equals; 4 numbered scenarios (first: A genuine finite floor violation is independently observable.; last: Fall timing and miss-distance validation match action timing admission.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (1 assertion site compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 4 numbered scenarios (first: A genuine finite floor violation is independently observable.; last: Fall timing and miss-distance validation match action timing admission.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_audit_admission`, which owns the cases delegated to `PhysicalFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A genuine finite floor violation is independently observable.).
 */
export async function test_physical_audit_admission(): Promise<void> {
  const fixture: () => IAutoMovieMotionAudit.IInput = (): IAutoMovieMotionAudit.IInput => ({
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
    sample: (seconds: number): IAutoMoviePhysicsCache.IFrame => ({
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
      input.floor = NaN;
    },
    (input: IAutoMovieMotionAudit.IInput): void => {
      input.bodies[0]!.floorTolerance = NaN;
    },
    (input: IAutoMovieMotionAudit.IInput): void => {
      input.bodies[0]!.overlapTolerance = -1;
    },
    (input: IAutoMovieMotionAudit.IInput): void => {
      input.bodies[0]!.jointTolerance = Infinity;
    },
    (input: IAutoMovieMotionAudit.IInput): void => {
      input.bodies[0]!.speeds.root = NaN;
    },
    (input: IAutoMovieMotionAudit.IInput): void => {
      input.bodies[0]!.supports[0]!.tolerance = NaN;
    },
    (input: IAutoMovieMotionAudit.IInput): void => {
      input.bodies[0]!.supports[0]!.bone = "absent";
    },
    (input: IAutoMovieMotionAudit.IInput): void => {
      input.bodies[0]!.supports[0]!.point.y = Infinity;
    },
    (input: IAutoMovieMotionAudit.IInput): void => {
      input.bodies[0]!.constraints = [
        {
          label: "inactive-invalid",
          kind: "goal",
          point: { bone: "root" },
          target: (): { x: number; y: number; z: number } => ({
            x: 0,
            y: 0.08,
            z: 0,
          }),
          start: 10,
          end: 10,
          maximum: NaN,
        },
      ];
    },
    (input: IAutoMovieMotionAudit.IInput): void => {
      const sample: IAutoMovieMotionAudit.IInput["sample"] = input.sample;
      input.sample = (seconds: number): IAutoMoviePhysicsCache.IFrame => {
        const frame: IAutoMoviePhysicsCache.IFrame = sample(seconds);
        frame.bodies.solid!.root!.position.y = NaN;
        return frame;
      };
    },
    (input: IAutoMovieMotionAudit.IInput): void => {
      const sample: IAutoMovieMotionAudit.IInput["sample"] = input.sample;
      input.sample = (seconds: number): IAutoMoviePhysicsCache.IFrame => {
        const frame: IAutoMoviePhysicsCache.IFrame = sample(seconds);
        frame.bodies.solid!.root!.rotation.w = Infinity;
        return frame;
      };
    },
    (input: IAutoMovieMotionAudit.IInput): void => {
      const sample: IAutoMovieMotionAudit.IInput["sample"] = input.sample;
      input.sample = (seconds: number): IAutoMoviePhysicsCache.IFrame => {
        const frame: IAutoMoviePhysicsCache.IFrame = sample(seconds);
        frame.bodies.solid!.root!.velocity.x = NaN;
        return frame;
      };
    },
    (input: IAutoMovieMotionAudit.IInput): void => {
      const sample: IAutoMovieMotionAudit.IInput["sample"] = input.sample;
      input.sample = (seconds: number): IAutoMoviePhysicsCache.IFrame => ({
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
  TestValidator.equals("valid observed fall qualifies", outcomes(promise), []);
  for (const tolerance of [NaN, Infinity, -1]) {
    const invalid: IAutoMovieAuditPhysicalOutcomes.IInput = {
      ...promise,
      falls: [{ ...promise.falls[0]!, tolerance }],
      observedFalls: { solid: 1000 },
    };
    assert.throws((): IAutoMovieAuditPhysicalOutcomes.IFinding[] => outcomes(invalid));
  }
  assert.throws((): IAutoMovieAuditPhysicalOutcomes.IFinding[] =>
    outcomes({ ...promise, observedFalls: { solid: NaN } }),
  );
  assert.throws((): IAutoMovieAuditPhysicalOutcomes.IFinding[] =>
    outcomes({
      ...promise,
      actions: [
        {
          id: "required",
          actor: "a",
          target: "b",
          actorShapes: ["surface"],
          targetShapes: ["surface"],
          seconds: 1,
          tolerance: 0.1,
          source: "solver",
          expected: "contact",
        },
      ],
      missDistance: (): number => NaN,
    }),
  );
}
