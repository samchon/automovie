import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";
import { HumanChain } from "@automovie/motions";
import { AutoMovieMotionHumanAuditDifference } from "@automovie/motions/internal";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionContactArmFixture as fixture } from "../../../features/internal/motionContactArmFixture";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../features/internal/motionHumanLaw";

/**
 * A palm travels tangentially across a partner's moving upper back and the opposite hand mirrors its placement.
 *
 * Scenarios:
 * 1. Hold a passive partner facing away and read the contacting palm and independently posed upper-back site together.
 * 2. Reverse the active hand on the same still partner and reflect the entire displayed arm path.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A palm travels tangentially across a partner's moving upper back and the opposite hand mirrors its placement.
 * @evidence contracts/development/testing.md#independent-expectations The public skin bound is 10 mm. The mirror relation requires all body points to reflect within 5 mm, independently of the target solver.
 * @evidence contracts/development/testing.md#distinguishing-cases Hold a passive partner facing away and read the contacting palm and independently posed upper-back site together. Reverse the active hand on the same still partner and reflect the entire displayed arm path.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_support_supporting_partner_touch(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const perform = (
    side: AutoMovieHumanSide,
    sway?: number,
  ): motionHumanLaw.IFilm =>
    motionHumanLaw.perform(
      "rub-back",
      [
        { subject: "a", body },
        { subject: "b", body, at: { x: 0, y: 0, z: 0.45 }, yaw: 0 },
      ],
      HumanChain.subject("b")
        .stand(sway === undefined ? { hold: 8 } : { hold: 8, sway })
        .with(
          HumanChain.subject("a").touch({
            target: { kind: "person", subject: "b", region: "upperBack" },
            kind: "rub",
            hand: side,
          }),
        ),
    );
  const film: motionHumanLaw.IFilm = perform("right");
  const ready: number = motionHumanLaw.event(film, "ready");
  const relax: number = motionHumanLaw.event(film, "relax");
  const all: motionComplaints.IGatherer = motionComplaints();
  for (const t of [ready, relax]) {
    const skin: number = fixture.skin(
      body,
      film.bones("a", t),
      "right",
      fixture.site(body, film.bones("b", t), "upperBack"),
    );
    all.check(
      `partner skin distance at ${t}: ${skin} m`,
      Math.abs(skin) <= 0.01,
    );
  }
  const symmetry: ReturnType<
    typeof AutoMovieMotionHumanAuditDifference.measure
  > = AutoMovieMotionHumanAuditDifference.measure(
    perform("right", 0),
    perform("left", 0),
    "a",
    { mirror: 0, rate: 4 },
  );
  all.check(
    `reflected arm misses by ${symmetry.distance.value} m on ${symmetry.distance.where}`,
    symmetry.distance.value <= 0.005,
  );
  all.assert("the supporting partner supplies the moving target frame");
}
