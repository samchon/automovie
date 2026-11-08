import fs from "node:fs";
import path from "node:path";
import { AutoMovieLoftChain, AutoMovieSolidChain, AutoMovieViewSection, type IAutoMovieLoftChain, type IAutoMovieSolidSurface } from "@automovie/engine";

import { AutoMovieHumanBodyAnatomy } from "../generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanArmContact } from "../generation/arm/AutoMovieHumanArmContact";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanArmF1Lines } from "../generation/arm/AutoMovieHumanArmF1Lines";
import { AutoMovieHumanArmInputs } from "../generation/arm/AutoMovieHumanArmInputs";
import { AutoMovieHumanArmLandmarks } from "../generation/arm/AutoMovieHumanArmLandmarks";
import { AutoMovieHumanArmSegmentFrames } from "../generation/arm/AutoMovieHumanArmSegmentFrames";
import { AutoMovieHumanArmViewCurves } from "../generation/arm/AutoMovieHumanArmViewCurves";
import { AutoMovieHumanArmViewLoft } from "../generation/arm/AutoMovieHumanArmViewLoft";
import { AutoMovieHumanTrunkS00 } from "../generation/trunk/AutoMovieHumanTrunkS00";
import { HumanNodeInput } from "./HumanNodeInput";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeArmDeviation } from "./NodeArmDeviation";
import { NodeArmDraw } from "./NodeArmDraw";
import { NodeArmMeasureForearm } from "./NodeArmMeasureForearm";
import { NodeArmReference } from "./NodeArmReference";

type V3 = AutoMovieHumanArmCurveSpec.Vec3;
type V2 = [number, number];
type Shoulders = AutoMovieHumanArmF1Lines.IShoulders;
type Segment = "humerus" | "forearm" | "hand";
type Extents = [number, number, number, number];

/**
 * The owner's two-step method for f1's arm lines by reverse extraction
 * (`node:arm-world`).
 *
 * One frame curve carries f1's pose along the whole arm, parameter `s` in mm
 * from GH: the upper arm on GH to the elbow centre with the epicondyle line as
 * lateral, the forearm on the elbow centre to the wrist zero with its roll
 * turning linearly from the epicondyle line to the styloid line (her
 * pronation), the hand on her own hand axis (the wrist zero to her palm
 * section's centroid at mid palm, iterated) with the styloid line. Across the
 * elbow and the wrist the segment frames blend over the joint's mean radius on
 * either side, so the section planes turn from one segment's normal through
 * the bisecting plane at the joint centre to the next and never cross inside
 * the bend; each joint's flexion and deviation are in that turn. Bones from
 * f1's landmarks read on its skin (`NodeArmMeasureForearm`: epicondyles and
 * styloids by caliper; GH the trunk's shoulder port from the S00 acromion,
 * the shared world).
 *
 * Step 1, world lines: the reference is cut every `STEP` mm along the frame
 * curve from the rail to the distal palm; each section enclosing the axis
 * gives the four outline values and the four quarter shoulders there. A
 * sample is flagged as an artifact (the reference's hatching, holes and saw
 * teeth) when a value leaves its two neighbours' mean by more than
 * `TOLERANCE` (the jump rule of the engine's `AutoMovieMeshExtract.outline`); flagged samples are drawn
 * red and left out. The eight series in millimetres (a shoulder as its reach,
 * the shoulder times the quarter's half-diagonal) are reduced together to the
 * fewest knots whose natural cubic spline (the outlines' minimum bending
 * energy) holds every unflagged sample within `TOLERANCE` mm, the joints, the
 * ends and every outline extremum of prominence at least `TOLERANCE` pinned;
 * greedy insertion of the worst sample. The knots are the stations, each with
 * the sample's own reading. The rail at the axilla level takes the shape 15 mm
 * below it scaled to the shoulder port's perimeter (the host-owned
 * boundary); the knuckles and the knuckle arc, where f1's section is its
 * separate fingers, keep their drawn values.
 *
 * Step 2, re-base: each world control point re-expressed in the frame curve's
 * zero frame at its station (the station's `s` found again from the point
 * alone by solving for the plane through it, then the outline value along the
 * lateral or anterior direction) is the F1 lines' value; mapping it back
 * returns the world point (the equivalence, printed). The stations are written
 * as `f1lines.txt` for `AutoMovieHumanArmF1Lines`.
 *
 * Side by side: this arm built from the F1 lines in its neutral (straight,
 * supinated) pose is posed by the same frame curve, each point at its own
 * distance from GH with its lateral and anterior offsets, so flexion,
 * carrying, the graded pronation and the wrist angle are all f1's; both clays
 * are cut at the rail (above it is the trunk's) and at the distal palm, and
 * drawn by one camera per view (front, side, top, oblique).
 */
export namespace NodeArmWorld {
  /**
   * Half-width of the elbow's blend, mm: the elbow section's mean radius in f1
   * (lateral, medial, anterior, posterior 39.3, 42.1, 29.2, 35.0 mm; mean
   * 36.4), so the turn of 0.42 rad between the segment axes spreads over 72 mm
   * and the planes' meeting line stays 2 * 36 / 0.42 = 171 mm from the axis,
   * outside the 29 mm anterior skin on the inside of the bend.
   */
  const ELBOW_BEND: number = 36;

  /** Half-width of the wrist's blend, mm: the wrist section's mean radius in f1 (29.0, 23.7, 20.8, 22.0 mm; mean 23.9). */
  const WRIST_BEND: number = 24;

  /** Sampling step along the frame curve, mm. */
  const STEP: number = 2;

