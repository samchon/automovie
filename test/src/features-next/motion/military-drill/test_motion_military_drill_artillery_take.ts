import { createCannon } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanMilitaryDrill,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HUMAN_LEXICON } from "@automovie/motions/internal";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The fire command's film second, on the scene's cue track. */
const FIRE: number = 6;
/** A crew member stands on its mark within this, metres: a foot's length. */
const MARK: number = 0.25;
/** A crew member's feet stay this far from the gun's wheels and muzzle line, metres: authored clearance. */
const CLEAR: number = 0.4;

/** The gun's wheels, whose hubs the crew's feet keep clear of. */
const WHEELS: readonly createCannon.Affordance[] = ["leftWheel", "rightWheel"];

/** One station of the crew: a performer, its body and its mark around the gun. */
type IStation = readonly [
  subject: string,
  body: Parameters<typeof motionHumanBody>[0],
  mark: IAutoMovieVector3,
  offset: number,
];

/** The crew's stations around a field gun pointing down +z, the gunner at the trail. */
const STATIONS: readonly IStation[] = [
  ["gunner", "m-average", { x: 0, y: 0, z: -2.6 }, 0],
  ["n1", "f-small", { x: 1.2, y: 0, z: 0.6 }, -0.4],
  ["n2", "m-average", { x: -1.2, y: 0, z: 0.6 }, -0.4],
  ["n3", "f-small", { x: 1.1, y: 0, z: -1.4 }, -0.2],
  ["n4", "m-average", { x: -1.1, y: 0, z: -1.4 }, -0.2],
];

/**
 * A field gun's crew blocked to its stations on the fire command (#3718):
 * five performers walk to their marks around the gun, arriving on the
 * command's cue at their own offsets, and look at the gun.
 *
 * Scenarios:
 * 1. Each crew member stands on its mark at its arrival on the cue.
 * 2. No crew member's feet come within the clearance of the gun's wheels or
 *    its muzzle line at the command.
 * 3. The take passes the shipped verdict report: no foot slide, no
 *    interpenetration between crew members, no pop.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the blocking and what each check pins.
 * @evidence contracts/development/testing.md#behavioral-verification Composes HumanGunCrew.stage through HumanPerformance with a cue track and reads the crew's feet, the gun and the verdict report.
 * @evidence contracts/development/testing.md#independent-expectations The marks, offsets and command are authored; the mark bound is a foot's length.
 * @evidence contracts/development/testing.md#distinguishing-cases Five stations on two bodies, before and at the command.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_military_drill_artillery_take(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  try {
    const gun: ReturnType<typeof createCannon> = createCannon({
      kind: "fieldGun",
    });
    const bodies: Map<string, IAutoMovieMotionHumanBody> = new Map(
      STATIONS.map(
        ([subject, body]: IStation): [string, IAutoMovieMotionHumanBody] => [
          subject,
          motionHumanBody(body),
        ],
      ),
    );
    const film: HumanPerformance = new HumanPerformance({
      seed: "artillery-take",
      laws: Object.values(HUMAN_LEXICON).flat(),
      props: [
        HumanObject.prop("gun", gun, {
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          fixed: true,
        }),
      ],
      cues: { command: [{ name: "fire", seconds: FIRE }] },
      performers: STATIONS.map(
        (
          [subject, , mark]: IStation,
          k: number,
        ): IAutoMovieMotionHumanPerformer => ({
          subject,
          body: bodies.get(subject)!,
          at: { x: mark.x * 2.5, y: 0, z: mark.z + 3 + k * 0.1 },
          yaw: 180,
          proficiency: { level: "trained" },
        }),
      ),
      composition: AutoMovieMotionHumanMilitaryDrill.HumanGunCrew.stage(
        { of: "command", event: "fire" },
        STATIONS.map(
          ([
            subject,
            ,
            mark,
            offset,
          ]: IStation): AutoMovieMotionHumanMilitaryDrill.HumanGunCrew.IStageStation => ({
            subject,
            mark,
            offset,
            gaze: {
              target: { kind: "prop", subject: "gun", point: "muzzle" },
              cue: "seen",
            },
          }),
        ),
      ),
    });
    const wheels: IAutoMovieVector3[] = WHEELS.map(
      (id: createCannon.Affordance): IAutoMovieVector3 =>
        gun.affordance(id).frame.translation,
    );
    for (const [subject, , mark, offset] of STATIONS) {
      const arrive: number = FIRE + offset;
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        film.bones(subject, arrive);
      const feet: IAutoMovieVector3 = Vector3.lerp(
        bones.get("leftFoot")!.worldPosition,
        bones.get("rightFoot")!.worldPosition,
        0.5,
      );
      const off: number = Math.hypot(feet.x - mark.x, feet.z - mark.z);
      checks.check(
        `${subject} stands on its mark at its arrival (${off.toFixed(3)} m)`,
        off <= MARK,
      );
      const at: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = film.bones(
        subject,
        FIRE,
      );
      for (const foot of ["leftFoot", "rightFoot"] as const) {
        const p: IAutoMovieVector3 = at.get(foot)!.worldPosition;
        const nearest: number = Math.min(
          ...wheels.map((w: IAutoMovieVector3): number =>
            Math.hypot(p.x - w.x, p.z - w.z),
          ),
        );
        checks.check(
          `${subject}'s ${foot} clears the wheels (${nearest.toFixed(3)} m) and the muzzle line at the command`,
          nearest >= CLEAR && !(Math.abs(p.x) < CLEAR && p.z > 0),
        );
      }
    }
    assertTakeClean("artillery crew", film);
  } catch (error: unknown) {
    checks.check("artillery crew refused: " + String(error), false);
  }
  checks.assert("artillery take");
}
