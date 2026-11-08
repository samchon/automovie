import { AutoMovieViewAxis, AutoMovieViewLoft, AutoMovieViewSection, type IAutoMovieViewPart } from "@automovie/engine";

import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanFairOutline } from "../arm/AutoMovieHumanFairOutline";
import type { AutoMovieHumanLegLandmarks } from "../leg/AutoMovieHumanLegLandmarks";
import type { AutoMovieHumanLegSegmentFrames } from "../leg/AutoMovieHumanLegSegmentFrames";
import { AutoMovieHumanFootToeRoots } from "./AutoMovieHumanFootToeRoots";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;
type IFrame = AutoMovieHumanArmCurveSpec.ISegmentFrame;

/**
 * The five toes of one foot, each a few view curves in its own frame lofted
 * by the engine view loft (`AutoMovieViewLoft`), as the hand's digits: a
 * front outline pair (half-breadths), a side outline pair (half-depths), a
 * straight axis and the ellipse fullness, closed at a tip pad and open at the
 * root inside the forefoot, where the toe's fold onto the foot stands
 * (`AutoMovieHumanFootToeTree`).
 *
 * Toe frames: each toe's root frame stands at its metatarsal head centre, Y
 * from the toe's apex toward the head (proximal), Z to the subject's right
 * and X dorsal (the frames' common convention of Y proximal and Z right; ISB
 * 2002 defines no toe frame), relative to the calcaneus frame.
 *
 * Heads, roots and lengths: `AutoMovieHumanFootToeRoots` (head I at the
 * ball-of-foot length from the heel, heads II to V behind it by Maestro's
 * cascade; the roots tiling the foot breadth inside the heads' eminences by
 * Patil et al. 2017's metatarsal mid-shaft widths about the long axis through
 * the second toe; Patil's phalanx lengths scaled so the hallux reaches the
 * foot length from head I, the distal bone carrying the tip soft tissue in
 * the scale, as the hand's Buryanov reading does), which also gives each
 * toe's web station and web-fold cap. Heights: each root circle rests on
 * the plantar soft tissue under the heads (`AutoMovieHumanFootToeRoots.height`);
 * the toes are straight (Neutral-0) and decline to rest their pads on the
 * floor.
 *
 * Sections: the root's half-depth equals its half-breadth (circle, null law:
 * toe depth is an input gap); the tip closes as a hemispherical pad of half
 * the root breadth (`dy/dq = -sqrt(2 rho)` at the apex in the root parameter
 * `q = -sqrt(L - s)`), and every free height between is supplied by the
 * minimum bending energy (`AutoMovieHumanFairOutline`).
 */
export namespace AutoMovieHumanFootToes {
  /** One lofted toe. */
  export interface IToe {
    /** Part name, `toe.<side>.<digit>`. */
    name: string;

    /** Digit 1 (hallux) to 5. */
    digit: number;

    /** The toe's root frame, relative to the calcaneus frame. */
    frame: IFrame;

    /** Root (head centre) and apex, foot frame, mm. */
    root: Vec3;

    /** Apex, foot frame, mm. */
    tip: Vec3;

    /** Joint stations from the root along the toe, mm (PIP and DIP; the hallux's IP). */
    joints: number[];

    /** Root half-breadth and the pad radius, mm. */
    breadth: number;

    /** Half the gap to the nearest neighbouring toe's root, the cap of this toe's web fold, mm. */
    cap: number;

    /** The phase of the toe's plantar line on its part's chart (the foot frame's down, normal to the toe's axis, read in the part's lateral and v directions), radians in [0, 2 pi). */
    plantar: number;

    /** Front outline knots (half-breadth). */
    knots: IKnot[];

    /** Side outline knots (half-depth). */
    depth: IKnot[];

    /** Root-to-apex length, mm. */
    length: number;

    /** The view part handed to the engine. */
    part: IAutoMovieViewPart;

    /** The engine's loft. */
    loft: AutoMovieViewLoft.IResult;
  }

  /** One outline knot in the toe's own root parameter. */
  export interface IKnot {
    /** Site name. */
    site: string;

    /** Station from the root, mm. */
    station: number;