  /** Knot tolerance, mm (the owner's 0.5 mm). */
  const TOLERANCE: number = 0.5;

  /** Hand axis read at this fraction of our palm length past the wrist zero (mid palm, before the thumb web and the fingers part). */
  const HAND_AXIS_AT: number = 0.6;

  /** The extracted palm ends at this fraction of the knuckles' distance from the wrist zero (proximal of where the fingers part). */
  const PALM_END: number = 0.75;

  /** A frame of the curve: centre, unit distal axis, unit lateral and anterior directions. */
  interface IPlace {
    /** Centre on the axis. */ centre: V3;
    /** Unit distal axis, the section's normal. */ distal: V3;
    /** Unit lateral direction. */ lateral: V3;
    /** Unit anterior direction. */ anterior: V3;
  }

  /** The quarter shoulders' keys in the F1 lines' `q` order. */
  const KEYS: (keyof Shoulders)[] = ["lateralPosterior", "posteriorMedial", "medialAnterior", "anteriorLateral"];

  /** One section reading. */
  interface IReading {
    /** Extents lateral, medial, anterior, posterior, mm. */ extents: Extents;
    /** Quarter shoulders. */ shoulders: Shoulders;
    /** Artifact flags, empty when sound. */ flags: string[];
  }

  /** One sample of the frame curve. */
  interface ISample extends IReading {
    /** Along the frame curve from GH, mm. */ s: number;
    /** A joint or end that is always a knot. */ pinned: string | null;
  }

  /** One station. */
  interface ISite extends IReading {
    /** Segment. */ segment: Segment;
    /** Site name. */ site: string;
    /** The F1 lines' `along`. */ along: AutoMovieHumanArmF1Lines.IStation["along"];
    /** Along the frame curve from GH, mm. */ s: number;
    /** How it was read. */ source: string;
  }

