import { AutoMovieContourLoftCurves64, AutoMovieLoftChain, AutoMovieViewAxis, AutoMovieViewLoft, AutoMovieViewSection, type IAutoMovieLoftChain, type IAutoMovieViewPart } from "@automovie/engine";

import { AutoMovieHumanArmAxis } from "../arm/AutoMovieHumanArmAxis";
import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import type { AutoMovieHumanArmF1Lines } from "../arm/AutoMovieHumanArmF1Lines";
import type { AutoMovieHumanArmSegmentFrames } from "../arm/AutoMovieHumanArmSegmentFrames";
import { AutoMovieHumanArmViewCurves } from "../arm/AutoMovieHumanArmViewCurves";
import { AutoMovieHumanFairOutline } from "../arm/AutoMovieHumanFairOutline";
import { AutoMovieHumanHandPalm } from "./AutoMovieHumanHandPalm";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * The five digits of the arm experiment, each a few view curves in its own
 * frame lofted by the engine view loft (`AutoMovieViewLoft`): a front outline
 * pair (radial and ulnar half-breadths), a side outline pair (volar and
 * dorsal half-depths), its straight axis and the ellipse fullness, with a
 * closed fingertip pad and an open root, the pending palm port of its band.
 * Each digit is straight at the anatomical position along its bones
 * (`AutoMovieHumanArmSegmentFrames`: Buryanov and Kotiuk 2010 lengths).
 *
 * Joint boxes from Greiner 1991 (Hand Anthropometry of U.S. Army Personnel,
 * NATICK/TR-92/011, 1,304 women and 1,003 men, Tables of the PIP, DIP and
 * thumb IP joint breadths and circumferences; read from the DTIC text layer):
 * the breadth is the front extent, and the depth is the ellipse's other axis
 * that closes the joint circumference (Ramanujan 1914). Breadths and
 * circumferences scale by the person's hand breadth over Greiner's measured
 * hand breadth of the same sex (79.5 / 90.4 mm). Each joint is a knuckle
 * swelling (zero slope, a maximum), so the minimum bending energy dips each
 * phalanx shaft between joints into a waist without an invented depth.
 * Roots: fingers II-V start at their metacarpal head with radius one eighth of
 * the hand breadth (four bases fill the knuckle breadth under the frames'
 * quarter-breadth head spacing), leaving parallel to the axis (the port
 * condition); the thumb starts at its CMC, its root keeping the index's
 * root-to-PIP ratio (thenar breadth is an input gap), and its MCP height is
 * left to the minimum. The fingertip closes as a hemispherical pad of half
 * the index nail width (Boike et al. 2025, J Hand Surg Glob Online
 * 7(5):100792: women 11, men 13 mm): at distance `d` from the apex the radius
 * is `sqrt(2 rho d)`, so `dy/dq = -sqrt(2 rho)` in the root parameter
 * `q = -sqrt(L - s)`.
 */
export namespace AutoMovieHumanHandDigits {
  /** Restore the measured digit input after JSON has widened tuples and literal tags. */
  export function fixedInput(value: typeof import("./AutoMovieHumanHandF1RightInputs.json").digits.thumb): IFixed {
    const point: typeof AutoMovieHumanHandPalm.fixedPoint = AutoMovieHumanHandPalm.fixedPoint;
    const shoulders: IAutoMovieViewPart.IOutline[] = value.part.fullness.shoulders;
    if (shoulders.length !== 4 || value.part.fullness.kind !== "top")
      throw new Error("A fixed F1 digit needs its four observed conic shoulder runs");
    return {
      ...value,
      charts: value.charts.map((chart: typeof value.charts[number]): AutoMovieHumanArmAxis.IFixedChart => ({
        ...chart, originMm: point(chart.originMm), u: point(chart.u), v: point(chart.v),
      })),
      part: { ...value.part, fullness: { ...value.part.fullness, kind: value.part.fullness.kind,
        shoulders: [shoulders[0]!, shoulders[1]!, shoulders[2]!, shoulders[3]!] } },
      distal: value.distal.map(AutoMovieHumanHandPalm.fixedSection), tip: point(value.tip),
      terminal: { ...value.terminal, maximum: { ...value.terminal.maximum, pointsMm: value.terminal.maximum.pointsMm.map(point) } },
    };
  }

