import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanOperate } from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { vclose } from "../../internal/vclose";

/** Sixty-four binary64 rounding units cover the rotations and chord at 3 m. */
const ROUNDING: number = 64 * Number.EPSILON * 3;

/** The typing hover above the key face, metres. */
const HOVER: number = 0.015;

/**
 * A pressed key uses the hand's fixed digit geometry and its own chord.
 *
 * Scenarios:
 *
 * 1. A quarter-turned hand reaching across the key plane with a half-radius drop
 *    advances its pivot by (1 − √3/2) times the radius. Twice the radius
 *    saturates the remaining chord at zero.
 * 2. A press normal aligned with the digit puts the wrist one key depth behind the
 *    site, before subtracting the rotated tip.
 * 3. An explicit index sequence prepares that digit before reading any key. Both
 *    the established three-argument preparation and the one-press entry agree
 *    with the explicit sequence for the same site and depth.
 */
export async function test_motions_handling_manipulate_reach(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const handToTip: IAutoMovieVector3 = HumanHand.offset(
    body,
    "left",
    "indexTip",
    "flat",
  ).point;
  const localKnuckle: IAutoMovieVector3 = Vector3.subtract(
    body.rest.get("leftIndexProximal")!,
    body.rest.get("leftHand")!,
  );
  const span: IAutoMovieVector3 = Vector3.subtract(handToTip, localKnuckle);
  const radius: number = Math.hypot(span.x, span.y, span.z);
  const along: IAutoMovieVector3 = {
    x: span.z / radius,
    y: span.y / radius,
    z: -span.x / radius,
  };
  const tip: IAutoMovieVector3 = {
    x: handToTip.z,
    y: handToTip.y,
    z: -handToTip.x,
  };
  const across: IAutoMovieVector3 = Vector3.normalize({
    x: -along.y * along.x,
    y: along.x ** 2 + along.z ** 2,
    z: -along.y * along.z,
  });
  const rotation: IAutoMovieQuaternion = {
    x: 0,
    y: Math.SQRT1_2,
    z: 0,
    w: Math.SQRT1_2,
  };
  const site: IAutoMovieVector3 = { x: 3, y: 1, z: -2 };
  const depth: number = radius / 2 - HOVER;
  const hover: IAutoMovieVector3 = Vector3.subtract(
    Vector3.addScaled(site, across, HOVER),
    tip,
  );
  const expected: IAutoMovieVector3 = Vector3.addScaled(
    hover,
    along,
    radius * (1 - Math.sqrt(3) / 2),
  );
  const rest: ReadRest = new ReadRest(body.rest);
  const reach = AutoMovieMotionHumanOperate.manipulateReach;
  const sample = reach.prepare({ ...body, rest }, "left", rotation, [
    "index",
    "index",
  ]);
  TestValidator.equals("prepare only the demanded digit once", rest.asked, [
    "leftHand",
    "leftIndexProximal",
  ]);
  TestValidator.predicate(
    "preserve the rounded and saturated chord in the fixed hand frame",
    vclose(
      sample("index", site, across, 2 * radius - HOVER),
      Vector3.addScaled(hover, along, radius),
      ROUNDING,
    ) &&
      vclose(sample("index", site, across, depth), expected, ROUNDING) &&
      vclose(
        sample("index", site, along, depth),
        Vector3.subtract(Vector3.addScaled(site, along, -depth), tip),
        ROUNDING,
      ),
  );
  TestValidator.equals("presses do not read the rig again", rest.asked, [
    "leftHand",
    "leftIndexProximal",
  ]);
  TestValidator.predicate(
    "the public entries preserve the same wrist placement",
    vclose(
      reach.prepare(body, "left", rotation)("index", site, across, depth),
      expected,
      ROUNDING,
    ) &&
      vclose(
        reach(body, "left", "index", site, across, depth, rotation),
        expected,
        ROUNDING,
      ),
  );
}

/**
 * A fixture rest map that records the exact declared bones the preparation
 * reads.
 */
class ReadRest extends Map<AutoMovieHumanoidBone, IAutoMovieVector3> {
  /** The names read during preparation or sampling. */
  public readonly asked: AutoMovieHumanoidBone[] = [];

  /** Record a read and return the stored rest joint. */
  public override get(
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieVector3 | undefined {
    this.asked.push(bone);
    return super.get(bone);
  }
}
