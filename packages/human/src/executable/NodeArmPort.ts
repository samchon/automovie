import fs from "node:fs";
import path from "node:path";
import { AutoMovieSolidChain, type IAutoMovieLoftChain, type IAutoMovieSolidSurface } from "@automovie/engine";

import { AutoMovieHumanBodyAnatomy } from "../generation/AutoMovieHumanBodyAnatomy";
import type { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanArmInputs } from "../generation/arm/AutoMovieHumanArmInputs";
import { AutoMovieHumanArmLandmarks } from "../generation/arm/AutoMovieHumanArmLandmarks";
import { AutoMovieHumanArmSegmentFrames } from "../generation/arm/AutoMovieHumanArmSegmentFrames";
import { AutoMovieHumanArmViewCurves } from "../generation/arm/AutoMovieHumanArmViewCurves";
import { AutoMovieHumanArmViewLoft } from "../generation/arm/AutoMovieHumanArmViewLoft";
import { AutoMovieHumanHandDigits } from "../generation/hand/AutoMovieHumanHandDigits";
import { AutoMovieHumanHandPorts } from "../generation/hand/AutoMovieHumanHandPorts";
import { AutoMovieHumanTrunkS00 } from "../generation/trunk/AutoMovieHumanTrunkS00";
import { HumanNodeInput } from "./HumanNodeInput";
import { HumanNodePaths } from "./HumanNodePaths";

