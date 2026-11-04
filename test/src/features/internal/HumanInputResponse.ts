import { AutoMovieHumanBodyAnatomy } from "../../../../packages/human/src/generation/AutoMovieHumanBodyAnatomy";
import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import type { IAutoMovieHumanBodyAnatomy } from "../../../../packages/human/src/structures/body/IAutoMovieHumanBodyAnatomy";
import { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanAnatomyCourse } from "./HumanAnatomyCourse";
import { HumanAnatomyShared } from "./HumanAnatomyShared";
import { HumanInputResponseMade } from "./HumanInputResponseMade";
import { HumanInputResponseReadings } from "./HumanInputResponseReadings";

type IParams = IAutoMovieHumanParameters;
const { LARGE, SMALL, HEAD, HAND, FOOT } = HumanAnatomyShared;
const E: typeof HumanAnatomyCourse.ERROR = HumanAnatomyCourse.ERROR;

/**
 * Response of the generated skin to a known change of one public input: the
 * input is moved by a known amount on a base person, the person is generated
 * again, and every reading is taken on both skins by the anatomy observers.
 * The input's own reading must move by that amount, and every reading of an
 * input left as it was must stay where it was, each within its measure's
 * allowable error. An input with no site on the skin must still change the
 * figure, or the construction ignores it.
 */
export namespace HumanInputResponse {
  /** One input moved by a known amount. */
  export interface IPerturbation {
    /** The input's public path. */
    input: string;

    /** The edit, applied to an in-memory copy of the base person's inputs, never to a source file. */
    edit: (params: IParams) => void;

    /** Readings the edit must move, with the known change of each, mm; empty when the input has no site. */
    expect: Record<string, number>;

    /** Why the input has no site on the skin, when `expect` is empty. */
    reason?: string;

    /**
     * Whether the rest figure must change. False for an input that limits a
     * pose and leaves the rest figure as it is.
     */
    rest?: boolean;
  }

  /** What a perturbation showed. */
  export interface IFinding {
    /** The input's public path. */
    input: string;

    /**
     * `honoured`: every expected reading moved by its known change and every
     * other stayed; `misrouted`: the input moved the figure, but not by its
     * known change at its site or it moved another input's reading;
     * `ignored`: the figure did not change, or the input's own reading did
     * not move; `unmeasurable`: no site, and the figure changed (or, for a
     * pose limit, need not); `failed`: the person could not be generated or
     * read.
     */
    status: "honoured" | "misrouted" | "ignored" | "unmeasurable" | "failed";

    /** Readings out of their expectation, or the reason. */
    detail: string[];

    /** Generation and reading time, ms. */
    ms: number;
  }

  /** The base person every perturbation edits: f1, with every public input given. */
  export const BASE: string = "f1";

  /**
   * Allowable error of a reading, mm, the same each region's identity row
   * uses: ISO 20685-1:2018 large and small circumferences (9 and 4 mm), head
   * (1 mm), hand (1 mm) and foot (2 mm) dimensions, and ANSUR II's
   * per-dimension errors (Gordon et al. 2014, Tables 28 to 31) for lengths.
   *
   * @param reading A reading's name, with or without its trailing side.
   */
  export function tolerance(reading: string): number {
    const name: string = reading.replace(/ (left|right)$/, "");
    const table: Record<string, number> = {
      // ANSUR II stature allowable error (Table 28).
      stature: 6,
      chest: LARGE,
      underbust: LARGE,
      waist: LARGE,
      highHip: LARGE,
      hip: LARGE,
      neck: SMALL,
      neckBase: SMALL,
      bustSpan: E.bustPointWidth,
      acrossShoulder: E.acrossShoulder,
      neckToWaist: E.backNeckToWaist,
      shoulderToApex: E.sideNeckToBust,
      upperArmLength: E.acromionRadiale,
      lowerArmLength: E.radialeStylion,

      // Crotch height's ANSUR II allowable error; the malleolus input is held.
      inseam: 10,

      // The gluteal fold is a height on the posterior profile, read with the
      // crotch height's ANSUR II allowable error.
      "gluteal fold": 10,
      bicep: SMALL,
      elbow: SMALL,
      forearm: SMALL,
      wrist: SMALL,
      thigh: LARGE,
      knee: SMALL,
      calf: SMALL,
      "hand length": HAND,
      "hand breadth": HAND,
      "palm length": HAND,
      "thumb length": HAND,
      handCircumference: SMALL,
      "foot length": FOOT,
      "foot breadth": FOOT,
      "head circumference": SMALL,
    };
    return table[name] ?? HEAD;
  }

