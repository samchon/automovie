import {
  AutoMovieConstructionViews,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import type { AutoMovieConstructionNode } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { HumanDebugViewCurves } from "../../../../../packages/human/debug/compare/HumanDebugViewCurves";
import type { HumanDebugViewParts } from "../../../../../packages/human/debug/compare/HumanDebugViewParts";
import { HumanDebugViewPartsCache } from "../../../../../packages/human/debug/compare/HumanDebugViewPartsCache";
import type { IHumanDebugDocument } from "../../../../../packages/human/debug/contracts/IHumanDebugDocument";
import { HumanDebugEnvironment } from "../../../../../packages/human/debug/server/HumanDebugEnvironment";
import { HumanDebugGenerationSlot } from "../../../../../packages/human/debug/server/HumanDebugGenerationSlot";
import type { IHumanDebugEnvironment } from "../../../../../packages/human/debug/server/IHumanDebugEnvironment";
import { AutoMovieHumanBodyLaw } from "../../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import type { IAutoMovieHumanParameters } from "../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { f1 } from "../../../../../packages/playground/src/human-parameters/f1";
import { nclose } from "../../internal/nclose";

/**
 * Display-only changes reuse one real f1 source definition, while nested
 * anatomical edits invalidate it. No final solid realization is requested.
 *
 * Scenarios:
 * 1. A fresh cache builds f1, then receives the same input values in a new
 *    object: the same completed result is borrowed and its drawn curves agree.
 * 2. Increasing that object's nasal protrusion by one millimetre causes a new
 *    construction with different nose curves; repeating the edited input
 *    borrows the new result rather than either rebuilding or returning f1's
 *    old nose.
 * 3. A missing required body fails through the real producer. The next valid
 *    f1 request rebuilds instead of retaining the pre-failure construction,
 *    and its nose agrees with the original within 1e-9 m, a numerical bound
 *    far below the one-millimetre input change.
 *
 * 4. The actual production definition tree is read independently through
 *    AutoMovieConstructionViews.part. Every tree part's knots, normalized jets,
 *    parameter/range declarations, fullness,
 *    declared station frames and identities agree with the observed source;
 *    studies remain explicitly separate and final realization remains not-run.
 * 5. NaN and Infinity in the public skin-finish input both serialize as null,
 *    but the source stage (which does not realize appearance) still completes.
 *    Neither request is retained or confused with the other. A BigInt key
 *    failure also releases the old entry before the next valid recovery.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real cache/source producer, shared production definition and tree-view reader, then displays curves. It catches repeated work, stale nested inputs, a different source definition or misrepresented realization stage.
 * @evidence contracts/testing.md#independent-expectations Equal immutable inputs permit reuse; an anatomical edit invalidates it and changes its controlled part. Tree metre-to-mm roundtrips agree within 1e-7 mm and station-frame unit directions within 1e-10, far below the one-mm intervention. No reference fit or shape snapshot supplies expectations.
 * @evidence contracts/testing.md#distinguishing-cases Covers equivalent values, nested mutation/reuse, source and serialization failures/recovery, nonfinite JSON collisions, production-tree source agreement and explicit studies/not-run phase. Alias switching is not exercised. Final joins, appearance acceptance, rig and between-station tree-axis equivalence are outside this source test.
 * @evidence contracts/testing.md#execution-ownership A discoverable async Node CPU unit under --include human_debug_view_parts_cache. The existing absolute Human Environment/GenerationSlot is held for eight source definitions and released in finally. Relative overrides resolve from the viewer package directory. Only f1 is defined; no full realization, browser, GPU, extra coordinator or other person is started.
 */
export async function test_human_debug_view_parts_cache(): Promise<void> {
  const environment: IHumanDebugEnvironment = HumanDebugEnvironment(
    path.resolve(__dirname, "../../../../../packages/human"),
  );
  const slot: HumanDebugGenerationSlot = await HumanDebugGenerationSlot.acquire(
    path.resolve(environment.directory, environment.slotRoot),
    environment.slots,
    "comparison cache f1",
  );
  try {
    const cache: HumanDebugViewPartsCache = new HumanDebugViewPartsCache();
    const original: HumanDebugViewParts.IOutput = cache.get("f1", f1);
    const inputs: IAutoMovieHumanParameters = structuredClone(f1);
    const repeated: HumanDebugViewParts.IOutput = cache.get("f1", inputs);
    if (repeated !== original)
      throw new Error(
        "Equal input values repeated the comparison construction",
      );

    /** Read the displayed nose rather than the serialized input key. */
    const nose: (
      built: HumanDebugViewParts.IOutput,
    ) => IHumanDebugDocument.ICurve[] = (
      built: HumanDebugViewParts.IOutput,
    ): IHumanDebugDocument.ICurve[] =>
      HumanDebugViewCurves.of(built).curves.filter(
        (curve: IHumanDebugDocument.ICurve): boolean =>
          curve.id.startsWith("human.construction.view.nose/"),
      );

    /** Compare numeric output in metres, preserving curve identities and closure. */
    const same: (
      a: IHumanDebugDocument.ICurve[],
      b: IHumanDebugDocument.ICurve[],
    ) => boolean = (
      a: IHumanDebugDocument.ICurve[],
      b: IHumanDebugDocument.ICurve[],
    ): boolean =>
      a.length === b.length &&
      a.every((curve: IHumanDebugDocument.ICurve, i: number): boolean => {
        const other: IHumanDebugDocument.ICurve = b[i]!;
        return (
          curve.id === other.id &&
          curve.closed === other.closed &&
          curve.points.length === other.points.length &&
          curve.points.every(
            (point: IHumanDebugDocument.Point, j: number): boolean =>
              point.every((value: number, c: number): boolean =>
                nclose(value, other.points[j]![c]!, 1e-9),
              ),
          )
        );
      });
    const before: IHumanDebugDocument.ICurve[] = nose(original);
    if (before.length === 0)
      throw new Error("The f1 comparison has no nose curves to inspect");
    TestValidator.predicate(
      "Borrowing preserves the displayed nose",
      same(before, nose(repeated)),
    );

    if (inputs.head?.face?.nose?.protrusion === undefined)
      throw new Error("f1 must declare its measured nasal protrusion");
    inputs.head.face.nose.protrusion += 1;
    const changed: HumanDebugViewParts.IOutput = cache.get("f1", inputs);
    if (changed === original)
      throw new Error("A nested anatomical edit retained the old construction");
    TestValidator.predicate(
      "A changed nasal measure changes the displayed nose",
      !same(before, nose(changed)),
    );
    if (cache.get("f1", inputs) !== changed)
      throw new Error("The edited construction was not reused");

    let refused: boolean = false;
    try {
      cache.get("f1", {
        ...f1,
        body: null,
      } as unknown as IAutoMovieHumanParameters);
    } catch {
      refused = true;
    }
    if (!refused)
      throw new Error("The real producer accepted a missing required body");
    const recovered: HumanDebugViewParts.IOutput = cache.get("f1", f1);
    if (recovered === original || recovered === changed)
      throw new Error("A failed build retained a previous construction");
    TestValidator.predicate(
      "Recovery preserves the original nose geometry",
      same(before, nose(recovered)),
    );
    if (cache.get("f1", f1) !== recovered)
      throw new Error("A recovered construction was not reused");
    if (
      recovered.observation.stage !== "source-definition" ||
      recovered.observation.finalRealization !== "not-run"
    )
      throw new Error(
        "A source definition was presented as a completed calibration",
      );
    console.log(
      "f1 cached observation " + JSON.stringify(recovered.observation),
    );
    console.log(
      "f1 cached diagnostics " + JSON.stringify(recovered.diagnostics),
    );
    console.log("f1 source records " + JSON.stringify(recovered.sourceRecords));
    const malformed: IAutoMovieHumanParameters = structuredClone(f1);
    if (malformed.appearance === undefined)
      throw new Error("f1 must supply its skin-finish input for this case");
    let nonfinite: HumanDebugViewParts.IOutput | undefined;
    for (const value of [NaN, Infinity]) {
      malformed.appearance.skin.oiliness = value;
      const current: HumanDebugViewParts.IOutput = cache.get("f1", malformed);
      if (current === nonfinite || current === recovered)
        throw new Error(
          "Nonfinite JSON input retained or reused source records",
        );
      TestValidator.predicate(
        "Appearance input does not change source nose geometry",
        same(before, nose(current)),
      );
      nonfinite = current;
    }
    const afterNonfinite: HumanDebugViewParts.IOutput = cache.get("f1", f1);
    if (afterNonfinite === recovered || afterNonfinite === nonfinite)
      throw new Error("Nonfinite bypass retained a prior entry");
    malformed.appearance.skin.oiliness = 1n as unknown as number;
    let keyFailed: boolean = false;
    try {
      cache.get("f1", malformed);
    } catch (error: unknown) {
      keyFailed = error instanceof TypeError;
    }
    if (!keyFailed)
      throw new Error(
        "An unsupported BigInt key did not fail JSON serialization",
      );
    const afterKeyFailure: HumanDebugViewParts.IOutput = cache.get("f1", f1);
    if (afterKeyFailure === afterNonfinite)
      throw new Error("Serialization failure retained stale source records");
    TestValidator.predicate(
      "Serialization recovery preserves source geometry",
      same(before, nose(afterKeyFailure)),
    );
    definitionAgreement(original);
  } finally {
    slot.release();
  }
}

/** Compare actual production-tree inputs with the observed source, without realizing its joins. */
function definitionAgreement(built: HumanDebugViewParts.IOutput): void {
  const definition: AutoMovieHumanBodyLaw.IDefinition =
    AutoMovieHumanBodyLaw.define(f1);
  const pending: AutoMovieConstructionNode[] =
    definition.lane.root === null ? [] : [definition.lane.root];
  const observed: Map<string, HumanDebugViewParts.IPart> = new Map(
    built.parts.map(
      (
        part: HumanDebugViewParts.IPart,
      ): [string, HumanDebugViewParts.IPart] => [part.name, part],
    ),
  );
  const names: Set<string> = new Set();
  const views: Set<AutoMovieConstructionNode> = new Set();
  const failures: string[] = [];
  while (pending.length !== 0) {
    const node: AutoMovieConstructionNode = pending.pop()!;
    if (node.type !== "view") {
      pending.push(node.host);
      if (node.type !== "trim") pending.push(node.part);
      continue;
    }
    names.add(node.name);
    views.add(node);
    const raw: IAutoMovieViewPart | string =
      AutoMovieConstructionViews.part(node);
    const actual: IAutoMovieViewPart | undefined = observed.get(
      node.name,
    )?.part;
    if (typeof raw === "string" || actual === undefined) {
      failures.push(
        node.name +
          ": " +
          (typeof raw === "string" ? raw : "source observation missing"),
      );
      continue;
    }
    if (
      actual.pole !== raw.pole ||
      actual.order !== raw.order ||
      actual.samples !== raw.samples ||
      actual.fullness.kind !== raw.fullness.kind
    )
      failures.push(node.name + ": source identity/owner differs");
    const expectedLaws: IAutoMovieViewPart.IOutline[] = laws(raw);
    const actualLaws: IAutoMovieViewPart.IOutline[] = laws(actual);
    if (
      expectedLaws.length !== actualLaws.length ||
      expectedLaws.some(
        (law: IAutoMovieViewPart.IOutline, i: number): boolean =>
          !sameOutline(law, actualLaws[i]!),
      )
    )
      failures.push(
        node.name +
          ": source knots/fullness differ after the tree's metre boundary",
      );
    let position: number = 0;
    let direction: number = 0;
    for (const station of raw.stations) {
      const a: ReturnType<typeof actual.axis.at> = actual.axis.at(station);
      const b: ReturnType<typeof raw.axis.at> = raw.axis.at(station);
      for (let c: number = 0; c < 3; c++) {
        position = Math.max(position, Math.abs(a.origin[c]! - b.origin[c]!));
        direction = Math.max(
          direction,
          Math.abs(a.u[c]! - b.u[c]!),
          Math.abs(a.v[c]! - b.v[c]!),
        );
      }
    }
    if (!(position <= 1e-7 && direction <= 1e-10))
      failures.push(
        node.name +
          ": station frame differs (mm " +
          position +
          ", unit direction " +
          direction +
          ")",
      );
  }
  const latest: Map<string, (typeof definition.lane.sources)[number]> =
    new Map();
  if (built.sourceRecords.length !== definition.lane.sources.length)
    failures.push("Source-attempt inventory was truncated");
  definition.lane.sources.forEach(
    (source: (typeof definition.lane.sources)[number], i: number): void => {
      latest.set(source.name, source);
      const record:
        | HumanDebugViewParts.IOutput["sourceRecords"][number]
        | undefined = built.sourceRecords[i];
      if (
        record === undefined ||
        record.name !== source.name ||
        record.part !== (source.result.part !== null) ||
        record.loft !== (source.result.loft !== null) ||
        record.inTree !==
          (source.result.view !== null && views.has(source.result.view))
      ) {
        failures.push(source.name + ": source attempt/scope was replaced");
        return;
      }
      if (
        record.diagnostics.length !== source.result.diagnostics.length ||
        source.result.diagnostics.some(
          (
            diagnostic: (typeof source.result.diagnostics)[number],
            j: number,
          ): boolean => {
            const actual: typeof diagnostic | undefined = record.diagnostics[j];
            return (
              actual === undefined ||
              actual.producer !== diagnostic.producer ||
              actual.level !== diagnostic.level ||
              actual.contract !== diagnostic.contract ||
              actual.detail !== diagnostic.detail
            );
          },
        )
      )
        failures.push(
          source.name + ": original source diagnostics were changed",
        );
    },
  );
  for (const [name, source] of latest) {
    const actual: HumanDebugViewParts.IPart | undefined = observed.get(name);
    if (source.result.part === null) {
      if (
        actual !== undefined ||
        !built.observation.unavailableParts.includes(name)
      )
        failures.push(
          name + ": a failed last source was replaced by an earlier success",
        );
      continue;
    }
    if (
      actual === undefined ||
      (actual.loft === null) !== (source.result.loft === null)
    ) {
      failures.push(name + ": raw loft availability changed");
      continue;
    }
    const expectedSections: NonNullable<typeof source.result.loft>["sections"] =
      source.result.loft?.sections ?? [];
    const actualSections: typeof expectedSections = actual.loft?.sections ?? [];
    if (
      expectedSections.length !== actualSections.length ||
      expectedSections.some(
        (section: (typeof expectedSections)[number], i: number): boolean =>
          !nclose(section.station, actualSections[i]!.station, 1e-7) ||
          section.section.box.extents.some(
            (value: number, c: number): boolean =>
              !nclose(value, actualSections[i]!.section.box.extents[c]!, 1e-7),
          ),
      )
    )
      failures.push(name + ": raw section owner changed");
  }
  if (
    names.size !== built.observation.treeParts.length ||
    built.observation.treeParts.some(
      (name: string): boolean => !names.has(name),
    )
  )
    failures.push("Observed production-tree membership differs");
  if (
    definition.head.source.studies.some(
      (study: (typeof definition.head.source.studies)[number]): boolean =>
        !built.observation.studies.includes(study.part.name),
    )
  )
    failures.push("An independent head study lost its scope");
  console.log(
    "f1 source agreement " +
      JSON.stringify({
        treeParts: names.size,
        sourceParts: built.parts.length,
        studies: built.observation.studies.length,
        finalRealization: built.observation.finalRealization,
      }),
  );
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}

/** Source metadata survives the tree's metre boundary; tau derivatives keep the scalar's units. */
function sameOutline(
  a: IAutoMovieViewPart.IOutline,
  b: IAutoMovieViewPart.IOutline,
): boolean {
  const equal = (
    x: number | null | undefined,
    y: number | null | undefined,
  ): boolean =>
    x === y ||
    (typeof x === "number" && typeof y === "number" && nclose(x, y, 1e-7));
  if (
    a.parameter?.type !== b.parameter?.type ||
    (a.range === undefined) !== (b.range === undefined) ||
    !equal(a.range?.minimum, b.range?.minimum) ||
    !equal(a.range?.maximum, b.range?.maximum)
  )
    return false;
  if (
    a.parameter?.type === "root" &&
    (b.parameter?.type !== "root" ||
      a.parameter.end !== b.parameter.end ||
      !equal(a.parameter.pole, b.parameter.pole))
  )
    return false;
  if (
    a.parameter?.type === "angle" &&
    (b.parameter?.type !== "angle" ||
      !equal(a.parameter.bottom, b.parameter.bottom) ||
      !equal(a.parameter.top, b.parameter.top))
  )
    return false;
  return (
    a.knots.length === b.knots.length &&
    a.knots.every((knot: IAutoMovieViewPart.IKnot, i: number): boolean => {
      const other: IAutoMovieViewPart.IKnot = b.knots[i]!;
      return (
        knot.site === other.site &&
        equal(knot.station, other.station) &&
        equal(knot.value, other.value) &&
        (knot.jet === undefined) === (other.jet === undefined) &&
        equal(knot.jet?.first, other.jet?.first) &&
        equal(knot.jet?.second, other.jet?.second)
      );
    })
  );
}

/** Every scalar source law, preserving front/side signs and each fullness quarter's ownership. */
function laws(part: IAutoMovieViewPart): IAutoMovieViewPart.IOutline[] {
  const owner: IAutoMovieViewPart.Fullness = part.fullness;
  return [
    part.front.positive,
    part.front.negative,
    part.side.positive,
    part.side.negative,
    ...(owner.kind === "top"
      ? owner.shoulders
      : [
          owner.kind === "girth" ? owner.girth : owner.shoulder,
          ...(owner.departures ?? []),
        ]),
  ];
}
