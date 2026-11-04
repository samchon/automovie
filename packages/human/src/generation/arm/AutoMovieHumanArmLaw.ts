import { AutoMovieHumanArmPrior } from "../AutoMovieHumanArmPrior";
import { AutoMovieHumanLimbRootStrip } from "../AutoMovieHumanLimbRootStrip";
import { AutoMovieHumanHandHeel } from "../hand/AutoMovieHumanHandHeel";
import { AutoMovieHumanHandMap } from "../hand/AutoMovieHumanHandMap";
import { AutoMovieHumanHandVector } from "../hand/AutoMovieHumanHandVector";
import type { IAutoMovieHumanHandForm } from "../hand/IAutoMovieHumanHandForm";
import type { IAutoMovieHumanHandScales } from "../hand/IAutoMovieHumanHandScales";
import { AutoMovieHumanArmAxis } from "./AutoMovieHumanArmAxis";
import { AutoMovieHumanArmBones } from "./AutoMovieHumanArmBones";
import { AutoMovieHumanArmGirth } from "./AutoMovieHumanArmGirth";
import { AutoMovieHumanArmGuides } from "./AutoMovieHumanArmGuides";
import { AutoMovieHumanArmPieces } from "./AutoMovieHumanArmPieces";
import type { AutoMovieHumanArmScye } from "./AutoMovieHumanArmScye";
import { AutoMovieHumanArmTube } from "./AutoMovieHumanArmTube";
import type { IAutoMovieHumanArmLaw } from "./IAutoMovieHumanArmLaw";
import type { IAutoMovieHumanArmPiece } from "./IAutoMovieHumanArmPiece";

type Vec3 = AutoMovieHumanHandVector.Vec3;
const { across, cross, dot, hull, mean, norm, scale, smooth, smoother, sub, unit, TWO_PI }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;
const { handPoint }: typeof AutoMovieHumanHandMap = AutoMovieHumanHandMap;

/**
 * The arm's law of one side: its bones, walk and tube from the arm's pieces,
 * and the family of section planes the chain is cut by.
 *
 * The bones stand on the glenohumeral centre at their published definitions
 * (`AutoMovieHumanArmBones`), the walk on the bones turns at the elbow over a
 * length scaled by the elbow's radius (`AutoMovieHumanArmAxis`), and the tube
 * about the walk is the spans' guides, sectors and girth knots
 * (`AutoMovieHumanArmPieces`, `AutoMovieHumanArmGuides`, `AutoMovieHumanArmGirth`,
 * `AutoMovieHumanArmTube`), each girth input honoured at its site. The parameter
 * is the hand's station `-a` up to the wrist crease, where the hand's heel
 * piece takes over (`AutoMovieHumanHandHeel`), and past it the walk's distance
 * back toward the shoulder, so it rises from the hand to the shoulder; the
 * planes turn from the hand's axis onto the forearm's over `WRIST_TURN`. The
 * arm's own square sections end one scye radius down the walk from the trunk's
 * level ring, and the root strip (`AutoMovieHumanLimbRootStrip`) carries the
 * skin from there to the ring, its parameter running on as the strip's mean
 * chord.
 */
export namespace AutoMovieHumanArmLaw {
  /** The lengths and tapes the law reads, calibration mm. */
  export interface IInputs {
    /** Acromion-radiale length. */
    upper: number;

    /** Radiale-stylion length. */
    lower: number;

    /** Biceps tape. */
    bicep: number;

    /** Elbow tape. */
    elbow: number;

    /** Forearm tape. */
    forearm: number;

    /** Wrist tape. */
    wrist: number;

    /** Calibration millimetres per world millimetre. */
    scale: number;
  }

  /** Length of the walk past the wrist, world mm: beyond the heel's last cut. */
  const RUN_ON: number = 120;

  /** Length past the heel's join over which the sections turn from the hand's axis onto the forearm's, world mm. */
  const WRIST_TURN: number = 50;