type V3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * f1_arm's check of the arm's root on S00's armscye port (`node:arm-port`,
 * run by `ttsx`): for each side, the posed arm (`AutoMovieHumanArmF1Pose`)
 * lofted as the joined body lofts it, then the rail ring (the arm's surface at
 * the axilla level's station) against the port loop: the distance from each
 * loop point to the ring, and the port node's own admission reading (the
 * loop's angle about the ring's centroid in the ring's Newell plane must turn
 * once, monotonically: `AutoMovieConstructionSplitBand`'s `phases`). Then the
 * digits on her hand and their palm ports (`AutoMovieHumanHandPorts`).
 */
export namespace NodeArmPort {
  /** Check both sides and write the report. */
  export async function run(): Promise<void> {
    const person: Awaited<ReturnType<typeof HumanNodeInput.of>> = await HumanNodeInput.of();
    const s00: AutoMovieHumanTrunkS00.IOutput = AutoMovieHumanTrunkS00.of(person.parameters, AutoMovieHumanBodyAnatomy.resolve(person.parameters));
    const report: Record<string, unknown> = {};
    for (const side of ["left", "right"] as const) {
      const inputs: AutoMovieHumanArmInputs.IOutput = AutoMovieHumanArmInputs.of(person.parameters, side, s00);
      if (inputs.posed === null) {
        report[side] = inputs.placement;
        continue;
      }
      const frames: AutoMovieHumanArmSegmentFrames.IOutput = AutoMovieHumanArmSegmentFrames.create({ side, arms: inputs.arms, pose: { elbow: 0, wrist: 0 } });
      const landmarks: AutoMovieHumanArmLandmarks.IOutput = AutoMovieHumanArmLandmarks.create(frames, inputs.arms);
      const curves: AutoMovieHumanArmViewCurves.IOutput = AutoMovieHumanArmViewCurves.create(frames, landmarks, inputs.tapes, inputs.calipers, inputs.posed);
      const loft: AutoMovieHumanArmViewLoft.IOutput = AutoMovieHumanArmViewLoft.create({ curves, frames, landmarks, root: inputs.root, order: 32, samples: 64, gap: 6, posed: inputs.posed });
      const chain: IAutoMovieLoftChain | null = loft.loft?.chain ?? null;
      const surface: IAutoMovieSolidSurface | null = chain === null ? null : AutoMovieSolidChain.surface(chain);
      const rail: number = loft.station(AutoMovieHumanArmLandmarks.get(landmarks, "axilla level").walk);
      // The axis jet against central differences of its own `at` (h = 0.01 mm): first and second station derivatives of
      // origin, u and v at 24 stations across the course (dome, rail, turn, join, elbow, forearm roll, wrist, hand).
      const axis = inputs.posed.axis(landmarks.course.port - curves.start);
      const h: number = 0.01;
      const flat = (f: { origin: readonly number[]; u: readonly number[]; v: readonly number[] }): number[] => [...f.origin, ...f.u, ...f.v];
      const jetCheck: string[] = Array.from({ length: 24 }, (_: unknown, i: number): string => {
        const t: number = 2 + ((loft.length - 4) * i) / 23;
        const jet = axis.jet?.(t) ?? null;
        if (jet === null) return `${t.toFixed(1)}: no jet`;
        const a: number[] = flat(axis.at(t - h));
        const b: number[] = flat(axis.at(t));
        const c: number[] = flat(axis.at(t + h));
        const d1: number[] = flat(jet.first);
        const d2: number[] = flat(jet.second);
        const e1: number = Math.max(...a.map((x: number, k: number): number => Math.abs((c[k]! - x) / (2 * h) - d1[k]!)));
        const e2: number = Math.max(...a.map((x: number, k: number): number => Math.abs((c[k]! - 2 * b[k]! + x) / (h * h) - d2[k]!)));
        return `${t.toFixed(1)}: first err ${e1.toExponential(2)} (|d1| ${Math.max(...d1.map(Math.abs)).toFixed(3)}), second err ${e2.toExponential(2)} (|d2| ${Math.max(...d2.map(Math.abs)).toExponential(2)})`;
      });
      const out: Record<string, unknown> = { placement: inputs.placement, loftDiagnostics: [...loft.diagnostics, ...(loft.loft?.diagnostics ?? []).map((d: unknown): string => JSON.stringify(d))], rail, length: loft.length, layers: chain?.layers.length ?? 0, jetCheck };
      if (surface !== null) {
        const ring: V3[] = Array.from({ length: 512 }, (_: unknown, j: number): V3 => {
          const p: readonly number[] = surface.point?.(rail, (2 * Math.PI * j) / 512) ?? surface.jet(rail, (2 * Math.PI * j) / 512).p;
          return [p[0]!, p[1]!, p[2]!];
        });
        const loop: V3[] = inputs.posed.loop;
        const distances: number[] = loop.map((p: V3): number => Math.min(...ring.map((q: V3): number => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]))));
        out.loopToRing = { max: Math.max(...distances), mean: distances.reduce((a: number, b: number): number => a + b, 0) / distances.length };
        out.winding = winding(ring, loop);
      }
      try {
        const digits: AutoMovieHumanHandDigits.IDigit[] = AutoMovieHumanHandDigits.create(frames, inputs.posed.hand, { sex: inputs.arms.sex, breadth: inputs.tapes.breadth });
        out.digits = digits.length;
        if (chain !== null) {
          const ports: AutoMovieHumanHandPorts.IPort[] = AutoMovieHumanHandPorts.create(chain, digits);
          out.handPorts = ports.map((p: AutoMovieHumanHandPorts.IPort): string => {
            const d: AutoMovieHumanHandDigits.IDigit | undefined = digits.find((x: AutoMovieHumanHandDigits.IDigit): boolean => x.name === p.name);
            const field: IAutoMovieSolidSurface | null = d?.loft.chain === null || d?.loft.chain === undefined ? null : AutoMovieSolidChain.surface(d.loft.chain);
            const reading: string =
              field === null
                ? "no digit surface"
                : JSON.stringify(
                    winding(
                      Array.from({ length: 256 }, (_: unknown, j: number): V3 => [...(field.point?.(p.rail, (2 * Math.PI * j) / 256) ?? field.jet(p.rail, (2 * Math.PI * j) / 256).p)] as V3),
                      Array.from({ length: 128 }, (_: unknown, j: number): V3 => p.curve((2 * Math.PI * j) / 128)),
                    ),
                  );
            return `${p.name} rail ${p.rail.toFixed(2)} perimeter ${p.perimeter.toFixed(1)} girth ${p.girth.toFixed(1)} gap ${p.gap.toFixed(1)} winding ${reading}`;
          });
        }
      } catch (error: unknown) {
        out.digitsRefused = error instanceof Error ? error.message : String(error);
      }
      report[side] = out;
    }
    const dir: string = HumanNodePaths.resolve("packages/human/.shots/f1_arm2");
    fs.mkdirSync(dir, { recursive: true });
    const file: string = path.join(dir, `port-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    fs.writeFileSync(file, JSON.stringify(report, null, 1));
    console.log(file);
    console.log(JSON.stringify(report, null, 1));
  }
}

/** The port node's admission reading: the loop's angle about the ring's centroid in the ring's Newell plane, its total turns and its reversals (`AutoMovieConstructionSplitBand`'s `phases`). */
function winding(ring: readonly V3[], loop: readonly V3[]): { turns: number; reversals: number; distanceMax: number; distanceMean: number } {
  const centre: V3 = [0, 1, 2].map((i: number): number => ring.reduce((t: number, q: V3): number => t + q[i]!, 0) / ring.length) as V3;
  let area: V3 = [0, 0, 0];
  ring.forEach((q: V3, j: number): void => {
    const a: V3 = sub(q, centre);
    const b: V3 = sub(ring[(j + 1) % ring.length]!, centre);
    area = [area[0] + a[1] * b[2] - a[2] * b[1], area[1] + a[2] * b[0] - a[0] * b[2], area[2] + a[0] * b[1] - a[1] * b[0]];
  });
  const normal: V3 = unit(area);
  const d0: V3 = sub(ring[0]!, centre);
  const e1: V3 = unit(sub(d0, scale(normal, dot(d0, normal))));
  const e2: V3 = [normal[1] * e1[2] - normal[2] * e1[1], normal[2] * e1[0] - normal[0] * e1[2], normal[0] * e1[1] - normal[1] * e1[0]];
  const angles: number[] = loop.map((p: V3): number => Math.atan2(dot(sub(p, centre), e2), dot(sub(p, centre), e1)));
  const steps: number[] = angles.map((a: number, k: number): number => {
    const d: number = angles[(k + 1) % angles.length]! - a;
    return d - 2 * Math.PI * Math.round(d / (2 * Math.PI));
  });
  const total: number = steps.reduce((a: number, b: number): number => a + b, 0);
  const distances: number[] = loop.map((p: V3): number => Math.min(...ring.map((q: V3): number => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]))));
  return {
    turns: total / (2 * Math.PI),
    reversals: steps.filter((d: number): boolean => Math.sign(d) !== Math.sign(total)).length,
    distanceMax: Math.max(...distances),
    distanceMean: distances.reduce((a: number, b: number): number => a + b, 0) / distances.length,
  };
}

function sub(a: V3, b: V3): V3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(a: V3, s: number): V3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function dot(a: V3, b: V3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function unit(a: V3): V3 {
  const l: number = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
}

void NodeArmPort.run().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
