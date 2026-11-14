import {
  AutoMovieMotionHumanAuditDifference,
  type IAutoMovieMotionHumanAuditMeasure,
} from "@automovie/motions";

import LEDGER from "./MOTION_HUMAN_LEDGER.json";
import { motionCoveringArray } from "./motionCoveringArray";
import { motionHumanBody } from "./motionHumanBody";
import type { motionHumanLaw } from "./motionHumanLaw";
import { motionHumanLawSweep } from "./motionHumanLawSweep";

/**
 * The covering design of the universal sweep (`motionHumanLawSweep`): each
 * law's factors read off the coverage ledger, its covering array over them,
 * the bodies and the seeds, the whole array or one part of it, and the
 * mirror relation over the laws that set a side.
 *
 * A sweep is cut into parts by body first, so a part prepares one body and
 * its partner, and then by every k-th cell of that body's, so each part
 * takes a share of every law and the slow laws spread over all the parts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the design, how a part is cut and why.
 * @evidence contracts/development/implementation.md#principled-implementation Every pair (or triple) of factor values meets in some cell of the covering array; a part is a fixed selection of those cells, so the parts together are exactly the whole array.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over laws and cells with a selection, read by both the whole sweep and a part.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A part out of range or a count that does not divide by the bodies throws, so no cell is left out unnoticed.
 * @evidence contracts/development/implementation.md#efficient-algorithms A part prepares two bodies, not four.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Cells are read by `motionHumanLawSweep.cell`; scenes and films by its `staged` and `perform`.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A left row's film is kept only until its right row has been compared.
 */
export namespace motionHumanLawCovering {
  /**
   * The factors of a law's combinatorial sweep: each parameter the coverage
   * ledger lists, with its values and `-` for the parameter left out. A
   * gesture's face region applies only to the face-touching gesture, so its
   * regions join the kind's values as `touchFace/<region>`.
   *
   * @param law The law.
   * @returns Each factor's values.
   */
  export function factors(law: string): Record<string, string[]> {
    const listed: { rows: { row: string }[] } | undefined = (
      LEDGER.laws as { law: string; rows: { row: string }[] }[]
    ).find((l: { law: string }): boolean => l.law === law);
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
   * two factors meets in some cell, and every triple for a law with three or
   * more parameters, at a small share of the Cartesian product's cells. The
   * seed's determinism is checked on each law's first cell; the mirror image
   * of a side is a metamorphic test of its own.
   *
   * @param table Each law's stage.
   * @param bodies The bodies; each is `a`, partnered by the next.
   * @param seeds The seeds.
   * @param report Receives each cell as it finishes.
   * @param only Limits the sweep to laws whose name is in it, when given.
   * @returns Every complaint of every cell.
   */
  export function covering(
    table: Readonly<Record<string, motionHumanLawSweep.Stage>>,
    bodies: readonly motionHumanBody.Name[] = motionHumanBody.EXTREMES,
    seeds: readonly string[] = motionHumanLawSweep.SEEDS,
    report: (cell: motionHumanLawSweep.ICell) => void = (): void => {},
    only?: readonly string[],
  ): string[] {
    return sweep(table, bodies, seeds, (): boolean => true, report, only);
  }

  /**
   * One part of a table's sweep: part `i` of `n`, `n` a multiple of the
   * bodies' count. The parts are cut by body first (`n / bodies` parts per
   * body, each preparing that body and its partner only) and then take every
   * `n / bodies`-th cell of that body's, so together they are the whole
   * covering array, each cell in exactly one part.
   *
   * @param table Each law's stage.
   * @param at The part, from 0, and the count of parts.
   * @param bodies The bodies; each is `a`, partnered by the next.
   * @param seeds The seeds.
   * @returns Every complaint of the part's cells.
   * @throws {Error} When the count does not divide by the bodies or the part is out of range.
   */
  export function part(
    table: Readonly<Record<string, motionHumanLawSweep.Stage>>,
    at: readonly [number, number],
    bodies: readonly motionHumanBody.Name[] = motionHumanBody.EXTREMES,
    seeds: readonly string[] = motionHumanLawSweep.SEEDS,
  ): string[] {
    const [i, n] = at;
    if (n % bodies.length !== 0 || !(i >= 0 && i < n))
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
   */
  export function cells(
    table: Readonly<Record<string, motionHumanLawSweep.Stage>>,
    bodies: readonly motionHumanBody.Name[] = motionHumanBody.EXTREMES,
    seeds: readonly string[] = motionHumanLawSweep.SEEDS,
  ): Record<string, number> {
    const out: Record<string, number> = {};
    for (const body of bodies) out[body] = 0;
    for (const law of Object.keys(table)) {
      const own: Record<string, string[]> = factors(law);
      for (const row of motionCoveringArray(
        { ...own, body: [...bodies], seed: [...seeds] },
        Object.keys(own).length >= 3 ? 3 : 2,
      ))
        out[row.body!] = (out[row.body!] ?? 0) + 1;
    }
    return out;
  }

  /**
   * The mirror relation over every law of a table: each ledger row that
   * sets the performer's own side to `left` (`motionHumanLawSweep.MIRRORED`)
   * is performed and compared with the mirror image of its `right` row
   * (`mirror`), on one body and one seed, since the relation holds whatever
   * the body. A sided law draws its seeded lateral variation in its acting
   * side's frame, so the relation holds for every seed. Its precondition is
   * that sideless staging carries no lateral seeded variation in mirror
   * stages (`MOTION_HUMAN_LAW_STAGES`), since a sideless stand's
   * side-to-side draw cannot know the coming side.
   *
   * @param table Each law's stage.
   * @param body The body of `a`; the partner is the small woman.
   * @param seed The seed.
   * @returns Every complaint, a refusal of either row included.
   */
  export function mirrors(
    table: Readonly<Record<string, motionHumanLawSweep.Stage>>,
    body: motionHumanBody.Name = "m-average",
    seed: string = motionHumanLawSweep.SEEDS[0]!,
  ): string[] {
    const out: string[] = [];
    const pair: [motionHumanBody.Name, motionHumanBody.Name] = [
      body,
      "f-small",
    ];
    for (const [law, stage] of Object.entries(table)) {
      const own: Record<string, string[]> = factors(law);
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
            `${law} | ${row} | ${pair[0]}+${pair[1]} | ${seed} | a | refused: ${(error as Error).message.split("\n")[0]}`,
          );
        }
      }
    }
    return out;
  }

  /** Every cell of every law the selection takes, read and reported, its complaints gathered. */
  function sweep(
    table: Readonly<Record<string, motionHumanLawSweep.Stage>>,
    bodies: readonly motionHumanBody.Name[],
    seeds: readonly string[],
    take: (body: motionHumanBody.Name) => boolean,
    report: (cell: motionHumanLawSweep.ICell) => void = (): void => {},
    only?: readonly string[],
  ): string[] {
    const out: string[] = [];
    for (const [law, stage] of Object.entries(table)) {
      if (only !== undefined && !only.includes(law)) continue;
      const own: Record<string, string[]> = factors(law);
      const params: string[] = Object.keys(own);
      const rows: Record<string, string>[] = motionCoveringArray(
        { ...own, body: [...bodies], seed: [...seeds] },
        params.length >= 3 ? 3 : 2,
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
   * No law states how close the two must be; the 10 mm skin tolerance is
   * this sweep's reading, and a finding here is first a question of whether
   * the seeded variation is meant to mirror.
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
    } catch {
      return [];
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
