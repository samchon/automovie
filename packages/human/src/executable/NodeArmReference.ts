import fs from "node:fs";
import type { IAutoMovieModel } from "@automovie/interface";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import type { AutoMovieHumanArmSegmentFrames } from "../generation/arm/AutoMovieHumanArmSegmentFrames";
import { HumanInspectionReferenceMesh } from "../inspection/HumanInspectionReferenceMesh";
import { HumanNodePaths } from "./HumanNodePaths";

type V3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * The reference's left arm for the arm experiment's diagnostic overlay, read
 * and registered into this arm's own chain for comparison only; nothing here
 * feeds generation.
 */
export namespace NodeArmReference {
  /** The registered points and the registration's own measurements. */
  export interface IRegistered {
    /** Reference vertices placed in the humerus frame of this arm. */
    points: V3[];

    /** Measurements of the registration, calibration mm. */
    measures: Record<string, number>;

    /** The global slice profile: per slice its point count, mean radius and centroid, calibration mm. */
    profile: { count: number; radius: number; centroid: V3 }[];

    /** The same registration applied to any reference point (native calibration mm in, humerus frame out): its slice decides the upper or lower turn. */
    place: (p: V3) => V3;

    /** The reference's own segment lines and its elbow and wrist slice centroids, native calibration mm: where its bone landmarks are searched. */
    axes: { upper: { point: V3; axis: V3 }; lower: { point: V3; axis: V3 }; elbow: V3; wrist: V3 } | null;
  }

  /** Reference triangles near the left arm, native calibration mm: every triangle whose three vertices stand above 700 mm and more than 100 mm to the left, so the arm's medial skin and the chest wall beside it are both kept and a section can tell them apart. */
  export interface IMesh {
    /** Kept vertices. */
    points: V3[];

    /** Triangles as indices into `points`. */
    triangles: [number, number, number][];
  }

  /** This arm's bone landmarks in world mm: GH, the elbow and wrist centres, and the epicondyles and styloids that give each segment's roll. */
  export interface ILandmarks {
    /** Glenohumeral centre (the trunk's shoulder port). */ gh: V3;
    /** The trunk's acromion landmark GH is measured from. */ acromion: V3;
    /** Elbow centre, the epicondyles' midpoint. */ elbow: V3;
    /** Wrist centre, the styloids' midpoint level. */ wrist: V3;
    /** Lateral less medial epicondyle. */ epicondyles: V3;
    /** Radial less ulnar styloid. */ styloids: V3;
  }

  /** The reference placed by its bone landmarks, world mm, with the landmark readings. */
  export interface IPlaced {
    /** Every given point placed. */ points: V3[];
    /** f1's forearm twist after placement: the signed angle about this forearm's axis from this arm's epicondyle line to f1's, carried by the forearm map (f1's pronation, the styloids aligned), radians; 0 when unplaced. */ twist: number;
    /** Landmark readings and segment lengths, world mm. */ measures: Record<string, number | number[]>;
  }

