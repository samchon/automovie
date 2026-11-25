import type { IAutoMovieMotionClock, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieMotionClock, bowViolinGrip, bowViolinHairAxis, bowViolinStroke } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** The clearance off the string before and after the stroke, metres. */
const CLEARANCE: number = 0.035;

/** A half turn about +Z: (x, y, z) goes to (-x, -y, z). */
const HALF: IAutoMovieQuaternion = { x: 0, y: 0, z: 1, w: 0 };

/**
 * The bowed violin law's own logic: the stroke's schedule, the hair's axis
 * across the string, and the grip that lays the hair on the sounding point.
 *
 * Scenarios:
 *
 * 1. Over phases approach 0 to 1 s, ready to 1.2 s, contact to 2.2 s and lift to
 *    2.4 s, a down-bow stands a clearance off the string at 18 % of the hair,
 *    passes 30 % on it mid-stroke and ends at 42 % a clearance off; an up-bow
 *    runs the other way.
 * 2. On `string1` across a string along +X under a +Y outward normal, the hair
 *    lies along `(0, sin(π / 15), cos(π / 15))` (Schoonderwaldt 2010's straight
 *    stroke, tilted out of the string bar's plane); on `string4` it tilts the
 *    other way.
 * 3. With the frog 0.1 m below the grip and the hair 0.6 m along -X, the bow
 *    turned a half turn about +Z lays half its hair on (1, 1, 0) from a grip at
 *    (0.7, 0.9, 0).
 */
export function test_unit_motions_music_bow_violin(): void {
  // 1. The stroke.
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
    "the down- and up-bow",
    at(down(0.5), 0.18, CLEARANCE) &&
      at(down(1.7), 0.3, 0) &&
      at(down(2.4), 0.42, CLEARANCE) &&
      at(up(0.5), 0.42, CLEARANCE) &&
      at(up(2.4), 0.18, CLEARANCE),
  );

  // 2. The hair's axis.
  const tilt: number = Math.PI / 15;
  const along: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const outward: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  TestValidator.predicate(
    "tilted toward each string's outside",
    vclose(
      bowViolinHairAxis(along, outward, "string1"),
      { x: 0, y: Math.sin(tilt), z: Math.cos(tilt) },
      1e-12,
    ) &&
      vclose(
        bowViolinHairAxis(along, outward, "string4"),
        { x: 0, y: -Math.sin(tilt), z: Math.cos(tilt) },
        1e-12,
      ),
  );

  // 3. The grip.
  const grip: (share: number, lift: number) => IAutoMovieVector3 =
    bowViolinGrip(
      { x: 1, y: 1, z: 0 },
      outward,
      HALF,
      { x: 0, y: -0.1, z: 0 },
      { x: -0.6, y: 0, z: 0 },
    );
  TestValidator.predicate(
    "the grip that lays the hair on the string",
    vclose(grip(0.5, 0), { x: 0.7, y: 0.9, z: 0 }, 1e-12),
  );
}
