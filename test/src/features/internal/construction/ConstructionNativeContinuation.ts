import {
  AutoMovieConstructionContinuation,
  type AutoMovieConstructionRealization,
  AutoMovieLoftChain,
  AutoMovieLoftJet,
  AutoMovieLoftSectionConnect,
  AutoMovieLoftSectionSource,
  AutoMovieViewAxis,
  AutoMovieViewLoft,
  type IAutoMovieLoftChain,
  type IAutoMovieViewPart,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type {
  IAutoMovieConstructionContinuation,
  IAutoMovieConstructionDiagnostic,
} from "@automovie/interface";

import { nclose } from "../nclose";

/** Independently authored polynomial circles in a signed physical station chart. */
export namespace ConstructionNativeContinuation {
  /**
   * Author r(y)=scale*(3+y/scale+(y/scale)^2), with y=offset+direction*s.
   * Exact normalized scalar endpoint2 and a straight original axis determine
   * the entire source before lofting. Different orders/samples change output
   * density only. The caller owns the returned input and its immutable axis.
   */
  export function source(
    name: string,
    order: number,
    samples: number,
    offset: number = 0,
    direction: 1 | -1 = 1,
    scale: number = 1,
  ): IAutoMovieViewPart {
    const outline: (sign: 1 | -1) => IAutoMovieViewPart.IOutline = (
      sign: 1 | -1,
    ): IAutoMovieViewPart.IOutline => ({
      knots: [0, 1].map((t: number): IAutoMovieViewPart.IKnot => {
        const y: number = offset / scale + direction * t;
        return {
          site: `original ${t}`,
          station: scale * t,
          value: sign * scale * (3 + y + y * y),
          jet: {
            first: sign * scale * direction * (1 + 2 * y),
            second: sign * scale * 2,
          },
        };
      }),
    });
    const shoulder: IAutoMovieViewPart.IOutline = {
      knots: [0, scale].map(
        (station: number): IAutoMovieViewPart.IKnot => ({
          site: `shoulder ${station}`,
          station,
          value: Math.SQRT2 - 1,
        }),
      ),
    };
    return {
      name,
      axis: AutoMovieViewAxis.straight(
        [0, offset, 0],
        [1, 0, 0],
        [0, 0, direction],
      ),
      stations: [0, scale / 2, scale],
      front: { positive: outline(1), negative: outline(-1) },
      side: { positive: outline(1), negative: outline(-1) },
      fullness: { kind: "shoulder", shoulder },
      order,
      samples,
    };
  }

  /** Preserve all actual loft diagnostics rather than inventing fixture geometry. */
  export function chain(source: IAutoMovieViewPart): IAutoMovieLoftChain {
    const result: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(source);
    if (
      result.chain === null ||
      result.surface === null ||
      result.diagnostics.length !== 0
    )
      throw new Error(JSON.stringify(result.diagnostics));
    return result.chain;
  }

  /** Polynomial-circle world2 from independent elementary differentiation. */
  export function oracle(
    y: number,
    phi: number,
    scale: number,
  ): AutoMovieLoftJet.IJet {
    const q: number = y / scale;
    const r: number = scale * (3 + q + q * q);
    const first: number = 1 + 2 * q;
    const second: number = 2 / scale;
    const c: number = Math.cos(phi);
    const s: number = Math.sin(phi);
    return {
      p: [r * c, y, r * s],
      s: [first * c, 1, first * s],
      t: [-r * s, 0, r * c],
      ss: [second * c, 0, second * s],
      st: [-first * s, 0, first * c],
      tt: [-r * c, 0, -r * s],
    };
  }

  /** Copy owned numerical records while retaining the immutable callable axis. */
  export function copy(chain: IAutoMovieLoftChain): IAutoMovieLoftChain {
    return {
      ...chain,
      nativeSource: structuredClone(chain.nativeSource),
      sectionSpans: structuredClone(chain.sectionSpans),
      layers: chain.layers.map(
        (layer: IAutoMovieLoftChain.ILayer): IAutoMovieLoftChain.ILayer => ({
          ...layer,
          coefficients: [...layer.coefficients],
          slopes: [...layer.slopes],
          curvatures: layer.curvatures?.slice(),
          frame: structuredClone(layer.frame),
          frameSlopes: structuredClone(layer.frameSlopes),
          frameCurvatures: structuredClone(layer.frameCurvatures),
          sectionSource: structuredClone(layer.sectionSource),
        }),
      ),
    };
  }

  /** A real phase-constant polynomial lift keeps all three physical orders at the shared boundary. */
  export function lifted(failures: string[]): void {
    const host: IAutoMovieLoftChain = chain(source("lift.host", 256, 24));
    const part: IAutoMovieLoftChain = chain(source("lift.part", 64, 40, 1));
    for (const [current, offset] of [
      [host, 0],
      [part, 1],
    ] as const)
      for (const layer of current.layers) {
        const world: number = offset + layer.y;
        layer.lift = new Array<number>(current.order).fill(
          0.1 + 0.2 * world + 0.3 * world * world,
        );
        layer.liftSlopes = new Array<number>(current.order).fill(
          0.2 + 0.6 * world,
        );
        layer.liftCurvatures = new Array<number>(current.order).fill(0.6);
      }
    const result: IAutoMovieLoftChain | string =
      AutoMovieConstructionContinuation.apply(host, "top", part, "bottom");
    if (typeof result === "string") throw new Error(result);
    const actual: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(result, 0, 0.37);
    const expected: AutoMovieLoftJet.IJet = oracle(1, 0.37, 1);
    expected.p[1] += 0.6;
    expected.s[1] += 0.8;
    expected.ss[1] += 0.6;
    for (const key of ["p", "s", "t", "ss", "st", "tt"] as const)
      if (
        actual[key].some(
          (value: number, index: number): boolean =>
            !nclose(value, expected[key][index]!, 2e-8),
        )
      )
        failures.push(
          `constant lift2/${key}: actual ${actual[key]}, expected ${expected[key]}`,
        );
  }

  /** Re-express an owned endpoint and its adjacent native law after a genuine source2 change. */
  export function changed(
    chain: IAutoMovieLoftChain,
    key: "extents" | "shoulders",
    quarter: number,
    derivative: number,
    delta: number,
  ): void {
    const field: AutoMovieLoftSectionSource.IEndpoint["field"] | string =
      AutoMovieLoftSectionConnect.capture(chain, chain.layers[0]!.y);
    if (typeof field === "string" || field.kind !== "native")
      throw new Error(String(field));
    (field.inputs[key][quarter] as [number, number, number])[derivative]! +=
      delta;
    chain.layers[0]!.sectionSource = AutoMovieLoftSectionSource.bind(
      chain.layers[0]!,
      field,
    );
    Object.assign(chain, AutoMovieLoftSectionConnect.finish(chain));
  }

  /** Refuse complete-family mismatches, unavailable physical2 and owned getter failures at their actual seams. */
  export function refusals(failures: string[]): void {
    const host: IAutoMovieLoftChain = chain(source("refuse.host", 256, 24));
    const original: IAutoMovieLoftChain = chain(
      source("refuse.part", 64, 40, 1),
    );
    for (const [name, change] of [
      [
        "fullness interior",
        (chain: IAutoMovieLoftChain): void =>
          changed(chain, "shoulders", 0, 0, 0.01),
      ],
      [
        "physical first",
        (chain: IAutoMovieLoftChain): void =>
          changed(chain, "extents", 1, 1, 0.01),
      ],
      [
        "physical second",
        (chain: IAutoMovieLoftChain): void =>
          changed(chain, "shoulders", 2, 2, 0.01),
      ],
      [
        "stale binding",
        (chain: IAutoMovieLoftChain): void => {
          chain.layers[0]!.coefficients[7]! += 0.01;
        },
      ],
      [
        "basis-only family",
        (chain: IAutoMovieLoftChain): void => {
          delete chain.nativeSource;
        },
      ],
      [
        "missing frame2",
        (chain: IAutoMovieLoftChain): void => {
          delete chain.layers[0]!.frameSource;
          delete chain.layers[0]!.frameCurvatures;
        },
      ],
      [
        "frame2 mismatch",
        (chain: IAutoMovieLoftChain): void => {
          delete chain.layers[0]!.frameSource;
          chain.layers[0]!.frameCurvatures!.origin[0] += 0.01;
        },
      ],
      [
        "incomplete rows",
        (chain: IAutoMovieLoftChain): void => {
          chain.layers[0]!.coefficients.length--;
        },
      ],
      [
        "pole",
        (chain: IAutoMovieLoftChain): void => {
          chain.pole = { end: "bottom", point: [0, 1, 0] };
        },
      ],
      [
        "phase lift",
        (chain: IAutoMovieLoftChain): void => {
          const layer: IAutoMovieLoftChain.ILayer = chain.layers[0]!;
          layer.lift = new Array<number>(64).fill(0);
          layer.lift[7] = 0.01;
          layer.liftSlopes = new Array<number>(64).fill(0);
          layer.liftCurvatures = new Array<number>(64).fill(0);
        },
      ],
      [
        "missing lift2",
        (chain: IAutoMovieLoftChain): void => {
          const layer: IAutoMovieLoftChain.ILayer = chain.layers[0]!;
          layer.lift = new Array<number>(64).fill(0);
          layer.liftSlopes = new Array<number>(64).fill(0);
        },
      ],
    ] as const) {
      const part: IAutoMovieLoftChain = copy(original);
      change(part);
      let refused: boolean = false;
      try {
        const result: IAutoMovieLoftChain | string =
          AutoMovieConstructionContinuation.apply(host, "top", part, "bottom");
        refused =
          typeof result === "string" &&
          (!(name === "fullness interior" || name.startsWith("physical")) ||
            result.includes("native ends differ"));
      } catch (error: unknown) {
        refused =
          error instanceof Error &&
          /rewritten|stale|retained/i.test(error.message);
      }
      if (!refused)
        failures.push(`${name}: invalid cross-density boundary was accepted.`);
    }
    const singular: IAutoMovieViewPart = source("singular", 64, 40, 1);
    singular.front.positive.parameter = {
      type: "root",
      end: "bottom",
      pole: 0,
    };
    const unavailable: AutoMovieViewLoft.IResult =
      AutoMovieViewLoft.create(singular);
    if (unavailable.chain === null)
      throw new Error(JSON.stringify(unavailable.diagnostics));
    if (
      !AutoMovieLoftChain.point(unavailable.chain, 0, 0.37).every(
        Number.isFinite,
      )
    )
      failures.push("Missing source2 erased the original finite Point0.");
    const result: IAutoMovieLoftChain | string =
      AutoMovieConstructionContinuation.apply(
        host,
        "top",
        unavailable.chain,
        "bottom",
      );
    if (typeof result !== "string" || !/unavailable|singular/i.test(result))
      failures.push(
        "Unavailable physical source2 did not keep its named refusal.",
      );

    // Owned data accessors retain their original exception rather than reporting success.
    const getter: IAutoMovieLoftChain = copy(original);
    const marker: Error = new Error("owned boundary datum");
    Object.defineProperty(getter.layers[0]!.coefficients, 7, {
      get: (): never => {
        throw marker;
      },
    });
    let caught: unknown;
    try {
      AutoMovieConstructionContinuation.apply(host, "top", getter, "bottom");
    } catch (error: unknown) {
      caught = error;
    }
    if (caught !== marker)
      failures.push("A boundary data-getter error lost its original identity.");
  }

  /** One middle leaf consumes two independent pending endpoints, or rolls both nested walks back on an outer refusal. */
  export function nested(failures: string[]): void {
    for (const mismatch of [false, true]) {
      const a: IAutoMovieViewPart = source("nested.a", 256, 24);
      const b: IAutoMovieViewPart = source("nested.b", 64, 40, 1);
      const c: IAutoMovieViewPart = source("nested.c", 256, 32, 2);
      if (mismatch) b.front.positive.knots[0]!.value += 0.01;
      const inner: IAutoMovieConstructionContinuation = {
        type: "continue",
        name: "nested.inner",
        host: { type: "source", name: c.name, source: c.name },
        hostFace: c.name,
        hostEnd: "bottom",
        part: { type: "source", name: b.name, source: b.name },
        partFace: b.name,
        partEnd: "top",
      };
      const root: IAutoMovieConstructionContinuation = {
        type: "continue",
        name: "nested.outer",
        host: { type: "source", name: a.name, source: a.name },
        hostFace: a.name,
        hostEnd: "top",
        part: inner,
        partFace: b.name,
        partEnd: "bottom",
      };
      const real: AutoMovieConstructionRealization.IRealization =
        realizeAutoMovieConstruction(
          { name: "nested", root },
          {
            chord: 0.00005,
            sources: new Map([
              [a.name, a],
              [b.name, b],
              [c.name, c],
            ]),
          },
        );
      if (mismatch) {
        if (
          real.chains.length !== 1 ||
          real.chains[0]!.name !== a.name ||
          real.body.points.length !== 0 ||
          !real.diagnostics.some(
            (diagnostic: IAutoMovieConstructionDiagnostic): boolean =>
              diagnostic.node === root.name &&
              diagnostic.detail.includes("native ends differ"),
          )
        )
          failures.push(
            "Nested outer refusal lost its diagnostic or retained a discarded subtree.",
          );
        continue;
      }
      const middle:
        | AutoMovieConstructionRealization.IRealization["body"]["faces"][number]
        | undefined = real.body.faces.find(
        (
          face: AutoMovieConstructionRealization.IRealization["body"]["faces"][number],
        ): boolean => face.chain === b.name,
      );
      if (
        real.diagnostics.length !== 0 ||
        real.chains.length !== 3 ||
        middle?.cycles.length !== 2 ||
        real.body.points.length !== 56 ||
        real.mesh.indices.length === 0
      ) {
        failures.push(
          `Two pending ends of one native leaf were not retained: ${JSON.stringify(real.diagnostics)}`,
        );
        continue;
      }
      for (const [offset, name] of [
        [0, a.name],
        [1, b.name],
        [2, c.name],
      ] as const) {
        const current: IAutoMovieLoftChain = real.chains.find(
          (candidate: IAutoMovieLoftChain): boolean => candidate.name === name,
        )!;
        for (const station of [0, 0.25, 0.75, 1]) {
          const expected: AutoMovieLoftJet.IJet = oracle(
            offset + station,
            0.37,
            1,
          );
          const actual: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(
            current,
            station,
            0.37,
          );
          for (const key of ["p", "s", "t", "ss", "st", "tt"] as const)
            if (
              actual[key].some(
                (value: number, index: number): boolean =>
                  !nclose(value, expected[key][index]!, 2e-8),
              )
            )
              failures.push(
                `Nested source interval changed: ${name}/${station}/${key}`,
              );
        }
      }
    }
  }
}
