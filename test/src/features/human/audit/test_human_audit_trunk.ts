import { HumanTrunkTable } from "../../internal/audit/HumanTrunkTable";
import { HumanCurveRings } from "../../internal/curves/HumanCurveRings";
import { HumanAnatomyAudit } from "../../internal/HumanAnatomyAudit";
import { HumanPeople } from "../../internal/HumanPeople";
import { assertHumanProvenRows } from "../../internal/region/assertHumanProvenRows";

type IRow = HumanAnatomyAudit.IRow;
type Knots = [number, number][];

/**
 * Every person's finished trunk, the base with its merged breasts and gluteal
 * masses, keeps the trunk relations the construction does not guarantee by
 * itself: depth over breadth at the chest, waist and buttocks within ANSUR
 * II's ranges, the bust standing forward of the chest wall, the natural waist
 * the least girth between the hip and the underbust, and the back's lumbar
 * lordosis and thoracic kyphosis.
 *
 * Scenarios:
 * 1. A made trunk of elliptical sections (half depth 110 mm at the buttocks, 90 at the waist, 125 at the bust; half breadth 180, 130 and 150), its back profile forward at the lumbar level and back at the thoracic level, breasts adding 20 mm of depth to the chest wall: every row passes.
 * 2. Each row fails on its own made defect: a chest 400 mm deep (TR-1), a waist 300 mm deep (TR-2), buttocks 340 mm deep (TR-3), a bust no deeper than its chest wall (TR-4), a section 150 mm under the waist narrower than it (TR-5), a lumbar back behind its chord (TR-6), a thoracic back in front of its chord (TR-7).
 * 3. Every person of `HumanPeople`: the body's `trunk` chain and every part and blend merged onto it, cut at the trunk's landmark levels (`HumanTrunkTable.reading`), every failing row listed by person and relation.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person through the public body law and cuts its finished trunk, the trunk chain with the parts and blends its merges name, by horizontal planes where the chains' 1 mm grids cross them, reading extents, taut girths and the median back profile. It catches a trunk whose sections are too deep or too flat for any adult, breasts that sink into the chest wall, a waist that is not the narrowest level it is defined as, and a back without its spinal curves; any trunk shaped as anatomy describes passes.
 * @evidence contracts/testing.md#independent-expectations Sources: ANSUR II's trunk shape ratios, each sex's mean plus and minus 2.326 SD, both sexes' union (chest 0.702 to 1.095, waist 0.576 to 0.853, buttock depth over hip breadth 0.548 to 0.827, `ansur-ii-trunk-ratios.md`); the natural waist as the least girth between the lowest rib and the iliac crest, read within ISO 20685-1's 9 mm large-girth error; the lumbar curve convex forward and the thoracic concave forward (Gray 1918, `gray-1918-vertebral-curves.md`), each sagitta above the profile's 2 mm step; the breasts standing on the chest wall. Oracle limits: the landmark levels are the construction's own (`IAutoMovieHumanBodyCalibration.trunk`), used only to locate; the back profile is the rearmost point within 5 mm of the median plane.
 * @evidence contracts/testing.md#distinguishing-cases Positive: the made sound trunk. Negative: one defect per row. A person without breasts reads no TR-4 row. The tapes and breadths read back at their inputs belong to `test_human_audit_inputs`; the limbs' relations to `test_human_audit_anatomy`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_audit_trunk`, building its made trunks and generating its people in process on the CPU (body law only) with no renderer, browser or GPU; nothing is cached across tests.
 */
export function test_human_audit_trunk(): void {
  assertHumanProvenRows("trunk relation", proofs, (name: string): IRow[] => {
    const p: HumanPeople.IPerson = HumanPeople.person(name);
    return HumanTrunkTable.rows(name, HumanTrunkTable.reading(p.body, HumanCurveRings.scale(p)));
  });
}

