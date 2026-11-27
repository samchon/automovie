import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEnsemble,
  IAutoMovieMotionHumanEnsemblePreset,
} from "@automovie/interface";
import { AutoMovieMotionHumanEnsemble } from "@automovie/motions";
import {
  HumanResponse
} from "../../../../../../packages/motions/src/skill/internal/HumanResponse";
import {
  HumanSkill
} from "../../../../../../packages/motions/src/skill/internal/HumanSkill";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";

/** Troopers in each squadron, enough for a spread to mean something. */
const TROOPERS: number = 96;

/** The trumpet's film second. */
const CUE: number = 4;

/**
 * Seconds every trooper's horse takes from its first response to the line: one
 * course, so arrival differs only by response.
 */
const RUN: number = 10;

/**
 * A squadron's arrival at the line spreads as its cohesion preset says: each
 * trooper answers the trumpet after its own drawn reaction, so an elite
 * squadron arrives tighter than a militia one.
 *
 * Scenarios:
 *
 * 1. Every trooper arrives no earlier than the cue plus the run.
 * 2. The elite squadron's arrival spread, the standard deviation of its arrival
 *    seconds, is narrower than the militia's.
 * 3. The same seed draws the same arrivals again.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the two squadrons, the trumpet and the three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Builds real ensembles from the shipped presets with `AutoMovieMotionHumanEnsemble.HumanEnsemble` and draws each member's warned reaction with `HumanResponse.latency` from its own skill, stream and attributes.
 * @evidence contracts/development/testing.md#independent-expectations The presets give the elite a higher, tighter discipline than the militia, and discipline replaces a member's reaction proficiency, so the elite's reactions vary less; one shared course makes arrival spread equal reaction spread.
 * @evidence contracts/development/testing.md#distinguishing-cases The two extreme presets and a replay. The ridden course from response to line is pinned by test_archetypes_cavalry_squadron and test_archetypes_mounted_cues.
 * @evidence contracts/development/testing.md#execution-ownership The composite feature `test_motions_ensemble_cavalry_cohesion` exercises member resolution and response latency together. The ensemble takes a complete body record, so its stored rig and profile build the quiet stance before the observations of the member draws.
 */
export async function test_motions_ensemble_cavalry_cohesion(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const arrivals: (
    preset: IAutoMovieMotionHumanEnsemblePreset.Name,
  ) => number[] = (
    preset: IAutoMovieMotionHumanEnsemblePreset.Name,
  ): number[] => {
    const squadron: IAutoMovieMotionHumanEnsemble.IEnsemble =
      AutoMovieMotionHumanEnsemble.HumanEnsemble({
        id: `squadron-${preset}`,
        seed: "charge",
        count: TROOPERS,
        bodies: [body],
        preset,
        formation: AutoMovieMotionHumanEnsemble.HumanFormation({
          blocks: [
            {
              layout: {
                kind: "line",
                ranks: 2,
                files: TROOPERS / 2,
                spacing: { lateral: 1.8, depth: 4 },
              },
              count: TROOPERS,
            },
          ],
          frame: { kind: "fixed", at: { x: 0, y: 0, z: 0 }, heading: 0 },
        }),
      });
    return AutoMovieMotionHumanEnsemble.HumanEnsemble.members(squadron).map(
      (member: IAutoMovieMotionHumanEnsemble.IMember): number =>
        CUE +
        HumanResponse.latency(
          HumanSkill.resolve(member.proficiency, squadron.input.seed),
          AutoMovieMotionHumanEnsemble.HumanAttribute.stream(
            squadron.input.seed,
            squadron.input.id,
            member.index,
            "charge:latency",
          ),
          "reaction",
          true,
          member.attributes,
        ) +
        RUN,
    );
  };
  const spread: (times: readonly number[]) => number = (
    times: readonly number[],
  ): number => {
    const mean: number =
      times.reduce((sum: number, at: number): number => sum + at, 0) /
      times.length;
    return Math.sqrt(
      times.reduce(
        (sum: number, at: number): number => sum + (at - mean) ** 2,
        0,
      ) / times.length,
    );
  };
  const elite: number[] = arrivals("elite");
  const militia: number[] = arrivals("militia");

  TestValidator.predicate(
    "every trooper arrives no earlier than the cue plus the run",
    [...elite, ...militia].every((at: number): boolean => at >= CUE + RUN),
  );
  TestValidator.predicate(
    `the elite squadron arrives tighter than the militia: ${spread(elite).toFixed(3)} against ${spread(militia).toFixed(3)} s`,
    spread(elite) < spread(militia),
  );
  TestValidator.equals(
    "the same seed draws the same arrivals",
    arrivals("elite"),
    elite,
  );
}
