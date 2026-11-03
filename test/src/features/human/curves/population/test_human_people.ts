import { AutoMovieHumanBodyAnatomy } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanSex } from "../../../../../../packages/human/src/typings/AutoMovieHumanSex";
import { HumanInputs } from "../../../internal/HumanInputs";
import type { IAutoMovieHumanParameters } from "../../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { f1, m1 } from "../../../../../../packages/playground/src/human-parameters/index";
import { HumanPeople } from "../../../internal/HumanPeople";
import { HumanPopulation } from "../../../internal/HumanPopulation";

/**
 * Every Human test person is a whole adult before any test reads it: each
 * body measure inside its declared domain, the declared sex the person's own,
 * every surveyed measure inside what some
 * surveyed adult of that sex has, every relation between surveyed inputs
 * inside its sex's population band, and the population ends together
 * reaching both ends of stature and of the adiposity their fat percentages
 * imply, for each sex.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the public inputs of all 66 people of the extended set (`HumanPeople.everyone()`: the references f1, f2, m1 and m2 and the 62 population ends `HumanPopulation.ENDS` builds, 31 per sex) through `HumanPopulation.audit`, which reads only `IAutoMovieHumanParameters` fields, and fails once with every row outside its bounds by person and check. It also audits made people that must be flagged, and reads the ends' stature deviates and shape coordinates per sex. It catches a body measure outside its declared range, a person whose declared sex contradicts the statistics its tapes satisfy, a tape no surveyed adult of its sex has, tapes that do not belong to one body (a man's tapes with a woman's waist over hip, a hand too narrow for its length, a neck base below its neck), and a population set that never reaches a coordinate's end.
 * @evidence contracts/testing.md#independent-expectations The declared domain is each body measure's declared range for adults (`HumanPopulation.DOMAIN`); the surveyed ranges and relation bands are ANSUR 1988's per-sex sample extremes and per-subject ratio means plus and minus 3 SD (`packages/human/docs/sources/ansur-1988-boundary-people.md`), the cephalic index band united with Du 2008's Chinese workers, so no band comes from a generated figure or a construction constant. The ends are conditional means of the same survey; a relation band is the marginal spread of each subject's own ratio, which the conditional-mean construction does not read, so a wrong conditioning, a wrong anchor ratio or a hand-edited input shows as a row outside its band. An end whose conditional mean would pass a bound (the declared domain of the control it becomes, or the sex's surveyed extreme) is held at that bound and the rest conditioned on it: inseam 640 mm for the short women, high hip 720 mm for the light people. Green on all 62 ends. Red on two references, real findings in their inputs: m1's neck base (388.7 mm) is below its neck (412.0), 0.944 against the men's 1.008 to 1.145, and m2's lateral malleolus height (89.9 mm, 4.2 SD above the men's mean) over its stature reads 0.0484 against 0.0298 to 0.0466. Face width over head breadth is not checked because three references read 0.78 to 0.80, 4 SD below either sex by the same offset, a definition gap of their skin-located zygion rather than three impossible heads. Made red: f1's inputs declared male read as a man fail the men's natural waist over hip (0.678 against 0.728 to 0.979) and chest over hip; f1 with both hands' breadth set to a third of their length (0.33) fails hand breadth over length against the women's 0.380 to 0.501, a defect made from the ratio itself so it holds whatever breadth f1's own inputs carry; f1 at 2,100 mm fails the height domain; m1 declared a woman fails the declared-sex row; f1 with a neck base 0.95 of her neck fails neck base over neck. Oracle limits: the survey is the US Army of 1987-1988 (the ancestry and fitness of one army), so a real adult of another population can fall outside a band, and the cephalic index is widened for that reason; courses the survey does not define (front interscye, across shoulder, neck to waist, high hip, relaxed upper-arm and forearm girth, inseam, neck length, ear breadth, thumb length, head height above nasion) carry no relation of their own and are bounded by the declared domain only; the face inputs scale FaceBase means and are not checked beyond the head's surveyed measures.
 * @evidence contracts/testing.md#distinguishing-cases Positive: the four references and the 62 ends, each sex's stature, mass, muscle, leg length, shoulder breadth, arm, hand and foot length (given stature) and head length and breadth alone at their 1st and 99th percentiles, the four stature-by-mass corners, the lean-muscular and heavy-unmuscular bodies, the small and large corners, and the mean and plus and minus one deviate bodies between the ends. Negative: the five made people above, each required to fail its own row. Boundary: per sex the ends must reach stature deviates of -2.326 and +2.326, the adiposity (the body-mass-index deviate over 2.326 that the fat percentage implies) -1 and +1, and the core set must hold each sex's small and large corner. The anatomy, curve, skin and pose tests own what the generated skin does with these inputs; this test owns only the inputs.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_people`, reading parameter tables in process with no generation, renderer, browser or GPU.
 */
