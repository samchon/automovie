import { HumanInputs } from "../../../internal/HumanInputs";
import type { HumanAnatomy } from "../../../internal/HumanAnatomy";
import { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanAnatomyCourse } from "../../../internal/HumanAnatomyCourse";
import { HumanCurveShoulderSlope } from "../../../internal/curves/HumanCurveShoulderSlope";
import { HumanPeople } from "../../../internal/HumanPeople";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;

/**
 * Pins that every person's shoulders slope from the neck as people's do: the
 * line from each side neck point to its shoulder point, both found on the
 * skin by their ISO 8559-1 definitions, falls 10.9 to 34.1 degrees below the
 * horizontal.
 *
 * Scenarios:
 * 1. f1's own course sites with the left shoulder point raised to its side neck point's height read a slope of zero, a square shoulder, and fail; with it dropped to 45 degrees below the side neck point they read 45 degrees and fail.
 * 2. Every person of `HumanPeople`: both shoulders are read, and every slope out of the band is listed by person and side.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person's bind skin and locates the side neck points (the lateral points of the trunk audit's neck base line) and the shoulder points (the skin straight above the shoulder joint, ISO 8559-1 3.1.1's acromion projected vertically to the skin) with the course observer (`HumanAnatomyCourse.courseSites`), reading on each side the angle of the line between them below the horizontal in the frontal plane. It catches square shoulders, a shelf where the shoulder line meets the neck, and shoulders dropping like a bottle's.
 * @evidence contracts/testing.md#independent-expectations Shoulder slope is 22.5 degrees below horizontal (SD 5.0) in the FAA's 1965 survey of 55 men, and 20 to 24 degrees in Japanese surveys of women (`faa-1965-shoulder-slope.md`, read at second hand); the band is the men's mean plus and minus 2.326 SD, which holds the women's means. Proven red here on f1's own sites edited in memory, whose readings move to the exact angles of the edit. Oracle limits: the shoulder point's place across the body comes from the rig's shoulder joint; the women's spread is not read; the angle is read in the frontal plane, so a shoulder line running backward reads its frontal projection.
 * @evidence contracts/testing.md#distinguishing-cases Both shoulders of the core set's ten people, narrow and broad shoulders of both sexes. The across-shoulder course belongs to `test_human_anatomy_course`; the shoulder's kinks belong to the surface audit (#3057).
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_region_shoulder`, generating each person's bind skin in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_curves_region_shoulder(): void {
  const failures: string[] = [...made()];
  for (const name of HumanPeople.names()) {
    try {
      const subject: HumanAnatomyAudit.ISubject = HumanAnatomyAudit.subject(name);
      const course: HumanAnatomyCourse.ICourse = HumanAnatomyCourse.courseSites(subject.bind(), HumanInputs.stature(subject.params));
      for (const r of HumanCurveShoulderSlope.rows(name, course)) if (!HumanAnatomyAudit.passes(r)) failures.push(`${r.person.padEnd(14)} ${r.site}: ${r.value.toFixed(1)} outside ${r.low.toFixed(1)} to ${r.high.toFixed(1)}`);
    } catch (error) {
      failures.push(`${name.padEnd(14)} could not be read: ${(error as Error).message}`);
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} shoulder slope findings:\n${failures.join("\n")}`);
}

/** f1's own course sites with the left shoulder point moved, each move required to read its exact angle and fail. */
function made(): string[] {
  const out: string[] = [];
  const subject: HumanAnatomyAudit.ISubject = HumanAnatomyAudit.subject("f1");
  const course: HumanAnatomyCourse.ICourse = HumanAnatomyCourse.courseSites(subject.bind(), HumanInputs.stature(subject.params));
  const neck: V3 | null = course.sideNeck.left;
  const shoulder: V3 | null = course.shoulder.left;
  if (neck === null || shoulder === null) return ["made shoulder: f1's left side neck point or shoulder point was not found"];
  const run: number = Math.abs(shoulder[2] - neck[2]);
  for (const [label, y, expected] of [
    ["square", neck[1], 0],
    ["dropped", neck[1] - run, 45],
  ] as const) {
    const moved: HumanAnatomyCourse.ICourse = { ...course, shoulder: { ...course.shoulder, left: [shoulder[0], y, shoulder[2]] } };
    const row: IRow = HumanCurveShoulderSlope.rows(`f1 ${label}`, moved)[0]!;
    if (Math.abs(row.value - expected) > 1e-9 || HumanAnatomyAudit.passes(row)) out.push(`made ${label} shoulder: read ${row.value.toFixed(3)} deg, expected ${expected} and a failure`);
  }
  return out;
}
