import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanTorsoPlan } from "../generation/trunk/AutoMovieHumanTorsoPlan";
import { AutoMovieHumanTorsoSource } from "../generation/trunk/AutoMovieHumanTorsoSource";
import type { AutoMovieHumanTorsoClosure } from "../generation/trunk/AutoMovieHumanTorsoClosure";
import { HumanTorsoCamera } from "./HumanTorsoCamera";
import { HumanTorsoObservation } from "./HumanTorsoObservation";
import { HumanTorsoPlanObservation } from "./HumanTorsoPlanObservation";

/** Same-source original groups, neighbour context and cameras for the existing explicit single-profile stage consumer. */
export namespace HumanTorsoStageObservation {
  /** This selected consumer's bytes accompany the original generating owners; not a complete transformed-module proof. */
  export const sourceFiles: readonly string[] = [
    "packages/human/src/inspection/HumanTorsoStageObservation.ts",
  ];

  /** Actual explicit constraint request, kept separate from available source and raw realization state. */
  export interface IAttempt {
    /** A missing lower family leaves this torso request unrequested; refusal is not success. */
    readonly status: "unrequested" | "failed" | "provided";

    /** Actual elapsed/trials survive a thrown closure because this record is call-owned. */
    readonly work: AutoMovieHumanTorsoClosure.IWork;
  }

  /** One available source and its separately attempted constraints/display population. */
  export interface IOutput {
    /** Explicit closed source, absent when that actual constraint refuses. */
    angles?: HumanTorsoObservation.IOutput;

    /** Actual complete original, even when coupled torso closure refused; absent for independent wall/normal-only definitions. */
    available?: HumanTorsoObservation.IOutput;

    /** Exact mathematical producer retained independently of display evaluation and constraint acceptance. */
    original?: AutoMovieHumanTorsoSource.IOutput;

    /** Actual closure request/work, independent of a later raw request. */
    constraintAttempt: IAttempt;

    /** Whole closed display, or the independently available definition without a substituted lower source. */
    observed: HumanTorsoPlanObservation.IOutput;

    /** Actual whole/group/neighbour selections; no raw surface is substituted. */
    selections: readonly HumanTorsoObservation.ISelection[];

    /** Actual original/arm failures remain visible without blocking available torso observations. */
    diagnostics: HumanTorsoObservation.IOutput["diagnostics"];

    /** Actual neighbour preparation, or its explicit failure. */
    neighbours: Readonly<Record<string, unknown>>;
  }

  /** Preserve the actual closure result before independently reading the affected originals and their neck/collar neighbours. */
  export function create(parameters: IAutoMovieHumanParameters): IOutput {
    const started: number = performance.now();
    const definition: AutoMovieHumanTorsoPlan.IDefinition = AutoMovieHumanTorsoPlan.define(parameters);
    const work: AutoMovieHumanTorsoClosure.IWork = AutoMovieHumanTorsoSource.work();
    let candidate: AutoMovieHumanTorsoSource.IOutput | undefined;
    let original: AutoMovieHumanTorsoSource.IOutput | undefined;
    let closed: boolean = false;
    const diagnostics: { id: string; detail: string }[] = [];
    try {
      candidate = AutoMovieHumanTorsoSource.create(parameters, definition);
      original = AutoMovieHumanTorsoSource.close(candidate, work);
      closed = true;
    } catch (error: unknown) {
      original = candidate;
      diagnostics.push({ id: candidate === undefined ? "S00.lower-neck-constraint" : "S00.explicit-torso-constraint",
        detail: error instanceof Error ? (error.stack ?? error.message) : String(error) });
    }
    let available: HumanTorsoObservation.IOutput | undefined;
    if (original !== undefined) {
      try {
        available = HumanTorsoObservation.evaluate(original);
      } catch (error: unknown) {
        diagnostics.push({ id: "S00.original-display", detail: error instanceof Error ? (error.stack ?? error.message) : String(error) });
      }
      if (available !== undefined) {
        try {
          const course: HumanTorsoObservation.ICourse = HumanTorsoObservation.course(available.original);
          available = { ...available, provenance: { ...available.provenance,
            frontCourse: { endpoints: course.endpoints, reading: course.reading, failure: course.failure,
              failureQuery: course.failureQuery, milliseconds: course.milliseconds } },
            selections: available.selections.map((selection: HumanTorsoObservation.ISelection): HumanTorsoObservation.ISelection =>
              selection.id === "S00.all-originals" ? { ...selection, curves: [...selection.curves, ...course.curves] } : selection),
          };
          if (course.failure !== undefined) diagnostics.push({ id: "S00.source.course", detail: course.failure });
        } catch (failure: unknown) {
          diagnostics.push({ id: "S00.source.course-datums", detail: failure instanceof Error ? failure.message : String(failure) });
        }
        try {
          const startedAt: number = performance.now();
          const plane: AutoMovieHumanTorsoSource.ISection | undefined = original.sections.find(
            (section: AutoMovieHumanTorsoSource.ISection): boolean => section.id === "S00.plane.acromion");
          if (plane === undefined) throw new Error("Actual acromion plane is unavailable");
          const rows: unknown[] = [];
          for (const quarter of [0, 3])
            for (let i: number = 0; i <= 64; i++) {
              const phase: number = (quarter + i / 64) * Math.PI / 2;
              rows.push({ phase, actual: original.point(plane.station, phase),
                ...original.contributors(plane.station, phase) });
            }
          available = { ...available, provenance: { ...available.provenance,
            acromionComposition: { station: plane.station, rows, milliseconds: performance.now() - startedAt,
              meaning: "Actual q0/q3 contributors and first phase product-rule terms; finite diagnostic samples are not extrema, fitted curves or anatomical acceptance" } } };
        } catch (failure: unknown) {
          diagnostics.push({ id: "S00.acromion-contributors", detail: failure instanceof Error ? failure.message : String(failure) });
        }
      }
    }
    const observed: HumanTorsoPlanObservation.IOutput = available ?? HumanTorsoPlanObservation.evaluate(definition, started);
    return { original, available, angles: closed ? available : undefined, observed,
      selections: available === undefined ? observed.selections : selected(available),
      diagnostics: [...observed.diagnostics, ...diagnostics],
      neighbours: { status: "neck-and-collar-originals-only", armOriginals: "not-requested in this affected round; gray arms/head are reference" },
      constraintAttempt: { status: candidate === undefined ? "unrequested" : closed ? "provided" : "failed", work },
    };
  }
}

