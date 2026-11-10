import fs from "node:fs";

import {
  AutoMovieMeshCourse,
  type IAutoMovieContourLoft64,
  type IAutoMovieCurve64,
  tessellateAutoMovieContourLoft64,
} from "@automovie/engine";
import { type IAutoMovieRecoverySlabObservation, observeAutoMovieRecoverySections } from "@automovie/recovery";

import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanArmF1Pose } from "../generation/arm/AutoMovieHumanArmF1Pose";
import { AutoMovieHumanHandPorts } from "../generation/hand/AutoMovieHumanHandPorts";
import type { CaptureModel } from "../inspection/CaptureModel";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeArmDraw } from "./NodeArmDraw";
import { NodeArmFingerFan } from "./NodeArmFingerFan";
import { NodeArmNativeSaddle } from "./NodeArmNativeSaddle";

/** Assemble native hand and digit surfaces on their observed world-space rims. */
export namespace NodeArmHandSkin {
  type V3 = CaptureModel.Vec3;
  type Digit = "thumb" | "index" | "middle" | "ring" | "pinky";
  const { auditSkin, exactFreeRim, joinRims, sewExactRim }: typeof AutoMovieHumanHandPorts = AutoMovieHumanHandPorts;

  interface IInput {
    side: "left" | "right";
    raw: CaptureModel.ITriangles;
    arm: CaptureModel.ITriangles;
    armscye: readonly V3[];
    digit(digit: Digit, first: number): Promise<CaptureModel.ITriangles>;
  }