  /**
   * Places f1's reference by bone landmarks read on its own skin, by their
   * definitions (ISB, Wu et al. 2005), searched about the reference arm's own
   * segment lines and slice centroids (`register`'s `axes`; f1's reference
   * arm hangs in its own pose, so a search about this arm's joints misses it
   * by up to 78 mm): the epicondyles EL and EM as the most lateral and most
   * medial skin points of its elbow band (25 mm either side of its elbow
   * slice centroid along its upper-arm line, within 55 mm of that line, so the
   * waist beside it is not read); the styloids RS and US as the most radial
   * and most ulnar skin points of its wrist band (15 mm either side of its
   * wrist slice centroid along its forearm line, within 40 mm); the acromion
   * as the highest skin point within 30 mm of its upper-arm line extended over
   * the shoulder (the skin over the acromion, the shoulder's top over the
   * humeral head). Lateral and radial are this arm's directions. The elbow
   * centre is the epicondyles' midpoint and the wrist centre the styloids';
   * the reference's GH is its acromion carried by this arm's own
   * acromion-to-GH transfer (the trunk's de Leva and Campbell law, the same
   * person). Each segment is moved rigidly so its landmark frame lands on
   * this arm's: the upper arm GH onto GH by its GH-to-elbow-centre axis and
   * its epicondyle line (roll), the forearm onto this elbow centre by its
   * elbow-to-wrist axis and its styloid line, the hand with the forearm onto
   * this wrist centre. A point belongs to the segment its projection on the
   * reference's own landmark axes falls in. Nothing is fitted to soft-tissue
   * centroids: they only bound where each landmark is searched.
   */
  export function placeByLandmarks(points: readonly V3[], ours: ILandmarks, axes: NonNullable<IRegistered["axes"]>): IPlaced {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const band = (centre: V3, line: { point: V3; axis: V3 }, half: number, reach: number): V3[] =>
      points.filter((p: V3): boolean => {
        if (Math.abs(S.dot(sub(p, centre), line.axis)) > half) return false;
        const d: V3 = sub(p, line.point);
        return Math.hypot(...sub(d, scale(line.axis, S.dot(d, line.axis)))) <= reach;
      });
    const across = (dir: V3, axis: V3): V3 => S.unit(sub(dir, scale(axis, S.dot(dir, axis))));
    const extreme = (list: V3[], dir: V3, sign: number): V3 => list.reduce((a: V3, b: V3): V3 => (S.dot(b, dir) * sign > S.dot(a, dir) * sign ? b : a));
    const elbowBand: V3[] = band(axes.elbow, axes.upper, 25, 55);
    const wristBand: V3[] = band(axes.wrist, axes.lower, 15, 40);
    const shoulder: V3[] = points.filter((p: V3): boolean => {
      const d: V3 = sub(p, axes.upper.point);
      return Math.hypot(...sub(d, scale(axes.upper.axis, S.dot(d, axes.upper.axis)))) <= 30;
    });
    if (elbowBand.length === 0 || wristBand.length === 0 || shoulder.length === 0) return { points: [], twist: 0, measures: { elbowBand: elbowBand.length, wristBand: wristBand.length, shoulder: shoulder.length } };
    const lateral: V3 = across(ours.epicondyles, axes.upper.axis);
    const radial: V3 = across(ours.styloids, axes.lower.axis);
    const el: V3 = extreme(elbowBand, lateral, 1);
    const em: V3 = extreme(elbowBand, lateral, -1);
    const rs: V3 = extreme(wristBand, radial, 1);
    const us: V3 = extreme(wristBand, radial, -1);
    const acromion: V3 = extreme(shoulder, axes.upper.axis, 1);
    const gh: V3 = add(acromion, sub(ours.gh, ours.acromion));
    const ec: V3 = scale(add(el, em), 0.5);
    const wc: V3 = scale(add(rs, us), 0.5);
    const frame = (axis: V3, roll: V3): [V3, V3, V3] => {
      const a: V3 = S.unit(axis);
      const b: V3 = S.unit(sub(roll, scale(a, S.dot(roll, a))));
      return [a, b, S.cross(a, b)];
    };
    // A rigid map taking a reference frame onto ours: p -> to + sum_k (e_k . (p - from)) f_k.
    const map = (from: V3, to: V3, ref: [V3, V3, V3], own: [V3, V3, V3]): ((p: V3) => V3) => (p: V3): V3 => {
      const d: V3 = sub(p, from);
      return add(to, add(add(scale(own[0], S.dot(d, ref[0])), scale(own[1], S.dot(d, ref[1]))), scale(own[2], S.dot(d, ref[2]))));
    };
    const upper: (p: V3) => V3 = map(gh, ours.gh, frame(sub(ec, gh), sub(el, em)), frame(sub(ours.elbow, ours.gh), ours.epicondyles));
    const fore: (p: V3) => V3 = map(ec, ours.elbow, frame(sub(wc, ec), sub(rs, us)), frame(sub(ours.wrist, ours.elbow), ours.styloids));
    const hand: (p: V3) => V3 = map(wc, ours.wrist, frame(sub(wc, ec), sub(rs, us)), frame(sub(ours.wrist, ours.elbow), ours.styloids));
    const humerus: number = dist(gh, ec);
    const forearm: number = dist(ec, wc);
    const upperAxis: V3 = S.unit(sub(ec, gh));
    const foreAxis: V3 = S.unit(sub(wc, ec));
    const placed: V3[] = points.map((p: V3): V3 => {
      if (S.dot(sub(p, gh), upperAxis) < humerus) return upper(p);
      return S.dot(sub(p, ec), foreAxis) < forearm ? fore(p) : hand(p);
    });
    // f1's epicondyle line carried by the forearm map, against this arm's, about this forearm's axis.
    const axisOurs: V3 = S.unit(sub(ours.wrist, ours.elbow));
    const flat = (v: V3): V3 => S.unit(sub(v, scale(axisOurs, S.dot(v, axisOurs))));
    const theirs: V3 = flat(sub(fore(el), fore(em)));
    const mine: V3 = flat(ours.epicondyles);
    const twist: number = Math.atan2(S.dot(S.cross(mine, theirs), axisOurs), S.dot(mine, theirs));
    return {
      points: placed,
      twist,
      measures: {
        acromion: acromion,
        GH: gh,
        EL: el,
        EM: em,
        RS: rs,
        US: us,
        referenceAcromionFromOurs: sub(acromion, ours.acromion),
        referenceElbowCentreFromOurs: sub(ec, ours.elbow),
        referenceWristCentreFromOurs: sub(wc, ours.wrist),
        referenceGhToElbowCentre: humerus,
        oursGhToElbowCentre: dist(ours.gh, ours.elbow),
        referenceElbowToWristCentre: forearm,
        oursElbowToWristCentre: dist(ours.elbow, ours.wrist),
        referenceBiepicondylar: dist(el, em),
        referenceBistyloid: dist(rs, us),
        elbowBandPoints: elbowBand.length,
        wristBandPoints: wristBand.length,
      },
    };
  }

