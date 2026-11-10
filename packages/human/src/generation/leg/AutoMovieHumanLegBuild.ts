import { AutoMovieCurveMath64, AutoMovieSolidChain, AutoMovieViewAxis, type IAutoMovieLoftChain, type IAutoMovieSolidSurface, type IAutoMovieViewPart } from "@automovie/engine";

import type { IAutoMovieHumanParameters } from "../../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanLoftMesh } from "../../lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanBodyAnatomy } from "../AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "../AutoMovieHumanBodyLaw";
import type { AutoMovieHumanF1Body } from "../AutoMovieHumanF1Body";
import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanFootToes } from "../foot/AutoMovieHumanFootToes";
import { AutoMovieHumanFootToeTree } from "../foot/AutoMovieHumanFootToeTree";
import type { AutoMovieHumanF1Fork } from "../trunk/AutoMovieHumanF1Fork";
import { AutoMovieHumanTrunkGlutealContour } from "../trunk/AutoMovieHumanTrunkGlutealContour";
import { AutoMovieHumanTrunkJointDatums } from "../trunk/AutoMovieHumanTrunkJointDatums";
import { AutoMovieHumanTrunkPelvisSplit } from "../trunk/AutoMovieHumanTrunkPelvisSplit";
import type { AutoMovieHumanTrunkS00 } from "../trunk/AutoMovieHumanTrunkS00";
import { AutoMovieHumanLegF1World } from "./AutoMovieHumanLegF1World";
import { AutoMovieHumanLegF1Lines } from "./AutoMovieHumanLegF1Lines";
import { AutoMovieHumanLegF1Hip } from "./AutoMovieHumanLegF1Hip";
import { AutoMovieHumanLegF1Web } from "./AutoMovieHumanLegF1Web";
import { AutoMovieHumanLegHeelAnkle } from "./AutoMovieHumanLegHeelAnkle";
import { AutoMovieHumanLegLandmarks } from "./AutoMovieHumanLegLandmarks";
import { AutoMovieHumanLegSegmentFrames } from "./AutoMovieHumanLegSegmentFrames";
import { AutoMovieHumanLegViewCurves } from "./AutoMovieHumanLegViewCurves";
import { AutoMovieHumanLegViewLoft } from "./AutoMovieHumanLegViewLoft";
import { AutoMovieHumanLegViewSpecs } from "./AutoMovieHumanLegViewSpecs";

type V3 = [number, number, number];
type Spec = AutoMovieHumanArmCurveSpec.ICurveSpec;

/**
 * The leg's generation entry: one leg's public inputs resolved once (the
 * trunk's hip port included), one complete build at a pose (frames,
 * landmarks, view curves from the neutral frames with the heel-ankle tape
 * closed on its own plane, per-segment specs, the loft from the posed
 * frames, the toes and on request their folds), and the body's two legs on
 * the trunk's pants split, the split built once (or from a prebuilt S00).
 *
 * For each side the body publishes the leg's view part (outlines with their
 * jets, the foot included) and its chain, the crotch-level open end's
 * station, the gluteal-furrow rail station where the hip-root band meets the
 * leg, and the band's posterior crease window. The thigh's furrow box reads
 * the trunk's shared contours: f1_trunk's lateral line and gluteal contour
 * at the fold, and the split ring's thigh-root front.
 */
export namespace AutoMovieHumanLegBuild {
  /** Everything the leg reads from the person, calibration mm. */
  export interface IInputs {
    /** Frame inputs (neutral pose). */
    frames: AutoMovieHumanLegSegmentFrames.IInput;

    /** Landmark inputs. */
    landmarks: AutoMovieHumanLegLandmarks.IInputs;

    /** Tapes and breadths. */
    tapes: AutoMovieHumanLegViewCurves.ITapes;

    /** The trunk's hip port of this side, world: the femur root. */
    root: AutoMovieHumanArmCurveSpec.ITransform;

    /** Calibration mm per world mm. */
    scale: number;
  }

