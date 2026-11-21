import {
  type Archetype,
  ArchetypeCourse,
  ArchetypeManoeuvre,
  ArchetypePassage,
  ArchetypeRefusal,
  QuadrupedGait,
  createHorse,
  createQuadruped,
} from "@automovie/archetypes";
import type {
  IAutoMovieFormationLayout,
  IAutoMovieMotionHumanFormation,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanFormation } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/** Seconds between measured instants. */
const STEP: number = 0.1;

/** The authored margin between mounts and around a person, metres. */
const MARGIN: number = 0.3;

/**
 * Deploy a squadron from column into line and rally it, refuse a line that traps a person against a wall, and keep the caracole's shots to its front rank.
 *
 * Scenarios:
 *
 * 1. Four pairs deploy from a column into a line 3 m apart and rally back into column, each to its nearest slot, keeping the mounts' margin; a line too tight for the margin refuses at its close with both neighbours named.
 * 2. A line halting short of a person standing before a wall is admitted; one that rides on to the wall refuses with the horse and the person.
 * 3. In a caracole each rank fires only while it is the front rank: the first rank fires, wheels off to the rear at the trot, and the second rank comes up and fires.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three stagings and their expectations.
 * @evidence contracts/development/testing.md#behavioral-verification Plans formation slot transitions and manoeuvre arcs through `ArchetypeCourse.timed` and measures them with `ArchetypePassage` on a real horse footprint.
 * @evidence contracts/development/testing.md#independent-expectations A line's final clearance is its spacing less a horse's breadth, so 3 m clears the margin and 1 m does not. A horse stopping 3 m before the person's disc keeps it; one at the wall cannot. The front rank is the one nearest the target, read from the riders' positions at each authored shot.
 * @evidence contracts/development/testing.md#distinguishing-cases Admitted and refused lines, an admitted halt and a refused advance, and both ranks' shots.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU-only feature spec; the shots are inert events, the mounted firing acts are #3806's.
 */
