import {
  AutoMovieLoftSection,
  AutoMovieLoftSectionSource,
} from "@automovie/engine";
import type {
  IAutoMovieLoftChain,
  IAutoMovieLoftSectionPhase,
  IAutoMovieLoftViewRead,
  IAutoMovieViewSectionField,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A native section source bound to a chain's endpoint layers
 * (`AutoMovieLoftSectionSource.bind`) answers `AutoMovieLoftSection.phase` and
 * `.jet` with the complete generating shape.
 *
 * Fixture: radius-2 circles from constant station jets. A rational quadratic
 * arc of half angle a has weight cos a and shoulder w / (1 + w). Oracle: the
 * ray at phase phi from the origin meets the circle of centre (cx, cy) at
 * radius a + b, a = cx cos + cy sin, b = sqrt(4 - cx^2 - cy^2 + a^2),
 * differentiated twice.
 *
 * Scenarios:
 *
 * 1. A plain circle, one centred at (0.2, 0.1) by its support contacts, one with a
 *    split per quarter and one with two pieces per quarter, bound to layers 0
 *    and 10 of an order-4 spline chain: at phases -0.37, 0, 0.23, pi/2, 2.31
 *    and 2 pi, the phase and the jet's p, t and tt match the oracle and each
 *    other within 1e-8 at both endpoints, for the chain and a structured clone
 *    of it.
 */
export function test_unit_engine_geometry_loft_captured_phase(): void {
  const constant = (value: number): IAutoMovieViewSectionField.IStationJet => [
    value,
    0,
    0,
  ];
  const circle = (
    mode: "plain" | "touch" | "splits" | "pieces",
  ): IAutoMovieLoftViewRead.IJets => {
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
    if (arcs === 1) return inputs;
    const quarters: IAutoMovieViewSectionField.IStationJet[][][] = [
      0, 1, 2, 3,
    ].map((q: number) =>
      Array.from({ length: arcs - 1 }, (_: unknown, j: number) => {
        const angle: number = ((q + (j + 1) / arcs) * Math.PI) / 2;
        return [
          constant(2 * Math.cos(angle)),
          constant(2 * Math.sin(angle)),
          constant(angle + Math.PI / 2),
          constant(shoulder),
        ];
      }),
    );
    if (mode === "splits") inputs.splits = quarters.map((points) => points[0]!);
    else inputs.pieces = quarters;
    return inputs;
  };
  const analytic = (
    phi: number,
    cx: number,
    cy: number,
  ): IAutoMovieLoftSectionPhase => {
    const c: number = Math.cos(phi);
    const s: number = Math.sin(phi);
    const a: number = cx * c + cy * s;
    const d: number = -cx * s + cy * c;
    const b: number = Math.sqrt(4 - cx * cx - cy * cy + a * a);
    const r: number = a + b;
    const r1: number = d + (a * d) / b;
    const r2: number = -a + (d * d - a * a) / b - (a * a * d * d) / (b * b * b);
    return {
      p: [r * c, r * s],
      t: [r1 * c - r * s, r1 * s + r * c],
      tt: [(r2 - r) * c - 2 * r1 * s, (r2 - r) * s + 2 * r1 * c],
    };
  };

  // 1.
  for (const mode of ["plain", "touch", "splits", "pieces"] satisfies ("plain" | "touch" | "splits" | "pieces")[]) {
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
    for (const [copy, owner] of [
      ["chain", chain],
      ["clone", structuredClone(chain)],
    ] satisfies [string, IAutoMovieLoftChain][])
      for (const station of [0, 10]) {
        const phase = AutoMovieLoftSection.phase(owner, station);
        const jet = AutoMovieLoftSection.jet(owner, station);
        const label: string = `${mode} ${copy} ${station}`;
        TestValidator.predicate(
          `${label} owned`,
          phase !== null && jet !== null,
        );
        if (phase === null || jet === null) continue;
        TestValidator.predicate(
          label,
          [-0.37, 0, 0.23, Math.PI / 2, 2.31, 2 * Math.PI].every(
            (phi: number): boolean => {
              const want: IAutoMovieLoftSectionPhase = analytic(
                phi,
                mode === "touch" ? 0.2 : 0,
                mode === "touch" ? 0.1 : 0,
              );
              const got: IAutoMovieLoftSectionPhase = phase(phi);
              const full = jet(phi);
              return (["p", "t", "tt"] satisfies ("p" | "t" | "tt")[]).every((key) =>
                [0, 1].every(
                  (axis: number): boolean =>
                    Math.abs(got[key][axis]! - want[key][axis]!) <= 1e-8 &&
                    Math.abs(full[key][axis]! - want[key][axis]!) <= 1e-8,
                ),
              );
            },
          ),
        );
      }
  }
}
