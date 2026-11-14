import { AutoMovieViewAxis, AutoMovieViewJointedCourse } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanConicPose as Q, AutoMovieHumanConicSection, AutoMovieHumanF1, AutoMovieHumanF1Placement as P, AutoMovieHumanF1Placing as T } from "@automovie/human";

/**
 * A conic family carried to a pose: its turns keep their set-backs, its stations stay on their bones and its chart takes its joints'
 * twist, and none of it moves the reference pose.
 *
 * Scenarios:
 * 1. The set-back share is the engine's: for corners of 0.3, 1.2 and 2 rad and a half of 7 mm, `7 share(angle)` is the set-back
 *    `AutoMovieViewJointedCourse.prepare` reads, the share grows with the angle from 1 at a straight joint, and `course` dates each turn
 *    where the engine does.
 * 2. A posed half keeps the set-back: a made course of two segments (100 and 80 mm, half 20 mm) bent 0.6 rad, posed at 1.5 rad and at
 *    0.1 rad; the engine's set-back on the posed centres and halves is the reference one within 1e-9 mm, and the half itself changed.
 * 3. A point of the far bone stays on it: the point 50 mm from the joint centre along the second segment has a station on the
 *    reference course (`AutoMovieViewAxis.runs`); mapped to the posed course, the engine's axis stands there at the joint centre plus
 *    50 mm along the posed segment, within 1e-9 mm, which a rigid rotation of the bone about its joint asks for.
 * 4. The station map is the identity at the reference angle (none is returned), keeps the first run's stations, is continuous at every
 *    breakpoint and increasing, and shifts every station past the turn by the turn's change of arclength.
 * 5. A made twist: on a straight course of two 100 mm runs along -Y with `up` +X, the far run's segment turned 0.8 rad about Y. The
 *    rolled chart at the course's end is (cos 0.8, 0, -sin 0.8), the far segment's carried +X; at the middle of the far run (stations
 *    110 to 200 mm, past the straight joint's 20 mm) it has turned half as far and at its quarters a quarter and three quarters, within
 *    0.02 rad of a line; on the first run and across the joint it has not turned, within 0.02 rad. The same course untwisted
 *    takes no roll.
 * 6. f1 at the reference pose: `assemble()` adds no roll (only the plate rolls, by its own stored roll) and maps no station (445 mm on
 *    the arm reads 445, a 10 mm stretch 10). At the neutral pose the leg's course, whose four runs are bones of one segment each, keeps
 *    every segment's length and every set-back within 1e-9 mm, and the engine admits it.
 * 7. A corner fixed on the parent while the far centre turns with the child: the same made course, its far centre turned 0.7 rad about a
 *    pivot off the course, (10, 25, 0), so the line from the corner to it changes length. The points 30 and 55 mm from the far centre
 *    along the reference run stand, mapped, 30 and 55 mm from the posed far centre along the posed run, within 1e-9 mm; the first run
 *    keeps its stations; and the turn's span is the posed turn's arclength plus the length the line gained, within 1e-9 mm.
 * 8. The neutral pose sets the articulated joints and nothing else: `ARTICULATED`, `RIGID` and the trunk's three frames are the whole
 *    chain without overlap, and `NEUTRAL` gives the identity for exactly the articulated ones.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanConicPose.share`, `course`, `halves`, `map`, `twist` and `repose` and reads the results through the engine's `prepare`, `runs` and `jointed` axis.
 * @evidence contracts/development/testing.md#independent-expectations The engine's own set-back and stations, a bone rotated rigidly about its joint, and a chart turned by a known angle about a straight course are derived apart from the law's formulas.
 * @evidence contracts/development/testing.md#distinguishing-cases A bend opened and a bend closed, a straight course with a pure twist, the untwisted course, and f1's reference and neutral poses.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit on made courses and f1's placing tables, reached by `--include human_conic_pose`; it lofts nothing and reads no reference body.
 * @evidence contracts/development/common.md#meaningful-documentation Numbers each scenario with its made course, its expectation and its tolerance.
 */
