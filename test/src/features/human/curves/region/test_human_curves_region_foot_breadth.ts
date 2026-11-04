import { HumanCurveFootBreadth } from "../../../internal/curves/HumanCurveFootBreadth";
import { HumanAnatomy } from "../../../internal/HumanAnatomy";
import { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanAnatomyFoot } from "../../../internal/HumanAnatomyFoot";
import { HumanPeople } from "../../../internal/HumanPeople";

type IRow = HumanAnatomyAudit.IRow;
type IProfile = HumanCurveFootBreadth.IProfile;

/**
 * Pins that every foot is widest across its metatarsal heads: its breadth
 * widens from the heel to one widest section within 0.6 to 0.8 of its length
 * and narrows to the toes, each run monotone within 2 mm.
 *
 * Scenarios:
 * 1. f1's own left breadth profile with a section of its widening cut 3 mm below both neighbours reads at least 3 mm more excess on that run, past the 2 mm bound.
 * 2. f1's own left profile with its heel section widened past the forefoot reads its widest section at the heel, outside 0.6 to 0.8.
 * 3. Every person of `HumanPeople`: both feet are read, and every failing row is listed by person, side and run.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person's skin at the anatomical neutral (the pose the foot audit reads, `HumanAnatomy.posed` with no joint moved) and cuts each foot's skin (its foot, forefoot and toe chains) by planes across the foot axis every 2.5 percent of foot length from the rearmost skin point (`HumanAnatomyFoot.footSites`), reading each section's extent across the axis. It catches a heel as wide as the forefoot, a foot widest at the toes or the midfoot, a waist or a bulge along the foot's border, and a forefoot that splays and closes again.
 * @evidence contracts/testing.md#independent-expectations The foot breadth is defined across the metatarsal heads (ANSUR II, ISO 8559-1), the first head standing at 0.739 and 0.741 of foot length (ANSUR II ball-of-foot length, women and men) and the fifth behind it on the oblique metatarsal line, so the widest section lies within 0.6 to 0.8; Gray 1918 gives the narrow heel and the forefoot spread over the heads. Each run is monotone within ISO 20685-1:2018 Table 4's 2 mm for foot dimensions. No construction constant or reference enters. Proven red here on f1's own profile, edited in memory: a section cut 3 mm below both neighbours reads at least 3 mm more excess (excess variation is twice a reversal, less any reversal the section already had), a heel widened past the forefoot moves the widest section to the heel. Oracle limits: the neutral foot is read standing on the floor; the toes' gaps are inside a section's extent, so the forefoot's spread is read, not each toe's.
 * @evidence contracts/testing.md#distinguishing-cases Both feet of the core set's ten people, short and long feet of both sexes. The dorsum, arch and toe order belong to `HumanAnatomyFootProfile` (`test_human_anatomy_foot`); the foot's own pieces to the part tester's `test_human_foot_piece_*`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_region_foot_breadth`, generating each person's neutral skin in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_curves_region_foot_breadth(): void {
  const failures: string[] = [];
  // Each person's neutral skin, posed once for both feet and dropped with the
  // next person.
  let held: { person: string; skin: HumanAnatomy.ISkin } | undefined;
  const read: (person: string, side: "left" | "right") => IProfile = (person: string, side: "left" | "right"): IProfile => {
    if (held?.person !== person) held = { person, skin: HumanAnatomy.posed(person, {}) };
    const skin: HumanAnatomy.ISkin = held.skin;
    return HumanCurveFootBreadth.profile(skin, side, HumanAnatomyFoot.footSites(skin, side));
  };
  const row: (p: IProfile, prefix: string) => IRow = (p: IProfile, prefix: string): IRow =>
    HumanCurveFootBreadth.rows("f1", "left", p).find((r: IRow): boolean => r.site.includes(prefix))!;

  // Made defects on f1's own left profile.
  const own: IProfile = read("f1", "left");
  const widest: number = own.breadth.indexOf(Math.max(...own.breadth));
  const before: number = row(own, "widening").value;
  const k: number = Math.floor(widest / 2);
  const dipped: IProfile = { ...own, breadth: own.breadth.map((v: number, i: number): number => (i === k ? Math.min(own.breadth[k - 1]!, own.breadth[k + 1]!) - 3 : v)) };
  const after: number = row(dipped, "widening").value;
  if (!(widest >= 2 && after >= before + 3 && !HumanAnatomyAudit.passes(row(dipped, "widening")))) failures.push(`made 3 mm dip on f1's widening read ${after.toFixed(3)} mm of excess against ${before.toFixed(3)}, expected past 2 mm and at least 3 more`);
  const heel: IProfile = { ...own, breadth: own.breadth.map((v: number, i: number): number => (i === 0 ? own.breadth[widest]! + 10 : v)) };
  if (HumanAnatomyAudit.passes(row(heel, "widest section"))) failures.push("made heel 10 mm wider than the forefoot on f1 still read its widest section within 0.6 to 0.8");

  // Every person, both feet.
  for (const name of HumanPeople.names())
    for (const side of ["left", "right"] as const) {
      try {
        for (const r of HumanCurveFootBreadth.rows(name, side, read(name, side)))
          if (!HumanAnatomyAudit.passes(r)) failures.push(`${r.person.padEnd(14)} ${r.site}: ${r.value.toFixed(3)} ${r.unit} outside ${r.low} to ${r.high}`);
      } catch (error) {
        failures.push(`${name.padEnd(14)} ${side} foot could not be read: ${(error as Error).message}`);
      }
    }
  if (failures.length !== 0) throw new Error(`${failures.length} PRO-FT-4 findings:\n${failures.join("\n")}`);
}
