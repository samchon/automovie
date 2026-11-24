import { createHorse } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanSignature } from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { mountedHorseScene } from "../../../features/internal/mountedHorseScene";

/** The campaign's held-contact bound, metres. */
const CONTACT: number = 0.01;

/** Seconds the horse stands: the whole take. */
const WAIT: number = 8;

/** The grades the horse stands on, degrees nose up: a steep road's uphill and downhill. */
const GRADES: readonly number[] = [8, -8];

/**
 * Getting into a saddle that is already pitched: the horse stands on an
 * uphill or a downhill grade while the rider sits on, rides on with the
 * stirrups and reins and holds the seat.
 *
 * Scenarios:
 * 1. On each grade, the displayed seat region, read in the saddle's own frame once the sit and the ride's entry have settled, lies within 10 mm of where it lies on a level horse (the campaign's held-contact bound): the seat is placed against the saddle's actual pitched frame, not its level heading.
 * 2. On each grade both balls of the feet lie within 10 mm of their stirrups' treads, as on the level.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the take, both scenarios and the bound's source.
 * @evidence contracts/development/testing.md#behavioral-verification Sits an actual polygon man onto an actual tacked horse turned onto a grade and reads the displayed seat region and soles in the saddle's and stirrups' own frames; a seat placed on the saddle's level heading lies off the pitched saddle and fails.
 * @evidence contracts/development/testing.md#independent-expectations The level horse's own seat is the reference; the bound is the campaign's.
 * @evidence contracts/development/testing.md#distinguishing-cases Uphill against downhill against level.
 * @evidence contracts/development/testing.md#execution-ownership Three in-memory films of one polygon man on one archetype horse.
 */
export function test_motion_mount_equestrian_grade_seat(): void {
  const findings: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const horse: mountedHorseScene.Horse = createHorse(
    { withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0 },
    8,
  );
  const at: number = WAIT - 1;
  const read = (grade: number): Record<string, IAutoMovieVector3> => {
    const scene: mountedHorseScene.IScene = mountedHorseScene.build({
      horse,
      body,
      gait: "walk",
      wait: WAIT,
      grade,
      from: { x: 0.6, y: 0, z: -0.2 },
      acts: (seated) =>
        seated.registered("ride", {
          on: "horse",
          duration: 0.6,
          seat: "seat",
          feet: { left: "leftStirrup", right: "rightStirrup" },
          hands: { left: "leftRein", right: "rightRein" },
        }),
    });
    assertTakeClean(`the seat on a ${grade}-degree grade`, scene.film);
    const ball = (side: "left" | "right"): IAutoMovieVector3 =>
      mountedHorseScene.local(
        scene.part(`${side}Stirrup`, at),
        HumanFoot.sockets(
          body,
          HumanSignature.bones(scene.reader, at),
          side,
        ).find(
          (s: IAutoMovieMotionHumanFoot.ISocket): boolean =>
            s.socket === "ball",
        )!.point,
      );
    return {
      seat: mountedHorseScene.local(
        scene.part("seat", at),
        HumanSignature.region(scene.reader, "seat", at),
      ),
      left: ball("left"),
      right: ball("right"),
    };
  };
  const level: Record<string, IAutoMovieVector3> = read(0);
  for (const grade of GRADES) {
    const graded: Record<string, IAutoMovieVector3> = read(grade);
    for (const key of ["seat", "left", "right"] as const) {
      const off: number = Vector3.distance(graded[key]!, level[key]!);
      if (off > CONTACT)
        findings.push(
          `on a ${grade}-degree grade the ${key === "seat" ? "seat region" : `${key} ball`} lies ${(off * 1000).toFixed(1)} mm from its level place`,
        );
    }
  }
  TestValidator.equals("a seat taken on a pitched saddle", findings, []);
}
