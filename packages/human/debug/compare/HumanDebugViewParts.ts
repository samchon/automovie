import type {
  AutoMovieLoftContract,
  AutoMovieViewLoft,
  IAutoMovieViewPart,
} from "@automovie/engine";
import type { AutoMovieConstructionNode } from "@automovie/interface";

import { AutoMovieHumanBodyAnatomy } from "../../src/generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "../../src/generation/AutoMovieHumanBodyLaw";
import type { IAutoMovieHumanParameters } from "../../src/structures/IAutoMovieHumanParameters";

/**
 * Observe actual production source assembly before final solid realization.
 *
 * BodyLaw.define is the same assembly calibrate later realizes. The definition
 * explicitly returns the source builders' actual results and the head's one
 * composer output. A name keeps its last result, including a failure, so an
 * earlier successful pass cannot conceal its failed replacement. Original
 * source diagnostics and unconnected studies remain explicit.
 * Final joins, trimmed skin and rig checks have not run. Coordinates are
 * calibration mm; scale converts them to person mm about the floor.
 *
 * @evidence contracts/common.md#principled-implementation Observes the same production definition consumed by calibrate, before BodyLane.realize, retaining actual part/loft records and source diagnostics.
 * @evidence contracts/common.md#clear-and-simple-design One source assembly serves body and head; production-tree names, studies and other definition records remain distinct metadata.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No foreign method is replaced and no alternate geometry, fixture, intermediate throw or fake completed calibration is used. Source exceptions propagate; final realization is not run.
 * @evidence contracts/common.md#meaningful-documentation States phase, diagnostic ownership, repeated names, scale and unverified final stages.
 * @evidence contracts/performance.md#efficient-algorithms Runs source builders/raw lofts once, indexes R recorded lofts and visits T tree nodes in O(R+T), without tracing final solid joins.
 * @evidence contracts/performance.md#reuse-equivalent-work The actual head composer is already in this definition, so no second head is built. Page reuse belongs to the separate cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns last-result source references and fresh diagnostic/name arrays. Temporary maps and intermediate results end with the call; no operator, renderer or handle is acquired.
 */
export namespace HumanDebugViewParts {
  /**
   * One actual source part and its nullable raw loft, before final joins.
   *
   * @evidence contracts/common.md#principled-implementation Keeps the same source input even when its builder has no raw loft, allowing original outlines to remain observable.
   * @evidence contracts/common.md#clear-and-simple-design Source identity and raw section availability are separate fields of one observation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Null does not substitute geometry or report a completed skin.
   * @evidence contracts/common.md#meaningful-documentation Names exact input ownership, raw failure state and not-run joins.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This type chooses no runtime algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The page cache owns source reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The observation borrows these references for read-only consumers.
   */
  export interface IPart {
    /** Source name. */
    name: string;

    /** Exact part handed to the production source operator. */
    part: IAutoMovieViewPart;

    /** Raw operator result, including rejected sections; null when the source builder did not loft it. */
    loft: AutoMovieViewLoft.IResult | null;
  }

  /**
   * Source records borrowed without mutation by display consumers.
   *
   * @evidence contracts/common.md#principled-implementation Keeps actual source inputs/results, scale, repeats, source diagnostic groups and an explicit not-run final stage.
   * @evidence contracts/common.md#clear-and-simple-design One record serves original curves, reference crops and approximate raw-section diagnostics.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing support remains diagnosed; this record represents no completed final skin.
   * @evidence contracts/common.md#meaningful-documentation Fields state units, ownership, stage and tree-versus-study meanings.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A type chooses no runtime algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Page reuse belongs to the cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns this record and its retained raw references.
   */
  export interface IOutput {
    /** Last available source result per name; a failed replacement removes that name. */
    parts: IPart[];
    /** Person millimetres per calibration millimetre. */
    scale: number;
    /** Repeated explicitly returned source records and their counts, not a count of foreign operator calls. */
    repeats: Record<string, number>;
    /** Body/anatomy source diagnostics and the same head composer's diagnostics; no final joins have run. */
    diagnostics: {
      body: AutoMovieLoftContract.IDiagnostic[];
      head: AutoMovieLoftContract.IDiagnostic[];
    };
    /** Every body builder's original attempt and diagnostic list, including failed or superseded passes. */
    sourceRecords: {
      name: string;
      part: boolean;
      loft: boolean;
      inTree: boolean;
      diagnostics: AutoMovieLoftContract.IDiagnostic[];
    }[];
    /** Tree views, unconnected studies and other observed definitions, none proving final realization. */
    observation: {
      stage: "source-definition";
      finalRealization: "not-run";
      treeParts: string[];
      studies: string[];
      definitionOnlyParts: string[];
      unavailableParts: string[];
    };
  }

