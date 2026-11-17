import {
  DEFAULT_HUMANOID_ROM,
  HUMANOID_REST_FRAME,
  type IAutoMovieRestFrame,
  Quaternion,
  ROM_TOLERANCE,
  Vector3,
  distalTwistSwivelRange,
  jointToQuaternionOnBasis,
  normalizeJointAxes,
  type prepareChainConstants,
  toRigAngle,
} from "@automovie/engine";
import type {
  IAutoMovieJointAxes,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { IHumanBody } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * What a forearm's twist range and a wrist's abduction together let a hand
 * show of a requested rotation, on the real arms: the rectangle the twist
 * miss of `distalTwistSwivelRange` is measured to, and the bound itself.
 *
 * Both arms of the average man, with the body's own merged axes, the
 * humanoid rest frames and ranges and the chain constants a limb fit reads.
 * The oracle composes the two joints by the rig's own joint composition
 * (`jointToQuaternionOnBasis`): the forearm with a clinical twist and no
 * flexion, the hand's fixed rest rotation, and the hand with a clinical
 * flexion and abduction and no twist; and carries the hand's flexion axis by
 * that product.
 *
 * Scenarios:
 * 1. For every forearm twist, wrist flexion and wrist abduction of a grid
 *    over their ranges, the composed product carries the hand's flexion axis
 *    to `T(u, r) (cos a m - s sin a u)` within 1e-9: `u` the forearm's twist
 *    axis, `r` and `a` the twist and the abduction in rest-relative degrees,
 *    `m` the hand's flexion axis under its rest rotation and its fixed twist,
 *    and `s` the sense of `u` along the forearm times the sense in which the
 *    hand's rest carries its twist axis along it. The wrist's flexion does
 *    not move it. This is the rectangle the bound measures to, with its
 *    senses.
 * 2. A requested rotation is a seeded turn of up to 120 degrees from a pose
 *    of the grid, and the carried axis is its flexion axis's image, turned
 *    about a seeded axis by the swivel. At 24 swivels of 8 seeded requests
 *    an arm, the bound at the swivel never exceeds the least angle from the
 *    carried axis to the flexion axis's image over a 5 degree grid of the
 *    two ranges (ends included), and lies within the grid's reach of it
 *    (8 degrees) plus twice the joints' tolerance.
 * 3. On each arm some swivels are bounded at zero and some above it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the real reader and the real joint composition on the real rig; a wrong sense, a wrong zero meridian, a wrong rest-relative conversion or a bound above a miss the joints can show fails with its side and values.
 * @evidence contracts/development/testing.md#independent-expectations The oracle is the rig's own composition of the two joints over their ranges; it solves no equation and reads no sinusoid. The closed form of scenario 1 is stated in the reader's documentation and checked here against that composition.
 * @evidence contracts/development/testing.md#distinguishing-cases Both sides' axes, rest frames and signs; twists and abductions at both ends of their ranges; requests inside and outside what the joints can show.
 * @evidence contracts/development/testing.md#execution-ownership In memory on one prepared body, under a second; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios with their inputs, bounds and the behaviour each pins.
 */
export function test_human_motion_core_twist_miss(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const random: () => number = seeded(20261119);
  const identity: string[] = [];
  const above: string[] = [];
  const loose: string[] = [];
  const mixed: string[] = [];
  for (const side of ["left", "right"] as const) {
    const constants: prepareChainConstants.IConstants = body.chains[`${side}Arm`]!;
    const lowerBone = `${side}LowerArm` as const;
    const handBone = `${side}Hand` as const;
    const lowerBasis: IAutoMovieJointAxes = normalizeJointAxes(body.poseResolution.jointAxes[lowerBone]!, "spec axes");
    const handBasis: IAutoMovieJointAxes = normalizeJointAxes(body.poseResolution.jointAxes[handBone]!, "spec axes");
    const lowerFrame: IAutoMovieRestFrame | undefined = HUMANOID_REST_FRAME[lowerBone];
    const handFrame: IAutoMovieRestFrame | undefined = HUMANOID_REST_FRAME[handBone];
    const rest: IAutoMovieQuaternion = constants.effectorBaseRotation;
    const u: IAutoMovieVector3 = Vector3.normalize(lowerBasis.twist);

    // The rectangle's sense: whether the forearm's twist axis runs along the
    // forearm or against it, times whether the hand's rest carries its
    // right-handed twist axis onto the forearm's direction or its opposite.
    const along: IAutoMovieVector3 = Vector3.normalize(constants.effectorOffset);
    const handed: 1 | -1 =
      Vector3.dot(handBasis.twist, Vector3.cross(handBasis.flexion, handBasis.abduction)) >= 0 ? 1 : -1;
    const carried: number = Vector3.dot(
      Quaternion.rotateVector(Quaternion.inverse(rest), along),
      Vector3.scale(handBasis.twist, handed),
    );
    const sense: 1 | -1 = (Vector3.dot(u, along) > 0) === (carried > 0) ? 1 : -1;

    // The hand's flexion axis under its rest rotation and its fixed twist.
    const meridian: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.multiply(
        rest,
        jointToQuaternionOnBasis({ flexion: null, abduction: null, twist: 0 }, handBasis, handFrame),
      ),
      handBasis.flexion,
    );
    const twists: { min: number; max: number } = DEFAULT_HUMANOID_ROM[lowerBone]!.twist!;
    const flexions: { min: number; max: number } = DEFAULT_HUMANOID_ROM[handBone]!.flexion!;
    const abductions: { min: number; max: number } = DEFAULT_HUMANOID_ROM[handBone]!.abduction!;
    const grid = (range: { min: number; max: number }, step: number): number[] => {
      const out: number[] = [];
      for (let angle: number = range.min; angle < range.max; angle += step) out.push(angle);
      out.push(range.max);
      return out;
    };

    // The product of the two joints and the hand's rest between them.
    const shown = (twist: number, flexion: number, abduction: number): IAutoMovieQuaternion =>
      Quaternion.multiply(
        Quaternion.multiply(
          jointToQuaternionOnBasis({ flexion: null, abduction: null, twist }, lowerBasis, lowerFrame),
          rest,
        ),
        jointToQuaternionOnBasis({ flexion, abduction, twist: 0 }, handBasis, handFrame),
      );

    // 1. The rectangle, against the composition.
    for (const twist of grid(twists, 35))
      for (const flexion of grid(flexions, 40))
        for (const abduction of grid(abductions, 15)) {
          const r: number = toRigAngle(twist, lowerFrame?.twist)!;
          const a: number = toRigAngle(abduction, handFrame?.abduction)! * Quaternion.DEG2RAD;
          const expected: IAutoMovieVector3 = Quaternion.rotateVector(
            Quaternion.fromAxisAngle(u, r),
            Vector3.subtract(
              Vector3.scale(meridian, Math.cos(a)),
              Vector3.scale(u, sense * Math.sin(a)),
            ),
          );
          const actual: IAutoMovieVector3 = Quaternion.rotateVector(shown(twist, flexion, abduction), handBasis.flexion);
          const off: number = Vector3.length(Vector3.subtract(actual, expected));
          if (off > 1e-9 && identity.length < 10)
            identity.push(`${side} twist ${twist} flexion ${flexion} abduction ${abduction}: ${off} from the rectangle's point`);
        }

    // Every image of the flexion axis the two joints can show, on a grid.
    const images: IAutoMovieVector3[] = [];
    for (const twist of grid(twists, 5))
      for (const abduction of grid(abductions, 5))
        images.push(Quaternion.rotateVector(shown(twist, 0, abduction), handBasis.flexion));
    const found = (x: IAutoMovieVector3): number => {
      let most: number = -1;
      for (const image of images) most = Math.max(most, Vector3.dot(image, x));
      return Math.acos(Math.max(-1, Math.min(1, most))) / Quaternion.DEG2RAD;
    };
    const rig = (range: { min: number; max: number }, frame: Parameters<typeof toRigAngle>[1]): [number, number] => {
      const ends: number[] = [toRigAngle(range.min, frame)!, toRigAngle(range.max, frame)!];
      return [Math.min(...ends), Math.max(...ends)];
    };

    // 2 and 3. The bound against the grid's least miss.
    let zero: number = 0;
    let positive: number = 0;
    for (let k: number = 0; k < 8; ++k) {
      const from: IAutoMovieVector3 = Quaternion.rotateVector(
        shown(
          twists.min + random() * (twists.max - twists.min),
          0,
          abductions.min + random() * (abductions.max - abductions.min),
        ),
        handBasis.flexion,
      );
      const asked: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.fromAxisAngle(unit(random), 120 * random()),
        from,
      );
      const about: IAutoMovieVector3 = unit(random);
      const carried = (swivel: number): IAutoMovieVector3 =>
        Quaternion.rotateVector(Quaternion.fromAxisAngle(about, swivel), asked);
      const read: distalTwistSwivelRange.IRange = distalTwistSwivelRange.of({
        axis: u,
        normal: Vector3.cross(u, meridian),
        ahead: meridian,
        carried,
        range: rig(twists, lowerFrame?.twist),
      });
      const bound: (low: number, high: number) => number = read.miss(rig(abductions, handFrame?.abduction), sense);
      for (let swivel: number = 0; swivel < 360; swivel += 15) {
        const miss: number = found(carried(swivel));
        const least: number = bound(swivel, swivel);
        if (least > 0) ++positive; else ++zero;
        if (least > miss + 1e-9 && above.length < 10)
          above.push(`${side} request ${k} swivel ${swivel}: bound ${least} above the miss ${miss}`);
        if (miss - least > 8 + 2 * ROM_TOLERANCE && loose.length < 10)
          loose.push(`${side} request ${k} swivel ${swivel}: bound ${least} under the miss ${miss}`);
      }
    }
    if (zero === 0 || positive === 0) mixed.push(`${side}: zero ${zero}, positive ${positive}`);
  }
  TestValidator.equals("the two joints carry the hand's flexion axis onto the rectangle", identity, []);
  TestValidator.equals("the twist bound never exceeds a miss the joints can show", above, []);
  TestValidator.equals("the twist bound lies within the grid of the miss", loose, []);
  TestValidator.equals("each arm bounds some swivels at zero and some above", mixed, []);
}

/** A seeded unit vector. */
function unit(random: () => number): IAutoMovieVector3 {
  return Vector3.normalize({ x: random() - 0.5, y: random() - 0.5, z: random() - 0.5 });
}

/** A seeded uniform generator on [0, 1) (mulberry32). */
function seeded(seed: number): () => number {
  let state: number = seed >>> 0;
  return (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t: number = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
