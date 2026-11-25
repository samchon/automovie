import {
  AutoMovieNaturalSpline,
  AutoMovieViewSection,
} from "@automovie/engine";
import type {
  IAutoMovieHumanHeadLayout,
  IAutoMovieHumanHeadPrior,
  IAutoMovieNaturalCubicSpline,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
import { AutoMovieHumanHeadSourceAxis } from "./AutoMovieHumanHeadSourceAxis";

/**
 * The nasal dorsum, tip, columella and both alae in one level section family.
 *
 * - Side view: the soft-tissue profile follows two straight chords that meet at
 *   pronasale (a declared convention, DEBT; see {@link profile}),
 *   nasion-pronasale and pronasale-subnasale, rounded at the tip over the tip
 *   lobule's own radius and buried at both poles (see {@link profile}).
 * - Front view: the dorsal half width, the prior's `face.dorsum` row times the
 *   half nose width, fairing to the lateral `alare` guides.
 * - Axis: level planes whose origins run `depth` behind that nasal chord, so
 *   every section holds its axis.
 * - Top view: the ellipse's shoulder and the alar guides' own AP position.
 *
 * What is input and what is prior. Public inputs (FaceBase 3D Facial Norms
 * inter-landmark protocol, `IAutoMovieHumanNose`): nasion-subnasale (`height`),
 * subnasale-pronasale (`protrusion`) and alare-alare (`width`). Published
 * prior: nasion-pronasale, the bridge length, is the norms' share of the nasal
 * height (`profile.bridge`, 47.4 / 54.7 in women, 49.9 / 56.6 in men), applied
 * by `AutoMovieHumanHeadLandmarks`, which places pronasale by closing the
 * triangle of these three lengths. No input or prior here describes a dorsal
 * hump, concavity or supratip break, and no scan value enters the law.
 *
 * Both ends close on poles inside the face: under the tip at the profile row's
 * lowest knot, and over the nasion where the ridge has fallen to the face.
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
   * @param depth How far the axis stands behind the face's profile, mm,
   *   positive.
   * @returns The part, chain name `nose`.
   */
  export function of(
    plan: IAutoMovieHumanHeadLayout,
    depth: number,
  ): IAutoMovieViewPart {
    const face: IAutoMovieHumanHeadPrior.IFace =
      AutoMovieHumanHeadPrior.PRIOR.face;
    const knots: readonly number[] = face.profileKnots;
    const dorsum: IAutoMovieNaturalCubicSpline = AutoMovieNaturalSpline.create(
      knots,
      face.dorsum,
    );
    const span: number = plan.nasion - plan.tip;
    const height: (v: number) => number = (v: number): number =>
      plan.tip + v * span;
    const n: [number, number] = plan.landmarks.nasion;
    const sn: [number, number] = plan.landmarks.subnasale;
    /**
     * The own nasal chord, extended only for the buried end under the
     * columella.
     */
    const base: (y: number) => number = (y: number): number =>
      sn[0] + ((n[0] - sn[0]) * (y - sn[1])) / (n[1] - sn[1]);
    // Poles: the profile row's lowest knot under the tip, the nasion over it.
    const low: number = knots[0]!;
    const high: number = 1;
    const bottom: number = height(low);
    const top: number = height(high);
    const theta: (y: number) => number = (y: number): number =>
      y === bottom
        ? 0
        : y === top
          ? Math.PI
          : Math.acos(1 - 2 * ((y - bottom) / (top - bottom)));
    const tipAngle: number = theta(plan.tip);
    const angles: number[] = [
      0,
      tipAngle / 2,
      tipAngle,
      (tipAngle + Math.PI) / 2,
      Math.PI,
    ];
    const forward: (y: number) => number = profile(
      plan,
      base,
      depth,
      bottom,
      top,
      theta,
      angles,
      face,
    );
    // Preserve the alar station of the neutral alar estimate.
    // The level family carries the continuous skin envelope over the lobular
    // and septal cartilages (Popko et al., PMID 33152748).
    const alarY: number = sn[1] + face.ala[2]! * span;
    // ESTIMATE: put the two lateral tangent guides on Yang et al.'s
    // 89.66-degree interalar angle (PMID 27547650, Table 1), with the
    // projected apex at pronasale and the person's supplied alare breadth.
    const halfAlarAngle: number = (89.66 * Math.PI) / 360;
    const alarX: number =
      plan.landmarks.pronasale[0] - plan.noseWidth / Math.tan(halfAlarAngle);
    const alarLow: number = alarY - face.ala[4]! * span;
    // The cheeks and alar envelope share the lower half of the ridge span.
    // The bridge midpoint is the end of the upper handover (ESTIMATE).
    const alarHigh: number = Math.max(
      alarY + face.ala[3]! * span,
      (plan.tip + top) / 2,
    );
    const alarWeight: (y: number) => number = (y: number): number =>
      y <= alarY
        ? step((y - alarLow) / (alarY - alarLow))
        : step((alarHigh - y) / (alarHigh - alarY));
    const sites: Map<number, string> = new Map(
      Array.from(
        { length: LAYERS + 1 },
        (_: unknown, i: number): [number, string] => [
          height(low + ((high - low) * i) / LAYERS),
          `nose.${i}`,
        ],
      ),
    );
    sites.set(bottom, "nose.columella");
    sites.set(top, "nose.nasion");
    sites.set(plan.tip, "nose.pronasale");
    sites.set(alarY, "nose.alare");
    for (const y of [sn[1], (plan.tip + sn[1]) / 2])
      if (y > bottom && y < top) sites.set(y, "nose.columellar-course");
    for (const y of [alarLow, alarHigh])
      if (y > bottom && y < top) sites.set(y, "nose.alar-fairing");
    sites.set(
      bottom + (top - bottom) * Math.sin(angles[1]! / 2) ** 2,
      "nose.lower-fairing",
    );
    sites.set(
      bottom + (top - bottom) * Math.sin(angles[3]! / 2) ** 2,
      "nose.upper-fairing",
    );
    const stations: number[] = [...sites.keys()].sort(
      (a: number, b: number): number => a - b,
    );
    const outline: (
      value: (y: number) => number,
    ) => IAutoMovieViewPart.IOutline = (
      value: (y: number) => number,
    ): IAutoMovieViewPart.IOutline => ({
      knots: stations.map(
        (station: number): IAutoMovieViewPart.IKnot => ({
          site: sites.get(station)!,
          station,
          value: station === bottom || station === top ? 0 : value(station),
        }),
      ),
    });
    const coordinate: (component: 0 | 1 | 2) => IAutoMovieViewPart.IOutline = (
      component: 0 | 1 | 2,
    ): IAutoMovieViewPart.IOutline => ({
      knots: stations.map(
        (station: number): IAutoMovieViewPart.IKnot => ({
          site: sites.get(station)!,
          station,
          value:
            component === 0
              ? base(station) - depth
              : component === 1
                ? station
                : 0,
        }),
      ),
      ...(component === 0
        ? { parameter: { type: "angle" as const, bottom, top } }
        : {}),
    });
    const half: (y: number) => number = (y: number): number => {
      if (y < alarY) {
        const u: number = (y - bottom) / (alarY - bottom);
        // Keep a regular elliptical pole at the buried root, then let the
        // two lateral surfaces widen toward alare. The buried depth supplies
        // the unmeasured starting radius scale (ESTIMATE).
        const share: number = Math.min(1, depth / plan.noseWidth);
        return (
          plan.noseWidth *
          (share * Math.sqrt(u * (2 - u)) + (1 - share) * step(u))
        );
      }
      const w: number = AutoMovieNaturalSpline.evaluate(
        dorsum,
        (y - plan.tip) / span,
      );
      return (w + (1 - w) * alarWeight(y)) * plan.noseWidth;
    };
    const midline: IAutoMovieViewPart.IOutline = outline((): number => 0);
    const lateral: IAutoMovieViewPart.IOutline = outline(
      (y: number): number => alarWeight(y) * (alarX - (base(y) - depth)),
    );
    const shoulder: IAutoMovieViewPart.IOutline = {
      knots: [
        {
          site: "nose.columella",
          station: bottom,
          value: AutoMovieViewSection.ELLIPSE,
        },
        {
          site: "nose.nasion",
          station: top,
          value: AutoMovieViewSection.ELLIPSE,
        },
      ],
    };
    // Gruber et al. Table 1 measured a 0.68 preoperative tip-to-base
    // breadth share. Yang et al. estimated c–prn as 0.33 tip breadths.
    // Transfer both as ESTIMATES for one anterior conic landmark, keeping
    // the person's alare and central tip unchanged.
    const tipBreadth: number = 0.68;
    const tipDepth: number = 0.33 * 2 * tipBreadth * plan.noseWidth;
    const u: number = 1 - tipDepth / (plan.landmarks.pronasale[0] - alarX);
    // Given a normalized point (u,v), the tangent triangle's barycentric
    // coordinates are (1−v, u+v−1, 1−u). Its rational quadratic has weight
    // b/(2√(ac)); its shoulder is the corresponding midpoint ratio.
    const conicWeight: number =
      (u + tipBreadth - 1) / (2 * Math.sqrt((1 - tipBreadth) * (1 - u)));
    const tipShoulder: number = conicWeight / (1 + conicWeight);
    const anterior: IAutoMovieViewPart.IOutline = {
      knots: stations.map((station): IAutoMovieViewPart.IKnot => {
        const blend: number =
          station <= plan.tip
            ? step((station - sn[1]) / (plan.tip - sn[1]))
            : step((alarHigh - station) / (alarHigh - plan.tip));
        return {
          site: sites.get(station)!,
          station,
          value:
            AutoMovieViewSection.ELLIPSE +
            blend * (tipShoulder - AutoMovieViewSection.ELLIPSE),
        };
      }),
    };
    return {
      name: "nose",
      axis: AutoMovieHumanHeadSourceAxis.of(
        { x: coordinate(0), y: coordinate(1), z: coordinate(2) },
        [1, 0, 0],
        [0, 0, 1],
      ),
      stations,
      front: {
        positive: outline((y: number): number => forward(y) - base(y) + depth),
        negative: outline((): number => -depth),
      },
      side: {
        positive: {
          ...outline(half),
          range: { minimum: 0, maximum: plan.noseWidth },
        },
        negative: {
          ...outline((y: number): number => -half(y)),
          range: { minimum: -plan.noseWidth, maximum: 0 },
        },
      },
      fullness: {
        kind: "top",
        shoulders: [anterior, shoulder, shoulder, anterior],
        touch: [midline, lateral, midline, lateral],
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
   * straight chord pronasale-subnasale. Both chords are a declared convention
   * (DEBT, `docs/work/prior-sourcing.md`), not published lines: Powell and
   * Humphreys (1984) was not read, and the columella tangent of Legan and
   * Burstone's nasolabial angle (1980, Table 1, Cm-Sn-Ls) passes the columella
   * point Cm and subnasale, not pronasale. Their endpoints are the published
   * inter-landmark distances (`IAutoMovieHumanNose` and the bridge prior
   * above), so the source carries those lengths exactly. A straight chord is
   * the least-assuming curve between two landmarks when no input describes a
   * hump or a concavity; it replaces the former natural cubic through (5 *
   * pronasale + root) / 6 fairing ordinates, a convention that bowed the dorsum
   * far ahead of this line.
   *
   * Tip: two quintic Hermite pieces connect pronasale to its chord on either
   * side. They share zero slope and the same sagittal curvature at the tip. The
   * lobular radius is an ESTIMATE from half the retained tip breadth. The
   * underside turns over the complete measured prn–sn chord to subnasale.
   *
   * Poles: each end is buried `depth` behind the face (the axis offset) by a
   * quintic smoothstep `t^3 (10 - 15 t + 6 t^2)` over the two-pole-angle span
   * from the existing fairing angle to the pole, so the burial is C2 there and
   * the pole stays regular in that angle. Each side is monotone, so no height
   * between the poles stands ahead of pronasale.
   */
  function profile(
    plan: IAutoMovieHumanHeadLayout,
    base: (y: number) => number,
    depth: number,
    bottom: number,
    top: number,
    theta: (y: number) => number,
    angles: readonly number[],
    face: IAutoMovieHumanHeadPrior.IFace,
  ): (y: number) => number {
    const prn: [number, number] = plan.landmarks.pronasale;
    const n: [number, number] = plan.landmarks.nasion;
    const sn: [number, number] = plan.landmarks.subnasale;
    const lobule: number = (face.tipBall[2]! * plan.noseWidth) / 2;
    const bridge: number = Math.hypot(n[0] - prn[0], n[1] - prn[1]);
    const upper: number = Math.min(1, lobule / bridge);
    const upperLength: number = (n[1] - prn[1]) * upper;
    const lowerLength: number = prn[1] - sn[1];
    const upperDrop: number = (prn[0] - n[0]) * upper;
    const lowerDrop: number = prn[0] - sn[0];
    const curvature: number = Math.max(
      0,
      Math.min(
        1 / lobule,
        (2 * upperDrop) / upperLength ** 2,
        (2 * lowerDrop) / lowerLength ** 2,
      ),
    );
    const upperRoot: number = base(top) - depth;
    const lowerRoot: number = base(bottom) - depth;

    /**
     * Chord ordinate through pronasale and an end landmark, at a height on that
     * side.
     */
    const chord: (end: [number, number], y: number) => number = (
      end: [number, number],
      y: number,
    ): number =>
      prn[0] + ((end[0] - prn[0]) * (y - prn[1])) / (end[1] - prn[1]);
    // Quintic matching the straight chord's value, slope and zero
    // curvature at t=1. The quadratic coefficient carries the common tip
    // curvature while both sides keep their own physical height and drop.
    const round = (distance: number, length: number, drop: number): number => {
      const t: number = distance / length;
      if (t >= 1) return t * drop;
      const a: number = (curvature * length ** 2) / 2;
      return (
        t ** 2 *
        (a +
          t * (6 * drop - 3 * a + t * (3 * a - 8 * drop + t * (3 * drop - a))))
      );
    };
    const lowerEnd: number = chord(sn, bottom);
    return (y: number): number => {
      const angle: number = theta(y);
      if (y >= prn[1]) {
        // The dorsal line reaches the nasion's skin point at the top pole,
        // which the burial carries back to the buried root behind it.
        const bury: number =
          (chord(n, top) - upperRoot) *
          step((angle - angles[3]!) / (Math.PI - angles[3]!));
        return prn[0] - round(y - prn[1], upperLength, upperDrop) - bury;
      }
      const bury: number =
        (lowerEnd - lowerRoot) * step((angles[1]! - angle) / angles[1]!);
      return prn[0] - round(prn[1] - y, lowerLength, lowerDrop) - bury;
    };
  }

  /** Quintic blending from the original contour to the alar guide and back. */
  function step(t: number): number {
    const u: number = Math.max(0, Math.min(1, t));
    return u * u * u * (10 - 15 * u + 6 * u * u);
  }
}