  /** Extract, reduce, re-base, pose, draw. */
  export async function run(): Promise<void> {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const D: typeof NodeArmDraw = NodeArmDraw;
    const person: Awaited<ReturnType<typeof HumanNodeInput.of>> = await HumanNodeInput.of();
    const inputs: AutoMovieHumanArmInputs.IOutput = AutoMovieHumanArmInputs.of(person.parameters, "left");
    const scale: number = inputs.arms.scale;
    const mesh: NodeArmReference.IMesh = NodeArmReference.mesh(scale);
    const arm: V3[] = NodeArmReference.load(scale);
    const receipt: NodeArmMeasureForearm.IReceipt | string = NodeArmMeasureForearm.read(mesh, arm, inputs.arms.upper);
    if (typeof receipt === "string") throw new Error(`landmarks: ${receipt}`);
    const { EL, EM, RS, US, EC } = receipt.landmarks;
    const gh: V3 = inputs.root.origin as V3;

    // Our own frames and landmarks (neutral pose): the rail, the palm and the knuckles' distances.
    const ours: AutoMovieHumanArmSegmentFrames.IOutput = AutoMovieHumanArmSegmentFrames.create({ side: "left", arms: inputs.arms, pose: { elbow: 0, wrist: 0 } });
    const landmarks: AutoMovieHumanArmLandmarks.IOutput = AutoMovieHumanArmLandmarks.create(ours, inputs.arms);
    const curves: AutoMovieHumanArmViewCurves.IOutput = AutoMovieHumanArmViewCurves.create(ours, landmarks, inputs.tapes, inputs.calipers);
    const zero = (name: Segment): number => curves.segments.find((g: AutoMovieHumanArmViewCurves.ISegment): boolean => g.name === name)!.walk;
    const rail: number = AutoMovieHumanArmLandmarks.get(landmarks, "axilla level").walk - zero("humerus");
    const knuckles: number = AutoMovieHumanArmLandmarks.get(landmarks, "knuckles").walk - zero("hand");

    // f1's bones in its own pose.
    const across = (v: V3, axis: V3): V3 => S.unit(D.sub(v, D.scale(axis, S.dot(v, axis))));
    const upperAxis: V3 = S.unit(D.sub(EC, gh));
    const foreAxis: V3 = S.unit(D.sub(receipt.landmarks.WC, EC));
    const H: number = Math.hypot(...D.sub(EC, gh));
    const W: number = receipt.lengths.elbowToStylion + 1.5;
    const wristZero: V3 = D.add(EC, D.scale(foreAxis, W));
    const upperLateral: V3 = across(D.sub(EL, EM), upperAxis);
    const elbowLine: V3 = across(D.sub(EL, EM), foreAxis);
    const styloidLine: V3 = across(D.sub(RS, US), foreAxis);
    const twist: number = Math.atan2(S.dot(S.cross(styloidLine, elbowLine), foreAxis), S.dot(styloidLine, elbowLine));
    const turnAbout = (v: V3, axis: V3, angle: number): V3 => D.add(D.add(D.scale(v, Math.cos(angle)), D.scale(S.cross(axis, v), Math.sin(angle))), D.scale(axis, S.dot(axis, v) * (1 - Math.cos(angle))));
    // Her hand axis: the wrist zero to her palm section's centroid at mid palm, the plane normal to the current axis (iterated).
    let handAxis: V3 = foreAxis;
    for (let i: number = 0; i < 4; ++i) {
      const lateral: V3 = across(styloidLine, handAxis);
      const anterior: V3 = S.unit(S.cross(handAxis, lateral));
      const centre: V3 = D.add(wristZero, D.scale(handAxis, HAND_AXIS_AT * ours.lengths.palm));
      const loop: V2[] | null = NodeArmDeviation.section(mesh, centre, handAxis, lateral, anterior);
      if (loop === null) break;
      const [cx, cy]: V2 = centroid(loop);
      handAxis = S.unit(D.sub(D.add(centre, D.add(D.scale(lateral, cx), D.scale(anterior, cy))), wristZero));
    }
    const handLateral: V3 = across(styloidLine, handAxis);
    const smooth = (x: number): number => {
      const t: number = Math.min(1, Math.max(0, x));
      return t * t * (3 - 2 * t);
    };
    // The frame curve: the three segment lines and frames blended across the elbow and the wrist (smoothstep), the forearm roll graded to the wrist.
    const place = (s: number): IPlace => {
      const w1: number = smooth((s - (H - ELBOW_BEND)) / (2 * ELBOW_BEND));
      const w2: number = smooth((s - (H + W - WRIST_BEND)) / (2 * WRIST_BEND));
      const mix = (a: V3, b: V3, c: V3): V3 => D.add(D.scale(a, 1 - w1), D.scale(D.add(D.scale(b, 1 - w2), D.scale(c, w2)), w1));
      const centre: V3 = mix(D.add(gh, D.scale(upperAxis, s)), D.add(EC, D.scale(foreAxis, s - H)), D.add(wristZero, D.scale(handAxis, s - H - W)));
      const distal: V3 = S.unit(mix(upperAxis, foreAxis, handAxis));
      const roll: V3 = turnAbout(styloidLine, foreAxis, twist * (1 - Math.min(1, Math.max(0, (s - H) / W))));
      const lateral: V3 = across(mix(upperLateral, roll, handLateral), distal);
      return { centre, distal, lateral, anterior: S.unit(S.cross(distal, lateral)) };
    };
    const dirs = (q: IPlace): V3[] => [q.lateral, D.scale(q.lateral, -1), q.anterior, D.scale(q.anterior, -1)];
    const segmentOf = (s: number): Segment => (s < H ? "humerus" : s < H + W ? "forearm" : "hand");

    // A section on the frame curve's plane at s.
    const read = (s: number): IReading | null => {
      const q: IPlace = place(s);
      const loop: V2[] | null = NodeArmDeviation.section(mesh, q.centre, q.distal, q.lateral, q.anterior);
      if (loop === null) return null;
      const xs: number[] = loop.map((p: V2): number => p[0]);
      const ys: number[] = loop.map((p: V2): number => p[1]);
      const extents: Extents = [Math.max(...xs), -Math.min(...xs), Math.max(...ys), -Math.min(...ys)];
      const quarter = (g1: V2, e1: number, g2: V2, e2: number): number => {
        const corner: V2 = [g1[0] * e1 + g2[0] * e2, g1[1] * e1 + g2[1] * e2];
        const mid: V2 = [corner[0] / 2, corner[1] / 2];
        const toward: V2 = [corner[0] - mid[0], corner[1] - mid[1]];
        const length: number = Math.hypot(...toward);
        const reach: number | null = farthest(loop.map((p: V2): V2 => [p[0] - mid[0], p[1] - mid[1]]), [toward[0] / length, toward[1] / length]);
        return reach === null ? NaN : reach / length;
      };
      const [l, m, a, p]: Extents = extents;
      const shoulders: Shoulders = {
        lateralPosterior: quarter([1, 0], l, [0, -1], p),
        posteriorMedial: quarter([0, -1], p, [-1, 0], m),
        medialAnterior: quarter([-1, 0], m, [0, 1], a),
        anteriorLateral: quarter([0, 1], a, [1, 0], l),
      };
      // A quarter whose reading ray misses the loop has its boundary on or inside the chord (flat or concave there): the nearest conic quarter is the chord, shoulder 0 (held by the F1 lines).
      for (const key of KEYS) if (Number.isNaN(shoulders[key])) shoulders[key] = 0;
      return { extents, shoulders, flags: [] };
    };

    // Step 1: dense samples from the rail to the distal palm, joints pinned.
    const port: number = inputs.tapes.axillary ?? NaN;
    const below: IReading | null = read(rail + 15);
    if (below === null) throw new Error("no section below the rail");
    const railScale: number = port / perimeter(below.extents, below.shoulders);
    const samples: ISample[] = [{ s: rail, pinned: "axilla level", extents: below.extents.map((e: number): number => e * railScale) as Extents, shoulders: below.shoulders, flags: below.flags }];
    const end: number = H + W + PALM_END * knuckles;
    const stations: { s: number; pinned: string | null }[] = [];
    for (let s: number = rail + 15; s <= end; s += STEP) stations.push({ s, pinned: null });
    stations.push({ s: H, pinned: "elbow" }, { s: H + W, pinned: "wrist" }, { s: end, pinned: "distal palm" });
    stations.sort((a: { s: number }, b: { s: number }): number => a.s - b.s);
    let missing: number = 0;
    for (const { s, pinned } of stations) {
      if (pinned === null && (Math.abs(s - H) < STEP / 2 || Math.abs(s - H - W) < STEP / 2 || Math.abs(s - end) < STEP / 2)) continue;
      const r: IReading | null = read(s);
      if (r === null) {
        ++missing;
        continue;
      }
      samples.push({ s, pinned, ...r });
    }

    // The eight series in millimetres: the four outline values and each quarter's reach (its shoulder times the quarter's half-diagonal).
    const quarterPairs: [number, number][] = [[0, 3], [3, 1], [1, 2], [2, 0]];
    const series: { name: string; values: number[] }[] = [
      ...["lateral", "medial", "anterior", "posterior"].map((name: string, j: number): { name: string; values: number[] } => ({ name, values: samples.map((x: ISample): number => x.extents[j]!) })),
      ...KEYS.map((key: keyof Shoulders, j: number): { name: string; values: number[] } => ({
        name: key,
        values: samples.map((x: ISample): number => (x.shoulders[key] * Math.hypot(x.extents[quarterPairs[j]![0]]!, x.extents[quarterPairs[j]![1]]!)) / 2),
      })),
    ];
    // Artifact flags (the jump rule of the engine's AutoMovieMeshExtract.outline): a value leaving its two neighbours' mean by more than the tolerance (a spike, a saw tooth, a hole's broken slice).
    for (let i: number = 1; i + 1 < samples.length; ++i)
      for (const g of series) {
        const jump: number = g.values[i]! - (g.values[i - 1]! + g.values[i + 1]!) / 2;
        if (Math.abs(jump) > TOLERANCE) samples[i]!.flags.push(`jump ${g.name} ${jump.toFixed(2)} mm`);
      }
    // Reduction: the fewest knots whose natural cubic spline (the outlines' minimum bending energy, as AutoMovieHumanFairOutline) holds every unflagged sample of all
    // eight series within the tolerance; the joints, the ends and every outline extremum of prominence at least the tolerance pinned, the worst sample inserted until
    // none is left. The former human-side reducer kept every inflection, and on her faceted sections nearly every sample is one (225 of 245 kept at 15:55);
    // the engine's AutoMovieMeshExtract.reduce now pins only prominent extrema and inflections.
    const kept: number[] = samples.flatMap((x: ISample, i: number): number[] => (x.pinned !== null || x.flags.length === 0 ? [i] : []));
    const knots: Set<number> = new Set<number>([kept[0]!, kept[kept.length - 1]!]);
    samples.forEach((x: ISample, i: number): void => {
      if (x.pinned !== null) knots.add(i);
    });
    const extrema: string[] = [];
    for (const g of series.slice(0, 4))
      for (const j of prominent(
        kept.map((i: number): number => g.values[i]!),
        TOLERANCE,
      )) {
        knots.add(kept[j]!);
        extrema.push(`${g.name} ${samples[kept[j]!]!.s.toFixed(1)}`);
      }
    let worst: number = Infinity;
    while (worst > TOLERANCE) {
      const k: number[] = [...knots].sort((a: number, b: number): number => a - b);
      worst = 0;
      let at: number = -1;
      for (const g of series) {
        const f: (x: number) => number = spline(
          k.map((i: number): number => samples[i]!.s),
          k.map((i: number): number => g.values[i]!),
        );
        for (const i of kept) {
          const e: number = Math.abs(f(samples[i]!.s) - g.values[i]!);
          if (e > worst) {
            worst = e;
            at = i;
          }
        }
      }
      if (worst > TOLERANCE) knots.add(at);
    }

    // Stations from the knots, with the drawn knuckles beyond.
    const sites: ISite[] = [...knots]
      .sort((a: number, b: number): number => a - b)
      .map((i: number): ISite => {
        const x: ISample = samples[i]!;
        const segment: Segment = x.pinned === "elbow" ? "humerus" : x.pinned === "wrist" ? "forearm" : segmentOf(x.s);
        const local: number = x.s - (segment === "humerus" ? 0 : segment === "forearm" ? H : H + W);
        const along: AutoMovieHumanArmF1Lines.IStation["along"] = x.pinned === "axilla level" ? "axilla level" : x.pinned === "elbow" ? "elbow" : x.pinned === "wrist" ? "wrist" : Number(local.toFixed(1));
        const name: string = x.pinned === "axilla level" ? "rail (axilla level)" : x.pinned === "elbow" ? "elbow (epicondyles, olecranon)" : x.pinned === "wrist" ? "wrist (styloids)" : `${segment} ${local.toFixed(1)}${x.pinned === null ? "" : ` (${x.pinned})`}`;
        const source: string =
          x.pinned === "axilla level" ? `f1 15 mm below, scaled ${railScale.toFixed(4)} to the port's ${port.toFixed(1)} mm` : Math.abs(x.s - H) < ELBOW_BEND || Math.abs(x.s - H - W) < WRIST_BEND ? "f1's section on a joint's blended plane" : "f1's section";
        return { segment, site: name, along, s: x.s, extents: x.extents, shoulders: x.shoulders, flags: x.flags, source };
      });
    for (const station of AutoMovieHumanArmF1Lines.HAND)
      if (station.along === "knuckles" || (typeof station.along === "number" && station.along > PALM_END * knuckles && station.site.endsWith("(drawn)")))
        sites.push({ segment: "hand", site: station.site, along: station.along, s: H + W + (station.along === "knuckles" ? knuckles : station.along), extents: station.extents, shoulders: station.shoulders, flags: [], source: "drawn (f1's section there is its fingers)" });

    // World control points, and step 2's equivalence: each point's station found again from the point alone, its value read, mapped back.
    const world: { site: ISite; points: V3[] }[] = sites.map((site: ISite): { site: ISite; points: V3[] } => {
      const q: IPlace = place(site.s);
      return { site, points: dirs(q).map((d: V3, k: number): V3 => D.add(q.centre, D.scale(d, site.extents[k]!))) };
    });
    const stationOf = (p: V3, s0: number): number => {
      const segment: Segment = segmentOf(s0);
      // The plane through p: solve dot(p - C(s), D(s)) = 0 by Newton from the segment's own axis projection.
      let s: number = segment === "humerus" ? S.dot(D.sub(p, gh), upperAxis) : segment === "forearm" ? H + S.dot(D.sub(p, EC), foreAxis) : H + W + S.dot(D.sub(p, wristZero), handAxis);
      const g = (x: number): number => {
        const q: IPlace = place(x);
        return S.dot(D.sub(p, q.centre), q.distal);
      };
      for (let i: number = 0; i < 60; ++i) {
        const step: number = g(s) / ((g(s - 1e-4) - g(s + 1e-4)) / 2e-4);
        s += step;
        if (Math.abs(step) < 1e-12) break;
      }
      return s;
    };
    let equivalence: number = 0;
    for (const w of world)
      w.points.forEach((p: V3, k: number): void => {
        const s: number = stationOf(p, w.site.s);
        const q: IPlace = place(s);
        const value: number = S.dot(D.sub(p, q.centre), dirs(q)[k]!);
        const back: V3 = D.add(q.centre, D.scale(dirs(q)[k]!, value));
        equivalence = Math.max(equivalence, Math.hypot(...D.sub(back, p)), Math.abs(s - w.site.s), Math.abs(value - w.site.extents[k]!));
      });

    // f1's elbow and wrist angles: flexion in the ISB humerus sagittal plane (GH, EL, EM), carrying out of it; the hand axis against the forearm's.
    const yh: V3 = D.scale(upperAxis, -1);
    let xh: V3 = S.unit(S.cross(D.sub(EL, gh), D.sub(EM, gh)));
    if (xh[0] < 0) xh = D.scale(xh, -1);
    xh = across(xh, yh);
    const local: V3 = [S.dot(foreAxis, xh), S.dot(foreAxis, yh), S.dot(foreAxis, S.cross(xh, yh))];
    const flexion: number = Math.atan2(local[0], -local[1]);
    const carrying: number = Math.asin(Math.max(-1, Math.min(1, local[2])));
    const fx: V3 = across(styloidLine, foreAxis);
    const fa: V3 = S.unit(S.cross(foreAxis, fx));
    const wristFlexion: number = Math.atan2(S.dot(handAxis, fa), S.dot(handAxis, foreAxis));
    const wristDeviation: number = Math.atan2(S.dot(handAxis, fx), S.dot(handAxis, foreAxis));

    // Our arm from the F1 lines in its neutral pose (humerus frame: GH at the origin, distal -Y, anterior +X, medial +Z on the left), posed by the frame curve.
    const loft: AutoMovieHumanArmViewLoft.IOutput = AutoMovieHumanArmViewLoft.create({ curves, frames: ours, landmarks, root: S.IDENTITY, order: 32, samples: 64, gap: 6 });
    const ourH: number = ours.lengths.humerus;
    const ourW: number = ours.lengths.forearm;
    // Our distance from GH onto f1's: each segment at its own proportion (the lengths are printed; equal lengths make this the identity).
    const sigma = (s: number): number => (s <= ourH ? (s * H) / ourH : s <= ourH + ourW ? H + ((s - ourH) * W) / ourW : H + W + (s - ourH - ourW));
    const posePoint = (v: V3): V3 => {
      const q: IPlace = place(sigma(-v[1]));
      return D.add(q.centre, D.add(D.scale(q.lateral, -ours.medial * v[2]), D.scale(q.anterior, v[0])));
    };
    const ourClay: [V3, V3, V3][] = clay(loft.loft?.chain ?? null)
      .filter((t: [V3, V3, V3]): boolean => {
        const s: number = -(t[0][1] + t[1][1] + t[2][1]) / 3;
        return s >= rail && s <= ourH + ourW + PALM_END * knuckles;
      })
      .map((t: [V3, V3, V3]): [V3, V3, V3] => [posePoint(t[0]), posePoint(t[1]), posePoint(t[2])]);
    // Hers: the triangles within 70 mm of the frame curve (deepest outline 58.8 mm) between the same two cuts.
    const course: V3[] = Array.from({ length: 81 }, (_: unknown, k: number): V3 => place(rail + ((end - rail) * k) / 80).centre);
    const referenceClay: [V3, V3, V3][] = mesh.triangles
      .map(([a, b, c]: [number, number, number]): [V3, V3, V3] => [mesh.points[a]!, mesh.points[b]!, mesh.points[c]!])
      .filter((t: [V3, V3, V3]): boolean => within(D.scale(D.add(D.add(t[0], t[1]), t[2]), 1 / 3), course, 70));

    // The host check: the least signed gap to the trunk's S00 skin (AutoMovieHumanArmContact.trunk, positive outside) per 10 mm band past the rail, ours posed and hers.
    const built: AutoMovieHumanTrunkS00.IOutput = AutoMovieHumanTrunkS00.of(person.parameters, AutoMovieHumanBodyAnatomy.resolve(person.parameters));
    const trunk: IAutoMovieSolidSurface | null = built.chain === null ? null : AutoMovieSolidChain.surface(built.chain);
    const gap: ((p: V3) => number | null) | null = trunk === null ? null : AutoMovieHumanArmContact.trunk(trunk, built.curves.axis.turn, scale);
    const sAt = (p: V3): number => {
      let best: number = 0;
      for (let k: number = 1; k < course.length; ++k) if (Math.hypot(...D.sub(p, course[k]!)) < Math.hypot(...D.sub(p, course[best]!))) best = k;
      return rail + ((end - rail) * best) / (course.length - 1);
    };
    const host: { from: number; ours: number; hers: number }[] = Array.from({ length: 15 }, (_: unknown, k: number): { from: number; ours: number; hers: number } => ({ from: rail + 10 * k, ours: Infinity, hers: Infinity }));
    if (gap !== null)
      for (const [who, triangles, every] of [["ours", ourClay, 6], ["hers", referenceClay, 1]] as ["ours" | "hers", [V3, V3, V3][], number][])
        triangles.forEach((t: [V3, V3, V3], i: number): void => {
          if (i % every !== 0) return;
          const band: number = Math.floor((sAt(t[0]) - rail) / 10);
          if (band < 0 || band >= host.length) return;
          const g: number | null = gap(t[0]);
          if (g !== null) host[band]![who] = Math.min(host[band]![who], g);
        });

    // Drawing.
    const out: string = HumanNodePaths.resolve(`packages/human/.shots/f1_arm/world-${new Date().toISOString().replace(/[:.]/g, "-")}`);
    fs.mkdirSync(out, { recursive: true });
    const near: V3[] = mesh.points.filter((p: V3): boolean => within(p, course, 90));
    const bounds: V3[] = [...world.flatMap((w: { points: V3[] }): V3[] => w.points), gh];
    const files: string[] = [];
    const colours: string[] = ["#008080", "#c00060", "#e07000", "#8040c0"];
    for (const [name, forward] of [["front", [-1, 0, 0]], ["side", [0, 0, 1]], ["top", [0, -1, 0]]] as [string, V3][]) {
      const v: NodeArmDraw.IView = D.open(forward, bounds);
      D.dots(v, near.filter((_: V3, i: number): boolean => i % 2 === 0), "#d0d0d0", 1.3);
      for (const segment of ["humerus", "forearm", "hand"] as const) {
        const own: { site: ISite; points: V3[] }[] = world.filter((w: { site: ISite }): boolean => w.site.segment === segment);
        for (let k: number = 0; k < 4; ++k) D.line(v, own.map((w: { points: V3[] }): V3 => w.points[k]!), colours[k]!, 2);
        for (const w of own) {
          D.line(v, ring(place(w.site.s), w.site), "#202020", 1);
          D.dots(v, w.points, "#000000", 3);
        }
      }
      // Flagged samples (artifacts left out of the reduction) in red.
      for (const x of samples)
        if (x.flags.length > 0) {
          const q: IPlace = place(x.s);
          D.dots(v, dirs(q).map((d: V3, k: number): V3 => D.add(q.centre, D.scale(d, x.extents[k]!))), "#ff0000", 4);
        }
      D.caption(v, [
        `step 1, world lines extracted in f1's own pose (${name}): ${sites.length} stations, every outline within ${TOLERANCE} mm (teal lateral, magenta medial, orange anterior, violet posterior; rings the stations)`,
        `over the reference; one frame curve from f1's bones (GH, epicondyles, styloids, hand axis; pronation ${deg(twist)} deg; joints blended over +-${ELBOW_BEND} and +-${WRIST_BEND} mm)`,
      ]);
      fs.writeFileSync(path.join(out, `world.${name}.png`), D.png(v));
      files.push(`world.${name}.png`);
    }
    // One camera per view for both clays: framed on the eight corners of the box around both.
    const low: V3 = [Infinity, Infinity, Infinity];
    const high: V3 = [-Infinity, -Infinity, -Infinity];
    for (const t of [...referenceClay, ...ourClay])
      for (const p of t)
        for (let k: number = 0; k < 3; ++k) {
          low[k] = Math.min(low[k]!, p[k]!);
          high[k] = Math.max(high[k]!, p[k]!);
        }
    const clayBounds: V3[] = Array.from({ length: 8 }, (_: unknown, k: number): V3 => [(k % 2 === 1 ? high : low)[0], (Math.floor(k / 2) % 2 === 1 ? high : low)[1], (k >= 4 ? high : low)[2]]);
    for (const [name, forward] of [["front", [-1, 0, 0]], ["side", [0, 0, 1]], ["top", [0, -1, 0]], ["oblique", [-0.62, -0.45, 0.64]]] as [string, V3][]) {
      for (const [who, triangles] of [["reference", referenceClay], ["ours", ourClay]] as [string, [V3, V3, V3][]][]) {
        const v: NodeArmDraw.IView = D.open(forward, clayBounds);
        D.clay(v, triangles);
        D.caption(v, [
          `${who} clay in f1's pose (${name}), one camera for both; cut at the rail (above it is the trunk's) and at the distal palm`,
          who === "ours"
            ? `our neutral arm from the F1 lines posed by f1's frame curve: elbow flexion ${deg(flexion)}, carrying ${deg(carrying)}, pronation ${deg(twist)} graded, wrist flexion ${deg(wristFlexion)}, deviation ${deg(wristDeviation)} deg`
            : "the reference's own surface along the arm",
        ]);
        fs.writeFileSync(path.join(out, `clay.${who}.${name}.png`), D.png(v));
        files.push(`clay.${who}.${name}.png`);
      }
    }

    // Step 2: the re-based values as the F1 lines' station literals.
    const literal = (g: ISite): string =>
      `    { site: ${JSON.stringify(g.site)}, along: ${typeof g.along === "number" ? g.along.toFixed(1) : JSON.stringify(g.along)}, extents: [${g.extents.map((e: number): string => e.toFixed(2)).join(", ")}], shoulders: q(${KEYS.map((key: keyof Shoulders): string => g.shoulders[key].toFixed(4)).join(", ")}) },`;
    const text: string = (["humerus", "forearm", "hand"] as const).map((segment: Segment): string => `// ${segment}\n${sites.filter((g: ISite): boolean => g.segment === segment).map(literal).join("\n")}`).join("\n");
    fs.writeFileSync(path.join(out, "f1lines.txt"), `${text}\n`);
    const held: string[] = sites.flatMap((g: ISite): string[] => KEYS.filter((key: keyof Shoulders): boolean => g.shoulders[key] < 0.15 || g.shoulders[key] > 0.9).map((key: keyof Shoulders): string => `${g.site} ${key} ${g.shoulders[key].toFixed(3)}`));
    const report: Record<string, unknown> = {
      landmarks: { gh, acromion: inputs.acromion, EL, EM, RS, US, EC, wristZero, handAxis },
      lengths: { ghToElbow: H, elbowToWristZero: W, oursHumerus: ourH, oursForearm: ourW, oursPalm: ours.lengths.palm, rail, knuckles, palmEnd: PALM_END * knuckles },
      twistDeg: (twist * 180) / Math.PI,
      flexionDeg: (flexion * 180) / Math.PI,
      carryingDeg: (carrying * 180) / Math.PI,
      wristFlexionDeg: (wristFlexion * 180) / Math.PI,
      wristDeviationDeg: (wristDeviation * 180) / Math.PI,
      samples: samples.length,
      missingSections: missing,
      stations: { humerus: sites.filter((g: ISite): boolean => g.segment === "humerus").length, forearm: sites.filter((g: ISite): boolean => g.segment === "forearm").length, hand: sites.filter((g: ISite): boolean => g.segment === "hand").length },
      reductionWorst: worst,
      extrema,
      flagged: samples.filter((x: ISample): boolean => x.flags.length > 0).map((x: ISample): string => `${x.s.toFixed(1)}${x.pinned === null ? "" : ` (${x.pinned}, kept)`}: ${x.flags.join("; ")}`),
      hostGap: gap === null ? "no S00 surface" : host.map((h: { from: number; ours: number; hers: number }): string => `${(h.from - rail).toFixed(0)}-${(h.from - rail + 10).toFixed(0)} mm past the rail: ours ${h.ours.toFixed(2)}, hers ${h.hers.toFixed(2)}`),
      shouldersOutsideHold: held,
      equivalenceMax: equivalence,
      clayTriangles: { reference: referenceClay.length, ours: ourClay.length },
      files: [...files, "f1lines.txt"],
    };
    fs.writeFileSync(path.join(out, "report.json"), JSON.stringify({ ...report, sites, samples }, null, 2));
    console.log(`node:arm-world ${out}`);
    console.log(JSON.stringify(report, null, 1));
  }