  /** The reference's triangles near the left arm, in the same axes as `load`. */
  export function mesh(scale: number): IMesh {
    const model: IAutoMovieModel = JSON.parse(fs.readFileSync(HumanNodePaths.resolve("test/.shots/f1/reference-model.json"), "utf8"));
    const points: V3[] = [];
    const triangles: [number, number, number][] = [];
    for (const part of HumanInspectionReferenceMesh(model).parts) {
      if (part.geometry.type !== "mesh" || part.geometry.mesh.indices === null) continue;
      const p: ArrayLike<number> = part.geometry.mesh.positions;
      const kept: Map<number, number> = new Map();
      for (let i: number = 0; i + 2 < p.length; i += 3) {
        const y: number = p[i + 1]! * 1000 * scale;
        const z: number = p[i + 2]! * 1000 * scale;
        if (z > 100 * scale && y > 700 * scale) {
          kept.set(i / 3, points.length);
          points.push([p[i]! * 1000 * scale, y, -z]);
        }
      }
      const ix: number[] = part.geometry.mesh.indices;
      for (let k: number = 0; k + 2 < ix.length; k += 3) {
        const a: number | undefined = kept.get(ix[k]!);
        const b: number | undefined = kept.get(ix[k + 1]!);
        const c: number | undefined = kept.get(ix[k + 2]!);
        if (a !== undefined && b !== undefined && c !== undefined) triangles.push([a, b, c]);
      }
    }
    return { points, triangles };
  }

