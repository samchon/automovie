import type { IAutoMovieBodyMeasure } from "@automovie/interface";
import {
  HumanRefusal,
  grappleArms,
  grappleFront,
  grappleStances,
  grappleSumo,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../../internal/fixtures/humanFixture";
import { nclose } from "../../../internal/nclose";

/** The scenarios of `test_unit_motions_grappling_grapple_arms_stretched`. */
namespace ScenarioGrappleArmsStretched {
  /** A duration refusal whose feasible range starts at a least duration. */
  const short = (minimum: number, axis: string = "duration"): HumanRefusal =>
    new HumanRefusal({
      kind: "parameter",
      axis,
      value: 4,
      feasible: { kind: "range", minimum, maximum: 10, unit: "s" },
      reason: "too short",
      fix: "lengthen it",
    });

  /**
   * `grappleArms.stretched` reads a duration refusal of the arms' plan as the
   * scene's stretched rest: the release-to-rest window scaled by the least
   * duration over the scene's, `release + (rest - release) minimum / duration`,
   * when that still ends inside the scene.
   *
   * A 4 s scene releases at 3 s and rests at 3.6 s.
   *
   * Scenarios:
   *
   * 1. A refusal asking 5 s stretches the rest to `3 + 0.6 · 5 / 4` = 3.75 s.
   * 2. One asking 8 s would end past the scene: none.
   * 3. One on another axis, one asking no more than the scene, or another error:
   *    none.
   */
  export function test_unit_motions_grappling_grapple_arms_stretched(): void {
    TestValidator.equals(
      "the stretched rest, or none",
      [
        grappleArms.stretched(short(5), 4, 3, 3.6),
        grappleArms.stretched(short(8), 4, 3, 3.6),
        grappleArms.stretched(short(5, "reach"), 4, 3, 3.6),
        grappleArms.stretched(short(3), 4, 3, 3.6),
        grappleArms.stretched(new Error("other"), 4, 3, 3.6),
      ],
      [3 + (0.6 * 5) / 4, undefined, undefined, undefined, undefined],
    );
  }
}

/** The scenarios of `test_unit_motions_grappling_grapple_front_chest`. */
namespace ScenarioGrappleFrontChest {
  /**
   * `grappleFront.chest` is how far a body leaning forward from the hips by a
   * pitch carries its chest's front ahead of them: the chest's height above the
   * hips times the sine of the pitch, plus half the chest's depth.
   *
   * Scenarios:
   *
   * 1. Upright, the average man's chest front is half his chest depth ahead.
   * 2. Leaning 30 degrees it is half the chest's height above the hips further.
   */
  export async function test_unit_motions_grappling_grapple_front_chest(): Promise<void> {
    const m: IAutoMovieBodyMeasure = (await humanFixture("m-average")).measure;
    TestValidator.predicate(
      "the chest's front",
      nclose(grappleFront.chest({ measure: m }, 0), m.chestDepth / 2, 1e-12) &&
        nclose(
          grappleFront.chest({ measure: m }, 30),
          (m.chestHeight - m.hipHeight) / 2 + m.chestDepth / 2,
          1e-12,
        ),
    );
  }
}

/** The scenarios of `test_unit_motions_grappling_grapple_front_head`. */
namespace ScenarioGrappleFrontHead {
  /**
   * `grappleFront.head` is how far a body leaning forward from the hips by a
   * pitch carries its head's front ahead of them: the head centre's height above
   * the hips times the sine of the pitch, plus the head's radius.
   *
   * Scenarios:
   *
   * 1. Upright, the average man's head front is one head radius ahead.
   * 2. Leaning 90 degrees it is the head centre's whole height above the hips plus
   *    the radius.
   */
  export async function test_unit_motions_grappling_grapple_front_head(): Promise<void> {
    const m: IAutoMovieBodyMeasure = (await humanFixture("m-average")).measure;
    TestValidator.predicate(
      "the head's front",
      nclose(grappleFront.head({ measure: m }, 0), m.headRadius, 1e-12) &&
        nclose(
          grappleFront.head({ measure: m }, 90),
          m.headHeight - m.headRadius - m.hipHeight + m.headRadius,
          1e-12,
        ),
    );
  }
}

/** The scenarios of `test_unit_motions_grappling_grapple_stances_regions`. */
namespace ScenarioGrappleStancesRegions {
  /**
   * `grappleStances.regions` names where each of the initiator's hands takes the
   * partner: a judo throw's collar and sleeve, a single leg's near thigh, a
   * double leg's two thighs, a Greco-Roman tie's shoulders, a sumo bout's own.
   *
   * Scenarios:
   *
   * 1. A right-handed shoulder throw takes the left side of the neck and the right
   *    elbow.
   * 2. A right single leg takes the left front thigh with the right hand only.
   * 3. A double leg takes both front thighs, crossed.
   * 4. A Greco-Roman throw takes both shoulders, crossed; an oshi-dashi both sides
   *    of the ribs.
   */
  export function test_unit_motions_grappling_grapple_stances_regions(): void {
    TestValidator.equals(
      "each kind's grips",
      [
        grappleStances.regions("seoiNage", "right"),
        grappleStances.regions("singleLeg", "right"),
        grappleStances.regions("doubleLeg", "right"),
        grappleStances.regions("grecoRoman", "right"),
        grappleStances.regions("oshiDashi", "right"),
      ],
      [
        { left: "elbowRight", right: "neckLeft" },
        { right: "thighFrontLeft" },
        { left: "thighFrontRight", right: "thighFrontLeft" },
        { left: "shoulderRight", right: "shoulderLeft" },
        { left: "ribsRight", right: "ribsLeft" },
      ],
    );
  }
}

/** The scenarios of `test_unit_motions_grappling_grapple_stances_seconds`. */
namespace ScenarioGrappleStancesSeconds {
  /**
   * `grappleStances.seconds` is a grapple's default scene length: the
   * vocabulary's stated seconds per kind, a sumo bout's from its own table.
   *
   * Scenarios:
   *
   * 1. A shoulder throw lasts 3.5 s, a foot sweep 3 s, a single-leg 3.8 s.
   * 2. A yori-kiri bout lasts 5 s, an oshi-dashi 4.5 s.
   */
  export function test_unit_motions_grappling_grapple_stances_seconds(): void {
    TestValidator.equals(
      "each kind's length",
      [
        grappleStances.seconds("seoiNage"),
        grappleStances.seconds("deAshiHarai"),
        grappleStances.seconds("singleLeg"),
        grappleStances.seconds("yoriKiri"),
        grappleStances.seconds("oshiDashi"),
      ],
      [3.5, 3, 3.8, 5, 4.5],
    );
  }
}

/** The scenarios of `test_unit_motions_grappling_grapple_sumo`. */
namespace ScenarioGrappleSumo {
  /**
   * `grappleSumo` tells a sumo bout among the grapple kinds and gives its length,
   * its grips and its phase window: the shikiri crouch to 22%, the tachiai to
   * 32%, the finish just before 82% and the rest from 92%.
   *
   * Scenarios:
   *
   * 1. Oshi-dashi, yori-kiri and uwate-nage are bouts; a shoulder throw is not.
   * 2. They last 4.5, 5 and 4 s.
   * 3. Oshi-dashi pushes at the ribs; the belt bouts take the hips.
   * 4. The window's shares.
   */
  export function test_unit_motions_grappling_grapple_sumo(): void {
    TestValidator.equals(
      "the bouts",
      [
        grappleSumo.is("oshiDashi"),
        grappleSumo.is("yoriKiri"),
        grappleSumo.is("uwateNage"),
        grappleSumo.is("seoiNage"),
      ],
      [true, true, true, false],
    );
    TestValidator.equals(
      "lengths, grips and window",
      [
        [
          grappleSumo.seconds("oshiDashi"),
          grappleSumo.seconds("yoriKiri"),
          grappleSumo.seconds("uwateNage"),
        ],
        grappleSumo.regions("oshiDashi"),
        grappleSumo.regions("uwateNage"),
        grappleSumo.window(),
      ],
      [
        [4.5, 5, 4],
        { left: "ribsRight", right: "ribsLeft" },
        { left: "hipRight", right: "hipLeft" },
        { reach: 0.22, take: 0.32, release: 0.82 - 0.04, rest: 0.92 },
      ],
    );
  }
}

/**
 * The `grapple` family's own logic, one scenario group per namespace above:
 * each group's scenarios are documented on it.
 */
export async function test_unit_motions_grappling_grapple(): Promise<void> {
  ScenarioGrappleArmsStretched.test_unit_motions_grappling_grapple_arms_stretched();
  await ScenarioGrappleFrontChest.test_unit_motions_grappling_grapple_front_chest();
  await ScenarioGrappleFrontHead.test_unit_motions_grappling_grapple_front_head();
  ScenarioGrappleStancesRegions.test_unit_motions_grappling_grapple_stances_regions();
  ScenarioGrappleStancesSeconds.test_unit_motions_grappling_grapple_stances_seconds();
  ScenarioGrappleSumo.test_unit_motions_grappling_grapple_sumo();
}
