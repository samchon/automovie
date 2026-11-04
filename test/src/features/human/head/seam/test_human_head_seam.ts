import { HumanCurveRings } from "../../../internal/curves/HumanCurveRings";
import type { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanPeople } from "../../../internal/HumanPeople";
import { HumanEventSeamProof } from "../../../internal/region/HumanEventSeamProof";
import { HumanEventSeamRows } from "../../../internal/region/HumanEventSeamRows";
import { HumanEventSeamTable } from "../../../internal/region/HumanEventSeamTable";
import { assertHumanProvenRows } from "../../../internal/region/assertHumanProvenRows";

/**
 * Every person's head meets the neck and joins its three chains at their
 * declared seams with no crack, kink or crease: the neck's top ring and the
 * head's underside (SEAM-9), and the middle head with the lower and upper
 * head about the ears (SEAM-10).
 *
 * Scenarios:
 * 1. A made sphere cut at its equator passes every seam row.
 * 2. The same seam with its child pushed out 2 mm at the seam fails the gap, angle and crease rows.
 * 3. Every person of `HumanPeople`: the neck chain's upward event to `head.lower` and both events of `head.middle` are read, worst gap, angle and crease per seam.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads each person's delivered chains at the events the body declares with parents `head` (the neck) and `head.middle`, children `head.lower` and `head.upper`, by the same reader as the trunk's seams: at 48 parent phases inside each arc, the nearest child point, both meridians and normals, the gap, the normal angle and the meridian's sagitta over a 10 mm chord. It catches a ring where the neck meets the jaw, a collar or ripple under the chin at the neck seat, and open or kinked joins of the face's chains in front of and behind the ears.
 * @evidence contracts/testing.md#independent-expectations The seams declare G1 (SEAM-9) and G0 with the shared ring (SEAM-10, events splitting the middle head's end rings), so the gap stays within 1 mm and the normals within the class A 0.1 degree the catalog reads; no named fold of the face lies on these seams, so the meridian bends there no more than a 12.5 mm radius (`HumanAnatomyShared.CREASE`). Proven here on the made sphere seam, green when joined and red when pushed out 2 mm. Oracle limits: the arcs' ends at the ears' pinches are left out (3 percent of each arc), so the ear chains' own seams are not read here; the 0.1 degree reading of a G0 seam lists its kinks for the modeler even where G0 is all it declares.
 * @evidence contracts/testing.md#distinguishing-cases The core set's references and population ends. The neck's bottom seam belongs to the trunk seam test; the ear chains and their roots to the ear rows; the head's skin piece to the head surface tests.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_head_seam`, reading each person's chains in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_head_seam(): void {
  const table: HumanEventSeamTable.ICollector = HumanEventSeamTable.collect("head", (name: string): HumanAnatomyAudit.IRow[] => {
    const p: HumanPeople.IPerson = HumanPeople.person(name);
    const k: number = HumanCurveRings.scale(p);
    return HumanEventSeamRows.declared(p.body, ["head", "head.middle"], /^head\.(lower|upper)$/, /^$/).flatMap(
      (s: HumanEventSeamRows.ISeam): HumanAnatomyAudit.IRow[] => HumanEventSeamRows.rows(name, s, k),
    );
  });
  try {
    assertHumanProvenRows("head seam", HumanEventSeamProof.failures, table.rowsOf);
  } finally {
    console.log(table.format());
  }
}
