import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { AutoMovieMotionAudit as Audit } from "../../../../packages/engine/src/physics/AutoMovieMotionAudit";
import type { AutoMoviePhysicsCache as Cache } from "../../../../packages/engine/src/physics/AutoMoviePhysicsCache";
import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/** Floor audit distinguishes a compressed outer surface from its rigid core.
 *
 * Scenarios:
 * 1. Default audits retain their strict undeformed-surface measurement.
 * 2. Explicit compression accounting admits only the material's stated cap.
 * 3. Rigid materials and penetration beyond the cap still fail independently.
 * 4. Inter-body allowance sums only each explicitly opted-in compliant side.
 */
export async function test_physical_compression_audit(): Promise<void> {
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
      sample: (): Cache.IFrame => ({
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
        (finding: Audit.IFinding): boolean => finding.kind === "floor",
      ).length,
    );
  }
  TestValidator.equals(
    "undeformed, declared soft core, rigid, exceeded soft cap",
    findings,
    [1, 0, 1, 1],
  );
  const pairCases: {
    depth: number;
    softA: boolean;
    softB: boolean;
    accountA: boolean;
    accountB: boolean;
    expected: number;
  }[] = [
    {
      depth: 0.02,
      softA: true,
      softB: true,
      accountA: false,
      accountB: false,
      expected: 1,
    },
    {
      depth: 0.02,
      softA: true,
      softB: true,
      accountA: true,
      accountB: false,
      expected: 0,
    },
    {
      depth: 0.02,
      softA: true,
      softB: true,
      accountA: false,
      accountB: true,
      expected: 0,
    },
    {
      depth: 0.05,
      softA: true,
      softB: true,
      accountA: true,
      accountB: false,
      expected: 1,
    },
    {
      depth: 0.05,
      softA: true,
      softB: true,
      accountA: true,
      accountB: true,
      expected: 0,
    },
    {
      depth: 0.07,
      softA: true,
      softB: true,
      accountA: true,
      accountB: true,
      expected: 1,
    },
    {
      depth: 0.02,
      softA: false,
      softB: true,
      accountA: true,
      accountB: false,
      expected: 1,
    },
    {
      depth: 0.02,
      softA: false,
      softB: true,
      accountA: false,
      accountB: true,
      expected: 0,
    },
    {
      depth: 0.02,
      softA: false,
      softB: false,
      accountA: true,
      accountB: true,
      expected: 1,
    },
  ];
  const pairFindings: number[] = [];
  for (const row of pairCases) {
    const bodies: Audit.IBody[] = ["a", "b"].map(
      (id: string, index: number): Audit.IBody => ({
        id,
        profile: PhysicalFixtures.sphere(
          0.1,
          (index === 0 ? row.softA : row.softB) ? 0.001 : 0,
        ),
        speeds: {},
        supports: [],
        floorTolerance: 0.001,
        overlapTolerance: 0.001,
        jointTolerance: 0.001,
        accountForCompression: index === 0 ? row.accountA : row.accountB,
      }),
    );
    const result: Awaited<ReturnType<typeof Audit.run>> = await Audit.run({
      bodies,
      start: 0,
      end: 0,
      rate: 120,
      floor: -10,
      allowed: (): boolean => false,
      sample: (): Cache.IFrame => ({
        seconds: 0,
        bodies: Object.fromEntries(
          bodies.map(
            (
              body: Audit.IBody,
              index: number,
            ): [string, Record<string, Cache.ISegment>] => [
              body.id,
              {
                root: {
                  position: { x: index * (0.2 - row.depth), y: 1, z: 0 },
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
        (finding: Audit.IFinding): boolean => finding.kind === "overlap",
      ).length,
    );
  }
  TestValidator.equals(
    "every explicit material-side overlap policy",
    pairFindings,
    pairCases.map((row: (typeof pairCases)[number]): number => row.expected),
  );
}
