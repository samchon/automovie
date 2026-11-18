import { resolveAutoMovieCenterOfMass } from "@automovie/engine";
import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanSegment } from "@automovie/interface";
import { HumanChain, HumanFoot, HumanPhysics } from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";
import { nclose } from "../internal/nclose";

/**
 * A supported bend preserves the hips under a requested correction and judges
 * only between the two authored instants inside its deepest hold.
 *
 * Scenarios:
 * 1. At the same target and strategy, request zero and full
 *    weight. The displayed segment masses project inside the soles, so no
 *    horizontal shift is required on either film.
 * 2. During the same held pose, sample on both sides of each window edge.
 *    Outside the window all weights retain the uncorrected hips, and the
 *    audit judges exactly the positive weights inside.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the authored range and the independent support observation.
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed hips and the audit decision on the same public films. Unnecessary displacement or an audit leaking outside its event window fails.
 * @evidence contracts/development/testing.md#independent-expectations The measured centre of mass inside the supporting soles requires zero translation. The clock comes from the authored offsets to the deepest event.
 * @evidence contracts/development/testing.md#distinguishing-cases Zero and full requests distinguish audit gating from a genuinely required displacement. The balance-window unit covers nonzero support projections and interpolated weights. The opening and closing margins remain inside the kinematic hold.
 * @evidence contracts/development/testing.md#execution-ownership Two films share one body and target. Each displayed hips position is read once per weight and instant.
 */
export function test_human_motion_bend_balance(): void {
  const findings: motionComplaints.IGatherer = motionComplaints();
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-large");
  const hold: number = 1;
  const weights: readonly number[] = [0, 1];
  const observations: Observation[] = weights.map((weight: number): Observation => {
    const film: motionHumanLaw.IFilm = motionHumanLaw.perform("signature", [{ subject: "a", body }], HumanChain.subject("a").bend({
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
    }));
    const span: IAutoMovieMotionHumanSegment = film.performance.segments("a")[0]!;
    const deepest: number = span.plan.events.find((event): boolean => event.name === "deepest")!.share;
    return { film, span, weight, start: span.start + deepest * span.plan.duration };
  });
  for (const fraction of [1 / 8, 3 / 8, 5 / 8, 7 / 8]) {
    const active: boolean = fraction > 1 / 4 && fraction < 3 / 4;
    const positions: number[] = observations.map(({ film, span, weight, start }: Observation): number => {
      const t: number = start + fraction * hold;
      findings.check(`weight ${weight} at hold fraction ${fraction}: balance audit`,
        HumanPhysics.judged(span, t) === (active && weight > 0));
      const bones: motionHumanLaw.Bones = film.bones("a", t);
      if (weight === 0) {
        const margin: number = resolveAutoMovieCenterOfMass.margin(
          resolveAutoMovieCenterOfMass.place(body.massModel, bones),
          HumanFoot.base(body, bones),
        );
        findings.check(`hold fraction ${fraction}: reference support margin ${margin * 1000} mm`, margin >= 0);
      }
      return bones.get("hips")!.worldPosition.z;
    });
    const shift: number = positions[1]! - positions[0]!;
    findings.check(`hold fraction ${fraction}: unnecessary shift ${shift * 1000} mm`, nclose(shift, 0, ROUND_OFF));
  }
  findings.assert("A supported bend keeps its hips and gates its balance audit");
}

/** The common world-frame tolerance used by the crouch balance specification. */
const ROUND_OFF: number = 1e-9;

/** A single placed bend and its authored hold origin in film seconds. */
interface Observation {
  film: motionHumanLaw.IFilm;
  span: IAutoMovieMotionHumanSegment;
  weight: number;
  start: number;
}
