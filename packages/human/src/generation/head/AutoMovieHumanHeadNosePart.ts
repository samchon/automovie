import { AutoMovieNaturalSpline, AutoMovieViewSection, type IAutoMovieViewPart } from "@automovie/engine";
import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadSourceAxis } from "./AutoMovieHumanHeadSourceAxis";

/**
 * The nose's body (the dorsum from the nasion down to the tip and the
 * columella under it, without the tip's ball and the alar lobules, which are
 * its own parts) as a part drawn from its views, in level sections as the
 * reference's skin is read.
 *
 * - Side view: a natural cubic in the two-pole angle, rising monotonically
 *   from its buried lower root to pronasale and falling to its buried
 *   nasion root. Pronasale has zero first and second angular derivatives.
 *   Each side has two equal angular spans, whose midpoint ordinate is
 *   (5*pronasale+root)/6; the natural cubic then has that exact flat jet
 *   and cannot place the dorsum ahead of the named most protrusive tip.
 *   This fairing is a geometric convention, not a measured dorsal shape.
 * - Front view: the dorsum's half width, the prior's `face.dorsum` row times
 *   the half nose width.
 * - Axis: level planes whose origins run `depth` behind that nasal chord, so every
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
    const dorsum: AutoMovieNaturalSpline.ISpline = AutoMovieNaturalSpline.create(knots, face.dorsum);
    const span: number = plan.nasion - plan.tip;
    const height: (v: number) => number = (v: number): number => plan.tip + v * span;
    const n: [number, number] = plan.landmarks.nasion;
    const sn: [number, number] = plan.landmarks.subnasale;
    /** The own nasal chord, extended only for the buried end under the columella. */
    const base: (y: number) => number = (y: number): number => sn[0] + ((n[0] - sn[0]) * (y - sn[1])) / (n[1] - sn[1]);
    // Poles: the profile row's lowest knot under the tip, the nasion over it.
    const low: number = knots[0]!;
    const high: number = 1;
    const bottom: number = height(low);
    const top: number = height(high);
    const theta: (y: number) => number = (y: number): number => y === bottom ? 0 : y === top ? Math.PI : Math.acos(1 - 2 * ((y - bottom) / (top - bottom)));
    const tipAngle: number = theta(plan.tip);
    const angles: number[] = [0, tipAngle / 2, tipAngle, (tipAngle + Math.PI) / 2, Math.PI];
    const tip: number = plan.landmarks.pronasale[0];
    const lowerRoot: number = base(bottom) - depth;
    const upperRoot: number = base(top) - depth;
    const forward: AutoMovieNaturalSpline.ISpline = AutoMovieNaturalSpline.create(angles, [lowerRoot, (5 * tip + lowerRoot) / 6, tip, (5 * tip + upperRoot) / 6, upperRoot]);
    const sites: Map<number, string> = new Map(Array.from({ length: LAYERS + 1 }, (_: unknown, i: number): [number, string] => [height(low + (high - low) * i / LAYERS), `nose.${i}`]));
    sites.set(bottom, "nose.columella");
    sites.set(top, "nose.nasion");
    sites.set(plan.tip, "nose.pronasale");
    sites.set(bottom + (top - bottom) * Math.sin(angles[1]! / 2) ** 2, "nose.lower-fairing");
    sites.set(bottom + (top - bottom) * Math.sin(angles[3]! / 2) ** 2, "nose.upper-fairing");
    const stations: number[] = [...sites.keys()].sort((a: number, b: number): number => a - b);
    const outline: (value: (y: number) => number) => IAutoMovieViewPart.IOutline = (value: (y: number) => number): IAutoMovieViewPart.IOutline => ({ knots: stations.map((station: number): IAutoMovieViewPart.IKnot => ({ site: sites.get(station)!, station, value: station === bottom || station === top ? 0 : value(station) })) });
    const coordinate: (component: 0 | 1 | 2) => IAutoMovieViewPart.IOutline = (component: 0 | 1 | 2): IAutoMovieViewPart.IOutline => ({
      knots: stations.map((station: number): IAutoMovieViewPart.IKnot => ({ site: sites.get(station)!, station, value: component === 0 ? base(station) - depth : component === 1 ? station : 0 })),
      ...(component === 0 ? { parameter: { type: "angle" as const, bottom, top } } : {}),
    });
    const half: (y: number) => number = (y: number): number => AutoMovieNaturalSpline.evaluate(dorsum, (y - plan.tip) / span) * plan.noseWidth;
    return {
      name: "nose",
      axis: AutoMovieHumanHeadSourceAxis.of({ x: coordinate(0), y: coordinate(1), z: coordinate(2) }, [1, 0, 0], [0, 0, 1]),
      stations,
      front: { positive: outline((y: number): number => AutoMovieNaturalSpline.evaluate(forward, theta(y)) - base(y) + depth), negative: outline((): number => -depth) },
      side: { positive: outline(half), negative: outline((y: number): number => -half(y)) },
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
