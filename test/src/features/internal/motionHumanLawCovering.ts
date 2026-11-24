import type { IAutoMovieMotionHumanAuditMeasure } from "@automovie/interface";
import { AutoMovieMotionHumanAuditDifference } from "@automovie/motions/internal";

import { motionCoveringArray } from "./motionCoveringArray";
import { motionHumanBody } from "./motionHumanBody";
import type { motionHumanLaw } from "./motionHumanLaw";
import { motionHumanLawSweep } from "./motionHumanLawSweep";
import { motionHumanLedger } from "./motionHumanLedger";

/**
 * The covering design of the universal sweep (`motionHumanLawSweep`): each
 * law's factors read off the coverage ledger, its covering array over them, the
 * bodies and the seeds, the whole array or one part of it, and the mirror
 * relation over the laws that set a side.
 *
 * A sweep is cut into parts by body first, so a part prepares one body and its
 * partner, and then by every k-th cell of that body's, so each part takes a
 * share of every law and the slow laws spread over all the parts.
 *
 * Whole and partitioned runs share deterministic law/cell enumeration and pair
 * coverage. Invalid part selections are refused; each valid part prepares its
 * selected body and partner. Scene construction, execution and cell checks stay
 * with motionHumanLawSweep; a left-row film survives only until its right-row
 * mirror comparison finishes.
 */
export namespace motionHumanLawCovering {
  /**
   * The sweep's bodies: its two extremes, the shortest and lightest person
   * (`f-small`) and the tallest and heaviest (`m-large`), each the other's
   * partner. The bodies between them are the variation specs' own.
   */
  export const BODIES: readonly motionHumanBody.Name[] = ["f-small", "m-large"];

  /**
   * The sweep's one seed. Seeded variation is the variation specs' own; a
   * seed's determinism is checked on each law's first cell.
   */
  export const SEEDS: readonly string[] = [motionHumanLawSweep.SEEDS[0]!];

  /**
   * The covering strength: every pair of values of any two factors meets in
   * some cell (pairwise testing, Kuhn, Kacker and Lei 2010, NIST SP 800-142).
   */
  export const STRENGTH: number = 2;

  /**
   * The factors of a law's combinatorial sweep: each parameter the coverage
   * ledger lists, with its values and `-` for the parameter left out. A
   * gesture's face region applies only to the face-touching gesture, so its
   * regions join the kind's values as `touchFace/<region>`.
   *
   * @param law The law.
   * @returns Each factor's values.
   * @evidence contracts/development/common.md#meaningful-documentation Defines omitted-value markers and the gesture kind/region dependency; an unlisted law yields no parameter factors.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the maintained ledger's parameter=value rows and represents the face-region choice only alongside touchFace, the gesture kind that consumes it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Find the law, collect parameter values and merge the one dependent gesture region factor.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses ledger values unchanged apart from the documented dependent-factor encoding; it supplies no staged pose, expected result or refusal exception.
   * @evidence contracts/development/implementation.md#efficient-algorithms For L ledger laws and R rows of the selected law, lookup/collection is O(L+R), with O(R) retained strings and a linear face-region merge when applicable.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Returns fresh parameter arrays from the shared immutable ledger; it has no cross-call cache or mutable result alias.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned record owns its arrays; local references end at return and no scene, body or running task is acquired.
   */
  export async function factors(
    law: string,
  ): Promise<Record<string, string[]>> {
    const ledger: motionHumanLedger.ILedger = await motionHumanLedger();
    const listed: motionHumanLedger.ILaw | undefined = ledger.laws.find(
      (l: motionHumanLedger.ILaw): boolean => l.law === law,
    );
    const out: Record<string, string[]> = {};
    for (const { row } of listed?.rows ?? []) {
      if (row === "default") continue;
      const at: number = row.indexOf("=");
      const param: string = row.slice(0, at);
      (out[param] ??= ["-"]).push(row.slice(at + 1));
    }
    if (
      law === "gesture" &&
      out.region !== undefined &&
      out.kind !== undefined
    ) {
      out.kind.push(
        ...out.region
          .filter((r: string): boolean => r !== "-")
          .map((r: string): string => `touchFace/${r}`),
      );
      delete out.region;
    }
    return out;
  }

