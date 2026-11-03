import { HumanCurveCalfContour } from "../../../internal/curves/HumanCurveCalfContour";
import { HumanAnatomy } from "../../../internal/HumanAnatomy";
import { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanPeople } from "../../../internal/HumanPeople";

type IContours = HumanCurveCalfContour.IContours;

/**
 * Pins that every person's calves, seen from the front, bulge lower on the
 * inside than on the outside: the medial contour's greatest reach from the
 * shank's axis stands below the lateral contour's.
 *
 * Scenarios:
 * 1. A made pair of contours, the lateral peaking 40 mm above the medial, reads 40 mm.
 * 2. f1's own left contours with the medial and lateral swapped read the opposite sign and fail.
 * 3. Every person of `HumanPeople`: both shanks are read, and every failing row is listed by person and side with both heights.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person's skin at the anatomical neutral (`HumanAnatomy.posed` with no joint moved) and cuts each leg chain's skin by horizontal planes every 2 mm from a tenth to 0.6 of the way from the knee joint to the ankle joint, reading each section's greatest reach toward and away from the midline from the knee-to-ankle axis at that height, and compares the heights of the two contours' maxima. It catches a calf that bulges symmetrically or the wrong way round, a medial head shaped like the lateral, and swapped calf pieces.
 * @evidence contracts/testing.md#independent-expectations Gray 1918 (`packages/human/docs/sources/gray-1918.md`): the gastrocnemius' medial head is the larger, its fibres "thicker and extending lower than those of the lateral", and "the medial border is the more prominent", so the medial contour peaks lower. No construction constant or reference enters. Proven on a made pair of contours (reads its known 40 mm) and red on f1's own contours swapped. Oracle limits: the reach is taken across the body (the Z axis) from the joint axis, so a shank rotated about its own axis shifts which fibres form each contour; the soleus' lateral edge, "the longer", is not separated from the gastrocnemius.
 * @evidence contracts/testing.md#distinguishing-cases Both shanks of the core set's ten people. The calf's girth profile and its one belly belong to `test_human_curves_profile_leg` and `test_human_anatomy_leg`; dents round the tibia to `test_human_curves_dent_shank`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_region_calf`, generating the cached people's neutral skin in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_curves_region_calf(): void {
  const failures: string[] = [];

  // A made pair: Gaussian contours over 0 to 200 mm of height, the lateral peaking at 140 mm, the medial at 100 mm.
  const height: number[] = Array.from({ length: 101 }, (_: unknown, i: number): number => 200 - 2 * i);
  const bump: (centre: number) => number[] = (centre: number): number[] => height.map((y: number): number => 40 + 10 * Math.exp(-((y - centre) ** 2) / 800));
  const made: number = HumanCurveCalfContour.row("made", "left", { height, lateral: bump(140), medial: bump(100) }).value;
  if (!(Math.abs(made - 40) < 1e-9)) failures.push(`made contours read ${made.toFixed(3)} mm, expected 40`);

  // f1's own left contours, swapped.
  const own: IContours = HumanCurveCalfContour.contours(HumanAnatomy.posed("f1", {}), "left");
  const swapped: HumanAnatomyAudit.IRow = HumanCurveCalfContour.row("f1 swapped", "left", { ...own, lateral: own.medial, medial: own.lateral });
  const straight: HumanAnatomyAudit.IRow = HumanCurveCalfContour.row("f1", "left", own);
  if (!(swapped.value === -straight.value && (straight.value === 0 || HumanAnatomyAudit.passes(straight) !== HumanAnatomyAudit.passes(swapped))))
    failures.push(`f1's swapped contours read ${swapped.value.toFixed(1)} mm against ${straight.value.toFixed(1)}, expected the opposite sign and the opposite verdict`);

  // Every person, both shanks.
  for (const name of HumanPeople.names())
    for (const side of ["left", "right"] as const) {
      try {
        const r: HumanAnatomyAudit.IRow = HumanCurveCalfContour.row(name, side, HumanCurveCalfContour.contours(HumanAnatomy.posed(name, {}), side));
        if (!HumanAnatomyAudit.passes(r)) failures.push(`${r.person.padEnd(14)} ${r.site}: ${r.value.toFixed(1)} mm, expected above 0`);
      } catch (error) {
        failures.push(`${name.padEnd(14)} ${side} calf could not be read: ${(error as Error).message}`);
      }
    }
  if (failures.length !== 0) throw new Error(`${failures.length} OBS-LG-1 findings:\n${failures.join("\n")}`);
}