  /** Degrees to one decimal. */
  function deg(radians: number): string {
    return ((radians * 180) / Math.PI).toFixed(1);
  }

  /** Indices of the local extrema of `values` whose topographic prominence is at least `floor`. */
  function prominent(values: readonly number[], floor: number): number[] {
    const out: number[] = [];
    for (const sign of [1, -1]) {
      const v: number[] = values.map((x: number): number => sign * x);
      for (let i: number = 1; i + 1 < v.length; ++i) {
        if (!(v[i]! >= v[i - 1]! && v[i]! > v[i + 1]!)) continue;
        let left: number = v[i]!;
        for (let j: number = i - 1; j >= 0 && v[j]! <= v[i]!; --j) left = Math.min(left, v[j]!);
        let right: number = v[i]!;
        for (let j: number = i + 1; j < v.length && v[j]! <= v[i]!; ++j) right = Math.min(right, v[j]!);
        if (v[i]! - Math.max(left, right) >= floor) out.push(i);
      }
    }
    return out;
  }

  /** The natural cubic spline through (xs, ys), xs increasing (minimum bending energy through the knots). */
  function spline(xs: readonly number[], ys: readonly number[]): (x: number) => number {
    const n: number = xs.length;
    if (n < 3) return (x: number): number => ys[0]! + ((ys[n - 1]! - ys[0]!) * (x - xs[0]!)) / (xs[n - 1]! - xs[0]! || 1);
    const h: number[] = Array.from({ length: n - 1 }, (_: unknown, i: number): number => xs[i + 1]! - xs[i]!);
    // Second derivatives M with M0 = M(n-1) = 0: tridiagonal (Thomas).
    const a: number[] = new Array<number>(n).fill(0);
    const b: number[] = new Array<number>(n).fill(1);
    const c: number[] = new Array<number>(n).fill(0);
    const d: number[] = new Array<number>(n).fill(0);
    for (let i: number = 1; i + 1 < n; ++i) {
      a[i] = h[i - 1]!;
      b[i] = 2 * (h[i - 1]! + h[i]!);
      c[i] = h[i]!;
      d[i] = 6 * ((ys[i + 1]! - ys[i]!) / h[i]! - (ys[i]! - ys[i - 1]!) / h[i - 1]!);
    }
    for (let i: number = 1; i < n; ++i) {
      const m: number = a[i]! / b[i - 1]!;
      b[i] = b[i]! - m * c[i - 1]!;
      d[i] = d[i]! - m * d[i - 1]!;
    }
    const M: number[] = new Array<number>(n).fill(0);
    for (let i: number = n - 1; i >= 0; --i) M[i] = (d[i]! - c[i]! * (M[i + 1] ?? 0)) / b[i]!;
    return (x: number): number => {
      let i: number = 0;
      while (i + 2 < n && x > xs[i + 1]!) ++i;
      const t: number = x - xs[i]!;
      const u: number = xs[i + 1]! - x;
      const hi: number = h[i]!;
      return (M[i]! * u * u * u + M[i + 1]! * t * t * t) / (6 * hi) + (ys[i]! / hi - (M[i]! * hi) / 6) * u + (ys[i + 1]! / hi - (M[i + 1]! * hi) / 6) * t;
    };
  }

