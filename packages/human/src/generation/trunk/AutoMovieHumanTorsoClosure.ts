import {
  AutoMovieIllinois,
  AutoMovieViewSection,
  convexHull2D,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanTrunkLandmarks } from "../AutoMovieHumanTrunkLandmarks";
import { AutoMovieHumanTorsoCourse } from "./AutoMovieHumanTorsoCourse";
import { AutoMovieHumanTorsoField } from "./AutoMovieHumanTorsoField";
import type { AutoMovieHumanTorsoPlan } from "./AutoMovieHumanTorsoPlan";
import type { AutoMovieHumanTorsoSource } from "./AutoMovieHumanTorsoSource";
import { AutoMovieHumanTorsoThorax } from "./AutoMovieHumanTorsoThorax";
import { AutoMovieHumanTrunkSectionFamily } from "./AutoMovieHumanTrunkSectionFamily";

/** Joint original-source chest tape and side-neck/bust placement, without cuts through completed lofts. */
export namespace AutoMovieHumanTorsoClosure {
  /** Actual failed course query and its already-observed native operands; no exception is replaced. */
  export interface IRefusal {
    /** Original failure message, with native numeric curvature operands when supplied by that owner. */
    readonly message: string;

    /** Requested source station/phase, or null before a source-plane request existed. */
    readonly query: AutoMovieHumanTorsoCourse.IWork["failure"] | null;

    /** Same wall's recorded native preparation operands, or null if the failure came from another owner. */
    readonly wall: ReturnType<AutoMovieHumanTorsoField.IOutput["wall"]["refusal"]> | null;
  }

  /** One real height trial's endpoint/chord and course state, independent of success or failure. */
  export interface ITrialObservation {
    /** Actual candidate chest/apex height, calibration mm. */
    readonly height: number;

    /** Same source's defined endpoints/chord, or null if even their preparation refused. */
    endpoints: AutoMovieHumanTorsoCourse.IEndpoints | null;

    /** Original anatomical ordering inputs in calibration mm. */
    readonly ordering: Readonly<Record<"waist" | "foldDrop" | "axilla", number>>;

    /** Actual measured sampled course, or null without a successful reading. */
    course: number | null;

    /** Actual refusal, absent only when this course request succeeded. */
    refusal?: IRefusal;
  }

  /** Actual sequential constraint observations; the complete closure interval includes all of these. */
  export interface IWork {
    /** Complete explicitly requested call through success or natural refusal, milliseconds; null before the request. */
    elapsed: number | null;

    /** Exact support-box reach requests, including descriptor reuse. */
    rangeRead: number;

    /** Common independent scalar requests before each local field. */
    sharedScalars: number;

    /** Candidate local formula preparation, without profile/display metadata. */
    field: number;

    /** Actual composed 512-phase hull observations. */
    hull: number;

    /** Actual source-plane crossing and twenty-interval course observations. */
    course: number;

    /** Distinct admitted height candidates. */
    heightTrials: number;

    /** Actual shoulder-dependent local fields. */
    fieldTrials: number;

    /** Exact height cache reads while a different height owns the latest preparation cursor. */
    heightRevisitsAfterOtherTrial: number;

    /** Every actually requested course trial; a failed/unmeasured course is never zero. */
    trials: ITrialObservation[];
  }

  /** Only the mathematical candidate needed by the two constraints, without profile publication or display metadata. */
  interface ITrial extends Pick<AutoMovieHumanTorsoSource.IOutput, "plan" | "point" | "wallSections"> {
    /** Actual call-owned mathematical wall evaluator; distinct from Source's public native wall part. */
    readonly evaluator: AutoMovieHumanTorsoField.IOutput["wall"];

    /** Exact original regional material clocks, alongside the fixed quarter clocks. */
    readonly clocks: readonly number[];
  }