  /**
   * Widest spacing of the arm's own layers along the walk, world mm: finer than
   * the 3.5 mm plane spacing of the MetaHuman reference asset's bone-normal arm
   * sections (f1, 151 stations over 526 mm), so the arm never carries fewer
   * sections than the reference.
   */
  const LAYER_STEP: number = 3;

  /**
   * Half the walk length over which the tube's jet is read at the arm's last
   * own section, world mm: half the widest layer spacing, so the root strip
   * arrives with the curvature the arm's own layers carry there.
   */
  const JET_READ: number = LAYER_STEP / 2;

  /** Phases averaged for the centre of the section at the wrist crease. */
  const CREASE_PHASES: number = 256;

  /** Phases of a tape's section across the forearm. */
  const GIRTH_PHASES: number = 256;

  /** Unit sections' hull perimeters by walk length, per placed arm, kept across the hand's solve rounds. */
  const HULLS: Map<string, Map<number, number>> = new Map();

  /** Distance off its plane at which a cut is settled, world mm: far under the 0.05 mm step the layers' slopes are read over. */
  const CUT_TOLERANCE: number = 1e-6;

  /** Most secant steps of a cut before it bisects its bracket instead. */
  const CUT_STEPS: number = 12;

  /** Length of a cut's first secant step along the walk, world mm. */
  const CUT_PROBE: number = 1;

  /** Halvings of a bracket: the walk's 600 mm to under a micrometre. */
  const BISECTIONS: number = 40;

  /**
   * The glenohumeral centre the bones stand on: the given centre, moved so the
   * elbow centre stands at a skeleton's elbow when one is given, the bones'
   * lengths and directions kept. Two calls that place the bones alike build
   * the same law.
   *
   * @param centre The glenohumeral centre.
   * @param inputs Lengths.
   * @param elbow The skeleton's elbow, if any.
   * @returns The placed centre.
   */
  export function centreOf(centre: Vec3, inputs: IInputs, elbow?: Vec3): Vec3 {
    if (elbow === undefined) return centre;
    const prior: AutoMovieHumanArmPrior.IArm = AutoMovieHumanArmPrior.PRIOR.arm;
    const placed: AutoMovieHumanArmBones.IBones = AutoMovieHumanArmBones.place(centre, direction(prior.upper), direction(prior.lower), inputs.upper, inputs.lower);
    const shift: Vec3 = sub(elbow, placed.elbow);

    return [centre[0] + shift[0], centre[1] + shift[1], centre[2] + shift[2]];
  }

  /**
   * A bind bone direction of the prior as a unit vector.
   *
   * @param v The direction's three numbers.
   * @returns The unit direction.
   */
  function direction(v: readonly number[]): Vec3 {
    return unit([v[0]!, v[1]!, v[2]!]);
  }

