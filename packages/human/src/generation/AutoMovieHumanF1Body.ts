import { type AutoMovieLoftContract, AutoMovieLoftFrame, type AutoMovieMeshExtract, AutoMovieSolidChain, type AutoMovieViewAxis, type IAutoMovieLoftChain, type IAutoMovieSolidSurface, type IAutoMovieViewPart } from "@automovie/engine";
import type { AutoMovieConstructionNode, IAutoMovieConstructionContinuation, IAutoMovieConstructionPort, IAutoMovieConstructionSplit } from "@automovie/interface";

import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanBodyTree } from "./AutoMovieHumanBodyTree";
import { AutoMovieHumanF1Arm } from "./AutoMovieHumanF1Arm";
import { AutoMovieHumanF1BodyAssembly } from "./AutoMovieHumanF1BodyAssembly";
import { AutoMovieHumanArmCurveSpec } from "./arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanArmShoulderJoin } from "./arm/AutoMovieHumanArmShoulderJoin";
import { AutoMovieHumanFootToeTree } from "./foot/AutoMovieHumanFootToeTree";
import type { AutoMovieHumanHandDigits } from "./hand/AutoMovieHumanHandDigits";
import { AutoMovieHumanHandFingerTree } from "./hand/AutoMovieHumanHandFingerTree";
import { AutoMovieHumanHandPorts } from "./hand/AutoMovieHumanHandPorts";
import { AutoMovieHumanHeadBuild } from "./head/AutoMovieHumanHeadBuild";
import { AutoMovieHumanHeadEarLoft } from "./head/AutoMovieHumanHeadEarLoft";
import { AutoMovieHumanHeadEarPorts } from "./head/AutoMovieHumanHeadEarPorts";
import { AutoMovieHumanHeadMassLoft } from "./head/AutoMovieHumanHeadMassLoft";
import { AutoMovieHumanLegBuild } from "./leg/AutoMovieHumanLegBuild";
import { AutoMovieHumanTrunkF1Traced } from "./trunk/AutoMovieHumanTrunkF1Traced";
import { AutoMovieHumanTrunkNeckBase } from "./trunk/AutoMovieHumanTrunkNeckBase";
import { AutoMovieHumanTrunkPorts } from "./trunk/AutoMovieHumanTrunkPorts";
import { AutoMovieHumanTrunkS00 } from "./trunk/AutoMovieHumanTrunkS00";

/**
 * The whole f1 body as one construction tree, composed from the region
 * owners' published constructors only and realized once by the engine through
 * the human join tree (`AutoMovieHumanBodyTree`, the owner's 06:15 order to
 * reuse the human package's join and stitching logic):
 *
 * 1. S00, built once (`AutoMovieHumanTrunkS00.of`), as a millimetre source
 *    leaf whose view part carries its mounds as engine reliefs (the composed
 *    S00 as f1_trunk publishes it, `{ ...part, reliefs: chain.reliefs }`).
 * 2. head.mass continuing S00's open top end (`continue`,
 *    IAutoMovieConstructionContinuation): f1_head's construction
 *    (`AutoMovieHumanHeadBuild`) lofted on its world course
 *    (`AutoMovieHumanHeadMassLoft`), whose open bottom is S00's level
 *    neck-base end (`AutoMovieHumanTrunkNeckBase.end`). Its section order is
 *    S00's: the engine's continuation copies the host's end layer only between
 *    equal orders, and admits different orders only for ends without reliefs
 *    (`AutoMovieConstructionBoundary`), while both S00 (breasts, buttocks) and
 *    head.mass (jaw, face) carry reliefs.
 * 3. The right arm, then the left, each on its shoulder port of S00
 *    (`port`, IAutoMovieConstructionPort): the port curve is f1_trunk's
 *    published chart ellipse (`AutoMovieHumanTrunkPorts`), cut from S00 as a
 *    hole, and the band reaches the arm at its axilla-level rail (f1_arm's
 *    order: the rail is the posed station of the axilla level, the arm's
 *    outlines above it only closing to the dome pole for the port to cut
 *    away). The arm's subtree carries its digits by f1_arm's finger tree
 *    (`AutoMovieHumanHandFingerTree.node`, each digit a merge join onto the
 *    hand) and its palm ports (`AutoMovieHumanHandPorts`, one port node per
 *    digit whose ring equals its port), so the shoulder port cuts the arm
 *    with its digits already on.
 * 4. Both legs on S00's open crotch end, one split (`split`,
 *    IAutoMovieConstructionSplit): f1_leg's leg parts (`AutoMovieHumanLegBuild.body`,
 *    from the same S00), the seam the chord between the crotch ring's front
 *    and back midline points (S00 phases 0 and pi, `AutoMovieHumanTrunkPelvisSplit`:
 *    right arc `[0, pi]`, left `[pi, 2 pi]`), each band reaching its leg at the
 *    gluteal-furrow rail, with f1_leg's posterior gluteal-sulcus crease window.
 *
 * 2b. Each auricle on its head.mass port (`port`): f1_head's ear part
 *    (`AutoMovieHumanHeadEarLoft`, lofted in the ear's own frame) chained
 *    into the world by the ear frame's rigid map into the head frame
 *    (`IEar.place`) and the head frame's into the world
 *    (`AutoMovieHumanHeadBuild.IOutput.world`), and f1_head's port ellipse
 *    on head.mass (`AutoMovieHumanHeadEarPorts`, perimeter equal to the
 *    root loop's), read from the world-placed roots against the world
 *    head.mass chain the tree carries.
 *
 * Every part the tree cannot carry is listed in {@link IOutput.missing} with
 * the reason, never faked.
 */
