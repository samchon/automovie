import {
  type AutoMoviePhysicsCache as Cache,
  Quaternion,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import assert from "node:assert/strict";

import { auditBoutGuard } from "../../../src/physics/auditBoutGuard";
import { observedBoutHeadCenter } from "../../internal/observedBoutHeadCenter";
import { observedBoutHeadFront } from "../../internal/observedBoutHeadFront";

/**
 * The final guard audit observes actual displayed gloves and the offset head collider.
 *
 * Scenarios:
 * 1. Analytic sphere centers put both gloves on the protective head line and pass.
 * 2. A lowered glove fails against the actual head center despite its closeness to the skull-base joint.
 * 3. A glove ahead of the shoulder but behind the protective head-front plane fails; a non-kick interval performs no reads.
 * 4. Offset capsules and boxes with compound actual rotations preserve the same surface meaning against an independent primitive oracle.
 *
 * This portable geometry-only fixture contains no simulation or claimed contact receipt. Native balance and whole-film guard geometry have separate consumers.
 */
export function test_physical_bout_guard_audit(): void {
  /** Valid symmetric witness geometry; no whole-body dynamics are supplied. */
  function segment(bone: string, radius: number): P.ISegment {
    return {
      bone,
      mass: 1,
      neutral: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      },
      centerOfMass: { x: 0, y: bone === "head" ? 0.08 : 0, z: 0 },
      inertia: {
        x: 0.4 * radius ** 2,
        y: 0.4 * radius ** 2,
        z: 0.4 * radius ** 2,
      },
      inertiaRotation: { x: 0, y: 0, z: 0, w: 1 },
      shapes: [
        {
          id: bone,
          kind: "sphere",
          radius,
          material: bone.endsWith("Hand") ? "glove" : "skin",
          transform: {
            position: { x: 0, y: bone === "head" ? 0.08 : 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
          },
        },
      ],
    };
  }
  /** Literal displayed locations, deliberately independent from guard authoring. */
  function pose(x: number, y: number, z: number): Cache.ISegment {
    return {
      position: { x, y, z },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      velocity: { x: 0, y: 0, z: 0 },
      angularVelocity: { x: 0, y: 0, z: 0 },
    };
  }
  const profile: Pick<P, "segments"> = {
    segments: [
      segment("head", 0.08),
      segment("leftHand", 0.1),
      segment("rightHand", 0.1),
      segment("leftUpperArm", 0.03),
      segment("rightUpperArm", 0.03),
    ],
  };
  const actual: Record<string, Cache.ISegment> = {
    head: pose(0, 1.52, 0),
    leftHand: pose(0.4, 1.6, 0.15),
    rightHand: pose(0.4, 1.6, -0.15),
    leftUpperArm: pose(0, 1.3, 0.15),
    rightUpperArm: pose(0, 1.3, -0.15),
  };
  let reads: number = 0;
  const input: Parameters<typeof auditBoutGuard>[0] = {
    profiles: { a: profile, b: profile },
    at: (seconds: number): Cache.IFrame => {
      reads++;
      return { seconds, bodies: { a: actual, b: actual } };
    },
    start: 6.5,
    end: 6.5,
    rate: 120,
    facing: (): { x: number; y: number; z: number } => ({ x: 1, y: 0, z: 0 }),
  };
  assert.deepEqual(auditBoutGuard(input), { samples: 1, findings: [] });
  actual.leftHand!.position.y = 1.46;
  const lowered: ReturnType<typeof auditBoutGuard> = auditBoutGuard(input);
  assert.equal(lowered.findings[0]!.label, "left-guard-head-height");
  assert.ok(
    Math.abs(lowered.findings[0]!.actual - 0.14) < 1e-10,
    "head collision center differs from its skull-base joint",
  );
  actual.leftHand!.position.y = 1.6;
  actual.rightHand!.position.x = 0.05;
  const collapsed: ReturnType<typeof auditBoutGuard> = auditBoutGuard(input);
  assert.equal(collapsed.findings[0]!.label, "right-guard-forward");
  assert.ok(
    Math.abs(collapsed.findings[0]!.limit - 0.1) < 1e-10 &&
      Math.abs(collapsed.findings[0]!.actual + 0.03) < 1e-10,
    "glove radius is measured beyond the actual head-front surface",
  );
  const head: P.ISegment = profile.segments.find(
    (value: P.ISegment): boolean => value.bone === "head",
  )!;
  const variants: P.IShape[] = [
    {
      id: "offset-capsule",
      kind: "capsule",
      radius: 0.08,
      halfLength: 0.12,
      material: "skin",
      transform: {
        position: { x: 0.03, y: 0.08, z: -0.02 },
        rotation: Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 35),
      },
    },
    {
      id: "offset-box",
      kind: "box",
      halfExtents: { x: 0.12, y: 0.04, z: 0.07 },
      material: "skin",
      transform: {
        position: { x: -0.02, y: 0.08, z: 0.03 },
        rotation: Quaternion.multiply(
          Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 30),
          Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 20),
        ),
      },
    },
  ];
  for (const shape of variants) {
    head.shapes = [shape];
    actual.head!.rotation = Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 25);
    const center: ReturnType<typeof observedBoutHeadCenter> =
      observedBoutHeadCenter(profile, actual.head!);
    const front: number = observedBoutHeadFront(profile, actual.head!, {
      x: 1,
      y: 0,
      z: 0,
    });
    for (const side of ["left", "right"] as const) {
      actual[`${side}Hand`]!.position.x = front + 0.1 + 0.02;
      actual[`${side}Hand`]!.position.y = center[1];
    }
    assert.deepEqual(
      auditBoutGuard(input).findings,
      [],
      `rotated ${shape.kind} retains real front coverage`,
    );
    actual.rightHand!.position.x -= 0.03;
    const failed: ReturnType<typeof auditBoutGuard> = auditBoutGuard(input);
    const forward: (typeof failed.findings)[number] | undefined =
      failed.findings.find(
        (finding: (typeof failed.findings)[number]): boolean =>
          finding.label === "right-guard-forward",
      );
    assert.ok(
      forward && Math.abs(forward.limit - forward.actual - 0.01) < 1e-10,
      `rotated ${shape.kind} exposes the real one-centimetre deficit`,
    );
  }
  reads = 0;
  assert.deepEqual(auditBoutGuard({ ...input, start: 10, end: 10 }), {
    samples: 0,
    findings: [],
  });
  assert.equal(reads, 0, "non-kick intervals require no guard sampling");
}
