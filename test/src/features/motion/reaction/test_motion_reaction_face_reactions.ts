import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieComposition,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTouch,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HUMAN_EVERYDAY_LAWS } from "@automovie/motions/internal";

import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";
import { motionHumanLaw } from "../../internal/motionHumanLaw";

const { AutoMovieMotionHumanTouchEffector } = AutoMovieMotionHumanTouch;

/**
 * Registered face reactions on an average man and a small woman.
 *
 * Scenarios:
 *
 * 1. Each hand wipes above and below its own cheek while the idle hand stays down.
 * 2. Both palms stay near their own cheeks through the cover, then return to rest.
 * 3. A reversed hold range is refused before any draw.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the cast and each observable distinction between the reactions.
 * @evidence contracts/development/testing.md#behavioral-verification Calls each typed registered action and measures the palms and cheek regions from displayed bones across its working phase.
 * @evidence contracts/development/testing.md#independent-expectations Half a hand's width approximated as a quarter of its length bounds where a palm reads as covering the cheek. An eighth of a hand's length distinguishes a wipe from a hold. The rest limit belongs to the existing hand-to-face motion spec. These tolerances describe visible movements, without prescribing an exact trajectory.
 * @evidence contracts/development/testing.md#distinguishing-cases Two builds, both unilateral sides with an idle-hand negative, a bilateral hold with an explicit duration and a return sample.
 * @evidence contracts/development/testing.md#execution-ownership This named, synchronous feature test builds registered performances in memory and owns both reactions' cases.
 */
export function test_motion_reaction_face_reactions(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const chain = HumanChain.extend(HUMAN_EVERYDAY_LAWS);
  const effector: IAutoMovieMotionHumanTouchEffector.IEffector = {
    surface: "palm",
    shape: "flat",
  };
  for (const name of ["m-average", "f-small"] as const) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
      /** Play one registered reaction from quiet standing. */
      const film = (composition: IAutoMovieComposition): motionHumanLaw.IFilm =>
        motionHumanLaw.film(
          new HumanPerformance({
            seed: "face-reactions",
            laws: Object.values(HUMAN_EVERYDAY_LAWS),
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
      /** The displayed palm's offset from the cheek it should cover. */
      const cheekOffset = (
        take: motionHumanLaw.IFilm,
        side: AutoMovieHumanSide,
        at: number,
      ): IAutoMovieVector3 => {
        const bones = take.bones("a", at);
        const region =
          body.surfaces.regions[side === "right" ? "cheekRight" : "cheekLeft"];
        const cheek = resolveAutoMovieHumanoidSurfaces.place(
          region,
          bones.get(region.bone)!,
        );
        return Vector3.subtract(
          AutoMovieMotionHumanTouchEffector.point(body, bones, side, effector),
          cheek.point,
        );
      };

      for (const side of ["right", "left"] as const) {
        const idle: AutoMovieHumanSide = side === "right" ? "left" : "right";
        const wipe: motionHumanLaw.IFilm = film(
          chain.subject("a").wipeTears({ hand: side }).node,
        );
        const arrival: number = motionHumanLaw.event(wipe, "atCheek");
        const end: number = motionHumanLaw.event(wipe, "taskEnd");
        const early: number = arrival + (end - arrival) / 4;
        const late: number = end - (end - arrival) / 4;
        const above: number = cheekOffset(wipe, side, early).y;
        const below: number = cheekOffset(wipe, side, late).y;
        checks.check(
          `${name} ${side} palm reaches its own cheek and travels vertically`,
          Vector3.length(cheekOffset(wipe, side, arrival)) <=
            body.measure.hand / 4 &&
            above > 0 &&
            below < 0 &&
            above - below >= body.measure.hand / 8,
        );
        checks.check(
          `${name} ${idle} palm stays at rest during the wipe`,
          Vector3.length(
            Vector3.subtract(palm(wipe, idle, early), palm(wipe, idle, 0)),
          ) <= 0.01,
        );
      }

      const cover: motionHumanLaw.IFilm = film(
        chain.subject("a").coverFace({ hold: 0.8 }).node,
      );
      const arrival: number = motionHumanLaw.event(cover, "atFace");
      const held: number = motionHumanLaw.event(cover, "taskEnd");
      const leave: number = motionHumanLaw.event(cover, "relax");
      checks.check(
        `${name} adds at least 0.8 s of cover after the stroke`,
        leave - held >= 0.8 - 0.001,
      );
      for (const side of ["right", "left"] as const) {
        checks.check(
          `${name} ${side} palm covers its own cheek throughout the hold`,
          [arrival, held, (held + leave) / 2, leave].every(
            (at: number): boolean =>
              Vector3.length(cheekOffset(cover, side, at)) <=
              body.measure.hand / 4,
          ),
        );
        checks.check(
          `${name} ${side} palm returns within 10 mm of rest`,
          Vector3.length(
            Vector3.subtract(
              palm(cover, side, cover.duration),
              palm(cover, side, 0),
            ),
          ) <= 0.01,
        );
      }
      if (name === "m-average") {
        let refused: unknown;
        try {
          film(
            chain.subject("a").coverFace({ hold: { between: [1, 0] } }).node,
          );
        } catch (error: unknown) {
          refused = error;
        }
        checks.check(
          "a reversed cover hold range is refused on its upper bound",
          refused instanceof HumanRefusal &&
            refused.axis === "seconds.between[1]",
        );
      }
    } catch (error: unknown) {
      checks.check(`${String(name)}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.assert("reaction face reactions");
}