export namespace AutoMovieHumanF1Body {
  /** One fixed-coordinate F1 part after its own local ports have been sewn. */
  export interface IFixedPart {
    /** Newly generated indexed surface in absolute capture-world millimetres. */
    readonly mesh: AutoMovieMeshExtract.IMesh;

    /** Stable digit names already emitted as part of this surface. */
    readonly included?: readonly string[];

    /** Local construction observations and unresolved measured relationships. */
    readonly diagnostics?: readonly string[];
  }

  /** One operator node's outcome in the realized tree. */
  export interface IStatus {
    /** The node's name in the tree. */
    node: string;

    /** `continue`, `join`, `split` or `port`. */
    kind: "continue" | "join" | "split" | "port";

    /** `realized` when the node kept its premises, else `diagnostic`. */
    status: "realized" | "diagnostic";

    /** The engine's diagnostics naming this node (empty when realized). */
    details: string[];
  }

  /** A part the tree does not carry, and why. */
  export interface IMissing {
    /** The part. */
    part: string;

    /** Why it is absent. */
    reason: string;
  }

  /** The realized body and its account. */
  export interface IOutput {
    /** The one S00 build. */
    s00: AutoMovieHumanTrunkS00.IOutput;

    /** f1_head's build, or null when it refused its inputs. */
    head: AutoMovieHumanHeadBuild.IOutput | null;

    /** Each arm, by side, as built for its port. */
    arms: Partial<Record<"left" | "right", AutoMovieHumanF1Arm.IArm>>;

    /** f1_leg's two legs on the split, or null when its build refused. */
    legs: AutoMovieHumanLegBuild.IBody | null;

    /** The port nodes as composed, by their port's name (`shoulder.right`, `ear.left`, ...). */
    ports: Record<string, IAutoMovieConstructionPort>;

    /** World anchors for close-up views, mm: each ear's root centroid (`ear.<side>`), each hand's wrist-to-palm-pole midpoint (`hand.<side>`). */
    anchors: Record<string, [number, number, number]>;

    /** The legs' split node as composed, or null. */
    split: IAutoMovieConstructionSplit | null;

    /** The source parts bound to the tree's leaves, by name, millimetres. */
    parts: ReadonlyMap<string, IAutoMovieViewPart>;

    /** The construction tree, or null when S00 published no part. */
    root: AutoMovieConstructionNode | null;

    /** The realized chains and trimmed body, or null without a root. */
    tree: AutoMovieHumanBodyTree.IOutput | null;

    /** Every operator node's outcome, in tree order. */
    statuses: IStatus[];

    /** Parts the tree does not carry. */
    missing: IMissing[];

    /** Every diagnostic: the builders', then the realization's. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];

    /** Stage times, milliseconds. */
    ms: Record<string, number>;
  }

  /**
   * The tree's trace limits: the body lane's, as f1_arm publishes them
   * (`AutoMovieHumanArmShoulderJoin.LIMITS`: 64 points per turn, 1e-6 mm,
   * asin(0.01)), and the skin's chord 6 mm, the widest layer spacing of the
   * S00 and arm lofts (`AutoMovieHumanTrunkS00.of`'s and the arm renderer's
   * `gap: 6`), so the band rows are no coarser than the faces they join.
   */
  export const LIMITS: AutoMovieHumanBodyTree.ILimits = { ...AutoMovieHumanArmShoulderJoin.LIMITS, gap: 6 };