  /**
   * Continue the measured open palm through her thumb and finger divisions.
   * All junctions are ordinary lofts between actual source contours. The
   * distinct digit courses begin on their next recorded, non-overlapping planes.
   */
  export async function create(input: IInput): Promise<{ mesh: CaptureModel.ITriangles; diagnostics: string[] }> {
    const archive: string = ".references/curves/bezier/f1/limbs";
    const side: "l" | "r" = input.side === "left" ? "l" : "r";
    const name: string = `middle_${side}`;
    const read = <T>(file: string): T => JSON.parse(fs.readFileSync(HumanNodePaths.resolve(file), "utf8")) as T;
    const rowsOf = (family: string, version: string): IPhysicalDigitRow[] =>
      read<{ stations: IPhysicalDigitRow[] }>(`${archive}/${family}/${family}-${version}-001.json`).stations;
    const whole: IPhysicalDigitRow[] = rowsOf(name, "v3");
    const indexRecord = read<{ families: { name: string; meta: { index?: number } }[] }>(`${archive}/index.json`);
    const native = (mesh: CaptureModel.ITriangles): IIndexedMesh => {
      const positions: number[] = [];
      for (let i: number = 0; i < mesh.positions.length; i += 3)
        positions.push(mesh.positions[i]! * 0.001, mesh.positions[i + 1]! * 0.001, -mesh.positions[i + 2]! * 0.001);
      return { positions, indices: mesh.indices };
    };
    const raw: IIndexedMesh = native(input.raw);
    const arm: IIndexedMesh = native(input.arm);
    const verticesMm: V3[] = [];
    const triangles: [number, number, number][] = [];
    for (let i: number = 0; i < input.raw.positions.length; i += 3)
      verticesMm.push([input.raw.positions[i]!, input.raw.positions[i + 1]!, -input.raw.positions[i + 2]!]);
    for (let i: number = 0; i < raw.indices.length; i += 3)
      triangles.push([raw.indices[i]!, raw.indices[i + 1]!, raw.indices[i + 2]!]);
    const makeDigit = async (name: Digit, first: number): Promise<{ mesh: IIndexedMesh; rim: V3[] }> => {
      const mesh: IIndexedMesh = native(await input.digit(name, first));
      const rim: V3[] = Array.from({ length: 72 }, (_: unknown, i: number): V3 =>
        mesh.positions.slice(3 * i, 3 * i + 3) as V3);
      return { mesh, rim };
    };
    const observed: NodeArmFingerFan.IResult = NodeArmFingerFan.create(side, whole, verticesMm, triangles);
    const middle: Awaited<ReturnType<typeof makeDigit>> = await makeDigit("middle", 11);
    const fan: IIndexedMesh = joinRims(observed.mesh,
      middle.mesh, observed.distal.middle, middle.rim, [whole[10]!.normal, whole[11]!.normal]);
    const armRows: IPhysicalDigitRow[] = rowsOf(`arm_${side}`, "v2");
    const thumbRows: IPhysicalDigitRow[] = rowsOf(`thumb_${side}`, "v3");
    const branch = palmThumbBranch(side, arm, armRows, thumbRows, verticesMm, triangles);
    const proximal: V3[] = observed.proximal;
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const distance = (p: V3, origin: V3, normal: V3): number =>
      S.dot(NodeArmDraw.sub(NodeArmDraw.scale(p, 1000), origin), normal);
    const ordered = (before: V3[], after: V3[], a: V3, b: V3, na: V3, nb: V3): boolean =>
      before.every((p): boolean => distance(p, b, nb) < 0) && after.every((p): boolean => distance(p, a, na) > 0);
    if (!ordered(branch.host, proximal, branch.afterOrigin, whole[4]!.originMm, branch.normal, whole[4]!.normal))
      throw new Error("The measured palm and finger-fan rims cross their original planes");
    const palm = sewExactRim(arm, branch.mesh, branch.palm, branch.root);
    const hostSections: IPhysicalDigitRow[] = side === "r" ? armRows.slice(146, 148) : [];
    const hostRims: { points: V3[]; normal: V3 }[] = hostSections.map((row: IPhysicalDigitRow) => ({
      points: NodeArmFingerFan.sample(row.loops[0]!.curve).map((p): V3 => NodeArmDraw.scale(p, 0.001)), normal: row.normal,
    }));
    for (let i: number = 0; i < hostRims.length; ++i) {
      const row: IPhysicalDigitRow = hostSections[i]!;
      const prior: IPhysicalDigitRow | undefined = hostSections[i - 1];
      if (!ordered(hostRims[i - 1]?.points ?? branch.host, hostRims[i]!.points,
        prior?.originMm ?? branch.afterOrigin, row.originMm, prior?.normal ?? branch.normal, row.normal) ||
        !ordered(hostRims[i]!.points, proximal, row.originMm, whole[4]!.originMm, row.normal, whole[4]!.normal))
        throw new Error("The measured right palm sections overlap the finger-fan planes");
    }
    if (side === "l") {
      // Follow the original closed cut between s84 and the turned finger-fan plane.
      const bridge = NodeArmFingerFan.between(raw, branch.host, proximal, [branch.afterOrigin, whole[4]!.originMm], [branch.normal, whole[4]!.normal], whole[4]!.u);
      if (bridge.ring === undefined) throw new Error("The original left palm has no ordered continuation to the finger fan");
      hostRims.push(bridge.ring);
    }
    let hand: IIndexedMesh = joinRims(palm, fan, [...branch.host], [...proximal], [branch.normal, whole[4]!.normal], hostRims);
    const receipts: string[] = [];
    for (const digit of ["thumb", "index", "ring", "pinky"] as const) {
      const family: string = `${digit}_${side}`;
      const root: number | undefined = indexRecord.families.find((row): boolean => row.name === `${family}-root-v3`)?.meta.index;
      const digitRows: IPhysicalDigitRow[] = digit === "thumb" ? thumbRows : rowsOf(family, "v3");
      const sourceRim: V3[] = digit === "thumb" ? branch.thumb : observed.distal[digit];
      if (root === undefined) throw new Error(`The original ${digit} port is missing`);
      const origin: V3 = digit === "thumb" ? branch.afterOrigin : whole[10]!.originMm;
      const normal: V3 = digit === "thumb" ? branch.normal : whole[10]!.normal;
      const archiveRing = (row: IPhysicalDigitRow): V3[] => NodeArmFingerFan.sample(row.loops[0]!.curve).map((p): V3 => NodeArmDraw.scale(p, 0.001));
      const first: IPhysicalDigitRow | undefined = digitRows.find((row): boolean => row.station >= root && row.loops.length === 1 &&
        ordered(sourceRim, archiveRing(row), origin, row.originMm, normal, row.normal));
      if (!first) throw new Error(`No measured ${digit} section follows the palm port`);
      const firstRing: V3[] = archiveRing(first);
      const between = NodeArmFingerFan.between(raw, sourceRim, firstRing, [origin, first.originMm], [normal, first.normal], first.u);
      if (!between.ring) throw new Error(`No qualified original cut for ${digit}: ${JSON.stringify(between.receipt)}`);
      const next: IPhysicalDigitRow | undefined = digitRows.find((row): boolean => row.station > first.station && row.loops.length === 1);
      if (!next) throw new Error(`The original ${digit} has no next section`);
      const made: Awaited<ReturnType<typeof makeDigit>> = await makeDigit(digit, next.station);
      if (!ordered(firstRing, made.rim, first.originMm, next.originMm, first.normal, next.normal))
        throw new Error(`The first measured ${digit} conic crosses its original rim`);
      hand = joinRims(hand, made.mesh, [...sourceRim], made.rim, [normal, next.normal],
        [between.ring, { points: firstRing, normal: first.normal }]);
      receipts.push(`${digit} ${first.station}→${next.station}, ${sourceRim.length} indexed port edges`);
    }
    auditSkin(hand, input.armscye);
    // Every join appends geometry. Keep the already verified arm's exact
    // millimetre prefix, including its canonical shared armscye positions.
    const positions: number[] = [...input.arm.positions];
    for (let i: number = positions.length; i < hand.positions.length; i += 3)
      positions.push(hand.positions[i]! * 1000, hand.positions[i + 1]! * 1000, -hand.positions[i + 2]! * 1000);
    return {
      mesh: { positions, indices: [...hand.indices] },
      diagnostics: [`Sewn native hand skin: palm ${palm.shared} indexed edges; middle source row 10 to conic 11; ${receipts.join(" | ")}. Only the ${input.armscye.length}-edge armscye remains open.`],
    };
  }
  type IPhysicalDigitRow = NodeArmFingerFan.IPhysicalDigitRow;