/** The made trunks' proofs. */
function proofs(): string[] {
  const out: string[] = [];
  const depth: Knots = [
    [850, 105],
    [900, 110],
    [1050, 90],
    [1250, 125],
    [1450, 70],
  ];
  const breadth: Knots = [
    [850, 175],
    [900, 180],
    [1050, 130],
    [1250, 150],
    [1450, 70],
  ];
  const back: Knots = [
    [850, -105],
    [900, -110],
    [1050, -95],
    [1300, -125],
    [1450, -105],
  ];
  const sound: IRow[] = HumanTrunkTable.rows("made", made(depth, breadth, back, 20));
  for (const r of sound.filter((x: IRow): boolean => !HumanAnatomyAudit.passes(x))) out.push(`sound trunk: ${r.site} reads ${r.value}`);

  const defects: [string, HumanTrunkTable.IReading][] = [
    ["TR-1", made(depth.map(([y, v]: [number, number]): [number, number] => [y, y === 1250 ? 200 : v]), breadth, back, 20)],
    ["TR-2", made(depth.map(([y, v]: [number, number]): [number, number] => [y, y === 1050 ? 150 : v]), breadth, back, 20)],
    ["TR-3", made(depth.map(([y, v]: [number, number]): [number, number] => [y, y === 900 ? 170 : v]), breadth, back, 20)],
    ["TR-4", made(depth, breadth, back, 0)],
    ["TR-5", made([...depth.slice(0, 2), [950, 80], ...depth.slice(2)], [...breadth.slice(0, 2), [950, 100], ...breadth.slice(2)], back, 20)],
    ["TR-6", made(depth, breadth, back.map(([y, v]: [number, number]): [number, number] => [y, y === 1050 ? -120 : v]), 20)],
    ["TR-7", made(depth, breadth, back.map(([y, v]: [number, number]): [number, number] => [y, y === 1300 ? -98 : v]), 20)],
  ];
  for (const [id, trunk] of defects)
    if (!HumanTrunkTable.rows("made", trunk).some((r: IRow): boolean => r.site.endsWith(`(${id})`) && !HumanAnatomyAudit.passes(r))) out.push(`made defect: no failing ${id} row`);
  return out;
}

/**
 * A made trunk: at each height an ellipse of half depth and half breadth
 * from their knots, placed so its back stands at the back profile's knot
 * value; the base (the chest wall) the same with its half depth less a
 * breast's projection that rises to `breast` mm at the bust and fades 80 mm
 * either side, its back unchanged.
 */
function made(depth: Knots, breadth: Knots, back: Knots, breast: number): HumanTrunkTable.IReading {
  const projection: (y: number) => number = (y: number): number => breast * Math.max(0, Math.cos((Math.PI / 2) * Math.min(1, Math.abs(y - 1250) / 80)));
  const section: (y: number, base: boolean) => [number, number][] = (y: number, base: boolean): [number, number][] => {
    const a: number = eased(depth, y) - (base ? projection(y) / 2 : 0);
    const b: number = eased(breadth, y);
    const centre: number = eased(back, y) + a;
    return Array.from({ length: 720 }, (_: unknown, m: number): [number, number] => {
      const t: number = (2 * Math.PI * m) / 720;
      return [centre + a * Math.cos(t), b * Math.sin(t)];
    });
  };
  return { levels: { buttock: 900, waist: 1050, fold: 1180, bust: 1250, cervicale: 1450 }, cut: section, breasts: breast > 0 };
}

/** The cosine-eased run through knots `[height, value]`, flat beyond its ends. */
function eased(knots: Knots, y: number): number {
  if (y <= knots[0]![0]) return knots[0]![1];
  for (let i: number = 0; i + 1 < knots.length; i++) {
    const [y0, v0]: [number, number] = knots[i]!;
    const [y1, v1]: [number, number] = knots[i + 1]!;
    if (y <= y1) return v0 + ((v1 - v0) * (1 - Math.cos((Math.PI * (y - y0)) / (y1 - y0)))) / 2;
  }
  return knots[knots.length - 1]![1];
}
