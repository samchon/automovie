import { AutoMovieLoftViewFullSource, AutoMovieViewAxis } from "@automovie/engine";
import type { IAutoMovieHumanConicLoft } from "@automovie/interface";
import { AutoMovieHumanConicLoft, AutoMovieHumanConicSection, AutoMovieHumanF1Divide as D, AutoMovieHumanGlutealParent, AutoMovieHumanJoinLoop } from "@automovie/human";

/**
 * Every point of skin has exactly one owner across each dividing surface: inside a surface's region the side decides, outside it the
 * near part keeps the point and the far part has no claim.
 *
 * The made body, millimetres: a trunk with a shoulder at (0, 100, 50) and an arm running out along +z through an elbow at
 * (0, 100, 150) to a wrist at (0, 100, 250); the armscye is the plane z = 60 (positive toward the arm) with a ball of 40 about the
 * shoulder and a tube of 20 about the arm's course. A hand runs on from the wrist's plane z = 250 to its heads' plane z = 300, with
 * two fingers at x = -10 and x = +10 pointing along +z, and a thumb whose root surface is the plane x = 25 (positive toward +x)
 * with a ball of 12 about (25, 100, 270) and a tube of 12 about the course from there along +x. Two toes mirror the fingers on a
 * foot far away. The hip is level and the crotch the median plane.
 *
 * Scenarios, each read through `outside(part)(p) <= 0` as "the part keeps p":
 * 1. Inside the armscye's ball: (0, 100, 55), medial of the plane, is the trunk's alone; (0, 100, 70), lateral, the arm's alone.
 * 2. Outside the ball and the tube, lateral of the plane: (0, 300, 80), 200 mm above the arm, is the trunk's and not the arm's.
 * 3. Past the ball, inside the tube: (5, 100, 200) on the forearm is the arm's and not the trunk's.
 * 4. The thumb's root: (30, 100, 270) is the thumb's alone; (20, 100, 270) the hand's alone; and (30, 100, 320), past the heads'
 *    plane beside a finger and 50 mm from the thumb's course, lies on the thumb's side of its plane but outside its region: the
 *    thumb has no claim to it, and among the hand and the two fingers exactly one keeps it.
 * 5. The row: (-10, 100, 310) is the first finger's alone among hand and fingers, (10, 100, 310) the second's, (0.5, 100, 290) the
 *    hand's.
 * 6. A hundred points on a lattice round the hand: every one is kept by exactly one of the hand, the two fingers and the thumb.
 * 7. A course turns from +X to +Y. (-15,0,2) addresses the first straight leg 5 mm from its start. (-6,6,0) has a separate perpendicular in each straight leg with another crossing through the turn. A point behind both axes has no address. Translating the whole source preserves the first address only with the matching declared offset.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanF1Divide.create` and `outside` and reads which parts keep made points. It catches a far part that claims skin beyond its region, a near part that gives skin up outside it, a row plane with the wrong sign, and any point with two owners or none.
 * @evidence contracts/development/testing.md#independent-expectations Each point's owner is read off the made planes, balls and tubes by hand in the text above.
 * @evidence contracts/development/testing.md#distinguishing-cases Inside a region on either side, outside it on the far side, in the tube past the ball, a point on a far side that belongs to another joint, the row's three owners, and a lattice.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_f1_divide`; made numbers only.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six numbered scenarios with their inputs.
 */
