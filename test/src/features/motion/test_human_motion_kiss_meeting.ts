import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditPartner,
  HumanChain,
  HumanMutual,
  HumanRefusal,
} from "@automovie/motions";

import { MOTION_HUMAN_LAW_STAGES_TOUCH } from "../internal/MOTION_HUMAN_LAW_STAGES_TOUCH";
import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";
import type { motionHumanLawSweep } from "../internal/motionHumanLawSweep";
import { nclose } from "../internal/nclose";

/**
 * A kiss meets the partner's displayed surface. A hand-back target is an
 * articulated meeting between two bodies, while a head target rides the
 * partner's head. The two cases keep the existing extreme-body stages.
 *
 * Scenarios:
 * 1. The roles share the contact and parting instants. The lips meet the
 *    presented hand back within the kiss's 5 mm reach limit throughout
 *    that hold. The two bodies penetrate
 *    no more than the 10 mm skin limit.
 * 2. A forehead kiss keeps the same geometric and collision bounds.
 * 3. A forehead two statures away is refused on `region`, rather than
 *    moving the target or letting the lips miss.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two physical branches, the retained pairing, the independent contact observations and the out-of-reach case.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public kiss and reads both performers' actual regions at the event, inside the hold, and at release. A stale or one-person hand goal, missed lips, penetration, or a silently accepted miss fails.
 * @evidence contracts/development/testing.md#independent-expectations The witness uses the rigid transform of the rendered lip and partner surface, neither from the kiss plan. The law's 5 mm contact bound and the sweep's 10 mm skin bound remain unchanged.
 * @evidence contracts/development/testing.md#distinguishing-cases One articulated hand target, one head target, and a target outside any lean's reach. The existing touch mirror spec checks the opposite sides.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable in-memory test constructs two staged performances and an immediate public refusal, reading the partner audit over the selected successful films.
 */
export function test_human_motion_kiss_meeting(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const a: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const b: IAutoMovieMotionHumanBody = motionHumanBody("m-large");
  const regions: readonly AutoMovieHumanoidRegion[] = [
    "handBackLeft",
    "forehead",
  ];
  for (const region of regions) {
    const shared: boolean = region === "handBackLeft";
    const scene: motionHumanLawSweep.IScene =
      MOTION_HUMAN_LAW_STAGES_TOUCH.kiss!(
        (parameter: string): string | undefined =>
          parameter === "region" ? region : undefined,
        a,
        b,
      );
    try {
      const composition: motionHumanLawSweep.IScene["composition"] = shared
        ? HumanChain.mutual(
            HumanMutual.kiss,
            {
              kisser: HumanChain.subject("a"),
              kissed: HumanChain.subject("b"),
            },
            { region },
          ).node
        : scene.composition;
      const film: motionHumanLaw.IFilm = motionHumanLaw.perform(
        "sweep-2",
        scene.people,
        composition,
        scene.props,
      );
      const contact: number = motionHumanLaw.event(film, "contact");
      const part: number = motionHumanLaw.event(film, "part");
      all.check(`${region}: the contact precedes parting`, contact < part);
      if (shared) {
        all.check(
          "the presenter and the kisser have the same contact and parting seconds",
          nclose(contact, motionHumanLaw.event(film, "contact", "b")) &&
            nclose(part, motionHumanLaw.event(film, "part", "b")),
        );
      }
      const mouthFrame: IAutoMovieMotionHumanBody["surfaces"]["regions"]["mouth"] =
        a.surfaces.regions.mouth;
      const targetFrame: typeof mouthFrame = b.surfaces.regions[region];
      for (const seconds of [contact, (contact + part) / 2, part]) {
        const mouth: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
          mouthFrame,
          film.bones("a", seconds).get(mouthFrame.bone)!,
        ).point;
        const target: IAutoMovieVector3 =
          resolveAutoMovieHumanoidSurfaces.place(
            targetFrame,
            film.bones("b", seconds).get(targetFrame.bone)!,
          ).point;
        const gap: number = Vector3.distance(mouth, target);
        all.check(
          `${region}: the lips are ${gap * 1000} mm from the skin at ${seconds} s`,
          gap <= 0.005,
        );
      }
      const worst: ReturnType<
        typeof AutoMovieMotionHumanAuditPartner.measure
      >["worst"] = AutoMovieMotionHumanAuditPartner.measure(
        film,
        scene.people[0]!,
        scene.people[1]!,
      ).worst;
      all.check(
        `${region}: partner penetration ${worst.value * 1000} mm at ${worst.seconds} s (${worst.where})`,
        worst.value <= 0.01,
      );
    } catch (error) {
      all.check(`${region}: the kiss must play: ${String(error)}`, false);
    }
  }

  let refused: unknown;
  try {
    motionHumanLaw.perform(
      "kiss-reach",
      [
        { subject: "a", body: a },
        {
          subject: "b",
          body: b,
          at: { x: 0, y: 0, z: 2 * b.measure.stature },
          yaw: 180,
        },
      ],
      HumanChain.subject("a")
        .act("kiss", { partner: "b", region: "forehead" })
        .with(HumanChain.subject("b").stand({ seconds: 6, sway: 0 })),
    );
  } catch (error) {
    refused = error;
  }
  all.check(
    `beyond reach the kiss names its region: ${String(refused)}`,
    refused instanceof HumanRefusal &&
      refused.kind === "reach" &&
      refused.axis === "region",
  );
  all.assert(
    "the kiss meets the real skin only where both poses admit contact",
  );
}
