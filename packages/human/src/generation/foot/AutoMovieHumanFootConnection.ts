import {
  AutoMovieIllinois,
  type AutoMovieLoftFrame,
  type IAutoMovieViewPart,
  AutoMovieSolidVector as V,
} from "@automovie/engine";

import { AutoMovieHumanFootSource } from "./AutoMovieHumanFootSource";

/** A calibration-mm point or dimensionless direction. */
type Vec3 = V.Vec3;

/** Source value and two physical-station derivatives, never normalized knot jets. */
type Scalar = [number, number, number];

/** Actual optional frame capability obtained from the public source-axis contract. */
type FrameJet = NonNullable<
  ReturnType<NonNullable<IAutoMovieViewPart["axis"]["jet"]>>
>;

/**
 * Local contacts evaluated on the same generating source, through either its
 * complete capability or its explicitly retained regional authority. A regional
 * contact does not claim that the proximal parent has already completed.
 *
 * @evidence contracts/common.md#principled-implementation Native polar positions and total2 derivatives define a sagittal ankle cut or implicit fixed-across vertical chord on the actual parent.
 * @evidence contracts/common.md#clear-and-simple-design Retains the generating owner, original frame and qualified derivatives beside each transfer; a regional capability leaves full-parent completion explicit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No global roof, box containment, independent ellipse, mesh readback or fictitious derivative replaces local contact.
 * @evidence contracts/common.md#meaningful-documentation Gives calibration-mm/radian coordinates, residual boundary and absence semantics; these contacts do not certify a full child arc or world C2.
 * @evidence contracts/performance.md#efficient-algorithms Two bounded Illinois roots per toe contact and two direct phase readings per ankle cut avoid section or loft construction.
 * @evidence contracts/performance.md#reuse-equivalent-work Every contact retains its one prepared parent and station closures are reused across the root evaluations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The definition owns finite records and closures with no global cache or external handle.
 */
export namespace AutoMovieHumanFootConnection {
  /** Two actual parent crossings at the child's across place, in world mm. */
  export interface IChord {
    /** Same generating owner; a regional reader keeps full-parent demand explicit. */
    owner: AutoMovieHumanFootSource.ISource;
    /** Parent station and chart-across coordinate, calibration mm. */
    station: number;
    /** Across coordinate in the parent's signed chart. */
    across: number;
    /** Original oriented frame. */
    frame: AutoMovieLoftFrame.IFrame;
    /** Plantar and dorsal world heights. */
    bottom: number;
    /** Dorsal world height. */
    top: number;
    /** Local chord midpoint, not an independently measured joint. */
    centre: number;
    /** Distance between the actual two branches. */
    depth: number;
    /** Actual plantar value/first/second derivatives, or absent physical2. */
    lower: Scalar | null;
    /** Actual dorsal value/first/second derivatives, or absent physical2. */
    upper: Scalar | null;
    /** Missing derivatives remain named instead of becoming zero. */
    unavailable: string | null;
  }

  /** The real leg section and its sagittal contact points, not a global support box. */
  export interface IAnkle {
    /** Same leg family and its complete or explicitly bounded regional capability. */
    owner: AutoMovieHumanFootSource.ISource;
    /** Actual ankle source station. */
    station: number;
    /** Original oriented section frame. */
    frame: AutoMovieLoftFrame.IFrame;
    /** Available original frame derivatives; not a foot-roof derivative. */
    frameJet: FrameJet | null;
    /** Rear and front points of the actual sagittal cut. */
    points: [Vec3, Vec3];
    /** Corresponding original polar phases. */
    phases: [number, number];
  }

