import { HumanHeadPieceSingleton } from "../../../internal/head/HumanHeadPieceSingleton";
import { HumanHeadMadeCut } from "../../../internal/head/HumanHeadMadeCut";
import { HumanHeadSurfaceProof } from "../../../internal/head/HumanHeadSurfaceProof";
import { HumanHeadSurfaceRows } from "../../../internal/head/HumanHeadSurfaceRows";
import { assertHumanProvenRows } from "../../../internal/region/assertHumanProvenRows";

/**
 * Every person's chin and jaw under the lower lip, on the head's skin piece
 * built alone, run round the face's front with no step across.
 *
 * Scenarios:
 * 1. A smooth ellipsoid of f1's head passes both jaw rows.
 * 2. The same ellipsoid stepped out 1.5 mm beyond 15 mm of half width fails both sides.
 * 3. Every person of `HumanPeople`: every horizontal section of the band is read and the worst crease per side listed.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds each person's head piece and cuts it every millimetre from 15 percent above the menton to 30 percent of the way from stomion to menton, reading each side's outline from the front midline back to 10 mm in front of the otobasion inferius as signed sagittae over a 10 mm chord about the section's mid-depth. It catches the blocky jaw step under the lower lip, a corner where the chin meets the jaw, and any groove running down the chin, by person and side.
 * @evidence contracts/testing.md#independent-expectations Below the vermilion the face's horizontal outline is convex and no named crease crosses it (the mentolabial sulcus runs across the vertical profile, the labiomandibular fold belongs to age and adiposity), so every sagitta stays within the 1 mm crease limit over a 10 mm chord either way. The band comes from the layout's stomion and menton, which only locate it. Proven here: the made ellipsoid passes; its 1.5 mm step over 1.4 mm turns both sides red with finite values. Oracle limits: a person with a cleft chin would read a concave crease at the midline, which no generated person carries.
 * @evidence contracts/testing.md#distinguishing-cases The core set's references and population ends, both sides. The submental profile under the chin is its own test; the mouth's lips belong to the mouth tests.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_head_surface_jaw`, building each person's head piece once per process in a `Singleton`, on the CPU with no renderer, browser or GPU.
 */
export function test_human_head_surface_jaw(): void {
  assertHumanProvenRows(
    "head surface jaw",
    (): string[] => HumanHeadSurfaceProof.failures(HumanHeadSurfaceRows.jaw, HumanHeadMadeCut.jawStep, "jaw horizontal section", 2),
    (name: string): ReturnType<typeof HumanHeadSurfaceRows.jaw> => {
      const piece: HumanHeadPieceSingleton.IPiece = HumanHeadPieceSingleton.get(name);
      return HumanHeadSurfaceRows.jaw(piece, HumanHeadSurfaceRows.cutOf(piece));
    },
  );
}
