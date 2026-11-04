import { HumanInputs } from "../../../internal/HumanInputs";
import { HumanCurveRings } from "../../../internal/curves/HumanCurveRings";
import { HumanCurveTrunkGirth } from "../../../internal/curves/HumanCurveTrunkGirth";
import { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanPeople } from "../../../internal/HumanPeople";

type IRow = HumanAnatomyAudit.IRow;
type IProfile = HumanCurveRings.IProfile;

/**
 * Pins that every person's composed trunk falls from the chest to the natural
 * waist and widens from the waist to the hips without a roll, allowing one
 * abdominal maximum only where the person's own high hip input asks for it.
 *
 * Scenarios:
 * 1. A made trunk profile, the hips at 0.5 S, the waist at 0.62 S and the chest at 0.72 S joined by cosine runs, reads no excess on either span.
 * 2. f1's own trunk profile with three periods of a 10 mm, 20 mm-wavelength girth ripple added midway from the waist to the chest, and again midway from the hips to the waist, reads at least 15 mm more excess on each span and fails both rows.
 * 3. Every person of `HumanPeople`: both spans are read, and every failing row is listed by person with its sites' heights.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person through the public body law and evaluates its delivered `trunk` chain every 2 mm of height (`HumanCurveRings`), taking the natural waist as the least taut girth within 0.56 S to 0.70 S, the chest as the greatest girth above it and the hips as the greatest below it, and reading each span's excess variation (total variation less the ends' difference). It catches a roll or a groove between the bust and the waist, a belly roll on a lean person, a second waist, and a shelf above the hips.
 * @evidence contracts/testing.md#independent-expectations The shape is anatomy's and the definitions': the natural waist is the least girth between the lowest rib and the iliac crest (ISO 8559-1 5.3.10), so the trunk falls to it from the chest and rises from it to the hips (ISO 8559-1 5.3.13, the buttocks' greatest projection); the high hip lies midway (5.3.12), so a high hip input above the waist-to-hip line by more than 9 mm is the person's own central adiposity (WHO 2008), which admits one abdominal maximum. The floor is ISO 20685-1:2018 Table 4's 9 mm for large girths. No construction constant or reference enters. Proven green on a made cosine trunk and red on f1's own profile with three periods of a 10 mm, 20 mm-wavelength ripple (each reversal adds twice its height to the excess variation). Oracle limits: the trunk chain ends at the axilla, so a chest whose greatest girth lies above it is read at the chain's top; the girth is the taut tape, so a groove narrower than the hull is the kink rules'.
 * @evidence contracts/testing.md#distinguishing-cases The core set's ten people, slender and heavy trunks of both sexes, with and without central adiposity by their own inputs. The outlines' turn sequences and the waist's height belong to `test_human_curves_profile_trunk`; the tapes at their sites to `test_human_anatomy_trunk`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_profile_trunk_girth`, generating its people in process on the CPU (body law only) with no renderer, browser or GPU.
 */
export function test_human_curves_profile_trunk_girth(): void {
  const failures: string[] = [];
  const excess: (rows: IRow[], rule: string) => IRow = (rows: IRow[], rule: string): IRow => rows.find((r: IRow): boolean => r.site.endsWith(`(${rule})`))!;

  // A made trunk 1600 mm tall: girth 900 at the hips (800 mm), 700 at the waist (992 mm), 860 at the chest (1152 mm), cosine runs between.
  const S: number = 1600;
  const stations: number[] = Array.from({ length: 251 }, (_: unknown, i: number): number => 720 + 2 * i);
  const shape: (y: number) => number = (y: number): number =>
    y <= 800 ? 900 - (800 - y) * 0.5 : y <= 992 ? 700 + 100 * (1 + Math.cos((Math.PI * (y - 800)) / 192)) : y <= 1152 ? 780 - 80 * Math.cos((Math.PI * (y - 992)) / 160) : 860;
  const made: IProfile = { chain: "made", stations, girth: stations.map(shape), centre: stations.map((y: number): [number, number, number] => [0, y, 0]) };
  for (const r of HumanCurveTrunkGirth.rows("made", made, S, false)) if (!HumanAnatomyAudit.passes(r)) failures.push(`made cosine trunk: ${r.site} read ${r.value.toFixed(3)} ${r.unit}`);

  // f1's own profile with rolls midway on each span: three periods of a 10 mm ripple of 20 mm wavelength, whose
  // slope (3.1 mm of girth per mm) reverses any trunk span, which falls or rises about 1 mm per mm.
  const own: IProfile = HumanCurveRings.profile("f1", "trunk");
  const f1S: number = HumanInputs.stature(HumanPeople.params("f1"));
  const s: HumanCurveTrunkGirth.ISites = HumanCurveTrunkGirth.sites(own, f1S);
  const roll: (centre: number) => number[] = (centre: number): number[] =>
    own.girth.map((g: number, i: number): number => {
      const d: number = own.stations[i]! - own.stations[centre]!;
      return Math.abs(d) <= 30 ? g + 10 * Math.sin((2 * Math.PI * d) / 20) : g;
    });
  const before: IRow[] = HumanCurveTrunkGirth.rows("f1", own, f1S, false);
  const upper: IRow[] = HumanCurveTrunkGirth.rows("f1 rolled", { ...own, girth: roll(Math.round((s.waist + s.chest) / 2)) }, f1S, false);
  const lower: IRow[] = HumanCurveTrunkGirth.rows("f1 rolled", { ...own, girth: roll(Math.round((s.hip + s.waist) / 2)) }, f1S, false);
  for (const [rule, after] of [["PRO-TR-2", upper], ["PRO-TR-4", lower]] as const) {
    const a: IRow = excess(after, rule);
    if (!(a.value >= excess(before, rule).value + 15 && !HumanAnatomyAudit.passes(a))) failures.push(`made 10 mm ripple on f1 (${rule}) read ${a.value.toFixed(2)} mm against ${excess(before, rule).value.toFixed(2)}, expected 15 more and past 9`);
  }

  // Every person.
  for (const name of HumanPeople.names()) {
    try {
      const c: ReturnType<typeof HumanInputs.of> = HumanInputs.of(HumanPeople.params(name));
      const central: boolean = HumanCurveTrunkGirth.central(c.waistCircumference, c.highHipCircumference, c.hipCircumference);
      for (const r of HumanCurveTrunkGirth.rows(name, HumanCurveRings.profile(name, "trunk"), c.stature, central))
        if (!HumanAnatomyAudit.passes(r)) failures.push(`${r.person.padEnd(14)} ${r.site}: ${r.value.toFixed(2)} ${r.unit} over ${r.high}`);
    } catch (error) {
      failures.push(`${name.padEnd(14)} could not be read: ${(error as Error).message}`);
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} trunk girth span findings:\n${failures.join("\n")}`);
}
