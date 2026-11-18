import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanSegment } from "@automovie/interface";
import { HumanChain, HumanPhysics } from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";
import { nclose } from "../internal/nclose";

/**
 * A bend applies the requested fraction of the horizontal hips correction
 * only between the two authored instants inside its deepest hold.
 *
 * Scenarios:
 * 1. At the same target and strategy, request zero, one quarter and full
 *    weight. The full request moves the displayed hips along the forward
 *    axis. The quarter request covers one quarter of that distance.
 * 2. During the same held pose, sample on both sides of each window edge.
 *    Outside the window all weights retain the uncorrected hips, and the
 *    audit judges exactly the positive weights inside.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the authored range, the measured component and the affine relation.
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed hips and the audit decision on the same public films. A weight treated as a switch or a correction leaking outside its event window fails.
 * @evidence contracts/development/testing.md#independent-expectations All three films hold the same uncorrected key. The balance contract defines weight as the fraction of the full shift, so their signed offsets must interpolate linearly.
 * @evidence contracts/development/testing.md#distinguishing-cases The zero endpoint, one interior weight and the full endpoint distinguish a disabled shift, positive boolean and affine weighting. The opening and closing margins remain inside the kinematic hold.
 * @evidence contracts/development/testing.md#execution-ownership Three films share one body and target. Each displayed hips position is read once per weight and instant.
 */
export function test_human_motion_bend_balance(): void {
  const findings: motionComplaints.IGatherer = motionComplaints();
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-large");
  const hold: number = 1;
  const weights = [0, 1 / 4, 1] as const;
  const films: motionHumanLaw.IFilm[] = weights.map((weight: number): motionHumanLaw.IFilm =>
    motionHumanLaw.perform("signature", [{ subject: "a", body }], HumanChain.subject("a").bend({
      strategy: "stoop",
      side: "right",
      hold,
      toward: { kind: "point", frame: "world", at: {
        x: -0.15, y: body.measure.ankleHeight + 0.6 * body.measure.shank, z: 0.45,
      } },
      balance: {
        by: "hips", weight,
        from: { event: "deepest", offset: hold / 4 },
        to: { event: "deepest", offset: (3 * hold) / 4 },
      },
    })),
  );
  for (const fraction of [1 / 8, 3 / 8, 5 / 8, 7 / 8]) {
    const active: boolean = fraction > 1 / 4 && fraction < 3 / 4;
    const positions: number[] = films.map((film: motionHumanLaw.IFilm, i: number): number => {
      const t: number = motionHumanLaw.event(film, "deepest") + fraction * hold;
      const span: IAutoMovieMotionHumanSegment = film.performance.segments("a")[0]!;
      findings.check(`weight ${weights[i]} at hold fraction ${fraction}: balance audit`,
        HumanPhysics.judged(span, t) === (active && weights[i]! > 0));
      return film.bones("a", t).get("hips")!.worldPosition.z;
    });
    const full: number = positions[2]! - positions[0]!;
    const quarter: number = positions[1]! - positions[0]!;
    findings.check(`hold fraction ${fraction}: observed full shift ${full} m`,
      active ? !nclose(full, 0, ROUND_OFF) : nclose(full, 0, ROUND_OFF));
    findings.check(`hold fraction ${fraction}: observed quarter shift ${quarter} m, full shift ${full} m`,
      nclose(quarter, active ? full / 4 : 0, ROUND_OFF));
  }
  findings.assert("A bend scales and gates its horizontal balance correction");
}

/** Roundoff in subtracting and interpolating world positions in metres. */
const ROUND_OFF: number = 1e-9;
