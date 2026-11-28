import { AutoMovieArchetypeBag } from "@automovie/archetypes";
import {
  AutoMovieEngineKinematics,
  AutoMovieEngineMotionSampling,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanTouch,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanObject,
  AutoMovieMotionHumanPerformance,
  AutoMovieMotionHumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { vclose } from "../../internal/vclose";

const CONTACT: number = 0.001;

/**
 * A hand can follow observed prop motion without redirecting its prior reach.
 *
 * An early and late movement of the same tote keep the displayed approach until
 * the prop moves. Both land on the moved floor. A fully authored reach can
 * anticipate the same movement, and the two modes agree for a stationary tote.
 * An unreachable site refuses at the played contact, including a cut on that
 * instant. Cutting before contact abandons the attempt.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names both tracking modes, the stationary control, early and late motion, played contact and abandonment.
 * @evidence contracts/development/testing.md#behavioral-verification Drives public Chain and Performance with a stock tote and a stored actor. Measures the displayed fingertip and the actual tote site, including reverse time reads and real flinch cuts.
 * @evidence contracts/development/testing.md#independent-expectations The tote has authored translation of 0.06 m or 1.1 m over 0.2 s. Before its cue the observed approach matches the static take, after a successful stroke the fingertip meets the moved interior, and the distant target is beyond the arm.
 */
export async function test_motions_touch_observed_prop(): Promise<void> {
  const body = await humanFixtureBody("m-average");
  const tote = AutoMovieArchetypeBag.create({
    kind: "tote",
    width: 0.3,
    height: 0.27,
    depth: 0.15,
  });
  const origin: IAutoMovieVector3 = { x: -0.17, y: 0.98, z: 0.34 };
  const take = (
    tracking: IAutoMovieMotionHumanTouch.IParams["tracking"],
    cue?: number,
    travel: number = 0,
    cut?: "early" | "contact",
  ): AutoMovieMotionHumanPerformance => {
    const reach = AutoMovieMotionHumanChain.subject("actor")
      .stand({ hold: 0.4 })
      .touch(
        {
          target: { kind: "prop", subject: "tote", point: "inside" },
          kind: "rub",
          hand: "right",
          effector: "fingertips",
          count: 3,
          hold: 0.3,
          ...(tracking === undefined ? {} : { tracking }),
        },
        "reach",
      );
    const chain =
      cut === undefined
        ? reach
        : reach
            .until(
              cut === "early"
                ? { type: "share", share: 0.08 }
                : { type: "event", event: "strokeEnd" },
            )
            .flinch({}, "withdraw");
    return new AutoMovieMotionHumanPerformance({
      seed: "moving contact",
      performers: [
        {
          subject: "actor",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        AutoMovieMotionHumanObject.prop(
          "tote",
          tote,
          { at: origin, yaw: 0 },
          cue === undefined
            ? undefined
            : (seconds) => ({
                at: {
                  ...origin,
                  x:
                    origin.x +
                    travel *
                      AutoMovieEngineMotionSampling.minimumJerkShare(
                        (seconds - cue) / 0.2,
                      ),
                },
                yaw: 0,
              }),
        ),
      ],
      composition: chain.node,
    });
  };
  const tip = (
    take: AutoMovieMotionHumanPerformance,
    seconds: number,
  ): IAutoMovieVector3 => {
    const frame = body.surfaces.regions.indexTipRight;
    return AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
      frame,
      take.bones("actor", seconds).get(frame.bone)!,
    ).point;
  };
  const contact = (take: AutoMovieMotionHumanPerformance): number =>
    take.instant({ of: "reach", event: "strokeEnd" });
  const meetsSite = (scene: AutoMovieMotionHumanPerformance): boolean => {
    const at: number = contact(scene);
    const expected: IAutoMovieVector3 = scene.site(
      "tote",
      "inside",
      at,
    ).position;
    return vclose(tip(scene, at), expected, CONTACT);
  };
  const baseline = take(undefined);
  const start = baseline.instant({ of: "reach", event: "start" });
  const ready = baseline.instant({ of: "reach", event: "ready" });
  const stationary = take("observed");
  TestValidator.equals(
    "stationary contact",
    contact(stationary),
    contact(baseline),
  );
  TestValidator.equals(
    "stationary approach",
    tip(stationary, (start + ready) / 2),
    tip(baseline, (start + ready) / 2),
  );
  TestValidator.predicate(
    "stationary displayed fingertip meets the site",
    meetsSite(stationary),
  );
  const early = start + 0.25 * (ready - start);
  const late = start + 0.7 * (ready - start);
  const authored = take(undefined, late, -0.06);
  TestValidator.predicate(
    "the authored motion can anticipate the prop's move and still lands",
    AutoMovieEngineVector3.distance(
      tip(baseline, late - 0.03),
      tip(authored, late - 0.03),
    ) > 0.01 && meetsSite(authored),
  );
  for (const cue of [early, late]) {
    const scene = take("observed", cue, -0.06);
    TestValidator.equals(
      "the moved prop does not retime the original approach",
      scene.instant({ of: "reach", event: "ready" }),
      ready,
    );
    TestValidator.predicate(
      "the played stroke lands on the moved site",
      meetsSite(scene),
    );
    TestValidator.equals(
      "approach before cue during a backward seek",
      tip(scene, cue - 0.03),
      tip(baseline, cue - 0.03),
    );
    TestValidator.predicate(
      "the authored cue keeps the approach within 1 mm",
      vclose(tip(scene, cue), tip(baseline, cue), CONTACT),
    );
  }

  const earlyCut = take("observed", late, -1.1, "early");
  TestValidator.predicate(
    "the early cut plays the withdrawal before the tote moves",
    earlyCut.instant({ of: "withdraw", event: "start" }) < late,
  );
  TestValidator.error("a cut discards the unplayed contact", () =>
    contact(earlyCut),
  );
  const exact = take("observed", late, -0.06, "contact");
  TestValidator.equals(
    "the exact cut retains the contact",
    contact(exact),
    exact.instant({ of: "withdraw", event: "start" }),
  );
  TestValidator.predicate("contact at the cut still lands", meetsSite(exact));
  for (const cut of [undefined, "contact"] as const) {
    let refused: boolean = false;
    try {
      take("observed", late, -1.1, cut);
    } catch (error: unknown) {
      refused =
        error instanceof AutoMovieMotionHumanRefusal &&
        error.kind === "reach" &&
        error.axis === "region" &&
        typeof error.value === "number" &&
        error.value > 0.5 &&
        error.reason.includes("strokeEnd");
    }
    TestValidator.predicate("a played unreachable contact refuses", refused);
  }
}