  /**
   * The reference's left-arm vertices in calibration mm and the arm tool's
   * world axes. The native artifact is metres with +X forward, +Y up and +Z
   * anatomical left; ISB Z points to the subject's right, so Z is negated.
   * The arm is selected as vertices more than 210 mm lateral and above
   * 700 mm: a display selection, not a measurement.
   */
  export function load(scale: number): V3[] {
    const model: IAutoMovieModel = JSON.parse(fs.readFileSync(HumanNodePaths.resolve("test/.shots/f1/reference-model.json"), "utf8"));
    const out: V3[] = [];
    for (const part of HumanInspectionReferenceMesh(model).parts) {
      if (part.geometry.type !== "mesh") continue;
      const p: ArrayLike<number> = part.geometry.mesh.positions;
      for (let i: number = 0; i + 2 < p.length; i += 3) {
        const x: number = p[i]! * 1000 * scale;
        const y: number = p[i + 1]! * 1000 * scale;
        const z: number = p[i + 2]! * 1000 * scale;
        if (z > 210 * scale && y > 700 * scale) out.push([x, y, -z]);
      }
    }
    return out;
  }

  /**
   * Diagnostic registration by the reference region's own segment axes: slice
   * centroids along the points' principal axis give its axis polyline; the
   * elbow is the break that best fits two straight chords; the wrist is the
   * narrowest slice distal to it. Each reference segment is turned by the
   * minimal rotation taking its centroid axis onto this arm's segment axis,
   * anchored at the elbow centre. Roll about the long axis is unresolved.
   * The measures record the reference's own break-to-narrowest distance
   * against this arm's elbow-centre-to-stylion distance.
   */
  export function register(points: V3[], frames: AutoMovieHumanArmSegmentFrames.IOutput): IRegistered {
    if (points.length < 100) return { points: [], measures: {}, profile: [], place: (p: V3): V3 => p, axes: null };
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const mean: V3 = scale(points.reduce((a: V3, b: V3): V3 => add(a, b), [0, 0, 0]), 1 / points.length);
    let axis: V3 = S.unit(sub(points.reduce((a: V3, b: V3): V3 => (b[1] > a[1] ? b : a)), points.reduce((a: V3, b: V3): V3 => (b[1] < a[1] ? b : a))));
    for (let k: number = 0; k < 20; ++k) {
      let next: V3 = [0, 0, 0];
      for (const p of points) next = add(next, scale(sub(p, mean), S.dot(sub(p, mean), axis)));
      axis = S.unit(next);
    }
    if (axis[1] < 0) axis = scale(axis, -1);
    const ts: number[] = points.map((p: V3): number => -S.dot(sub(p, mean), axis));
    const lo: number = Math.min(...ts);
    const hi: number = Math.max(...ts);
    const n: number = 60;
    const bins: V3[][] = Array.from({ length: n }, (): V3[] => []);
    const index: number[] = points.map((_: V3, i: number): number => Math.min(n - 1, Math.floor(((ts[i]! - lo) / (hi - lo)) * n)));
    points.forEach((p: V3, i: number): void => {
      bins[index[i]!]!.push(p);
    });
    const c: V3[] = bins.map((b: V3[]): V3 => (b.length === 0 ? [NaN, NaN, NaN] : scale(b.reduce((a: V3, x: V3): V3 => add(a, x), [0, 0, 0]), 1 / b.length)));
    const radius: number[] = bins.map((b: V3[], k: number): number => (b.length === 0 ? Infinity : b.reduce((s: number, p: V3): number => s + dist(p, c[k]!), 0) / b.length));
    const counts: number[] = bins.map((b: V3[]): number => b.length).sort((a: number, b: number): number => a - b);
    const median: number = counts[Math.floor(n / 2)]!;

    // Wrist: the narrowest well-populated slice between 45 % and 85 % of the
    // run, which excludes the shoulder cut above and the fingertip slices
    // below (their few points read as narrow); elbow: the two-chord break
    // between the top and that wrist.
    let wrist: number = Math.floor(0.6 * n);
    for (let k: number = Math.floor(0.45 * n); k <= Math.floor(0.85 * n); ++k)
      if (bins[k]!.length >= median / 2 && radius[k]! < radius[wrist]!) wrist = k;
    const chord: (a: number, b: number) => number = (a: number, b: number): number => {
      let r: number = 0;
      const d: V3 = S.unit(sub(c[b]!, c[a]!));
      for (let i: number = a; i <= b; ++i) {
        if (bins[i]!.length === 0) continue;
        const w: V3 = sub(c[i]!, c[a]!);
        r += Math.hypot(...sub(w, scale(d, S.dot(w, d))));
      }
      return r;
    };
    let elbow: number = 3;
    let best: number = Infinity;
    for (let b: number = 3; b < wrist - 3; ++b) {
      if (bins[b]!.length === 0) continue;
      const r: number = chord(0, b) + chord(b, wrist);
      if (r < best) [best, elbow] = [r, b];
    }
    // The hand begins where the slice radius starts to rise past the wrist
    // (the wrist crease, near stylion); the narrowest slice itself lies a
    // little proximal of stylion.
    let handStart: number = wrist;
    while (handStart + 1 < n && radius[handStart + 1]! <= radius[wrist]! * 1.05) ++handStart;
    const wristPoint: V3 = c[wrist]!;
    // Each segment's axis is the least-squares line through its inner slice
    // centroids (the upper arm's middle 30-90 % below the top, the forearm's
    // middle 15-85 %), so the top slices, where the arm joins the shoulder
    // and the chest, and the joint slices do not tilt it; each line is
    // anchored where it passes the elbow slice's centroid.
    const upperLine: { point: V3; axis: V3 } = line(c, Math.round(0.3 * elbow), Math.round(0.9 * elbow));
    const lowerLine: { point: V3; axis: V3 } = line(c, Math.round(elbow + 0.15 * (wrist - elbow)), Math.round(wrist - 0.15 * (wrist - elbow)));
    const upperAxis: V3 = upperLine.axis;
    const lowerAxis: V3 = lowerLine.axis;
    const upperAnchor: V3 = add(upperLine.point, scale(upperAxis, S.dot(sub(c[elbow]!, upperLine.point), upperAxis)));
    const lowerAnchor: V3 = add(lowerLine.point, scale(lowerAxis, S.dot(sub(c[elbow]!, lowerLine.point), lowerAxis)));
    const elbowOurs: V3 = frames.points.elbow;
    const forearmUp: V3 = S.unit(sub(frames.points.elbow, frames.points.wrist));

    // Roll of the forearm and hand: the hand's breadth axis (middle principal
    // axis of the points past the wrist, normal to the forearm axis), signed
    // toward the thumb (the side holding more of the proximal half of the
    // hand: thenar and thumb), is turned onto this arm's lateral (radial)
    // direction, the anatomical position's supination.
    const hand: V3[] = points.filter((_: V3, i: number): boolean => index[i]! > handStart);
    const rolled: (v: V3) => V3 = rollOnto(hand, wristPoint, lowerAxis, forearmUp, [0, 0, -frames.medial]);
    const transform: (p: V3, slice: number) => V3 = (p: V3, slice: number): V3 =>
      slice <= elbow ? add(elbowOurs, turn(sub(p, upperAnchor), upperAxis, [0, 1, 0])) : add(elbowOurs, rolled(turn(sub(p, lowerAnchor), lowerAxis, forearmUp)));
    const placed: V3[] = points.map((p: V3, i: number): V3 => transform(p, index[i]!));
    const place: (p: V3) => V3 = (p: V3): V3 => transform(p, Math.max(0, Math.min(n - 1, Math.floor(((-S.dot(sub(p, mean), axis) - lo) / (hi - lo)) * n))));
    return {
      points: placed,
      measures: {
        sliceWidth: (hi - lo) / n,
        referenceBreakToNarrowest: dist(c[elbow]!, wristPoint),
        referenceBreakToHandStart: dist(c[elbow]!, c[handStart]!),
        armElbowCentreToStylion: frames.lengths.forearm - 1.5,
        referenceBreakToTop: S.dot(sub(c[0]!, c[elbow]!), upperAxis),
        armElbowCentreToAcromion: frames.lengths.humerus + frames.lengths.acromion,
        referenceBendAngle: Math.acos(Math.max(-1, Math.min(1, S.dot(upperAxis, lowerAxis)))),
        handPoints: hand.length,
        elbowSlice: elbow,
        wristSlice: wrist,
      },
      profile: bins.map((b: V3[], k: number): { count: number; radius: number; centroid: V3 } => ({ count: b.length, radius: radius[k]!, centroid: c[k]! })),
      place,
      axes: { upper: upperLine, lower: lowerLine, elbow: c[elbow]!, wrist: c[wrist]! },
    };
  }