export function test_human_people(): void {
  const failures: string[] = [];
  const show = (r: HumanPopulation.IRow): string =>
    `${r.person.padEnd(16)} ${r.site}: ${r.value.toFixed(4)} ${r.unit} outside ${r.low.toFixed(4)} to ${r.high.toFixed(4)}`;

  // Every person of the extended set.
  for (const name of HumanPeople.everyone())
    for (const row of HumanPopulation.audit(name, HumanPeople.sex(name), HumanPeople.params(name)))
      if (!HumanPopulation.passes(row)) failures.push(show(row));

  // The ends reach every coordinate's end, per sex.
  const generated: HumanPopulation.IEnd[] = [...HumanPopulation.ENDS];
  for (const sex of ["female", "male"] as const) {
    const own: IAutoMovieHumanParameters[] = generated.filter((e: HumanPopulation.IEnd): boolean => e.sex === sex).map((e: HumanPopulation.IEnd): IAutoMovieHumanParameters => HumanPeople.params(e.name));
    const t: HumanPopulation.ISurvey = HumanPopulation.SURVEY[sex];
    const reach = (label: string, values: number[], low: number, high: number): void => {
      const lo: number = Math.min(...values);
      const hi: number = Math.max(...values);
      if (lo > low + 1e-6 || hi < high - 1e-6) failures.push(`${sex} ends: ${label} spans ${lo.toFixed(3)} to ${hi.toFixed(3)}, not ${low} to ${high}`);
    };
    const S: number[] = own.map((p: IAutoMovieHumanParameters): number => HumanInputs.stature(p));
    reach("stature deviate", S.map((s: number): number => (s - t.mean[HumanPopulation.index("stature")]!) / t.sd[HumanPopulation.index("stature")]!), -HumanPopulation.Z, HumanPopulation.Z);
    reach("adiposity", own.map((p: IAutoMovieHumanParameters): number => AutoMovieHumanBodyAnatomy.adiposity(HumanInputs.of(p))), -1, 1);
    const core: string[] = generated.filter((e: HumanPopulation.IEnd): boolean => e.core && e.sex === sex).map((e: HumanPopulation.IEnd): string => e.name);
    for (const label of ["small", "large"])
      if (!core.includes(`${sex === "female" ? "f" : "m"}-${label}`)) failures.push(`${sex} core set lacks its ${label} corner`);
  }

  // Made people that must be flagged, each at its own row.
  const edit = (base: IAutoMovieHumanParameters, change: (p: IAutoMovieHumanParameters) => void): IAutoMovieHumanParameters => {
    const out: IAutoMovieHumanParameters = structuredClone(base);
    change(out);
    return out;
  };
  const made: [string, HumanPopulation.Sex, IAutoMovieHumanParameters, string][] = [
    ["f1 read as a man", "male", edit(f1, (p: IAutoMovieHumanParameters): void => void (p.body.anatomy.sex = AutoMovieHumanSex.Male)), "relation: natural waist / hip"],
    ["f1 with a hand breadth of a third of its length", "female", edit(f1, (p: IAutoMovieHumanParameters): void => {
      for (const h of [p.extremities!.hands!.left, p.extremities!.hands!.right]) h.handBreadth = 0.33 * h.handLength;
    }), "relation: hand breadth / hand length"],
    ["f1 at 2,100 mm", "female", edit(f1, (p: IAutoMovieHumanParameters): void => void (p.body.anatomy.stature = 2100)), "domain: stature"],
    ["m1 declared a woman", "male", edit(m1, (p: IAutoMovieHumanParameters): void => void (p.body.anatomy.sex = AutoMovieHumanSex.Female)), "sex declared on a male body"],
    ["f1 with a neck base below her neck", "female", edit(f1, (p: IAutoMovieHumanParameters): void => void (p.body.anatomy.neckBaseCircumference = 0.95 * p.body.anatomy.neckCircumference!)), "relation: neck base / neck"],
  ];
  for (const [label, sex, p, site] of made)
    if (!HumanPopulation.audit(label, sex, p).some((r: HumanPopulation.IRow): boolean => r.site.startsWith(site) && !HumanPopulation.passes(r)))
      failures.push(`${label}: no failing "${site}" row`);

  if (failures.length !== 0) throw new Error(`${failures.length} test-people findings:\n${failures.join("\n")}`);
}