  function toIsb([x, y, z]: IAutoMovieCurve64.Vector): V3 {
    return [x, y, -z];
  }

  type IIndexedMesh = { positions: readonly number[]; indices: readonly number[] };
  type IFreeRim = { ids: number[]; points: V3[] };

  /** Trace the first two source cuts around the palm's isolated thumb split. */
  function palmThumbBranch(
    side: "l" | "r",
    arm: IIndexedMesh,
    armRows: IPhysicalDigitRow[],
    thumbRows: IPhysicalDigitRow[],
    verticesMm: V3[],
    triangles: [number, number, number][],
  ): { mesh: { positions: number[]; indices: number[] }; palm: IFreeRim; root: IFreeRim; host: V3[]; thumb: V3[]; afterOrigin: V3; normal: V3 } {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    const L: AutoMovieHumanArmF1Pose.ILandmarks = AutoMovieHumanArmF1Pose.LEFT;
    const leftAxis: V3 = S.unit(L.handAxis);
    const across = (a: V3, n: V3): V3 => S.unit(NodeArmDraw.sub(a, NodeArmDraw.scale(n, S.dot(a, n))));
    const leftForearm: V3 = S.unit(NodeArmDraw.sub(L.wristZero, L.EC));
    const leftU: V3 = across(across(NodeArmDraw.sub(L.RS, L.US), leftForearm), leftAxis);
    const right: IPhysicalDigitRow = armRows[144]!;
    const normal: V3 = side === "l" ? toIsb(leftAxis) : right.normal;
    const u: V3 = side === "l" ? toIsb(leftU) : right.u;
    const origin: V3 = side === "l" ? toIsb(add(L.wristZero, NodeArmDraw.scale(leftAxis, 80))) : right.originMm;
    const afterOrigin: V3 = side === "l" ? toIsb(add(L.wristZero, NodeArmDraw.scale(leftAxis, 84))) : armRows[145]!.originMm;
    const beforeMm: number = side === "l" ? S.dot(L.wristZero, leftAxis) + 80 : right.coordinateMm;
    const afterMm: number = side === "l" ? S.dot(L.wristZero, leftAxis) + 84 : armRows[145]!.coordinateMm;
    const palm: IFreeRim = exactFreeRim(arm, origin, normal);
    const name: string = `palm_${side}`;
    // The original left cut splits once from s80 to s82. Both observed
    // rings continue separately from s82 to s84.
    const splitEnd: number = side === "l" ? beforeMm + 2 : afterMm;
    const coordinatesMm: number[] = side === "l" ? [beforeMm, splitEnd, afterMm] : [beforeMm, afterMm];
    const slabPairs = coordinatesMm.slice(1).map((afterMm: number, i: number) => ({ beforeMm: coordinatesMm[i]!, afterMm }));
    const slabs: IAutoMovieRecoverySlabObservation[] = [];
    const observed = observeAutoMovieRecoverySections({
      name, verticesMm, triangles, axis: normal, reference: u, coordinatesMm,
      slabPairs, toleranceMm: 0.2, maxSpans: 256,
      exactCoordinateAliases: true, sourceOrientationSign: 1, cornerDegrees: 45,
    }, { curveFormat: "bezier", onSourceSlab: (slab): void => { slabs.push(slab); } });
    if (!("value" in observed) || slabs.length !== slabPairs.length)
      throw new Error(`Original palm source sections refused: ${observed.diagnostics.join("; ")}`);
    const slab: IAutoMovieRecoverySlabObservation = slabs[0]!;
    const events = slab.events.filter(({ qualified, pointMm: [x, y, z] }): boolean =>
      qualified && x > 180 && x < 225 && y > 945 && y < 980 && z * (side === "l" ? 1 : -1) > 415);
    if (events.length !== 1) throw new Error("The first measured palm saddle is not unique");
    const event = events[0]!;
    const component = slab.components.find(({ id }): boolean => event.components.includes(id));
    if (!component || !component.topology.manifold || !component.topology.orientable || component.issueCodes.length !== 0)
      throw new Error("The measured palm saddle does not own one orientable source component");
    const ports = (end: "before" | "after"): number[] =>
      component.cycles.filter(({ side: s }): boolean => s === end).map(({ portIds }): number => {
        const port = slab.ports.find(({ id }): boolean => portIds.length === 1 && portIds[0] === id);
        if (!port || port.status !== "unique-component" || port.publication.kind !== "closed")
          throw new Error(`The measured palm ${end} rim is not a unique closed source cycle`);
        return port.publication.loopIndex;
      });
    const start: number[] = ports("before"), finish: number[] = ports("after");
    if (start.length !== 1 || finish.length !== 2) throw new Error("The actual palm saddle did not report one-to-two");
    const lower = observed.value.sections[0]!.loops[start[0]!]!;
    const split = finish.map((index: number) => observed.value.sections[1]!.loops[index]!);
    const upper = side === "r" ? split : finish.map((index: number) => {
      const next: IAutoMovieRecoverySlabObservation = slabs[1]!;
      const inlet = next.ports.find((port): boolean => port.side === "before" && port.publication.kind === "closed" && port.publication.loopIndex === index);
      const owner = next.components.find(({ id }): boolean => inlet?.status === "unique-component" && inlet.components.length === 1 && inlet.components[0] === id);
      if (!owner || !owner.topology.manifold || !owner.topology.orientable || owner.issueCodes.length !== 0 || owner.cycles.length !== 2 ||
        next.events.some(({ components }): boolean => components.includes(owner.id)))
        throw new Error("The actual s82 port has no ordinary continuation");
      const outgoing = next.ports.filter((port): boolean => port.side === "after" && port.status === "unique-component" && port.components.includes(owner.id));
      const port = outgoing[0];
      if (outgoing.length !== 1 || !port || port.publication.kind !== "closed")
        throw new Error("The actual s84 port is not one closed original ring");
      return observed.value.sections[2]!.loops[port.publication.loopIndex]!;
    });
    const signed = (point: V3): number => S.dot(NodeArmDraw.sub(point, afterOrigin), normal);
    const witness: V3[] = [];
    for (let i: number = 0; i + 1 < thumbRows.length; ++i) {
      const a: V3 = thumbRows[i]!.originMm, b: V3 = thumbRows[i + 1]!.originMm;
      const sa: number = signed(a), sb: number = signed(b);
      if (sa <= 0 && sb > 0 || sa > 0 && sb <= 0)
        witness.push(add(a, NodeArmDraw.scale(NodeArmDraw.sub(b, a), sa / (sa - sb))));
    }
    const v: V3 = S.cross(normal, u);
    const contains = (points: V3[], p: V3): boolean => {
      let inside: boolean = false;
      for (let i: number = 0; i < points.length; ++i) {
        const a: V3 = NodeArmDraw.sub(points[i]!, p), b: V3 = NodeArmDraw.sub(points[(i + 1) % points.length]!, p);
        const av: number = S.dot(a, v), bv: number = S.dot(b, v);
        if ((av > 0) !== (bv > 0) && (S.dot(a, u) * bv - S.dot(b, u) * av) / (bv - av) > 0)
          inside = !inside;
      }
      return inside;
    };
    const ownsThumb: number[] = upper.flatMap(({ curve }, index): number[] =>
      witness.some((point): boolean => contains(NodeArmFingerFan.sample(curve), point)) ? [index] : []);
    if (ownsThumb.length !== 1) throw new Error(`The original thumb course did not select one of two observed rings (${witness.length} crossings, ${ownsThumb.length} owned)`);
    const thumb: number = ownsThumb[0]!;
    const source: V3[] = palm.points.map((point): V3 => NodeArmDraw.scale(point, 1000));
    if (S.dot(AutoMovieMeshCourse.newell(source), AutoMovieMeshCourse.newell(NodeArmFingerFan.sample(lower.curve))) < 0)
      source.reverse();
    const spans: IAutoMovieCurve64.Span[] = source.map((a, i): IAutoMovieCurve64.Span => {
      const b: V3 = source[(i + 1) % source.length]!, d: V3 = NodeArmDraw.sub(b, a);
      return [a, add(a, NodeArmDraw.scale(d, 1 / 3)), add(a, NodeArmDraw.scale(d, 2 / 3)), b];
    });
    const rootCurve: IAutoMovieCurve64.Cubic = { type: "cubicBezier", name: "existing-palm-rim", closed: true, unit: "mm", phaseUnit: "mm", spans,
      phaseIntervals: source.map((a, i): number => Math.hypot(...NodeArmDraw.sub(a, source[(i + 1) % source.length]!))) };
    const sections: IAutoMovieContourLoft64.ISection[] = [
      { coordinateMm: beforeMm, loops: [{ ...lower, curve: rootCurve }] }, { coordinateMm: splitEnd, loops: split },
    ];
    const intervals: IAutoMovieContourLoft64.IInterval[] = [
      { beforeMm, afterMm: splitEnd, groups: [{ before: [0], after: [0, 1], supported: true, reason: null }] },
    ];
    if (side === "l") {
      sections.push({ coordinateMm: afterMm, loops: upper });
      intervals.push({ beforeMm: splitEnd, afterMm, groups: [0, 1].map((index: number) => ({
        before: [index], after: [index], supported: true, reason: null,
      })) });
    }
    const generation = tessellateAutoMovieContourLoft64({ sections, intervals,
      events: [{ name: event.id, beforeMm, afterMm: splitEnd, kind: "saddle", coordinateMm: event.coordinateMm, regular: true, terminal: null, before: [0], after: [0, 1] }],
      chordToleranceMm: 0.1,
    });
    if (generation.mesh.indices === null || generation.unresolved.length !== 0 || generation.stripObservations?.some(({ qualified }): boolean => !qualified))
      throw new Error(`The observed thumb split did not generate one qualified branch: ${JSON.stringify(generation.unresolved)}`);
    const loop = (index: number): V3[] => {
      const ring = generation.construction.find(({ id }): boolean => id.endsWith(`.section.${sections.length - 1}.loop.${index}`));
      if (!ring) throw new Error("The generated branch did not preserve its original distal ring");
      return ring.points;
    };
    const generated: CaptureModel.ITriangles = { positions: generation.mesh.positions, indices: generation.mesh.indices };
    const mesh: CaptureModel.ITriangles = side === "l"
      ? NodeArmNativeSaddle.create(generated, name, verticesMm, triangles, normal, u, beforeMm, afterMm, event.id, upper.map(({ curve }, index): { name: string; points: V3[] } => ({ name: curve.name, points: loop(index) })))
      : generated;
    return { mesh, palm, root: exactFreeRim(mesh, origin, normal), host: loop(1 - thumb), thumb: loop(thumb), afterOrigin, normal };
  }

}
