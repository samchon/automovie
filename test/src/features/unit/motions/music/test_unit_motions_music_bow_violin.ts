import type {
  IAutoMovieMotionClock,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionClock,
  bowViolinGrip,
  bowViolinHairAxis,
  bowViolinStroke,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** The scenarios of `test_unit_motions_music_bow_violin_grip`. */
namespace ScenarioBowViolinGrip {
  /** A half turn about +Z: (x, y, z) goes to (-x, -y, z). */
  const HALF: IAutoMovieQuaternion = { x: 0, y: 0, z: 1, w: 0 };

  /**
   * `bowViolinGrip` places the held bow's grip so the hair point at a share from
   * frog to tip, turned by the stroke rotation, lies on the sounding point lifted
   * along the string's outward normal: `contact + lift outward - R (frog + share
   * hair)`.
   *
   * The sounding point is (1, 1, 0), the outward normal +Y; the frog lies 0.1 m
   * below the grip and the hair runs 0.6 m along -X in the bow's held frame.
   *
   * Scenarios:
   *
   * 1. Unturned, at the frog and on the string, the grip is 0.1 m above the sounding
   *    point.
   * 2. At half the hair and lifted 0.05 m, it moves 0.3 m along +X and 0.05 m up.
   * 3. Turned a half turn about +Z, the frog's offset and the hair reverse.
   */
  export function test_unit_motions_music_bow_violin_grip(): void {
    const contact: IAutoMovieVector3 = { x: 1, y: 1, z: 0 };
    const frog: IAutoMovieVector3 = { x: 0, y: -0.1, z: 0 };
    const hair: IAutoMovieVector3 = { x: -0.6, y: 0, z: 0 };
    const plain: (share: number, lift: number) => IAutoMovieVector3 =
      bowViolinGrip(
        contact,
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 0, z: 0, w: 1 },
        frog,
        hair,
      );
    const turned: (share: number, lift: number) => IAutoMovieVector3 =
      bowViolinGrip(contact, { x: 0, y: 1, z: 0 }, HALF, frog, hair);
    TestValidator.predicate(
      "the grip that lays the hair on the string",
      vclose(plain(0, 0), { x: 1, y: 1.1, z: 0 }, 1e-12) &&
        vclose(plain(0.5, 0.05), { x: 1.3, y: 1.15, z: 0 }, 1e-12) &&
        vclose(turned(0.5, 0), { x: 0.7, y: 0.9, z: 0 }, 1e-12),
    );
  }
}

/** The scenarios of `test_unit_motions_music_bow_violin_hair_axis`. */
namespace ScenarioBowViolinHairAxis {
  /**
   * `bowViolinHairAxis` lays the bow hair perpendicular to the string across the
   * instrument (Schoonderwaldt 2010's straight stroke), tilted π / 15 out of the
   * string bar's plane: toward the outward normal on `string1`, away from it on
   * `string4`.
   *
   * The string runs along +X, its bar's outward normal is +Y, so across is +Z.
   *
   * Scenarios:
   *
   * 1. On `string1` the hair is `(0, sin(π / 15), cos(π / 15))`.
   * 2. On `string4` its outward part is reversed.
   * 3. Either way it stays perpendicular to the string and of unit length.
   */
  export function test_unit_motions_music_bow_violin_hair_axis(): void {
    const along: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
    const outward: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const tilt: number = Math.PI / 15;
    const first: IAutoMovieVector3 = bowViolinHairAxis(
      along,
      outward,
      "string1",
    );
    const fourth: IAutoMovieVector3 = bowViolinHairAxis(
      along,
      outward,
      "string4",
    );
    TestValidator.predicate(
      "tilted toward each string's outside",
      vclose(first, { x: 0, y: Math.sin(tilt), z: Math.cos(tilt) }, 1e-12) &&
        vclose(
          fourth,
          { x: 0, y: -Math.sin(tilt), z: Math.cos(tilt) },
          1e-12,
        ) &&
        nclose(Math.hypot(first.x, first.y, first.z), 1, 1e-12),
    );
  }
}

/** The scenarios of `test_unit_motions_music_bow_violin_stroke`. */
namespace ScenarioBowViolinStroke {
  /** The clearance off the string before and after the stroke, metres. */
  const CLEARANCE: number = 0.035;

  /**
   * `bowViolinStroke` schedules a stroke on its clock: the hair slides from 18%
   * to 42% of the playable hair through the `contact` phase (down-bow) or back
   * (up-bow), and stands a clearance off the string until `ready`, lowers to it
   * by `contact` and rises back over `lift`; the clock's progress is a minimum-
   * jerk share, one half at a phase's middle.
   *
   * Phases: approach 0 to 1 s, ready to 1.2 s, contact to 2.2 s, lift to 2.4 s.
   *
   * Scenarios:
   *
   * 1. A down-bow starts at 18% a clearance off the string, passes 30% on it at
   *    mid-stroke and ends at 42% a clearance off.
   * 2. An up-bow starts at 42%, also passes 30% mid-stroke, and ends at 18%.
   * 3. `from` names each direction's starting share.
   */
  export function test_unit_motions_music_bow_violin_stroke(): void {
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock.sequence([
      { name: "approach", seconds: 1 },
      { name: "ready", seconds: 0.2 },
      { name: "contact", seconds: 1 },
      { name: "lift", seconds: 0.2 },
    ]);
    const down: (seconds: number) => bowViolinStroke.IStroke = bowViolinStroke(
      clock,
      undefined,
      CLEARANCE,
    );
    const up: (seconds: number) => bowViolinStroke.IStroke = bowViolinStroke(
      clock,
      "up",
      CLEARANCE,
    );
    const at = (
      stroke: bowViolinStroke.IStroke,
      share: number,
      lift: number,
    ): boolean =>
      nclose(stroke.share, share, 1e-12) && nclose(stroke.lift, lift, 1e-12);
    TestValidator.predicate(
      "the down-bow",
      at(down(0.5), 0.18, CLEARANCE) &&
        at(down(1.7), 0.3, 0) &&
        at(down(2.4), 0.42, CLEARANCE),
    );
    TestValidator.predicate(
      "the up-bow",
      at(up(0.5), 0.42, CLEARANCE) &&
        at(up(1.7), 0.3, 0) &&
        at(up(2.4), 0.18, CLEARANCE),
    );
    TestValidator.equals(
      "the starting shares",
      [bowViolinStroke.from("down"), bowViolinStroke.from("up")],
      [0.18, 0.42],
    );
  }
}

/**
 * The `bow_violin` family's own logic, one scenario group per namespace above:
 * each group's scenarios are documented on it.
 */
export function test_unit_motions_music_bow_violin(): void {
  ScenarioBowViolinGrip.test_unit_motions_music_bow_violin_grip();
  ScenarioBowViolinHairAxis.test_unit_motions_music_bow_violin_hair_axis();
  ScenarioBowViolinStroke.test_unit_motions_music_bow_violin_stroke();
}
