import { AutoMovieLoftChain, AutoMovieMeshCourse, AutoMovieSolidChain, type IAutoMovieConstructionKnownPortSource, type IAutoMovieContourLoft64, type IAutoMovieLoftChain, type IAutoMovieSolidSurface, tessellateAutoMovieContourLoft64, tessellateAutoMovieContourStrip64 } from "@automovie/engine";

import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import type { AutoMovieHumanArmF1Lines } from "../arm/AutoMovieHumanArmF1Lines";
import { AutoMovieHumanArmViewCurves } from "../arm/AutoMovieHumanArmViewCurves";
import { AutoMovieHumanFairOutline } from "../arm/AutoMovieHumanFairOutline";
import { AutoMovieHumanTrunkPorts } from "../trunk/AutoMovieHumanTrunkPorts";
import { AutoMovieHumanHandDigits } from "./AutoMovieHumanHandDigits";
import { AutoMovieHumanHandConstruction } from "./AutoMovieHumanHandConstruction";
import leftThumb from "./AutoMovieHumanHandF1LeftThumb.json";
import { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;
/** Absolute points in the fixed hand's declared world chart. */
type V3 = Vec3;
/** Call-owned indexed geometry returned by the fixed F1 arm owner. */
type FixedMesh = AutoMovieHumanArmF1Lines.IFixedMesh;

/**
 * The palm's digit ports as known-port parent sides on the arm part's own
 * chart (station mm along the arm's course, phase rad), the shoulders'
 * pattern (`AutoMovieHumanTrunkPorts`), so each digit is banded to the palm
 * between equal rings with no intersection search (traced branch joins fail
 * where a digit crosses the palm at a grazing angle).
 *
 * Each port is centred where its digit's axis leaves the palm (bisection on
 * the axis between the digit's start inside the palm and its tip, inside
 * meaning nearer the arm's course than the palm's skin at the same station
 * and phase); that crossing's distance along the digit is the digit's rail
 * station. The port is an ellipse in the chart (`AutoMovieHumanTrunkPorts.ellipse`)
 * whose station and phase half-extents keep its world shape round (each
 * half-extent the same world length through the chart's local scales there)
 * and are scaled by bisection so its world perimeter on the palm equals the
 * digit's own section perimeter at its rail (Ramanujan's perimeter of the
 * digit's half-breadth and half-depth there). The digits' roots keep a gap
 * (`AutoMovieHumanHandDigits`), so the knuckle ports do not overlap; each
 * port records its least world gap to its neighbours.
 */
export namespace AutoMovieHumanHandPorts {
  /**
   * Return the accepted measured thumb sections in native world millimetres.
   * The seed, saddle and next healthy ring retain the qualified physical order.
   * The omitted sub-0.002 mm diagnostic rows remain in the observation receipt.
   * Lofting both close brackets caused the previous three strict crossings.
   */
  export function f1LeftThumb(): IAutoMovieContourLoft64 {
    return AutoMovieHumanHandConstruction.fixedContour(leftThumb);
  }

  /** Absolute fixed-section hand port data in the reference's native millimetre chart. */
  export interface IFixed {
    /** Measured thumb fork, exact palm start plane and outlet ownership. */
    branch: { model: IAutoMovieContourLoft64; thumb: number; origin: V3; axis: V3 };

    /** Four-finger fan, named outlets and observed inlet and outlet directions. */
    fan: { model: IAutoMovieContourLoft64; names: Record<"index" | "middle" | "ring" | "pinky", number>; normalFirst: V3; normalLast: V3; normalMiddle: V3 };

    /** Intervening source contour rings from the thumb fork to the finger fan. */
    hostRims: { points: V3[]; normal: V3 }[];

    /** Measured intervening contours from each detached port to its digit. */
    joins: Record<"thumb" | "index" | "ring" | "pinky", { normal: V3; between: { points: V3[]; normal: V3 }[] }>;

    /** Actual co-owning digit conic inputs and terminal controls. */
    digits: Record<"thumb" | "index" | "middle" | "ring" | "pinky", AutoMovieHumanHandDigits.IFixed>;
  }

  /** Sew the measured palm, fan and digits, leaving only the shared armscye open. */
  export function fixed(arm: FixedMesh, armscye: readonly V3[], input: IFixed): FixedMesh {
    /** Enter the native metre chart once while retaining every arm index. */
    const native: (mesh: FixedMesh) => FixedMesh = (mesh: FixedMesh): FixedMesh => ({
      positions: mesh.positions.map((v: number, i: number): number => v * (i % 3 === 2 ? -0.001 : 0.001)), indices: mesh.indices,
    });

    /** Keep qualified branch incidence and expose its exact evaluated port rings. */
    const loft: (model: IAutoMovieContourLoft64) => { mesh: FixedMesh; ring(section: number, loop: number): V3[] } = (model: IAutoMovieContourLoft64): { mesh: FixedMesh; ring(section: number, loop: number): V3[] } => {
      const generated: IAutoMovieContourLoft64.IResult = tessellateAutoMovieContourLoft64(model);
      if (generated.mesh.indices === null || generated.unresolved.length !== 0 || generated.stripObservations?.some(({ qualified }: NonNullable<IAutoMovieContourLoft64.IResult["stripObservations"]>[number]): boolean => !qualified))
        throw new Error(`The authored F1 hand branch has an unresolved strip: ${JSON.stringify(generated.unresolved)}`);
      return { mesh: { positions: generated.mesh.positions, indices: generated.mesh.indices },
        ring(section: number, loop: number): V3[] {
          const found: IAutoMovieContourLoft64.IResult["construction"][number] | undefined = generated.construction.find(({ id }: IAutoMovieContourLoft64.IResult["construction"][number]): boolean => id.endsWith(`.section.${section}.loop.${loop}`));
          if (found === undefined) throw new Error("The authored F1 port has no evaluated ring");
          return found.points;
        },
      };
    };

    /** Preserve the digit's original 72-phase root and measured conic course. */
    const makeDigit: (name: keyof IFixed["digits"]) => { mesh: FixedMesh; rim: V3[] } = (name: keyof IFixed["digits"]): { mesh: FixedMesh; rim: V3[] } => {
      const mesh: FixedMesh = native(AutoMovieHumanHandDigits.fixed(input.digits[name]));
      return { mesh, rim: Array.from({ length: 72 }, (_: unknown, i: number): V3 => mesh.positions.slice(i * 3, i * 3 + 3) as V3) };
    };

    // The middle digit continues the open fan. Every other digit owns its
    // own measured closed exit and independent turned section course.
    const fan: ReturnType<typeof loft> = loft(input.fan.model), middle: ReturnType<typeof makeDigit> = makeDigit("middle");
    const lastFan: number = input.fan.model.sections.length - 1;
    const fanWithMiddle: IIndexedMesh = joinRims(fan.mesh, middle.mesh, fan.ring(lastFan, input.fan.names.middle), middle.rim, [input.fan.normalLast, input.fan.normalMiddle]);
    const branch: ReturnType<typeof loft> = loft(input.branch.model), body: FixedMesh = native(arm);
    const lastBranch: number = input.branch.model.sections.length - 1;
    const { origin, axis, thumb }: IFixed["branch"] = input.branch;
    const palm: IIndexedMesh = sewExactRim(body, branch.mesh, exactFreeRim(body, origin, axis), exactFreeRim(branch.mesh, origin, axis));
    let hand: IIndexedMesh = joinRims(palm, fanWithMiddle, branch.ring(lastBranch, 1 - thumb), fan.ring(0, 0), [axis, input.fan.normalFirst], input.hostRims);
    for (const name of ["thumb", "index", "ring", "pinky"] as const) {
      const digit: ReturnType<typeof makeDigit> = makeDigit(name);
      const ring: V3[] = name === "thumb" ? branch.ring(lastBranch, thumb) : fan.ring(lastFan, input.fan.names[name]);
      const next: IFixed["joins"][typeof name] = input.joins[name];
      hand = joinRims(hand, digit.mesh, ring, digit.rim, [name === "thumb" ? axis : input.fan.normalLast, next.normal], next.between);
    }

    auditSkin(hand, armscye);
    const positions: number[] = [...arm.positions];
    for (let i: number = positions.length; i < hand.positions.length; i += 3)
      positions.push(hand.positions[i]! * 1000, hand.positions[i + 1]! * 1000, -hand.positions[i + 2]! * 1000);
    return { positions, indices: [...hand.indices] };
  }

  /** Require a single expected free seam and reciprocal direction on every sewn edge. */
  export function auditSkin(mesh: IIndexedMesh, root: readonly V3[]): void {
    const edges: Map<string, { a: number; b: number; count: number; winding: number }> = new Map();
    for (let i: number = 0; i < mesh.indices.length; i += 3)
      for (let j: number = 0; j < 3; ++j) {
        const a: number = mesh.indices[i + j]!, b: number = mesh.indices[i + (j + 1) % 3]!;
        const key: string = a < b ? `${a}:${b}` : `${b}:${a}`;
        const direction: number = a < b ? 1 : -1;
        const known: ReturnType<typeof edges.get> = edges.get(key);
        if (known) {
          ++known.count;
          known.winding += direction;
        } else edges.set(key, { a, b, count: 1, winding: direction });
      }
    const key: (a: string, b: string) => string = (a: string, b: string): string => a < b ? `${a}:${b}` : `${b}:${a}`;
    const expected: string[] = root.map(([x, y, z]: V3): string => [x * 0.001, y * 0.001, -z * 0.001].join(","));
    const seam: Set<string> = new Set(expected.map((a: string, i: number): string => key(a, expected[(i + 1) % expected.length]!)));
    const point: (index: number) => string = (index: number): string => mesh.positions.slice(3 * index, 3 * index + 3).join(",");
    for (const { a, b, count, winding } of edges.values()) {
      if (count === 1 && seam.delete(key(point(a), point(b)))) continue;
      if (count !== 2 || winding !== 0) throw new Error("Hand assembly has an unexpected free or inconsistently oriented edge");
    }
    if (seam.size !== 0) throw new Error("Hand assembly changed a shared armscye edge");
  }

  /** Immutable indexed operand in the join's declared metre chart. */
  type IIndexedMesh = { positions: readonly number[]; indices: readonly number[] };
  /** A complete free cycle retaining both mesh identity and physical order. */
  type IFreeRim = { ids: number[]; points: V3[] };

  /** Find the one complete open contour in its authored plane. */
  export function exactFreeRim(mesh: IIndexedMesh, originMm: V3, normal: V3): IFreeRim {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const edges: Map<string, { a: number; b: number; count: number }> = new Map();
    const point: (index: number) => V3 = (index: number): V3 => mesh.positions.slice(index * 3, index * 3 + 3) as V3;
    const inPlane: (index: number) => boolean = (index: number): boolean => Math.abs(S.dot(AutoMovieHumanHandVector.sub(AutoMovieHumanHandVector.scale(point(index), 1000), originMm), normal)) < 1e-6;
    for (let i: number = 0; i < mesh.indices.length; i += 3)
      for (let j: number = 0; j < 3; ++j) {
        const a: number = mesh.indices[i + j]!;
        const b: number = mesh.indices[i + (j + 1) % 3]!;
        if (!inPlane(a) || !inPlane(b)) continue;
        const key: string = a < b ? `${a}:${b}` : `${b}:${a}`;
        const prior: ReturnType<typeof edges.get> = edges.get(key);
        if (prior) ++prior.count;
        else edges.set(key, { a, b, count: 1 });
      }
    const free: Map<number, number> = new Map();
    const incoming: Set<number> = new Set();
    for (const { a, b, count } of edges.values()) if (count === 1) {
      if (free.has(a) || incoming.has(b)) throw new Error("The actual terminal plane has a branched free edge");
      free.set(a, b);
      incoming.add(b);
    }
    if (free.size < 3) throw new Error("The actual terminal plane has no complete free ring");
    const start: number = free.keys().next().value!;
    const ids: number[] = [start];
    for (let i: number = start; free.get(i) !== start;) {
      const next: number | undefined = free.get(i);
      if (next === undefined || ids.length >= free.size || ids.includes(next))
        throw new Error("The actual terminal edge does not return to its first vertex");
      ids.push(next);
      i = next;
    }
    if (ids.length !== free.size) throw new Error("The actual terminal plane has more than one free ring");
    return { ids, points: ids.map(point) };
  }

  /** Add a source patch that owns the same rim, preserving the original vertex indices. */
  export function sewExactRim(
    before: IIndexedMesh,
    after: IIndexedMesh,
    root: IFreeRim,
    next: IFreeRim,
  ): { positions: number[]; indices: number[]; shared: number } {
    const positions: number[] = [...before.positions];
    const matches: number[] = next.points.map((point: V3): number => {
      const close: number[] = root.points.flatMap((other: V3, i: number): number[] =>
        Math.hypot(...AutoMovieHumanHandVector.sub(point, other)) < 1e-10 ? [i] : []);
      if (close.length !== 1) throw new Error("The new branch does not match one exact existing palm edge vertex");
      return close[0]!;
    });
    if (matches.length !== root.ids.length || new Set(matches).size !== root.ids.length)
      throw new Error(`The palm rim count changed (${root.ids.length} original versus ${matches.length} branch, ${new Set(matches).size} unique matches)`);
    const forward: boolean = matches.every((index: number, i: number): boolean =>
      (index + 1) % root.ids.length === matches[(i + 1) % matches.length]);
    const reverse: boolean = matches.every((index: number, i: number): boolean =>
      (index + root.ids.length - 1) % root.ids.length === matches[(i + 1) % matches.length]);
    if (forward === reverse)
      throw new Error("The branch did not retain the original indexed palm edge order");
    const remap: Map<number, number> = new Map(next.ids.map((index: number, i: number): [number, number] => [index, root.ids[matches[i]!]!]));
    const indices: number[] = after.indices.map((index: number): number => {
      const prior: number | undefined = remap.get(index);
      if (prior !== undefined) return prior;
      const created: number = positions.length / 3;
      positions.push(...after.positions.slice(index * 3, index * 3 + 3));
      remap.set(index, created);
      return created;
    });
    if (forward)
      for (let i: number = 0; i < indices.length; i += 3)
        [indices[i + 1], indices[i + 2]] = [indices[i + 2]!, indices[i + 1]!];
    return { positions, indices: [...before.indices, ...indices], shared: matches.length };
  }

  /** Join existing mesh rims through ordered measured contours without changing their point identities. */
  export function joinRims(
    fan: { positions: readonly number[]; indices: readonly number[] },
    middle: { positions: readonly number[]; indices: readonly number[] },
    fanRing: V3[],
    middleRing: V3[],
    normals: [V3, V3],
    between: { points: V3[]; normal: V3 }[] = [],
  ): IIndexedMesh {
    const positions: number[] = [...fan.positions, ...middle.positions];
    const base: number = fan.positions.length / 3;
    const directedFree: (indices: readonly number[]) => Map<string, 1 | -1 | 0> = (indices: readonly number[]): Map<string, 1 | -1 | 0> => {
      const edges: Map<string, 1 | -1 | 0> = new Map();
      for (let i: number = 0; i < indices.length; i += 3) {
        for (let j: number = 0; j < 3; ++j) {
          const a: number = indices[i + j]!;
          const b: number = indices[i + (j + 1) % 3]!;
          const key: string = a < b ? `${a}:${b}` : `${b}:${a}`;
          edges.set(key, edges.has(key) ? 0 : a < b ? 1 : -1);
        }
      }
      return edges;
    };
    const fanEdges: ReturnType<typeof directedFree> = directedFree(fan.indices);
    const middleEdges: ReturnType<typeof directedFree> = directedFree(middle.indices);
    const key: (a: number, b: number) => string = (a: number, b: number): string => a < b ? `${a}:${b}` : `${b}:${a}`;
    const pointKey: (point: V3) => string = (point: V3): string => point.join(",");
    const idsOf: (mesh: IIndexedMesh, edges: Map<string, 1 | -1 | 0>, ring: V3[]) => number[] = (mesh: IIndexedMesh, edges: Map<string, 1 | -1 | 0>, ring: V3[]): number[] => {
      const freeVertices: Map<string, number[]> = new Map();
      for (const [edge, direction] of edges)
        if (direction !== 0)
          for (const id of edge.split(":").map(Number)) {
            const xyz: string = pointKey(mesh.positions.slice(id * 3, id * 3 + 3) as V3);
            const found: number[] = freeVertices.get(xyz) ?? [];
            if (!found.includes(id)) found.push(id);
            freeVertices.set(xyz, found);
          }
      return ring.map((point: V3): number => {
        const found: number[] = freeVertices.get(pointKey(point)) ?? [];
        if (found.length !== 1) throw new Error("The construction point has no unique free mesh vertex");
        return found[0]!;
      });
    };
    const fanIds: number[] = idsOf(fan, fanEdges, fanRing);
    const middleIds: number[] = idsOf(middle, middleEdges, middleRing);
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    // Align physical perimeter directions before lofting. The indexed
    // triangle winding is normalized separately once the seams are checked.
    const physicalSigns: [number, number] = [fanRing, middleRing].map((ring: V3[], i: number): number =>
      Math.sign(S.dot(AutoMovieMeshCourse.newell(ring), normals[i]!))) as [number, number];
    if (physicalSigns.includes(0)) throw new Error("A source rim does not have a physical orientation on its actual plane");
    if (physicalSigns[0] !== physicalSigns[1]) {
      middleIds.reverse();
      middleRing.reverse();
    }
    const identity: Map<V3, number> = new Map([
      ...fanRing.map((point: V3, i: number): [V3, number] => [point, fanIds[i]!]),
      ...middleRing.map((point: V3, i: number): [V3, number] => [point, base + middleIds[i]!]),
    ]);
    const patch: number[] = [];
    const inner: number[][] = [];
    const rings: V3[][] = [fanRing];
    for (const section of between) {
      const direction: number = Math.sign(S.dot(AutoMovieMeshCourse.newell(section.points), section.normal));
      if (direction === 0) throw new Error("An original intermediate ring is degenerate");
      const points: V3[] = direction === physicalSigns[0] ? section.points : [...section.points].reverse();
      inner.push(points.map((p: V3): number => {
        const id: number = positions.length / 3;
        positions.push(...p);
        identity.set(p, id);
        return id;
      }));
      rings.push(points);
    }
    rings.push(middleRing);
    for (let i: number = 0; i + 1 < rings.length; ++i)
      tessellateAutoMovieContourStrip64(rings[i]!, rings[i + 1]!, (a: V3, b: V3, c: V3): void => {
        for (const point of [a, b, c]) {
          const id: number | undefined = identity.get(point);
          if (id === undefined) throw new Error("The measured strip added an unowned point");
          patch.push(id);
        }
      }, (point: V3): string | undefined => identity.get(point)?.toString(),
      ({ qualified, diagnostics }: Parameters<NonNullable<Parameters<typeof tessellateAutoMovieContourStrip64>[4]>>[0]): void => {
        if (!qualified) throw new Error(`The measured strip was unqualified: ${diagnostics.join("; ")}`);
      });
    const use: Map<string, number[]> = new Map();
    for (let i: number = 0; i < patch.length; i += 3)
      for (let j: number = 0; j < 3; ++j) {
        const a: number = patch[i + j]!, b: number = patch[i + (j + 1) % 3]!;
        const edge: string = key(a, b);
        use.set(edge, [...(use.get(edge) ?? []), a < b ? 1 : -1]);
      }
    for (const ids of inner)
      if (ids.some((a: number, i: number): boolean => {
        const list: number[] = use.get(key(a, ids[(i + 1) % ids.length]!)) ?? [];
        return list.length !== 2 || list[0] === list[1];
      })) throw new Error("An intermediate ring does not share every actual edge twice in opposite directions");
    const shiftedMiddle: number[] = middle.indices.map((index: number): number => base + index);
    const shifts: (ids: number[]) => number[] = (ids: number[]): number[] => ids.map((index: number): number => base + index);
    const middleWorldIds: number[] = shifts(middleIds);
    const parts: ReturnType<typeof directedFree>[] = [fanEdges, directedFree(shiftedMiddle)];
    const patchEdges: ReturnType<typeof directedFree> = directedFree(patch);
    const seamSigns: number[] = [fanIds, middleWorldIds].map((ids: number[], r: number): number => {
      const signs: Set<number> = new Set(ids.map((a: number, i: number): number => {
        const b: number = ids[(i + 1) % ids.length]!;
        const edge: string = key(a, b);
        return (parts[r]!.get(edge) ?? 0) * (patchEdges.get(edge) ?? 0);
      }));
      if (signs.size !== 1 || signs.has(0)) throw new Error("The strip did not reuse every exact ordered boundary edge");
      return [...signs][0]!;
    });
    const flip: (triangles: number[]) => void = (triangles: number[]): void => {
      for (let i: number = 0; i < triangles.length; i += 3)
        [triangles[i + 1], triangles[i + 2]] = [triangles[i + 2]!, triangles[i + 1]!];
    };
    const flippedPatch: boolean = seamSigns[0] === 1;
    const flippedDownstream: boolean = seamSigns[0] !== seamSigns[1];
    if (flippedPatch) flip(patch);
    if (flippedDownstream) flip(shiftedMiddle);
    return { positions, indices: [...fan.indices, ...shiftedMiddle, ...patch] };
  }

  /** One digit's port on the palm. */
  export interface IPort extends Omit<AutoMovieHumanTrunkPorts.IPort, "frame"> {
    /** The digit's rail: its station (mm from its part's start) where it leaves the palm, the child's root ring. */
    rail: number;

    /** Least world distance from this port's curve to any other port's curve, mm. */
    gap: number;
  }

  /**
   * The ports of one hand's digits on the arm chain's palm.
   *
   * @param arm The arm's lofted chain (the palm is its distal end).
   * @param digits The hand's digits.
   */
  export function create(arm: IAutoMovieLoftChain, digits: readonly AutoMovieHumanHandDigits.IDigit[]): IPort[] {
    const field: IAutoMovieSolidSurface | null = AutoMovieSolidChain.surface(arm);
    if (field === null) return [];
    const first: number = arm.layers[0]!.y;
    const last: number = arm.layers[arm.layers.length - 1]!.y;
    const ports: Omit<IPort, "gap">[] = digits.map((d: AutoMovieHumanHandDigits.IDigit): Omit<IPort, "gap"> => {
      // The digit's axis leaves the palm between its start (inside) and its tip (outside).
      const along = (t: number): Vec3 => [d.root[0] + d.axes.distal[0] * t, d.root[1] + d.axes.distal[1] * t, d.root[2] + d.axes.distal[2] * t];
      let lo: number = 0;
      let hi: number = d.length;
      for (let k: number = 0; k < 40; ++k) {
        const mid: number = (lo + hi) / 2;
        if (locate(arm, along(mid), first, last).inside) lo = mid;
        else hi = mid;
      }
      const rail: number = (lo + hi) / 2;
      const at: { station: number; phase: number; inside: boolean } = locate(arm, along(rail), first, last);
      // The digit's own section perimeter at its rail.
      const half = (knots: readonly AutoMovieHumanHandDigits.IKnot[]): number =>
        AutoMovieHumanFairOutline.evaluate(
          knots.map((k: AutoMovieHumanHandDigits.IKnot): number => k.q),
          knots.map((k: AutoMovieHumanHandDigits.IKnot): AutoMovieHumanFairOutline.IJet => ({ value: k.value, first: k.first, second: k.second })),
          -Math.sqrt(Math.max(0, d.length - rail)),
        )[0];
      const girth: number = AutoMovieHumanArmViewCurves.ramanujan(half(d.knots), half(d.depth));
      // A round world shape: each half-extent the same world length through the chart's local scales, then scaled to the girth.
      const jet: IAutoMovieSolidSurface.IJet = field.jet(at.station, at.phase);
      const su: number = Math.hypot(jet.u[0]!, jet.u[1]!, jet.u[2]!);
      const sv: number = Math.hypot(jet.v[0]!, jet.v[1]!, jet.v[2]!);
      const centre: [number, number] = [at.station, at.phase];
      // The station half-extent stays inside the palm chart's owned stations (near the palm's pole there is little room);
      // the phase half-extent then carries the rest of the girth, within 1.2 rad.
      const room: number = 0.95 * Math.min(last - at.station, at.station - first);
      const shape = (r: number): [number, number] => [Math.min(r / su, room), Math.min(r / sv, 1.2)];
      let a: number = 0.01;
      let b: number = 60;
      for (let k: number = 0; k < 50; ++k) {
        const r: number = (a + b) / 2;
        if (perimeter(field, AutoMovieHumanTrunkPorts.ellipse(centre, shape(r), 1)) < girth) a = r;
        else b = r;
      }
      const semi: [number, number] = shape((a + b) / 2);
      const map: IAutoMovieConstructionKnownPortSource.IMap = AutoMovieHumanTrunkPorts.ellipse(centre, semi, 1);
      return {
        name: d.name,
        centre,
        semi,
        sense: 1,
        girth,
        perimeter: perimeter(field, map),
        field,
        map,
        rail,
        curve: (c: number): Vec3 => world(field, map.point(c, 0)),
        jet: (c: number, v: number = 0): IAutoMovieSolidSurface.IJet => compose(field, map.jet(c, v)),
        basis: "where the digit's axis leaves the palm; a round world ellipse sized to the digit's section perimeter at that rail",
      };
    });
    return ports.map((p: Omit<IPort, "gap">, i: number): IPort => {
      let gap: number = Infinity;
      const mine: Vec3[] = Array.from({ length: 48 }, (_: unknown, k: number): Vec3 => p.curve((2 * Math.PI * k) / 48));
      ports.forEach((q: Omit<IPort, "gap">, j: number): void => {
        if (i === j) return;
        for (let k: number = 0; k < 48; ++k) {
          const o: Vec3 = q.curve((2 * Math.PI * k) / 48);
          for (const m of mine) gap = Math.min(gap, Math.hypot(m[0] - o[0], m[1] - o[1], m[2] - o[2]));
        }
      });
      return { ...p, gap };
    });
  }

  /** A world point's arm-chart station and phase, and whether it lies nearer the course than the skin there. */
  function locate(arm: IAutoMovieLoftChain, p: Vec3, first: number, last: number): { station: number; phase: number; inside: boolean } {
    // The station whose section plane passes through the point (planes advance monotonically along the course).
    const side = (s: number): number => {
      const f: { origin: readonly number[]; u: readonly number[]; v: readonly number[] } = AutoMovieLoftChain.frame(arm, s);
      const n: Vec3 = [f.u[1]! * f.v[2]! - f.u[2]! * f.v[1]!, f.u[2]! * f.v[0]! - f.u[0]! * f.v[2]!, f.u[0]! * f.v[1]! - f.u[1]! * f.v[0]!];
      return (p[0] - f.origin[0]!) * n[0] + (p[1] - f.origin[1]!) * n[1] + (p[2] - f.origin[2]!) * n[2];
    };
    let lo: number = first;
    let hi: number = last;
    const sign: number = Math.sign(side(hi) - side(lo)) || 1;
    for (let k: number = 0; k < 50; ++k) {
      const mid: number = (lo + hi) / 2;
      if (side(mid) * sign < 0) lo = mid;
      else hi = mid;
    }
    const station: number = (lo + hi) / 2;
    const axis: readonly number[] = AutoMovieLoftChain.axis(arm, station);
    // The phase whose skin point is nearest the point's direction from the axis.
    let phase: number = 0;
    let best: number = Infinity;
    for (let k: number = 0; k < 360; ++k) {
      const phi: number = (2 * Math.PI * k) / 360;
      const q: readonly number[] = AutoMovieLoftChain.point(arm, station, phi);
      const d: number = Math.hypot(q[0]! - p[0], q[1]! - p[1], q[2]! - p[2]);
      const along: number = (q[0]! - axis[0]!) * (p[0] - axis[0]!) + (q[1]! - axis[1]!) * (p[1] - axis[1]!) + (q[2]! - axis[2]!) * (p[2] - axis[2]!);
      if (along > 0 && d < best) [best, phase] = [d, phi];
    }
    const skin: readonly number[] = AutoMovieLoftChain.point(arm, station, phase);
    const inside: boolean = Math.hypot(p[0] - axis[0]!, p[1] - axis[1]!, p[2] - axis[2]!) < Math.hypot(skin[0]! - axis[0]!, skin[1]! - axis[1]!, skin[2]! - axis[2]!);
    return { station, phase, inside };
  }

  /** The world total2 in the band rectangle by the chain rule over the map's chart jet (as `AutoMovieHumanTrunkPorts`). */
  function compose(field: IAutoMovieSolidSurface, m: IAutoMovieConstructionKnownPortSource.IJet | null): IAutoMovieSolidSurface.IJet {
    if (m === null) throw new Error("hand port: the parent map has no jet there");
    const s: IAutoMovieSolidSurface.IJet = field.jet(m.p[0], m.p[1]);
    const lin = (a: readonly number[]): Vec3 => [0, 1, 2].map((k: number): number => s.u[k]! * a[0]! + s.v[k]! * a[1]!) as Vec3;
    const quad = (a: readonly number[], b: readonly number[], second: readonly number[]): Vec3 =>
      [0, 1, 2].map((k: number): number => s.uu[k]! * a[0]! * b[0]! + s.uv[k]! * (a[0]! * b[1]! + a[1]! * b[0]!) + s.vv[k]! * a[1]! * b[1]! + s.u[k]! * second[0]! + s.v[k]! * second[1]!) as Vec3;
    return { p: [s.p[0]!, s.p[1]!, s.p[2]!], u: lin(m.u), v: lin(m.v), uu: quad(m.u, m.u, m.uu), uv: quad(m.u, m.v, m.uv), vv: quad(m.v, m.v, m.vv) };
  }

  /** World point of a chart point on the field. */
  function world(field: IAutoMovieSolidSurface, chart: [number, number]): Vec3 {
    const p: readonly number[] = field.point !== undefined ? field.point(chart[0], chart[1]) : field.jet(chart[0], chart[1]).p;
    return [p[0]!, p[1]!, p[2]!];
  }

  /** World perimeter of a port map's curve on the field, 128-gon. */
  function perimeter(field: IAutoMovieSolidSurface, map: IAutoMovieConstructionKnownPortSource.IMap): number {
    let total: number = 0;
    let previous: Vec3 = world(field, map.point(0, 0));
    for (let k: number = 1; k <= 128; ++k) {
      const next: Vec3 = world(field, map.point((2 * Math.PI * k) / 128, 0));
      total += Math.hypot(next[0] - previous[0], next[1] - previous[1], next[2] - previous[2]);
      previous = next;
    }
    return total;
  }
}