  /** The area centroid of a closed polygon. */
  function centroid(loop: readonly V2[]): V2 {
    let area: number = 0;
    let cx: number = 0;
    let cy: number = 0;
    for (let k: number = 0; k < loop.length; ++k) {
      const p: V2 = loop[k]!;
      const q: V2 = loop[(k + 1) % loop.length]!;
      const cross: number = p[0] * q[1] - q[0] * p[1];
      area += cross;
      cx += (p[0] + q[0]) * cross;
      cy += (p[1] + q[1]) * cross;
    }
    return [cx / (3 * area), cy / (3 * area)];
  }

  /** The site's section ring in world from its extents and quarter shoulders. */
  function ring(q: IPlace, site: ISite): V3[] {
    const [l, m, a, p]: Extents = site.extents;
    // Guide order lateral, posterior, medial, anterior (the left arm's chart), quarters between them.
    const section: AutoMovieViewSection.ISection = AutoMovieViewSection.of({ extents: [l, p, m, a] }, [site.shoulders.lateralPosterior, site.shoulders.posteriorMedial, site.shoulders.medialAnterior, site.shoulders.anteriorLateral]);
    const y: V3 = NodeArmDraw.scale(q.anterior, -1);
    return Array.from({ length: 73 }, (_: unknown, k: number): V3 => {
      const phi: number = (2 * Math.PI * k) / 72;
      const r: number = AutoMovieViewSection.radius(section, phi)[0];
      return NodeArmDraw.add(q.centre, NodeArmDraw.add(NodeArmDraw.scale(q.lateral, r * Math.cos(phi)), NodeArmDraw.scale(y, r * Math.sin(phi))));
    });
  }

