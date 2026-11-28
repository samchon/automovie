import { AutoMovieHumanF1Divide as D } from "@automovie/human";

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
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanF1Divide.create` and `outside` and reads which parts keep made points. It catches a far part that claims skin beyond its region, a near part that gives skin up outside it, a row plane with the wrong sign, and any point with two owners or none.
 * @evidence contracts/development/testing.md#independent-expectations Each point's owner is read off the made planes, balls and tubes by hand in the text above.
 * @evidence contracts/development/common.md#meaningful-documentation Points inside and beyond the arm region, at thumb and finger boundaries, and on the surrounding lattice each have an explicitly assigned skin owner.
 */
export function test_human_f1_divide(): void {
  const failures: string[] = [];
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

  if (failures.length > 0) throw new Error(`dividing surfaces: ${failures.length} finding(s):\n${failures.join("\n")}`);
}
