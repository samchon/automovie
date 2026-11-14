import type { IAutoMovieJointPose, IAutoMoviePose } from "@automovie/interface";

import { MOTION_HUMAN_LAW_STAGES } from "./MOTION_HUMAN_LAW_STAGES";
import type { motionHumanBody } from "./motionHumanBody";
import type { motionHumanLaw } from "./motionHumanLaw";
import { motionHumanLawSweep } from "./motionHumanLawSweep";

/**
 * A small fixed corpus of displayed poses, the regression oracle of the
 * pose solver's cost work (#3517): a few laws whose limbs are fitted with a
 * requested hand rotation, a planted contact and a partner, on two bodies of
 * opposite build, read at a few instants, each joint's three clinical angles
 * as numbers. `MOTION_HUMAN_POSE_CORPUS.json` holds the corpus as the solver
 * computed it before that work; a change meant to cost less and give the same
 * poses reads it again and must find every number identical.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the corpus holds, why it is small and what it is compared with.
 * @evidence contracts/development/implementation.md#principled-implementation Every pose is read off the public performance at fixed instants of fixed scenes, so the corpus is a pure function of the code under test.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One table of cases and one reader.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every bone's three angles are read, none rounded.
 * @evidence contracts/development/implementation.md#efficient-algorithms Twelve poses.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Scenes and films come from the sweep's stages and readers.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps nothing once read.
 */
export namespace motionHumanPoseCorpus {
  /** The cases: a law, its row, the bodies and the shares of the film read. */
  export const CASES: readonly {
    law: "pickUp" | "walk" | "punch";
    row: string;
    bodies: [motionHumanBody.Name, motionHumanBody.Name];
    shares: readonly number[];
  }[] = [
    {
      law: "pickUp",
      row: "default",
      bodies: ["m-average", "f-small"],
      shares: [0.5, 0.75],
    },
    {
      law: "pickUp",
      row: "default",
      bodies: ["f-small", "m-average"],
      shares: [0.5, 0.75],
    },
    {
      law: "walk",
      row: "default",
      bodies: ["m-average", "f-small"],
      shares: [0.5, 0.75],
    },
    {
      law: "walk",
      row: "default",
      bodies: ["f-small", "m-average"],
      shares: [0.5, 0.75],
    },
    {
      law: "punch",
      row: "default",
      bodies: ["m-average", "f-small"],
      shares: [0.5, 0.75],
    },
    {
      law: "punch",
      row: "default",
      bodies: ["f-small", "m-average"],
      shares: [0.5, 0.75],
    },
  ];

  /** One read pose: its case, its instant and every joint's angles. */
  export interface IPose {
    /** `<law> <row> <body>+<partner> @<share>`. */
    name: string;

    /** Each bone's flexion, abduction and twist, degrees, null where the pose leaves one unset. */
    joints: Record<string, [number | null, number | null, number | null]>;
  }

  /**
   * Read the corpus.
   *
   * @returns Every case's poses, in order.
   */
  export function read(): IPose[] {
    const out: IPose[] = [];
    for (const c of CASES) {
      const stages: Record<string, motionHumanLawSweep.Stage> = Object.assign(
        {},
        ...Object.values(MOTION_HUMAN_LAW_STAGES),
      );
      const film: motionHumanLaw.IFilm = motionHumanLawSweep.perform(
        "corpus",
        motionHumanLawSweep.staged(
          c.row,
          stages[c.law]!,
          c.bodies,
          (): void => {},
        ),
      );
      for (const share of c.shares) {
        const pose: IAutoMoviePose = film.performance.pose(
          "a",
          share * film.duration,
        );
        const joints: IPose["joints"] = {};
        for (const j of pose.joints as IAutoMovieJointPose[])
          joints[j.bone] = [
            j.flexion ?? null,
            j.abduction ?? null,
            j.twist ?? null,
          ];
        out.push({
          name: `${c.law} ${c.row} ${c.bodies[0]}+${c.bodies[1]} @${share}`,
          joints,
        });
      }
    }
    return out;
  }
}
