import {
  AutoMovieConstructionViews,
  type AutoMovieLoftFrame,
  AutoMovieLoftJet,
  type IAutoMovieLoftChain,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import { AutoMovieHumanBodyLaw } from "../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import type { AutoMovieHumanSiteViewPart } from "../../../../packages/human/src/generation/limb/AutoMovieHumanSiteViewPart";

/**
 * Compare actual regular neck boundaries, fixed toe observation planes and material-roll source replays. Each observer reads the existing definition without another Human or frame-law implementation.
 *
 * @evidence contracts/common.md#principled-implementation Retains the original assertion bodies and public-engine observations, with their fixed expectations and limitations. This module changes ownership of test code only.
 * @evidence contracts/common.md#clear-and-simple-design Groups one coherent source-observation responsibility behind one exported namespace; the main test remains the sole generator and execution coordinator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no assertion suppression, tolerance change, fit, source mutation or alternative construction.
 * @evidence contracts/common.md#meaningful-documentation Each observer retains its source/frame scope, assumptions and failure meaning; no final skin or general anatomical result is inferred from these reads.
 * @evidence contracts/performance.md#efficient-algorithms Work remains the sum of the unchanged bounded observer loops and public source preparation; merely moving these loops changes no algorithm or sampling density.
 * @evidence contracts/performance.md#reuse-equivalent-work All functions receive the one existing definition or its actual parts; there is no additional generation or persistent cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The namespace retains only function definitions. Observations are synchronous and call-local; the public test owns the aggregate defects.
 */
export namespace HumanBodyDefinitionFrames {
  /** Compare the two actual regular boundary readers, including frame/lift product-rule terms. This retains the neck as owner; it does not compare the new source to retired harmonic skin or certify the intervening old trunk. No extra body or loft is built.
   *
   * @evidence contracts/common.md#principled-implementation Reads both real regular world surface jets at the common neck/upper boundary, retaining frame-owner identity and all six vector tolerances.
   * @evidence contracts/common.md#clear-and-simple-design One internal observer owns this coherent assertion group; the public definition test decides invocation order and owns the aggregate failures.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves the original expected values, numeric tolerances, source queries and failure strings; no fixture selector, fallback shape or fitted compensation is added.
   * @evidence contracts/common.md#meaningful-documentation The retained method description states its actual source, coordinate or frame scope and unresolved final-skin/anatomical limits.
   * @evidence contracts/performance.md#efficient-algorithms Reads 64 phases from each existing chain and compares six three-vector fields; no loft or Human is rebuilt.
   * @evidence contracts/performance.md#reuse-equivalent-work Receives already generated source records from the single public test invocation; local engine preparations serve these reads only, with no duplicate Human definition.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary arrays and preparations leave scope synchronously; only the caller-owned defects and logged observations survive. No cache, process, renderer or external handle is acquired.
   */
  export function neckBoundary(
    name: string,
    definition: AutoMovieHumanBodyLaw.IDefinition,
    defects: string[],
  ): void {
    const neck: IAutoMovieLoftChain = definition.neckChain;
    const upper: IAutoMovieLoftChain | undefined =
      definition.standing.chains.find(
        (chain: IAutoMovieLoftChain): boolean => chain.name === "upper",
      );
    if (
      upper === undefined ||
      !AutoMovieLoftJet.carries(neck) ||
      !AutoMovieLoftJet.carries(upper)
    ) {
      defects.push(`${name}: actual neck/upper regular 2-jets are unavailable`);
      return;
    }
    const station: number = neck.layers[0]!.y;
    if (
      upper.layers.at(-1)!.y !== station ||
      upper.layers.at(-1)!.frameSource !== neck.layers[0]!.frameSource
    )
      defects.push(
        `${name}: neck boundary lost its station or actual frame owner`,
      );
    const miss: Record<keyof AutoMovieLoftJet.IJet, number> = {
      p: 0,
      s: 0,
      t: 0,
      ss: 0,
      st: 0,
      tt: 0,
    };
    for (let index: number = 0; index < 64; index++) {
      const phase: number = (2 * Math.PI * index) / 64;
      const expected: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(
        neck,
        station,
        phase,
      );
      const actual: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(
        upper,
        station,
        phase,
      );
      for (const field of ["p", "s", "t", "ss", "st", "tt"] as const)
        miss[field] = Math.max(
          miss[field],
          Math.hypot(
            ...actual[field].map(
              (value: number, axis: number): number =>
                value - expected[field][axis]!,
            ),
          ),
        );
    }
    if (
      Object.values(miss).some(
        (value: number): boolean => !Number.isFinite(value) || value > 1e-9,
      )
    )
      defects.push(
        `${name}: actual neck boundary world 2-jet mismatch ${JSON.stringify(miss)}`,
      );
    console.log(
      JSON.stringify({
        person: name,
        regularNeckBoundary: { station, miss },
        scope:
          "same actual boundary, not public base tape or retired-skin equivalence",
      }),
    );
  }

  /** Observe the actual toe's fixed observation planes and their metre AST replay at endpoints and intermediate stations; this does not realize a skin or certify its cap smoothness.
   *
   * @evidence contracts/common.md#principled-implementation Replays the actual parallel toe AST and checks four actual station frames against its fixed foot observation plane.
   * @evidence contracts/common.md#clear-and-simple-design One internal observer owns this coherent assertion group; the public definition test decides invocation order and owns the aggregate failures.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves the original expected values, numeric tolerances, source queries and failure strings; no fixture selector, fallback shape or fitted compensation is added.
   * @evidence contracts/common.md#meaningful-documentation The retained method description states its actual source, coordinate or frame scope and unresolved final-skin/anatomical limits.
   * @evidence contracts/performance.md#efficient-algorithms Reads four frames per actual source/replay and compares three vectors; cost is bounded apart from the supplied axis preparation.
   * @evidence contracts/performance.md#reuse-equivalent-work Receives already generated source records from the single public test invocation; local engine preparations serve these reads only, with no duplicate Human definition.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary arrays and preparations leave scope synchronously; only the caller-owned defects and logged observations survive. No cache, process, renderer or external handle is acquired.
   */
  export function toeFrame(
    name: string,
    source: AutoMovieHumanSiteViewPart.IResult,
    defects: string[],
  ): void {
    if (
      source.part === null ||
      source.view === null ||
      source.view.axis.type !== "parallel"
    ) {
      defects.push(
        `${name}: fixed foot-axis source declaration is unavailable`,
      );
      return;
    }
    const replay: IAutoMovieViewPart | string = AutoMovieConstructionViews.part(
      source.view,
    );
    if (typeof replay === "string") {
      defects.push(`${name}: toe plane reconstruction failed: ${replay}`);
      return;
    }
    const first: number = source.part.stations[0]!;
    const last: number = source.part.stations.at(-1)!;
    const initial: AutoMovieLoftFrame.IFrame = source.part.axis.at(first);
    let replayMiss: number = 0;
    let planeMiss: number = 0;
    for (const station of [
      first,
      first + (last - first) / 4,
      (first + last) / 2,
      last,
    ]) {
      const actual: AutoMovieLoftFrame.IFrame = source.part.axis.at(station);
      const tree: AutoMovieLoftFrame.IFrame = replay.axis.at(station);
      for (const key of ["origin", "u", "v"] as const)
        for (let axis: number = 0; axis < 3; axis++)
          replayMiss = Math.max(
            replayMiss,
            Math.abs(actual[key][axis]! - tree[key][axis]!),
          );
      for (let axis: number = 0; axis < 3; axis++)
        planeMiss = Math.max(
          planeMiss,
          Math.abs(actual.u[axis]! - [0, 1, 0][axis]!),
          Math.abs(actual.v[axis]! - initial.v[axis]!),
        );
    }
    if (!Number.isFinite(replayMiss) || replayMiss > 1e-9)
      defects.push(
        `${name}: source-to-tree toe frame differs by ${replayMiss} mm`,
      );
    if (!Number.isFinite(planeMiss) || planeMiss > 1e-12)
      defects.push(
        `${name}: the fixed foot observation plane was transported by ${planeMiss}`,
      );
    console.log(
      JSON.stringify({
        part: name,
        toePlane: { first, last, replayMiss, planeMiss },
      }),
    );
  }

  /**
   * Verify the actual anatomical roll endpoint and metre AST replay without
   * realizing a skin or inventing a second frame owner.
   * Reads the actual generating part and its production converter replay.
   * The signed endpoint is hand across projected normal to the actual course
   * tangent; every origin and the base frame through WJC must stay unchanged.
   * Both hands query before, at, within and after the transition, with separate
   * finite endpoint/replay tolerances. All readings are synchronous and local:
   * no extra Human, process, renderer, final skin or retained cache is created.
   *
   * @evidence contracts/common.md#principled-implementation Projects the signed hand-across target onto the actual MCP normal plane and compares the real roll endpoint, five metre-replay stations and unchanged pre-WJC base.
   * @evidence contracts/common.md#clear-and-simple-design One internal observer owns this coherent assertion group; the public definition test decides invocation order and owns the aggregate failures.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves the original expected values, numeric tolerances, source queries and failure strings; no fixture selector, fallback shape or fitted compensation is added.
   * @evidence contracts/common.md#meaningful-documentation The retained method description states its actual source, coordinate or frame scope and unresolved final-skin/anatomical limits.
   * @evidence contracts/performance.md#efficient-algorithms One vector projection and five actual/base/replay frame queries dominate; no alternative roll interpolation is fitted.
   * @evidence contracts/performance.md#reuse-equivalent-work Receives already generated source records from the single public test invocation; local engine preparations serve these reads only, with no duplicate Human definition.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary arrays and preparations leave scope synchronously; only the caller-owned defects and logged observations survive. No cache, process, renderer or external handle is acquired.
   */
  export function materialFrame(
    name: string,
    source: AutoMovieHumanSiteViewPart.IResult,
    target: [number, number, number],
    defects: string[],
  ): void {
    if (
      source.part === null ||
      source.view === null ||
      source.view.axis.type !== "jointed" ||
      source.view.axis.roll === undefined
    ) {
      defects.push(
        `${name}: the WJC-to-MCP source material declaration is unavailable`,
      );
      return;
    }
    const declaration: typeof source.view.axis = source.view.axis;
    const from: number = declaration.roll!.from * 1000;
    const to: number = declaration.roll!.to * 1000;
    const base: ReturnType<typeof AutoMovieConstructionViews.frame> =
      AutoMovieConstructionViews.frame({
        type: "jointed",
        centres: declaration.centres,
        halves: declaration.halves,
        up: declaration.up,
      });
    const replay: IAutoMovieViewPart | string = AutoMovieConstructionViews.part(
      source.view,
    );
    if (typeof base === "string" || typeof replay === "string") {
      defects.push(
        `${name}: material frame reconstruction failed: ${typeof base === "string" ? base : replay}`,
      );
      return;
    }
    const endpoint: AutoMovieLoftFrame.IFrame = source.part.axis.at(to);
    const normal: [number, number, number] = [
      endpoint.v[1] * endpoint.u[2] - endpoint.v[2] * endpoint.u[1],
      endpoint.v[2] * endpoint.u[0] - endpoint.v[0] * endpoint.u[2],
      endpoint.v[0] * endpoint.u[1] - endpoint.v[1] * endpoint.u[0],
    ];
    const normalLength: number = Math.hypot(...normal);
    const tangent: number[] = normal.map(
      (value: number): number => value / normalLength,
    );
    const axial: number = target.reduce(
      (sum: number, value: number, axis: number): number =>
        sum + value * tangent[axis]!,
      0,
    );
    const projected: number[] = target.map(
      (value: number, axis: number): number => value - axial * tangent[axis]!,
    );
    const length: number = Math.hypot(...projected);
    const expected: number[] = projected.map(
      (value: number): number => value / length,
    );
    const miss: number = Math.hypot(
      ...endpoint.u.map(
        (value: number, axis: number): number => value - expected[axis]!,
      ),
    );
    if (
      ![normalLength, length, miss, ...expected].every(Number.isFinite) ||
      !(length > 0) ||
      miss > 1e-10
    )
      defects.push(
        `${name}: MCP radial material target misses its actual normal-plane projection by ${miss}`,
      );
    let replayMiss: number = 0;
    let initialMiss: number = 0;
    for (const station of [from - 1, from, (from + to) / 2, to, to + 1]) {
      const actual: AutoMovieLoftFrame.IFrame = source.part.axis.at(station);
      const tree: AutoMovieLoftFrame.IFrame = replay.axis.at(station);
      const before: AutoMovieLoftFrame.IFrame = base.at(station);
      for (const key of ["origin", "u", "v"] as const)
        for (let axis: number = 0; axis < 3; axis++) {
          replayMiss = Math.max(
            replayMiss,
            Math.abs(actual[key][axis]! - tree[key][axis]!),
          );
          if (station <= from)
            initialMiss = Math.max(
              initialMiss,
              Math.abs(actual[key][axis]! - before[key][axis]!),
            );
          if (key === "origin")
            initialMiss = Math.max(
              initialMiss,
              Math.abs(actual.origin[axis]! - before.origin[axis]!),
            );
        }
    }
    if (!Number.isFinite(replayMiss) || replayMiss > 1e-9)
      defects.push(
        `${name}: tree material-frame replay differs by ${replayMiss}`,
      );
    if (!Number.isFinite(initialMiss) || initialMiss > 1e-12)
      defects.push(
        `${name}: material roll moved the centreline or the base frame through WJC by ${initialMiss}`,
      );
    console.log(
      JSON.stringify({
        part: name,
        materialRoll: {
          from,
          to,
          target,
          endpointU: endpoint.u,
          projectedTarget: expected,
          miss,
          replayMiss,
          initialMiss,
        },
      }),
    );
  }
}