  /** One complete build at a pose, with its stage timings. */
  export interface IBuild {
    /** Frames at the pose. */
    frames: AutoMovieHumanLegSegmentFrames.IOutput;

    /** Landmarks at the pose. */
    landmarks: AutoMovieHumanLegLandmarks.IOutput;

    /** View curves (from the neutral frames), the heel-ankle tape closed on its own plane. */
    curves: AutoMovieHumanLegViewCurves.IOutput;

    /** Per-segment specs. */
    specs: Spec[];

    /** Loft at the pose. */
    loft: AutoMovieHumanLegViewLoft.IOutput;

    /** The toes' folds onto the foot through the body tree, when requested, or null. */
    toeTree: AutoMovieHumanFootToeTree.IOutput | null;

    /** The five toes, lofted at the pose under the same root. */
    toes: AutoMovieHumanFootToes.IToe[];

    /** The chain, or null. */
    chain: IAutoMovieLoftChain | null;

    /** The heel-ankle tape's closure: the tape, its loop on the neutral loft and the bisection shoulder that closes it, or null when no neutral loft exists. */
    heelAnkle: { tape: number; girth: number; shoulder: number; lofts: number } | null;

    /** Stage timings, ms. */
    ms: { frames: number; landmarks: number; curves: number; specs: number; loft: number; toes: number; toeTree: number; total: number };
  }

  /** One leg of the body on the trunk's pants split, world. */
  export interface ISide {
    /** Its inputs, the trunk's contours read into the thigh's furrow box. */
    inputs: IInputs;

    /** Its neutral build under the trunk's hip port. */
    build: IBuild;

    /** The leg's view part (outlines with their jets, the foot included), or null without a course. */
    part: IAutoMovieViewPart | null;

    /** The leg's chain, or null. */
    chain: IAutoMovieLoftChain | null;

    /** The crotch-level open end: the chain's station of the crotch level, its first layer. */
    port: number;

    /** The gluteal-furrow rail: the chain's station where the hip-root band meets the leg. */
    rail: number;

    /** The hip-root band's posterior crease window (band clock from the back midline, radians), or null without the trunk's contour. */
    crease: { apex: number; transition: number } | null;
  }

  /** The body's two legs on one pants split. */
  export interface IBody {
    /** The split and the S00 it was built from. */
    split: AutoMovieHumanTrunkPelvisSplit.IBuild;

    /** f1_trunk's gluteal contour, or null without the split. */
    contour: AutoMovieHumanTrunkGlutealContour.IOutput | null;

    /** Both legs. */
    sides: Record<"left" | "right", ISide>;

    /** Notes: the split's refusal. */
    diagnostics: string[];

    /** Milliseconds: the split and each leg. */
    ms: Record<string, number>;
  }

  /** The crease's fall to C2 on each side of its window, radians of band clock (declared with the crease). */
  export const CREASE_TRANSITION: number = Math.PI / 6;

  /** The heel-ankle loop's closure tolerance, mm, and the most neutral lofts the secant may take. */
  export const HEEL_ANKLE: { tolerance: number; lofts: number } = { tolerance: 0.3, lofts: 8 };