  /** Perimeter of the conic section with these extents and quarter shoulders (720-gon). */
  function perimeter(extents: Extents, shoulders: Shoulders): number {
    const [l, m, a, p]: Extents = extents;
    const section: AutoMovieViewSection.ISection = AutoMovieViewSection.of({ extents: [l, p, m, a] }, [shoulders.lateralPosterior, shoulders.posteriorMedial, shoulders.medialAnterior, shoulders.anteriorLateral]);
    let total: number = 0;
    let previous: V2 | null = null;
    for (let k: number = 0; k <= 720; ++k) {
      const phi: number = (2 * Math.PI * k) / 720;
      const r: number = AutoMovieViewSection.radius(section, phi)[0];
      const q: V2 = [r * Math.cos(phi), r * Math.sin(phi)];
      if (previous !== null) total += Math.hypot(q[0] - previous[0], q[1] - previous[1]);
      previous = q;
    }
    return total;
  }

  /** Whether `p` projects inside the polyline `course` (not past either end) within `radius` of it. */
  function within(p: V3, course: readonly V3[], radius: number): boolean {
    for (let k: number = 0; k + 1 < course.length; ++k) {
      const a: V3 = course[k]!;
      const d: V3 = NodeArmDraw.sub(course[k + 1]!, a);
      const r: V3 = NodeArmDraw.sub(p, a);
      const t: number = (r[0] * d[0] + r[1] * d[1] + r[2] * d[2]) / (d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
      if (t < 0 || t > 1) continue;
      if (Math.hypot(...NodeArmDraw.sub(r, NodeArmDraw.scale(d, t))) < radius) return true;
    }
    return false;
  }

  /** The farthest crossing of the ray from the origin along unit `u` with the closed polygon, or null. */
  function farthest(loop: readonly V2[], u: V2): number | null {
    let far: number | null = null;
    for (let k: number = 0; k < loop.length; ++k) {
      const a: V2 = loop[k]!;
      const c: V2 = loop[(k + 1) % loop.length]!;
      const e: V2 = [c[0] - a[0], c[1] - a[1]];
      const den: number = u[0] * e[1] - u[1] * e[0];
      if (den === 0) continue;
      const t: number = (a[0] * e[1] - a[1] * e[0]) / den;
      const s: number = (a[0] * u[1] - a[1] * u[0]) / den;
      if (t > 0 && s >= 0 && s <= 1) far = Math.max(far ?? 0, t);
    }
    return far;
  }

  /** Clay triangles of a chain: rows every 1.5 mm of 72 phases, fanned to its poles. */
  function clay(chain: IAutoMovieLoftChain | null): [V3, V3, V3][] {
    if (chain === null) return [];
    const a: number = chain.layers[0]!.y;
    const z: number = chain.layers[chain.layers.length - 1]!.y;
    const n: number = Math.max(2, Math.ceil((z - a) / 1.5));
    const phases: number[] = Array.from({ length: 72 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 72);
    const rows: V3[][] = Array.from({ length: n + 1 }, (_: unknown, i: number): V3[] => AutoMovieLoftChain.ring(chain, a + ((z - a) * i) / n, phases) as V3[]);
    const out: [V3, V3, V3][] = [];
    for (let i: number = 0; i + 1 < rows.length; ++i)
      for (let k: number = 0; k < phases.length; ++k) {
        const k1: number = (k + 1) % phases.length;
        out.push([rows[i]![k]!, rows[i + 1]![k]!, rows[i + 1]![k1]!], [rows[i]![k]!, rows[i + 1]![k1]!, rows[i]![k1]!]);
      }
    return out;
  }
}

void NodeArmWorld.run().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
