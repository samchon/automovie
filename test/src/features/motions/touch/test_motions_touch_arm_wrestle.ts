import { AutoMovieEnginePhysics, AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanSocial
} from "../../../../../packages/motions/src/lexicon/internal/HumanSocial";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Check elbow seating and the paired arm-wrestle request.
 *
 * Scenarios:
 *
 * 1. A capsule centred 6 cm above the pad has zero clearance. Move it 5 mm up
 *    or down and observe the matching signed gap. Move it past the pad and
 *    see no bearing.
 * 2. The paired result forwards each side's pad and the authored table,
 *    winner and pin.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases give the tested capsule clearances and the forwarded scene fields.
 * @evidence contracts/development/testing.md#behavioral-verification The seat helper reads a finite pad, and the mutual plan composes two action inputs.
 * @evidence contracts/development/testing.md#independent-expectations The axis length and radius give the 6 cm tangent height and the signed changes follow the imposed offsets.
 */
export function test_motions_touch_arm_wrestle(): void {
  const frame: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: AutoMovieEngineQuaternion.identity(),
  };
  const elbow: IAutoMoviePhysicalShape = {
    id: "elbow",
    material: "test",
    kind: "capsule",
    halfLength: 0.04,
    radius: 0.02,
    transform: frame,
  };
  const outline: readonly IAutoMovieVector3[] = [
    { x: -0.08, y: 0, z: -0.08 },
    { x: 0.08, y: 0, z: -0.08 },
    { x: 0.08, y: 0, z: 0.08 },
    { x: -0.08, y: 0, z: 0.08 },
  ];
  const face: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeFaceContactPrepare> =
    AutoMovieEnginePhysics.physicalShapeFaceContactPrepare(frame, outline);
  const gap = (x: number, y: number): number | undefined =>
    face({ ...frame, position: { x, y, z: 0 } }, elbow)?.clearance;
  TestValidator.predicate(
    "the elbow exterior determines contact and signed clearance",
    nclose(gap(0, 0.06)!, 0, 1e-9) &&
      nclose(gap(0, 0.065)!, 0.005, 1e-9) &&
      nclose(gap(0, 0.055)!, -0.005, 1e-9) &&
      gap(0.101, 0.06) === undefined,
  );
  const params = {
    table: { x: 2, y: 0.8, z: 3 },
    winner: "one" as const,
    pin: 30,
    pads: {
      one: { prop: "pad-l", point: "top" },
      other: { prop: "pad-r", point: "top" },
    },
  };
  const cast = { one: "left", other: "right" };
  TestValidator.equals(
    "each arm retains its named support and shared contest geometry",
    [
      HumanSocial.armWrestle.act("one", params, cast).params,
      HumanSocial.armWrestle.act("other", params, cast).params,
    ],
    [
      {
        partner: "right",
        table: params.table,
        wins: true,
        pin: 30,
        pad: params.pads.one,
      },
      {
        partner: "left",
        table: params.table,
        wins: false,
        pin: 30,
        pad: params.pads.other,
      },
    ],
  );
}