  /**
   * Observe one production definition without completing a calibration.
   *
   * @param parameters Current public inputs.
   * @returns Source records and phase; a source exception propagates.
   *
   * @evidence contracts/common.md#principled-implementation Reads the explicit actual results returned by BodyLaw.define and head.source; the identical lane root is production's realization input.
   * @evidence contracts/common.md#clear-and-simple-design Name reduction and phase metadata remain separate from source evaluation and final realization.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not call calibrate/realize, invent parts, swallow source exceptions or report absent final diagnostics as a pass.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes source completion, tree membership and studies from final realization.
   * @evidence contracts/performance.md#efficient-algorithms The shared source assembly dominates; name reduction and tree traversal are linear in their inputs.
   * @evidence contracts/performance.md#reuse-equivalent-work Keeps actual source parts/lofts without rebuilding the head or copying section/control arrays.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary maps and definition metadata are call-owned; only last-result source references and copied diagnostics/names survive. No foreign operator is borrowed or replaced.
   */
  export function of(parameters: IAutoMovieHumanParameters): IOutput {
    const definition: AutoMovieHumanBodyLaw.IDefinition =
      AutoMovieHumanBodyLaw.define(parameters);
    const head: typeof definition.head.source = definition.head.source;
    const records: {
      name: string;
      part: IAutoMovieViewPart | null;
      loft: AutoMovieViewLoft.IResult | null;
    }[] = [
      ...definition.lane.sources.map(
        (
          source: (typeof definition.lane.sources)[number],
        ): {
          name: string;
          part: IAutoMovieViewPart | null;
          loft: AutoMovieViewLoft.IResult | null;
        } => ({
          name: source.name,
          part: source.result.part,
          loft: source.result.loft,
        }),
      ),
      { name: head.massPart.name, part: head.massPart, loft: head.mass },
      ...head.parts.map(
        (
          placed: (typeof head.parts)[number],
        ): {
          name: string;
          part: IAutoMovieViewPart;
          loft: AutoMovieViewLoft.IResult;
        } => ({
          name: placed.feature.part.name,
          part: placed.feature.part,
          loft: placed.loft,
        }),
      ),
      ...head.studies.map(
        (
          study: (typeof head.studies)[number],
        ): {
          name: string;
          part: IAutoMovieViewPart;
          loft: AutoMovieViewLoft.IResult;
        } => ({ name: study.part.name, part: study.part, loft: study.loft }),
      ),
    ];
    const byName: Map<string, IPart> = new Map();
    const counts: Map<string, number> = new Map();
    const unavailable: Set<string> = new Set();
    for (const record of records) {
      counts.set(record.name, (counts.get(record.name) ?? 0) + 1);
      if (record.part === null) {
        byName.delete(record.name);
        unavailable.add(record.name);
      } else {
        byName.set(record.name, {
          name: record.name,
          part: record.part,
          loft: record.loft,
        });
        unavailable.delete(record.name);
      }
    }
    const tree: Set<string> = new Set();
    const treeViews: Set<AutoMovieConstructionNode> = new Set();
    const pending: AutoMovieConstructionNode[] =
      definition.lane.root === null ? [] : [definition.lane.root];
    while (pending.length !== 0) {
      const node: AutoMovieConstructionNode = pending.pop()!;
      if (node.type === "view") {
        tree.add(node.name);
        treeViews.add(node);
      } else {
        pending.push(node.host);
        if (node.type !== "trim") pending.push(node.part);
      }
    }
    const studies: string[] = definition.head.source.studies.map(
      (study: (typeof definition.head.source.studies)[number]): string =>
        study.part.name,
    );
    const studyNames: Set<string> = new Set(studies);
    return {
      parts: [...byName.values()],
      scale:
        AutoMovieHumanBodyAnatomy.resolve(parameters).stature /
        definition.stature,
      repeats: Object.fromEntries(
        [...counts].filter(([, n]: [string, number]): boolean => n > 1),
      ),
      diagnostics: {
        body: [...definition.diagnostics],
        head: [...definition.head.source.diagnostics],
      },
      sourceRecords: definition.lane.sources.map(
        (
          source: (typeof definition.lane.sources)[number],
        ): IOutput["sourceRecords"][number] => ({
          name: source.name,
          part: source.result.part !== null,
          loft: source.result.loft !== null,
          inTree:
            source.result.view !== null && treeViews.has(source.result.view),
          diagnostics: [...source.result.diagnostics],
        }),
      ),
      observation: {
        stage: "source-definition",
        finalRealization: "not-run",
        treeParts: [...tree],
        studies,
        definitionOnlyParts: [...byName.keys()].filter(
          (name: string): boolean => !tree.has(name) && !studyNames.has(name),
        ),
        unavailableParts: [...unavailable],
      },
    };
  }
}
