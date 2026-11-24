import {
  AutoMovieViewAxis,
  AutoMovieViewJointedCourse,
} from "@automovie/engine";
import {
  AutoMovieHumanConicLoft,
  AutoMovieHumanConicSection,
  AutoMovieHumanConicPose as Q,
} from "@automovie/human";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanConicPose,
  IAutoMovieViewAxis,
  IAutoMovieViewJointedCourse,
} from "@automovie/interface";

/**
 * A conic family carried to a pose: its turns keep their set-backs, its
 * stations stay on their bones and its chart takes its joints' twist, and none
 * of it moves the reference pose.
 *
 * Scenarios:
 *
 * 1. The set-back share is the engine's: for corners of 0.3, 1.2 and 2 rad and a
 *    half of 7 mm, `7 share(angle)` is the set-back
 *    `AutoMovieViewJointedCourse.prepare` reads, the share grows with the angle
 *    from 1 at a straight joint, and `course` dates each turn where the engine
 *    does.
 * 2. A posed half keeps the set-back: a made course of two segments (100 and 80
 *    mm, half 20 mm) bent 0.6 rad, posed at 1.5 rad and at 0.1 rad; the
 *    engine's set-back on the posed centres and halves is the reference one
 *    within 1e-9 mm, and the half itself changed.
 * 3. A point of the far bone stays on it: the point 50 mm from the joint centre
 *    along the second segment has a station on the reference course
 *    (`AutoMovieViewAxis.runs`); mapped to the posed course, the engine's axis
 *    stands there at the joint centre plus 50 mm along the posed segment,
 *    within 1e-9 mm, which a rigid rotation of the bone about its joint asks
 *    for.
 * 4. The station map is the identity at the reference angle (none is returned),
 *    keeps the first run's stations, is continuous at every breakpoint and
 *    increasing, and shifts every station past the turn by the turn's change of
 *    arclength.
 * 5. A made twist: on a straight course of two 100 mm runs along -Y with `up` +X,
 *    the far run's segment turned 0.8 rad about Y. The rolled chart at the
 *    course's end is (cos 0.8, 0, -sin 0.8), the far segment's carried +X.
 *    Along the far run (stations 110 to 200 mm, past the straight joint's 20
 *    mm) the roll is a line eased over the joint's half length, 10 mm, at the
 *    run's start: its slope rises there by the quintic smoothstep to `m = 0.8 /
 *    (90 - 5)` and holds, so `x` mm into the run, past the ease, the angle is
 *    `m (x - 5)`: read at 22.5, 45 and 67.5 mm within 1e-9 rad. On the first
 *    run and across the joint the angle is exactly 0. The same course untwisted
 *    takes no roll.
 * 6. A corner fixed on the parent while the far centre turns with the child: the
 *    same made course, its far centre turned 0.7 rad about a pivot off the
 *    course, (10, 25, 0), so the line from the corner to it changes length. The
 *    points 30 and 55 mm from the far centre along the reference run stand,
 *    mapped, 30 and 55 mm from the posed far centre along the posed run, within
 *    1e-9 mm; the first run keeps its stations; and the turn's span is the
 *    posed turn's arclength plus the length the line gained, within 1e-9 mm.
 * 7. A distal twist stays distal: a straight course of three 100 mm runs with
 *    halves 10 mm, its last run's segment turned 0.1 rad about the course. On
 *    the first two runs and across both joints (stations 0, 50, 100, 150, 205)
 *    the rolled axis is the unrolled axis bit for bit, `u` and `v`; a roll that
 *    is one cubic through all its knots stands 1e-9 rad off there.
 * 8. A held angle across a stored turn returns its exact constant jet. The same
 *    oversubscribed ease lengths in a changing span are rejected.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanConicPose.share`, `course`, `halves`, `map`, `twist` and `repose` and reads the results through the engine's `prepare`, `runs` and `jointed` axis.
 * @evidence contracts/development/testing.md#independent-expectations The engine's own set-back and stations, a bone rotated rigidly about its joint, and a chart turned by a known angle about a straight course are derived apart from the law's formulas.
 * @evidence contracts/development/testing.md#distinguishing-cases A bend opened and a bend closed, a straight course with a pure twist, the untwisted course and the constant-angle turn.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous unit on made courses with explicit axes and poses.
 * @evidence contracts/development/common.md#meaningful-documentation Numbers each scenario with its made course, its expectation and its tolerance.
 */