  /**
   * Cut a fixed vertical parent chart at the real across location; implicit differentiation retains its full native shape.
   *
   * @evidence contracts/common.md#principled-implementation Solves both monotone polar half branches and differentiates v(s,phi(s))=across+slope*s twice with the native total2 chain rule.
   * @evidence contracts/common.md#clear-and-simple-design One record exposes both world heights, midpoint, depth and separately available jets.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Requires residual at most1e-9 mm and available nondegenerate phase/frame derivatives; no clamp or ellipse approximation repairs failure.
   * @evidence contracts/common.md#meaningful-documentation States the fixed vertical chart premise, across path slope and absent physical2 behavior.
   * @evidence contracts/performance.md#efficient-algorithms Two roots have at most100 iterations each; each native phase evaluation is fixed-size.
   * @evidence contracts/performance.md#reuse-equivalent-work One station preparation supplies both roots and their analytic derivatives.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned chord retains only its generating owner and fixed-size contact data; regional demand does not retain a newly completed proximal parent.
   */
  export function chord(
    owner: AutoMovieHumanFootSource.ISource,
    station: number,
    across: number,
    slope: number = 0,
  ): IChord {
    const frame: AutoMovieLoftFrame.IFrame = (owner.axis ?? owner.part.axis).at(
      station,
    );
    if (
      frame.u[0] !== 0 ||
      frame.u[1] !== 1 ||
      frame.u[2] !== 0 ||
      frame.v[1] !== 0
    )
      throw new Error("Toe contact needs its actual fixed vertical foot chart");
    const source: AutoMovieHumanFootSource.IStation =
      AutoMovieHumanFootSource.at(owner, station);
    const frameJet: FrameJet | null =
      (owner.axis ?? owner.part.axis).jet?.(station) ?? null;
    const branches: { y: number; jet: Scalar | null }[] = [];
    for (const start of [-Math.PI / 2, Math.PI / 2]) {
      const residual: (phi: number) => number = (phi: number): number =>
        source.phase(phi).p[1] - across;
      const phi: number | null = AutoMovieIllinois.root(
        residual,
        start,
        start + Math.PI,
        1e-9,
        100,
      );
      if (
        phi === null ||
        !Number.isFinite(phi) ||
        Math.abs(residual(phi)) > 1e-9
      )
        throw new Error(
          `${owner.name ?? owner.part.name}: no residual-checked local chord at ${station}/${across}`,
        );
      const y: number = frame.origin[1] + source.phase(phi).p[0];
      let jet: Scalar | null = null;
      if (source.jet !== null && frameJet !== null) {
        const local: ReturnType<
          NonNullable<AutoMovieHumanFootSource.IStation["jet"]>
        > = source.jet(phi);
        if (local.t[1] !== 0) {
          const first: number = (slope - local.s[1]) / local.t[1];
          const second: number =
            (-local.ss[1] -
              2 * local.st[1] * first -
              local.tt[1] * first * first) /
            local.t[1];
          jet = [
            y,
            frameJet.first.origin[1] + local.s[0] + local.t[0] * first,
            frameJet.second.origin[1] +
              local.ss[0] +
              2 * local.st[0] * first +
              local.tt[0] * first * first +
              local.t[0] * second,
          ];
          if (!jet.every(Number.isFinite)) jet = null;
        }
      }
      branches.push({ y, jet });
    }
    branches.sort((a: { y: number }, b: { y: number }): number => a.y - b.y);
    const lower: { y: number; jet: Scalar | null } = branches[0]!;
    const upper: { y: number; jet: Scalar | null } = branches[1]!;
    return {
      owner,
      station,
      across,
      frame,
      bottom: lower.y,
      top: upper.y,
      centre: (lower.y + upper.y) / 2,
      depth: upper.y - lower.y,
      lower: lower.jet,
      upper: upper.jet,
      unavailable:
        lower.jet !== null && upper.jet !== null
          ? null
          : (source.unavailable ??
            "local chord or frame physical2 unavailable"),
    };
  }

  /**
   * Intersect the actual ankle section with the foot sagittal plane through its original centre.
   *
   * @evidence contracts/common.md#principled-implementation The original polar direction solves the plane equation dot(u,a)*cos(phi)+dot(v,a)*sin(phi)=0, and the native field supplies both complete-section points.
   * @evidence contracts/common.md#clear-and-simple-design Retains the same generating owner, station, frame, available frame jets and phases; a regional owner does not assert completed proximal geometry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not transfer independent ankle width, a global roof or a box reconstructed from four numbers.
   * @evidence contracts/common.md#meaningful-documentation Identifies this as a sagittal transfer, not identity of all foot and ankle boundary phases.
   * @evidence contracts/performance.md#efficient-algorithms One station preparation and two native readings use fixed work.
   * @evidence contracts/performance.md#reuse-equivalent-work Both points use the identical station field and original frame.
   * @evidence contracts/performance.md#bound-retention-and-release-resources A definition owns the fixed-size result and its borrowed generating capability; no full-parent solve is triggered by a regional contact.
   */
  export function ankle(
    owner: AutoMovieHumanFootSource.ISource,
    station: number,
    along: Vec3,
  ): IAnkle {
    const frame: AutoMovieLoftFrame.IFrame = (owner.axis ?? owner.part.axis).at(
      station,
    );
    const across: Vec3 = [along[2], 0, -along[0]];
    const a: number = V.dot(frame.u, across);
    const b: number = V.dot(frame.v, across);
    if (!(Math.hypot(a, b) > 0))
      throw new Error("Ankle and sagittal planes have no unique cut");
    const first: number = Math.atan2(-a, b);
    const source: AutoMovieHumanFootSource.IStation =
      AutoMovieHumanFootSource.at(owner, station);
    const cuts: { phase: number; point: Vec3 }[] = [first, first + Math.PI]
      .map((phase: number): { phase: number; point: Vec3 } => {
        const local: ReturnType<AutoMovieHumanFootSource.IStation["phase"]> =
          source.phase(phase);
        const point: Vec3 = V.add(
          frame.origin,
          V.add(V.scale(frame.u, local.p[0]), V.scale(frame.v, local.p[1])),
        );
        if (Math.abs(V.dot(V.sub(point, frame.origin), across)) > 1e-9)
          throw new Error("Ankle sagittal cut misses its actual plane");
        return { phase, point };
      })
      .sort((left: { point: Vec3 }, right: { point: Vec3 }): number =>
        V.dot(V.sub(left.point, right.point), along),
      );
    return {
      owner,
      station,
      frame,
      frameJet: (owner.axis ?? owner.part.axis).jet?.(station) ?? null,
      points: [cuts[0]!.point, cuts[1]!.point],
      phases: [cuts[0]!.phase, cuts[1]!.phase],
    };
  }
}