export function test_human_conic_pose(): void {
  type V3 = [number, number, number];
  const failures: string[] = [];
  const near = (label: string, a: readonly number[], b: readonly number[], limit: number): void => {
    const error: number = Math.max(...a.map((x: number, i: number): number => Math.abs(x - b[i]!)));
    if (!(error <= limit) || a.length !== b.length) failures.push(`${label}: ${JSON.stringify(a)} against ${JSON.stringify(b)} (error ${error})`);
  };
  const prepared = (centres: V3[], halves: number[]): AutoMovieViewJointedCourse.ICourse => {
    const made: AutoMovieViewJointedCourse.ICourse | string = AutoMovieViewJointedCourse.prepare(centres, halves);
    if (typeof made === "string") throw new Error("made course refused: " + made);
    return made;
  };
  const bent = (angle: number): V3[] => [[-100, 0, 0], [0, 0, 0], [80 * Math.cos(angle), 80 * Math.sin(angle), 0]];

  // 1: the share is the engine's.
  for (const angle of [0.3, 1.2, 2]) {
    const engine: AutoMovieViewJointedCourse.ICourse = prepared(bent(angle), [7]);
    near("share at " + angle, [7 * Q.share(angle)], [engine.turns[0]!.setback], 1e-12);
    const dated: Q.ICourse = Q.course(bent(angle), [7]);
    near("course at " + angle, [dated.angles[0]!, dated.setbacks[0]!, dated.starts[0]!], [engine.turns[0]!.angle, engine.turns[0]!.setback, engine.turns[0]!.start], 1e-9);
  }
  near("share at a straight joint", [Q.share(0)], [1], 0);
  if (!(Q.share(0.3) > 1 && Q.share(1.2) > Q.share(0.3) && Q.share(2) > Q.share(1.2))) failures.push("the share does not grow with the angle");

  // 2 to 4: a bend opened and a bend closed.
  const reference: V3[] = bent(0.6);
  const before: AutoMovieViewJointedCourse.ICourse = prepared(reference, [20]);
  near("identity map", [Q.map(Q.course(reference, [20]), Q.course(reference, [20])) === null ? 1 : 0], [1], 0);
  if (Q.halves(reference, [20], reference)[0] !== 20) failures.push("the reference half changed");
  for (const angle of [1.5, 0.1]) {
    const posed: V3[] = bent(angle);
    const halves: number[] = Q.halves(reference, [20], posed);
    const after: AutoMovieViewJointedCourse.ICourse = prepared(posed, halves);
    near("set-back kept at " + angle, [after.turns[0]!.setback], [before.turns[0]!.setback], 1e-9);
    if (!(Math.abs(halves[0]! - 20) > 0.1)) failures.push(`the half did not change at ${angle}: ${halves[0]}`);

    const map: ((station: number) => number) | null = Q.map(Q.course(reference, [20]), Q.course(posed, halves));
    if (map === null) {
      failures.push(`no map at ${angle}`);
      continue;
    }
    const run: AutoMovieViewAxis.IRun = (AutoMovieViewAxis.runs(reference, [20]) as AutoMovieViewAxis.IRun[])[1]!;
    const station: number = run.start + (50 - run.from);
    const axis: AutoMovieViewAxis.IAxis = AutoMovieViewAxis.jointed(posed, halves, [0, 0, 1]) as AutoMovieViewAxis.IAxis;
    near("far bone at " + angle, axis.at(map(station)).origin, [50 * Math.cos(angle), 50 * Math.sin(angle), 0], 1e-9);

    const [start, end]: number[] = [before.turns[0]!.start, before.turns[0]!.start + 40];
    near("first run kept at " + angle, [map(-5), map(0), map(30), map(start!)], [-5, 0, 30, start!], 1e-9);
    for (const at of [start!, end!]) near("continuous at " + at + " for " + angle, [map(at + 1e-7) - map(at - 1e-7)], [0], 1e-6);
    const shift: number = 2 * (halves[0]! - 20);
    near("shift past the turn at " + angle, [map(end! + 10) - (end! + 10), map(end! + 60) - (end! + 60)], [shift, shift], 1e-9);
    const samples: number[] = Array.from({ length: 200 }, (_: unknown, i: number): number => map(-10 + i));
    if (!samples.every((s: number, i: number): boolean => i === 0 || s > samples[i - 1]!)) failures.push(`the map is not increasing at ${angle}`);
  }

  // 5: a made twist.
  const straight: V3[] = [[0, 0, 0], [0, -100, 0], [0, -200, 0]];
  const family: AutoMovieHumanConicLoft.IFamily = { name: "made", centres: straight, halves: [10], up: [1, 0, 0], layout: AutoMovieHumanConicSection.limb(1), knots: [0, 200], values: [] };
  const turned = (run: number, d: V3): V3 => (run === 1 ? [Math.cos(0.8) * d[0] + Math.sin(0.8) * d[2], d[1], -Math.sin(0.8) * d[0] + Math.cos(0.8) * d[2]] : d);
  const roll: AutoMovieHumanConicLoft.IRoll | undefined = Q.twist(family, family, turned);
  if (roll === undefined) failures.push("the twisted course took no roll");
  else {
    const rolled = AutoMovieHumanConicLoft.axis({ ...family, roll });
    const angle = (s: number): number => Math.atan2(-rolled.at(s).u[2], rolled.at(s).u[0]);
    near("chart at the twisted end", rolled.at(200).u, [Math.cos(0.8), 0, -Math.sin(0.8)], 1e-9);
    near("roll at the far run's middle", [angle(155)], [0.4], 0.02);
    near("roll at the far run's quarters", [angle(132.5), angle(177.5)], [0.2, 0.6], 0.02);
    near("no roll on the first run", [angle(0), angle(50), angle(100)], [0, 0, 0], 0.02);
  }
  if (Q.twist(family, family, (_: number, d: V3): V3 => d) !== undefined) failures.push("the untwisted course took a roll");
  const carried = Q.repose(family, straight, [1, 0, 0], (_: number, d: V3): V3 => d);
  if (carried.station !== null || carried.family.knots !== family.knots || carried.family.halves !== family.halves || carried.family.roll !== undefined) failures.push("a family reposed at its own pose is not its own");

  // 6: f1 at the reference pose and the leg at neutral.
  const stored: AutoMovieHumanF1.IAssembly = AutoMovieHumanF1.assemble();
  for (const placed of stored.families) if ((placed.roll !== undefined) !== (placed.name === "plate")) failures.push(`${placed.name}: a roll at the reference pose`);
  near("reference stations", [stored.station("arm", 445), stored.station("arm", 32, 10), stored.station("leg", 900)], [445, 10, 900], 0);
  const neutral: AutoMovieHumanF1.IAssembly = AutoMovieHumanF1.assemble(P.NEUTRAL);
  const [leg, hung]: Q.ICourse[] = [Q.course(stored.body.leg.centres, stored.body.leg.halves), Q.course(neutral.body.leg.centres, neutral.body.leg.halves)];
  near("leg bones at neutral", hung!.lengths, leg!.lengths, 1e-9);
  near("leg set-backs at neutral", hung!.setbacks, leg!.setbacks, 1e-9);
  if (typeof AutoMovieViewJointedCourse.prepare(neutral.body.leg.centres, neutral.body.leg.halves) === "string") failures.push("the engine refuses the neutral leg's course");

  // 7: a corner fixed on the parent, the far centre turned with the child about a pivot off the course.
  const pivot: V3 = [10, 25, 0];
  const far: V3 = reference[2]!;
  const [c, s]: number[] = [Math.cos(0.7), Math.sin(0.7)];
  const swung: V3 = [pivot[0] + c! * (far[0] - pivot[0]) - s! * (far[1] - pivot[1]), pivot[1] + s! * (far[0] - pivot[0]) + c! * (far[1] - pivot[1]), 0];
  const hinged: V3[] = [reference[0]!, reference[1]!, swung];
  const length: number = Math.hypot(swung[0], swung[1]);
  const kept: number[] = Q.halves(reference, [20], hinged);
  const [stood, hung2]: Q.ICourse[] = [Q.course(reference, [20]), Q.course(hinged, kept)];
  const carry: ((station: number) => number) | null = Q.map(stood!, hung2!);
  if (carry === null || !(Math.abs(length - 80) > 5)) failures.push(`the hinged course did not change length: ${length}`);
  else {
    const line: AutoMovieViewAxis.IAxis = AutoMovieViewAxis.jointed(hinged, kept, [0, 0, 1]) as AutoMovieViewAxis.IAxis;
    for (const back of [30, 55]) near("child's run " + back + " mm from its centre", line.at(carry(stood!.total - back)).origin, [swung[0] - (back * swung[0]) / length, swung[1] - (back * swung[1]) / length, 0], 1e-9);
    near("first run kept under the hinge", [carry(0), carry(40), carry(stood!.starts[0]!)], [0, 40, stood!.starts[0]!], 1e-9);
    near("the turn's span takes the difference", [carry(stood!.starts[0]! + 40) - carry(stood!.starts[0]!)], [2 * kept[0]! + (length - 80)], 1e-9);
  }

  // 8: the neutral pose sets the articulated joints and nothing else.
  const named: string[] = [...P.ARTICULATED, ...P.RIGID, "pelvis", "thorax", "head"].sort((a: string, b: string): number => a.localeCompare(b));
  near("joints and rigid parts are the chain", [named.length, new Set(named).size, named.join() === T.CHAIN.map((joint: { name: string }): string => joint.name).sort((a: string, b: string): number => a.localeCompare(b)).join() ? 1 : 0], [T.CHAIN.length, T.CHAIN.length, 1], 0);
  for (const joint of T.CHAIN) {
    const posed: readonly (readonly number[])[] | undefined = P.NEUTRAL(joint.name);
    if ((posed !== undefined) !== P.ARTICULATED.includes(joint.name)) failures.push(`${joint.name}: neutral ${posed === undefined ? "keeps" : "sets"} its rotation`);
    if (posed !== undefined) near(joint.name + " neutral rotation", posed.flat(), [1, 0, 0, 0, 1, 0, 0, 0, 1], 0);
  }

  if (failures.length > 0) throw new Error(`conic pose: ${failures.length} finding(s):\n${failures.join("\n")}`);
}
