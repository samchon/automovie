import {
  type AutoMovieArchetype,
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeManoeuvre,
  AutoMovieArchetypePassage,
  AutoMovieArchetypeQuadrupedGait,
  AutoMovieArchetypeRefusal,
  createHorse,
  createQuadruped,
} from "@automovie/archetypes";
import type {
  IAutoMovieFormationLayout,
  IAutoMovieMotionHumanFormation,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanEnsemble } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/** Seconds between measured instants. */
const STEP: number = 0.1;

/** The authored margin between mounts and around a person, metres. */
const MARGIN: number = 0.3;

/**
 * Deploy a squadron from column into line and rally it, refuse a line that
 * traps a person against a wall, and keep the caracole's shots to its front
 * rank.
 *
 * Scenarios:
 *
 * 1. Four pairs deploy from a column into a line 3 m apart and rally back into
 *    column, each to its nearest slot, keeping the mounts' margin; a line too
 *    tight for the margin refuses at its close with both neighbours named.
 * 2. A line halting short of a person standing before a wall is admitted; one that
 *    rides on to the wall refuses with the horse and the person.
 * 3. In a caracole each rank fires only while it is the front rank: the first rank
 *    fires, wheels off to the rear at the trot, and the second rank comes up
 *    and fires.
 * 4. Meeting an opposing infantry line, riders aligned with its gaps pass through
 *    and a rider whose lane meets a soldier pulls up and halts short of him.
 * 5. In a skirmish screen in open order, alternate files advance, fire on the move
 *    and wheel about to retire, each volley fired by the files in front,
 *    without contact.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three stagings and their expectations.
 * @evidence contracts/development/testing.md#behavioral-verification Plans formation slot transitions and manoeuvre arcs through `AutoMovieArchetypeCourse.timed` and measures them with `AutoMovieArchetypePassage` on a real horse footprint.
 * @evidence contracts/development/testing.md#independent-expectations A line's final clearance is its spacing less a horse's breadth, so 3 m clears the margin and 1 m does not. A horse stopping 3 m before the person's disc keeps it; one at the wall cannot. The front rank is the one nearest the target, read from the riders' positions at each authored shot.
 * @evidence contracts/development/testing.md#distinguishing-cases Admitted and refused lines, an admitted halt and a refused advance, and both ranks' shots.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU-only feature spec; the shots are inert events, the mounted firing acts are #3806's.
 */