export function test_world_mounted_formations(): void {
  const horse: Archetype = createHorse({ withersHeight: 1.7 }, "squadron");
  const footprint: ArchetypePassage.IFootprint =
    ArchetypePassage.footprint(horse);
  const trot: ArchetypeManoeuvre.ISpeedRange = QuadrupedGait.range(
    createQuadruped.species(horse),
    "trot",
    1.7,
  );
  const breadth: number =
    Math.max(...footprint.outline.map((p: IAutoMovieVector3): number => p.x)) -
    Math.min(...footprint.outline.map((p: IAutoMovieVector3): number => p.x));

  // 1. Deploy and rally.
  const column: IAutoMovieMotionHumanFormation = formation(
    { kind: "column", ranks: 4, files: 1, spacing: { lateral: 3, depth: 5 } },
    0,
  );
  const deploy: (lateral: number) => ArchetypePassage.IConflict[] = (
    lateral: number,
  ): ArchetypePassage.IConflict[] => {
    const line: IAutoMovieMotionHumanFormation = formation(
      { kind: "line", ranks: 1, files: 4, spacing: { lateral, depth: 5 } },
      30,
    );
    const rally: IAutoMovieMotionHumanFormation = formation(
      { kind: "column", ranks: 4, files: 1, spacing: { lateral: 3, depth: 5 } },
      80,
    );
    const starts: IAutoMovieVector3[] = [0, 1, 2, 3].map(
      (k: number): IAutoMovieVector3 => HumanFormation.slot(column, k, 0).at,
    );
    const onLine: number[] = HumanFormation.assign(line, starts, "nearest", 0);
    const lined: IAutoMovieVector3[] = onLine.map(
      (slot: number): IAutoMovieVector3 =>
        HumanFormation.slot(line, slot, 0).at,
    );
    const onColumn: number[] = HumanFormation.assign(
      rally,
      lined,
      "nearest",
      0,
    );
    return ArchetypePassage.conflicts("deploy", {
      participants: starts.map(
        (
          start: IAutoMovieVector3,
          k: number,
        ): ArchetypePassage.IParticipant => ({
          id: `pair${k}`,
          plan: ArchetypeCourse.timed(`pair${k}`, [
            sample(0, start),
            sample(8, point(lined[k]!.x, 24)),
            sample(10, point(lined[k]!.x, 27)),
            sample(12, lined[k]!),
            sample(14, lined[k]!),
            sample(15.5, point(lined[k]!.x, 33)),
            sample(17, point(lined[k]!.x, 36)),
            sample(30, HumanFormation.slot(rally, onColumn[k]!, 0).at),
          ]),
          footprint,
          margin: MARGIN,
        }),
      ),
      step: STEP,
    });
  };
  TestValidator.equals(
    "the squadron deploys into line and rallies",
    deploy(3),
    [],
  );
  const tight: ArchetypePassage.IConflict[] = deploy(1);
  TestValidator.predicate(
    `a line too tight for the margin refuses at its close: ${JSON.stringify(tight)}`,
    1 - breadth < MARGIN &&
      tight.length > 0 &&
      tight.some(
        (found: ArchetypePassage.IConflict): boolean =>
          found.from <= 12 && found.to >= 14 && found.subject !== found.other,
      ),
  );

  // 2. A person before a wall.
  const wall: ArchetypePassage.IObstacle = {
    id: "wall",
    footprint: {
      outline: [
        point(-10, 20),
        point(10, 20),
        point(10, 20.5),
        point(-10, 20.5),
      ],
      radius: 0,
    },
    margin: 0,
  };
  const advance: (stop: number) => ArchetypePassage.IProps = (
    stop: number,
  ): ArchetypePassage.IProps => ({
    participants: [
      {
        id: "horse",
        plan: ArchetypeCourse.timed("horse", [
          sample(0, point(0, 0)),
          sample(10, point(0, stop)),
        ]),
        footprint,
        margin: MARGIN,
      },
      {
        id: "person",
        plan: ArchetypeCourse.timed("person", [
          sample(0, point(0, 19.5)),
          sample(10, point(0, 19.5)),
        ]),
        footprint: { outline: [point(0, 0)], radius: 0.3 },
        margin: 0,
      },
    ],
    obstacles: [wall],
    step: STEP,
  });
  const front: number = Math.max(
    ...footprint.outline.map((p: IAutoMovieVector3): number => p.z),
  );
  TestValidator.equals(
    "a line halting short of the person is admitted",
    ArchetypePassage.conflicts("advance", advance(19.5 - 0.3 - 3 - front)),
    [],
  );
  let refusal: unknown;
  try {
    ArchetypePassage.admit("advance", advance(19.5 - front));
  } catch (error) {
    refusal = error;
  }
  TestValidator.predicate(
    "an advance onto a person against the wall refuses with both",
    refusal instanceof ArchetypeRefusal &&
      refusal.reason.startsWith("horse and person come within"),
  );

  // 3. The caracole.
  const speed: number = trot.minimum * 1.2;
  const turn: number = 3;
  const wheelOff: number = (Math.PI * turn) / speed;
  const shots: readonly number[] = [2, 8];
  const riders: ArchetypeCourse.IPlan[] = [-1, 1].flatMap(
    (side: number): ArchetypeCourse.IPlan[] => [
      ArchetypeCourse.timed("first", [
        sample(0, point(1.5 * side, 10)),
        ...ArchetypeManoeuvre.arc(
          "first",
          {
            centre: point(4.5 * side, 10),
            radius: turn,
            bearing: -90 * side,
            sweep: 180 * side,
            start: 2,
            end: 2 + wheelOff,
          },
          trot,
          STEP,
        ),
        ...[1, 2].map(
          (k: number): ArchetypeCourse.ISample =>
            sample(2 + wheelOff + k, point(7.5 * side, 10 - speed * k)),
        ),
      ]),
      ArchetypeCourse.timed("second", [
        sample(0, point(1.5 * side, 5)),
        sample(3, point(1.5 * side, 5)),
        sample(4.5, point(1.5 * side, 7.5)),
        sample(6, point(1.5 * side, 10)),
        sample(9, point(1.5 * side, 10)),
      ]),
    ],
  );
  TestValidator.predicate(
    "each rank fires only while it is the front rank",
    shots.every((seconds: number, rank: number): boolean => {
      const ahead: number[] = riders.map(
        (plan: ArchetypeCourse.IPlan): number =>
          plan.at(seconds).placement.translation.z,
      );
      const firing: number[] = [rank, rank + 2];
      return firing.every((k: number): boolean =>
        ahead.every(
          (z: number, other: number): boolean =>
            firing.includes(other) || ahead[k]! > z,
        ),
      );
    }),
  );
  TestValidator.equals(
    "the ranks pass through each other without contact",
    ArchetypePassage.conflicts("caracole", {
      participants: riders.map(
        (
          plan: ArchetypeCourse.IPlan,
          k: number,
        ): ArchetypePassage.IParticipant => ({
          id: `rider${k}`,
          plan,
          footprint,
          margin: MARGIN,
        }),
      ),
      step: STEP,
    }),
    [],
  );
  TestValidator.predicate(
    "the first rank wheels off at its trot",
    nclose(riders[0]!.at(2 + wheelOff / 2).speed, speed, 0.02 * speed),
  );
}

/** A fixed formation whose front stands at a depth on the x = 0 line, facing +Z. */
function formation(
  layout: IAutoMovieFormationLayout,
  z: number,
): IAutoMovieMotionHumanFormation {
  return HumanFormation.of({
    blocks: [{ layout, count: 4 }],
    frame: { kind: "fixed", at: point(0, z), heading: 0 },
  });
}

/** A course sample at a film second. */
function sample(
  seconds: number,
  at: IAutoMovieVector3,
): ArchetypeCourse.ISample {
  return { seconds, x: at.x, y: 0, z: at.z };
}

/** A floor point. */
function point(x: number, z: number): IAutoMovieVector3 {
  return { x, y: 0, z };
}