  /**
   * Realize the F1 leg's regular thigh, shank and instep between the measured
   * native-thigh and forefoot rails. This partial region deliberately exposes
   * both rims; only the final branch owner can produce the complete leg.
   */
  export function f1Regular(side: "left" | "right"): AutoMovieHumanLoftMesh.IContext {
    const { rows, refinements } = AutoMovieHumanLegF1Lines.fixed(side);
    const mesh: AutoMovieHumanLoftMesh.IContext = AutoMovieHumanLoftMesh.create();
    const frames: Map<number, AutoMovieHumanLegF1Lines.IFixedSection["frame"]> = new Map(rows.map(({ station, frame }) => [station, frame]));
    const axis: AutoMovieViewAxis.IAxis = { at: (station: number) => frames.get(station)! };
    const rings = rows.map(({ station, points }, index: number) => ({
      station, row: AutoMovieHumanLoftMesh.vertices(mesh, index + 1 === rows.length ? AutoMovieHumanLegF1World.forkClock(points, axis.at(station)) : points),
    }));
    for (let i: number = 1; i < rings.length; ++i) {
      const before = rings[i - 1]!;
      const after = rings[i]!;
      if (i + 1 === rings.length) {
        if (!AutoMovieHumanLegF1World.stitchForefoot(before, after, axis, mesh.positions, mesh.indices))
          AutoMovieHumanLegF1World.stitchSeam(before, after, axis, mesh.positions, mesh.indices);
      } else if (i === 1) AutoMovieHumanLegF1World.stitchSeam(before, after, axis, mesh.positions, mesh.indices);
      else if (refinements.includes(before.station) || refinements.includes(after.station)) {
        const upstream: V3 = axis.at(before.station).u as V3;
        const transported: AutoMovieViewAxis.IAxis = {
          at(station: number): ReturnType<AutoMovieViewAxis.IAxis["at"]> {
            const frame = axis.at(station);
            const normal: V3 = AutoMovieViewAxis.normal(frame) as V3;
            const u: V3 = AutoMovieHumanArmCurveSpec.unit(AutoMovieCurveMath64.sub(upstream, AutoMovieCurveMath64.scale(normal, AutoMovieHumanArmCurveSpec.dot(upstream, normal))));
            return { origin: frame.origin, u, v: AutoMovieHumanArmCurveSpec.cross(u, normal) };
          },
        };
        AutoMovieHumanLegF1World.stitchSeam(before, after, transported, mesh.positions, mesh.indices);
      } else AutoMovieHumanLegF1World.stitchRows(before.row, after.row, mesh.positions, mesh.indices);
    }
    return mesh;
  }

  /** Assemble one fixed-coordinate leg and its five measured digits. */
  export function f1(side: "left" | "right", fork: AutoMovieHumanF1Fork.IResult): AutoMovieHumanF1Body.IFixedPart {
    const mesh: AutoMovieHumanLoftMesh.IContext = f1Proximal(side, fork);
    const included: string[] = AutoMovieHumanLegF1Web.f1(mesh, side, AutoMovieHumanLegF1Lines.fixedFoot(side));
    return { mesh, included };
  }

  /** Attach the exact surveyed fork half using its measured tilted leg contours. */
  export function f1Proximal(side: "left" | "right", fork: AutoMovieHumanF1Fork.IResult): AutoMovieHumanLoftMesh.IContext {
    const mesh: AutoMovieHumanLoftMesh.IContext = f1Regular(side);
    AutoMovieHumanLegF1Hip.attach(mesh, side, fork);
    return mesh;
  }

