import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalRecoveryState,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalDisturbance } from "../internal/PhysicalDisturbance";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";

/** The records' step rate, per second. */
const RATE: number = 120;

/** The synthetic body's id. */
const ID: string = "body";

/**
 * The disturbance verdicts tell each failure mode from its passing run on
 * synthetic records of the four-support primitive, without a simulation
 * (`PhysicalDisturbance.judge`, `.audit`).
 *
 * Scenarios:
 *
 * 1. Sustained: a capture point coming back inside with no step passes; the same
 *    record with a step fails (a needless step).
 * 2. Recover: one landed step and the capture point inside for the dwell passes; a
 *    body down without a step fails (never stepping); two landed swing phases
 *    fail.
 * 3. Fall: a body moving away at 1 m/s that ends tipped passes; a body at rest on
 *    its supports after the push fails (claiming recovery while falling).
 * 4. Audit: a body at rest whose floor samples carry its weight passes; samples
 *    carrying half of it fail the momentum balance (an unrecorded force holding
 *    it); a sample half a metre off its bone fails provenance; a landed step
 *    whose leg never left the floor fails.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each record and the verdict it must get.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `PhysicalDisturbance.judge` and `.audit` on in-memory records and reads their decisions and failures.
 * @evidence contracts/development/testing.md#independent-expectations The records are built from the fixture's standing pose by hand: a weight of m g carried by the floor balances a body at rest, half of it does not, and the step and tilt facts are written into the records.
 * @evidence contracts/development/testing.md#distinguishing-cases Each failure mode, a needless step, no step, two steps, a false recovery, an unrecorded force, a misattributed contact and a landing without a lift, has its passing neighbour; the simulated runs are the `test_physical_disturbance_*` cases.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation on in-memory records; no simulation, viewer or file host.
 */
