import { AutoMovieHumanPolarSection } from "../../lofting/AutoMovieHumanPolarSection";
import { AutoMovieHumanArmPrior } from "../AutoMovieHumanArmPrior";
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
const { across, cross, dot, hull, mean, scale, smooth, sub, unit, TWO_PI }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;
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
 * planes turn from the hand's axis onto the forearm's over `WRIST_TURN` and lie
 * level where the arm meets the trunk's level ring, whose difference from the
 * tube fades in over `REACH`.
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

  /** Height over which the shoulder ring's difference fades in, and the arm's sections turn level, world mm. */
  const REACH: number = 70;

  /** Length past the heel's join over which the sections turn from the hand's axis onto the forearm's, world mm. */
  const WRIST_TURN: number = 50;

  /**
   * Widest spacing of the arm's own layers along the walk, world mm: finer than
   * the 3.5 mm plane spacing of the MetaHuman reference asset's bone-normal arm
   * sections (f1, 151 stations over 526 mm), so the arm never carries fewer
   * sections than the reference.
   */
  const LAYER_STEP: number = 3;

  /** Phases averaged for the centre of the section at the wrist crease. */
  const CREASE_PHASES: number = 256;

  /** Phases of a tape's section across the forearm. */
  const GIRTH_PHASES: number = 256;

  /** Unit sections' hull perimeters by walk length, per placed arm, kept across the hand's solve rounds. */
  const HULLS: Map<string, Map<number, number>> = new Map();

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

    // The bones from the glenohumeral centre; a skeleton's elbow places them,
    // the bones' lengths and directions kept.
    const direction = (v: readonly number[]): Vec3 => unit([v[0]!, v[1]!, v[2]!]);
    const placed: AutoMovieHumanArmBones.IBones = AutoMovieHumanArmBones.place(centre, direction(prior.upper), direction(prior.lower), inputs.upper, inputs.lower);
    const shift: Vec3 = elbow === undefined ? [0, 0, 0] : sub(elbow, placed.elbow);
    const bones: AutoMovieHumanArmBones.IBones =
      elbow === undefined
        ? placed
        : AutoMovieHumanArmBones.place([centre[0] + shift[0], centre[1] + shift[1], centre[2] + shift[2]], placed.upper, placed.lower, inputs.upper, inputs.lower);

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
    const hullKey: string = JSON.stringify([centre, shift, inputs.upper, inputs.lower, inputs.elbow]);
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
    const cut = (point: Vec3, normal: Vec3, theta: number): Vec3 => {
      let lo: number = -ring.radius * 2;
      let hi: number = end;
      for (let i: number = 0; i < 40; i++) {
        const mid: number = (lo + hi) / 2;
        if (dot(sub(tube.surface(mid, theta), point), normal) > 0) lo = mid;
        else hi = mid;
      }
      return tube.surface((lo + hi) / 2, theta);
    };
    const wrist: Vec3 = axis.at(stylion);
    const top: number = ring.centre[1];
    const angle = (t: number): number => prior.phase + prior.sense * t;

    // The walk's distance at which it crosses a plane.
    const crossing = (point: Vec3, normal: Vec3): number => {
      let lo: number = 0;
      let hi: number = end;
      for (let i: number = 0; i < 40; i++) {
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
    const heel = (a: number, t: number): Vec3 =>
      AutoMovieHumanHandHeel.point({ form: shape, map, bone: (b: number, u: number): Vec3 => cut(map([b, 0, 0]), square, angle(u)) }, a, t);

    // Above the crease the planes leave the hand's axis and follow the walk.
    const join: number = -creaseAt;
    const joinWalk: number = crossing(map([creaseAt, 0, 0]), square);
    const topWalk: number = crossing([0, top, 0], [0, 1, 0]);
    const walkOf = (q: number): number => joinWalk - (q - join);
    const normal = (q: number): Vec3 => {
      if (q <= join) return square;
      const s: number = walkOf(q);
      const bone: Vec3 = scale(axis.heading(s), -1);
      const w: number = smooth((q - join) / (WRIST_TURN * inputs.scale));
      const body: Vec3 = unit([square[0] + w * (bone[0] - square[0]), square[1] + w * (bone[1] - square[1]), square[2] + w * (bone[2] - square[2])]);
      const level: number = 1 - smooth((s - topWalk) / (REACH * inputs.scale));
      return unit([body[0] * (1 - level), body[1] * (1 - level) + level, body[2] * (1 - level)]);
    };
    const anchor = (q: number): Vec3 => (q <= join ? map([-q, 0, 0]) : axis.at(walkOf(q)));
    const point = (q: number, t: number): Vec3 => {
      if (q <= join) return heel(-q, t);
      const c: Vec3 = axis.at(walkOf(q));
      const p: Vec3 = cut(c, normal(q), angle(t));
      const fade: number = smooth((c[1] - top + REACH * inputs.scale) / (REACH * inputs.scale));
      if (fade === 0) return p;

      // Near the level ring the section moves out onto the trunk's arc.
      const o: Vec3 = cut([0, top, 0], [0, 1, 0], angle(t));
      const d: number = Math.atan2(o[2] - ring.centre[2], o[0] - ring.centre[0]);
      const gap: number = AutoMovieHumanPolarSection.radius(ring.outline, [ring.centre[0], ring.centre[2]], d) - Math.hypot(o[0] - ring.centre[0], o[2] - ring.centre[2]);
      return [p[0] + fade * gap * Math.cos(d), p[1], p[2] + fade * gap * Math.sin(d)];
    };

    // Layers: the heel's own stations in the hand, then the arm's own from the
    // join up to the level ring in equal steps no wider than `LAYER_STEP`.
    const layers: number[] = prior.heel
      .filter((a: number): boolean => a > creaseAt)
      .map((a: number): number => -a)
      .sort((p: number, q: number): number => p - q);
    const qTop: number = join + (joinWalk - topWalk);
    const steps: number = Math.max(1, Math.ceil((qTop - join) / (LAYER_STEP * inputs.scale)));
    for (let i: number = 1; i <= steps; i++) layers.push(join + ((qTop - join) * i) / steps);

    const creaseRing: Vec3[] = Array.from({ length: CREASE_PHASES }, (_: unknown, i: number): Vec3 => heel(creaseAt, (TWO_PI * i) / CREASE_PHASES));

    // A section of the tube by a plane: its hull's perimeter, the tape.
    const girth = (at: Vec3, n: Vec3): number => {
      const u: Vec3 = across([1, 0, 0], n);
      const v: Vec3 = cross(n, u);
      return hull(
        Array.from({ length: GIRTH_PHASES }, (_: unknown, i: number): [number, number] => {
          const p: Vec3 = sub(cut(at, n, (TWO_PI * i) / GIRTH_PHASES), at);
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
