import {
  AutoMovieConstructionViews,
  type AutoMovieLoftFrame,
  AutoMovieViewCurves,
  AutoMovieViewOutline,
  AutoMovieViewSection,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import { AutoMovieHumanBodyLaw } from "../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import type { AutoMovieHumanSiteViewPart } from "../../../../packages/human/src/generation/limb/AutoMovieHumanSiteViewPart";

/**
 * Observe the actual fixed proximal arm source, public bideltoid support, biceps tape and named joint-centre replay. The retained source family and measuring-pose convention do not certify anatomical GH placement or final shoulder skin.
 *
 * @evidence contracts/common.md#principled-implementation Retains the original assertion bodies and public-engine observations, with their fixed expectations and limitations. This module changes ownership of test code only.
 * @evidence contracts/common.md#clear-and-simple-design Groups one coherent source-observation responsibility behind one exported namespace; the main test remains the sole generator and execution coordinator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no assertion suppression, tolerance change, fit, source mutation or alternative construction.
 * @evidence contracts/common.md#meaningful-documentation Each observer retains its source/frame scope, assumptions and failure meaning; no final skin or general anatomical result is inferred from these reads.
 * @evidence contracts/performance.md#efficient-algorithms Work remains the sum of the unchanged bounded observer loops and public source preparation; merely moving these loops changes no algorithm or sampling density.
 * @evidence contracts/performance.md#reuse-equivalent-work All functions receive the one existing definition or its actual parts; there is no additional generation or persistent cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The namespace retains only function definitions. Observations are synchronous and call-local; the public test owns the aggregate defects.
 */
export namespace HumanBodyDefinitionShoulder {
  /** Read the actual fixed upper source, its binary64 critical candidates and biceps tape; no production normalizer output or final skin supplies an expectation.
   *
   * @evidence contracts/common.md#principled-implementation Reads scalar critical candidates of the same fixed deltoid domain, public B and biceps G, then checks actual elbow/WJC/MCP/crease references.
   * @evidence contracts/common.md#clear-and-simple-design One internal observer owns this coherent assertion group; the public definition test decides invocation order and owns the aggregate failures.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves the original expected values, numeric tolerances, source queries and failure strings; no fixture selector, fallback shape or fitted compensation is added.
   * @evidence contracts/common.md#meaningful-documentation The retained method description states its actual source, coordinate or frame scope and unresolved final-skin/anatomical limits.
   * @evidence contracts/performance.md#efficient-algorithms Source preparation, its named/critical candidate count and four biceps edge reads dominate; no final surface or whole Human is generated.
   * @evidence contracts/performance.md#reuse-equivalent-work Receives already generated source records from the single public test invocation; local engine preparations serve these reads only, with no duplicate Human definition.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary arrays and preparations leave scope synchronously; only the caller-owned defects and logged observations survive. No cache, process, renderer or external handle is acquired.
   */
  export function shoulderSource(
    name: string,
    source: AutoMovieHumanSiteViewPart.IResult,
    side: "left" | "right",
    definition: AutoMovieHumanBodyLaw.IDefinition,
    input: AutoMovieHumanBodyLaw.ILimbInputs,
    defects: string[],
  ): void {
    if (source.part === null || source.view === null) return;
    const part: IAutoMovieViewPart = source.part;
    const gh: (typeof definition.skeleton)[number] = definition.skeleton.find(
      (bone: (typeof definition.skeleton)[number]): boolean =>
        bone.bone === `${side}UpperArm`,
    )!;
    const elbow: (typeof definition.skeleton)[number] =
      definition.skeleton.find(
        (bone: (typeof definition.skeleton)[number]): boolean =>
          bone.bone === `${side}LowerArm`,
      )!;
    const start: AutoMovieLoftFrame.IFrame = part.axis.at(0);
    const run: number = Math.hypot(
      ...start.origin.map(
        (value: number, c: number): number => value - gh.position[c]!,
      ),
    );
    const humerus: number = Math.hypot(
      ...gh.position.map(
        (value: number, c: number): number => value - elbow.position[c]!,
      ),
    );
    const end: number = run + humerus / 2;
    const prepared: AutoMovieViewCurves.IResult =
      AutoMovieViewCurves.create(part);
    const outer: AutoMovieViewCurves.ICurve | undefined = prepared.curves.find(
      (curve: AutoMovieViewCurves.ICurve): boolean =>
        curve.name === (side === "left" ? "side.negative" : "side.positive"),
    );
    if (outer?.outline === null || outer === undefined) {
      defects.push(`${name}: original deltoid support unavailable`);
      return;
    }
    const sign: number = side === "left" ? -1 : 1;
    const stations: number[] = [
      0,
      end,
      ...outer.outline.knots.map(
        (k: IAutoMovieViewPart.IKnot): number => k.station,
      ),
      ...AutoMovieViewOutline.criticalStations(outer.outline),
    ].filter((station: number): boolean => station >= 0 && station <= end);
    let radius: number = -Infinity;
    let maximumAt: number = NaN;
    let frameMiss: number = 0;
    for (const station of stations) {
      const scalar: number | string = AutoMovieViewOutline.value(
        outer.outline,
        station,
      );
      if (typeof scalar === "string") {
        defects.push(`${name}: ${scalar}`);
        continue;
      }
      if (sign * scalar > radius) {
        radius = sign * scalar;
        maximumAt = station;
      }
      const frame: AutoMovieLoftFrame.IFrame = part.axis.at(station);
      for (const key of ["u", "v"] as const)
        for (let c: number = 0; c < 3; c++)
          frameMiss = Math.max(
            frameMiss,
            Math.abs(frame[key][c]! - start[key][c]!),
          );
    }
    const breadth: number = 2 * (Math.abs(gh.position[2]) + radius);
    if (
      !Number.isFinite(breadth) ||
      Math.abs(breadth - input.arms.bideltoid) > 1e-6 ||
      frameMiss > 1e-10
    )
      defects.push(
        `${name}: fixed deltoid source B ${breadth} instead of ${input.arms.bideltoid}, frame drift ${frameMiss}`,
      );
    if (
      source.view.axis.type !== "jointed" ||
      source.view.axis.centres.length !== 6
    )
      defects.push(
        `${name}: redundant GH joint or hand-course centres changed`,
      );
    else {
      const wrist: (typeof definition.skeleton)[number] =
        definition.skeleton.find(
          (bone: (typeof definition.skeleton)[number]): boolean =>
            bone.bone === `${side}Hand`,
        )!;
      for (const [index, expected] of [
        [1, elbow.position],
        [2, wrist.position],
        [3, definition.hands[side].knuckle],
        [4, definition.hands[side].crease],
      ] as [number, [number, number, number]][]) {
        const actual: [number, number, number] =
          AutoMovieConstructionViews.point(source.view.axis.centres[index]!);
        if (
          actual.some(
            (value: number, c: number): boolean =>
              Math.abs(value - expected[c]!) > 1e-9,
          )
        )
          defects.push(
            `${name}: source AST centre ${index} lost its actual elbow/WJC/MCP/crease datum`,
          );
      }
    }
    const biceps: number | undefined = part.front.positive.knots.find(
      (k: IAutoMovieViewPart.IKnot): boolean => k.site === "biceps",
    )?.station;
    if (biceps === undefined || part.fullness.kind !== "shoulder") {
      defects.push(`${name}: biceps source tape missing`);
      return;
    }
    const projection: number =
      definition.standing.trunk!.shoulder[1] - gh.position[1];
    if (Math.abs(biceps - (run + input.arms.upper / 2 - projection)) > 1e-9)
      defects.push(
        `${name}: biceps source no longer uses its explicit half-AR station proxy`,
      );
    const fullness: ReturnType<typeof AutoMovieViewOutline.create> =
      AutoMovieViewOutline.create(part.fullness.shoulder);
    if ("detail" in fullness) {
      defects.push(`${name}: ${fullness.detail}`);
      return;
    }
    const shoulder: number | string = AutoMovieViewOutline.value(
      fullness,
      biceps,
    );
    const values: (number | string)[] = prepared.curves.map(
      (curve: AutoMovieViewCurves.ICurve): number | string =>
        curve.outline === null
          ? "missing edge"
          : AutoMovieViewOutline.value(curve.outline, biceps),
    );
    if (
      typeof shoulder === "string" ||
      values.some(
        (value: number | string): boolean => typeof value === "string",
      )
    ) {
      defects.push(`${name}: biceps source reading failed`);
      return;
    }
    const edges: number[] = values as number[];
    const girth: number = AutoMovieViewSection.length(
      AutoMovieViewSection.of(
        { extents: [edges[0]!, edges[2]!, -edges[1]!, -edges[3]!] },
        [shoulder, shoulder, shoulder, shoulder],
      ),
    );
    if (!Number.isFinite(girth) || Math.abs(girth - input.arms.bicep) > 1e-6)
      defects.push(
        `${name}: biceps source G ${girth} instead of ${input.arms.bicep}`,
      );
    console.log(
      JSON.stringify({
        part: name,
        shoulderSource: {
          gh: gh.position,
          humerus,
          domain: [0, end],
          maximumAt,
          radius,
          breadth,
          publicB: input.arms.bideltoid,
          frameMiss,
          girth,
          publicG: input.arms.bicep,
          scope:
            "original fixed-frame guide support; final shoulder skin not run",
        },
      }),
    );
  }
}
