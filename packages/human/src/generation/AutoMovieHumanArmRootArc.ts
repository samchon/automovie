import type {
  IAutoMovieArcLengthJet,
  IAutoMovieHumanArmRootArc,
  IAutoMovieHumanDeltoidCap,
  IAutoMovieHumanTrunkAssembly,
  IAutoMovieHumanTrunkQuadrant,
  IAutoMovieHumanTrunkSection,
} from "@automovie/interface";

import { AutoMovieHumanArmRootOval } from "./AutoMovieHumanArmRootOval";
import { AutoMovieHumanTrunkGuides } from "./AutoMovieHumanTrunkGuides";
import { AutoMovieHumanTrunkQuadrant } from "./AutoMovieHumanTrunkQuadrant";

/**
 * The arm's arc of the shoulder ring: where the arm's horizontal ellipse
 * leaves the torso and returns to it, as two sectors between the anterior and
 * the posterior axillary guides through the lateral guide at the ellipse's
 * outer extreme.
 *
 * The guides are the axillary folds. At the vault they are the torso's own
 * anterior and posterior axillary guides, so the ring there is the torso's
 * outside the arc and the trunk's top ring, which crosses the armpit below,
 * agrees with it on every sector the arm leaves alone. As the arm merges with
 * the shoulder they move, by the `torso` weight (1 at the vault, 0 at the
 * glenohumeral centre's height), to where the ellipse crosses the torso's
 * quadrant: the anterior at `CROSS` of the ellipse's forward half size ahead
 * of its centre, the posterior as far behind it. Each guide keeps the torso's
 * own jet there, so the arc joins the torso's sectors G1 and the fold's
 * softness is the arc's own. The lateral guide is the ellipse's extreme:
 * tangent along the body, curvature `rz / rx^2`. Each sector is the quintic
 * Hermite of its guides whose end speed is the arc length of a quarter turn
 * over the chord, `pi / (2 sqrt 2)` times the chord (a quarter circle's arc
 * over its chord).
 */
export namespace AutoMovieHumanArmRootArc {
  /**
   * Where the ellipse's crossing with the torso stands, a share of its
   * forward half size from its centre. Conventional: the crossing lies
   * inside the ellipse's front-most and rear-most points, where its sides
   * leave the torso.
   */
  export const CROSS: number = 0.9;

  /** A quarter turn's arc over its chord: `pi / (2 sqrt 2)`. Derived. */
  export const QUARTER: number = Math.PI / (2 * Math.SQRT2);

  /**
   * The arc at a height.
   *
   * @param s The torso's section at the height.
   * @param oval The arm's ellipse there.
   * @param extreme The lateral extreme's place, mm: the outline's value.
   * @param torso The torso's weight, 1 at the vault and 0 where the arm has merged.
   * @returns The arc.
   */
  export function create(
    s: IAutoMovieHumanTrunkSection,
    oval: IAutoMovieHumanDeltoidCap.IOval,
    extreme: number,
    torso: number,
  ): IAutoMovieHumanArmRootArc {
    const own: number =
      s.posterior ?? AutoMovieHumanTrunkGuides.SHARE.posteriorAxillary;
    const anterior: number =
      torso * s.anterior +
      (1 - torso) * share(s, "front", oval.x + CROSS * oval.rx);
    const posterior: number =
      torso * own + (1 - torso) * share(s, "back", oval.x - CROSS * oval.rx);
    const A: IAutoMovieArcLengthJet = AutoMovieHumanTrunkGuides.jet(
      "anteriorAxillary",
      { ...s, anterior },
    );
    const P: IAutoMovieArcLengthJet = AutoMovieHumanTrunkGuides.jet(
      "posteriorAxillary",
      { ...s, posterior },
    );
    const L: IAutoMovieArcLengthJet = {
      point: [oval.x, extreme],
      tangent: [-1, 0],
      curvature: [0, -AutoMovieHumanArmRootOval.curvature(oval)],
    };
    const spanFront: number = AutoMovieHumanTrunkQuadrant.phase(
      AutoMovieHumanTrunkGuides.KNOT.midAxillary -
        AutoMovieHumanTrunkGuides.KNOT.anteriorAxillary,
    );
    const spanBack: number = AutoMovieHumanTrunkQuadrant.phase(
      AutoMovieHumanTrunkGuides.KNOT.posteriorAxillary -
        AutoMovieHumanTrunkGuides.KNOT.midAxillary,
    );
    const lengthFront: number = QUARTER * chord(A.point, L.point);
    const lengthBack: number = QUARTER * chord(L.point, P.point);

    return {
      anterior,
      posterior,
      torso,
      guides: [A, L, P],
      rates: [lengthFront / spanFront, lengthBack / spanBack],
      front: (
        speeds: readonly [number, number],
      ): IAutoMovieHumanTrunkAssembly.Sector =>
        sector(
          A,
          L,
          AutoMovieHumanTrunkGuides.KNOT.anteriorAxillary,
          AutoMovieHumanTrunkGuides.KNOT.midAxillary,
          speeds,
        ),
      back: (
        speeds: readonly [number, number],
      ): IAutoMovieHumanTrunkAssembly.Sector =>
        sector(
          L,
          P,
          AutoMovieHumanTrunkGuides.KNOT.midAxillary,
          AutoMovieHumanTrunkGuides.KNOT.posteriorAxillary,
          speeds,
        ),
    };
  }

  /*
   * The largest lateral share a crossing takes: the quadrant's slope runs to infinity at the widest point.
   */
  const LIMIT: number = 0.985;

  /*
   * The lateral share of a torso quadrant at a forward place: the share at
   * which the quadrant passes through it, kept clear of the widest point.
   * Parameter s: The section.
   * Parameter side: The quadrant.
   * Parameter x: Forward place, mm.
   * Returns: The lateral share.
   */
  function share(
    s: IAutoMovieHumanTrunkSection,
    side: IAutoMovieHumanTrunkQuadrant.Side,
    x: number,
  ): number {
    const xi: number = Math.min(
      1,
      Math.max(
        0,
        side === "front"
          ? (x - s.middle) / (s.front - s.middle)
          : (s.middle - x) / (s.middle - s.back),
      ),
    );
    const n: number = AutoMovieHumanTrunkQuadrant.square(s, side);

    return Math.min(LIMIT, (1 - xi ** n) ** (1 / n));
  }

  /*
   * Distance between two section points.
   * Parameter a: One point `[x, z]`.
   * Parameter b: The other.
   * Returns: The distance, mm.
   */
  function chord(a: readonly number[], b: readonly number[]): number {
    return Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!);
  }

  /*
   * One sector between two of the arc's guides.
   * Parameter a: The first guide's jet.
   * Parameter b: The second guide's jet.
   * Parameter k0: The first guide's knot.
   * Parameter k1: The second guide's knot.
   * Parameter speeds: The two guides' speeds, mm per radian.
   * Returns: The sector as a function of phase.
   */
  function sector(
    a: IAutoMovieArcLengthJet,
    b: IAutoMovieArcLengthJet,
    k0: number,
    k1: number,
    speeds: readonly [number, number],
  ): IAutoMovieHumanTrunkAssembly.Sector {
    return (t: number): [number[], number[], number[]] =>
      AutoMovieHumanTrunkQuadrant.sector(
        a,
        b,
        AutoMovieHumanTrunkQuadrant.phase(k0),
        AutoMovieHumanTrunkQuadrant.phase(k1),
        speeds,
        t,
        null,
      );
  }
}
