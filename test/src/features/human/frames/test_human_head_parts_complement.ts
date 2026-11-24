import { FamilyConicHeadParts as H } from "../../../reference-conics/FamilyConicHeadParts";

type V = [number, number, number];

/**
 * The head's parts are complements on their shared surfaces too: a point exactly on a surface is kept by exactly one part, the part
 * whose surface it is, for every pair.
 *
 * Made cut surfaces in mm allow exact independent boundary points. The nose
 * has a rear plane at x = 110 between y = 1540 and 1600. The orbit is a cylinder
 * of radius 20.25 centred at y = 1594, z = 32, clipped below x = 91. The mouth
 * cut is bounded at |z| = 22, the wall ring at y = 1477.
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
 * @evidence contracts/development/testing.md#independent-expectations Each point is placed by the made surfaces' arithmetic, exact at the named axis-aligned boundaries. Boundary ownership follows the stated ordering.
 * @evidence contracts/development/testing.md#distinguishing-cases One point on every surface, the two points where two surfaces meet, and one strictly inside each of the four regions. Generic frames, where a point on a surface is not exact in floating point, and the -Z twin are not covered.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit uses made source cuts independently of capture and generation.
 * @evidence contracts/development/common.md#meaningful-documentation States the made cut surfaces, their units and each expected owner.
 */
export function test_human_head_parts_complement(): void {
  const failures: string[] = [];
  const parts: H.IPart[] = H.build({
    ring: ([, y]) => 1477 - y,
    nose: ([x, y]) => Math.max(110 - x, 1540 - y, y - 1600),
    orbit: ([x, y, z]) => Math.max(91 - x, Math.hypot(y - 1594, z - 32) - 20.25),
    lips: ([x, y, z]) => Math.max(105 - x, 1504 - y, y - 1540, Math.abs(z) - 22),
  });
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
