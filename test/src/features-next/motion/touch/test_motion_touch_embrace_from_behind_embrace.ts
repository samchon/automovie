import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanPerformance } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { embraceScene } from "../../internal/embraceScene";
import { motionActionUnit } from "../../internal/motionActionUnit";

/**
 * How near two regions in contact stay, metres: the law's skin contact, the
 * original's bound.
 */
const NEAR: number = 0.01;

/**
 * How near a palm lies to the abdomen, metres: a skin contact and the palm's
 * own thickness (provisional), the original's bound.
 */
const PALM: number = 0.03;

/**
 * The embrace from behind held on a standing partner, on its own: the
 * equal-pair cases of `test_motion_touch_embrace_from_behind`, the average man
 * embracing another average man and the small woman another small woman, the
 * partner given explicitly standing ahead facing away (the embrace is the
 * embracer's one action).
 *
 * Scenarios:
 *
 * 1. At `ready`, midway and at `relax` the embracer's chest lies on the partner's
 *    upper back and the chin on the top of the partner's left shoulder, each
 *    within 10 mm.
 * 2. At the same instants each palm lies within 30 mm and a hand's length of the
 *    partner's abdomen.
 * 3. The chest, the chin and the palms bear on the partner in four windows, the
 *    chest's loaded.
 * 4. The embrace keeps the shipped bounds over its own span, the partner bound
 *    between the two bodies included.
 *
 * Decomposes the original's checks 1 and 2; the original stops at its first
 * failure, so the average pair's refusal hid the small pair and the tall
 * refusal, which is `test_motion_touch_embrace_from_behind_refusal`'s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and cases it decomposes, the staging, the pairs and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed regions of both bodies through the hold, the plan's windows and the verdict report over the embrace's span; a chest off the back, a chin off the shoulder, a palm off the abdomen, a missing or unloaded window, a body through the other or a finding in the embrace fails, each pair on its own.
 * @evidence contracts/development/testing.md#independent-expectations The skin-contact bound and the palm's thickness, as the original; the rest the verdicts' shipped limits.
 * @evidence contracts/development/testing.md#distinguishing-cases Two pairs of equal heights at opposite statures; the large height difference is the refusal unit's.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain, entered through `test_motion_touch_embrace_from_behind_embrace`.
 */
export function test_motion_touch_embrace_from_behind_embrace(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const label: string = `${name} embraces ${name} from behind`;
    try {
      verify(checks, label, motionHumanBody(name), motionHumanBody(name));
    } catch (error: unknown) {
      checks.check(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  }
  checks.assert("the embrace from behind rests on the partner");
}

/** One pair's embrace and its checks. */
function verify(
  checks: motionComplaints.IGatherer,
  label: string,
  a: IAutoMovieMotionHumanBody,
  b: IAutoMovieMotionHumanBody,
): void {
  const film: HumanPerformance = embraceScene.scene(a, b);
  const act: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    film,
    "a",
    "embraceFromBehind",
  );
  const from: number = motionActionUnit.event(act, "ready");
  const to: number = motionActionUnit.event(act, "relax");
  for (const t of [from, (from + to) / 2, to]) {
    const chest: number = Vector3.distance(
      embraceScene.region(film, "a", a, "sternum", t),
      embraceScene.region(film, "b", b, "upperBack", t),
    );
    const top: IAutoMovieVector3 = embraceScene.region(
      film,
      "b",
      b,
      "shoulderLeft",
      t,
    );
    const chin: number = Vector3.distance(
      embraceScene.region(film, "a", a, "chin", t),
      top,
    );
    const palms: readonly number[] = (["palmLeft", "palmRight"] as const).map(
      (palm: AutoMovieHumanoidRegion): number =>
        Vector3.distance(
          embraceScene.region(film, "a", a, palm, t),
          embraceScene.region(film, "b", b, "abdomen", t),
        ),
    );
    checks.check(
      `${label}: at ${t.toFixed(2)} s the chest (${(chest * 1000).toFixed(0)} mm) and the chin (${(chin * 1000).toFixed(0)} mm) rest on the partner`,
      chest <= NEAR && chin <= NEAR,
    );
    checks.check(
      `${label}: at ${t.toFixed(2)} s the palms lie on the abdomen (${palms.map((p: number): string => (p * 1000).toFixed(0)).join(", ")} mm)`,
      palms.every((p: number): boolean => p <= PALM + a.measure.hand),
    );
  }
  const windows: readonly IAutoMovieMotionHumanContactWindow[] =
    act.plan.contacts.filter(
      (w: IAutoMovieMotionHumanContactWindow): boolean =>
        w.support.kind === "person" && w.support.subject === "b",
    );
  checks.check(
    `${label}: chest, chin and palms bear on the partner, the chest loaded`,
    windows.length === 4 &&
      windows.some(
        (w: IAutoMovieMotionHumanContactWindow): boolean =>
          w.part === "chest" && w.load !== undefined && w.load > 0,
      ),
  );
  motionActionUnit.bounds(checks, label, film, "a", act);
}
