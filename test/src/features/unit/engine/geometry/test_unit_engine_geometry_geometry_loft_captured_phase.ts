import {
  AutoMovieLoftSection,
  AutoMovieLoftSectionSource,
} from "@automovie/engine";
import type {
  IAutoMovieLoftChain,
  IAutoMovieLoftSectionJet,
  IAutoMovieLoftSectionPhase,
  IAutoMovieLoftViewRead,
  IAutoMovieViewSectionField,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** A constant physical-station scalar retains its actual value and zero derivatives. */
function constant(value: number): IAutoMovieViewSectionField.IStationJet {
  return [value, 0, 0];
}

/**
 * Circle arcs use rational quadratic weight cos(half arc angle), hence shoulder
 * w/(1+w). Contacts and split points lie on the same authored radius-2 circle.
 */
function circle(
  mode: "plain" | "touch" | "splits" | "pieces",
): IAutoMovieLoftViewRead.IJets {
  const cx: number = mode === "touch" ? 0.2 : 0;
  const cy: number = mode === "touch" ? 0.1 : 0;
  const arcs: number = mode === "splits" ? 2 : mode === "pieces" ? 3 : 1;
  const weight: number = Math.cos(Math.PI / (4 * arcs));
  const shoulder: number = weight / (1 + weight);
  const inputs: IAutoMovieLoftViewRead.IJets = {
    extents: [2 + cx, 2 + cy, 2 - cx, 2 - cy].map(constant),
    shoulders: [shoulder, shoulder, shoulder, shoulder].map(constant),
  };
  if (mode === "touch") inputs.touch = [cy, cx, cy, cx].map(constant);
  if (arcs > 1) {
    const quarters: IAutoMovieViewSectionField.IStationJet[][][] = [];
    for (let q: number = 0; q < 4; ++q) {
      const points: IAutoMovieViewSectionField.IStationJet[][] = [];
      for (let k: number = 1; k < arcs; ++k) {
        const angle: number = ((q + k / arcs) * Math.PI) / 2;
        points.push([
          constant(2 * Math.cos(angle)),
          constant(2 * Math.sin(angle)),
          constant(angle + Math.PI / 2),
          constant(shoulder),
        ]);
      }
      quarters.push(points);
    }
    if (mode === "splits")
      inputs.splits = quarters.map(
        (
          points: IAutoMovieViewSectionField.IStationJet[][],
        ): IAutoMovieViewSectionField.IStationJet[] => points[0]!,
      );
    else inputs.pieces = quarters;
  }
  return inputs;
}

/** Differentiate the positive ray/circle intersection, independently of conic readers. */
function analytic(
  phi: number,
  cx: number,
  cy: number,
): IAutoMovieLoftSectionPhase {
  const c: number = Math.cos(phi);
  const s: number = Math.sin(phi);
  const a: number = cx * c + cy * s;
  const d: number = -cx * s + cy * c;
  const b: number = Math.sqrt(4 - cx * cx - cy * cy + a * a);
  const radius: number = a + b;
  const first: number = d + (a * d) / b;
  const second: number =
    -a + (d * d - a * a) / b - (a * a * d * d) / (b * b * b);
  return {
    p: [radius * c, radius * s],
    t: [first * c - radius * s, first * s + radius * c],
    tt: [
      (second - radius) * c - 2 * first * s,
      (second - radius) * s + 2 * first * c,
    ],
  };
}

/**
 * Captured native endpoint phase queries preserve the complete generating shape.
 *
 * Scenarios:
 * 1. A circle with displaced support contacts keeps its translated circular
 *    geometry after endpoint capture, in both phase-only and full jet reads.
 * 2. One split and two-piece splits per quarter retain their authored circle
 *    across ordinary phases, a cardinal boundary and the periodic seam.
 * 3. A plain unsplit circle preserves adjacent behavior, and value-copying the
 *    endpoint chain preserves all three phase fields at both native endpoints.
 */
export function test_unit_engine_geometry_geometry_loft_captured_phase(): void {
  const failures: string[] = [];
  for (const mode of ["plain", "touch", "splits", "pieces"] as const) {
    const inputs: IAutoMovieLoftViewRead.IJets = circle(mode);
    const chain: IAutoMovieLoftChain = {
      name: `captured-${mode}`,
      basis: "spline",
      order: 4,
      rule: "polar",
      samples: 16,
      layers: [0, 10].map(
        (y: number): IAutoMovieLoftChain.ILayer => ({
          y,
          coefficients: [2, 0, -2, 0, 0, 2, 0, -2],
          slopes: new Array<number>(8).fill(0),
          curvatures: new Array<number>(8).fill(0),
        }),
      ),
    };
    for (const layer of chain.layers)
      layer.sectionSource = AutoMovieLoftSectionSource.bind(layer, {
        kind: "native",
        inputs,
      });

    for (const copy of [chain, structuredClone(chain)])
      for (const station of [0, 10]) {
        const phase: ((phi: number) => IAutoMovieLoftSectionPhase) | null =
          AutoMovieLoftSection.phase(copy, station);
        const jet: ((phi: number) => IAutoMovieLoftSectionJet) | null =
          AutoMovieLoftSection.jet(copy, station);
        if (phase === null || jet === null)
          throw new Error("A captured native endpoint lost its source owner");
        for (const phi of [-0.37, 0, 0.23, Math.PI / 2, 2.31, 2 * Math.PI]) {
          const expected: IAutoMovieLoftSectionPhase = analytic(
            phi,
            mode === "touch" ? 0.2 : 0,
            mode === "touch" ? 0.1 : 0,
          );
          const actual: IAutoMovieLoftSectionPhase = phase(phi);
          const full: IAutoMovieLoftSectionJet = jet(phi);
          for (const key of ["p", "t", "tt"] as const)
            for (let axis: number = 0; axis < 2; ++axis)
              if (
                !nclose(actual[key][axis]!, expected[key][axis]!, 1e-8) ||
                !nclose(full[key][axis]!, expected[key][axis]!, 1e-8) ||
                !nclose(actual[key][axis]!, full[key][axis]!, 1e-8)
              )
                failures.push(`${mode}/${station}/${phi}/${key}/${axis}`);
        }
      }
  }
  TestValidator.equals(
    "captured native phase and jet retain the complete circle",
    failures,
    [],
  );
}
