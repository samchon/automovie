import { HumanHeadPieceSingleton } from "../../../internal/head/HumanHeadPieceSingleton";
import { HumanHeadMadeCut } from "../../../internal/head/HumanHeadMadeCut";
import { HumanHeadSurfaceProof } from "../../../internal/head/HumanHeadSurfaceProof";
import { HumanHeadSurfaceRows } from "../../../internal/head/HumanHeadSurfaceRows";
import { assertHumanProvenRows } from "../../../internal/region/assertHumanProvenRows";

/**
 * Every person's temple, on the head's skin piece built alone, runs smooth
 * from the eye to the ear: no cliff in its half width and no vertical crease.
 *
 * Scenarios:
 * 1. A smooth ellipsoid of f1's head length, breadth and height passes every temple row.
 * 2. The same ellipsoid widened 6 percent over 3 mm of height between the ear and the eye fails the vertical profiles.
 * 3. Every person of `HumanPeople`: every vertical profile and horizontal outline is read and every crease listed by person, side and place.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds each person's head from its fixed setup (`AutoMovieHumanHeadPass.prepare` on the person's neck chain and head inputs, one `build` with no corrections) and cuts the skin piece (`AutoMovieHumanHeadSkin.sides`) every millimetre from 15 mm under to 30 mm over the exocanthion. It reads the half width at five fixed forward places from 8 mm in front of the otobasion superius to 8 mm behind the exocanthion, as a vertical profile per place, and the horizontal outline over that span per height, each as signed sagittae over a 10 mm chord. It catches the eye-to-ear groove (a cliff of the half width within a few millimetres of height), a vertical seam or ridge before the ear and any dent of the temple, by person, side and place.
 * @evidence contracts/testing.md#independent-expectations No named crease of the face lies between the lateral orbit and the ear (the face's creases are the supratarsal, nasolabial, mentolabial, philtral and alar ones and the ear's own folds), so every sagitta stays within the 1 mm crease limit over a 10 mm chord, the sagitta of a 12.5 mm radius (`HumanAnatomyShared.CREASE`). The bands come from the person's published landmarks, which only locate the site. Proven here: the made ellipsoid reads at most 0.25 mm everywhere and passes; its 6 percent cliff of about 4 mm over 3 mm turns the vertical profiles red with finite values. Oracle limits: the piece is the base skin with its reliefs, before the ears' splice, so the splice's own seam is read by the head's seam test; the corrections that solve the measures are left out, as the piece's standalone entry does.
 * @evidence contracts/testing.md#distinguishing-cases The core set's references and population ends, small to large heads, both sides. The forehead, jaw and submental rows are their own tests; the head chains' composed curves belong to the overall tester's curve tests.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_head_surface_temple`, building each person's head piece once per process in a `Singleton`, on the CPU with no renderer, browser or GPU.
 */
export function test_human_head_surface_temple(): void {
  assertHumanProvenRows(
    "head surface temple",
    (): string[] => HumanHeadSurfaceProof.failures(HumanHeadSurfaceRows.temple, HumanHeadMadeCut.cliff, "temple vertical profile", 2),
    (name: string): ReturnType<typeof HumanHeadSurfaceRows.temple> => {
      const piece: HumanHeadPieceSingleton.IPiece = HumanHeadPieceSingleton.get(name);
      return HumanHeadSurfaceRows.temple(piece, HumanHeadSurfaceRows.cutOf(piece));
    },
  );
}