  /** Resolve one leg's inputs from the public parameters, the trunk's hip port included. */
  export function inputs(parameters: Parameters<typeof AutoMovieHumanBodyLaw.limbInputs>[0], side: "left" | "right" = "left"): IInputs {
    const limbs: AutoMovieHumanBodyLaw.ILimbInputs = AutoMovieHumanBodyLaw.limbInputs(parameters);
    const measures: ReturnType<typeof AutoMovieHumanBodyAnatomy.resolve> = AutoMovieHumanBodyAnatomy.resolve(parameters);
    const k: number = limbs.legs.scale;
    const ports: AutoMovieHumanTrunkJointDatums.IOutput = AutoMovieHumanTrunkJointDatums.of(measures, limbs.feet[side].ankle, limbs.crotch);
    const root: AutoMovieHumanArmCurveSpec.ITransform = ports.hips[side].world;
    // f1's own joint centres in her stance (her epicondyles' and malleoli's midpoints, the frames her lines were re-based by: AutoMovieHumanLegF1World.LANDMARKS), mirrored across the midsagittal plane for the right leg and written in this leg's femur frame, so world, zero frames and the model agree exactly; the hip is S00's.
    const her: Readonly<Record<"hip" | "knee" | "im", readonly number[]>> = AutoMovieHumanLegF1World.LANDMARKS;
    const local: (p: readonly number[]) => V3 = (p: readonly number[]): V3 => AutoMovieHumanArmCurveSpec.apply(AutoMovieHumanArmCurveSpec.inverse(root), [p[0]!, p[1]!, side === "left" ? p[2]! : -p[2]!]);
    return {
      frames: { side, stature: limbs.stature, hip: root.origin[1], sex: limbs.legs.sex, ankleHeight: limbs.feet[side].ankle, kneeBreadth: measures.kneeBreadth * k, bimalleolarBreadth: measures.bimalleolarBreadth * k, pose: { knee: 0, ankle: 0 }, joints: { knee: local(her.knee), im: local(her.im) } },
      landmarks: { stature: limbs.stature, sex: limbs.legs.sex, crotch: limbs.crotch, furrow: measures.glutealFurrowHeight * k, footLength: limbs.feet[side].length, footBreadth: limbs.feet[side].breadth, ballLength: measures.ballOfFootLength * k, midpatella: measures.midpatellaHeight * k, calf: measures.calfHeight * k },
      tapes: {
        thigh: limbs.legs.thigh,
        lowerThigh: measures.lowerThighCircumference * k,
        knee: limbs.legs.knee,
        calf: limbs.legs.calf,
        ankle: measures.ankleCircumference * k,
        heelAnkle: measures.heelAnkleCircumference * k,
        ball: measures.ballOfFootCircumference * k,
        footBreadth: limbs.feet[side].breadth,
        bimalleolar: measures.bimalleolarBreadth * k,
        // The trunk world origin stands on the midsagittal plane under the hip-centre midpoint, so the port's Z is the hip centre's distance from it.
        midline: Math.abs(root.origin[2]),
        patella: { sex: limbs.legs.sex, scale: k },
      },
      root,
      scale: k,
    };
  }

  /** Build the leg at a pose: curves from the neutral frames, the loft from the posed frames under `root` (the femur frame itself by default). */
  export function build(inputs: IInputs, pose: { knee: number; ankle: number }, root: AutoMovieHumanArmCurveSpec.ITransform = AutoMovieHumanArmCurveSpec.IDENTITY, joins: boolean = false): IBuild {
    const t0: number = performance.now();
    const neutralFrames: AutoMovieHumanLegSegmentFrames.IOutput = AutoMovieHumanLegSegmentFrames.create(inputs.frames);
    const posedFrames: AutoMovieHumanLegSegmentFrames.IOutput = pose.knee === 0 && pose.ankle === 0 ? neutralFrames : AutoMovieHumanLegSegmentFrames.create({ ...inputs.frames, pose });
    const t1: number = performance.now();
    const neutralLandmarks: AutoMovieHumanLegLandmarks.IOutput = AutoMovieHumanLegLandmarks.create(neutralFrames, inputs.landmarks);
    const posedLandmarks: AutoMovieHumanLegLandmarks.IOutput = posedFrames === neutralFrames ? neutralLandmarks : AutoMovieHumanLegLandmarks.create(posedFrames, inputs.landmarks);
    const t2: number = performance.now();
    const closed: { curves: AutoMovieHumanLegViewCurves.IOutput; heelAnkle: IBuild["heelAnkle"] } = closeHeelAnkle(AutoMovieHumanLegViewCurves.create(neutralFrames, neutralLandmarks, inputs.tapes), neutralFrames, neutralLandmarks, inputs);
    const curves: AutoMovieHumanLegViewCurves.IOutput = closed.curves;
    const t3: number = performance.now();
    const specs: Spec[] = AutoMovieHumanLegViewSpecs.create(curves, neutralLandmarks);
    const t4: number = performance.now();
    const loft: AutoMovieHumanLegViewLoft.IOutput = AutoMovieHumanLegViewLoft.create({ curves, frames: posedFrames, landmarks: posedLandmarks, root, order: 32, samples: 64, gap: 6, sex: inputs.frames.sex, scale: inputs.scale });
    const t5: number = performance.now();
    const toes: AutoMovieHumanFootToes.IToe[] = AutoMovieHumanFootToes.create(posedFrames, posedLandmarks, { sex: inputs.frames.sex, footLength: inputs.landmarks.footLength, footBreadth: inputs.landmarks.footBreadth, ballLength: inputs.landmarks.ballLength }, root);
    const t6: number = performance.now();
    // The toes' folds onto the foot through the body tree (on request: the realization traces every web).
    const toeTree: AutoMovieHumanFootToeTree.IOutput | null = !joins || loft.part === null ? null : AutoMovieHumanFootToeTree.create(loft.part, toes);
    const t7: number = performance.now();
    return { frames: posedFrames, landmarks: posedLandmarks, curves, specs, loft, chain: loft.loft?.chain ?? null, toes, toeTree, heelAnkle: closed.heelAnkle, ms: { frames: t1 - t0, landmarks: t2 - t1, curves: t3 - t2, specs: t4 - t3, loft: t5 - t4, toes: t6 - t5, toeTree: t7 - t6, total: t7 - t0 } };
  }

