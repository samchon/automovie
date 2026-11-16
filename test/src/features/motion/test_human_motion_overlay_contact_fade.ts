import { Vector3 } from "@automovie/engine";
import {
  HumanCarried,
  HumanCarriedCoupling,
  HumanChain,
  HumanPerformance,
  HumanSignature,
  HumanVerdicts,
  type IHumanContactWindow,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A carrier keeps both palms on the carried body through the last instant
 * of a declared hold, even where the overlay gives its channels back.
 * The 10 mm acceptance is the campaign's coupled-contact bound (#3349),
 * shared with HumanVerdicts.SKIN; no fade length enters this expectation.
 *
 * Scenarios, the large man carrying the small woman in a piggyback and a
 * cradle over a 2.5 s stand, with the hold lasting 2 s:
 * 1. Every palm the coupling says bears the body has the reciprocal grip
 *    window, naming that body and its actual held region until share 1.
 * 2. From 0.5 s, after the hands have taken hold, through exactly 2 s,
 *    sampled at 40 Hz, the displayed palm remains within 10 mm of the
 *    displayed held region. This includes the whole departing edge and
 *    the last instant, rather than stopping before a fade might start.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the public bearing/borne laws as an overlay and measures the two displayed surfaces, so fading a palm away while its window is open fails with its carry, hand, time and distance.
 * @evidence contracts/development/testing.md#independent-expectations The 10 mm coupled-contact bound is stated by #3349 and the existing carry tests; the test reads actual body surfaces independently of a goal or solver residual.
 * @evidence contracts/development/testing.md#distinguishing-cases Two different two-hand carries on an opposite-build pair, their reciprocal declarations and their displayed contact from the hold through its exact end.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon bodies and two short in-memory public performances; normal feature-test discovery runs the regression without capture or a viewer.
 * @evidence contracts/development/common.md#meaningful-documentation States the bug's observable rule, the bound and both scenarios.
 */
export function test_human_motion_overlay_contact_fade(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const bodies = {
    a: motionHumanBody("m-large"),
    b: motionHumanBody("f-small"),
  };
  for (const carry of ["piggyback", "cradle"] as const) {
    try {
      const coupling = HumanCarriedCoupling.couple(
        bodies.a,
        bodies.b,
        HumanCarried.CARRIES[carry],
        carry,
      );
      const film: HumanPerformance = new HumanPerformance({
        seed: "overlay-contact-fade",
        laws: [HumanCarried.bearing, HumanCarried.borne],
        performers: (["a", "b"] as const).map((subject) => ({
          subject,
          body: bodies[subject],
          at: { x: 0, y: 0, z: subject === "a" ? 0 : -0.3 },
          yaw: 0,
          proficiency: { level: "trained" as const },
        })),
        composition: HumanChain.subject("a")
          .stand({ seconds: 2.5, sway: 0 })
          .over((o) => o.registered("bearing", { carry, of: "b", seconds: 2 }))
          .with(
            HumanChain.subject("b").registered("borne", {
              by: "a",
              carry,
              seconds: 2,
            }),
          ).node,
      });
      const windows: readonly IHumanContactWindow[] =
        film.overlays("a")[0]!.plan.contacts;
      const a: HumanSignature.IReader = HumanSignature.of(
        film,
        "a",
        bodies.a,
        0,
      );
      const b: HumanSignature.IReader = HumanSignature.of(
        film,
        "b",
        bodies.b,
        0,
      );
      const holds = coupling.contacts.filter(
        (c) =>
          c.kind === "bear" &&
          c.on.role === coupling.bearer &&
          (c.on.region === "palmLeft" || c.on.region === "palmRight"),
      );
      all.check(
        `${carry}: two holding palms expected, read ${holds.length}`,
        holds.length === 2,
      );
      for (const contact of holds) {
        const part: "leftHand" | "rightHand" =
          contact.on.region === "palmLeft" ? "leftHand" : "rightHand";
        all.check(
          `${carry}: ${part} declares a grip on b's ${contact.region} through share 1`,
          windows.some(
            (w) =>
              w.part === part &&
              w.kind === "grip" &&
              w.to === 1 &&
              w.support.kind === "person" &&
              w.support.subject === "b" &&
              "region" in w.support &&
              w.support.region === contact.region,
          ),
        );
        let worst: { gap: number; seconds: number } = { gap: 0, seconds: 0 };
        for (let frame: number = 20; frame <= 80; frame++) {
          const seconds: number = frame / 40;
          const gap: number = Vector3.length(
            Vector3.subtract(
              HumanSignature.region(a, contact.on.region, seconds),
              HumanSignature.region(b, contact.region, seconds),
            ),
          );
          if (gap > worst.gap) worst = { gap, seconds };
        }
        all.check(
          `${carry}: ${part} is ${(worst.gap * 1000).toFixed(3)} mm off ${contact.region} at ${worst.seconds.toFixed(4)} s, at most ${HumanVerdicts.SKIN * 1000} mm expected`,
          worst.gap <= HumanVerdicts.SKIN,
        );
      }
    } catch (error) {
      all.check(
        `${carry}: expected the public contact performance to plan, read ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  }
  all.assert("an overlay keeps contact through its declared window");
}