  /**
   * The common thorax owns both its composed tape and actual front tape plane.
   *
   * Each height trial authors a new immutable plan, closes its actual chest
   * hull by the native shoulder and reads its real ISO front course. The
   * height bracket stays inside waist/fold/axilla order. A bracket, native
   * refusal or final residual failure is reported; no extreme trial replaces
   * the original as an alleged solution. The 512-phase hull and 20-interval
   * course retain their existing observation policies, not exact certificates.
   */
  export function create(
    plan: AutoMovieHumanTorsoPlan.IOutput,
    define: (
      candidate: AutoMovieHumanTorsoPlan.IOutput,
      sections?: ReadonlyMap<string, AutoMovieHumanTrunkSectionFamily.IPlane>,
    ) => AutoMovieHumanTorsoSource.IOutput,
    initialSections?: ReadonlyMap<string, AutoMovieHumanTrunkSectionFamily.IPlane>,
    work?: IWork,
  ): AutoMovieHumanTorsoSource.IOutput {
    const initial: (typeof plan.wall.sites)[number] | undefined =
      plan.wall.sites.find(
        (site: (typeof plan.wall.sites)[number]): boolean =>
          site.site === "chest",
      );
    if (initial === undefined)
      throw new Error("The actual thorax has no chest height owner");
    const thorax: AutoMovieHumanTorsoThorax.IFamily =
      AutoMovieHumanTorsoThorax.prepare(plan);
    let sections: ReadonlyMap<string, AutoMovieHumanTrunkSectionFamily.IPlane> =
      initialSections ?? AutoMovieHumanTrunkSectionFamily.define(plan.wall);
    if (
      !plan.regions.some(
        (region: (typeof plan.regions)[number]): boolean =>
          region.outward === 1,
      )
    )
      return define(thorax.at(initial.y));
    // The bounded bracket and root calls own this finite population. An
    // exactly repeated height retains its original source and course read.
    const retained: Map<number, { original: ITrial; course?: number }> = new Map();
    let latestPreparedHeight: number | undefined;

    /** An identical physical trial reuses only its own immutable original. */
    const at: (height: number) => ITrial = (
      height: number,
    ): ITrial => {
      const previous: ReturnType<typeof retained.get> = retained.get(height);
      if (previous !== undefined) {
        if (work !== undefined && latestPreparedHeight !== height)
          work.heightRevisitsAfterOtherTrial++;
        return previous.original;
      }
      if (work !== undefined) work.heightTrials++;
      const candidate: AutoMovieHumanTorsoPlan.IOutput =
        thorax.at(height);
      sections = AutoMovieHumanTrunkSectionFamily.define(candidate.wall, sections);
      const chest: AutoMovieHumanTrunkSectionFamily.IPlane | undefined = sections.get("chest");
      if (chest === undefined) throw new Error("The actual thorax has no common chest plane");
      const rangeStarted: number = performance.now();
      const reach: AutoMovieViewSection.IRange | null =
        chest.range();
      if (work !== undefined) work.rangeRead += performance.now() - rangeStarted;
      if (reach === null)
        throw new Error(
          "The original chest has no admitted native shoulder reach",
        );
      const target: number = plan.measures.chestCircumference * plan.scale;
      const tolerance: number = 128 * Number.EPSILON * Math.max(1, target);
      let source: ITrial | undefined;
      let lastShoulder: number | undefined;

      /** Numeric observations read this exact trial source rather than a surrogate wall ellipse. */
      const residual: (shoulder: number) => number = (
        shoulder: number,
      ): number => {
        if (lastShoulder !== shoulder) {
          const trial: AutoMovieHumanTorsoPlan.IOutput =
            AutoMovieHumanTorsoThorax.withShoulder(candidate, shoulder);
          sections = AutoMovieHumanTrunkSectionFamily.define(trial.wall, sections);

          // Independent scalar constraints are requested here, before local
          // field construction. Exact box/tape inputs share their result,
          // including a failed result; height and candidate frames do not.
          const scalarStarted: number = performance.now();
          for (const plane of sections.values()) plane.resolve();
          const fieldStarted: number = performance.now();
          const field: AutoMovieHumanTorsoField.IOutput =
            AutoMovieHumanTorsoField.create(trial, sections);
          if (work !== undefined) {
            work.sharedScalars += fieldStarted - scalarStarted;
            work.field += performance.now() - fieldStarted;
            work.fieldTrials++;
          }
          source = {
            plan: trial,
            point: field.point,
            evaluator: field.wall,
            wallSections: sections,
            clocks: field.regions.map(
              (region: AutoMovieHumanTorsoField.IOutput["regions"][number]): number =>
                region.clock,
            ),
          };
          lastShoulder = shoulder;
        }
        if (source === undefined)
          throw new Error("The actual chest trial has no source");
        const hullStarted: number = performance.now();
        const value: number = girth(source, height) - target;
        if (work !== undefined) work.hull += performance.now() - hullStarted;
        return value;
      };
      const shoulder: number | null = AutoMovieIllinois.root(
        residual,
        reach.shoulder[0],
        reach.shoulder[1],
        tolerance,
        64,
      );
      if (
        shoulder === null ||
        !Number.isFinite(shoulder) ||
        Math.abs(residual(shoulder)) > tolerance ||
        source === undefined
      )
        throw new Error(
          "The composed chest tape is outside its admitted source reach or did not converge at " +
            height,
        );
      retained.set(height, { original: source });
      latestPreparedHeight = height;
      return source;
    };
    const courseTarget: number = plan.measures.sideNeckToBustPoint * plan.scale;
    const courseTolerance: number =
      128 * Number.EPSILON * Math.max(1, courseTarget);

    /** The actual source-plane taut course supplies the height residual. */
    const residual: (height: number) => number = (height: number): number => {
      const original: ITrial = at(height);
      const trial: NonNullable<ReturnType<typeof retained.get>> = retained.get(height)!;
      if (trial.course === undefined) {
        const courseStarted: number = performance.now();
        const reading: ITrialObservation | undefined = work === undefined ? undefined : {
          height, endpoints: null, course: null,
          ordering: { waist: plan.measures.waistHeight * plan.scale,
            foldDrop: AutoMovieHumanTrunkLandmarks.FOLD_DROP * (plan.measures.cervicaleHeight * plan.scale - plan.domain[0]),
            axilla: plan.measures.axillaHeight * plan.scale },
        };
        if (reading !== undefined) work!.trials.push(reading);
        const query: AutoMovieHumanTorsoCourse.IWork = {};
        try {
          const prepared: AutoMovieHumanTorsoCourse.IPrepared = AutoMovieHumanTorsoCourse.prepare(original);
          if (reading !== undefined) reading.endpoints = prepared.endpoints;
          trial.course = prepared.read(query).length;
          if (reading !== undefined) reading.course = trial.course;
        } catch (error: unknown) {
          if (reading !== undefined) reading.refusal = {
            message: error instanceof Error ? error.message : "Non-Error thrown value; original is rethrown without coercion",
            query: query.failure ?? null, wall: original.evaluator.refusal() ?? null,
          };
          throw error;
        } finally {
          if (work !== undefined) work.course += performance.now() - courseStarted;
        }
      }
      return trial.course - courseTarget;
    };
    let left: number = initial.y;
    let right: number = initial.y;
    const initialResidual: number = residual(initial.y);
    if (Math.abs(initialResidual) > courseTolerance) {
      const limit: number =
        initialResidual > 0
          ? plan.measures.axillaHeight * plan.scale
          : plan.measures.waistHeight * plan.scale +
            AutoMovieHumanTrunkLandmarks.FOLD_DROP *
              (plan.measures.cervicaleHeight * plan.scale - plan.domain[0]);
      let moving: number = initial.y;
      let bracketed: boolean = false;
      for (let i: number = 0; i < 64; i++) {
        const next: number = (moving + limit) / 2;
        if (next === moving || next === limit) break;
        moving = next;
        if (residual(moving) * initialResidual <= 0) {
          bracketed = true;
          break;
        }
      }
      if (!bracketed)
        throw new Error(
          "The actual front course has no height bracket inside waist/fold/axilla order",
        );
      left = Math.min(initial.y, moving);
      right = Math.max(initial.y, moving);
    }
    const height: number | null =
      left === right
        ? left
        : AutoMovieIllinois.root(residual, left, right, courseTolerance, 64);
    if (
      height === null ||
      !Number.isFinite(height) ||
      Math.abs(residual(height)) > courseTolerance
    )
      throw new Error(
        "The actual front course height did not satisfy its original numeric residual",
      );
    const original: ITrial = at(height);
    const closed: AutoMovieHumanTorsoPlan.IOutput = {
      ...original.plan,
      constraints: original.plan.constraints.map(
        (
          constraint: AutoMovieHumanTorsoPlan.IConstraint,
        ): AutoMovieHumanTorsoPlan.IConstraint =>
          constraint.name === "chestCircumference" ||
          constraint.name === "sideNeckToBustPoint"
            ? { ...constraint, state: "sampled-source-closed" }
            : constraint,
      ),
    };
    // The cursor above can belong to another trial after a cached height
    // read. Publish the selected source's exact physical planes, never that
    // ambient preparation cursor or inferred frame equivalence.
    return define(closed, original.wallSections);
  }
}

/** Same actual 512-phase polygon hull plus original regional clocks used by the public observer. */
function girth(
  original: Pick<AutoMovieHumanTorsoSource.IOutput, "point"> & {
    readonly clocks: readonly number[];
  },
  station: number,
): number {
  const clocks: number[] = [
    ...new Set([
      ...Array.from(
        { length: 512 },
        (_: unknown, i: number): number => (2 * Math.PI * i) / 512,
      ),
      ...original.clocks,
    ]),
  ];
  const points: IAutoMovieVector3[] = clocks.map(
    (clock: number): IAutoMovieVector3 => {
      const p: [number, number] = original.point(station, clock);
      return { x: p[0], y: station, z: p[1] };
    },
  );
  const hull: IAutoMovieVector3[] = convexHull2D(points);
  const length: number = hull.reduce(
    (sum: number, p: IAutoMovieVector3, i: number): number => {
      const next: IAutoMovieVector3 = hull[(i + 1) % hull.length]!;
      return sum + Math.hypot(next.x - p.x, next.z - p.z);
    },
    0,
  );
  if (hull.length < 3 || !(Number.isFinite(length) && length > 0))
    throw new Error("The actual chest hull is nonfinite or collapsed");
  return length;
}