  /**
   * Run each perturbation on the base person, reading the named groups on
   * the base and on each perturbed person.
   *
   * @param perturbations The inputs to move, each alone.
   * @param groups The reading groups to take on every person.
   * @returns One finding per perturbation, in order.
   */
  export function run(perturbations: readonly IPerturbation[], groups: readonly HumanInputResponseReadings.Group[]): IFinding[] {
    const base: HumanAnatomyAudit.ISubject = HumanAnatomyAudit.subject(BASE);
    const before: HumanInputResponseReadings.IReadings = HumanInputResponseReadings.read(base, groups);
    const rest: Float64Array = base.bind().P;
    const findings: IFinding[] = [];

    for (const p of perturbations) {
      const started: number = Date.now();

      // The edit applies to a deep copy, so no person and no source file is
      // ever modified.
      const params: IParams = structuredClone(base.params);
      p.edit(params);

      let finding: Omit<IFinding, "ms">;
      try {
        // Built for this perturbation alone and dropped with it: no perturbed
        // person is kept.
        const subject: HumanAnatomyAudit.ISubject = HumanInputResponseMade.subject(`${BASE} ${p.input}`, params);
        const changed: boolean = differs(rest, subject.bind().P);
        finding = Object.keys(p.expect).length === 0 ? judgeSiteless(p, changed) : judge(p, before, HumanInputResponseReadings.read(subject, groups), changed);
      } catch (error) {
        finding = { input: p.input, status: "failed", detail: [`could not be generated or read: ${(error as Error).message}`] };
      }
      findings.push({ ...finding, ms: Date.now() - started });
    }
    return findings;
  }

  /**
   * Fail with every input the construction does not honour, after printing
   * every input's status: an input without a site passes when it changes the
   * figure, and is listed with its reason.
   *
   * @param region Name of the region in the report.
   * @param perturbations The region's inputs.
   * @param groups The reading groups to take.
   * @throws {Error} Listing every input that is ignored, misrouted or failed.
   */
  export function assert(region: string, perturbations: readonly IPerturbation[], groups: readonly HumanInputResponseReadings.Group[]): void {
    const findings: IFinding[] = run(perturbations, groups);
    const line: (f: IFinding) => string = (f: IFinding): string => `${f.status.padEnd(12)} ${f.input} (${f.ms} ms)${f.detail.length === 0 ? "" : `\n    ${f.detail.join("\n    ")}`}`;
    console.log(`input response, ${region}, on ${BASE}:\n${findings.map(line).join("\n")}`);

    // Red proof: each perturbation judged as if its edit had moved nothing,
    // the base's own readings on both sides and the figure unchanged, must
    // come out not honoured, so an ignored input cannot pass; an input that
    // limits a pose leaves the rest figure as it is and is not judged so.
    const before: HumanInputResponseReadings.IReadings = HumanInputResponseReadings.read(HumanAnatomyAudit.subject(BASE), groups);
    const proof: string[] = perturbations
      .filter((p: IPerturbation): boolean => p.rest !== false)
      .map((p: IPerturbation): Omit<IFinding, "ms"> => (Object.keys(p.expect).length === 0 ? judgeSiteless(p, false) : judge(p, before, before, false)))
      .filter((f: Omit<IFinding, "ms">): boolean => f.status === "honoured" || f.status === "unmeasurable")
      .map((f: Omit<IFinding, "ms">): string => `proof: ${f.input} judged ${f.status} on an unmoved figure`);

    const bad: IFinding[] = findings.filter((f: IFinding): boolean => f.status !== "honoured" && f.status !== "unmeasurable");
    if (bad.length !== 0 || proof.length !== 0) throw new Error(`${bad.length} ${region} inputs are not honoured at their sites:\n${[...proof, ...bad.map(line)].join("\n")}`);
  }

  /** A body measure a perturbation moves, by the reading name the shards key it with. */
  export type Measure = AutoMovieHumanBodyAnatomy.TapeControl | "height" | "highHip" | "acrossShoulder";

  /** A numeric field of the anatomy record. */
  export type Field = Exclude<keyof IAutoMovieHumanBodyAnatomy, "sex">;

  /** The anatomy field each reading name moves. */
  export const FIELD: Readonly<Record<Measure, Field>> = {
    ...AutoMovieHumanBodyAnatomy.TAPE_FIELD,
    height: "stature",
    highHip: "highHipCircumference",
    acrossShoulder: "acrossBackShoulderWidth",
  };