  /** The least-squares line through the populated centroids `from..to`, its axis turned toward the lower index (up the arm). */
  function line(c: readonly V3[], from: number, to: number): { point: V3; axis: V3 } {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const used: V3[] = c.slice(Math.min(from, to), Math.max(from, to) + 1).filter((p: V3): boolean => p.every(Number.isFinite));
    const point: V3 = scale(used.reduce((a: V3, b: V3): V3 => add(a, b), [0, 0, 0]), 1 / used.length);
    let axis: V3 = S.unit(sub(used[0]!, used[used.length - 1]!));
    for (let k: number = 0; k < 30; ++k) {
      let next: V3 = [0, 0, 0];
      for (const p of used) next = add(next, scale(sub(p, point), S.dot(sub(p, point), axis)));
      axis = S.unit(next);
    }
    if (S.dot(axis, sub(used[0]!, used[used.length - 1]!)) < 0) axis = scale(axis, -1);
    return { point, axis };
  }

  /**
   * The rotation about this arm's forearm axis (through the elbow, direction
   * `-forearmUp`) that turns the reference hand's thumb-side breadth axis,
   * first carried by the minimal turn of `lowerAxis` onto `forearmUp`, onto
   * the lateral direction; identity when the hand is too small to read.
   */
  function rollOnto(hand: V3[], wrist: V3, lowerAxis: V3, forearmUp: V3, lateral: V3): (v: V3) => V3 {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    if (hand.length < 50) return (v: V3): V3 => v;
    const q: V3[] = hand.map((p: V3): V3 => turn(sub(p, wrist), lowerAxis, forearmUp));
    const along: V3 = scale(forearmUp, -1);
    const flat: V3[] = q.map((p: V3): V3 => sub(p, scale(along, S.dot(p, along))));
    const mean: V3 = scale(flat.reduce((a: V3, b: V3): V3 => add(a, b), [0, 0, 0]), 1 / flat.length);
    let e: V3 = S.unit(S.cross(along, [0.3, 0.1, 1]));
    for (let k: number = 0; k < 50; ++k) {
      let next: V3 = [0, 0, 0];
      for (const p of flat) next = add(next, scale(sub(p, mean), S.dot(sub(p, mean), e)));
      e = S.unit(sub(next, scale(along, S.dot(next, along))));
    }
    const reach: number[] = q.map((p: V3): number => S.dot(p, along));
    const mid: number = (Math.min(...reach) + Math.max(...reach)) / 2;
    const proximal: V3[] = flat.filter((_: V3, i: number): boolean => reach[i]! < mid);
    const side: number = proximal.reduce((s: number, p: V3): number => s + S.dot(sub(p, mean), e), 0);
    const thumb: V3 = scale(e, side >= 0 ? 1 : -1);
    const target: V3 = S.unit(sub(lateral, scale(along, S.dot(lateral, along))));
    const angle: number = Math.atan2(S.dot(S.cross(thumb, target), along), S.dot(thumb, target));
    return (v: V3): V3 => {
      const c: number = Math.cos(angle);
      const s: number = Math.sin(angle);
      return add(add(scale(v, c), scale(S.cross(along, v), s)), scale(along, S.dot(along, v) * (1 - c)));
    };
  }

