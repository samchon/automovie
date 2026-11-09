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
 * - Side view: the soft-tissue profile follows two straight chords that meet
 *   at pronasale (a declared convention, DEBT; see {@link profile}),
 *   nasion-pronasale and pronasale-subnasale, rounded at the tip over the tip
 *   lobule's own radius and buried at both poles (see {@link profile}).
 * - Front view: the dorsum's half width, the prior's `face.dorsum` row times
 *   the half nose width.
 * - Axis: level planes whose origins run `depth` behind that nasal chord, so every
 *   section holds its axis.
 * - Fullness: the ellipse's shoulder.
 *
 * What is input and what is prior. Public inputs (FaceBase 3D Facial Norms
 * inter-landmark protocol, `IAutoMovieHumanNose`): nasion-subnasale (`height`),
 * subnasale-pronasale (`protrusion`) and alare-alare (`width`). Published
 * prior: nasion-pronasale, the bridge length, is the norms' share of the
 * nasal height (`profile.bridge`, 47.4 / 54.7 in women, 49.9 / 56.6 in men),
 * applied by `AutoMovieHumanHeadLandmarks`, which places pronasale by closing
 * the triangle of these three lengths. No input or prior here describes a
 * dorsal hump, concavity or supratip break, and no scan value enters the law.
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
    const forward: (y: number) => number = profile(plan, base, depth, bottom, top, theta, angles, face);
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
      front: { positive: outline((y: number): number => forward(y) - base(y) + depth), negative: outline((): number => -depth) },
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

  /**
   * The body's anterior profile, world X at a height, calibration mm.
   *
   * Above pronasale it is the straight chord nasion-pronasale; below it the
   * straight chord pronasale-subnasale. Both chords are a declared
   * convention (DEBT, `docs/work/prior-sourcing.md`), not published lines:
   * Powell and Humphreys (1984) was not read, and the columella tangent of
   * Legan and Burstone's nasolabial angle (1980, Table 1, Cm-Sn-Ls) passes
   * the columella point Cm and subnasale, not pronasale. Their endpoints are
   * the published inter-landmark distances (`IAutoMovieHumanNose` and the
   * bridge prior above), so the source carries those lengths exactly. A straight chord
   * is the least-assuming curve between two landmarks when no input describes
   * a hump or a concavity; it replaces the former natural cubic through
   * (5 * pronasale + root) / 6 fairing ordinates, a convention that bowed the
   * dorsum far ahead of this line.
   *
   * Tip: within the tip lobule's own radius (`face.tipBall[2]` half nose
   * widths, the cap `nose.lobule` places on pronasale) each chord's drop is
   * scaled by `t (2 - t)`, t the chord distance from the tip over that radius.
   * The profile then has value pronasale and zero slope at the tip, so
   * pronasale stays the most protrusive point, and the rounding stays inside
   * the region the lobule owns; it is C1 at the tip, where the lobule covers it.
   *
   * Poles: each end is buried `depth` behind the face (the axis offset) by a
   * quintic smoothstep `t^3 (10 - 15 t + 6 t^2)` over the two-pole-angle span
   * from the existing fairing angle to the pole, so the burial is C2 there and
   * the pole stays regular in that angle. Each side is monotone, so no
   * height between the poles stands ahead of pronasale.
   */
  function profile(
    plan: IAutoMovieHumanHeadLayout,
    base: (y: number) => number,
    depth: number,
    bottom: number,
    top: number,
    theta: (y: number) => number,
    angles: readonly number[],
    face: AutoMovieHumanHeadPrior.IFace,
  ): (y: number) => number {
    const prn: [number, number] = plan.landmarks.pronasale;
    const n: [number, number] = plan.landmarks.nasion;
    const sn: [number, number] = plan.landmarks.subnasale;
    const lobule: number = (face.tipBall[2]! * plan.noseWidth) / 2;
    const bridge: number = Math.hypot(n[0] - prn[0], n[1] - prn[1]);
    const columella: number = Math.hypot(prn[0] - sn[0], prn[1] - sn[1]);
    const upper: number = Math.min(1, lobule / bridge);
    const lower: number = Math.min(1, lobule / columella);
    const upperRoot: number = base(top) - depth;
    const lowerRoot: number = base(bottom) - depth;

    /** Chord ordinate through pronasale and an end landmark, at a height on that side. */
    const chord: (end: [number, number], y: number) => number = (end: [number, number], y: number): number =>
      prn[0] + ((end[0] - prn[0]) * (y - prn[1])) / (end[1] - prn[1]);
    const round: (share: number, radius: number) => number = (share: number, radius: number): number => {
      const t: number = Math.min(1, share / radius);
      return t * (2 - t);
    };
    const smooth: (t: number) => number = (t: number): number => {
      const u: number = Math.max(0, Math.min(1, t));
      return u * u * u * (10 - 15 * u + 6 * u * u);
    };
    const lowerEnd: number = chord(sn, bottom);
    return (y: number): number => {
      const angle: number = theta(y);
      if (y >= prn[1]) {
        const line: number = chord(n, y);
        const share: number = (y - prn[1]) / (n[1] - prn[1]);
        // The dorsal line reaches the nasion's skin point at the top pole,
        // which the burial carries back to the buried root behind it.
        const bury: number = (chord(n, top) - upperRoot) * smooth((angle - angles[3]!) / (Math.PI - angles[3]!));
        return prn[0] - (prn[0] - line) * round(share, upper) - bury;
      }
      const line: number = chord(sn, y);
      const share: number = (prn[1] - y) / (prn[1] - sn[1]);
      const bury: number = (lowerEnd - lowerRoot) * smooth((angles[1]! - angle) / angles[1]!);
      return prn[0] - (prn[0] - line) * round(share, lower) - bury;
    };
  }
}