  /**
   * head.mass's ring samples at least (the head renderer's own 128; the
   * loft raises it to its reliefs' sampling rule) and widest layer gap, mm
   * (the head renderer's 6).
   */
  export const HEAD: { samples: number; gap: number } = { samples: 128, gap: 6 };

  /**
   * The legs' split: its seam on S00's crotch ring, the front and back
   * midline phases (`AutoMovieHumanTrunkPelvisSplit`: phase 0 the front
   * midline, pi the back), and its band columns, the tree's 64 per turn
   * (`LIMITS.count`).
   */
  export const SPLIT: { seam: [number, number]; count: number } = { seam: [0, Math.PI], count: LIMITS.count };

  /**
   * Band rows: one per `LIMITS.gap` of twice the band's declared reach (its
   * rail depth into the part), the join's own convention
   * (`AutoMovieHumanBodyTree.join`: 2 cap / gap rows).
   *
   * @param rail The deepest rail, metres.
   */
  export function rows(rail: number): number {
    return Math.max(1, Math.ceil((2 * 1000 * rail) / LIMITS.gap));
  }

  /**
   * The legs' split seam as her midsagittal crotch line (main's 17:17
   * decision): S00's split end is the plane through her two forks, the pubic
   * notch floor in front and the cleft top behind, so the forks are S00's own
   * end-ring points at the seam phases and f1_trunk2's
   * `AutoMovieHumanTrunkF1Traced.CROTCH_LINE` (her exact z = 0 cut, reduced
   * within 0.5 mm) supplies the interior knots: its first and last points
   * are those forks, the others are read in the seam plane as `along` the
   * chord from the front fork and `depth` along the end's outward normal
   * (`IAutoMovieConstructionSplit.IProfile`, metres).
   *
   * The corner window: the ribbons' turn ends before the seam's first knot
   * from either fork, so every authored knot carries the plain lateral
   * ruling. The seam's clock runs linearly in its length over `pi`, so the
   * window is `pi` times the shorter fork-to-knot distance over the knot
   * polyline's length (the chord-length lower bound of the seam's length).
   *
   * Refused, with the reason (the split then keeps the straight chord), when
   * a knot does not stand strictly inside the chord or lies on or above the
   * end plane (depth not positive): the seam would then run inside S00.
   *
   * @param s00 The one S00 build.
   * @returns The profile, or why the straight chord stays.
   */
  export function crotch(s00: AutoMovieHumanTrunkS00.IOutput): IAutoMovieConstructionSplit.IProfile | string {
    type V = [number, number, number];
    const chain: IAutoMovieLoftChain | null = s00.chain;
    const surface: IAutoMovieSolidSurface | null = chain === null ? null : AutoMovieSolidChain.surface(chain);
    if (chain === null || surface === null) return "S00 has no surface";
    const layer: IAutoMovieLoftChain.ILayer = chain.layers[0]!;
    const frame: AutoMovieLoftFrame.IFrame = layer.frame ?? AutoMovieLoftFrame.horizontal(layer.y);
    // The bottom end's outward normal, `-(v x u)` (the realization's rule).
    const n: V = [-(frame.v[1]! * frame.u[2]! - frame.v[2]! * frame.u[1]!), -(frame.v[2]! * frame.u[0]! - frame.v[0]! * frame.u[2]!), -(frame.v[0]! * frame.u[1]! - frame.v[1]! * frame.u[0]!)];
    const point: (phi: number) => V = (phi: number): V => {
      const p: readonly number[] = surface.jet(layer.y, phi).p;
      return [p[0]!, p[1]!, p[2]!];
    };
    const [A, B]: V[] = SPLIT.seam.map(point);
    const d: V = [B![0] - A![0], B![1] - A![1], B![2] - A![2]];
    const chord: number = Math.hypot(...d);
    const e1: V = [d[0] / chord, d[1] / chord, d[2] / chord];
    const ne: number = n[0] * e1[0] + n[1] * e1[1] + n[2] * e1[2];
    const w: V = [n[0] - ne * e1[0], n[1] - ne * e1[1], n[2] - ne * e1[2]];
    const wl: number = Math.hypot(...w);
    const e2: V = [w[0] / wl, w[1] / wl, w[2] / wl];
    const line: [number, number][] = AutoMovieHumanTrunkF1Traced.CROTCH_LINE;
    const forks: string = `S00's forks (${A![0].toFixed(1)}, ${A![1].toFixed(1)}, ${A![2].toFixed(1)}) and (${B![0].toFixed(1)}, ${B![1].toFixed(1)}, ${B![2].toFixed(1)}) mm against the line's (${line[0]!.join(", ")}) and (${line[line.length - 1]!.join(", ")})`;
    const knots: [number, number][] = line.slice(1, -1).map(([x, y]: [number, number]): [number, number] => {
      const q: V = [x - A![0], y - A![1], -A![2]];
      return [(q[0] * e1[0] + q[1] * e1[1] + q[2] * e1[2]) / 1000, (q[0] * e2[0] + q[1] * e2[1] + q[2] * e2[2]) / 1000];
    });
    for (const [along, depth] of knots) if (!(along > 0 && along < chord / 1000 && depth > 0)) return `knot along ${(along * 1000).toFixed(1)} mm, depth ${(depth * 1000).toFixed(1)} mm is not inside the chord ${chord.toFixed(1)} mm below the end plane; ${forks}`;
    const polyline: [number, number][] = [[0, 0], ...knots.map(([a, b]: [number, number]): [number, number] => [a * 1000, b * 1000]), [chord, 0]];
    const spans: number[] = polyline.slice(1).map((p: [number, number], i: number): number => Math.hypot(p[0] - polyline[i]![0], p[1] - polyline[i]![1]));
    const total: number = spans.reduce((x: number, y: number): number => x + y, 0);
    return { knots, corner: (Math.PI * Math.min(spans[0]!, spans[spans.length - 1]!)) / total };
  }

