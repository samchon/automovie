import { HumanHeadPieceSingleton } from "../../../internal/head/HumanHeadPieceSingleton";
import { HumanHeadMadeCut } from "../../../internal/head/HumanHeadMadeCut";
import { HumanHeadSurfaceProof } from "../../../internal/head/HumanHeadSurfaceProof";
import { HumanHeadSurfaceRows } from "../../../internal/head/HumanHeadSurfaceRows";
import { assertHumanProvenRows } from "../../../internal/region/assertHumanProvenRows";

/**
 * Every person's profile under the chin, on the head's skin piece built
 * alone, runs from the throat through the cervicomental angle to the chin
 * with no waves.
 *
 * Scenarios:
 * 1. A smooth ellipsoid of f1's head passes the three submental rows.
 * 2. The same ellipsoid with its front waved 1.2 mm at a 20 mm wavelength below the menton fails the median row.
 * 3. Every person of `HumanPeople`: the median and paramedian profiles are read and every extra run listed.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds each person's head piece and cuts it every half millimetre from 3 mm over the neck ring to 15 percent above the menton; the sections tilt forward under the nose and so pass under the chin, and their front points (median) or first points 15 mm out (paramedian) trace the profile round the chin's underside. It counts the runs of sign of the sagittae over a 15 mm chord beyond the 1 mm floor. It catches waves, ripples and collars under the chin and on the throat.
 * @evidence contracts/testing.md#independent-expectations Anatomy gives the profile from the neck up as the throat (convex over the thyroid cartilage, or straight), the cervicomental angle (concave) and the chin (convex), so it has at most those three runs in that order (PRO-HD-1, section 3.7). The floor is the ISO 20685-1:2018 Table 4 head error, 1 mm, on a 15 mm chord, a bending of 28 mm radius: the chin and the angle bend more and count, a lean throat bends less. Proven here: the made ellipsoid reads one run and passes; the made wave of 1.2 mm at 20 mm reads about 2 mm on the chord and adds runs. Oracle limits: a wave shorter than about 10 mm averages out on the chord and is left to the crease rows; the angle's band (HD-8) needs its source.
 * @evidence contracts/testing.md#distinguishing-cases The core set's references and population ends, lean and heavy. The neck's own composed chain and its seam with the head are read by the seam test and the curve tests.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_head_surface_submental`, building each person's head piece once per process in a `Singleton`, on the CPU with no renderer, browser or GPU.
 */
export function test_human_head_surface_submental(): void {
  assertHumanProvenRows(
    "head surface submental",
    (): string[] => HumanHeadSurfaceProof.failures(HumanHeadSurfaceRows.submental, HumanHeadMadeCut.waves, "submental median", 1),
    (name: string): ReturnType<typeof HumanHeadSurfaceRows.submental> => {
      const piece: HumanHeadPieceSingleton.IPiece = HumanHeadPieceSingleton.get(name);
      return HumanHeadSurfaceRows.submental(piece, HumanHeadSurfaceRows.cutOf(piece));
    },
  );
}
