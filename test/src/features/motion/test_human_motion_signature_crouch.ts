import { resolveAutoMovieCenterOfMass } from "@automovie/engine";
import { HumanFoot } from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanSignature as M } from "../internal/motionHumanSignature";

/**
 * A crouch looks like a human squat held in place, on the four extreme
 * bodies at both depths with the heels flat and raised, read over the held
 * span from the law's `lowest` to its `ascend`.
 *
 * Bounds and sources:
 * - Depth: a full (deep) squat folds the knees to about 150 degrees
 *   (Hemmerich, Brown, Smith, Marthandam and Wyss 2006, J Orthop Res
 *   24:770); a partial squat stops near a right angle or above (Escamilla
 *   2001, Med Sci Sports Exerc 33:127). Bound: full at least 120, partial in
 *   [40, 110] degrees (provisional limits).
 * - Heels: flat heels bear on the floor; raised heels stand off it. Bound:
 *   the heel sockets within 20 mm of the floor when flat, at least 30 mm
 *   above it when raised (provisional).
 * - Balance: a squat held still keeps the centre of mass over the feet,
 *   inside the base of support, or the body would topple (static
 *   equilibrium). Bound: the centre's margin inside the hull of both feet's
 *   soles is not negative at any held instant.
 * - Trunk: a squat inclines the trunk forward to bring the centre of mass
 *   over the feet as the hips go back, more the deeper it is (Hemmerich et
 *   al. 2006). Bound: mean inclination while held, measured from the body's
 *   own quiet stance, at least 0 degrees, and at least 5 for a full squat
 *   (provisional).
 *
 * The trunk is read as the line from the hip joints' midpoint to the
 * shoulder joints' midpoint, the trunk segment of the cited studies, and
 * the quiet stance must read within 3 degrees of vertical under it
 * (Kendall et al. 2005, ideal alignment; `motionHumanSignature.calibrate`).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real crouch on real bodies and reads displayed joints, soles and the centre of mass; a shallow full squat, a deep partial one, a heel that floats or sinks, a body balanced outside its feet or a trunk tipped back fails with its cell, value, bound and source.
 * @evidence contracts/development/testing.md#independent-expectations Every bound is a cited squat value, the static equilibrium, or marked provisional with its reason.
 * @evidence contracts/development/testing.md#distinguishing-cases Both depths, both heel postures and the default on four bodies.
 * @evidence contracts/development/testing.md#execution-ownership In memory; named `test_human_` because a film of fitted poses is costly, so the CI test job leaves it to local runs.
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status.
 */
export function test_human_motion_signature_crouch(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const name of motionHumanBody.EXTREMES)
    for (const row of [
      "default",
      "depth=partial",
      "depth=full",
      "heels=flat",
      "heels=up",
    ]) {
      const cell: string = `crouch ${row} ${name}`;
      const s: M.IStaged = M.stage("crouch", row, name);
      const from: number = M.event(s, "lowest")!;
      const to: number = M.event(s, "ascend")!;
      const ts: number[] = M.times(from, to, 30);
      const knee: number = M.mean(
        ts,
        (t) => (M.knee(s, t, "left") + M.knee(s, t, "right")) / 2,
      );
      const full: boolean = row === "depth=full";
      complaints.check(
        `${cell}: held knee flexion ${knee.toFixed(1)} deg outside ${full ? "[120, 180]" : "[40, 110]"} (Hemmerich et al. 2006; Escamilla 2001; provisional)`,
        full ? knee >= 120 : knee >= 40 && knee <= 110,
      );
      // A full squat raises the heels unless told otherwise (the law's
      // default); every other row is a partial squat.
      const raised: boolean = row === "heels=up" || full;
      const model = resolveAutoMovieCenterOfMass(
        s.body.skeleton,
        s.body.profile,
      );
      let low: number = Infinity;
      let high: number = -Infinity;
      let margin: number = Infinity;
      for (const t of ts) {
        const bones = M.bones(s, t);
        for (const side of ["left", "right"] as const) {
          const heel: number = HumanFoot.sockets(s.body, bones, side)[0]!.point
            .y;
          low = Math.min(low, heel);
          high = Math.max(high, heel);
        }
        margin = Math.min(
          margin,
          resolveAutoMovieCenterOfMass.margin(
            resolveAutoMovieCenterOfMass.place(model, bones),
            HumanFoot.base(s.body, bones),
          ),
        );
      }
      complaints.check(
        raised
          ? `${cell}: the heels stand ${(low * 1000).toFixed(0)} mm off the floor, at least 30 expected (provisional)`
          : `${cell}: the heels stand up to ${(high * 1000).toFixed(0)} mm off the floor, within 20 expected (provisional)`,
        raised ? low >= 0.03 : high <= M.CONTACT,
      );
      complaints.check(
        `${cell}: the centre of mass's margin inside the feet is ${(margin * 1000).toFixed(0)} mm while held, not negative expected (static equilibrium)`,
        margin >= 0,
      );
      // Relative to the body's own quiet stance, the reading the trunk's
      // landmarks give a standing body.
      const lean: number = M.mean(ts, (t) => M.trunk(s, t)) - M.upright(name);
      complaints.check(
        `${cell}: mean trunk inclination ${lean.toFixed(1)} deg ahead of the quiet stance while held, at least ${full ? 5 : 0} expected (Hemmerich et al. 2006; provisional)`,
        // A tenth of a degree for the reading's own sampling noise.
        lean >= (full ? 5 : 0) - 0.1,
      );
    }
  for (const name of motionHumanBody.EXTREMES)
    for (const c of M.calibrate(name)) complaints.check(c, false);
  complaints.assert("the crouch has the signature of a held squat");
}
