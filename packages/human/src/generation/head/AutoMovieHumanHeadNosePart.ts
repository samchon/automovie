import { AutoMovieNaturalSpline, AutoMovieViewAxis, AutoMovieViewSection, type IAutoMovieViewPart } from "@automovie/engine";
import { AutoMovieHumanHeadMath } from "../AutoMovieHumanHeadMath";
import { AutoMovieHumanHeadMedianProfile } from "../AutoMovieHumanHeadMedianProfile";
import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";

/**
 * The nose's body (the dorsum from the nasion down to the tip and the
 * columella under it, without the tip's ball and the alar lobules, which are
 * its own parts) as a part drawn from its views, in level sections as the
 * reference's skin is read.
 *
 * - Side view: the ridge over the face's midline profile
 *   (`AutoMovieHumanHeadMedianProfile`, the profile under the nose), at
 *   each height the prior's profile row (`face.profile` at
 *   `face.profileKnots`, fractions of the span from the tip, 0, to the
 *   nasion, 1) times the nose's lead, falling to the face over the root's
 *   last share (`AutoMovieHumanHeadNoseBridge.ROOT`), as the head's earlier
 *   nose read the same rows. Behind, the section reaches `depth` into the
 *   face.
 * - Front view: the dorsum's half width, the prior's `face.dorsum` row times
 *   the half nose width.
 * - Axis: level planes whose origins run `depth` behind the profile, so every
 *   section holds its axis.
 * - Fullness: the ellipse's shoulder.
 *
 * Both ends close on poles inside the face: under the tip at the profile
 * row's lowest knot, and over the nasion where the ridge has fallen to the
 * face.
 */
export namespace AutoMovieHumanHeadNosePart {
  /** Layers between the poles. */
  export const LAYERS: number = 24;

  /** Control points per section, a multiple of 4. */
  export const ORDER: number = 16;

  /** Ring samples of the emitted chain. */
  export const SAMPLES: number = 64;

  /**
   * The nose's body as a view part.
   *
   * @param plan The landmark skeleton.
   * @param depth How far the axis stands behind the face's profile, mm, positive.
   * @returns The part, chain name `nose`.
   */
  export function of(plan: IAutoMovieHumanHeadLayout, depth: number): IAutoMovieViewPart {
    const face: AutoMovieHumanHeadPrior.IFace = AutoMovieHumanHeadPrior.PRIOR.face;
    const knots: readonly number[] = face.profileKnots;
    const profile: AutoMovieNaturalSpline.ISpline = AutoMovieNaturalSpline.create(knots, face.profile);
    const dorsum: AutoMovieNaturalSpline.ISpline = AutoMovieNaturalSpline.create(knots, face.dorsum);
    const span: number = plan.nasion - plan.tip;
    const height = (v: number): number => plan.tip + v * span;

    // The ridge's height over the face at a fraction, as the earlier nose.
    const root: number = 0.3;
    const ridge = (v: number): number =>
      Math.max(0, AutoMovieNaturalSpline.evaluate(profile, v)) * AutoMovieHumanHeadMath.smooth((1 - v) / root) * plan.noseLead;

    // Poles: the profile row's lowest knot under the tip, the nasion over it.
    const low: number = knots[0]!;
    const high: number = 1;
    const fractions: number[] = Array.from({ length: LAYERS + 1 }, (_: unknown, k: number): number => low + ((high - low) * k) / LAYERS);
    const stations: number[] = fractions.map(height);
    const outline = (value: (v: number) => number): IAutoMovieViewPart.IOutline => ({
      knots: fractions.map((v: number, k: number): IAutoMovieViewPart.IKnot => ({
        site: k === 0 ? "nose.columella" : k === LAYERS ? "nose.nasion" : `nose.${k}`,
        station: height(v),
        value: k === 0 || k === LAYERS ? 0 : value(v),
      })),
    });
    const half = (v: number): number => Math.max(1e-3, AutoMovieNaturalSpline.evaluate(dorsum, v) * plan.noseWidth);
    return {
      name: "nose",
      axis: AutoMovieViewAxis.level(
        stations.map((y: number): AutoMovieViewAxis.IAxisKnot1 => ({ station: y, value: AutoMovieHumanHeadMedianProfile.profileAt(plan, y) - depth })),
        stations.map((y: number): AutoMovieViewAxis.IAxisKnot1 => ({ station: y, value: 0 })),
      ),
      stations,
      front: { positive: outline((v: number): number => depth + ridge(v)), negative: outline((): number => -depth) },
      side: { positive: outline(half), negative: outline((v: number): number => -half(v)) },
      fullness: {
        kind: "shoulder",
        shoulder: {
          knots: [
            { site: "nose.columella", station: stations[0]!, value: AutoMovieViewSection.ELLIPSE },
            { site: "nose.nasion", station: stations[stations.length - 1]!, value: AutoMovieViewSection.ELLIPSE },
          ],
        },
      },
      pole: "both",
      order: ORDER,
      samples: SAMPLES,
    };
  }
}
