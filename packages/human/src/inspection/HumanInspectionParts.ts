import type {
  AutoMovieLoftContract,
  AutoMovieViewLoft,
  AutoMovieViewCurves,
  IAutoMovieViewPart,
} from "@automovie/engine";
import type { AutoMovieConstructionNode } from "@automovie/interface";

import { AutoMovieHumanBodyAnatomy } from "../generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { HumanInspectionOriginals } from "./HumanInspectionOriginals";

/**
 * Observe actual production source assembly before final solid realization.
 *
 * BodyLaw.define is the same assembly calibrate later realizes. The scoped
 * reader borrows its canonical preparation and actual original factories without
 * claiming an assembled tree; the full reader also observes the head composer.
 * A name keeps its last result, including a failure, so an
 * earlier successful pass cannot conceal its failed replacement. Original
 * source diagnostics and unconnected studies remain explicit.
 * Final joins, trimmed skin and rig checks have not run. Coordinates are
 * calibration mm; scale converts them to person mm about the floor.
 *
 * @evidence contracts/common.md#principled-implementation Borrows the same canonical context and actual source factories consumed by full production, before BodyLane.realize. Actual part/nullable-loft records and original diagnostics survive both observation scopes.
 * @evidence contracts/common.md#clear-and-simple-design Full assembly and scoped originals expose their different completion states; production-tree names, studies and unassembled membership remain distinct.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No foreign method is replaced and no alternate geometry, fixture, intermediate throw or fake completed calibration is used. Source exceptions propagate; final realization is not run.
 * @evidence contracts/common.md#meaningful-documentation States phase, diagnostic ownership, repeated names, scale and unverified final stages.
 * @evidence contracts/performance.md#efficient-algorithms The full path indexes R actual results and visits T tree nodes in O(R+T), after source/raw work. The scoped path indexes only its actual family attempts and borrowed leg parents, without regional face composition or final solid joins.
 * @evidence contracts/performance.md#reuse-equivalent-work Both readers consume caller-owned production preparation rather than building a second source model. Reuse across requests belongs to the page cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns last-result source references and fresh diagnostic/name arrays. Temporary maps and intermediate results end with the call; no operator, renderer or handle is acquired.
 */
export namespace HumanInspectionParts {
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

    /** Already available complete source; null keeps independent guides distinct from unrequested or failed fullness. */
    part: IAutoMovieViewPart | null;

    /** Explicit actual full-source request when only independent guides are available; original refusal propagates. */
    fullSource?: () => IAutoMovieViewPart;

    /** Actual prepared original guides when available before complete fullness; never a substitute full part. */
    guides?: IGuides;