/** Existing originals answer the affected individual and anatomical neighbour questions without repeating the previous whole overview. */
function selected(observed: HumanTorsoObservation.IOutput): HumanTorsoObservation.ISelection[] {
  const whole: HumanTorsoObservation.ISelection = observed.selections.find((item: HumanTorsoObservation.ISelection): boolean => item.id === "S00.all-originals")!;
  const selections: HumanTorsoObservation.ISelection[] = [];
  selections.push({ ...whole, id: "S00.changed-whole-originals", cameras: whole.cameras.filter(
    (camera: (typeof whole.cameras)[number]): boolean => ["front", "left", "top", "high-oblique"].includes(camera.name)) });
  const prefix: string = "human.construction.profile.S00/S00.plane.acromion/";
  selections.push(...observed.selections.filter((item: HumanTorsoObservation.ISelection): boolean =>
    item.id === prefix + "S00.outer.q0" || item.id === prefix + "S00.outer.q3"));
  const neck: typeof whole.curves = whole.curves.filter((curve: (typeof whole.curves)[number]): boolean =>
    /\/guide\.neck\.(base|normal|named-base-scaffold)$/.test(curve.id));
  const neckGroup: HumanTorsoObservation.ISelection = HumanTorsoCamera.overview({ id: "S00.neck-base-and-normal.neighbours", curves: neck, cameras: [] });
  const points: (typeof whole.curves)[number]["points"] = neck.flatMap((curve: (typeof whole.curves)[number]): (typeof whole.curves)[number]["points"] => curve.points);
  selections.push({ ...neckGroup, cameras: neck.length === 0 ? [] : [
    ...[135, 225].map((yaw: number): (typeof neckGroup.cameras)[number] => ({
      ...HumanTorsoCamera.apply(neckGroup.cameras[0]!, points, { yaw, pitch: 15 }), name: "posterior-oblique.yaw" + yaw,
    })),
    ...neckGroup.cameras.filter((camera: (typeof neckGroup.cameras)[number]): boolean => camera.name === "left" || camera.name === "right"),
  ] });
  const neighbours: typeof whole.curves = whole.curves.filter((curve: (typeof whole.curves)[number]): boolean =>
    curve.id.startsWith(prefix) || neck.includes(curve) || curve.id.endsWith("/guide.collar.start"));
  const group: HumanTorsoObservation.ISelection = HumanTorsoCamera.overview({ id: "S00.acromion-and-collar.neighbours", curves: neighbours, cameras: [] });
  selections.push({ ...group, cameras: group.cameras.filter((camera: (typeof group.cameras)[number]): boolean =>
    ["top", "high-oblique", "left", "right"].includes(camera.name)) });
  return selections;
}
