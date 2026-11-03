import { HumanHeadPieceSingleton } from "../../../internal/head/HumanHeadPieceSingleton";
import { HumanHeadMadeCut } from "../../../internal/head/HumanHeadMadeCut";
import { HumanHeadSurfaceProof } from "../../../internal/head/HumanHeadSurfaceProof";
import { HumanHeadSurfaceRows } from "../../../internal/head/HumanHeadSurfaceRows";
import { assertHumanProvenRows } from "../../../internal/region/assertHumanProvenRows";

/**
 * Every person's forehead, on the head's skin piece built alone, curves up
 * from the glabella to the vertex with no ridge and no dent.
 *
 * Scenarios:
 * 1. A smooth ellipsoid of f1's head passes every forehead row.
 * 2. The same ellipsoid with its front pushed out 2 mm between 15 and 25 mm over the glabella, 1 mm edges, fails the ridge rows.
 * 3. Every person of `HumanPeople`: the median and four paramedian profiles are read and every ridge and dent listed by person and profile.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds each person's head piece from its fixed setup and cuts the skin every half millimetre from the glabella to 6 mm under the vertex, reading the median profile (each section's front midline point) and the profiles 20 and 35 mm either side (the section's first point at that half width from the front), each as signed sagittae over a 10 mm chord about the head's centre at the eye level. It catches a forehead plateau's edges, a shelf, a ridge or a dent across the frontal bone.
 * @evidence contracts/testing.md#independent-expectations The frontal bone and its skin are convex in both directions from the glabella to the vertex and carry no named crease (HD-9, FLD-1), so the most convex sagitta stays under the 1 mm crease limit (a radius of 12.5 mm or more) and the most concave under the same limit inward. Proven here: the made ellipsoid passes; the made 2 mm shelf turns the ridge rows red with finite values. Oracle limits: a plateau with rounded edges wider than 12.5 mm of radius passes; the glabella's own prominence lies at the profile's start and is read only from its upper side.
 * @evidence contracts/testing.md#distinguishing-cases The core set's references and population ends. The temple, jaw and submental rows are their own tests; the vault's composed chain belongs to the curve tests.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_head_surface_forehead`, building each person's head piece once per test in a `Singleton`, on the CPU with no renderer, browser or GPU.
 */
export function test_human_head_surface_forehead(): void {
  assertHumanProvenRows(
    "head surface forehead",
    (): string[] =>
      HumanHeadSurfaceProof.failures(
        HumanHeadSurfaceRows.forehead,
        (piece: HumanHeadPieceSingleton.IPiece): HumanHeadMadeCut.Change => HumanHeadMadeCut.shelf(piece, piece.landmarks.glabella[0] - piece.built.plan.length / 2),
        "(ridge)",
        1,
      ),
    (name: string): ReturnType<typeof HumanHeadSurfaceRows.forehead> => {
      const piece: HumanHeadPieceSingleton.IPiece = HumanHeadPieceSingleton.get(name);
      return HumanHeadSurfaceRows.forehead(piece, HumanHeadSurfaceRows.cutOf(piece));
    },
  );
}
