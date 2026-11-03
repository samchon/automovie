import { assertHumanCurves } from "../../../internal/assertHumanCurves";
import { HumanCurveAudit } from "../../../internal/HumanCurveAudit";
import { HumanPeople } from "../../../internal/HumanPeople";

/**
 * The feet and their joins are sound curves and sound skin, on every person.
 *
 * Besides the curve rules, `crumple` reads the foot's meshed skin: sharp edges
 * crowding one small patch, as they do where a web between the toes folds, which
 * no curve shows.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person and audits the foot, forefoot and toe chains, catching a toe's ring running over itself, a crease across the sole, an open toe root, a rib printed across the skin by a section, a groove a web runs back into the padded ball, or a toe closed by a dome that leaves its tube at an angle, and meshes each foot to catch skin crumpled at a web, which no curve shows. A foot of any length or breadth passes, and a toe's short ring is exempt from the rules a cap cannot meet.
 * @evidence contracts/testing.md#independent-expectations Ring orientation, self-crossing, gap and the crowding of sharp folds between triangles are properties of any closed surface, so the expectation owes nothing to the foot's prior. A section pinched at the toes is exempt from the crossing rule, so a crossing there would pass here and rests on the viewer's foot round.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts the references with stature and girth ends, which move a foot through its expected dimensions, and meshes both feet, since a mirrored mesh takes other diagonals. Toe chains take the digit branch of the audit, and the leg's test owns the ankle ring the foot hands over, so the ankle's closing fan is not read.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curve_foot`, sharing the cached people with the other curve units and starting no external host; a foot's mesh is lofted from its own chains, not the body's.
 */
export function test_human_curve_foot(): void {
  const failures: string[] = [];
  try {
    assertHumanCurves(/^(foot|forefoot|toe)\./);
  } catch (error) {
    failures.push((error as Error).message);
  }

  // The meshed foot's crumple rule, read after the curve rules so both lists fail together.
  const findings: HumanCurveAudit.IHumanCurveFinding[] =
    HumanPeople.names().flatMap(
      (name: string): HumanCurveAudit.IHumanCurveFinding[] => {
        const p: HumanPeople.IPerson = HumanPeople.person(name);
        return HumanCurveAudit.auditHumanFoot(p.name, p.body);
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