export function test_human_conic_pose(): void {
  type V3 = [number, number, number];
  const failures: string[] = [];
  const near = (
    label: string,
    a: readonly number[],
    b: readonly number[],
    limit: number,
  ): void => {
    const error: number = Math.max(
      ...a.map((x: number, i: number): number => Math.abs(x - b[i]!)),
    );
    if (!(error <= limit) || a.length !== b.length)
      failures.push(
        `${label}: ${JSON.stringify(a)} against ${JSON.stringify(b)} (error ${error})`,
      );
  };
  const prepared = (
    centres: V3[],
    halves: number[],
  ): IAutoMovieViewJointedCourse.ICourse => {
    const made: IAutoMovieViewJointedCourse.ICourse | string =
      AutoMovieViewJointedCourse.prepare(centres, halves);
    if (typeof made === "string")
      throw new Error("made course refused: " + made);
    return made;
  };
  const bent = (angle: number): V3[] => [
    [-100, 0, 0],
    [0, 0, 0],
    [80 * Math.cos(angle), 80 * Math.sin(angle), 0],
  ];

  // 1: the share is the engine's.
  for (const angle of [0.3, 1.2, 2]) {
    const engine: IAutoMovieViewJointedCourse.ICourse = prepared(
      bent(angle),
      [7],
    );
    near(
      "share at " + angle,
      [7 * Q.share(angle)],
      [engine.turns[0]!.setback],
      1e-12,
    );
    const dated: IAutoMovieHumanConicPose.ICourse = Q.course(bent(angle), [7]);
    near(
      "course at " + angle,
      [dated.angles[0]!, dated.setbacks[0]!, dated.starts[0]!],
      [
        engine.turns[0]!.angle,
        engine.turns[0]!.setback,
        engine.turns[0]!.start,
      ],
      1e-9,
    );
  }
  near("share at a straight joint", [Q.share(0)], [1], 0);
  if (
    !(
      Q.share(0.3) > 1 &&
      Q.share(1.2) > Q.share(0.3) &&
      Q.share(2) > Q.share(1.2)
    )
  )
    failures.push("the share does not grow with the angle");

  // 2 to 4: a bend opened and a bend closed.
  const reference: V3[] = bent(0.6);
  const before: IAutoMovieViewJointedCourse.ICourse = prepared(reference, [20]);
  near(
    "identity map",
    [
      Q.map(Q.course(reference, [20]), Q.course(reference, [20])) === null
        ? 1
        : 0,
    ],
    [1],
    0,
  );
  if (Q.halves(reference, [20], reference)[0] !== 20)
    failures.push("the reference half changed");
  for (const angle of [1.5, 0.1]) {
    const posed: V3[] = bent(angle);
    const halves: number[] = Q.halves(reference, [20], posed);
    const after: IAutoMovieViewJointedCourse.ICourse = prepared(posed, halves);
    near(
      "set-back kept at " + angle,
      [after.turns[0]!.setback],
      [before.turns[0]!.setback],
      1e-9,
    );
    if (!(Math.abs(halves[0]! - 20) > 0.1))
      failures.push(`the half did not change at ${angle}: ${halves[0]}`);

    const map: ((station: number) => number) | null = Q.map(
      Q.course(reference, [20]),
      Q.course(posed, halves),
    );
    if (map === null) {
      failures.push(`no map at ${angle}`);
      continue;
    }
    const run: IAutoMovieViewAxis.IRun = (
      AutoMovieViewAxis.runs(reference, [20]) as IAutoMovieViewAxis.IRun[]
    )[1]!;
    const station: number = run.start + (50 - run.from);
    const axis: IAutoMovieViewAxis.IAxis = AutoMovieViewAxis.jointed(
      posed,
      halves,
      [0, 0, 1],
    ) as IAutoMovieViewAxis.IAxis;
    near(
      "far bone at " + angle,
      axis.at(map(station)).origin,
      [50 * Math.cos(angle), 50 * Math.sin(angle), 0],
      1e-9,
    );

    const [start, end]: number[] = [
      before.turns[0]!.start,
      before.turns[0]!.start + 40,
    ];
    near(
      "first run kept at " + angle,
      [map(-5), map(0), map(30), map(start!)],
      [-5, 0, 30, start!],
      1e-9,
    );
    for (const at of [start!, end!])
      near(
        "continuous at " + at + " for " + angle,
        [map(at + 1e-7) - map(at - 1e-7)],
        [0],
        1e-6,
      );
    const shift: number = 2 * (halves[0]! - 20);
    near(
      "shift past the turn at " + angle,
      [map(end! + 10) - (end! + 10), map(end! + 60) - (end! + 60)],
      [shift, shift],
      1e-9,
    );
    const samples: number[] = Array.from(
      { length: 200 },
      (_: unknown, i: number): number => map(-10 + i),
    );
    if (
      !samples.every(
        (s: number, i: number): boolean => i === 0 || s > samples[i - 1]!,
      )
    )
      failures.push(`the map is not increasing at ${angle}`);
  }

  // 5: a made twist.
  const straight: V3[] = [
    [0, 0, 0],
    [0, -100, 0],
    [0, -200, 0],
  ];
  const family: IAutoMovieHumanConicLoft.IFamily = {
    name: "made",
    centres: straight,
    halves: [10],
    up: [1, 0, 0],
    layout: AutoMovieHumanConicSection.limb(1),
    knots: [0, 200],
    values: [],
  };
  const turned = (run: number, d: V3): V3 =>
    run === 1
      ? [
          Math.cos(0.8) * d[0] + Math.sin(0.8) * d[2],
          d[1],
          -Math.sin(0.8) * d[0] + Math.cos(0.8) * d[2],
        ]
      : d;
  const roll: IAutoMovieHumanConicLoft.IRoll | undefined = Q.twist(
    family,
    family,
    turned,
  );
  if (roll === undefined) failures.push("the twisted course took no roll");
  else {
    const rolled = AutoMovieHumanConicLoft.axis({ ...family, roll });
    const angle = (s: number): number =>
      Math.atan2(-rolled.at(s).u[2], rolled.at(s).u[0]);
    near(
      "chart at the twisted end",
      rolled.at(200).u,
      [Math.cos(0.8), 0, -Math.sin(0.8)],
      1e-9,
    );
    const slope: number = 0.8 / (90 - 5);
    near(
      "roll along the far run",
      [angle(132.5), angle(155), angle(177.5)],
      [slope * (22.5 - 5), slope * (45 - 5), slope * (67.5 - 5)],
      1e-9,
    );
    near(
      "no roll on the first run",
      [angle(0), angle(50), angle(100), angle(110)],
      [0, 0, 0, 0],
      0,
    );
  }
  if (Q.twist(family, family, (_: number, d: V3): V3 => d) !== undefined)
    failures.push("the untwisted course took a roll");
  const carried = Q.repose(
    family,
    straight,
    [1, 0, 0],
    (_: number, d: V3): V3 => d,
  );
  if (
    carried.station !== null ||
    carried.family.knots !== family.knots ||
    carried.family.halves !== family.halves ||
    carried.family.roll !== undefined
  )
    failures.push("a family reposed at its own pose is not its own");

  // 6: a corner fixed on the parent, the far centre turned with the child about a pivot off the course.
  const pivot: V3 = [10, 25, 0];
  const far: V3 = reference[2]!;
  const [c, s]: number[] = [Math.cos(0.7), Math.sin(0.7)];
  const swung: V3 = [
    pivot[0] + c! * (far[0] - pivot[0]) - s! * (far[1] - pivot[1]),
    pivot[1] + s! * (far[0] - pivot[0]) + c! * (far[1] - pivot[1]),
    0,
  ];
  const hinged: V3[] = [reference[0]!, reference[1]!, swung];
  const length: number = Math.hypot(swung[0], swung[1]);
  const kept: number[] = Q.halves(reference, [20], hinged);
  const [stood, hung2]: IAutoMovieHumanConicPose.ICourse[] = [
    Q.course(reference, [20]),
    Q.course(hinged, kept),
  ];
  const carry: ((station: number) => number) | null = Q.map(stood!, hung2!);
  if (carry === null || !(Math.abs(length - 80) > 5))
    failures.push(`the hinged course did not change length: ${length}`);
  else {
    const line: IAutoMovieViewAxis.IAxis = AutoMovieViewAxis.jointed(
      hinged,
      kept,
      [0, 0, 1],
    ) as IAutoMovieViewAxis.IAxis;
    for (const back of [30, 55])
      near(
        "child's run " + back + " mm from its centre",
        line.at(carry(stood!.total - back)).origin,
        [
          swung[0] - (back * swung[0]) / length,
          swung[1] - (back * swung[1]) / length,
          0,
        ],
        1e-9,
      );
    near(
      "first run kept under the hinge",
      [carry(0), carry(40), carry(stood!.starts[0]!)],
      [0, 40, stood!.starts[0]!],
      1e-9,
    );
    near(
      "the turn's span takes the difference",
      [carry(stood!.starts[0]! + 40) - carry(stood!.starts[0]!)],
      [2 * kept[0]! + (length - 80)],
      1e-9,
    );
  }

  // 7: a distal twist stays distal.
  const three: V3[] = [
    [0, 0, 0],
    [0, -100, 0],
    [0, -200, 0],
    [0, -300, 0],
  ];
  const long: IAutoMovieHumanConicLoft.IFamily = {
    name: "made",
    centres: three,
    halves: [10, 10],
    up: [1, 0, 0],
    layout: AutoMovieHumanConicSection.limb(1),
    knots: [0, 300],
    values: [],
  };
  const distal: IAutoMovieHumanConicLoft.IRoll | undefined = Q.twist(
    long,
    long,
    (run: number, d: V3): V3 =>
      run === 2
        ? [
            Math.cos(0.1) * d[0] + Math.sin(0.1) * d[2],
            d[1],
            -Math.sin(0.1) * d[0] + Math.cos(0.1) * d[2],
          ]
        : d,
  );
  if (distal === undefined)
    failures.push("the distally twisted course took no roll");
  else {
    const [plain, rolled] = [
      AutoMovieHumanConicLoft.axis(long),
      AutoMovieHumanConicLoft.axis({ ...long, roll: distal }),
    ];
    for (const s of [0, 50, 100, 150, 205])
      near(
        "untwisted runs at " + s,
        [...rolled.at(s).u, ...rolled.at(s).v],
        [...plain.at(s).u, ...plain.at(s).v],
        0,
      );
    near(
      "twisted end",
      [Math.atan2(-rolled.at(300).u[2], rolled.at(300).u[0])],
      [0.1],
      1e-12,
    );
  }

  // 8: a constant turn has no ease interpolation even if its endpoint difference gives a truncated stored span.
  const knots: number[] = [400, 512, 592 - 2 ** -43, 700];
  const eases: number[] = [0, 40, 40, 0];
  try {
    const held = AutoMovieHumanConicLoft.eased({
      knots,
      eases,
      values: [0, 0.4, 0.4, 0.8],
    });
    for (const station of [knots[1]!, 552, knots[2]!])
      near("held roll at " + station, held(station), [0.4, 0, 0], 0);
  } catch (error: unknown) {
    failures.push(
      "a held turn was refused: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }
  try {
    AutoMovieHumanConicLoft.eased({ knots, eases, values: [0, 0.4, 0.6, 0.8] });
    failures.push("an active stretch accepted ease lengths that overlap");
  } catch (error: unknown) {
    if (
      !(
        error instanceof Error &&
        error.message.includes("are negative or longer")
      )
    )
      failures.push("the active overlap did not reach the intended admission");
  }

  if (failures.length > 0)
    throw new Error(
      `conic pose: ${failures.length} finding(s):\n${failures.join("\n")}`,
    );
}