  /**
   * The law of one side, left frame.
   *
   * @param ring The arm's scye on the trunk.
   * @param inputs Lengths and tapes.
   * @param hand The hand's scales of this solve round.
   * @param shape The hand form.
   * @param centre The glenohumeral centre, where the bones start.
   * @param elbow The skeleton's elbow; the bones are moved so the elbow centre stands there. Absent, they stand on the centre.
   * @returns The law.
   */
  export function of(
    ring: AutoMovieHumanArmScye.IRing,
    inputs: IInputs,
    hand: IAutoMovieHumanHandScales,
    shape: IAutoMovieHumanHandForm,
    centre: Vec3,
    elbow?: Vec3,
  ): IAutoMovieHumanArmLaw {
    const prior: AutoMovieHumanArmPrior.IArm = AutoMovieHumanArmPrior.PRIOR.arm;
    if (!(inputs.upper > 0) || !(inputs.lower > 0) || !(inputs.bicep > 0) || !(inputs.elbow > 0) || !(inputs.forearm > 0) || !(inputs.wrist > 0))
      throw new Error("An arm needs positive lengths and tapes");

    // The bones from the placed glenohumeral centre, their lengths and directions kept.
    const at: Vec3 = centreOf(centre, inputs, elbow);
    const bones: AutoMovieHumanArmBones.IBones = AutoMovieHumanArmBones.place(at, direction(prior.upper), direction(prior.lower), inputs.upper, inputs.lower);

    // The walk on the bones and the tube of the spans about it.
    const soft: number = (prior.softness * inputs.elbow) / TWO_PI;
    const axis: AutoMovieHumanArmAxis.IAxis = AutoMovieHumanArmAxis.walk(bones, soft);
    const pieceInputs: IAutoMovieHumanArmPiece.IInputs = AutoMovieHumanArmPieces.inputs(bones, axis, {
      bicep: inputs.bicep,
      elbow: inputs.elbow,
      forearm: inputs.forearm,
      wrist: inputs.wrist * hand.wrist,
    });
    const pieces: IAutoMovieHumanArmPiece[] = AutoMovieHumanArmPieces.build(pieceInputs);
    const knots: [number, number][] = AutoMovieHumanArmGirth.knots(pieces);
    const hullKey: string = JSON.stringify([at, inputs.upper, inputs.lower, inputs.elbow]);
    let hulls: Map<number, number> | undefined = HULLS.get(hullKey);
    if (hulls === undefined) HULLS.set(hullKey, (hulls = new Map()));
    const tube: AutoMovieHumanArmTube.ITube = AutoMovieHumanArmTube.build(
      axis,
      AutoMovieHumanArmGuides.shape(pieces),
      [],
      (s: number): number => AutoMovieHumanArmGirth.at(knots, s),
      knots[0]![0],
      knots[knots.length - 1]![0],
      hulls,
    );
    const stylion: number = axis.fore(pieceInputs.stylion);
    const end: number = stylion + RUN_ON * inputs.scale;

    // A plane's cut: the tube passes through it along the walk at any phase.
    // Secant steps from a walk length on or near the plane, where the walk
    // itself crosses it, settle in a few reads of the tube; where they leave
    // the walk or do not settle, the bracket from the shoulder to the run-on
    // is bisected.
    const low: number = -ring.radius * 2;
    const tolerance: number = CUT_TOLERANCE * inputs.scale;

    // A section tilted up to level cuts the tube no further along the walk
    // from where the walk crosses its plane than the scye's diameter, so a
    // secant root beyond that is another crossing of a bent tube.
    const reach: number = 2 * ring.radius;
    const off = (s: number, point: Vec3, normal: Vec3, theta: number): number => dot(sub(tube.surface(s, theta), point), normal);
    const cut = (point: Vec3, normal: Vec3, theta: number, guess: number): Vec3 => {
      let s0: number = guess;
      let f0: number = off(s0, point, normal, theta);
      let s1: number = guess + CUT_PROBE * inputs.scale;
      let f1: number = off(s1, point, normal, theta);
      for (let i: number = 0; i < CUT_STEPS && Math.abs(f1) > tolerance && f1 !== f0; i++) {
        const s2: number = s1 - (f1 * (s1 - s0)) / (f1 - f0);
        s0 = s1;
        f0 = f1;
        s1 = s2;
        f1 = off(s1, point, normal, theta);
      }
      if (Math.abs(f1) <= tolerance && Math.abs(s1 - guess) <= reach && s1 >= low && s1 <= end) return tube.surface(s1, theta);

      let lo: number = low;
      let hi: number = end;
      for (let i: number = 0; i < BISECTIONS; i++) {
        const mid: number = (lo + hi) / 2;
        if (off(mid, point, normal, theta) > 0) lo = mid;
        else hi = mid;
      }
      return tube.surface((lo + hi) / 2, theta);
    };
    const wrist: Vec3 = axis.at(stylion);
    const angle = (t: number): number => prior.phase + prior.sense * t;

    // The walk's distance at which it crosses a plane.
    const crossing = (point: Vec3, normal: Vec3): number => {
      let lo: number = 0;
      let hi: number = end;
      for (let i: number = 0; i < BISECTIONS; i++) {
        const mid: number = (lo + hi) / 2;
        if (dot(sub(axis.at(mid), point), normal) > 0) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    };

    // The hand's map: the centre of the form's section at the crease stands on
    // the tube's wrist, so the heel grows out of the forearm about its own axis
    // whatever the hand's scales.
    const handPrior: AutoMovieHumanArmPrior.IHandPrior = AutoMovieHumanArmPrior.PRIOR.hand;
    const origin: Vec3 = sub(wrist, handPoint(shape.creaseCentre, hand, [0, 0, 0]));
    const square: Vec3 = [-handPrior.along[0], -handPrior.along[1], -handPrior.along[2]];
    const map = (q: readonly [number, number, number]): Vec3 => handPoint(q, hand, origin);
    const creaseAt: number = handPrior.crease;

    // A heel station's plane is crossed by the walk once, kept for every phase.
    const heelWalks: Map<number, number> = new Map();
    const heelWalk = (b: number): number => {
      let s: number | undefined = heelWalks.get(b);
      if (s === undefined) heelWalks.set(b, (s = crossing(map([b, 0, 0]), square)));
      return s;
    };
    const heel = (a: number, t: number): Vec3 =>
      AutoMovieHumanHandHeel.point({ form: shape, map, bone: (b: number, u: number): Vec3 => cut(map([b, 0, 0]), square, angle(u), heelWalk(b)) }, a, t);

    // Above the crease the planes leave the hand's axis and follow the walk.
    const join: number = -creaseAt;
    const joinWalk: number = crossing(map([creaseAt, 0, 0]), square);
    const walkOf: (q: number) => number = (q: number): number => joinWalk - (q - join);

    // The arm's own sections stop one scye radius down the walk from where it
    // crosses the ring's lowest point, square to the walk; from there the
    // root strip (`AutoMovieHumanLimbRootStrip`) joins them to the trunk's
    // ring, copying the trunk's jet down across the ring and the arm's own
    // jet at its last section, with no fade of either piece. The ring is not
    // level: its arm arc dips on the lateral side, and an own section placed
    // under the ring's mean height stood above that side, where the strip
    // folded back up into a lip.
    const lowest: number = Math.min(...ring.points.map((p: Vec3): number => p[1]));
    const ownWalk: number = crossing([0, lowest, 0], [0, 1, 0]) + ring.radius;
    const qOwn: number = join + (joinWalk - ownWalk);
    const phases: number[] = Array.from({ length: prior.order }, (_: unknown, m: number): number => (TWO_PI * m) / prior.order);
    const ends: AutoMovieHumanLimbRootStrip.IJet[] = phases.map(
      (t: number): AutoMovieHumanLimbRootStrip.IJet =>
        AutoMovieHumanLimbRootStrip.jet((s: number): Vec3 => tube.surface(s, angle(t)), ownWalk, JET_READ * inputs.scale),
    );
    const starts: AutoMovieHumanLimbRootStrip.IJet[] = ends.map(
      (e: AutoMovieHumanLimbRootStrip.IJet): AutoMovieHumanLimbRootStrip.IJet => AutoMovieHumanLimbRootStrip.under(ring.centre, ring.jets, e.point),
    );

    // The strip's parameter runs as its mean chord, so its layers are spaced
    // in millimetres like the tube's: w is 1 at the arm's own section, 0 at
    // the ring.
    const chord: number = mean(starts.map((c: AutoMovieHumanLimbRootStrip.IJet, m: number): Vec3 => [norm(sub(ends[m]!.point, c.point)), 0, 0]), 0);
    const strip: AutoMovieHumanLimbRootStrip.IStrip = AutoMovieHumanLimbRootStrip.strip({ start: starts, end: ends });

    // The strip's layer planes turn from the ring's level plane to the arm's
    // square plane by the quintic smoothstep, with no step in their slope or
    // curvature at either end.
    const level: Vec3 = [0, 1, 0];
    const squareOwn: Vec3 = scale(axis.heading(ownWalk), -1);
    const stripNormal: (w: number) => Vec3 = (w: number): Vec3 => {
      const x: number = smoother(w);
      return unit([level[0] + x * (squareOwn[0] - level[0]), level[1] + x * (squareOwn[1] - level[1]), level[2] + x * (squareOwn[2] - level[2])]);
    };
    const qTop: number = qOwn + chord;
    const wOf: (q: number) => number = (q: number): number => (qTop - q) / chord;
    const rings: Map<number, Vec3[]> = new Map<number, Vec3[]>();
    const stripRing: (q: number) => Vec3[] = (q: number): Vec3[] => {
      let found: Vec3[] | undefined = rings.get(q);
      if (found === undefined) rings.set(q, (found = strip.ring(wOf(q))));
      return found;
    };
    const normal: (q: number) => Vec3 = (q: number): Vec3 => {
      if (q <= join) return square;
      if (q > qOwn) return stripNormal(wOf(q));
      const s: number = walkOf(q);
      const bone: Vec3 = scale(axis.heading(s), -1);
      const w: number = smooth((q - join) / (WRIST_TURN * inputs.scale));
      return unit([square[0] + w * (bone[0] - square[0]), square[1] + w * (bone[1] - square[1]), square[2] + w * (bone[2] - square[2])]);
    };
    const anchor: (q: number) => Vec3 = (q: number): Vec3 => {
      if (q <= join) return map([-q, 0, 0]);
      if (q > qOwn) {
        const r: Vec3[] = stripRing(q);
        return [mean(r, 0), mean(r, 1), mean(r, 2)];
      }
      return axis.at(walkOf(q));
    };
    const point: (q: number, t: number) => Vec3 = (q: number, t: number): Vec3 => {
      if (q <= join) return heel(-q, t);
      if (q > qOwn) return stripRing(q)[((Math.round((t / TWO_PI) * prior.order) % prior.order) + prior.order) % prior.order]!;
      return cut(axis.at(walkOf(q)), normal(q), angle(t), walkOf(q));
    };

    // Layers: the heel's own stations in the hand, the arm's own from the join
    // up to its last square section, then the strip's up to the ring, each in
    // equal steps no wider than `LAYER_STEP`.
    const layers: number[] = prior.heel
      .filter((a: number): boolean => a > creaseAt)
      .map((a: number): number => -a)
      .sort((p: number, q: number): number => p - q);
    const steps: number = Math.max(1, Math.ceil((qOwn - join) / (LAYER_STEP * inputs.scale)));
    for (let i: number = 1; i <= steps; i++) layers.push(join + ((qOwn - join) * i) / steps);
    const rootSteps: number = Math.max(1, Math.ceil(chord / (LAYER_STEP * inputs.scale)));
    for (let i: number = 1; i <= rootSteps; i++) layers.push(qOwn + (chord * i) / rootSteps);

    const creaseRing: Vec3[] = Array.from({ length: CREASE_PHASES }, (_: unknown, i: number): Vec3 => heel(creaseAt, (TWO_PI * i) / CREASE_PHASES));

    // A section of the tube by a plane: its hull's perimeter, the tape.
    const girth = (at: Vec3, n: Vec3): number => {
      const u: Vec3 = across([1, 0, 0], n);
      const v: Vec3 = cross(n, u);
      const walk: number = crossing(at, n);
      return hull(
        Array.from({ length: GIRTH_PHASES }, (_: unknown, i: number): [number, number] => {
          const p: Vec3 = sub(cut(at, n, (TWO_PI * i) / GIRTH_PHASES, walk), at);
          return [dot(p, u), dot(p, v)];
        }),
      );
    };

    return {
      wrist: origin,
      elbow: bones.elbow,
      crease: [mean(creaseRing, 0), mean(creaseRing, 1), mean(creaseRing, 2)],
      layers,
      normal,
      anchor,
      point,
      girth,
    };
  }
}