  /**
   * Sweep every law of a table over a covering array of its parameters, the
   * bodies and the seeds (`motionCoveringArray`): every pair of values of any
   * two factors meets in some cell (`STRENGTH`), at a small share of the
   * Cartesian product's cells. The seed's determinism is checked on each law's
   * first cell; the mirror image of a side is a metamorphic test of its own.
   *
   * @param table Each law's stage.
   * @param bodies The bodies; each is `a`, partnered by the next.
   * @param seeds The seeds.
   * @param report Receives each cell as it finishes.
   * @param only Limits the sweep to laws whose name is in it, when given.
   * @returns Every complaint of every cell.
   * @evidence contracts/development/common.md#meaningful-documentation States covering strength, canonical body pairing, seed, callback, optional law selection and complete complaint return.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to the single deterministic covering sweep with every body selected, at pair coverage (`STRENGTH`) for every law.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegation supplies the all-bodies predicate and forwards the explicit selection/report inputs.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts It changes no cell, detector, physical bound or refusal policy and filters only caller-selected law names.
   * @evidence contracts/development/implementation.md#efficient-algorithms Per-law tuple construction belongs to motionCoveringArray; C resulting cells each incur real scene/performance/detector cost. No unmeasured speedup is claimed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the same sweep/staging/cell owners as partitioned runs; each actual cell shares one film across its physical detectors and repeats only the law's first cell for determinism.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the complete growing complaint list without a cap; active rows/film ownership belong to the sweep/cell calls and no process or global film cache is started.
   */
  export async function covering(
    table: Readonly<Record<string, motionHumanLawSweep.Stage>>,
    bodies: readonly motionHumanBody.Name[] = BODIES,
    seeds: readonly string[] = SEEDS,
    report: (cell: motionHumanLawSweep.ICell) => void = (): void => {},
    only?: readonly string[],
  ): Promise<string[]> {
    return sweep(table, bodies, seeds, (): boolean => true, report, only);
  }

  /**
   * One part of a table's sweep: part `i` of `n`, `n` a multiple of the bodies'
   * count. The parts are cut by body first (`n / bodies` parts per body, each
   * preparing that body and its partner only) and then take every `n /
   * bodies`-th cell of that body's, so together they are the whole covering
   * array, each cell in exactly one part.
   *
   * @param table Each law's stage.
   * @param at The part, from 0, and the count of parts.
   * @param bodies The bodies; each is `a`, partnered by the next.
   * @param seeds The seeds.
   * @returns Every complaint of the part's cells.
   * @throws {Error} When the count/index is not a safe integer, the count is
   *   not positive, the body set is empty, the count does not divide by the
   *   bodies or the part is out of range.
   * @evidence contracts/development/common.md#meaningful-documentation Defines zero-based safe-integer part selection, body-first partitioning, modulo cell selection and malformed/range/divisibility refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Admitted integer part inputs make body index floor(i/k) and ordinal modulo k partition each body's deterministic cell order exactly once across all parts; a fractional part must not silently select no cells.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Validate the existing bounds, choose one body and delegate a local ordinal predicate to the common sweep.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not suppress selected findings or alter a cell. Runtime admission rejects invalid numeric selections rather than returning an empty success; no physical threshold or valid integer partition changes.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each part enumerates the same complete per-law covering rows to preserve order (built once a process by motionCoveringArray and copied to each part), but performs only one body's every-kth cells and prepares that body's real scene participants. Physical work is not duplicated across parts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the common enumeration and cell verifier instead of reimplementing factors or physical checks. The ordinal is local to this call and no result is retained across parts.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds only the selected body name, stride and ordinal besides the delegated rows/complaints; all temporary sweep state releases on return or throw.
   */
  export async function part(
    table: Readonly<Record<string, motionHumanLawSweep.Stage>>,
    at: readonly [number, number],
    bodies: readonly motionHumanBody.Name[] = BODIES,
    seeds: readonly string[] = SEEDS,
  ): Promise<string[]> {
    const [i, n] = at;
    if (
      n <= 0 ||
      bodies.length === 0 ||
      n % bodies.length !== 0 ||
      !(i >= 0 && i < n)
    )
      throw new Error(
        `part ${i} of ${n} cannot be cut over ${bodies.length} bodies`,
      );
    const k: number = n / bodies.length;
    const body: motionHumanBody.Name = bodies[Math.floor(i / k)]!;
    let ordinal: number = -1;
    return sweep(table, bodies, seeds, (of: motionHumanBody.Name): boolean => {
      if (of !== body) return false;
      ordinal += 1;
      return ordinal % k === i % k;
    });
  }