  /** One reference section reading at a site plane, calibration mm. */
  export interface ISection {
    /** Site name. */
    site: string;

    /** Registered reference points within the slab. */
    count: number;

    /** Greatest reach from the site's axis point along lateral, medial, anterior and posterior. */
    extents: [number, number, number, number];

    /** Perimeter of the convex hull of the slab's points projected on the plane (a taut tape). */
    hull: number;
  }

  /**
   * The registered reference cut at each site plane (a 6 mm slab normal to
   * the segment axis through the site's axis point): its reach along the
   * plane's lateral and anterior directions and its taut-tape hull, for
   * comparison with the arm's own boxes and tapes (diagnostic only).
   */
  export function sections(points: readonly V3[], planes: readonly { site: string; origin: V3; distal: V3; lateral: V3; anterior: V3 }[]): ISection[] {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    return planes.map((plane: { site: string; origin: V3; distal: V3; lateral: V3; anterior: V3 }): ISection => {
      const slab: [number, number][] = [];
      for (const p of points) {
        const w: V3 = sub(p, plane.origin);
        if (Math.abs(S.dot(w, plane.distal)) <= 3) slab.push([S.dot(w, plane.lateral), S.dot(w, plane.anterior)]);
      }
      const reach: (f: (q: [number, number]) => number) => number = (f: (q: [number, number]) => number): number => (slab.length === 0 ? NaN : Math.max(...slab.map(f)));
      return {
        site: plane.site,
        count: slab.length,
        extents: [reach((q: [number, number]): number => q[0]), reach((q: [number, number]): number => -q[0]), reach((q: [number, number]): number => q[1]), reach((q: [number, number]): number => -q[1])],
        hull: hullPerimeter(slab),
      };
    });
  }

