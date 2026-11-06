import {
  AutoMovieConstructionViews,
  type AutoMovieLoftFrame,
  AutoMovieViewCurves,
  AutoMovieViewOutline,
  AutoMovieViewParameter,
  AutoMovieViewSection,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import { AutoMovieHumanBodyAnatomy } from "../../../../packages/human/src/generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import type { AutoMovieHumanSiteViewPart } from "../../../../packages/human/src/generation/limb/AutoMovieHumanSiteViewPart";
import { AutoMovieHumanSex } from "../../../../packages/human/src/typings/AutoMovieHumanSex";
import { HumanPeople } from "./HumanPeople";

/**
 * Observe original trunk tape, signed cap and AP mass source identities from one existing body definition. These checks distinguish source construction from final loft, joining and anatomical protocol claims.
 *
 * @evidence contracts/common.md#principled-implementation Retains the original assertion bodies and public-engine observations, with their fixed expectations and limitations. This module changes ownership of test code only.
 * @evidence contracts/common.md#clear-and-simple-design Groups one coherent source-observation responsibility behind one exported namespace; the main test remains the sole generator and execution coordinator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no assertion suppression, tolerance change, fit, source mutation or alternative construction.
 * @evidence contracts/common.md#meaningful-documentation Each observer retains its source/frame scope, assumptions and failure meaning; no final skin or general anatomical result is inferred from these reads.
 * @evidence contracts/performance.md#efficient-algorithms Work remains the sum of the unchanged bounded observer loops and public source preparation; merely moving these loops changes no algorithm or sampling density.
 * @evidence contracts/performance.md#reuse-equivalent-work All functions receive the one existing definition or its actual parts; there is no additional generation or persistent cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The namespace retains only function definitions. Observations are synchronous and call-local; the public test owns the aggregate defects.
 */
export namespace HumanBodyDefinitionTrunkSource {
  /** Read the existing production section, not a second Human definition. The retained compressed-caliper ratio is a construction prior; source tape closure is not a tissue or final-skin certificate.
   *
   * @evidence contracts/common.md#principled-implementation Reads four original scalar supports and their actual shoulder through the engine, then checks the retained B:D, ellipse shoulder and public tape without a second box normalizer.
   * @evidence contracts/common.md#clear-and-simple-design One internal observer owns this coherent assertion group; the public definition test decides invocation order and owns the aggregate failures.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves the original expected values, numeric tolerances, source queries and failure strings; no fixture selector, fallback shape or fitted compensation is added.
   * @evidence contracts/common.md#meaningful-documentation The retained method description states its actual source, coordinate or frame scope and unresolved final-skin/anatomical limits.
   * @evidence contracts/performance.md#efficient-algorithms Four edge reads and one bounded section-length evaluation dominate; scalar preparation is linear in the supplied knot lists.
   * @evidence contracts/performance.md#reuse-equivalent-work Receives already generated source records from the single public test invocation; local engine preparations serve these reads only, with no duplicate Human definition.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary arrays and preparations leave scope synchronously; only the caller-owned defects and logged observations survive. No cache, process, renderer or external handle is acquired.
   */
  export function underbustSource(
    name: string,
    part: IAutoMovieViewPart,
    measures: ReturnType<typeof AutoMovieHumanBodyAnatomy.resolve>,
    scale: number,
    defects: string[],
  ): void {
    const station: number | undefined = part.front.positive.knots.find(
      (k: IAutoMovieViewPart.IKnot): boolean => k.site === "underbust",
    )?.station;
    if (station === undefined || part.fullness.kind !== "shoulder") {
      defects.push(`${name}: underbust source missing`);
      return;
    }
    const prepared: AutoMovieViewCurves.IResult =
      AutoMovieViewCurves.create(part);
    const edges: (number | string)[] = prepared.curves.map(
      (curve: AutoMovieViewCurves.ICurve): number | string =>
        curve.outline === null
          ? "missing underbust edge"
          : AutoMovieViewOutline.value(curve.outline, station),
    );
    const fullness:
      | AutoMovieViewOutline.IOutline
      | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(
      part.fullness.shoulder,
    );
    if (
      edges.some(
        (value: number | string): boolean => typeof value === "string",
      ) ||
      "detail" in fullness
    ) {
      defects.push(`${name}: underbust source reading failed`);
      return;
    }
    const shoulder: number | string = AutoMovieViewOutline.value(
      fullness,
      station,
    );
    if (typeof shoulder === "string") {
      defects.push(`${name}: ${shoulder}`);
      return;
    }
    const values: number[] = edges as number[];
    const depth: number = values[0]! - values[1]!;
    const breadth: number = values[2]! - values[3]!;
    const tape: number = AutoMovieViewSection.length(
      AutoMovieViewSection.of(
        { extents: [values[0]!, values[2]!, -values[1]!, -values[3]!] },
        [shoulder, shoulder, shoulder, shoulder],
      ),
    );
    const g: number = measures.underbustCircumference;
    const ratio: number =
      measures.sex === AutoMovieHumanSex.Female
        ? (19.97 + 0.1828 * g) / (74.78 + 0.2164 * g)
        : (-2.46 + 0.2085 * g) / (87.04 + 0.2104 * g);
    if (
      ![depth, breadth, tape, shoulder].every(Number.isFinite) ||
      Math.abs(tape - g * scale) > 1e-6 ||
      Math.abs(depth / breadth - ratio) > 1e-12 ||
      Math.abs(shoulder - AutoMovieViewSection.ELLIPSE) > 1e-8
    )
      defects.push(
        `${name}: underbust ellipse/source tape does not retain its declared ratio and G`,
      );
    console.log(
      JSON.stringify({
        person: name,
        underbustSource: {
          station,
          depth,
          breadth,
          shoulder,
          tape,
          publicG: g * scale,
          ratio,
          scope:
            "original ellipse template, not measured skin morphology or final loft",
        },
      }),
    );
  }

  /** Read the actual cap sources and their declared hull bounds, pole-parameter jets and metre replay. Critical/regular observations supplement the shared control-hull contract; they do not prove final loft fidelity or a general world bound. All data belongs to the existing definition.
   *
   * @evidence contracts/common.md#principled-implementation Reads actual signed source declarations, pole-parameter jets and aligned metre replay. Control-hull admission and counterexample readings remain separate from final surface G2.
   * @evidence contracts/common.md#clear-and-simple-design One internal observer owns this coherent assertion group; the public definition test decides invocation order and owns the aggregate failures.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves the original expected values, numeric tolerances, source queries and failure strings; no fixture selector, fallback shape or fitted compensation is added.
   * @evidence contracts/common.md#meaningful-documentation The retained method description states its actual source, coordinate or frame scope and unresolved final-skin/anatomical limits.
   * @evidence contracts/performance.md#efficient-algorithms For four curves, reads their knot/critical candidates and 127 regular stations plus two endpoints; work follows the source knot/root counts and bounded replay grid.
   * @evidence contracts/performance.md#reuse-equivalent-work Receives already generated source records from the single public test invocation; local engine preparations serve these reads only, with no duplicate Human definition.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary arrays and preparations leave scope synchronously; only the caller-owned defects and logged observations survive. No cache, process, renderer or external handle is acquired.
   */
  export function trunkSpan(
    name: string,
    source: AutoMovieHumanSiteViewPart.IResult,
    defects: string[],
  ): void {
    if (source.part === null || source.view === null) return;
    const part: IAutoMovieViewPart = source.part;
    const replay: IAutoMovieViewPart | string = AutoMovieConstructionViews.part(
      source.view,
    );
    if (typeof replay === "string") {
      defects.push(`${name}: trunk source replay: ${replay}`);
      return;
    }
    const originals: AutoMovieViewCurves.IResult =
      AutoMovieViewCurves.create(part);
    const copies: AutoMovieViewCurves.IResult =
      AutoMovieViewCurves.create(replay);
    for (const diagnostic of [...originals.diagnostics, ...copies.diagnostics])
      defects.push(
        `${name}: trunk original/replay ${diagnostic.contract}: ${diagnostic.detail}`,
      );
    for (const curve of originals.curves) {
      const sign: 1 | -1 = curve.name.endsWith("positive") ? 1 : -1;
      const outline: AutoMovieViewOutline.IOutline | null = curve.outline;
      const copied: AutoMovieViewCurves.ICurve = copies.curves.find(
        (candidate: AutoMovieViewCurves.ICurve): boolean =>
          candidate.name === curve.name,
      )!;
      if (outline === null || copied.outline === null) {
        defects.push(`${name}/${curve.name}: missing cap source`);
        continue;
      }
      const declared: IAutoMovieViewPart.IOutline =
        curve.name === "front.positive"
          ? part.front.positive
          : curve.name === "front.negative"
            ? part.front.negative
            : curve.name === "side.positive"
              ? part.side.positive
              : part.side.negative;
      if (
        part.pole !== "both" ||
        outline.hermite === undefined ||
        (sign === 1
          ? declared.range?.minimum !== 0 || declared.range.maximum !== null
          : declared.range?.maximum !== 0 || declared.range.minimum !== null)
      )
        defects.push(
          `${name}/${curve.name}: no declared signed whole-span hull`,
        );
      const [start, end]: readonly [number, number] = outline.domain;
      const stations: Set<number> = new Set([
        ...outline.knots.map(
          (knot: IAutoMovieViewPart.IKnot): number => knot.station,
        ),
        ...AutoMovieViewOutline.criticalStations(outline),
      ]);
      for (let index: number = 1; index < 128; index++)
        stations.add(start + ((end - start) * index) / 128);
      let minimum: number = Infinity;
      let replayMiss: number = 0;
      for (const station of stations) {
        const reading: AutoMovieViewCurves.IReading | string =
          AutoMovieViewCurves.at(curve, part.axis, station);
        if (typeof reading === "string") {
          defects.push(`${name}/${curve.name}: ${reading}`);
          continue;
        }
        minimum = Math.min(minimum, sign * reading.scalar.value);
        const copiedStation: number = AutoMovieViewParameter.station(
          copied.outline.parameter,
          reading.scalar.parameter,
        );
        const repeated: AutoMovieViewCurves.IReading | string =
          AutoMovieViewCurves.at(copied, replay.axis, copiedStation);
        if (typeof repeated === "string")
          defects.push(`${name}/${curve.name}: aligned replay ${repeated}`);
        else
          replayMiss = Math.max(
            replayMiss,
            Math.hypot(
              ...repeated.point.map(
                (value: number, axis: number): number =>
                  value - reading.point[axis]!,
              ),
            ),
            ...repeated.scalar.parameterJet.map(
              (value: number, axis: number): number =>
                Math.abs(value - reading.scalar.parameterJet[axis]!),
            ),
          );
      }
      for (const station of [start, end]) {
        const reading: AutoMovieViewOutline.IReading | string =
          AutoMovieViewOutline.at(outline, station);
        if (
          typeof reading === "string" ||
          reading.stationJet !== null ||
          reading.stationJetStatus !== "singular-pole" ||
          !(
            sign * reading.parameterJet[0] * (station === start ? 1 : -1) >
            0
          ) ||
          Math.abs(reading.parameterJet[1]) > 1e-9
        )
          defects.push(
            `${name}/${curve.name}: invalid nonzero root tangent or fabricated physical pole jet at ${station}`,
          );
      }
      if (minimum < -1e-9 || replayMiss > 1e-9)
        defects.push(
          `${name}/${curve.name}: signed source minimum ${minimum}, actual metre replay miss ${replayMiss}`,
        );
      console.log(
        JSON.stringify({
          person: name,
          source: `trunk.${curve.name}`,
          signedMinimum: minimum,
          replayMiss,
          scope:
            "original signed hull and parameter jets, not final surface G2",
        }),
      );
    }
  }

  /**
   * Each actual source pole retains its public AP target on the same level as
   * the trunk's tape. Whole-depth is read from the original opposite trunk
   * guide to that pole; bilateral breast Z is the public half span. Fixed AP
   * section planes make the closed mass's station endpoints its AP supports,
   * independently of its radial curves. No final union or attachment is read.
   *
   * @evidence contracts/common.md#principled-implementation Checks the actual AP pole against the same trunk source height, opposite guide, public whole depth and bilateral breast span. No placement-solver output supplies the expected depth.
   * @evidence contracts/common.md#clear-and-simple-design One internal observer owns this coherent assertion group; the public definition test decides invocation order and owns the aggregate failures.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves the original expected values, numeric tolerances, source queries and failure strings; no fixture selector, fallback shape or fitted compensation is added.
   * @evidence contracts/common.md#meaningful-documentation The retained method description states its actual source, coordinate or frame scope and unresolved final-skin/anatomical limits.
   * @evidence contracts/performance.md#efficient-algorithms Prepares the trunk once, then reads at most two mass kinds and two sides with one source replay each.
   * @evidence contracts/performance.md#reuse-equivalent-work Receives already generated source records from the single public test invocation; local engine preparations serve these reads only, with no duplicate Human definition.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary arrays and preparations leave scope synchronously; only the caller-owned defects and logged observations survive. No cache, process, renderer or external handle is acquired.
   */
  export function massApex(
    name: string,
    definition: AutoMovieHumanBodyLaw.IDefinition,
    trunk: IAutoMovieViewPart,
    params: ReturnType<typeof HumanPeople.params>,
    defects: string[],
  ): void {
    const measures: ReturnType<typeof AutoMovieHumanBodyAnatomy.resolve> =
      AutoMovieHumanBodyAnatomy.resolve(params);
    const scale: number = AutoMovieHumanBodyLaw.limbInputs(params).legs.scale;
    const curves: AutoMovieViewCurves.ICurve[] =
      AutoMovieViewCurves.create(trunk).curves;
    for (const kind of ["breast", "gluteal"] as const) {
      if (kind === "breast" && measures.sex !== AutoMovieHumanSex.Female)
        continue;
      const site: string = kind === "breast" ? "chest" : "buttock";
      const station: number | undefined = trunk.front.positive.knots.find(
        (knot: IAutoMovieViewPart.IKnot): boolean => knot.site === site,
      )?.station;
      if (station === undefined) {
        defects.push(`${name}: mass ${kind} has no common ${site} source site`);
        continue;
      }
      const opposite: AutoMovieViewCurves.ICurve = curves.find(
        (curve: AutoMovieViewCurves.ICurve): boolean =>
          curve.name ===
          (kind === "breast" ? "front.negative" : "front.positive"),
      )!;
      const wall: AutoMovieViewCurves.IReading | string =
        AutoMovieViewCurves.at(opposite, trunk.axis, station);
      if (typeof wall === "string") {
        defects.push(`${name}/${kind}: opposite source guide failed: ${wall}`);
        continue;
      }
      for (const side of ["left", "right"] as const) {
        const source: AutoMovieHumanSiteViewPart.ISource | undefined =
          definition.lane.sources
            .filter(
              (attempt: AutoMovieHumanSiteViewPart.ISource): boolean =>
                attempt.name === `${kind}.${side}`,
            )
            .at(-1);
        if (source?.result.part === null || source?.result.part === undefined) {
          defects.push(
            `${name}/${kind}.${side}: actual mass source is unavailable`,
          );
          continue;
        }
        const part: IAutoMovieViewPart = source.result.part;
        const last: number = part.stations.at(-1)!;
        const apex: [number, number, number] = part.axis.at(last).origin;
        const frame: AutoMovieLoftFrame.IFrame = part.axis.at(last);
        const depth: number =
          kind === "breast" ? apex[0] - wall.point[0] : wall.point[0] - apex[0];
        const expected: number =
          (kind === "breast" ? measures.chestDepth : measures.buttockDepth) *
          scale;
        const replay: IAutoMovieViewPart | string =
          source.result.view === null
            ? "missing actual view"
            : AutoMovieConstructionViews.part(source.result.view);
        const replayMiss: number =
          typeof replay === "string"
            ? Infinity
            : Math.hypot(
                ...replay.axis
                  .at(last)
                  .origin.map(
                    (value: number, axis: number): number =>
                      value - apex[axis]!,
                  ),
              );
        if (
          !apex.every(Number.isFinite) ||
          Math.abs(apex[1] - station) > 1e-9 ||
          Math.abs(depth - expected) > 1e-9 ||
          frame.u[0] !== 0 ||
          frame.v[0] !== 0 ||
          replayMiss > 1e-9
        )
          defects.push(
            `${name}/${kind}.${side}: source AP apex/site/depth/replay does not retain its original definition`,
          );
        if (
          kind === "breast" &&
          Math.abs(
            apex[2] -
              ((side === "left" ? 1 : -1) * measures.bustPointWidth * scale) /
                2,
          ) > 1e-9
        )
          defects.push(
            `${name}/${kind}.${side}: actual source apex does not retain public half bust-point span`,
          );
        console.log(
          JSON.stringify({
            person: name,
            part: `${kind}.${side}`,
            originalApex: apex,
            tapeSite: station,
            oppositeGuide: wall.point,
            originalDepth: depth,
            publicDepth: expected,
            replayMiss,
            scope: "original AP support, not final union or tape",
          }),
        );
      }
    }
  }
}