  /**
   * Close ANSUR II's heel-ankle tape on its own diagonal plane
   * (`AutoMovieHumanLegHeelAnkle`) at neutral: the ankle bisection site's
   * fullness is the unknown, the loop's taut girth on a neutral loft its
   * reading, solved by the secant from the shoulder the bisection plane gave
   * (the loop grows with the fullness).
   */
  export function closeHeelAnkle(curves: AutoMovieHumanLegViewCurves.IOutput, frames: AutoMovieHumanLegSegmentFrames.IOutput, landmarks: AutoMovieHumanLegLandmarks.IOutput, inputs: IInputs): { curves: AutoMovieHumanLegViewCurves.IOutput; heelAnkle: IBuild["heelAnkle"] } {
    const site: AutoMovieHumanLegViewCurves.ISite | undefined = curves.sites.find((s: AutoMovieHumanLegViewCurves.ISite): boolean => s.name === "ankle bisection");
    if (site === undefined) return { curves, heelAnkle: null };
    let lofts: number = 0;
    const girth: (shoulder: number) => number = (shoulder: number): number => {
      lofts += 1;
      const trial: AutoMovieHumanLegViewCurves.IOutput = AutoMovieHumanLegViewCurves.reshoulder(curves, site.name, shoulder);
      const loft: AutoMovieHumanLegViewLoft.IOutput = AutoMovieHumanLegViewLoft.create({ curves: trial, frames, landmarks, root: AutoMovieHumanArmCurveSpec.IDENTITY, order: 32, samples: 64, gap: 6, sex: inputs.frames.sex, scale: inputs.scale });
      const chain: IAutoMovieLoftChain | null = loft.loft?.chain ?? null;
      return chain === null ? NaN : AutoMovieHumanLegHeelAnkle.loop(chain, frames, landmarks, AutoMovieHumanArmCurveSpec.IDENTITY, loft.station(landmarks.course.im)).girth;
    };
    let [a, ga]: [number, number] = [site.shoulder, girth(site.shoulder)];
    if (!Number.isFinite(ga)) return { curves, heelAnkle: null };
    let [b, gb]: [number, number] = [a - 0.05, girth(a - 0.05)];
    while (Number.isFinite(gb) && Math.abs(gb - site.girth) > HEEL_ANKLE.tolerance && lofts < HEEL_ANKLE.lofts && Math.abs(gb - ga) > 1e-9) {
      const next: number = Math.min(0.95, Math.max(0.05, b + ((site.girth - gb) * (b - a)) / (gb - ga)));
      [a, ga] = [b, gb];
      [b, gb] = [next, girth(next)];
    }
    if (!Number.isFinite(gb)) return { curves, heelAnkle: { tape: site.girth, girth: ga, shoulder: a, lofts } };
    return { curves: AutoMovieHumanLegViewCurves.reshoulder(curves, site.name, b), heelAnkle: { tape: site.girth, girth: gb, shoulder: b, lofts } };
  }

