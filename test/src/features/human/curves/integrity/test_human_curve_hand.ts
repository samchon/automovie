import { assertHumanCurves } from "../../../internal/assertHumanCurves";
import { HumanCurveAudit } from "../../../internal/HumanCurveAudit";
import { HumanPeople } from "../../../internal/HumanPeople";

/**
 * The hands and their joins are sound curves and sound skin, on every person.
 *
 * Besides the curve rules, four rules read what those miss: `tear`, the sharpest
 * fold between the hand's neighbouring triangles; `crumple`, sharp edges crowding
 * one small patch of skin, though no single fold is sharp enough to tear; `join`,
 * how far a child's own end ring stands off the parent's arc it inherits, where
 * a child inherits arcs; and `dome`, the angle at which a digit's rounded tip
 * leaves its tube. The digits and the palm start apart from their parents' rings
 * and meet them through the webs' own surface, which only the mesh rules read.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person and audits the palm, finger and thumb chains, catching a reversed ring, an unfinite control, a slipped web or a palm that leaves the wrist with a broken join, and meshes each hand, webs included, to catch torn or crumpled skin at a digit's root, which no curve shows. Any hand size passes, and fingers skip the bands their caps would raise.
 * @evidence contracts/testing.md#independent-expectations Finiteness, winding, join closure, the fold between triangles and the tangent at a tip are the basis, independent of the hand's stored sections. The wrist seam has its own wide limit, since the sections turn across the hand there, so the rule catches a broken wrist and not a stiff one.
 * @evidence contracts/testing.md#distinguishing-cases Spreads hands by stature and girth across a heavy, a slight, a tall and a short person, where a law in the wrong tape shows at once, and reads both hands, since a mirrored mesh takes other diagonals and left alone hid a tear. The arm's test owns the forearm, and the digit branch here owns what the plain rules exempt.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curve_hand` over the people it generates, with no process, browser or GPU; a hand's mesh is lofted from the arm's own chains, not the body's.
 */
export function test_human_curve_hand(): void {
  const failures: string[] = [];
  try {
    assertHumanCurves(/^(hand|finger|thumb)\./);
  } catch (error) {
    failures.push((error as Error).message);
  }

  // The meshed hand's own rules, read after the curve rules so both lists fail together.
  const findings: HumanCurveAudit.IHumanCurveFinding[] =
    HumanPeople.names().flatMap(
      (name: string): HumanCurveAudit.IHumanCurveFinding[] => {
        const p: HumanPeople.IPerson = HumanPeople.person(name);
        return HumanCurveAudit.auditHumanHand(p.name, p.body);
      },
    );
  failures.push(
    ...findings.map(
      (f: HumanCurveAudit.IHumanCurveFinding): string =>
        `${f.rule.padEnd(10)} ${f.region.padEnd(28)} ${f.where.padEnd(26)} ${f.person.padEnd(10)} ${f.value.toFixed(2)} over ${f.limit} at ${f.count} points near ${f.point.map((v: number): string => v.toFixed(0)).join(" ")}`,
    ),
  );
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