    /** Root parameter `-sqrt(L - station)`. */
    q: number;

    /** Value, mm. */
    value: number;

    /** d value / dq. */
    first: number;

    /** d2 value / dq2. */
    second: number;
  }

  /** What the toes read, calibration mm. */
  export interface IInput {
    /** Sex control; positive selects the women's rows. */
    sex: number;

    /** Foot length (heel to the longest toe). */
    footLength: number;

    /** Foot breadth across the metatarsal heads. */
    footBreadth: number;

    /** Ball-of-foot length (heel to head I). */
    ballLength: number;
  }

  /** Build and loft the five toes of one foot under `root` (the femur frame's world placement). */
  export function create(frames: AutoMovieHumanLegSegmentFrames.IOutput, landmarks: AutoMovieHumanLegLandmarks.IOutput, input: IInput, root: AutoMovieHumanArmCurveSpec.ITransform): IToe[] {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const m: 1 | -1 = frames.medial;
    const L: number = input.footLength;
    const floor: number = landmarks.foot.floor;
    const heel: number = landmarks.foot.heel[0];
    const foot: AutoMovieHumanArmCurveSpec.ITransform = frames.chain(frames.foot.name, S.IDENTITY);
    const world: AutoMovieHumanArmCurveSpec.ITransform = S.compose(root, foot);
    const roots: AutoMovieHumanFootToeRoots.IRoot[] = AutoMovieHumanFootToeRoots.roots({ sex: input.sex, footLength: L, footBreadth: input.footBreadth, ballLength: input.ballLength, heel, medial: m });
    return roots.map((r: AutoMovieHumanFootToeRoots.IRoot, k: number): IToe => {
      const breadth: number = r.breadth;
      const across: number = r.z;
      const rho: number = breadth / 2;
      const head: Vec3 = [r.x, floor + AutoMovieHumanFootToeRoots.height(r), across];
      const lengths: number[] = r.bones;
      const along: number = r.length;
      // The apex rests its pad on the floor: its centre line ends a pad radius over the floor.
      const drop: number = head[1] - (floor + rho);
      const reach: number = Math.sqrt(Math.max(0, along * along - drop * drop));
      const tip: Vec3 = [head[0] + reach, floor + rho, across];
      const distal: Vec3 = S.unit(sub(tip, head));
      const joints: number[] = lengths.slice(0, -1).map((_: number, j: number): number => lengths.slice(0, j + 1).reduce((a: number, b: number): number => a + b, 0));
      const q: (s: number) => number = (s: number): number => -Math.sqrt(Math.max(0, along - s));
      const outline: () => IKnot[] = (): IKnot[] => {
        const datums: { site: string; station: number; value: number | null; slope: number | null }[] = [
          { site: "MTP", station: 0, value: rho, slope: 0 },
          ...joints.map((s: number, j: number): { site: string; station: number; value: number | null; slope: number | null } => ({ site: k === 0 ? "IP" : j === 0 ? "PIP" : "DIP", station: s, value: null, slope: null })),
          { site: "apex", station: along, value: 0, slope: -Math.sqrt(2 * rho) },
        ];
        const jets: AutoMovieHumanFairOutline.IJet[] = AutoMovieHumanFairOutline.solve(datums.map((d: { station: number; value: number | null; slope: number | null }): AutoMovieHumanFairOutline.IKnot => ({ q: q(d.station), value: d.value, slope: d.slope })));
        return datums.map((d: { site: string; station: number }, i: number): IKnot => ({ site: d.site, station: d.station, q: q(d.station), value: jets[i]!.value, first: jets[i]!.first, second: jets[i]!.second }));
      };
      const knots: IKnot[] = outline();
      const depth: IKnot[] = outline();

      // Toe root frame relative to the calcaneus: X dorsal, Y proximal, Z right.
      const y: Vec3 = scale3(distal, -1);
      const x: Vec3 = S.unit(sub([0, 1, 0], scale3(y, S.dot([0, 1, 0], y))));
      const frame: IFrame = {
        name: `toe.${k + 1}.${m > 0 ? "left" : "right"}`,
        parent: frames.foot.name,
        basis: { kind: "derived", rule: "origin at the metatarsal head centre (ball length and Maestro's cascade; breadth tiling by Patil 2017 shaft widths about the long axis through the second toe); Y from the apex to the head, X dorsal, Z right" },
        relative: { origin: head, axes: [x, y, S.cross(x, y)] },
      };

      // World chart: u lateral, v = u x t (the engine's straight axis).
      const rootW: Vec3 = S.apply(world, head);
      const distalW: Vec3 = S.rotate(world, distal);
      const lateral0: Vec3 = S.rotate(world, [0, 0, -m]);
      const lateral: Vec3 = S.unit(sub(lateral0, scale3(distalW, S.dot(lateral0, distalW))));
      const v: Vec3 = S.cross(lateral, distalW);
      // The plantar line's phase: the foot frame's down with its part along the toe removed, read in (lateral, v).
      const down0: Vec3 = S.rotate(world, [0, -1, 0]);
      const down: Vec3 = sub(down0, scale3(distalW, S.dot(down0, distalW)));
      const plantar: number = (Math.atan2(S.dot(down, v), S.dot(down, lateral)) + 2 * Math.PI) % (2 * Math.PI);
      const span: number = Math.sqrt(along);
      const signed: (list: IKnot[], sign: 1 | -1) => IAutoMovieViewPart.IOutline = (list: IKnot[], sign: 1 | -1): IAutoMovieViewPart.IOutline => ({
        knots: list.map((x0: IKnot): IAutoMovieViewPart.IKnot => ({ site: x0.site, station: x0.station, value: sign * x0.value, jet: { first: sign * x0.first * span, second: sign * x0.second * span * span } })),
      });
      const n: number = Math.max(4, Math.ceil(along / 2));
      const stations: number[] = Array.from({ length: n + 1 }, (_: unknown, j: number): number => (j === n ? along : (along * j) / n));
      const part: IAutoMovieViewPart = {
        name: `toe.${m > 0 ? "left" : "right"}.${k + 1}`,
        axis: AutoMovieViewAxis.straight(rootW, lateral, v),
        stations,
        front: { positive: signed(knots, 1), negative: signed(knots, -1) },
        side: { positive: signed(depth, 1), negative: signed(depth, -1) },
        fullness: { kind: "shoulder", shoulder: { knots: [{ site: "root", station: 0, value: AutoMovieViewSection.ELLIPSE }, { site: "apex", station: along, value: AutoMovieViewSection.ELLIPSE }] } },
        pole: "top",
        order: 16,
        samples: 48,
      };
      return { name: part.name, digit: k + 1, frame, root: head, tip, joints, breadth: rho, cap: r.cap, plantar, knots, depth, length: along, part, loft: AutoMovieViewLoft.create(part) };
    });
  }