  /** Perimeter of the convex hull of planar points (Andrew's monotone chain). */
  function hullPerimeter(points: [number, number][]): number {
    if (points.length < 3) return NaN;
    const p: [number, number][] = [...points].sort((a: [number, number], b: [number, number]): number => a[0] - b[0] || a[1] - b[1]);
    const turn: (o: [number, number], a: [number, number], b: [number, number]) => number = (o: [number, number], a: [number, number], b: [number, number]): number =>
      (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const half: (list: [number, number][]) => [number, number][] = (list: [number, number][]): [number, number][] => {
      const out: [number, number][] = [];
      for (const q of list) {
        while (out.length >= 2 && turn(out[out.length - 2]!, out[out.length - 1]!, q) <= 0) out.pop();
        out.push(q);
      }
      out.pop();
      return out;
    };
    const hull: [number, number][] = [...half(p), ...half([...p].reverse())];
    let sum: number = 0;
    for (let k: number = 0; k < hull.length; ++k) sum += Math.hypot(hull[(k + 1) % hull.length]![0] - hull[k]![0], hull[(k + 1) % hull.length]![1] - hull[k]![1]);
    return sum;
  }

  /** Minimal rotation taking unit `from` to unit `to`, applied to `v` (Rodrigues). */
  function turn(v: V3, from: V3, to: V3): V3 {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const k: V3 = S.cross(from, to);
    const s: number = Math.hypot(...k);
    const cosA: number = S.dot(from, to);
    if (s < 1e-12) return cosA > 0 ? v : scale(v, -1);
    const u: V3 = scale(k, 1 / s);
    return add(add(scale(v, cosA), scale(S.cross(u, v), s)), scale(u, S.dot(u, v) * (1 - cosA)));
  }
}

function add(a: V3, b: V3): V3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function sub(a: V3, b: V3): V3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(a: V3, s: number): V3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function dist(a: V3, b: V3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