  /**
   * A body measure moved by a known amount from the person's resolved value.
   *
   * @param name The measure, by its reading name.
   * @param delta The change of its value, in its own unit (mm for lengths and tapes).
   * @param expect The readings that must move, with their known change, mm.
   */
  export function control(name: Measure, delta: number, expect: Record<string, number>): IPerturbation {
    return { ...moved(FIELD[name], delta), expect };
  }

  /**
   * A body measure with no site on the skin among the readings, moved by a known amount.
   *
   * @param field The anatomy field.
   * @param delta The change of its value.
   * @param reason Why no reading answers it.
   */
  export function siteless(field: Field, delta: number, reason: string): IPerturbation {
    return { ...moved(field, delta), expect: {}, reason };
  }

  /** The edit that moves one anatomy field from its resolved value. */
  function moved(field: Field, delta: number): Pick<IPerturbation, "input" | "edit"> {
    return {
      input: `body.anatomy.${field}`,
      edit: (q: IParams): void => {
        q.body.anatomy[field] = AutoMovieHumanBodyAnatomy.resolve(q)[field] + delta;
      },
    };
  }
}

/** Judge a perturbation of an input with a site. */
function judge(
  p: HumanInputResponse.IPerturbation,
  before: HumanInputResponseReadings.IReadings,
  after: HumanInputResponseReadings.IReadings,
  changed: boolean,
): Omit<HumanInputResponse.IFinding, "ms"> {
  const detail: string[] = [];
  let still: number = 0;
  let moved: number = 0;

  // The expected readings: each must move by its known change within its
  // error. One that did not move at all counts as `still`, one that moved by
  // another amount as `moved`.
  for (const [reading, delta] of Object.entries(p.expect)) {
    const tol: number = HumanInputResponse.tolerance(reading);
    const d: number = after[reading]! - before[reading]!;
    if (!Number.isFinite(d)) {
      detail.push(`${reading}: unread (${fmt(before[reading]!)} before, ${fmt(after[reading]!)} after)`);
      continue;
    }
    if (Math.abs(d - delta) <= tol) continue;

    if (Math.abs(d) <= tol) still++;
    else moved++;
    detail.push(`${reading}: moved ${fmt(d)} mm, expected ${fmt(delta)} +- ${fmt(tol)}`);
  }

  // Every other reading is held: it must stay within its own error, and its
  // site must not be lost.
  let leaks: number = 0;
  for (const reading of Object.keys(before)) {
    if (reading in p.expect) continue;

    const d: number = after[reading]! - before[reading]!;
    const tol: number = HumanInputResponse.tolerance(reading);
    if (Number.isFinite(before[reading]!) && !Number.isFinite(after[reading]!)) {
      detail.push(`${reading} (held): its site was lost`);
      leaks++;
    } else if (Number.isFinite(d) && Math.abs(d) > tol) {
      detail.push(`${reading} (held): moved ${fmt(d)} mm, allowed +- ${fmt(tol)}`);
      leaks++;
    }
  }
  if (detail.length === 0) return { input: p.input, status: "honoured", detail };

  // Ignored: the figure stayed, or only the input's own reading stayed while
  // nothing else moved; otherwise the change went somewhere else.
  const status: HumanInputResponse.IFinding["status"] = !changed || (still > 0 && moved === 0 && leaks === 0) ? "ignored" : "misrouted";
  return { input: p.input, status, detail: changed ? detail : ["the figure did not change", ...detail] };
}

/** Judge a perturbation of an input with no site. */
function judgeSiteless(p: HumanInputResponse.IPerturbation, changed: boolean): Omit<HumanInputResponse.IFinding, "ms"> {
  const why: string = p.reason ?? "no site";

  if (changed) return { input: p.input, status: "unmeasurable", detail: [`no site: ${why}; the figure changed`] };
  if (p.rest === false) return { input: p.input, status: "unmeasurable", detail: [`no site at rest: ${why}; the rest figure is unchanged, as it should be`] };
  return { input: p.input, status: "ignored", detail: [`no site: ${why}; the figure did not change, so no construction reads it`] };
}

/** Whether two skins differ: another vertex count, or any coordinate. */
function differs(a: Float64Array, b: Float64Array): boolean {
  if (a.length !== b.length) return true;

  for (let i: number = 0; i < a.length; i++) if (a[i] !== b[i]) return true;
  return false;
}

/** A reading to two decimals, NaN as such. */
function fmt(v: number): string {
  return Number.isFinite(v) ? v.toFixed(2) : "NaN";
}