  /**
   * The toe's view-curve specs in its own root frame (Y proximal, so the
   * distal axis is -Y; X dorsal; Z right): its front pair (lateral and
   * medial half-breadths), its side pair (dorsal and plantar half-depths),
   * each a C2 quintic Hermite outline in the toe's root parameter, and its
   * straight axis, with their datums, constraints and aids (axis, the
   * dimensioned rectangle, joint ticks, the root's parallel tangent and the
   * apex pad's tangent).
   */
  export function specs(toe: IToe, medial: 1 | -1): AutoMovieHumanArmCurveSpec.ICurveSpec[] {
    const F: string = toe.frame.name;
    const L: number = toe.length;
    const distal: Vec3 = [0, -1, 0];
    const at: (s: number, y: number, dir: Vec3) => Vec3 = (s: number, y: number, dir: Vec3): Vec3 => [dir[0] * y, -s + dir[1] * y, dir[2] * y];
    const labels: [string, Vec3, IKnot[]][] = [
      ["lateral", [0, 0, -medial], toe.knots],
      ["medial", [0, 0, medial], toe.knots],
      ["dorsal", [1, 0, 0], toe.depth],
      ["plantar", [-1, 0, 0], toe.depth],
    ];
    const out: AutoMovieHumanArmCurveSpec.ICurveSpec[] = labels.map(([label, dir, knots]: [string, Vec3, IKnot[]]): AutoMovieHumanArmCurveSpec.ICurveSpec => {
      const name: string = `toe.${label}.${toe.digit}`;
      const datums: AutoMovieHumanArmCurveSpec.IDatum[] = [
        { name: `${name}.MTP`, frame: F, point: at(0, toe.breadth, dir), source: { kind: "derived", rule: "root half-breadth: the toe's share of the foot breadth (Patil 2017 shaft widths), circle depth (null law)" } },
        { name: `${name}.apex`, frame: F, point: at(L, 0, dir), source: { kind: "derived", rule: "apex: the pad closes at the toe's scaled length (Patil 2017 phalanges)" } },
      ];
      return {
        name,
        frame: F,
        datums,
        constraints: [
          { kind: "pass", datum: datums[0]!.name },
          { kind: "pass", datum: datums[1]!.name },
          { kind: "tangent", datum: datums[0]!.name, direction: distal },
        ],
        representation: {
          kind: "outline",
          parameter: `one-pole root q = -sqrt(L - s), s from the head centre along the toe, L = ${L.toFixed(3)} mm`,
          direction: dir,
          walk: 0,
          domain: [0, L],
          knots: knots.map((k: IKnot): AutoMovieHumanArmCurveSpec.IOutlineKnot => ({ site: k.site, station: k.station, q: k.q, value: k.value, first: k.first, second: k.second })),
          handleRule: "C2 quintic Hermite in q: the root value leaving parallel, the apex closing with the pad slope -sqrt(2 rho), every other jet by the minimum bending energy (AutoMovieHumanFairOutline)",
        },
        aids: [
          { kind: "axis", name: `toe ${toe.digit} axis`, frame: F, points: [at(0, 0, dir), at(L, 0, dir)] },
          { kind: "rectangle", name: `toe ${toe.digit} rectangle`, frame: F, points: [at(0, 0, dir), at(L, 0, dir), at(L, toe.breadth, dir), at(0, toe.breadth, dir), at(0, 0, dir)] },
          ...toe.joints.map((s: number, j: number): AutoMovieHumanArmCurveSpec.IAid => ({ kind: "tick", name: `tick joint ${j + 1}`, frame: F, points: [at(s, -3, dir), at(s, 3, dir)] })),
          { kind: "tangent", name: "tangent MTP", frame: F, points: [at(-6, toe.breadth, dir), at(6, toe.breadth, dir)] },
        ],
        consumers: [`toe ${toe.digit} view loft ${label} edge`],
      };
    });
    out.push({
      name: `toe.axis.${toe.digit}`,
      frame: F,
      datums: [
        { name: `toe.axis.${toe.digit}.root`, frame: F, point: [0, 0, 0], source: { kind: "derived", rule: "metatarsal head centre" } },
        { name: `toe.axis.${toe.digit}.apex`, frame: F, point: [0, -L, 0], source: { kind: "derived", rule: "apex resting its pad on the floor" } },
      ],
      constraints: [],
      representation: { kind: "bezier", points: [[0, 0, 0], [0, -L / 3, 0], [0, (-2 * L) / 3, 0], [0, -L, 0]], closed: false, handleRule: "straight toe axis: controls at the chord thirds" },
      aids: [],
      consumers: [`toe ${toe.digit} view loft straight course`],
    });
    return out;
  }

  /** The exact outline value of a toe spec at a station from the root, or null for its axis. */
  export function value(toe: IToe, spec: AutoMovieHumanArmCurveSpec.ICurveSpec, station: number): number | null {
    const knots: IKnot[] | null = /\.(lateral|medial)\./.test(spec.name) ? toe.knots : /\.(dorsal|plantar)\./.test(spec.name) ? toe.depth : null;
    if (knots === null) return null;
    return AutoMovieHumanFairOutline.evaluate(
      knots.map((k: IKnot): number => k.q),
      knots.map((k: IKnot): AutoMovieHumanFairOutline.IJet => ({ value: k.value, first: k.first, second: k.second })),
      -Math.sqrt(Math.max(0, toe.length - station)),
    )[0];
  }
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale3(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}
