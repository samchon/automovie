import { AutoMovieHumanNailPlate } from "../../../../../packages/human/src/appearance/AutoMovieHumanNailPlate";
import type { IAutoMovieHumanBodyCalibration } from "../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftChain } from "../../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanPeople } from "../../internal/HumanPeople";

type V3 = [number, number, number];

/**
 * Every digit chain carries one nail plate, and the plate lies on that
 * chain's own surface: inside the chain's stations, facing out of the digit,
 * as wide across as its published width.
 *
 * Scenarios:
 * 1. Red proofs on f1's left index finger: a plate made twice as wide reads a lateral span past the tolerance, and a plate whose normals are turned inward reads as facing into the digit.
 * 2. Every person of `HumanPeople`: one nail per finger, thumb and toe chain; each plate's window inside its chain; every top normal facing away from the chain's axis; the middle row's lateral span 0.88 of the plate's width within 5 percent.
 *
 * @evidence contracts/testing.md#behavioral-verification Calibrates each person (`HumanPeople.person`), takes every published nail (`IAutoMovieHumanBodyCalibration.nails`) and builds its plate on its chain (`AutoMovieHumanNailPlate.generate`), then reads the plate's top grid: each top normal against the direction from the chain's axis at the plate's middle station (`AutoMovieHumanLoftChain.axis`) to the bed point, and the middle row's bed spread along the row's own chord. It catches a plate laid on the wrong side or turned inward, a window outside the digit, and a plate whose across solve misses its width; the previous nail cast rays at the mesh and none of this was checked.
 * @evidence contracts/testing.md#independent-expectations The plate's outline spans 0.88 of its width across (the image outline the grid follows), so the middle row's chord spread is 0.88 of the published width; 5 percent allows the chord's shortening over the plate's transverse arch. A plate faces out of its digit by definition. Proven red by scenario 1.
 * @evidence contracts/testing.md#distinguishing-cases Fingers, thumbs and toes of women and men. Red: the made wide plate and the made inward plate.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_nail_plate`, calibrating in process with no browser or GPU.
 */
export function test_human_nail_plate(): void {
  const failures: string[] = [];

  // 1. Red proofs on f1's left index finger.
  const f1: IAutoMovieHumanBodyCalibration = HumanPeople.person("f1").body;
  const index: IAutoMovieHumanBodyCalibration.INail | undefined = (f1.nails ?? []).find((n: IAutoMovieHumanBodyCalibration.INail): boolean => n.chain === "finger.left.index");
  if (index === undefined) failures.push("proof: f1 publishes no nail on finger.left.index");
  else {
    const chain: IAutoMovieHumanLoftChain = chainOf(f1, index.chain);
    const wide: IAutoMovieHumanBodyCalibration.INail = { ...index, width: 2 * index.width };
    const span: string | null = spanFinding(AutoMovieHumanNailPlate.generate(chain, wide), index);
    if (span === null) failures.push("proof: a plate twice as wide reads its width");
    const plate: AutoMovieHumanNailPlate.IOutput = AutoMovieHumanNailPlate.generate(chain, index);
    const inward: AutoMovieHumanNailPlate.IOutput = { ...plate, normals: plate.normals.map((v: number): number => -v) };
    if (facingFinding(inward, chain, index) === null) failures.push("proof: a plate turned inward reads as facing out");
  }

  // 2. Every person.
  for (const name of HumanPeople.names()) {
    const body: IAutoMovieHumanBodyCalibration = HumanPeople.person(name).body;
    const nails: readonly IAutoMovieHumanBodyCalibration.INail[] = body.nails ?? [];
    const digits: string[] = body.chains.map((c: IAutoMovieHumanLoftChain): string => c.name).filter((n: string): boolean => DIGIT.test(n));
    for (const digit of digits) {
      const count: number = nails.filter((n: IAutoMovieHumanBodyCalibration.INail): boolean => n.chain === digit).length;
      if (count !== 1) failures.push(`${name.padEnd(14)} ${digit}: ${count} nails, expected 1`);
    }
    for (const nail of nails) {
      const chain: IAutoMovieHumanLoftChain = chainOf(body, nail.chain);
      const first: number = chain.layers[0]!.y;
      const last: number = chain.layers[chain.layers.length - 1]!.y;
      if (!(first <= nail.edge && nail.edge < nail.root && nail.root <= last))
        failures.push(`${name.padEnd(14)} ${nail.chain}: window [${nail.edge.toFixed(1)}, ${nail.root.toFixed(1)}] outside the chain's stations [${first.toFixed(1)}, ${last.toFixed(1)}] or reversed`);
      const plate: AutoMovieHumanNailPlate.IOutput = AutoMovieHumanNailPlate.generate(chain, nail);
      const facing: string | null = facingFinding(plate, chain, nail);
      if (facing !== null) failures.push(`${name.padEnd(14)} ${nail.chain}: ${facing}`);
      const span: string | null = spanFinding(plate, nail);
      if (span !== null) failures.push(`${name.padEnd(14)} ${nail.chain}: ${span}`);
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} nail plate findings:\n${failures.join("\n")}`);
}

/** Digit chains: fingers, thumbs and toes. */
const DIGIT: RegExp = /^(finger\.(left|right)\.\w+|thumb\.(left|right)|toe\.(left|right)\.\w+)$/;

/** Rows and columns of a plate's top grid (`AutoMovieHumanNailPlate`). */
const ALONG: number = 14;
const AROUND: number = 11;

/** Share of the plate's width its outline spans across. */
const SPAN: number = 0.88;

/** Tolerance on the span, a share of it. */
const SPAN_TOLERANCE: number = 0.05;

/** A chain of a calibration by name. */
function chainOf(body: IAutoMovieHumanBodyCalibration, name: string): IAutoMovieHumanLoftChain {
  const chain: IAutoMovieHumanLoftChain | undefined = body.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === name);
  if (chain === undefined) throw new Error(`no chain ${name}`);
  return chain;
}

/** The first top normal that faces into the digit, or null. */
function facingFinding(plate: AutoMovieHumanNailPlate.IOutput, chain: IAutoMovieHumanLoftChain, nail: IAutoMovieHumanBodyCalibration.INail): string | null {
  const centre: V3 = AutoMovieHumanLoftChain.axis(chain, (nail.root + nail.edge) / 2) as V3;
  for (let k: number = 0; k < ALONG * AROUND; k++) {
    const p: V3 = at(plate.positions, k);
    const n: V3 = at(plate.normals, k);
    const out: V3 = [p[0] - centre[0], p[1] - centre[1], p[2] - centre[2]];
    if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] <= 0) return `top normal ${k} faces into the digit`;
  }
  return null;
}

/** The middle row's lateral spread against its expected share of the width, or null. */
function spanFinding(plate: AutoMovieHumanNailPlate.IOutput, nail: IAutoMovieHumanBodyCalibration.INail): string | null {
  const row: number = Math.floor(ALONG / 2) * AROUND;
  const a: V3 = at(plate.positions, ALONG * AROUND + row);
  const b: V3 = at(plate.positions, ALONG * AROUND + row + AROUND - 1);
  const spread: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const expected: number = SPAN * nail.width;
  return Math.abs(spread - expected) <= SPAN_TOLERANCE * expected ? null : `middle row spans ${spread.toFixed(2)} mm across, expected ${expected.toFixed(2)} within ${(100 * SPAN_TOLERANCE).toFixed(0)} percent`;
}

/** Point k of a flat buffer. */
function at(buffer: readonly number[], k: number): V3 {
  return [buffer[3 * k]!, buffer[3 * k + 1]!, buffer[3 * k + 2]!];
}
