import type {
  IAutoMoviePhysicalContactBinding as Binding,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import assert from "node:assert/strict";

import { BoutTargetSource } from "../../../src/physics/BoutTargetSource";
import { boutContactBindings } from "../../../src/physics/boutContactBindings";
import { boutGuardPointBounds } from "../../../src/physics/boutGuardPointBounds";
import { boutLimbClearanceBindings } from "../../../src/physics/boutLimbClearanceBindings";
import { boutPostBindings } from "../../../src/physics/boutPostBindings";
import { boutGuardInspectionTimes } from "../../internal/boutGuardInspectionTimes";
import { inspectBoutPosts } from "../../internal/inspectBoutPosts";

/**
 * Shared fitted posts preserve head protection against complete actual receiver geometry.
 *
 * Scenarios:
 * 1. Either arm declares all own-shape/receiver-shape pairs without a receiver anatomy catalogue.
 * 2. Every screenplay kick contributes preparation, chamber, contact, recoil and replant measurements.
 * 3. Actual receivers at their baseline and displaced five centimetres in either facing direction retain clearance, head-height coverage and forward intent together.
 *
 * This provider/geometry consumer test integrates no dynamics. Independent transformed shape centers supply the head oracle; actual playback owns visual acceptance.
 */
export async function test_physical_bout_post(): Promise<void> {
  const source: BoutTargetSource = new BoutTargetSource();
  await source.prepare();
  const profiles: Record<string, P> = {
    a: source.rigs.a.profile,
    b: source.rigs.b.profile,
  };
  for (const side of ["left", "right"] as const) {
    const bindings: Binding[] = boutPostBindings(
      profiles.a!,
      { body: "b", profile: profiles.b! },
      side,
    );
    const ownShapes: number = profiles
      .a!.segments.filter((segment: P.ISegment): boolean =>
        [`${side}UpperArm`, `${side}LowerArm`, `${side}Hand`].includes(
          segment.bone,
        ),
      )
      .reduce(
        (sum: number, segment: P.ISegment): number =>
          sum + segment.shapes.length,
        0,
      );
    const receiverShapes: number = profiles.b!.segments.reduce(
      (sum: number, segment: P.ISegment): number => sum + segment.shapes.length,
      0,
    );
    assert.equal(
      bindings.length,
      ownShapes * receiverShapes,
      "all declared receiver shapes participate on either side",
    );
    assert.ok(
      bindings.every(
        (binding: Binding): boolean =>
          binding.compression === 0 &&
          binding.chain.every((bone: string): boolean => bone.startsWith(side)),
      ),
    );
    const weapon: Binding[] = boutLimbClearanceBindings(
      profiles.a!,
      { body: "b", profile: profiles.b! },
      `${side}UpperLeg`,
      `weapon:${side}`,
    );
    const parent: Map<string, string> = new Map(
      profiles.a!.joints.map((joint: P.IJoint): [string, string] => [
        joint.child,
        joint.parent,
      ]),
    );
    const weaponShapes: number = profiles
      .a!.segments.filter((segment: P.ISegment): boolean => {
        let bone: string | undefined = segment.bone;
        while (bone && bone !== `${side}UpperLeg`) bone = parent.get(bone);
        return bone === `${side}UpperLeg`;
      })
      .reduce(
        (sum: number, segment: P.ISegment): number =>
          sum + segment.shapes.length,
        0,
      );
    assert.equal(
      weapon.length,
      weaponShapes * receiverShapes,
      "the complete kicking leg includes every receiver pair",
    );
    assert.ok(
      weapon.every((binding: Binding): boolean => binding.compression === 0),
      "whole weapon clearance requests tangent contact without a soft-layer waiver",
    );
  }
  const times: number[] = boutGuardInspectionTimes();
  for (const seconds of times)
    for (const actor of ["a", "b"] as const)
      assert.ok(
        boutContactBindings(source, actor, seconds).length +
          boutGuardPointBounds(source, actor, seconds).length <=
          256,
        "complete declarations retain the shared relationship budget",
      );
  const repeatSeconds: number = times[0]!;
  const first: ReturnType<BoutTargetSource["sample"]> =
    source.sample(repeatSeconds);
  source.sample(times.at(-1)!);
  assert.deepEqual(
    source.sample(repeatSeconds),
    first,
    "same-time preparation is deterministic after a distant seek",
  );
  const result: Awaited<ReturnType<typeof inspectBoutPosts>> =
    await inspectBoutPosts(source, times, [0, -0.05, 0.05]);
  assert.ok(
    times.every((seconds: number): boolean =>
      result.cases.some(
        (entry: (typeof result.cases)[number]): boolean =>
          entry.seconds === seconds,
      ),
    ),
    "every actual kick phase produced a measured forward post",
  );
  assert.ok(result.cases.length > 0, "the actual posting phases were measured");
  assert.deepEqual(result.findings, []);
}
