import type { IAutoMovieHumanParameters } from "../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanInputIdentity } from "../../internal/audit/HumanInputIdentity";
import { HumanAnatomyAudit } from "../../internal/HumanAnatomyAudit";
import { HumanPeople } from "../../internal/HumanPeople";
import { assertHumanProvenRows } from "../../internal/region/assertHumanProvenRows";

type IRow = HumanAnatomyAudit.IRow;

/**
 * Every public geometric input of every person is read back on the finished
 * skin at its published site within its allowance, or carries the reason it
 * is no skin reading.
 *
 * Scenarios:
 * 1. Made readings on f1's inputs: a thigh girth row centred on the thigh input and inside its allowance reads the input back and passes; the same row outside its allowance fails; with no such row the thigh input fails as not read back; a row centred on another value does not read the input back; an input outside the catalogue fails as unknown; a body composition input gives no row.
 * 2. Every person of `HumanPeople`: the identity rows of every region observer (`HumanAnatomyAudit.REGIONS`) on the person's skin, matched to every numeric input of `body.anatomy`, `head` and `extremities` (`HumanInputIdentity.rows`), and every input not read back or outside its allowance listed by person and path.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds each person's skin views (`HumanAnatomyAudit.subject`), runs every region observer on them and matches their identity rows to the person's inputs by measure name, side and centre (`HumanInputIdentity`). It catches an input a merge, a diff or a relief moved off its value on the skin, an input no observer reads back, and a public input added without a reading; any skin that honours every input at its site within its allowance passes.
 * @evidence contracts/testing.md#independent-expectations Each expectation is the person's own input, with the allowance its observer row carries: ISO 20685-1:2018 Table 4 by measure (9 mm large girths, 4 mm small girths, 1 mm head and hand, 2 mm foot), 7 mm for trunk breadths and depths (ANSUR II's allowable error for chest breadth). Inputs that are no skin reading are named with their reason: a caliper breadth with tissue compressed, the bony breadths that place the skeleton, the body fat share, and the jaw's ranges of motion. Oracle limit: an input is matched to a row by its measure's name and the row's centre, so an observer that labels a reading under another measure's name would not be found and is listed as not read back.
 * @evidence contracts/testing.md#distinguishing-cases Positive: a reading inside its allowance. Negative: a reading outside it, a missing reading, a reading centred elsewhere, an unknown input. Boundary: inputs without a site give no row. The observers' own sites and proofs belong to the anatomy and region tests; whether the input set is internally consistent to `test_human_input_box_consistency` and `test_human_people`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_audit_inputs`, generating its people and their skins in process on the CPU with no renderer, browser or GPU; nothing is cached across tests.
 */
export function test_human_audit_inputs(): void {
  assertHumanProvenRows("input identity", proofs, (name: string): IRow[] => {
    const subject: HumanAnatomyAudit.ISubject = HumanAnatomyAudit.subject(name);
    const readings: IRow[] = Object.values(HumanAnatomyAudit.REGIONS).flatMap((region: (s: HumanAnatomyAudit.ISubject) => IRow[]): IRow[] => region(subject));
    return HumanInputIdentity.rows(name, subject.params, readings);
  });
}

/** Made readings on f1's inputs: every failure of the matcher to read green or red as it must. */
function proofs(): string[] {
  const out: string[] = [];
  const params: IAutoMovieHumanParameters = HumanPeople.params("f1");
  const thigh: number | undefined = params.body.anatomy.thighCircumference;
  if (thigh === undefined) return ["proof: f1 carries no thigh girth input"];
  const row: (value: number, centre: number) => IRow = (value: number, centre: number): IRow => ({ person: "made", site: "left thigh girth, horizontal maximum just below the crotch, mm", value, low: centre - 9, high: centre + 9, unit: "mm" });
  const of: (readings: IRow[]) => IRow[] = (readings: IRow[]): IRow[] => HumanInputIdentity.rows("made", params, readings).filter((r: IRow): boolean => r.site.startsWith("body.anatomy.thighCircumference"));

  const green: IRow[] = of([row(thigh + 3, thigh)]);
  if (!(green.length === 1 && HumanAnatomyAudit.passes(green[0]!))) out.push(`proof: a reading 3 mm off inside the 9 mm allowance does not pass (${JSON.stringify(green)})`);
  const red: IRow[] = of([row(thigh + 12, thigh)]);
  if (!(red.length === 1 && !HumanAnatomyAudit.passes(red[0]!))) out.push("proof: a reading 12 mm off passes the 9 mm allowance");
  const missing: IRow[] = of([]);
  if (!(missing.length === 1 && !HumanAnatomyAudit.passes(missing[0]!) && missing[0]!.site.includes("not read back"))) out.push("proof: a missing reading is not listed as not read back");
  const elsewhere: IRow[] = of([row(thigh + 50, thigh + 50)]);
  if (!(elsewhere.length === 1 && elsewhere[0]!.site.includes("not read back"))) out.push("proof: a row centred 50 mm away reads the thigh input back");

  const unknown: IAutoMovieHumanParameters = structuredClone(params);
  (unknown.body.anatomy as unknown as Record<string, unknown>)["madeMeasure"] = 100;
  if (!HumanInputIdentity.rows("made", unknown, []).some((r: IRow): boolean => r.site.startsWith("body.anatomy.madeMeasure: no catalogue entry"))) out.push("proof: an input outside the catalogue is not listed");
  if (HumanInputIdentity.rows("made", params, []).some((r: IRow): boolean => r.site.startsWith("body.anatomy.bodyFatPercentage"))) out.push("proof: the body fat share, no skin reading, gives a row");
  return out;
}