  /** Build the recorded F1 in world millimetres, with no reference or parameter source. */
  export function create(): AutoMovieHumanF1BodyAssembly.IFixed;
  /** Build every published parameterized part once, compose the tree and realize it. */
  export function create(params: IAutoMovieHumanParameters): IOutput;
  export function create(params?: IAutoMovieHumanParameters): IOutput | AutoMovieHumanF1BodyAssembly.IFixed {
    if (params === undefined) return AutoMovieHumanF1BodyAssembly.fixed();
    const ms: Record<string, number> = {};
    let t: number = performance.now();
    const lap: (name: string) => void = (name: string): void => {
      const now: number = performance.now();
      ms[name] = now - t;
      t = now;
    };
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    const missing: IMissing[] = [];
    const parts: Map<string, IAutoMovieViewPart> = new Map();
    const arms: Partial<Record<"left" | "right", AutoMovieHumanF1Arm.IArm>> = {};
    const ports: Record<string, IAutoMovieConstructionPort> = {};
    const anchors: Record<string, [number, number, number]> = {};
    let split: IAutoMovieConstructionSplit | null = null;

    // 1. S00 once, with its mounds as the view part's reliefs.
    const s00: AutoMovieHumanTrunkS00.IOutput = AutoMovieHumanTrunkS00.of(params);
    lap("s00");
    for (const d of s00.loft.loft.diagnostics) diagnostics.push({ producer: "s00", level: d.level, contract: d.contract, detail: d.detail });
    if (s00.chain === null) {
      missing.push({ part: "trunk", reason: "S00's loft published no chain" });
      return { s00, head: null, arms, legs: null, ports, anchors, split, parts, root: null, tree: null, statuses: [], missing, diagnostics, ms };
    }
    const trunk: IAutoMovieViewPart = { ...s00.loft.part, ...(s00.chain.reliefs === undefined ? {} : { reliefs: s00.chain.reliefs }) };
    parts.set(trunk.name, trunk);
    let root: AutoMovieConstructionNode = { type: "source", name: trunk.name, source: trunk.name };
    const statuses: { node: string; kind: IStatus["kind"]; faces: string[] }[] = [];

    // 2. head.mass continuing S00's top end.
    let head: AutoMovieHumanHeadBuild.IOutput | null = null;
    try {
      // The head's open bottom read from this S00's own end (f1_head, 15:14):
      // `AutoMovieHumanTrunkNeckBase.end` rebuilds the end from the datums,
      // while `of` reads it on the built S00's view curves, so the head's first
      // section takes the very end the continuation copies (value and slope).
      // IJ is the thorax frame's origin (`NodeTrunkSpecs`' reading).
      const ij: [number, number, number] = AutoMovieHumanArmCurveSpec.apply(s00.datums.frames.world("thorax"), [0, 0, 0]);
      head = AutoMovieHumanHeadBuild.create(params, undefined, AutoMovieHumanTrunkNeckBase.of(s00.datums.frames, s00.curves, s00.measures.neckBaseCircumference, ij));
    } catch (error: unknown) {
      missing.push({ part: "head.mass", reason: `f1_head's build refused: ${error instanceof Error ? error.message : String(error)}` });
    }
    lap("head build");
    if (head !== null) {
      const loft: AutoMovieHumanHeadMassLoft.IOutput = AutoMovieHumanHeadMassLoft.create({ curves: head.curves, axis: head.worldCourse.axis, shift: head.worldCourse.shift, order: trunk.order, samples: HEAD.samples, gap: HEAD.gap });
      for (const d of loft.loft.diagnostics) diagnostics.push({ producer: "head.mass", level: d.level, contract: d.contract, detail: d.detail });
      if (loft.loft.chain === null) missing.push({ part: "head.mass", reason: "head.mass's loft published no chain" });
      else {
        const part: IAutoMovieViewPart = { ...loft.part, ...(loft.loft.chain.reliefs === undefined ? {} : { reliefs: loft.loft.chain.reliefs }) };
        parts.set(part.name, part);
        const node: IAutoMovieConstructionContinuation = {
          type: "continue",
          name: `continue.${part.name}.${trunk.name}`,
          host: root,
          hostFace: trunk.name,
          hostEnd: "top",
          part: { type: "source", name: part.name, source: part.name },
          partFace: part.name,
          partEnd: "bottom",
        };
        root = node;
        statuses.push({ node: node.name, kind: "continue", faces: [trunk.name, part.name] });

        // 2b. The auricles on head.mass's ports. Each ear part is chained
        // into the world: loft frame -> head frame (`IEar.place`) -> world
        // (`head.world`); the roots go to the world the same way, so f1_head's
        // port reads them against the world head.mass chain the tree carries.
        const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
        const world: AutoMovieHumanHeadBuild.IOutput["world"] = head.world;
        const ears: AutoMovieHumanHeadEarLoft.IEar[] = AutoMovieHumanHeadEarLoft.create(head.frame.dims.bitragion / 2);
        const placedEars: AutoMovieHumanHeadEarLoft.IEar[] = ears.map((ear: AutoMovieHumanHeadEarLoft.IEar): AutoMovieHumanHeadEarLoft.IEar => ({ ...ear, root: ear.root.map((p: [number, number, number]): [number, number, number] => S.apply(world, p)) }));
        const earPorts: Record<"left" | "right", AutoMovieHumanTrunkPorts.IPort> | null = AutoMovieHumanHeadEarPorts.create(loft.loft.chain, placedEars);
        if (earPorts === null) missing.push({ part: "ears", reason: "f1_head's AutoMovieHumanHeadEarPorts published no ports (head.mass has no surface or a root loop is empty)" });
        else
          for (const ear of ears) {
            const first: number | undefined = ear.loft.chain?.layers[0]?.y;
            const second: number | undefined = ear.loft.chain?.layers[1]?.y;
            if (first === undefined || second === undefined) {
              missing.push({ part: `ear.${ear.side}`, reason: "f1_head's ear loft published no chain" });
              continue;
            }
            const placedPart: IAutoMovieViewPart = { ...ear.part, axis: placed(ear.part.axis, (p: [number, number, number]): [number, number, number] => S.apply(world, ear.place(p))) };
            parts.set(placedPart.name, placedPart);
            const port: AutoMovieHumanTrunkPorts.IPort = earPorts[ear.side];
            const roots: [number, number, number][] = placedEars.find((e: AutoMovieHumanHeadEarLoft.IEar): boolean => e.side === ear.side)!.root;
            anchors[`ear.${ear.side}`] = [0, 1, 2].map((i: number): number => roots.reduce((t: number, p: [number, number, number]): number => t + p[i]!, 0) / roots.length) as [number, number, number];
            // The rail: the ear's root is its loft's first section, and the
            // port node admits only a rail strictly inside the part's
            // domain, so the band reaches the loft's next layer (f1_head's
            // 0.5 mm station step). Debt: a rail on the first section itself
            // (an end-to-end port) is not an admitted port premise.
            const rail: number = (second - first) / 1000;
            const node: IAutoMovieConstructionPort = {
              type: "port",
              name: `port.${port.name}`,
              host: root,
              hostFace: part.name,
              loop: { centre: [port.centre[0] / 1000, port.centre[1]], semi: [port.semi[0] / 1000, port.semi[1]], sense: port.sense },
              band: `band.${port.name}`,
              part: { type: "source", name: placedPart.name, source: placedPart.name },
              partFace: placedPart.name,
              partEnd: "bottom",
              rail,
              count: LIMITS.count,
              rows: rows(rail),
            };
            ports[port.name] = node;
            root = node;
            statuses.push({ node: node.name, kind: "port", faces: [part.name, placedPart.name, node.band] });
          }
      }
    }
    lap("head loft");

    // 3. The right arm, then the left, each on its shoulder port. The port
    // curve is f1_trunk's chart ellipse in millimetres on S00's chart
    // (station mm, phase rad), the node's in metres and radians; the rail is
    // the axilla level's posed station measured from the arm chain's first
    // station (its dome pole end, the part end the band faces).
    const shoulderPorts: AutoMovieHumanTrunkPorts.IOutput | null = AutoMovieHumanTrunkPorts.create(s00);
    lap("ports");
    for (const side of ["right", "left"] as const) {
      const arm: AutoMovieHumanF1Arm.IArm | string = AutoMovieHumanF1Arm.of(params, side, trunk, LIMITS.gap, s00);
      lap(`arm.${side}`);
      if (typeof arm === "string") {
        missing.push({ part: `arm.${side}`, reason: arm });
        continue;
      }
      if (shoulderPorts === null) {
        missing.push({ part: `arm.${side}`, reason: "f1_trunk's AutoMovieHumanTrunkPorts published no shoulder ports (S00 has no surface)" });
        continue;
      }
      arms[side] = arm;
      parts.set(arm.arm.name, arm.arm);
      let part: AutoMovieConstructionNode = { type: "source", name: arm.arm.name, source: arm.arm.name };
      if (arm.digits.length !== 0) {
        for (const digit of arm.digits) parts.set(digit.part.name, digit.part);
        // Every digit on its palm port (f1_arm's `AutoMovieHumanHandPorts`: a
        // round chart ellipse on the arm chain's palm whose perimeter equals
        // the digit's own section at its rail, the shoulders' pattern; all
        // five rings equal their ports since f1_arm's 14:56 palm tilt). A
        // digit without a published port falls back to the traced finger
        // tree.
        const handPorts: AutoMovieHumanHandPorts.IPort[] = AutoMovieHumanHandPorts.create(arm.chain, arm.digits);
        const ported: ReadonlySet<number> = new Set([1, 2, 3, 4, 5]);
        const traced: AutoMovieHumanHandDigits.IDigit[] = [];
        for (const digit of arm.digits) {
          const hp: AutoMovieHumanHandPorts.IPort | undefined = ported.has(digit.digit) ? handPorts.find((p: AutoMovieHumanHandPorts.IPort): boolean => p.name === digit.name) : undefined;
          if (hp === undefined) {
            traced.push(digit);
            continue;
          }
          const node: IAutoMovieConstructionPort = {
            type: "port",
            name: `port.${digit.name}`,
            host: part,
            hostFace: arm.arm.name,
            loop: { centre: [hp.centre[0] / 1000, hp.centre[1]], semi: [hp.semi[0] / 1000, hp.semi[1]], sense: hp.sense },
            band: `band.${digit.name}`,
            part: { type: "source", name: digit.part.name, source: digit.part.name },
            partFace: digit.part.name,
            partEnd: "bottom",
            rail: hp.rail / 1000,
            count: LIMITS.count,
            rows: rows(hp.rail / 1000),
          };
          ports[digit.name] = node;
          part = node;
          statuses.push({ node: node.name, kind: "port", faces: [arm.arm.name, digit.part.name, node.band] });
        }
        if (traced.length !== 0) part = AutoMovieHumanHandFingerTree.node(part, arm.arm.name, traced, arm.breadth);
      } else missing.push({ part: `fingers.${side}`, reason: arm.digitsRefused ?? "f1_arm published no digits" });
      const port: AutoMovieHumanTrunkPorts.IPort = shoulderPorts.shoulders[side];
      const rail: number = (arm.stations.axilla - arm.start) / 1000;
      const node: IAutoMovieConstructionPort = {
        type: "port",
        name: `port.${port.name}`,
        host: root,
        hostFace: trunk.name,
        loop: { centre: [port.centre[0] / 1000, port.centre[1]], semi: [port.semi[0] / 1000, port.semi[1]], sense: port.sense },
        band: `band.${port.name}`,
        part,
        partFace: arm.arm.name,
        partEnd: "bottom",
        rail,
        count: LIMITS.count,
        rows: rows(rail),
      };
      ports[port.name] = node;
      const [wrist, palm]: [number, number, number][] = [arm.centres[2]!, arm.centres[3]!];
      anchors[`hand.${side}`] = [(wrist[0] + palm[0]) / 2, (wrist[1] + palm[1]) / 2, (wrist[2] + palm[2]) / 2];
      root = node;
      statuses.push({ node: node.name, kind: "port", faces: [trunk.name, arm.arm.name, node.band] });
    }

    // 4. Both legs on S00's open crotch end, from the same S00.
    let legs: AutoMovieHumanLegBuild.IBody | null = null;
    try {
      legs = AutoMovieHumanLegBuild.body(params, s00);
    } catch (error: unknown) {
      missing.push({ part: "legs", reason: `f1_leg's build refused: ${error instanceof Error ? error.message : String(error)}` });
    }
    lap("legs");
    if (legs !== null) {
      for (const note of legs.diagnostics) diagnostics.push({ producer: "legs", level: 3, contract: "pants split", detail: note });
      const child: (side: "right" | "left") => IAutoMovieConstructionSplit.IChild | string = (side: "right" | "left"): IAutoMovieConstructionSplit.IChild | string => {
        const leg: AutoMovieHumanLegBuild.ISide = legs!.sides[side];
        if (leg.part === null || leg.chain === null) return `f1_leg published no ${side} leg part`;
        parts.set(leg.part.name, leg.part);
        // The rail's depth below the leg's open crotch-level end (its first
        // station), metres: the band spans the crotch ring to the gluteal
        // furrow, where f1_leg's hip-root band also meets the leg.
        const rail: number = (leg.rail - leg.chain.layers[0]!.y) / 1000;
        // f1_leg's crease window runs on its hip-root clock `h` from the back
        // midline (h = 0) to the buttock apex: h on [0, pi] is S00 phase
        // `pi - h` on the right, `pi + h` on the left, then the seam from the
        // front midline back. Each split band's clock runs its arc first from
        // the seam's end before it: the left band's arc, phases [pi, 2 pi],
        // starts at the back midline, so h = c and the window stays
        // `[0, apex]`; the right band's arc, phases [0, pi], starts at the
        // front midline, so h = pi - c (its chord, back to front on
        // [pi, 2 pi), is h = 3 pi - c) and the window becomes `[pi - apex, pi]`.
        const crease: IAutoMovieConstructionSplit.ICrease | undefined =
          leg.crease === null ? undefined : side === "left" ? { start: 0, end: leg.crease.apex, transition: leg.crease.transition } : { start: Math.PI - leg.crease.apex, end: Math.PI, transition: leg.crease.transition };
        // The toes on the leg-foot part, by f1_leg's own toe tree (each toe a
        // merge join onto the foot, `AutoMovieHumanFootToeTree`); the leg's
        // subtree is that tree, its face still the leg part. Debt: create()
        // also realizes the foot alone; a node-only constructor would spare it.
        let part: AutoMovieConstructionNode = { type: "source", name: leg.part.name, source: leg.part.name };
        if (leg.build.toes.length !== 0) {
          const toes: AutoMovieHumanFootToeTree.IOutput = AutoMovieHumanFootToeTree.create(leg.part, leg.build.toes);
          for (const toe of leg.build.toes) parts.set(toe.part.name, toe.part);
          for (const d of toes.diagnostics) diagnostics.push(d);
          part = toes.node;
        } else missing.push({ part: `toes.${side}`, reason: "f1_leg published no toes" });
        return { band: `band.hip.${side}`, part, partFace: leg.part.name, partEnd: "bottom", rail, ...(crease === undefined ? {} : { crease }) };
      };
      const right: IAutoMovieConstructionSplit.IChild | string = child("right");
      const left: IAutoMovieConstructionSplit.IChild | string = child("left");
      if (typeof right === "string" || typeof left === "string") missing.push({ part: "legs", reason: [right, left].filter((r: IAutoMovieConstructionSplit.IChild | string): r is string => typeof r === "string").join("; ") });
      else {
        const profile: IAutoMovieConstructionSplit.IProfile | string = crotch(s00);
        if (typeof profile === "string") missing.push({ part: "crotch seam", reason: `the split keeps the straight chord: ${profile}` });
        const node: IAutoMovieConstructionSplit = {
          type: "split",
          name: `split.${trunk.name}.legs`,
          host: root,
          hostFace: trunk.name,
          hostEnd: "bottom",
          seam: SPLIT.seam,
          ...(typeof profile === "string" ? {} : { profile }),
          count: SPLIT.count,
          rows: rows(Math.max(right.rail, left.rail)),
          children: [right, left],
        };
        split = node;
        root = node;
        statuses.push({ node: node.name, kind: "split", faces: [trunk.name, right.partFace, left.partFace, right.band, left.band] });
      }
    }

    // Realize once.
    const tree: AutoMovieHumanBodyTree.IOutput = AutoMovieHumanBodyTree.realize("f1", root, LIMITS, diagnostics, parts);
    lap("realize");
    const faces: Set<string> = new Set(tree.body.faces.map((f: { chain: string }): string => f.chain));
    return {
      s00,
      head,
      arms,
      legs,
      ports,
      anchors,
      split,
      parts,
      root,
      tree,
      statuses: statuses.map((s: { node: string; kind: IStatus["kind"]; faces: string[] }): IStatus => {
        const details: string[] = diagnostics.filter((d: AutoMovieLoftContract.IDiagnostic): boolean => d.producer === `tree.${s.node}`).map((d: AutoMovieLoftContract.IDiagnostic): string => `${d.contract}: ${d.detail}`);
        const kept: boolean = s.faces.every((f: string): boolean => faces.has(f)) && (s.kind !== "join" || faces.has(s.node));
        return { node: s.node, kind: s.kind, status: details.length === 0 && kept ? "realized" : "diagnostic", details };
      }),
      missing,
      diagnostics,
      ms,
    };
  }

