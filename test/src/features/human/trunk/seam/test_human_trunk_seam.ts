import { HumanCurveRings } from "../../../internal/curves/HumanCurveRings";
import type { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanPeople } from "../../../internal/HumanPeople";
import { HumanEventSeamProof } from "../../../internal/region/HumanEventSeamProof";
import { HumanEventSeamRows } from "../../../internal/region/HumanEventSeamRows";
import { assertHumanProvenRows } from "../../../internal/region/assertHumanProvenRows";

/**
 * Every person's neck, shoulders, trunk and arm roots meet at their declared
 * seams with no crack, kink or crease: the neck's bottom ring and the
 * shoulders (SEAM-1), the shoulders and the trunk (SEAM-2), and each arm's
 * root on its arc of the shoulders' ring (SEAM-3).
 *
 * Scenarios:
 * 1. A made sphere cut at its equator passes every seam row.
 * 2. The same seam with its child pushed out 2 mm at the seam fails the gap, angle and crease rows.
 * 3. Every person of `HumanPeople`: every declared seam from the neck chain `head` and from `upper` is read and its worst gap, angle and crease listed by seam and phase.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads each person's delivered chains through their own evaluator (`AutoMovieHumanLoftChain.ring`) at the events the body declares (`IAutoMovieHumanBodyCalibration.events`, parents `head` and `upper`). At 48 parent phases inside each child's arcs it takes the parent's contact point, the nearest point of the child's adjacent end ring, both sides' meridians away from the seam and their normals, and reads the gap, the angle between the normals and the sagitta of the meridian across the seam over a 10 mm chord. It catches the neck base's flared disc and stepped collar, a ridge round the torso at the axilla and a step at the shoulder and arm root, by seam and phase.
 * @evidence contracts/testing.md#independent-expectations The seams declare their continuity (the body's event join shares the contact ring's vertices; SEAM-1 G2, SEAM-2 and SEAM-3 G1), so the gap stays within the catalog's 1 mm G0 limit and the normals agree within 0.1 degree, the class A surfacing limit the catalog's SEAM rows read; a skin with no named fold at the seam bends there no more than a 12.5 mm radius, the 1 mm crease limit over a 10 mm chord (`HumanAnatomyShared.CREASE`), the lowest quarter of the arm root's seam, the axillary hollow (FLD-1), being left out of the crease reading. Proven here: the made sphere reads gap 0, angle 0 and 0.125 mm and passes; pushed out 2 mm it reads a 2 mm gap, about 34 degrees and a crease, all red. Oracle limits: the child's point is the nearest on its dense end ring (0.3 mm apart), so a gap under 0.1 mm is not resolved; normals come from 0.5 mm one-sided differences.
 * @evidence contracts/testing.md#distinguishing-cases The core set's references and population ends, both arms. The crotch's seam to the legs belongs to the leg tester; the neck's top and the head's seams to the head seam test; the composed curves away from the seams to the curve tests.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_trunk_seam`, reading the cached people's chains in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_trunk_seam(): void {
  assertHumanProvenRows("trunk seam", HumanEventSeamProof.failures, (name: string): HumanAnatomyAudit.IRow[] => {
    const p: HumanPeople.IPerson = HumanPeople.person(name);
    const k: number = HumanCurveRings.scale(p);
    return HumanEventSeamRows.declared(p.body, ["head", "upper"], /^(upper|trunk|arm\.(left|right))$/, /^arm\./).flatMap(
      (s: HumanEventSeamRows.ISeam): HumanAnatomyAudit.IRow[] => HumanEventSeamRows.rows(name, s, k),
    );
  });
}
