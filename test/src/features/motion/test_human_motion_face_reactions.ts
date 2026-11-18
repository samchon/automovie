import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieComposition,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTouchEffector,
  HumanChain,
  HumanPerformance,
  coverFace,
  wipeTears,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";

/**
 * Registered face reactions on an average man and a small woman.
 *
 * Scenarios:
 *
 * 1. Each hand can wipe its own cheek with vertical travel while the idle hand stays down.
 * 2. Both palms stay near their own cheeks through the cover, then return to rest.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the cast and each observable distinction between the reactions.
 * @evidence contracts/development/testing.md#behavioral-verification Calls each typed registered action and measures the palms and cheek regions from displayed bones across its working phase.
 * @evidence contracts/development/testing.md#independent-expectations Half a hand's width approximated as a quarter of its length bounds where a palm reads as covering the cheek. An eighth of a hand's length distinguishes a wipe from a hold. The rest limit belongs to the existing hand-to-face motion spec. These tolerances describe visible movements, without prescribing an exact trajectory.
 * @evidence contracts/development/testing.md#distinguishing-cases Two builds, both unilateral sides with an idle-hand negative, a bilateral hold with an explicit duration and a return sample.
 * @evidence contracts/development/testing.md#execution-ownership This named, synchronous feature test builds registered performances in memory and owns both reactions' cases.
 */
export function test_human_motion_face_reactions(): void {
  const chain = HumanChain.extend({ wipeTears, coverFace });
  const effector: IAutoMovieMotionHumanTouchEffector.IEffector = {
    surface: "palm",
    shape: "flat",
  };
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    /** Play one registered reaction from quiet standing. */
    const film = (composition: IAutoMovieComposition): motionHumanLaw.IFilm =>
      motionHumanLaw.film(
        new HumanPerformance({
          seed: "face-reactions",
          laws: [wipeTears, coverFace],
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          composition,
        }),
      );
    /** The palm's displayed position. */
    const palm = (
      take: motionHumanLaw.IFilm,
      side: AutoMovieHumanSide,
      at: number,
    ): IAutoMovieVector3 =>
      AutoMovieMotionHumanTouchEffector.point(
        body,
        take.bones("a", at),
        side,
        effector,
      );
    /** The palm's distance from the cheek its side should cover. */
    const cheekGap = (
      take: motionHumanLaw.IFilm,
      side: AutoMovieHumanSide,
      at: number,
    ): number => {
      const region =
        body.surfaces.regions[side === "right" ? "cheekRight" : "cheekLeft"];
      const cheek = resolveAutoMovieHumanoidSurfaces.place(
        region,
        take.bones("a", at).get(region.bone)!,
      );
      return Vector3.length(
        Vector3.subtract(palm(take, side, at), cheek.point),
      );
    };

    for (const side of ["right", "left"] as const) {
      const idle: AutoMovieHumanSide = side === "right" ? "left" : "right";
      const wipe: motionHumanLaw.IFilm = film(
        chain.subject("a").wipeTears({ side }).node,
      );
      const arrival: number = motionHumanLaw.event(wipe, "atCheek");
      const end: number = motionHumanLaw.event(wipe, "taskEnd");
      const early: number = arrival + (end - arrival) / 4;
      const late: number = end - (end - arrival) / 4;
      TestValidator.predicate(
        `${name} ${side} palm reaches its own cheek and travels vertically`,
        cheekGap(wipe, side, arrival) <= body.measure.hand / 4 &&
          palm(wipe, side, early).y - palm(wipe, side, late).y >=
            body.measure.hand / 8,
      );
      TestValidator.predicate(
        `${name} ${idle} palm stays at rest during the wipe`,
        Vector3.length(
          Vector3.subtract(palm(wipe, idle, early), palm(wipe, idle, 0)),
        ) <= 0.01,
      );
    }

    const cover: motionHumanLaw.IFilm = film(
      chain.subject("a").coverFace({ seconds: 0.8 }).node,
    );
    const arrival: number = motionHumanLaw.event(cover, "atFace");
    const held: number = motionHumanLaw.event(cover, "taskEnd");
    const leave: number = motionHumanLaw.event(cover, "relax");
    TestValidator.predicate(
      `${name} adds at least 0.8 s of cover after the stroke`,
      leave - held >= 0.8 - 0.001,
    );
    for (const side of ["right", "left"] as const) {
      TestValidator.predicate(
        `${name} ${side} palm covers its own cheek throughout the hold`,
        [arrival, held, (held + leave) / 2, leave].every(
          (at: number): boolean =>
            cheekGap(cover, side, at) <= body.measure.hand / 4,
        ),
      );
      TestValidator.predicate(
        `${name} ${side} palm returns within 10 mm of rest`,
        Vector3.length(
          Vector3.subtract(
            palm(cover, side, cover.duration),
            palm(cover, side, 0),
          ),
        ) <= 0.01,
      );
    }
  }
}
