import type { IAutoMovieHumanLoftChain } from "../../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanCurveRings } from "../../../internal/curves/HumanCurveRings";
import type { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanPeople } from "../../../internal/HumanPeople";
import { assertHumanProvenRows } from "../../../internal/region/assertHumanProvenRows";
import { HumanEventSeamProof } from "../../../internal/region/HumanEventSeamProof";
import { HumanEventSeamRows } from "../../../internal/region/HumanEventSeamRows";

/**
 * Every person's limbs and digits meet their neighbours at their declared
 * seams with no crack, kink or crease: every event seam of the composed body
 * whose parent is not the neck or the shoulders, so the trunk's crotch ring
 * and the legs (SEAM-4), the legs and the feet (SEAM-5), the arms and the
 * hands (SEAM-6), the hands and their digits (SEAM-7) and the feet and their
 * toes (SEAM-8), whichever of them the body declares as events.
 *
 * Scenarios:
 * 1. A made sphere cut at its equator passes every seam row.
 * 2. The same seam with its child pushed out 2 mm at the seam fails the gap, angle and crease rows.
 * 3. Every person of `HumanPeople`: every declared event seam whose parent is not `head` or `upper` is read and its worst gap, angle and crease listed by seam and phase.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person through the public body law and reads every event the body declares (`IAutoMovieHumanBodyCalibration.events`) whose parent is not the neck chain or `upper` (read by `test_human_trunk_seam`) nor a head chain (read by `test_human_head_seam`): at 48 parent phases per child arc, the parent's contact point, the nearest point of the child's adjacent end ring, both meridians away from the seam and their normals (`HumanEventSeamRows`). It catches a crack at the groin, a step at the ankle or the wrist, a cuff round a limb's end, a torn digit root and a kink where a toe or finger leaves its web.
 * @evidence contracts/testing.md#independent-expectations Each limit is the continuity the seam declares, read as the catalog's SEAM rows: a gap within 1 mm (ISO 20685-1's least error), normals within 0.1 degree (class A surfacing), the meridian's sagitta over 10 mm within the crease bound; no construction constant enters. The lowest quarter of a leg's crotch seam, the perineum between the inguinal creases, is a named fold (FLD-1) and is left out of the crease reading, as the axilla is for the arms. Proven by `HumanEventSeamProof` on a made sphere (green) and its child pushed out 2 mm (red on every row). Oracle limits: only seams declared as events are read; an appendage strip or a pole is the strip and cap rules'.
 * @evidence contracts/testing.md#distinguishing-cases Every limb and digit event seam of the core set's ten people, both sides. The neck, shoulder, trunk and arm-root seams belong to `test_human_trunk_seam`, the head's to `test_human_head_seam`, the declared layers' G0 on the skin to `test_human_layer_composition`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_seam_limbs`, generating the cached people in process on the CPU (body law only) with no renderer, browser or GPU.
 */
export function test_human_curves_seam_limbs(): void {
  assertHumanProvenRows("limb and digit seams", HumanEventSeamProof.failures, (name: string): HumanAnatomyAudit.IRow[] => {
    const p: HumanPeople.IPerson = HumanPeople.person(name);
    const k: number = HumanCurveRings.scale(p);
    const parents: string[] = p.body.chains.map((c: IAutoMovieHumanLoftChain): string => c.name).filter((n: string): boolean => !/^(head|upper)(\.|$)/.test(n));
    const seams: HumanEventSeamRows.ISeam[] = HumanEventSeamRows.declared(p.body, parents, /./, /^leg\./);

    // A body that declares none of these seams has nothing read, which must not pass as sound.
    if (seams.length === 0) throw new Error("the body declares no limb or digit event seam");
    return seams.flatMap((s: HumanEventSeamRows.ISeam): HumanAnatomyAudit.IRow[] => HumanEventSeamRows.rows(name, s, k));
  });
}