  /** A digit's measured course, conic control outlines and observed tip continuation. */
  export interface IFixed {
    /** Absolute measured section charts in the native digit pose. */
    charts: AutoMovieHumanArmAxis.IFixedChart[];

    /** Four extents and four conic shoulder runs reduced from the source cuts. */
    part: Omit<IAutoMovieViewPart, "axis">;

    /** Ordinary end sections starting at the same last retained conic ring. */
    distal: AutoMovieHumanHandPalm.IFixedSection[];

    /** Unique observed tip in the assembled capture world, millimetres. */
    tip: Vec3;

    /** Independent maximum record with its native coordinates and adjacent cut. */
    terminal: AutoMovieHumanHandPalm.IFixedTerminal;
  }

  /** Loft one digit's own conics in its observed pose and retain the exact open root. */
  export function fixed(input: IFixed): AutoMovieHumanArmF1Lines.IFixedMesh {
    const axis: AutoMovieViewAxis.IAxis = AutoMovieHumanArmAxis.observed(input.charts);
    const result: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create({ ...input.part, axis });
    const chain: IAutoMovieLoftChain | null = result.chain;
    if (chain === null) throw new Error(`F1 digit ${input.part.name} has no admitted conic chain`);
    const first: number = chain.layers[0]!.y, last: number = chain.layers.at(-1)!.y;
    const count: number = 72, steps: number = Math.max(1, Math.ceil((last - first) / 1.5));
    const phases: number[] = Array.from({ length: count }, (_, i): number => 2 * Math.PI * i / count);
    const mesh: AutoMovieHumanArmF1Lines.IFixedMesh = { positions: [], indices: [] };
    for (let i: number = 0; i <= steps; ++i)
      for (const p of AutoMovieLoftChain.ring(chain, first + (last - first) * i / steps, phases)) mesh.positions.push(...p);
    for (let row: number = 0; row < steps; ++row)
      for (let i: number = 0; i < count; ++i) {
        const a: number = row * count + i, b: number = row * count + (i + 1) % count;
        mesh.indices.push(a, a + count, b + count, a, b + count, b);
      }

    const frame: ReturnType<AutoMovieViewAxis.IAxis["at"]> = axis.at(last);
    if (input.distal.length > 1) {
      const root: Vec3[] = AutoMovieContourLoftCurves64.tessellate(input.distal[0]!.loops[0]!.curve, 0.1)
        .map(({ p: [x, y, z] }): Vec3 => [x, y, -z]);
      AutoMovieHumanHandPalm.attachFixed(mesh, input.distal, root, frame, input.terminal);
    } else {
      const { base, boundary } = AutoMovieHumanHandPalm.openTerminal(mesh, frame);
      const apex: number = mesh.positions.push(...input.tip) / 3 - 1;
      for (let i: number = 0; i < boundary.length; ++i)
        mesh.indices.push(apex, base + (i + 1) % boundary.length, base + i);
    }
    return mesh;
  }

  /** One digit. */
  export interface IDigit {
    /** `digit.<1-5>.<side>`. */
    name: string;

    /** Digit number, 1 (thumb) to 5. */
    digit: number;

    /** Frame the digit is authored in: its proximal phalanx (fingers) or its metacarpal (thumb). */
    frame: string;

    /** Root point, world mm. */
    root: Vec3;

    /** Skin apex of the tip, world mm. */
    tip: Vec3;

    /** Unit distal axis, lateral (radial) and v = lateral x distal chart directions, world. */
    axes: { distal: Vec3; lateral: Vec3; v: Vec3 };

    /** The joint stations along the digit from its root, mm (PIP and DIP, or MCP and IP). */
    joints: number[];

    /** Front (half-breadth) outline knots in the root parameter, with their jets. */
    knots: IKnot[];

    /** Side (half-depth) outline knots in the root parameter, with their jets. */
    depth: IKnot[];

    /** Digit length from root to apex, mm. */
    length: number;

    /** The view part handed to the engine. */
    part: IAutoMovieViewPart;

    /** The engine's loft of the part. */
    loft: AutoMovieViewLoft.IResult;
  }

  /** One outline knot: site, station from the root (mm), root parameter, value (mm) and its q-jets. */
  export interface IKnot {
    /** Landmark name. */
    site: string;

    /** Station from the digit root, mm. */
    station: number;

    /** Root parameter `-sqrt(L - station)`. */
    q: number;

    /** Half extent, mm. */
    value: number;

    /** d value / dq. */
    first: number;