    /** Raw operator result, including rejected sections; null when the source builder did not loft it. */
    loft: AutoMovieViewLoft.IResult | null;
  }

  /** A producer's already prepared original edges and placement, without claiming complete fullness. */
  export interface IGuides {
    /** The unchanged original controls, physical stations and actual axis. */
    readonly source: Pick<IAutoMovieViewPart, "name" | "axis" | "stations" | "front" | "side" | "pole">;
    /** Original edges prepared by that same canonical producer; their cost belongs to canonical acquisition. */
    readonly curves: AutoMovieViewCurves.IResult;
    /** Actual attempt state, including the original cached failure; reading it requests no closure. */
    fullSourceAttempt(): AutoMovieHumanBodyLaw.IPrepared["head"]["source"]["closureAttempt"];
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
    /** Inclusive common/family intervals, ms; nested first requests overlap, so this snapshot is not additive. Null is unrequested. Total required 2D work belongs to the actual outer source call. */
    sourcePreparation?: Readonly<AutoMovieHumanBodyLaw.IOriginal["milliseconds"]>;

    /** Scoped cache acquisition's producer-boundary durations, ms; absent for full/direct readers. Zero on a retained observation means that stage was not called, not that reference/display work was free. */
    sourceAcquisition?: {
      canonicalMilliseconds: number;
      observationMilliseconds: number;
      rawMilliseconds: number;
      canonicalReused: boolean;
      observationReused: boolean;
      rawRequested: boolean;
    };
    /** Last available source result per name; a failed replacement removes that name. */
    parts: IPart[];
    /** Person millimetres per calibration millimetre. */
    scale: number;
    /** Repeated explicitly returned source records and their counts, not a count of foreign operator calls. */
    repeats: Record<string, number>;
    /** Observed body/anatomy and head-stage diagnostics; scope identifies unrequested regional work. */
    diagnostics: {
      body: AutoMovieLoftContract.IDiagnostic[];
      head: AutoMovieLoftContract.IDiagnostic[];
    };
    /** Observed original attempts and borrowed source records, including failed or superseded passes. */
    sourceRecords: {
      name: string;
      part: boolean;
      loft: boolean;
      /** Null when no production tree was assembled for this scoped observation. */
      inTree: boolean | null;
      diagnostics: AutoMovieLoftContract.IDiagnostic[];
    }[];
    /** Tree views, unconnected studies and other observed definitions, none proving final realization. */
    observation: {
      stage: "source-definition" | "scoped-source-definition";
      finalRealization: "not-run";
      treeParts: string[];
      studies: string[];
      definitionOnlyParts: string[];
      unavailableParts: string[];
      /** Present for scoped work; null membership never asserts a completed production tree. */
      scope?: { requested: string[]; observed: string[]; tree: "not-assembled"; unrequested: string };
    };
  }

  /**
   * Explicitly acquire the complete original only for a consumer that needs it.
   * Guide/control metadata never calls this method. The producer owns any
   * required constraint, selected source identity and original exception.
   */
  export function completeSource(part: IPart): IAutoMovieViewPart {
    if (part.part !== null) return part.part;
    if (part.fullSource !== undefined) return part.fullSource();
    throw new Error(`Original ${part.name} has no complete-source capability`);
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
  export function of(parameters: IAutoMovieHumanParameters, prepared?: AutoMovieHumanBodyLaw.IPrepared, defined?: AutoMovieHumanBodyLaw.IDefinition): IOutput {
    const definition: AutoMovieHumanBodyLaw.IDefinition =
      defined ?? AutoMovieHumanBodyLaw.define(parameters, prepared);
    const head: typeof definition.head.source = definition.head.source;
    const attempts: typeof definition.lane.sources = [...definition.lane.sources];
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [...definition.diagnostics];
    const known: Set<AutoMovieLoftContract.IDiagnostic> = new Set(diagnostics);
    for (const [name, result] of definition.prepared.rawSources ?? [])
      {
        if (!attempts.some((source: typeof attempts[number]): boolean => source.result === result)) attempts.push({ name, result });
        for (const fault of result.loft?.diagnostics ?? [])
          if (!known.has(fault)) {
            known.add(fault);
            diagnostics.push(fault);
          }
      }
    const records: {
      name: string;
      part: IAutoMovieViewPart | null;
      loft: AutoMovieViewLoft.IResult | null;
    }[] = [
      ...attempts.map(
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
      { name: head.massPart.name, part: head.massPart, loft: head.definition.base.raw },
      ...head.parts.map(
        (
          placed: (typeof head.parts)[number],
        ): {
          name: string;
          part: IAutoMovieViewPart;
          loft: AutoMovieViewLoft.IResult | null;
        } => ({
          name: placed.feature.part.name,
          part: placed.feature.part,
          loft: head.definition.lofts.get(placed.feature.part.name) ?? null,
        }),
      ),
      ...head.studies.map(
        (
          study: (typeof head.studies)[number],
        ): {
          name: string;
          part: IAutoMovieViewPart;
          loft: AutoMovieViewLoft.IResult | null;
        } => ({ name: study.part.name, part: study.part, loft: head.definition.lofts.get(study.part.name) ?? null }),
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
    const treeSources: Set<IAutoMovieViewPart> = new Set();
    const pending: AutoMovieConstructionNode[] =
      definition.lane.root === null ? [] : [definition.lane.root];
    while (pending.length !== 0) {
      const node: AutoMovieConstructionNode = pending.pop()!;
      if (node.type === "source") {
        tree.add(node.name);
        const original: IAutoMovieViewPart | undefined = definition.lane.sourceParts.get(node.source);
        if (original !== undefined) treeSources.add(original);
      } else if (node.type === "view") {
        tree.add(node.name);
        treeViews.add(node);
      } else if (node.type === "join" || node.type === "continue" || node.type === "trim") {
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
        body: diagnostics,
        head: [...definition.head.source.diagnostics],
      },
      sourceRecords: attempts.map(
        (
          source: (typeof definition.lane.sources)[number],
        ): IOutput["sourceRecords"][number] => ({
          name: source.name,
          part: source.result.part !== null,
          loft: source.result.loft !== null,
          inTree:
            (source.result.view !== null && treeViews.has(source.result.view)) ||
            (source.result.part !== null && treeSources.has(source.result.part)),
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

  /** Observe actual requested original factories without production tree assembly. */
  export function scoped(context: AutoMovieHumanBodyLaw.IOriginal, patterns: readonly string[]): IOutput {
    return HumanInspectionOriginals.scoped(context, patterns);
  }

  /**
   * Explicitly request one actual raw source from the same original context.
   *
   * @param patterns The scoped request's patterns, so the raw lands on the definition that scoped reader selects; omitted for a full observation.
   */
  export function loft(context: AutoMovieHumanBodyLaw.IOriginal, name: string, patterns?: readonly string[]): void {
    HumanInspectionOriginals.loft(context, name, patterns);
  }
}
