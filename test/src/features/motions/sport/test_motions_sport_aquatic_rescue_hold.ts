import {
  AutoMovieEngineKinematics,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanPerformance,
  AutoMovieMotionHumanSwim,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { HumanHand } from "../../../../../packages/motions/src/posture/internal/HumanHand";
import { assertTakeClean } from "../../internal/assertTakeClean";
import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * A rescuer and a towed performer share the cross-chest hold as the victim
 * reclines and the pair advances. Two different bodies keep the displayed palm
 * on the victim's sternum through the end. The film-rate audit checks the
 * approach, digits and kick against the performers' colliders.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the paired action, the measured surfaces and the scope of the audit.
 * @evidence contracts/development/testing.md#behavioral-verification Composes a rescuer and a victim through the public SDK on two canonical bodies. Reads their displayed arm and chest on the same film clock, and runs the native verdict report.
 * @evidence contracts/development/testing.md#independent-expectations Uses a 10 mm surface gap and the real water plane, with the expected hold time taken from the rescuer's named cue and the sternum placed from the victim's resolved bone.
 */
export function test_motions_sport_aquatic_rescue_hold(): void {
  for (const profile of ["m-average", "f-average"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(profile);
    const edge = { x: 0, y: 0, z: 0 };
    const film = new AutoMovieMotionHumanPerformance({
      seed: "rescue",
      laws: [AutoMovieMotionHumanSwim.aquatic],
      performers: [
        {
          subject: "victim",
          body,
          at: { x: 0, y: -1.4, z: 3 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "rescuer",
          body,
          at: { x: 1.5, y: -1.4, z: 6 },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      composition: AutoMovieMotionHumanChain.subject("rescuer")
        .registered(
          "aquatic",
          {
            kind: "rescueTow",
            water: 0,
            partner: "victim",
            at: edge,
            duration: 20,
          },
          "rescue",
        )
        .with(
          AutoMovieMotionHumanChain.subject("victim")
            .registered("aquatic", { kind: "distress", water: 0, duration: 40 })
            .registered("aquatic", {
              kind: "towed",
              water: 0,
              partner: "rescuer",
              at: edge,
            })
            .sync({ of: "rescue", event: "hold" }),
        ).node,
    });
    const tow: IAutoMovieMotionHumanSegment = film.segments("victim")[1]!;
    const rescuer: IAutoMovieMotionHumanSegment = film.segments("rescuer")[0]!;
    const hold = rescuer.plan.events.find((event) => event.name === "hold")!;
    TestValidator.predicate(
      profile + " begins towing at the same hold instant",
      Math.abs(
        tow.start - (rescuer.start + hold.share * rescuer.plan.duration),
      ) < 1e-6,
    );

    const sternum = body.surfaces.regions.sternum;
    const mouth = body.surfaces.regions.mouth;
    let gap: number = 0;
    let clearance: number = Infinity;
    for (let i = 0; i <= 30; ++i) {
      const seconds: number = tow.start + ((tow.end - tow.start) * i) / 30;
      const bones = film.bones("victim", seconds);
      const chest =
        AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
          sternum,
          bones.get(sternum.bone)!,
        );
      const mouthPoint =
        AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePoint(
          mouth,
          bones.get(mouth.bone)!,
        );
      const palm = HumanHand.frame(
        body,
        film.bones("rescuer", seconds),
        "left",
        "palm",
      );
      gap = Math.max(
        gap,
        AutoMovieEngineVector3.distance(palm.point, chest.point),
      );
      clearance = Math.min(clearance, mouthPoint.y);
    }
    TestValidator.predicate(
      profile + " retains the displayed palm on the sternum",
      gap < 0.01,
    );
    TestValidator.predicate(
      profile + " keeps the face above the water",
      clearance > 0,
    );
    assertTakeClean(profile + " paired rescue", film);
  }
}