  /**
   * How many cells of a table's covering array each body performs, without
   * performing any: what a part count is sized by.
   *
   * @param table Each law's stage.
   * @param bodies The bodies.
   * @param seeds The seeds.
   * @returns The cells by body.
   * @evidence contracts/development/common.md#meaningful-documentation States that counts size partitions without constructing a scene or performance.
   * @evidence contracts/development/implementation.md#principled-implementation Enumerates the same factor/body/seed rows and strengths as execution, incrementing the actual named body for each row.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Initialize body counts, build each law's rows and count them once.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not estimate physical runtime from cell count or replace execution with a count; its result is scheduling data only.
   * @evidence contracts/development/implementation.md#efficient-algorithms Covering construction retains its tuple cost; counting C emitted rows is O(C) with O(B) output entries for B body names, without expensive performance preparation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Calls the same factor extractor and covering constructor as execution, so scheduling does not keep a second ledger interpretation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only numeric counts escape; row arrays and factor records are local and no body, film, task or process is acquired.
   */
  export async function cells(
    table: Readonly<Record<string, motionHumanLawSweep.Stage>>,
    bodies: readonly motionHumanBody.Name[] = BODIES,
    seeds: readonly string[] = SEEDS,
  ): Promise<Record<string, number>> {
    const out: Record<string, number> = {};
    for (const body of bodies) out[body] = 0;
    for (const law of Object.keys(table)) {
      const own: Record<string, string[]> = await factors(law);
      for (const row of motionCoveringArray(
        { ...own, body: [...bodies], seed: [...seeds] },
        STRENGTH,
      ))
        out[row.body!] = (out[row.body!] ?? 0) + 1;
    }
    return out;
  }

  /**
   * The mirror relation over every law of a table: each ledger row that sets
   * the performer's own side to `left` (`motionHumanLawSweep.MIRRORED`) is
   * performed and compared with the mirror image of its `right` row (`mirror`),
   * on one body and one seed, since the relation holds whatever the body. A
   * sided law draws its seeded lateral variation in its acting side's frame, so
   * the relation holds for every seed. Its precondition is that sideless
   * staging carries no lateral seeded variation in mirror stages
   * (`MOTION_HUMAN_LAW_STAGES`), since a sideless stand's side-to-side draw
   * cannot know the coming side.
   *
   * @param table Each law's stage.
   * @param body The body of `a`; the partner is the small woman.
   * @param seed The seed.
   * @returns Every complaint, a refusal of either row included.
   * @evidence contracts/development/common.md#meaningful-documentation States the side/seed precondition, actual body pairing, positional mirror ownership and refusal attribution from either row.
   * @evidence contracts/development/implementation.md#principled-implementation For each declared mirrored parameter containing left, stage the actual left scene and compare actual displayed joints with the right scene reflected in x=0 at the existing 10 mm positional bound.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Discover mirrored parameters, perform each left row, delegate its right comparison and append attributed construction/read failures.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A refusal from either side remains a finding; finite-frame checks and the original bound remain. The comparison owns sampled joint positions over the common duration, not a separate proof of orientation or duration symmetry.
   * @evidence contracts/development/implementation.md#efficient-algorithms M mirrored parameter rows need at most two actual performance constructions each plus sampled bone comparisons; body preparation uses the shared canonical fixture cache.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each left film is built once and handed to its one right comparison; both use the existing staging, film and frame-validation owners without replacing source behavior.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The left/right films live only through their pair comparison; the returned complaint list has no added cap and no film/global callback history or running task escapes.
   */
  export async function mirrors(
    table: Readonly<Record<string, motionHumanLawSweep.Stage>>,
    body: motionHumanBody.Name = "m-average",
    seed: string = motionHumanLawSweep.SEEDS[0]!,
  ): Promise<string[]> {
    const out: string[] = [];
    const pair: [motionHumanBody.Name, motionHumanBody.Name] = [
      body,
      "f-small",
    ];
    for (const [law, stage] of Object.entries(table)) {
      const own: Record<string, string[]> = await factors(law);
      for (const param of Object.keys(own)) {
        if (
          !motionHumanLawSweep.MIRRORED.includes(param) ||
          !own[param]!.includes("left")
        )
          continue;
        const row: string = `${param}=left`;
        try {
          const left: motionHumanLaw.IFilm = motionHumanLawSweep.perform(
            seed,
            motionHumanLawSweep.staged(row, stage, pair, (): void => {}),
          );
          out.push(...mirror(law, row, stage, pair, seed, left));
        } catch (error) {
          out.push(
            `${law} | ${row} | ${pair[0]}+${pair[1]} | ${seed} | a | refused: ${error instanceof Error ? error.message.split("\n")[0] : String(error)}`,
          );
        }
      }
    }
    return out;
  }

