import {
  AutoMovieComposition,
  resolveAutoMovieSchedule,
} from "@automovie/engine";
import type {
  IAutoMovieComposition,
  IAutoMovieFormationLayout,
  IAutoMovieIntentTiming,
  IAutoMovieMotionHumanFormation,
  IAutoMovieSchedule,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanCue, HumanFormation, HumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

/** The film seconds shared by both independently authored slot tracks. */
const SECONDS: readonly number[] = [0, 2, 5, 6.5, 8, 12, 14];

/** Eight geometric samples per film second, including the final stage mark. */
const STEP: number = 1 / 8;

/** The straight entry layout gives the pair two slots four metres apart. */
const ENTRY: IAutoMovieFormationLayout = {
  kind: "column",
  ranks: 2,
  files: 1,
  spacing: { lateral: 4, depth: 4 },
};

/** One recorded member follows each freely operating frame during the exhibition. */
const STATION: IAutoMovieFormationLayout = {
  kind: "column",
  ranks: 1,
  files: 1,
  spacing: { lateral: 4, depth: 4 },
};

/** Name the horse, its assigned rider, and its world place at arrival. */
interface IMember {
  horse: string;
  rider: string;
  arrival: IAutoMovieVector3;
}

/** The lead and following pair hold separate world routes during the exhibition. */
const LEAD: readonly IAutoMovieVector3[] = [
  point(0, 0),
  point(0, 4),
  point(-2, 8),
  point(-2, 8),
  point(-3, 11),
  point(0, 17),
  point(0, 21),
];

/** Default second route reaches the paired mark, separates and returns to single file. */
const FOLLOW: readonly IAutoMovieVector3[] = [
  point(0, -4),
  point(0, 0),
  point(2, 8),
  point(2, 8),
  point(3, 9),
  point(0, 13),
  point(0, 17),
];

/** Alternate addressed staging holds the following member on the exhibition mark. */
const HOLD: readonly IAutoMovieVector3[] = [
  ...FOLLOW.slice(0, 4),
  point(2, 8),
  ...FOLLOW.slice(5),
];

/**
 * Check two ceremonial slot tracks and their indexed exhibition cues.
 *
 * A pair enters single file, comes alongside its partner, separates and reforms.
 * The alternative holds only the following member through the separation cue.
 * Observe native path samples at the authored marks, reverse reads and separate
 * rider cue starts for both unison and staggered exhibition beats.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the stable entry, shared exhibition marks, addressed hold and which clock and geometric reads are measured.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public formation assignment, timed path and reverse slot readers and resolves two addressed cue tracks through the public composition schedule.
 * @evidence contracts/development/testing.md#independent-expectations The entry positions are four metres apart. From seconds 2 to 5 the lateral separation grows from zero to four as depth decreases from four to zero. Their closest sampled separation is two metres on both axes halfway between those marks. Rider cue starts are directly authored at seconds 5 and 6.5.
 * @evidence contracts/development/testing.md#distinguishing-cases Distinguishes two identities even when their cues coincide, verifies a single held member while the other advances, compares every reverse-time slot sample and refuses an overfull layout.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous path and clock regression. It measures slot centres and schedule entries. Horse, equipment and rider support are measured by the mounted playback integration.
 */
export function test_world_mounted_ensemble_marks(): void {
  const roster: readonly IMember[] = [
    { horse: "hazel-horse", rider: "hazel-rider", arrival: point(0, 0) },
    { horse: "indigo-horse", rider: "indigo-rider", arrival: point(0, -4) },
  ];
  const entry: IAutoMovieMotionHumanFormation = HumanFormation.of({
    blocks: [{ layout: ENTRY, count: roster.length }],
    frame: { kind: "fixed", at: point(0, 0), heading: 0 },
  });
  const slots: number[] = HumanFormation.assign(
    entry,
    roster.map((member: IMember): IAutoMovieVector3 => member.arrival),
    "nearest",
    0,
  );
  TestValidator.equals(
    "stable pairs enter in their named slot order",
    roster.map((member: IMember, index: number): [string, string, number] => [
      member.horse,
      member.rider,
      slots[index]!,
    ]),
    [
      ["hazel-horse", "hazel-rider", 0],
      ["indigo-horse", "indigo-rider", 1],
    ],
  );
  checkPath("paired passage", FOLLOW);
  checkPath("one member holds", HOLD);
  checkCues(roster, slots, [5, 5]);
  checkCues(roster, slots, [5, 6.5]);

  let refusal: unknown;
  try {
    HumanFormation.of({
      blocks: [{ layout: STATION, count: 2 }],
      frame: { kind: "fixed", at: point(0, 0), heading: 0 },
    });
  } catch (caught) {
    refusal = caught;
  }
  TestValidator.predicate(
    "one station refuses two pairs",
    refusal instanceof HumanRefusal && refusal.axis === "blocks[0].count",
  );
}

/** Follow two actual path readers and observe authored marks and separation. */
function checkPath(label: string, tail: readonly IAutoMovieVector3[]): void {
  const records: readonly (readonly IAutoMovieVector3[])[] = [LEAD, tail];
  const read: IAutoMovieMotionHumanFormation.ISample[][] = records.map(
    (
      points: readonly IAutoMovieVector3[],
      member: number,
    ): IAutoMovieMotionHumanFormation.ISample[] => {
      const formation: IAutoMovieMotionHumanFormation = HumanFormation.of({
        blocks: [{ layout: STATION, count: 1 }],
        frame: {
          kind: "course",
          samples: points.map(
            (
              at: IAutoMovieVector3,
              index: number,
            ): IAutoMovieMotionHumanFormation.ISample => ({
              seconds: SECONDS[index]!,
              ...at,
            }),
          ),
        },
      });
      const sampled: IAutoMovieMotionHumanFormation.ISample[] =
        HumanFormation.path(formation, 0, 0, 14, STEP);
      TestValidator.equals(
        label + " sample count for member " + member,
        sampled.length,
        113,
      );
      for (const [index, seconds] of SECONDS.entries())
        TestValidator.predicate(
          label + " member " + member + " arrives at film second " + seconds,
          vclose(sampled[seconds / STEP]!, points[index]!, 1e-9),
        );
      for (let index = sampled.length - 1; index >= 0; --index) {
        const sample: IAutoMovieMotionHumanFormation.ISample = sampled[index]!;
        const reverse: IAutoMovieVector3 = HumanFormation.slot(
          formation,
          0,
          sample.seconds,
        ).at;
        TestValidator.predicate(
          label + " member " + member + " reverse read at " + sample.seconds,
          vclose(sample, reverse, 1e-9),
        );
      }
      return sampled;
    },
  );
  const gap: number = read[0]!.reduce(
    (
      minimum: number,
      lead: IAutoMovieMotionHumanFormation.ISample,
      index: number,
    ): number => {
      const following: IAutoMovieMotionHumanFormation.ISample =
        read[1]![index]!;
      return Math.min(
        minimum,
        Math.hypot(lead.x - following.x, lead.z - following.z),
      );
    },
    Infinity,
  );
  TestValidator.predicate(
    label + " closest slot centres",
    nclose(gap, Math.sqrt(8), 1e-9),
  );
  if (tail === HOLD)
    TestValidator.predicate(
      "the second track holds while the first advances",
      vclose(read[1]![6 / STEP]!, read[1]![8 / STEP]!, 1e-9) &&
        !vclose(read[0]![6 / STEP]!, read[0]![8 / STEP]!, 1e-9),
    );
}

/** Resolve one single-address cue for each rider attached to its persistent slot. */
function checkCues(
  roster: readonly IMember[],
  slots: readonly number[],
  seconds: readonly number[],
): void {
  const composition: IAutoMovieComposition = AutoMovieComposition.parallel(
    ...roster.map(
      (member: IMember, index: number): IAutoMovieComposition =>
        AutoMovieComposition.at(
          "ring",
          { subject: member.rider, capability: "exhibitionMark" },
          0,
          { event: "section", index: slots[index]! },
        ),
    ),
  );
  const schedule: IAutoMovieSchedule = resolveAutoMovieSchedule(composition, {
    cues: { ring: HumanCue.sectionWave({ seconds }) },
    timing: (): IAutoMovieIntentTiming => ({ duration: 0.25 }),
  });
  TestValidator.equals(
    "one addressed cue per rider",
    schedule.entries.length,
    roster.length,
  );
  for (const [index, member] of roster.entries()) {
    const placed: IAutoMovieScheduleEntry | undefined = schedule.entries.find(
      (entry: IAutoMovieScheduleEntry): boolean =>
        entry.intent.subject === member.rider,
    );
    TestValidator.equals(
      "exhibition time of " + member.rider,
      placed?.start,
      seconds[index],
    );
  }
}

/** A floor mark in world metres. */
function point(x: number, z: number): IAutoMovieVector3 {
  return { x, y: 0, z };
}
