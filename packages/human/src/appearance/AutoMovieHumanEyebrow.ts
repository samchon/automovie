import type { IAutoMovieMesh } from "@automovie/interface";

import { AutoMovieHumanEyelid } from "../generation/AutoMovieHumanEyelid";
import type { AutoMovieHumanLoftContract } from "../lofting/AutoMovieHumanLoftContract";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";
import { AutoMovieHumanBrowProjector } from "./AutoMovieHumanBrowProjector";
import { AutoMovieHumanEyebrowBody } from "./AutoMovieHumanEyebrowBody";
import { AutoMovieHumanEyebrowHead } from "./AutoMovieHumanEyebrowHead";
import { AutoMovieHumanEyebrowPlacement } from "./AutoMovieHumanEyebrowPlacement";
import { AutoMovieHumanEyebrowStrand } from "./AutoMovieHumanEyebrowStrand";
import { AutoMovieHumanEyebrowTail } from "./AutoMovieHumanEyebrowTail";

/**
 * Eyebrow of one eye as flat strands lying on the generated skin, assembled
 * from its pieces.
 *
 * Placement (`AutoMovieHumanEyebrowPlacement`): the brow is laid out in the
 * face plane from the same eye's canthi, then every hair point is projected
 * along the line of sight onto the generated head skin, so the brow follows
 * whatever brow ridge the body generator made.
 *
 * Hairs (Rajput 2021, conventional, and Gray 1918): about {@link COUNT} per
 * brow, denser at the head and body and thinning to the tail and the
 * borders, whose edge is broken by noise so it is not a stencil. Direction in
 * the face plane, as an angle from the brow axis toward the temple: the
 * head's (`AutoMovieHumanEyebrowHead`) over the first fifth, the body's
 * (`AutoMovieHumanEyebrowBody`) across the middle, the tail's
 * (`AutoMovieHumanEyebrowTail`) at the end, blended by the head and tail
 * weights; each hair is laid on the skin by `AutoMovieHumanEyebrowStrand`.
 *
 * Determinism: one fixed seed for both eyes, so the sides mirror: one
 * canonical construction fed each side's own measured lid.
 */
export namespace AutoMovieHumanEyebrow {
  /** Hairs per brow. */
  export const COUNT: number = 1100;

  /**
   * Build one brow, or nothing and one diagnostic when it breaks its
   * contract: a brow is an optional piece of level 8
   * (`docs/techniques/construction-levels.md`), so the figure keeps its bare
   * brow skin and the defect is recorded, never thrown past this level.
   *
   * @param lid The eye's lid margin in calibration millimetres
   * @param chains The calibration's chains in mm, for the head skin
   * @param scale Calibration millimetre to model unit factor
   * @param seed Seed of the hair placement, one for both eyes so they mirror
   * @param side The eye's side, for the diagnostic
   * @param diagnostics The list a broken contract is recorded in
   * @returns Brow strands in model units, or null
   */
  export function attempt(
    lid: AutoMovieHumanEyelid.ILid,
    chains: readonly IAutoMovieHumanLoftChain[],
    scale: number,
    seed: number,
    side: "left" | "right",
    diagnostics: AutoMovieHumanLoftContract.IDiagnostic[],
  ): IAutoMovieMesh | null {
    try {
      return generate(lid, chains, scale, seed);
    } catch (error) {
      diagnostics.push({
        producer: `human.hair.brows.${side}`,
        level: 8,
        contract: "the brow builds on the head skin above its lid",
        detail: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Build one brow.
   *
   * @param lid The eye's lid margin in calibration millimetres
   * @param chains The calibration's chains in mm, for the head skin
   * @param scale Calibration millimetre to model unit factor
   * @param seed Seed of the hair placement, one for both eyes so they mirror
   * @returns Brow strands in model units, or null without head skin
   */
  export function generate(
    lid: AutoMovieHumanEyelid.ILid,
    chains: readonly IAutoMovieHumanLoftChain[],
    scale: number,
    seed: number,
  ): IAutoMovieMesh | null {
    const N: typeof AutoMovieHumanAppearanceNoise =
      AutoMovieHumanAppearanceNoise;
    const frame: AutoMovieHumanEyebrowPlacement.IFrame =
      AutoMovieHumanEyebrowPlacement.frame(lid);
    const controls: AutoMovieHumanEyebrowPlacement.IControl[] =
      AutoMovieHumanEyebrowPlacement.controls(frame);
    const length: number = controls[controls.length - 1]!.a - controls[0]!.a;

    // The head's lofted skin in calibration mm, solved in the face plane.
    const skin: AutoMovieHumanBrowProjector | null =
      AutoMovieHumanBrowProjector.create(
        chains,
        frame.globe,
        frame.medial,
        frame.temple,
      );
    if (skin === null) return null;

    const ribbons: AutoMovieHumanEyebrowStrand.IRibbon[] = [];
    let tries: number = 0;
    while (ribbons.length < COUNT && tries < COUNT * 20) {
      tries++;
      const t: number = N.hash(seed, tries, 1);
      const v: number = 2 * N.hash(seed, tries, 2) - 1;

      // Density: full over head and body, thinning along the tail; the
      // borders fade over a noisy edge.
      const edge: number = AutoMovieHumanEyebrowBody.edge(seed, t, v);
      const keep: number =
        AutoMovieHumanEyebrowTail.thin(t) *
        AutoMovieHumanEyebrowBody.border(edge, v) *
        AutoMovieHumanEyebrowHead.fadeIn(t) *
        AutoMovieHumanEyebrowHead.rise(t);
      if (N.hash(seed, tries, 3) > keep) continue;

      // Direction in the face plane, from the brow axis toward the temple.
      const b: AutoMovieHumanEyebrowPlacement.IProfile =
        AutoMovieHumanEyebrowPlacement.profile(controls, t);
      const axis: number = Math.atan(b.slope);
      const head: number = AutoMovieHumanEyebrowHead.weight(t);
      const tail: number = AutoMovieHumanEyebrowTail.weight(t);
      const degrees: number =
        head * AutoMovieHumanEyebrowHead.degrees(v) +
        (1 - head) *
          ((1 - tail) * AutoMovieHumanEyebrowBody.degrees(v) +
            tail * AutoMovieHumanEyebrowTail.degrees()) +
        AutoMovieHumanEyebrowHead.scatter(head) *
          (N.hash(seed, tries, 4) - 0.5);
      const angle: number = axis + (degrees * Math.PI) / 180;
      const hair: number =
        (3.5 + 3 * N.hash(seed, tries, 5)) *
        AutoMovieHumanEyebrowHead.shorten(head);

      // Hair points along the face plane, projected onto the skin and lifted
      // off it along its normal.
      const [ra, rh]: [number, number] = AutoMovieHumanEyebrowPlacement.face(
        controls,
        t,
        v,
      );
      const ribbon: AutoMovieHumanEyebrowStrand.IRibbon | null =
        AutoMovieHumanEyebrowStrand.lay(skin, ra, rh, angle, hair, seed, tries);
      if (ribbon !== null) ribbons.push(ribbon);
    }
    if (length <= 0 || ribbons.length === 0) return null;
    return AutoMovieHumanEyebrowStrand.mesh(ribbons, scale);
  }
}