  /**
   * Every cell of every law the selection takes, read and reported, its
   * complaints gathered.
   */
  async function sweep(
    table: Readonly<Record<string, motionHumanLawSweep.Stage>>,
    bodies: readonly motionHumanBody.Name[],
    seeds: readonly string[],
    take: (body: motionHumanBody.Name) => boolean,
    report: (cell: motionHumanLawSweep.ICell) => void = (): void => {},
    only?: readonly string[],
  ): Promise<string[]> {
    const out: string[] = [];
    for (const [law, stage] of Object.entries(table)) {
      if (only !== undefined && !only.includes(law)) continue;
      const own: Record<string, string[]> = await factors(law);
      const params: string[] = Object.keys(own);
      const rows: Record<string, string>[] = motionCoveringArray(
        { ...own, body: [...bodies], seed: [...seeds] },
        STRENGTH,
      );
      rows.forEach((row: Record<string, string>, index: number): void => {
        const body: motionHumanBody.Name = row.body as motionHumanBody.Name;
        if (!take(body)) return;
        const pair: [motionHumanBody.Name, motionHumanBody.Name] = [
          body,
          bodies[(bodies.indexOf(body) + 1) % bodies.length]!,
        ];
        const read: motionHumanLawSweep.ICell = motionHumanLawSweep.cell(
          law,
          settings(row, params),
          stage,
          pair,
          row.seed!,
          undefined,
          index === 0,
        );
        report(read);
        out.push(...read.complaints);
      });
    }
    return out;
  }

  /** A covering row's settings as a row string: `default` or `p=v,q=w`. */
  function settings(row: Record<string, string>, params: string[]): string {
    const parts: string[] = [];
    for (const param of params) {
      const value: string = row[param]!;
      if (value === "-") continue;
      if (value.startsWith("touchFace/"))
        parts.push("kind=touchFace", `region=${value.slice(10)}`);
      else parts.push(`${param}=${value}`);
    }
    return parts.length === 0 ? "default" : parts.join(",");
  }

  /**
   * Compare a left row's film with the mirror image of its right row's.
   *
   * No law states how close the two must be; the 10 mm skin tolerance is this
   * sweep's reading, and a finding here is first a question of whether the
   * seeded variation is meant to mirror.
   */
  function mirror(
    law: string,
    row: string,
    stage: motionHumanLawSweep.Stage,
    bodies: [motionHumanBody.Name, motionHumanBody.Name],
    seed: string,
    left: motionHumanLaw.IFilm,
  ): string[] {
    const twin: string = `${row.slice(0, row.indexOf("="))}=right`;
    let scene: motionHumanLawSweep.IScene;
    let right: motionHumanLaw.IFilm;
    try {
      scene = motionHumanLawSweep.staged(twin, stage, bodies, (): void => {});
      right = motionHumanLawSweep.perform(seed, scene);
    } catch (error) {
      return [
        `${law} | ${twin} | ${bodies[0]}+${bodies[1]} | ${seed} | a | refused: ${error instanceof Error ? error.message.split("\n")[0] : String(error)}`,
      ];
    }
    const out: string[] = [];
    for (const { subject } of scene.people) {
      const m: IAutoMovieMotionHumanAuditMeasure =
        AutoMovieMotionHumanAuditDifference.measure(left, right, subject, {
          mirror: 0,
          rate: 4,
        }).distance;
      if (m.value > motionHumanLawSweep.SKIN)
        out.push(
          `${law} | ${row} | ${bodies[0]}+${bodies[1]} | ${seed} | ${subject} | mirror ${m.value.toFixed(4)} over ${motionHumanLawSweep.SKIN} at ${m.seconds.toFixed(2)} s (${m.where})`,
        );
    }
    return out;
  }
}