  /**
   * An axis carried by a rigid map of its frame's space (a part lofted in
   * its own frame, chained into its parent's): each section plane's origin
   * by the map, its chart axes and every derivative by the map's linear part
   * (the map minus its value at the origin). When the linear part reflects
   * (determinant -1, a mirrored side or a handedness swap between frames),
   * the chart's `u` is negated, so the stations still advance along `v x u`
   * (`AutoMovieLoftFrame`) and the loft keeps its outward winding; the
   * section is then traced mirrored in `u`, which keeps its shape when its
   * `u` extents are symmetric about the course (both of f1_head's ear
   * outline pairs are `+-` the same value).
   *
   * @param axis The axis in the part's own frame.
   * @param map The rigid map into the parent frame, mm.
   */
  function placed(axis: AutoMovieViewAxis.IAxis, map: (p: [number, number, number]) => [number, number, number]): AutoMovieViewAxis.IAxis {
    type V = [number, number, number];
    const zero: V = map([0, 0, 0]);
    const linear: (d: readonly number[]) => V = (d: readonly number[]): V => {
      const q: V = map([d[0]!, d[1]!, d[2]!]);
      return [q[0] - zero[0], q[1] - zero[1], q[2] - zero[2]];
    };
    const [ex, ey, ez]: V[] = [linear([1, 0, 0]), linear([0, 1, 0]), linear([0, 0, 1])];
    const det: number = ex[0] * (ey[1] * ez[2] - ey[2] * ez[1]) - ex[1] * (ey[0] * ez[2] - ey[2] * ez[0]) + ex[2] * (ey[0] * ez[1] - ey[1] * ez[0]);
    const flip: number = det < 0 ? -1 : 1;
    const frame: (f: AutoMovieLoftFrame.IFrame, point: boolean) => AutoMovieLoftFrame.IFrame = (f: AutoMovieLoftFrame.IFrame, point: boolean): AutoMovieLoftFrame.IFrame => {
      const u: V = linear(f.u);
      return { origin: point ? map([f.origin[0], f.origin[1], f.origin[2]]) : linear(f.origin), u: [flip * u[0], flip * u[1], flip * u[2]], v: linear(f.v) };
    };
    const jet: AutoMovieViewAxis.IAxis["jet"] =
      axis.jet === undefined
        ? undefined
        : (station: number, parameter?: Parameters<NonNullable<AutoMovieViewAxis.IAxis["jet"]>>[1]): ReturnType<NonNullable<AutoMovieViewAxis.IAxis["jet"]>> => {
            const j: ReturnType<NonNullable<AutoMovieViewAxis.IAxis["jet"]>> = axis.jet!(station, parameter);
            return j === null ? null : { ...j, value: frame(j.value, true), first: frame(j.first, false), second: frame(j.second, false) };
          };
    return { at: (station: number): AutoMovieLoftFrame.IFrame => frame(axis.at(station), true), ...(jet === undefined ? {} : { jet }) };
  }
}
