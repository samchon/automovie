import { FamilyConicHeadParts as H } from "../../../reference-conics/FamilyConicHeadParts";

type V = [number, number, number];

/**
 * The head's parts are complements on their shared surfaces too: a point exactly on a surface is kept by exactly one part, the part
 * whose surface it is, for every pair.
 *
 * Made landmarks, mm, chosen so that points can be put exactly on each surface in floating point: the nose's line vertical (nasion
 * `(120, 1600, 0)`, subnasale `(120, 1540, 0)`, alar base `(110, 1548, 18)`), so its plane is `x = 110` between the levels 1540 and
 * 1600; the canthal line along Z (globe `(91, 1594, 32)`, canthi at z 16 and 48), so the orbit is the cylinder about the forward axis
 * with semi-axes 20.25 along Z and 18.65 along Y, ahead of `x = 91`; stomion `(113, 1522, 0)` and cheilion `(105, 1520, 22)`, so the
 * lips' wedge ends at `z = 22`.
 *
 * Points and the one part each must be kept by:
 * 1. The alar base, on the nose's plane: the nose.
 * 2. `(110, 1594, 20)`, on the nose's plane and inside the eye's cylinder (12 of 20.25 from its axis): the nose, not the eye. Read as
 *    two surfaces each closed on its own side it would be both parts'.
 * 3. Subnasale, on the nose's lower level and on the lips' upper half plane: the nose, not the lips.
 * 4. `(96, 1594, 52.25)`, on the eye's cylinder at the end of its breadth: the eye, not the wall.
 * 5. Cheilion, on the lips' end plane: the lips, not the wall.
 * 6. A point of the ring's plane on the course: the wall.
 * 7. Controls strictly inside each region and the wall: each kept by its own part alone.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the parts with `FamilyConicHeadParts.build` and calls every part's `keeps` on each point. It catches a point kept by two parts or by none, and a point given to the neighbour instead of the surface's owner.
 * @evidence contracts/development/testing.md#independent-expectations Each point is placed by the made landmarks' arithmetic written above, exact in floating point because the made axes are coordinate axes; the expected owner is the membership rule's statement, not a run's output.
 * @evidence contracts/development/common.md#meaningful-documentation Nose, eye, lip and wall cases have exclusive expected owners, including shared dividing surfaces. Coordinate axes give exact synthetic boundary points.
 */
export function test_human_head_parts_complement(): void {
  const failures: string[] = [];
  const parts: H.IPart[] = H.build(
    {
      nasion: [120, 1600, 0],
      subnasale: [120, 1540, 0],
      alarBase: [110, 1548, 18],
      stomion: [113, 1522, 0],
      cheilion: [105, 1520, 22],
      sublabiale: [110, 1504, 0],
      cervical: [60, 1477, 0],
      globe: [91, 1594, 32],
      endocanthion: [95, 1594, 16],
      exocanthion: [95, 1594, 48],
    },
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    [21, 1563, 0],
    [21, 1415, 0],
  );
  const owners = (p: V): string => parts.filter((one: H.IPart): boolean => one.keeps(p)).map((one: H.IPart): string => one.name).join(" and ") || "no part";
  const cases: [string, V, string][] = [
    ["the alar base", [110, 1548, 18], "nose"],
    ["on the nose's plane inside the eye's cylinder", [110, 1594, 20], "nose"],
    ["subnasale", [120, 1540, 0], "nose"],
    ["on the eye's cylinder", [96, 1594, 52.25], "eye"],
    ["cheilion", [105, 1520, 22], "lips"],
    ["on the ring's plane", [21, 1477, 0], "head"],
    ["inside the nose", [125, 1560, 0], "nose"],
    ["inside the eye", [100, 1594, 35], "eye"],
    ["inside the lips", [118, 1524, 5], "lips"],
    ["on the forehead", [100, 1650, 30], "head"],
  ];
  for (const [label, p, want] of cases) if (owners(p) !== want) failures.push(`${label}: kept by ${owners(p)}, expected ${want}`);

  // Red control: read by each part's own measure closed on its own side (`outside <= 0`), the rule this one replaced, the point on the
  // nose's plane inside the eye's cylinder is two parts'. The check above must be able to see that.
  const closed = (p: V): string[] => parts.filter((one: H.IPart): boolean => one.name !== "head" && one.outside(p) <= 0).map((one: H.IPart): string => one.name);
  if (closed([110, 1594, 20]).join(" and ") !== "nose and eye") failures.push(`control: each measure closed on its own side keeps the shared point by ${closed([110, 1594, 20]).join(" and ") || "no part"}, expected nose and eye`);
  if (failures.length !== 0) throw new Error(`${failures.length} head complement failures:\n${failures.join("\n")}`);
}