export function test_physical_disturbance_verdicts(): void {
  const subject: PhysicalDisturbance.ISubject = PhysicalDisturbance.planted(
    PhysicalModelFixtures.quadrupod(),
  );
  const body = subject.body();
  const limbs = body.balance!.pattern.limbs;
  const weight: number = subject.profile.mass * 9.81;
  const root: string = subject.profile.segments[0]!.bone;
  const standing = PhysicalDisturbance.centerOf(
    subject.profile,
    subject.targets,
  );
  const frame = (
    k: number,
    shift: number,
    drop: number = 0,
    tilt: number = 0,
  ): IAutoMoviePhysicalFrame => ({
    seconds: k / RATE,
    bodies: {
      [ID]: Object.fromEntries(
        subject.profile.segments.map((segment) => {
          const pose = subject.targets[segment.bone]!;
          return [
            segment.bone,
            {
              position: {
                x: pose.position.x,
                y: pose.position.y - drop,
                z: pose.position.z + shift,
              },
              rotation:
                segment.bone === root && tilt !== 0
                  ? Quaternion.multiply(
                      Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, tilt),
                      pose.rotation,
                    )
                  : pose.rotation,
              velocity: { x: 0, y: 0, z: 0 },
              angularVelocity: { x: 0, y: 0, z: 0 },
            },
          ];
        }),
      ),
    },
  });
  const receipts = (
    count: number,
    share: number,
    skip?: (bone: string, k: number) => boolean,
    away?: string,
  ): IAutoMovieContactReceipt[] =>
    limbs.map((limb): IAutoMovieContactReceipt => {
      const pose = subject.targets[limb.bone]!;
      const point = {
        x: pose.position.x + (limb.bone === away ? 0.5 : 0),
        y: 0,
        z: pose.position.z,
      };
      return {
        id: limb.bone,
        source: "solver",
        seconds: 0,
        endSeconds: count / RATE,
        a: { body: "floor", bone: "floor", shape: "floor", material: "floor" },
        b: { body: ID, bone: limb.bone, shape: "0", material: "support" },
        point,
        normal: { x: 0, y: 1, z: 0 },
        impulse: 0,
        separation: 0,
        compression: 0,
        samples: Array.from({ length: count }, (_, i: number) => i + 1)
          .filter((k: number): boolean => !(skip?.(limb.bone, k) ?? false))
          .map((k: number) => ({
            seconds: k / RATE,
            duration: 1 / RATE,
            // The legs still planted at this step share the load.
            impulse:
              (share * weight) /
              RATE /
              limbs.filter(
                (other): boolean => !(skip?.(other.bone, k) ?? false),
              ).length,
            point,
            normal: { x: 0, y: 1, z: 0 },
            separation: 0,
            compression: 0,
          })),
      };
    });
  const cache = (
    frames: IAutoMoviePhysicalFrame[],
    recovery: IAutoMoviePhysicalRecoveryState,
    contacts: IAutoMovieContactReceipt[] = receipts(frames.length - 1, 1),
  ): PhysicalDisturbance.ICache => ({
    frames,
    recovery: { [ID]: recovery },
    contacts,
    supportWrenches: [],
  });
  const quiet: IAutoMoviePhysicalRecoveryState = {
    last: "supported",
    steps: [],
    offsets: {},
  };
  const step = (
    bone: string,
    start: number,
    resolved: number,
  ): IAutoMoviePhysicalRecoveryState["steps"][number] => ({
    bone,
    kind: "swing",
    start,
    end: resolved,
    from: { point: [0, 0], yaw: 0, pitch: 0, clearance: 0 },
    to: { point: [0, 0.1], yaw: 0, pitch: 0, clearance: 0 },
    resolved: { seconds: resolved, status: "landed" },
  });
  const judge = (
    name: PhysicalDisturbance.Outcome,
    record: PhysicalDisturbance.ICache,
  ): PhysicalDisturbance.IVerdict =>
    PhysicalDisturbance.judge(subject, name, record, ID, false);
  const passes = (verdict: PhysicalDisturbance.IVerdict): boolean =>
    verdict.decided && verdict.failures.length === 0;
  const fails = (verdict: PhysicalDisturbance.IVerdict): boolean =>
    verdict.decided && verdict.failures.length !== 0;

  // 1. Sustained: back inside without a step, against a needless step.
  const returning: IAutoMoviePhysicalFrame[] = Array.from(
    { length: 41 },
    (_, k: number) => frame(k, 0.03 * Math.exp(-k / 24)),
  );
  TestValidator.predicate(
    "sustained returns",
    passes(judge("sustained", cache(returning, quiet))),
  );
  TestValidator.predicate(
    "sustained needless step",
    fails(
      judge(
        "sustained",
        cache(returning, { ...quiet, steps: [step(limbs[0]!.bone, 0.2, 0.4)] }),
      ),
    ),
  );

  // 2. Recover: one landing then captured, against no step and two steps.
  const still: IAutoMoviePhysicalFrame[] = Array.from(
    { length: 121 },
    (_, k: number) => frame(k, 0),
  );
  const lifted = (bone: string, k: number): boolean =>
    bone === limbs[0]!.bone && k > 30 && k < 45;
  TestValidator.predicate(
    "recover one step",
    passes(
      judge(
        "recover",
        cache(still, { ...quiet, steps: [step(limbs[0]!.bone, 0.25, 0.4)] }),
      ),
    ),
  );
  TestValidator.predicate(
    "recover never steps",
    fails(
      judge(
        "recover",
        cache(
          Array.from({ length: 61 }, (_, k: number) =>
            frame(k, 0, k > 40 ? standing.y * 0.6 : 0),
          ),
          { ...quiet, last: "unrecoverable" },
        ),
      ),
    ),
  );
  TestValidator.predicate(
    "recover two steps",
    fails(
      judge(
        "recover",
        cache(still, {
          ...quiet,
          steps: [
            step(limbs[0]!.bone, 0.25, 0.4),
            step(limbs[1]!.bone, 0.45, 0.6),
          ],
        }),
      ),
    ),
  );

  // 3. Fall: moving away and tipped, against a body at rest.
  TestValidator.predicate(
    "fall tips",
    passes(
      judge(
        "fall",
        cache(
          Array.from({ length: 61 }, (_, k: number) =>
            frame(k, k / RATE, 0, k === 60 ? 40 : 0),
          ),
          { ...quiet, last: "unrecoverable" },
        ),
      ),
    ),
  );
  TestValidator.predicate(
    "fall claims recovery",
    fails(judge("fall", cache(still.slice(0, 61), quiet))),
  );

  // 4. Audit: the floor carries the weight, against half of it, a sample off
  // its bone and a landing that never lifted.
  const audit = (record: PhysicalDisturbance.ICache): string[] =>
    PhysicalDisturbance.audit(subject, record, ID, body.maximumRootForce);
  const landedOnce: IAutoMoviePhysicalRecoveryState = {
    ...quiet,
    steps: [step(limbs[0]!.bone, 0.25, 0.4)],
  };
  TestValidator.equals(
    "audit at rest",
    audit(cache(still, landedOnce, receipts(120, 1, lifted))),
    [],
  );
  TestValidator.predicate(
    "audit unrecorded force",
    audit(cache(still, quiet, receipts(120, 0.5))).some((failure) =>
      failure.includes("vertical momentum"),
    ),
  );
  TestValidator.predicate(
    "audit provenance",
    audit(
      cache(still, quiet, receipts(120, 1, undefined, limbs[1]!.bone)),
    ).some((failure) => failure.includes("off the floor or off")),
  );
  TestValidator.predicate(
    "audit landing without lift",
    audit(cache(still, landedOnce, receipts(120, 1))).some((failure) =>
      failure.includes("without leaving the floor"),
    ),
  );
}