    /** d2 value / dq2. */
    second: number;
  }

  /** Greiner 1991 joint breadth and circumference, mm, per digit 1-5 (thumb IP; fingers PIP then DIP), women then men. */
  export const GREINER: { female: number[][]; male: number[][] } = {
    female: [[20.6, 63.0], [19.9, 61.2, 17.3, 50.8], [19.3, 61.3, 17.1, 50.9], [18.4, 57.4, 15.8, 46.8], [16.5, 50.6, 14.7, 42.5]],
    male: [[24.0, 72.3], [23.0, 68.4, 20.1, 57.4], [22.5, 69.6, 19.8, 57.8], [21.4, 64.9, 18.5, 53.8], [19.2, 57.8, 17.4, 49.2]],
  };

  /** Greiner 1991 measured hand breadth, mm (women, men), the scale reference of its joint dimensions. */
  export const HAND_BREADTH: { female: number; male: number } = { female: 79.5, male: 90.4 };

  /** f1's phalanx shaft over its distal joint's half-breadth and half-depth, midway between joints (authored: the joints read as slight swellings). */
  export const SHAFT: number = 0.92;

  /** The same for the thumb's proximal phalanx: a smaller swelling ratio than the fingers' (authored for f1). */
  export const THUMB_SHAFT: number = 0.97;

  /** Boike et al. 2025 index fingernail width, mm (women, men): the fingertip pad's breadth. */
  export const NAIL_WIDTH: { female: number; male: number } = { female: 11, male: 13 };