export function test_human_f1_divide(): void {
  const failures: string[] = [];
  const owned = D.landmarkOwner([0, 0, 0], [[0, 0, 0], [0, 0, 10]], [[3, 0, 0], [0, 4, 0], [0, 0, 5]]);
  if (!owned([0, 0, 5], true) || !owned([0, 3, 10]) || owned([0, 8, 10]) || owned([0, 4, 10]))
    failures.push("a source landmark closure, the forward material tube and its unrelated outside sheet lost their independent ownership");
  const digit = (part: string, x: number, z: number): D.IDigit => ({ part, first: [x, 100, z], second: [x, 100, z + 30] });
  const surfaces: D.ISurface[] = D.create({
    armscye: { side: (p: D.V): number => p[2] - 60, centre: [0, 100, 50], reach: 40, course: [[0, 100, 50], [0, 100, 150], [0, 100, 250]], tube: 20, part: "arm" },
    wrist: [0, 100, 250],
    thumb: { side: (p: D.V): number => p[0] - 25, centre: [25, 100, 270], reach: 12, course: [[25, 100, 270], [55, 100, 270]], tube: 12, part: "thumb" },
    fingers: [digit("finger.a", -10, 300), digit("finger.b", 10, 300)],
    toes: [digit("toe.a", -10, 1300), digit("toe.b", 10, 1300)],
    sole: [0, 1, 0],
    hip: [0, 0, 80],
    foot: -20,
    ends: { wrist: { point: [0, 100, 250], normal: [0, 0, 1] }, hand: { point: [0, 100, 300], normal: [0, 0, 1] }, foot: { point: [0, 100, 1300], normal: [0, 0, 1] } },
    parts: { trunk: "trunk", arm: "arm", hand: "hand", leg: "leg", twin: "leg.mirror" },
  });
  const keeps = (part: string, p: D.V): boolean => D.outside(surfaces, part)(p) <= 0;
  const owners = (parts: string[], p: D.V): string[] => parts.filter((part: string): boolean => keeps(part, p));
  const expect = (label: string, parts: string[], p: D.V, owner: string[]): void => {
    const found: string[] = owners(parts, p);
    if (found.join(",") !== owner.join(",")) failures.push(`${label}: (${p.join(", ")}) is kept by [${found.join(", ")}], expected [${owner.join(", ")}]`);
  };

  // 1 to 3: the armscye.
  expect("medial inside the ball", ["trunk", "arm"], [0, 100, 55], ["trunk"]);
  expect("lateral inside the ball", ["trunk", "arm"], [0, 100, 70], ["arm"]);
  expect("lateral outside the region", ["trunk", "arm"], [0, 300, 80], ["trunk"]);
  expect("on the forearm, inside the tube", ["trunk", "arm"], [5, 100, 200], ["arm"]);

  // 4: the thumb's root.
  const hand: string[] = ["hand", "finger.a", "finger.b", "thumb"];
  expect("past the thumb's surface at its root", hand, [30, 100, 270], ["thumb"]);
  expect("before the thumb's surface at its root", hand, [20, 100, 270], ["hand"]);
  expect("on the thumb's side but outside its region", hand, [30, 100, 320], ["finger.b"]);

  // 5: the row.
  expect("the first finger", hand, [-10, 100, 310], ["finger.a"]);
  expect("the second finger", hand, [10, 100, 310], ["finger.b"]);
  expect("the hand before its heads", hand, [0.5, 100, 290], ["hand"]);

  // 6: a lattice round the hand.
  for (let i: number = 0; i < 10; ++i)
    for (let j: number = 0; j < 10; ++j) {
      const p: D.V = [-30 + 9.7 * i, 100 + ((i + j) % 3), 255 + 8.3 * j];
      const found: string[] = owners(hand, p);
      if (found.length !== 1) failures.push(`lattice point (${p.join(", ")}) is kept by [${found.join(", ")}]`);
    }

  // Two straight circular walls meet at the same interior station. Moving only the child
  // radius by one millimetre or moving its address onto the cut plane distinguishes them.
  const circle = (radius: number): IAutoMovieHumanConicLoft.IFamily => ({
    name: "made.wall",
    centres: [[0, 0, 0], [0, 20, 0]],
    halves: [],
    up: [1, 0, 0],
    layout: AutoMovieHumanConicSection.limb(0),
    knots: [0, 10, 20],
    values: [radius, 0, 0, radius, -radius, 0, 0, -radius, ...new Array<number>(4).fill(Math.SQRT2 - 1)]
      .map((value: number): number[] => [value, value, value]),
  });
  for (const origin of [0, 70]) {
    const part = { ...AutoMovieHumanConicLoft.part(circle(4), [0, 10, 20]),
      axis: AutoMovieViewAxis.straight([0, origin, 0], [1, 0, 0], [0, 0, 1]) };
    const parent = AutoMovieHumanGlutealParent.trunkOnly(part);
    if (typeof parent === "string") { failures.push(parent); continue; }
    const at = parent.chord(origin + 10, 0), outside = parent.chord(origin - 1, 0);
    if (typeof at === "string" || at.length !== 1 || at[0]!.front.station !== 10 || at[0]!.back.station !== 10 ||
        Math.abs(at[0]!.front.x - 4) > 1e-9 || Math.abs(at[0]!.back.x + 4) > 1e-9 ||
        typeof outside === "string" || outside.length !== 0)
      failures.push("a world-height AP chord lost its actual station, phase or bounded level on the shifted source");
  }
  const lifted: ReturnType<typeof AutoMovieHumanConicLoft.part> = { ...AutoMovieHumanConicLoft.part(circle(4), [0, 10, 20]),
    axis: AutoMovieViewAxis.straight([0, 70, 0], [1, 0, 0], [0, 0, 1]),
    reliefs: [{ name: "shifted.ap", stations: [0, 20], phases: [-1, 1], axis: [Math.SQRT1_2, 0, Math.SQRT1_2],
      rows: 7, columns: 7, heights: Array.from({ length: 49 }, (_, i): number => i === 24 ? 2 : 0) }] };
  const fullAP = AutoMovieLoftViewFullSource.create(lifted);
  const bareAddress = fullAP.point(10, 0);
  const actualAP = fullAP.point(...D.apGerm(lifted, [8, 80, 0], 1e-8));
  if (!(bareAddress[2] > 0 && actualAP[0] > 4 && Math.hypot(actualAP[1] - 80, actualAP[2]) <= 1e-8))
    failures.push("a displaced full AP germ preserved the bare wall's position or lost the actual bust meridian");
  try {
    D.apGerm(lifted, [3, 80, 0], 1e-8);
    failures.push("the AP germ admitted an apex behind the full anterior wall");
  } catch (error: unknown) {
    if (!String(error).includes("no positive projection")) failures.push("wrong full AP projection refusal: " + String(error));
  }
  const h = AutoMovieLoftViewFullSource.create(AutoMovieHumanConicLoft.part(circle(4), [0, 10, 20]));
  const wider = AutoMovieLoftViewFullSource.create(AutoMovieHumanConicLoft.part(circle(5), [0, 10, 20]));
  for (const phase of [0, Math.PI / 4, Math.PI, -Math.PI / 4]) {
    const at: [number, number] = [10, phase];
    if (AutoMovieHumanJoinLoop.columnGap(h, h, at, at) !== 0 ||
        Math.abs(AutoMovieHumanJoinLoop.columnGap(h, wider, at, at) - 1) > 1e-10)
      failures.push("the paired physical chart did not measure the independent one-millimetre radial mismatch");
  }
  try {
    AutoMovieHumanJoinLoop.columnGap(h, h, [10, 0], [0, 0]);
    failures.push("a child cut plane was accepted as an interior wall");
  } catch (error) {
    if (!String(error).includes("interior station")) failures.push("wrong child-domain refusal: " + String(error));
  }

  const course: IAutoMovieHumanConicLoft.IFamily = {
    name: "proved",
    centres: [[-20, 0, 0], [0, 0, 0], [0, 20, 0]],
    halves: [2],
    up: [0, 0, 1],
    layout: AutoMovieHumanConicSection.limb(0),
    knots: [0, 20, 35],
    values: [],
  };
  const part = { name: course.name, axis: AutoMovieHumanConicLoft.axis(course) };
  const address = AutoMovieHumanJoinLoop.certifiedAddress(part, [0, 35], course);
  const [station, phase] = address([-15, 0, 2]);
  if (Math.abs(station - 5) > 1e-9 || Math.abs(phase) > 1e-12)
    failures.push("the straight leg lost its exact world-plane address");
  const refuse = (point: D.V, reason: string): void => {
    try {
      address(point);
      failures.push("a missing or competing plane address was accepted");
    } catch (error) {
      if (!String(error).includes(reason)) failures.push("the plane witness was refused for the wrong reason: " + String(error));
    }
  };
  refuse([-6, 6, 0], "3 certified plane addresses");
  refuse([-30, -20, 0], "0 certified plane addresses");

  const translation: D.V = [10, 4, 8];
  const shifted = { ...part, axis: { at: (s: number): ReturnType<typeof part.axis.at> => {
    const frame = part.axis.at(s);
    return { ...frame, origin: [frame.origin[0] + 10, frame.origin[1] + 4, frame.origin[2] + 8] };
  } } };
  const posed = AutoMovieHumanJoinLoop.certifiedAddress(shifted, [0, 35], course, translation);
  if (Math.abs(posed([-5, 4, 10])[0] - 5) > 1e-9)
    failures.push("the same placed course lost its address after the authored translation");
  try {
    AutoMovieHumanJoinLoop.certifiedAddress(shifted, [0, 35], course)([-5, 4, 10]);
    failures.push("an origin translation without source declaration was admitted");
  } catch (error) {
    if (!String(error).includes("source axis differs")) failures.push("a mismatched placed axis was refused for the wrong reason");
  }

  if (failures.length > 0) throw new Error(`dividing surfaces: ${failures.length} finding(s):\n${failures.join("\n")}`);
}
