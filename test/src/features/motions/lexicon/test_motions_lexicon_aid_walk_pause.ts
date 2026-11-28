import { AutoMovieArchetypeMobilityAid } from "@automovie/archetypes";
import {
  AutoMovieEngineKinematics,
  AutoMovieEnginePhysics,
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidSocket,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanAidWalk,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanGait,
  AutoMovieMotionHumanObject,
  AutoMovieMotionHumanPerformance,
  AutoMovieMotionHumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { vclose } from "../../internal/vclose";

/**
 * A walker and a cane stop after the first station on a level floor. Both feet
 * stay planted and the supporting hands keep their grips until the next
 * advance. Leaving the hold empty preserves the ordinary route.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Locates the stop between route stations, identifies which contacts remain, and states the omitted-hold behavior.
 * @evidence contracts/development/testing.md#behavioral-verification Plays the same three-station route with and without a hold through each stock aid, compares posed feet and material grips during the hold, and checks that an invalid duration is refused.
 * @evidence contracts/development/testing.md#independent-expectations A quarter of the first 0.84-second advance gives 0.21 seconds of preparation. Both feet reach the stop at 1.05, the 0.48-second hold ends at 1.53, and the next lift comes after that. The first mark is 0.12 m forward. The hold adds time while preserving the route's last frame.
 */
export async function test_motions_lexicon_aid_walk_pause(): Promise<void> {
  const body = await humanFixtureBody("m-average");
  const law = AutoMovieMotionHumanGait.aidWalk;
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const paused: number = 0.48;
  const soleSockets: readonly AutoMovieHumanoidSocket[] = [
    "soleLeft",
    "soleRight",
    "toeLeft",
    "toeRight",
  ];

  for (const kind of ["walker", "cane"] as const) {
    const walker: boolean = kind === "walker";
    const start: IAutoMovieVector3 = walker
      ? { x: 0, y: 0, z: 0.13 }
      : { x: -0.29, y: 0, z: 0.16 };
    const aid = AutoMovieMotionHumanObject.prop(
      "aid",
      AutoMovieArchetypeMobilityAid.create({ kind, height: 0.9 }),
      { at: start, yaw: 0 },
    );
    const route = (pause?: number): IAutoMovieMotionHumanAidWalk => ({
      kind,
      prop: "aid",
      origin,
      stations: [
        { x: 0, z: 0.12, seconds: 0.84, pause },
        { x: 0.018, z: 0.24, turn: 8, seconds: 0.9 },
        { x: 0.049, z: 0.34, turn: 15, seconds: 1.05 },
      ],
    });
    const play = (pause?: number): AutoMovieMotionHumanPerformance => {
      const params: IAutoMovieMotionHumanAidWalk = route(pause);
      return new AutoMovieMotionHumanPerformance({
        seed: "stock-aid-pause",
        performers: [
          {
            subject: "actor",
            body,
            at: origin,
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        props: [{ ...aid, motion: law.track(aid.frame, params) }],
        laws: [law],
        composition: AutoMovieMotionHumanChain.subject("actor").registered(
          "aidWalk",
          params,
          "route",
        ).node,
      });
    };
    const scene: AutoMovieMotionHumanPerformance = play(paused);
    const ordinary: AutoMovieMotionHumanPerformance = play();
    const zero: AutoMovieMotionHumanPerformance = play(0);
    const at = (film: AutoMovieMotionHumanPerformance, event: string): number =>
      film.instant({ of: "route", event });
    const stop: number = at(scene, "aidPause1");
    const resume: number = at(scene, "aidResume1");
    TestValidator.predicate(
      `${kind} completes both steps before stopping and then advances again`,
      Math.abs(at(scene, "aidReady") - 0.21) < 1e-9 &&
        Math.abs(at(scene, "aidPlant1") - 0.49) < 1e-9 &&
        Math.abs(stop - 1.05) < 1e-9 &&
        Math.abs(resume - 1.53) < 1e-9 &&
        Math.abs(at(scene, "aidPlant2") - 1.83) < 1e-9 &&
        Math.abs(scene.duration - ordinary.duration - paused) < 1e-9 &&
        scene.site("aid", "tip", resume + 0.15).position.y > 0.03,
    );

    const point = (
      frame: IAutoMovieHumanoidSurfaces.IFrame,
      seconds: number,
    ): IAutoMovieVector3 =>
      AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePoint(
        frame,
        scene.bones("actor", seconds).get(frame.bone)!,
      );
    const parked = scene.prop("aid", stop);
    const originalTip = scene.site("aid", "tip", 0).position;
    const props = scene.segments("actor")[0]!.plan;
    const sides = walker ? (["left", "right"] as const) : (["right"] as const);
    const grips = sides.map((side) => {
      const name = walker ? `${side}Grip` : "grip";
      const site = scene.site("aid", name, stop).position;
      const nearest = aid
        .shapes!.map((shape) => ({
          shape,
          gap: AutoMovieEnginePhysics.physicalShapeSegmentDistance(
            parked,
            shape,
            site,
            site,
          ),
        }))
        .sort((a, b) => a.gap - b.gap)[0]!.shape;
      return { side, shape: nearest };
    });
    const floor = soleSockets.map((socket) =>
      point(body.surfaces.sockets[socket], stop),
    );
    for (const seconds of [
      stop,
      stop + 0.12,
      stop + 0.24,
      stop + 0.36,
      resume,
    ]) {
      const tip = scene.site("aid", "tip", seconds).position;
      const frame = scene.prop("aid", seconds);
      TestValidator.predicate(
        `${kind} and both feet stay planted during the hold at ${seconds}`,
        vclose(tip, { ...originalTip, z: originalTip.z + 0.12 }, 1e-6) &&
          vclose(frame.position, parked.position, 1e-6) &&
          floor.every((place, i) => {
            const sole = point(body.surfaces.sockets[soleSockets[i]!], seconds);
            return Math.abs(sole.y) < 0.015 && vclose(sole, place, 0.002);
          }),
      );
      for (const { side, shape } of grips) {
        const palm = point(
          body.surfaces.regions[side === "left" ? "palmLeft" : "palmRight"],
          seconds,
        );
        const share = seconds / props.duration;
        TestValidator.predicate(
          `${kind} keeps its ${side} hand on the same material rod at ${seconds}`,
          props.contacts.some(
            (contact) =>
              contact.part === `${side}Hand` &&
              contact.kind === "grip" &&
              contact.support.kind === "prop" &&
              contact.support.subject === "aid" &&
              contact.from <= share &&
              share <= contact.to,
          ) &&
            Math.abs(
              AutoMovieEnginePhysics.physicalShapeSegmentDistance(
                frame,
                shape,
                palm,
                palm,
              ),
            ) <= 0.011,
        );
      }
    }

    const finish = scene.prop("aid", scene.duration);
    const uninterrupted = ordinary.prop("aid", ordinary.duration);
    TestValidator.predicate(
      `${kind} preserves its unpaused route and ends on the same final mark`,
      vclose(finish.position, uninterrupted.position, 1e-9) &&
        AutoMovieEngineQuaternion.angle(
          finish.rotation,
          uninterrupted.rotation,
        ) < 1e-6 &&
        scene.site("aid", "tip", scene.duration).position.y < 1e-6 &&
        zero.duration === ordinary.duration &&
        at(zero, "aidPlant2") === at(ordinary, "aidPlant2") &&
        vclose(
          zero.prop("aid", 1.2).position,
          ordinary.prop("aid", 1.2).position,
          1e-9,
        ),
    );
    for (const invalid of [-0.01, NaN, Infinity]) {
      let refused: boolean = false;
      try {
        law.track(aid.frame, route(invalid));
      } catch (error: unknown) {
        refused =
          error instanceof AutoMovieMotionHumanRefusal &&
          error.axis === "pause";
      }
      TestValidator.predicate(
        `${kind} refuses the invalid hold ${invalid}`,
        refused,
      );
    }
  }
}