  /** Build and loft every digit of one hand. */
  export function create(frames: AutoMovieHumanArmSegmentFrames.IOutput, root: AutoMovieHumanArmCurveSpec.ITransform, input: { sex: number; breadth: number }): IDigit[] {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const female: boolean = input.sex > 0;
    const m: 1 | -1 = frames.medial;
    const P: AutoMovieHumanArmSegmentFrames.IPoints = frames.points;
    const ratio: number = input.breadth / (female ? HAND_BREADTH.female : HAND_BREADTH.male);
    const table: number[][] = female ? GREINER.female : GREINER.male;
    const fingerRoot: number = input.breadth / 8;
    const pad: number = ((female ? NAIL_WIDTH.female : NAIL_WIDTH.male) * ratio) / 2;
    const hz: Vec3 = S.unit(sub(P.metacarpals[4]!.head, P.metacarpals[2]!.head));
    const radialH: Vec3 = scale(hz, -1);
    // Joint half-breadth and half-depth from a breadth and a circumference.
    const joint: (breadth: number, girth: number) => [number, number] = (breadth: number, girth: number): [number, number] => [
      (breadth * ratio) / 2,
      AutoMovieHumanArmViewCurves.semiAxis(girth * ratio, (breadth * ratio) / 2),
    ];
    const index: [number, number] = joint(table[1]![0]!, table[1]![1]!);
    // The thumb at rest follows f1's (owner via main, 2026-11-08 20:12: trace her thumb): her left thumb separates from
    // her palm's cut on the radial side at 96 mm past her wrist zero and ends near 130 mm (exact cuts every 4 mm normal to
    // her hand axis, `.shots/f1_modeler/thumb-extract.txt`: loop centroids (s, radial, anterior) (96, 44.4, -24.7) to
    // (128, 43.4, -48.2)); her tip, (130, 43.4, -49) in that frame, world (181.2, 870.2, -462.4), stands from our thumb's
    // CMC (149.4, 974.0, -453.8) at 90.8 mm along the hand's axis, 19.0 radial and -57.0 along the frame's anterior
    // (the side the resting law called volar): the unit (0.834, 0.174, -0.524) below, in place of the 35 and 30 degree
    // abductions. The whole thumb turns rigidly about its CMC onto it.
    const handDistal: Vec3 = S.unit(sub(P.metacarpals[2]!.head, P.metacarpals[2]!.base));
    const radialP: Vec3 = S.unit(sub(radialH, scale(handDistal, S.dot(radialH, handDistal))));
    const across: Vec3 = S.cross(radialP, handDistal);
    const volar: Vec3 = m > 0 ? scale(across, -1) : across;
    const thumbAxis: Vec3 = S.unit([0, 1, 2].map((i: number): number => 0.834 * handDistal[i]! + 0.174 * radialP[i]! - 0.524 * volar[i]!) as Vec3);
    const cmc: Vec3 = P.metacarpals[0]!.base;
    const thumbApex: Vec3 = P.digits[0]![P.digits[0]!.length - 1]!;
    // Her thumb's length: our CMC (149.4, 974.0, -453.8, the built root plus its 16 mm inside) stands 108.9 mm from her tip and our turned apex 93.0 mm, so the turned thumb is stretched about its CMC by 1.170 to end on her tip.
    const turnRaw: (p: Vec3) => Vec3 = turner(cmc, S.unit(sub(thumbApex, cmc)), thumbAxis);
    const turnThumb: (p: Vec3) => Vec3 = (p: Vec3): Vec3 => { const q: Vec3 = sub(turnRaw(p), cmc); return [cmc[0] + 1.17 * q[0], cmc[1] + 1.17 * q[1], cmc[2] + 1.17 * q[2]]; };

    // The child's field reaches past its root into the parent (construction.md, ports): each digit's part starts
    // `inside` mm behind its root along its own axis (a finger's MCP depth behind the knuckle arc, the thumb's CMC
    // inside the thenar), so its surface really crosses the palm's all round its root and the finger tree's trace exists.
    const inside: (thumb: boolean) => number = (thumb: boolean): number => (thumb ? 16 : 12);
    return [0, 1, 2, 3, 4].map((k: number): IDigit => {
      const thumb: boolean = k === 0;
      const origin: Vec3 = thumb ? P.metacarpals[0]!.base : P.metacarpals[k]!.head;
      const chain: Vec3[] = thumb ? [P.metacarpals[0]!.head, ...P.digits[0]!].map(turnThumb) : P.digits[k]!;
      const apex: Vec3 = chain[chain.length - 1]!;
      const distalH: Vec3 = S.unit(sub(apex, origin));
      const start: Vec3 = sub(origin, scale(distalH, inside(thumb)));
      const length: number = Math.hypot(...sub(apex, start));
      const lateralH: Vec3 = S.unit(sub(radialH, scale(distalH, S.dot(radialH, distalH))));
      const joints: number[] = chain.slice(0, -1).map((p: Vec3): number => S.dot(sub(p, start), distalH));
      const [j1, j2]: number[] = joints;
      const r0: number = inside(thumb);
      const row: number[] = table[k]!;
      const first: [number, number] | null = thumb ? null : joint(row[0]!, row[1]!);
      const second: [number, number] = thumb ? joint(row[0]!, row[1]!) : joint(row[2]!, row[3]!);
      const rootRadius: [number, number] = thumb ? [second[0] * (fingerRoot / index[0]), second[1] * (fingerRoot / index[0])] : [fingerRoot, fingerRoot];
      const q: (s: number) => number = (s: number): number => -Math.sqrt(Math.max(0, length - s));
      const outline: (c: 0 | 1) => IKnot[] = (c: 0 | 1): IKnot[] => {
        // f1's digit taper (authored): each joint a slight swelling over its shafts, the shaft midway between joints
        // SHAFT of the distal joint's value, the finger's MCP root a twentieth over its PIP and the thumb's MCP a twelfth
        // over its IP, so every phalanx narrows distally (proximal over middle over distal).
        const pip: number = first === null ? second[c] * 1.08 : first[c];
        // The thumb's metacarpal is the thenar's core: it leaves the CMC a quarter thicker than its MCP and thins without a
        // waist into the MCP, and its proximal phalanx dips only slightly (THUMB_SHAFT), so the thumb merges into the
        // thenar instead of reading as beads.
        // A finger's root stays within 0.42 of the knuckles' spacing (a quarter of the hand breadth), so neighbouring roots keep a gap for their web folds.
        const rootValue: number = thumb ? Math.max(rootRadius[c], pip * 1.25) : Math.min(pip * 1.05, 0.42 * (input.breadth / 4));
        const datums: { site: string; station: number; value: number | null; slope: number | null }[] = [
          { site: "inside the palm", station: 0, value: rootValue, slope: 0 },
          { site: thumb ? "CMC" : "MCP", station: r0, value: rootValue, slope: 0 },
          { site: thumb ? "metacarpal shaft" : "proximal shaft", station: (r0 + j1!) / 2, value: thumb ? pip * 1.1 : pip * SHAFT, slope: null },
          { site: thumb ? "MCP" : "PIP", station: j1!, value: pip, slope: thumb ? null : 0 },
          { site: thumb ? "proximal shaft" : "middle shaft", station: (j1! + j2!) / 2, value: second[c] * (thumb ? THUMB_SHAFT : SHAFT), slope: null },
          { site: thumb ? "IP" : "DIP", station: j2!, value: second[c], slope: 0 },
          { site: "apex", station: length, value: 0, slope: -Math.sqrt(2 * pad) },
        ];
        const jets: AutoMovieHumanFairOutline.IJet[] = AutoMovieHumanFairOutline.solve(datums.map((d: { station: number; value: number | null; slope: number | null }): AutoMovieHumanFairOutline.IKnot => ({ q: q(d.station), value: d.value, slope: d.slope })));
        return datums.map((d: { site: string; station: number }, i: number): IKnot => ({ site: d.site, station: d.station, q: q(d.station), value: jets[i]!.value, first: jets[i]!.first, second: jets[i]!.second }));
      };
      const knots: IKnot[] = outline(0);
      const depth: IKnot[] = outline(1);

      // World chart: u lateral, v = u x t so that v x u = t (the engine's straight axis).
      const rootW: Vec3 = S.apply(root, start);
      const distal: Vec3 = S.rotate(root, distalH);
      const lateral: Vec3 = S.rotate(root, lateralH);
      const v: Vec3 = S.cross(lateral, distal);
      const span: number = Math.sqrt(length);
      const signed: (list: IKnot[], sign: 1 | -1) => IAutoMovieViewPart.IOutline = (list: IKnot[], sign: 1 | -1): IAutoMovieViewPart.IOutline => ({
        knots: list.map((x: IKnot): IAutoMovieViewPart.IKnot => ({ site: x.site, station: x.station, value: sign * x.value, jet: { first: sign * x.first * span, second: sign * x.second * span * span } })),
      });
      const n: number = Math.max(4, Math.ceil(length / 2));
      const stations: number[] = Array.from({ length: n + 1 }, (_: unknown, j: number): number => (j === n ? length : (length * j) / n));
      const part: IAutoMovieViewPart = {
        name: `digit.${k + 1}.${m > 0 ? "left" : "right"}`,
        axis: AutoMovieViewAxis.straight(rootW, lateral, v),
        stations,
        front: { positive: signed(knots, 1), negative: signed(knots, -1) },
        side: { positive: signed(depth, 1), negative: signed(depth, -1) },
        fullness: { kind: "shoulder", shoulder: { knots: [{ site: "root", station: 0, value: AutoMovieViewSection.ELLIPSE }, { site: "apex", station: length, value: AutoMovieViewSection.ELLIPSE }] } },
        pole: "top",
        order: 16,
        samples: 48,
      };
      return {
        name: part.name,
        digit: k + 1,
        frame: thumb ? frames.metacarpals[0]!.name : frames.phalanges[k]![0]!.name,
        root: rootW,
        tip: S.apply(root, apex),
        axes: { distal, lateral, v },
        joints,
        knots,
        depth,
        length,
        part,
        loft: AutoMovieViewLoft.create(part),
      };
    });
  }
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** The rigid turn about `centre` taking unit `from` onto unit `to` by the least angle (Rodrigues). */
function turner(centre: Vec3, from: Vec3, to: Vec3): (p: Vec3) => Vec3 {
  const k: Vec3 = [from[1] * to[2] - from[2] * to[1], from[2] * to[0] - from[0] * to[2], from[0] * to[1] - from[1] * to[0]];
  const s: number = Math.hypot(k[0], k[1], k[2]);
  const c: number = from[0] * to[0] + from[1] * to[1] + from[2] * to[2];
  if (s < 1e-12) return (p: Vec3): Vec3 => p;
  const u: Vec3 = [k[0] / s, k[1] / s, k[2] / s];
  return (p: Vec3): Vec3 => {
    const d: Vec3 = sub(p, centre);
    const cross: Vec3 = [u[1] * d[2] - u[2] * d[1], u[2] * d[0] - u[0] * d[2], u[0] * d[1] - u[1] * d[0]];
    const along: number = (u[0] * d[0] + u[1] * d[1] + u[2] * d[2]) * (1 - c);
    return [centre[0] + d[0] * c + cross[0] * s + u[0] * along, centre[1] + d[1] * c + cross[1] * s + u[1] * along, centre[2] + d[2] * c + cross[2] * s + u[2] * along];
  };
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}
