import {
  AutoMoviePhysicalSimulation,
  Quaternion,
  Vector3,
  physicalShapeBounds,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../internal/PhysicalSupportFixtures";
import { PhysicalSupportLoads } from "../internal/PhysicalSupportLoads";
import { createPhysicalBalanceInput } from "../internal/createPhysicalBalanceInput";

/** Native seconds simulated per stance. */
const DURATION: number = 0.5;

/** The late window over which loads and drift are read, seconds. */
const WINDOW: number = 0.15;

/** How far the measured floor load may stand from the body's weight, as a share of it. */
const LOAD: number = 0.02;

/** How far the mass center may move in the late window, metres. */
const DRIFT: number = 0.002;

/**
 * The sideways shift of the body over its planted supports, metres: wide
 * enough to carry the mass center past the far pair's footprint, where
 * moment balance leaves the near pair more than half the load however each
 * box spreads its own.
 */
const SHIFT: number = 0.25;

/**
 * The independent four-support primitive, under the same internal
 * actuation as the Human, stands quietly and carries its weight where its
 * mass center puts it.
 *
 * Each support is a 0.24 m box that can bear its load anywhere under its
 * footprint, so moment balance fixes a pair's share of the load only within
 * a band: the shares the mass center's place gives with each pair's load
 * borne at either end of its footprint.
 *
 * Scenarios:
 * 1. Standing on its four supports: no recovery step, the floor carries its
 *    weight, the mass center holds still, and each pair's share lies within
 *    its band.
 * 2. With every leg's target leaned about its planted support so the body
 *    stands 250 mm to one side over them, the band demands more than half of
 *    the load from the nearer pair, and the measured share lies within it and
 *    above the centred one.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two stances, the band and what each must show.
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation.compute` on the maintained four-support fixture and reads the solver's floor receipts, cache frames and recovery record.
 * @evidence contracts/development/testing.md#independent-expectations The weight is the profile's mass times the declared gravity; the band follows from moment balance with the mass center computed from the cache's segment masses and frames and the footprints from the supports' own collider bounds. The receipts' sample points are single manifold points, not centers of pressure, so the load's place is not read from them.
 * @evidence contracts/development/testing.md#distinguishing-cases A centred and a shifted body; a load left on the far pair or split evenly after the shift falls outside the shifted band.
 * @evidence contracts/development/testing.md#execution-ownership Builds the primitive in memory and runs two short native simulations with no viewer or file host.
 */
export async function test_physical_primitive_quiet_support(): Promise<void> {
  const failures: string[] = [];
  const centred: IShare = await stance(0, "centred", failures);
  const shifted: IShare = await stance(SHIFT, "shifted", failures);
  if (!(shifted.band[0] > 0.5 && shifted.left > centred.left))
    failures.push(
      `shifted: the load did not follow the shifted mass center ${JSON.stringify({ centred, shifted })}`,
    );
  TestValidator.equals(
    "four-support quiet support and weight transfer",
    failures,
    [],
  );
}

/** A stance's measured left-pair share and the band moment balance allows it. */
interface IShare {
  /** The left pair's measured share of the floor load. */
  left: number;
  /** The least and greatest share moment balance allows the left pair. */
  band: [number, number];
}

/** Run the primitive with its legs leaned to shift the body sideways and check its support. */
async function stance(
  shift: number,
  label: string,
  failures: string[],
): Promise<IShare> {
  const profile: IAutoMoviePhysicalProfile = PhysicalModelFixtures.quadrupod();
  const subject: IAutoMoviePhysicalSimulationInput.IBody =
    PhysicalSupportFixtures.body(profile, DURATION);
  // Lean every leg about its planted support joint by the same angle: each
  // support keeps its place and the body moves sideways by `shift` over them.
  const lean = (bone: string): IAutoMovieVector3 => {
    const index: string = bone.split("-")[1]!;
    const joint = profile.joints.find(
      (candidate): boolean => candidate.child === `support-${index}`,
    )!;
    const support = profile.segments.find(
      (segment): boolean => segment.bone === `support-${index}`,
    )!;
    return Vector3.add(support.neutral.position, joint.childFrame.position);
  };
  const root: IAutoMoviePhysicalProfile["segments"][number] =
    profile.segments[0]!;
  // The hip anchor in the world: the joint's child frame turned by the bent
  // thigh's own neutral rotation.
  const thigh: IAutoMoviePhysicalProfile["segments"][number] =
    profile.segments.find((segment): boolean => segment.bone === "upper-0")!;
  const hip: IAutoMovieVector3 = Vector3.add(
    thigh.neutral.position,
    Quaternion.rotateVector(
      thigh.neutral.rotation,
      profile.joints.find((joint): boolean => joint.child === "upper-0")!
        .childFrame.position,
    ),
  );
  const length: number = hip.y - lean("upper-0").y;
  const angle: number = -Math.asin(shift / length);
  const turn: IAutoMovieRigidTransform["rotation"] = Quaternion.fromAxisAngle(
    { x: 0, y: 0, z: 1 },
    (angle * 180) / Math.PI,
  );
  const moved: IAutoMovieVector3 = Vector3.subtract(
    Quaternion.rotateVector(turn, { x: 0, y: length, z: 0 }),
    { x: 0, y: length, z: 0 },
  );
  for (const target of subject.targets)
    for (const segment of profile.segments) {
      const pose: IAutoMovieRigidTransform = target.segments[segment.bone]!;
      if (segment === root) {
        pose.position = Vector3.add(segment.neutral.position, moved);
      } else if (/^(upper|lower)-/.test(segment.bone)) {
        const pivot: IAutoMovieVector3 = lean(segment.bone);
        pose.position = Vector3.add(
          pivot,
          Quaternion.rotateVector(
            turn,
            Vector3.subtract(segment.neutral.position, pivot),
          ),
        );
        // The whole segment turns rigidly about the pivot, its bent-knee
        // neutral rotation kept under the lean.
        pose.rotation = Quaternion.multiply(turn, segment.neutral.rotation);
      }
    }
  // The leaned targets stay articulated: every joint's anchors meet, as a
  // rigid turn about the support pivots keeps them, before any simulation.
  for (const target of subject.targets)
    for (const joint of profile.joints) {
      const parent: IAutoMovieRigidTransform = target.segments[joint.parent]!;
      const child: IAutoMovieRigidTransform = target.segments[joint.child]!;
      const gap: number = Vector3.length(
        Vector3.subtract(
          Vector3.add(
            parent.position,
            Quaternion.rotateVector(parent.rotation, joint.parentFrame.position),
          ),
          Vector3.add(
            child.position,
            Quaternion.rotateVector(child.rotation, joint.childFrame.position),
          ),
        ),
      );
      if (gap > 1e-9)
        failures.push(`${label}: ${joint.id} target anchors ${gap} m apart`);
    }
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    createPhysicalBalanceInput(profile, "internal", 0, DURATION, subject);
  input.impulses.length = 0;
  const run: IAutoMoviePhysicalSimulation =
    await AutoMoviePhysicalSimulation.compute(input);

  const recovery = run.cache.recovery[subject.id];
  if (recovery?.last !== "supported" || recovery.steps.length !== 0)
    failures.push(`${label}: quiet stance stepped or lost support`);

  // The supports split into the pairs on either side of the body's middle.
  const middle: number =
    profile.segments
      .filter((segment) => segment.bone.startsWith("support-"))
      .reduce(
        (sum: number, segment): number => sum + segment.neutral.position.x,
        0,
      ) / 4;
  const sideOf = (bone: string): PhysicalSupportLoads.Side | undefined => {
    const segment = profile.segments.find(
      (candidate) => candidate.bone === bone,
    );
    return !bone.startsWith("support-") || !segment
      ? undefined
      : segment.neutral.position.x > middle
        ? "left"
        : "right";
  };
  const read: PhysicalSupportLoads.IResult = PhysicalSupportLoads.measure(
    run,
    profile,
    subject.id,
    DURATION - WINDOW,
    sideOf,
    (
      poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
      side: PhysicalSupportLoads.Side,
    ): IAutoMovieVector3 => {
      const pair: IAutoMovieVector3[] = profile.segments
        .filter((segment) => sideOf(segment.bone) === side)
        .map((segment): IAutoMovieVector3 => poses[segment.bone]!.position);
      return {
        x:
          pair.reduce((sum: number, point): number => sum + point.x, 0) /
          pair.length,
        y: 0,
        z:
          pair.reduce((sum: number, point): number => sum + point.z, 0) /
          pair.length,
      };
    },
  );
  const weight: number = profile.mass * -input.gravity.y;
  if (Math.abs(read.total - weight) > weight * LOAD)
    failures.push(`${label}: floor load ${read.total} N against ${weight} N`);
  if (read.drift > DRIFT)
    failures.push(`${label}: mass center drifted ${read.drift} m`);

  // Each pair bears its load somewhere across its footprint; the band is the
  // left share moment balance gives at the footprints' four end pairings.
  const last: Readonly<Record<string, IAutoMovieRigidTransform>> =
    run.cache.frames.at(-1)!.bodies[subject.id]!;
  const center: number = PhysicalSupportLoads.center(profile, last).x;
  const footprint = (side: PhysicalSupportLoads.Side): [number, number] => {
    let low: number = Infinity;
    let high: number = -Infinity;
    for (const segment of profile.segments) {
      if (sideOf(segment.bone) !== side) continue;
      for (const shape of segment.shapes) {
        const box = physicalShapeBounds(last[segment.bone]!, shape);
        low = Math.min(low, box.min.x);
        high = Math.max(high, box.max.x);
      }
    }
    return [low, high];
  };
  const shares: number[] = footprint("left").flatMap((l: number): number[] =>
    footprint("right").map((r: number): number => (center - r) / (l - r)),
  );
  const band: [number, number] = [Math.min(...shares), Math.max(...shares)];
  if (!(read.left >= band[0] && read.left <= band[1]))
    failures.push(
      `${label}: left pair carries ${read.left} of the load, outside its moment-balance band ${JSON.stringify(band)}`,
    );
  return { left: read.left, band };
}
