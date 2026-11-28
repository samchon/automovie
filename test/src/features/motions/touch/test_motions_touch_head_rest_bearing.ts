import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMoviePhysicalShape,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanMaterialContact
} from "../../../../../packages/motions/src/posture/internal/HumanMaterialContact";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * Check finite contact between two displayed head colliders.
 *
 * Scenarios:
 *
 * 1. Two 0.125 m spheres separated by 0.25 m report zero clearance and their
 *    local exterior points. A stale frame displaced by 25 mm, a vertical
 *    offset and matching outward directions each remove bearing.
 * 2. A 2 mm overlap reports signed clearance and the same exterior points.
 *    When a tangent pair and a shallow intersection coexist, select the
 *    tangent pair.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify the collider size, observed local points, absent contact and overlap selection.
 * @evidence contracts/development/testing.md#behavioral-verification The prepared reader receives resolved bones and opposing directions for each geometry.
 * @evidence contracts/development/testing.md#independent-expectations Two radii set the tangent separation, and the 25 mm stale displacement exceeds the 10 mm admission margin.
 */
export async function test_motions_touch_head_rest_bearing(): Promise<void> {
  const fixture: IAutoMovieMotionHumanBody =
    await humanFixtureBody("m-average");
  const bone: AutoMovieHumanoidBone = "head";
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const radius: number = 0.125;
  const shape: IAutoMoviePhysicalShape = {
    kind: "sphere",
    id: "cap",
    material: "fixture",
    radius,
    transform: { position: zero, rotation: AutoMovieEngineQuaternion.identity() },
  };
  const body: IAutoMovieMotionHumanBody = {
    ...fixture,
    colliders: {
      bones: new Set([bone]),
      segments: [
        {
          bone,
          offset: zero,
          rotation: AutoMovieEngineQuaternion.identity(),
          shapes: [shape],
        },
      ],
    },
  };
  const displayed = (
    x: number,
    y: number = 0,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    new Map([
      [
        bone,
        {
          bone,
          worldPosition: { x, y, z: 0 },
          localRotation: AutoMovieEngineQuaternion.identity(),
          worldRotation: AutoMovieEngineQuaternion.identity(),
        },
      ],
    ]);
  const forward: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const opposing: IAutoMovieVector3 = AutoMovieEngineVector3.scale(forward, -1);
  const measure: ReturnType<typeof HumanMaterialContact.preparePair> =
    HumanMaterialContact.preparePair(body, bone, body, bone);
  const now: HumanMaterialContact.IPair | undefined = measure(
    displayed(0.05),
    displayed(0.3),
    forward,
    opposing,
    0.01,
  );
  const before: HumanMaterialContact.IPair | undefined = measure(
    displayed(0.05),
    displayed(0.275),
    forward,
    opposing,
    0.01,
  );
  TestValidator.predicate(
    "the pair is attached to both local frames",
    now !== undefined &&
      nclose(now.first.clearance, 0, 1e-12) &&
      vclose(now.first.point, { x: -radius, y: 0, z: 0 }, 1e-7) &&
      vclose(now.second.point, { x: radius, y: 0, z: 0 }, 1e-7),
  );
  TestValidator.predicate(
    "delayed and vertically disjoint material cannot bear",
    before === undefined &&
      measure(
        displayed(0.05),
        displayed(0.3, 0.25),
        forward,
        opposing,
        0.01,
      ) === undefined &&
      measure(displayed(0.05), displayed(0.3), forward, forward, 0.01) ===
        undefined,
  );
  const sunk: HumanMaterialContact.IPair | undefined = measure(
    displayed(0.05),
    displayed(0.298),
    forward,
    opposing,
    0.01,
  );
  TestValidator.predicate(
    "a small overlap reports the actual exterior of each solid",
    sunk !== undefined &&
      nclose(sunk.first.clearance, -0.002, 1e-12) &&
      vclose(sunk.first.point, { x: -radius, y: 0, z: 0 }, 1e-7) &&
      vclose(sunk.second.point, { x: radius, y: 0, z: 0 }, 1e-7),
  );
  const extra: IAutoMovieMotionHumanBody = {
    ...body,
    colliders: {
      ...body.colliders,
      segments: body.colliders.segments.map((segment) => ({
        ...segment,
        shapes: [
          {
            ...shape,
            id: "shallow",
            transform: {
              ...shape.transform,
              position: { x: 0.004, y: 0, z: 0 },
            },
          },
          shape,
        ],
      })),
    },
  };
  const closest: HumanMaterialContact.IPair | undefined =
    HumanMaterialContact.preparePair(extra, bone, body, bone)(
      displayed(0.05),
      displayed(0.3),
      forward,
      opposing,
      0.01,
    );
  TestValidator.predicate(
    "the tangent pair wins over a separate shallow intersection",
    closest !== undefined && nclose(closest.first.clearance, 0, 1e-12),
  );
}