  /**
   * The body's two legs on the trunk's pants split, neutral, world: the split
   * built once from the parameters, or from `s00` when the body has built it.
   */
  export function body(parameters: IAutoMovieHumanParameters, s00?: AutoMovieHumanTrunkS00.IOutput): IBody {
    const diagnostics: string[] = [];
    const ms: Record<string, number> = {};
    const t0: number = performance.now();
    const split: AutoMovieHumanTrunkPelvisSplit.IBuild = s00 === undefined ? AutoMovieHumanTrunkPelvisSplit.build(parameters) : fromS00(s00);
    ms.split = performance.now() - t0;
    if (split.split === null) diagnostics.push(`pants split unavailable: ${split.diagnostics.join(" | ")}`);
    const contour: AutoMovieHumanTrunkGlutealContour.IOutput | null = split.split === null ? null : AutoMovieHumanTrunkGlutealContour.of(split.s00.curves, AutoMovieHumanBodyAnatomy.resolve(parameters));
    const side: (name: "left" | "right") => ISide = (name: "left" | "right"): ISide => {
      const t: number = performance.now();
      const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
      const base: IInputs = inputs(parameters, name);
      const half: AutoMovieHumanTrunkPelvisSplit.IHalf | null = split.split === null ? null : name === "left" ? split.split.left : split.split.right;
      // The host loop, read live from S00's half loop (its arc; the polygon's closing edge is the medial seam's chord): its plane by Newell's normal (exact for a planar loop, the least-squares normal of a nearly planar one, whatever its tilt), a point of it (the arc samples' mean) and its reach (the samples' largest distance from that point), written in the femur frame. The thigh's first section lies in that plane (AutoMovieHumanLegLandmarks: the course leaves the port along its normal and turns into the femur axis at the bend).
      const arc: V3[] = half === null ? [] : Array.from({ length: 721 }, (_: unknown, k: number): V3 => half.curve(half.interval[0] + ((half.interval[1] - half.interval[0]) * k) / 720));
      const own: IInputs = ((): IInputs => {
        if (arc.length === 0) return base;
        const mean: V3 = arc.reduce((s: V3, p: V3): V3 => [s[0] + p[0] / arc.length, s[1] + p[1] / arc.length, s[2] + p[2] / arc.length], [0, 0, 0]);
        const newell: V3 = [0, 0, 0];
        arc.forEach((p: V3, k: number): void => {
          const q: V3 = arc[(k + 1) % arc.length]!;
          newell[0] += (p[1] - q[1]) * (p[2] + q[2]);
          newell[1] += (p[2] - q[2]) * (p[0] + q[0]);
          newell[2] += (p[0] - q[0]) * (p[1] + q[1]);
        });
        const reach: number = Math.max(...arc.map((p: V3): number => Math.hypot(p[0] - mean[0], p[1] - mean[1], p[2] - mean[2])));
        const toFemur: AutoMovieHumanArmCurveSpec.ITransform = S.inverse(base.root);
        return { ...base, landmarks: { ...base.landmarks, port: { point: S.apply(toFemur, mean), normal: S.rotate(toFemur, S.unit(newell)), reach } } };
      })();
      // The port centre and the course's first direction t (down the plane's normal) in world, and the port section's chart axes: u lateral (the course's `up`, [0, 0, -m] in the femur frame, made normal to t), the forward axis made normal to t and u (the chart's +-v). The ring's extents are read from that centre along them, in the loop's own plane.
      const neutral: AutoMovieHumanLegSegmentFrames.IOutput = AutoMovieHumanLegSegmentFrames.create(own.frames);
      const marks: AutoMovieHumanLegLandmarks.IOutput = AutoMovieHumanLegLandmarks.create(neutral, own.landmarks);
      const centre: V3 = S.apply(own.root, marks.points.port);
      const leave: V3 = S.rotate(own.root, S.unit([marks.bend.point[0] - marks.points.port[0], marks.bend.point[1] - marks.points.port[1], marks.bend.point[2] - marks.points.port[2]]));
      const normalTo: (a: V3, against: V3[]) => V3 = (a: V3, against: V3[]): V3 => S.unit(against.reduce((r: V3, b: V3): V3 => [r[0] - b[0] * S.dot(r, b), r[1] - b[1] * S.dot(r, b), r[2] - b[2] * S.dot(r, b)], a));
      const outward: V3 = normalTo(S.rotate(own.root, [0, 0, -neutral.medial]), [leave]);
      const inward: V3 = [-outward[0], -outward[1], -outward[2]];
      const forward: V3 = normalTo([own.root.axes[0][0], own.root.axes[0][1], own.root.axes[0][2]], [leave, outward]);
      const backward: V3 = [-forward[0], -forward[1], -forward[2]];
      const across: (direction: V3) => number = (direction: V3): number => (arc.length === 0 ? NaN : Math.max(...arc.map((p: V3): number => (p[0] - centre[0]) * direction[0] + (p[1] - centre[1]) * direction[1] + (p[2] - centre[2]) * direction[2])));
      // Interim lateral contour: the split ring's lateral extent from the port centre (f1_trunk's shared source).
      const lateral: number | undefined = half === null ? undefined : across(outward);
      // The trunk's contours at the fold (f1_trunk's gluteal contour): the lateral line's half breadth less the hip centre's distance from the midline, and the back contour behind the hip centre.
      const back: number | undefined = contour === null ? undefined : own.root.origin[0] - contour[name].at(contour.fold)[0];
      const lateralLine: number | undefined = contour === null ? lateral : contour.lateral(contour.fold) - Math.abs(own.root.origin[2]);
      // The thigh root's front from the split ring (its anterior extent before the femur axis at the crotch; interim for f1_trunk's front contour).
      const front: number | undefined = half === null ? undefined : across(forward);
      // The thigh starts from S00's half loop (AutoMovieHumanTrunkPelvisSplit): each outline's port value is the ring's extent from the port centre along the port chart's lateral, medial, anterior or posterior axis, and its slope the ring's station derivative there (the jet's u at the extreme phase; the envelope theorem drops the phase's own motion) times the station per mm of walk.
      // S00's station rises with world height and the walk leaves the port along t: the station per mm of walk is t's world vertical component (-1 on a horizontal loop).
      const stationPerWalk: number = leave[1];
      const extent: (direction: V3) => { value: number; slope: number } = (direction: V3): { value: number; slope: number } => {
        let best: number = half!.interval[0];
        let value: number = -Infinity;
        for (let k: number = 0; k <= 360; ++k) {
          const phase: number = half!.interval[0] + ((half!.interval[1] - half!.interval[0]) * k) / 360;
          const p: V3 = half!.curve(phase);
          const e: number = (p[0] - centre[0]) * direction[0] + (p[1] - centre[1]) * direction[1] + (p[2] - centre[2]) * direction[2];
          if (e > value) [value, best] = [e, phase];
        }
        const u: readonly number[] = half!.jet(best).u;
        return { value, slope: (u[0]! * direction[0] + u[1]! * direction[1] + u[2]! * direction[2]) * stationPerWalk };
      };
      const ring: { value: number; slope: number }[] | null = half === null ? null : [outward, inward, forward, backward].map(extent);
      // The port's quarter shoulders from the same ring, closed by the medial seam's chord between its midline ends: a conic quarter in its box [0, a] x [0, b] crosses the normalized diagonal x/a = y/b at the fraction f of the corner, and its shoulder is rho = 2 f - 1 (the chord's midpoint 0, the corner 1; an ellipse's f = 1/sqrt 2 gives sqrt 2 - 1, `AutoMovieHumanLegViewCurves.ELLIPSE`). Anatomical order: lateral-posterior, posterior-medial, medial-anterior, anterior-lateral; NaN where the ring never crosses that diagonal.
      const loop: [number, number][] = arc.map((p: V3): [number, number] => {
        const r: V3 = [p[0] - centre[0], p[1] - centre[1], p[2] - centre[2]];
        return [r[0] * outward[0] + r[1] * outward[1] + r[2] * outward[2], r[0] * backward[0] + r[1] * backward[1] + r[2] * backward[2]];
      });
      const closed: [number, number][] = loop.length === 0 ? [] : [...loop, loop[0]!];
      const shoulderOf: (sx: 1 | -1, sy: 1 | -1, a: number, b: number) => number = (sx: 1 | -1, sy: 1 | -1, a: number, b: number): number => {
        let f: number = NaN;
        for (let i: number = 0; i + 1 < closed.length; ++i) {
          const x0: number = (sx * closed[i]![0]) / a;
          const y0: number = (sy * closed[i]![1]) / b;
          const x1: number = (sx * closed[i + 1]![0]) / a;
          const y1: number = (sy * closed[i + 1]![1]) / b;
          const g0: number = x0 - y0;
          const g1: number = x1 - y1;
          if (g0 === g1 || g0 * g1 > 0) continue;
          const t: number = g0 / (g0 - g1);
          const x: number = x0 + (x1 - x0) * t;
          const y: number = y0 + (y1 - y0) * t;
          if (x > 0 && y > 0 && !(x <= f)) f = x;
        }
        return 2 * f - 1;
      };
      const port: { box: [number, number, number, number]; slopes: [number, number, number, number]; shoulders: [number, number, number, number] } | null =
        ring === null
          ? null
          : {
              box: [ring[0]!.value, ring[1]!.value, ring[2]!.value, ring[3]!.value],
              slopes: [ring[0]!.slope, ring[1]!.slope, ring[2]!.slope, ring[3]!.slope],
              shoulders: [shoulderOf(1, 1, ring[0]!.value, ring[3]!.value), shoulderOf(-1, 1, ring[1]!.value, ring[3]!.value), shoulderOf(-1, -1, ring[1]!.value, ring[2]!.value), shoulderOf(1, -1, ring[0]!.value, ring[2]!.value)],
            };
      const read: IInputs = lateralLine === undefined ? own : { ...own, tapes: { ...own.tapes, thighLateral: lateralLine, ...(back === undefined ? {} : { thighBack: back }), ...(front === undefined ? {} : { thighFront: front }), ...(port === null ? {} : { port }) } };
      const b: IBuild = build(read, { knee: 0, ankle: 0 }, read.root);
      ms[name] = performance.now() - t;
      // The crease runs from the back midline (band clock 0) to the buttock apex's clock; the trunk's phases may carry either sign, so the clock is taken in [0, 2 pi).
      const crease: { apex: number; transition: number } | null = contour === null ? null : { apex: clock(name === "left" ? contour.left.phase - Math.PI : Math.PI - contour.right.phase), transition: CREASE_TRANSITION };
      return { inputs: read, build: b, part: b.loft.part, chain: b.chain, port: b.loft.station(b.landmarks.course.port), rail: b.loft.station(AutoMovieHumanLegLandmarks.get(b.landmarks, "gluteal furrow").walk), crease };
    };
    return { split, contour, sides: { left: side("left"), right: side("right") }, diagnostics, ms };
  }

  /** The split from a prebuilt S00, refused as the split's own build refuses it. */
  function fromS00(s00: AutoMovieHumanTrunkS00.IOutput): AutoMovieHumanTrunkPelvisSplit.IBuild {
    const loft: string[] = (s00.loft.loft.diagnostics ?? []).map((d: { detail: string }): string => d.detail);
    if (s00.chain === null) return { split: null, s00, diagnostics: ["S00's loft published no chain", ...loft] };
    const field: IAutoMovieSolidSurface | null = AutoMovieSolidChain.surface(s00.chain);
    if (field === null) return { split: null, s00, diagnostics: ["S00's chain has no solid surface", ...loft] };
    return { split: AutoMovieHumanTrunkPelvisSplit.of(s00, field), s00, diagnostics: [] };
  }
}

/** A clock angle in [0, 2 pi). */
function clock(c: number): number {
  return ((c % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
}