export function test_world_mounted_formations(): void {
  const horse: AutoMovieArchetype = createHorse(
    { withersHeight: 1.7 },
    "squadron",
  );
  const footprint: AutoMovieArchetypePassage.IFootprint =
    AutoMovieArchetypePassage.footprint(horse);
  const trot: AutoMovieArchetypeManoeuvre.ISpeedRange =
    AutoMovieArchetypeQuadrupedGait.range(
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
  const deploy: (lateral: number) => AutoMovieArchetypePassage.IConflict[] = (
    lateral: number,
  ): AutoMovieArchetypePassage.IConflict[] => {
    const line: IAutoMovieMotionHumanFormation = formation(
      { kind: "line", ranks: 1, files: 4, spacing: { lateral, depth: 5 } },
      30,
    );
    const rally: IAutoMovieMotionHumanFormation = formation(
      { kind: "column", ranks: 4, files: 1, spacing: { lateral: 3, depth: 5 } },
      80,
    );
    const starts: IAutoMovieVector3[] = [0, 1, 2, 3].map(
      (k: number): IAutoMovieVector3 =>
        AutoMovieMotionHumanEnsemble.HumanFormation.prepare(column).slot(k, 0)
          .at,
    );
    const onLine: number[] =
      AutoMovieMotionHumanEnsemble.HumanFormation.prepare(line).assign(
        starts,
        "nearest",
        0,
      );
    const lined: IAutoMovieVector3[] = onLine.map(
      (slot: number): IAutoMovieVector3 =>
        AutoMovieMotionHumanEnsemble.HumanFormation.prepare(line).slot(slot, 0)
          .at,
    );
    const onColumn: number[] =
      AutoMovieMotionHumanEnsemble.HumanFormation.prepare(rally).assign(
        lined,
        "nearest",
        0,
      );
    return AutoMovieArchetypePassage.conflicts("deploy", {
      participants: starts.map(
        (
          start: IAutoMovieVector3,
          k: number,
        ): AutoMovieArchetypePassage.IParticipant => ({
          id: `pair${k}`,
          plan: AutoMovieArchetypeCourse.timed(`pair${k}`, [
            sample(0, start),
            sample(8, point(lined[k]!.x, 24)),
            sample(10, point(lined[k]!.x, 27)),
            sample(12, lined[k]!),
            sample(14, lined[k]!),
            sample(15.5, point(lined[k]!.x, 33)),
            sample(17, point(lined[k]!.x, 36)),
            sample(
              30,
              AutoMovieMotionHumanEnsemble.HumanFormation.prepare(rally).slot(
                onColumn[k]!,
                0,
              ).at,
            ),
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
  const tight: AutoMovieArchetypePassage.IConflict[] = deploy(1);
  TestValidator.predicate(
    `a line too tight for the margin refuses at its close: ${JSON.stringify(tight)}`,
    1 - breadth < MARGIN &&
      tight.length > 0 &&
      tight.some(
        (found: AutoMovieArchetypePassage.IConflict): boolean =>
          found.from <= 12 && found.to >= 14 && found.subject !== found.other,
      ),
  );

  // 2. A person before a wall.
  const wall: AutoMovieArchetypePassage.IObstacle = {
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
  const advance: (stop: number) => AutoMovieArchetypePassage.IProps = (
    stop: number,
  ): AutoMovieArchetypePassage.IProps => ({
    participants: [
      {
        id: "horse",
        plan: AutoMovieArchetypeCourse.timed("horse", [
          sample(0, point(0, 0)),
          sample(10, point(0, stop)),
        ]),
        footprint,
        margin: MARGIN,
      },
      {
        id: "person",
        plan: AutoMovieArchetypeCourse.timed("person", [
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
    AutoMovieArchetypePassage.conflicts(
      "advance",
      advance(19.5 - 0.3 - 3 - front),
    ),
    [],
  );
  let refusal: unknown;
  try {
    AutoMovieArchetypePassage.admit("advance", advance(19.5 - front));
  } catch (error) {
    refusal = error;
  }
  TestValidator.predicate(
    "an advance onto a person against the wall refuses with both",
    refusal instanceof AutoMovieArchetypeRefusal &&
      refusal.reason.startsWith("horse and person come within"),
  );

  // 3. The caracole.
  const speed: number = trot.minimum * 1.2;
  const turn: number = 3;
  const wheelOff: number = (Math.PI * turn) / speed;
  const shots: readonly number[] = [2, 8];
  const riders: AutoMovieArchetypeCourse.IPlan[] = [-1, 1].flatMap(
    (side: number): AutoMovieArchetypeCourse.IPlan[] => [
      AutoMovieArchetypeCourse.timed("first", [
        sample(0, point(1.5 * side, 10)),
        ...AutoMovieArchetypeManoeuvre.arc(
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
          (k: number): AutoMovieArchetypeCourse.ISample =>
            sample(2 + wheelOff + k, point(7.5 * side, 10 - speed * k)),
        ),
      ]),
      AutoMovieArchetypeCourse.timed("second", [
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
        (plan: AutoMovieArchetypeCourse.IPlan): number =>
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
    AutoMovieArchetypePassage.conflicts("caracole", {
      participants: riders.map(
        (
          plan: AutoMovieArchetypeCourse.IPlan,
          k: number,
        ): AutoMovieArchetypePassage.IParticipant => ({
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
  // 4. The skirmish screen: four files in open order, alternate files advancing to fire and retiring while the others come up.
  const OPEN: number = 6;
  const screen: AutoMovieArchetypeCourse.IPlan[] = [0, 1, 2, 3].map(
    (file: number): AutoMovieArchetypeCourse.IPlan => {
      const x: number = (file - 1.5) * OPEN;
      const first: boolean = file % 2 === 0;
      return AutoMovieArchetypeCourse.timed(
        `skirmisher${file}`,
        first
          ? [
              sample(0, point(x, 0)),
              sample(2, point(x, 3)),
              sample(3.5, point(x, 6)),
              sample(5, point(x + 1.5, 8)),
              sample(6.5, point(x + 3, 6)),
              sample(9.5, point(x + 3, 0)),
            ]
          : [
              sample(0, point(x, 0)),
              sample(4, point(x, 0)),
              sample(6, point(x, 3)),
              sample(7.5, point(x, 6)),
              sample(9.5, point(x, 9)),
            ],
      );
    },
  );
  const volleys: readonly number[] = [3.5, 7.5];
  TestValidator.predicate(
    "each volley fires from the files in front of the screen",
    volleys.every((seconds: number, volley: number): boolean => {
      const firing: number[] = [0, 1, 2, 3].filter(
        (file: number): boolean => file % 2 === volley % 2,
      );
      return firing.every((file: number): boolean =>
        [0, 1, 2, 3]
          .filter((other: number): boolean => !firing.includes(other))
          .every(
            (other: number): boolean =>
              screen[file]!.at(seconds).placement.translation.z >
              screen[other]!.at(seconds).placement.translation.z,
          ),
      );
    }),
  );
  TestValidator.equals(
    "the screen's files keep open order without contact",
    AutoMovieArchetypePassage.conflicts("screen", {
      participants: screen.map(
        (
          plan: AutoMovieArchetypeCourse.IPlan,
          k: number,
        ): AutoMovieArchetypePassage.IParticipant => ({
          id: `skirmisher${k}`,
          plan,
          footprint,
          margin: MARGIN,
        }),
      ),
      step: STEP,
    }),
    [],
  );
  // 5. Meeting an opposing line: riders aligned with its gaps pass through, and one whose lane meets a soldier pulls up short of him.
  const soldiers: AutoMovieArchetypePassage.IObstacle[] = [
    -4.5, -1.5, 1.5, 4.5,
  ].map(
    (x: number, k: number): AutoMovieArchetypePassage.IObstacle => ({
      id: `soldier${k}`,
      footprint: { outline: [point(x, 20)], radius: 0.3 },
      margin: MARGIN,
    }),
  );
  const charge: AutoMovieArchetypePassage.IParticipant[] = [-3, 0, 1.5].map(
    (x: number, k: number): AutoMovieArchetypePassage.IParticipant => ({
      id: `rider${k}`,
      plan: AutoMovieArchetypeCourse.timed(
        `rider${k}`,
        x === 1.5
          ? [
              sample(0, point(x, 0)),
              sample(3, point(x, 9)),
              sample(6, point(x, 15)),
              sample(9, point(x, 15)),
            ]
          : [
              sample(0, point(x, 0)),
              sample(3, point(x, 9)),
              sample(6, point(x, 18)),
              sample(9, point(x, 27)),
            ],
      ),
      footprint,
      margin: MARGIN,
    }),
  );
  TestValidator.equals(
    "riders pass through the line's gaps and the blocked rider pulls up short of his soldier",
    AutoMovieArchetypePassage.conflicts("line", {
      participants: charge,
      obstacles: soldiers,
      step: STEP,
    }).filter((found: AutoMovieArchetypePassage.IConflict): boolean =>
      found.other.startsWith("soldier"),
    ),
    [],
  );
  TestValidator.predicate(
    "the blocked rider halts before the line",
    charge[2]!.plan.at(9).speed === 0 &&
      charge[2]!.plan.at(9).placement.translation.z < 20,
  );
}

/** A fixed formation whose front stands at a depth on the x = 0 line, facing +Z. */
function formation(
  layout: IAutoMovieFormationLayout,
  z: number,
): IAutoMovieMotionHumanFormation {
  return AutoMovieMotionHumanEnsemble.HumanFormation.of({
    blocks: [{ layout, count: 4 }],
    frame: { kind: "fixed", at: point(0, z), heading: 0 },
  });
}

/** A course sample at a film second. */
function sample(
  seconds: number,
  at: IAutoMovieVector3,
): AutoMovieArchetypeCourse.ISample {
  return { seconds, x: at.x, y: 0, z: at.z };
}

/** A floor point. */
function point(x: number, z: number): IAutoMovieVector3 {
  return { x, y: 0, z };
}
