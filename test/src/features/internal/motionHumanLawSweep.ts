import type { AutoMovieComposition } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanAudit,
  AutoMovieMotionHumanAuditContact,
  AutoMovieMotionHumanAuditDifference,
  AutoMovieMotionHumanAuditPartner,
  AutoMovieMotionHumanAuditRange,
  AutoMovieMotionHumanAuditSpin,
  AutoMovieMotionHumanAuditTiming,
  HumanChain,
  type IAutoMovieMotionHumanAuditMeasure,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";

import LEDGER from "./MOTION_HUMAN_LEDGER.json";
import { MotionHumanSweepChain } from "./MotionHumanSweepChain";
import { motionCoveringArray } from "./motionCoveringArray";
import { motionHumanBody } from "./motionHumanBody";
import { motionHumanLaw } from "./motionHumanLaw";

/**
 * The universal sweep of the action laws: every law is staged over a
 * covering array of its parameters, the bodies and the seeds
 * ({@link covering}), performed and read by every generic detector of the
 * motion audit, and whatever a detector finds is one line that names its
 * cell. The mirror image of a side is a metamorphic relation of its own
 * ({@link mirrors}).
 *
 * A row is `default` (the law's required parameters only) or settings
 * `param=value` joined by commas. A stage builds the scene of a row: it asks
 * {@link Pick} for each parameter it can set, so a setting the stage never
 * asked for is reported as unstaged instead of passing as the default.
 *
 * Every cell is held to the same specification, none of it read off the
 * law's code: the film plans without refusal; every declared window and
 * event is well formed; no segment enters another deeper than 10 mm; nothing
 * sinks under the floor, slips or lifts in a plant, jumps, reverses or
 * outruns a joint; the mass stays over its support; a foot the motion shows
 * on the floor does not skate and a declared plant is neither loose nor
 * afloat; every joint stays in its range; no bone spins through a turn
 * between frames; two people do not enter each other deeper than 10 mm; the
 * same seed gives the same film (performed twice on each law's first cell,
 * since a second film doubles a cell's cost).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the row grammar, the covering design and the specification every cell is held to.
 * @evidence contracts/development/implementation.md#principled-implementation Every reading is a detector of the motions package's audit on displayed bones; the limits are the audit's own or the 10 mm skin tolerance.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Scene helpers, one cell reader and one loop over laws, rows, bodies and seeds.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A refusal, an unstaged parameter and an unknown law are complaints, never skipped cells.
 * @evidence contracts/development/implementation.md#efficient-algorithms One film per cell shared by every detector; the repeat for determinism is read at 4 Hz.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Films and the generic audit come from `motionHumanLaw`.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A left row's film is kept only until its right row has been compared.
 */
export namespace motionHumanLawSweep {
  /** One person of a scene. */
  export interface IPerson {
    /** The subject. */
    subject: string;

    /** Their body. */
    body: IHumanBody;

    /** Their floor point. */
    at: IAutoMovieVector3;

    /** Their heading, degrees about +Y from +Z. */
    yaw: number;
  }

  /** What a row performs. */
  export interface IScene {
    /** The people. */
    people: IPerson[];

    /** What they do. */
    composition: AutoMovieComposition;

    /** The props. */
    props: IHumanProp[];
  }

  /** The value a row sets for a parameter; undefined when the row leaves it. */
  export type Pick = (param: string) => string | undefined;

  /** The scene of a row, for subject `a`'s body and a partner's. */
  export type Stage = (pick: Pick, a: IHumanBody, b: IHumanBody) => IScene;

  /** The reading of one cell. */
  export interface ICell {
    /** The law. */
    law: string;

    /** The row. */
    row: string;

    /** The bodies of `a` and of the partner. */
    bodies: [motionHumanBody.Name, motionHumanBody.Name];

    /** The seed. */
    seed: string;

    /** Wall milliseconds the cell took. */
    milliseconds: number;

    /** One line per finding; empty when the cell is clean. */
    complaints: string[];
  }

  /** Every body of the end-state sweep. */
  export const BODIES: readonly motionHumanBody.Name[] = motionHumanBody.SWEEP;

  /** Every seed of the end-state sweep. */
  export const SEEDS: readonly string[] = ["sweep-1", "sweep-2", "sweep-3"];

  /** The depth a pressed skin gives, metres. */
  export const SKIN: number = 0.01;

  /** Laws whose body is not carried by the floor: no plant is read. */
  export const AIRBORNE: readonly string[] = ["swim", "climbLadder"];

  /**
   * The parameters that name the performer's own acting side, whose left row
   * is the mirror image of its right row. A direction of travel or a
   * partner's hand is no such parameter.
   */
  export const MIRRORED: readonly string[] = [
    "side",
    "hand",
    "foot",
    "knee",
    "lead",
    "front",
  ];

  /** An empty chain of a subject. */
  export function chain(subject: string = "a"): MotionHumanSweepChain {
    return MotionHumanSweepChain.subject(subject);
  }

  /** A world point as a target, with the normal of the surface it lies on. */
  export function point(
    x: number,
    y: number,
    z: number,
    normal?: IAutoMovieVector3,
  ): object {
    return {
      kind: "point",
      at: { x, y, z },
      frame: "world",
      ...(normal === undefined ? {} : { normal }),
    };
  }

  /** A region of a person as a target. */
  export function person(subject: string, region: string): object {
    return { kind: "person", subject, region };
  }

  /** The lateral sign of a side: the right hand lies at negative X. */
  export function sign(side: string | undefined): number {
    return side === "left" ? 1 : -1;
  }

  /** The parameters a row sets among those named, under their own names. */
  export function set(pick: Pick, ...params: string[]): Record<string, string> {
    const out: Record<string, string> = {};
    for (const param of params) {
      const value: string | undefined = pick(param);
      if (value !== undefined) out[param] = value;
    }
    return out;
  }

  /** One person at the origin facing +Z. */
  export function solo(
    a: IHumanBody,
    acts: HumanChain,
    props: IHumanProp[] = [],
  ): IScene {
    return {
      people: [{ subject: "a", body: a, at: { x: 0, y: 0, z: 0 }, yaw: 0 }],
      composition: acts.node,
      props,
    };
  }

  /** `a` at the origin facing +Z and `b` a gap ahead, facing back or away. */
  export function duo(
    a: IHumanBody,
    b: IHumanBody,
    gap: number,
    composition: AutoMovieComposition | [HumanChain, HumanChain],
    props: IHumanProp[] = [],
    facing: boolean = true,
  ): IScene {
    return {
      people: [
        { subject: "a", body: a, at: { x: 0, y: 0, z: 0 }, yaw: 0 },
        {
          subject: "b",
          body: b,
          at: { x: 0, y: 0, z: gap },
          yaw: facing ? 180 : 0,
        },
      ],
      composition: Array.isArray(composition)
        ? {
            kind: "parallel",
            parts: [composition[0].node, composition[1].node],
          }
        : composition,
      props,
    };
  }

  /** The scene of a row; `unstaged` hears a parameter the stage never asked for. */
  function staged(
    row: string,
    stage: Stage,
    bodies: [motionHumanBody.Name, motionHumanBody.Name],
    unstaged: (param: string) => void,
  ): IScene {
    // `default`, `p=v`, or several settings joined by commas.
    const set: Map<string, string> = new Map(
      row === "default"
        ? []
        : row.split(",").map((part: string): [string, string] => {
            const at: number = part.indexOf("=");
            return [part.slice(0, at), part.slice(at + 1)];
          }),
    );
    const asked: Set<string> = new Set();
    const scene: IScene = stage(
      (name: string): string | undefined => {
        const value: string | undefined = set.get(name);
        if (value !== undefined) asked.add(name);
        return value;
      },
      motionHumanBody(bodies[0]),
      motionHumanBody(bodies[1]),
    );
    for (const param of set.keys()) if (!asked.has(param)) unstaged(param);
    return scene;
  }

  /** The film of a scene on a seed. */
  function perform(seed: string, scene: IScene): motionHumanLaw.IFilm {
    return motionHumanLaw.perform(
      seed,
      scene.people,
      scene.composition,
      scene.props,
    );
  }

  /**
   * Read one cell.
   *
   * @param law The law.
   * @param row The row.
   * @param stage The law's stage.
   * @param bodies The bodies of `a` and of the partner.
   * @param seed The seed.
   * @param keep Receives the film, for a later mirror comparison.
   * @param repeat Whether the film is performed a second time to check the
   *   seed's determinism; true when absent.
   * @returns The cell.
   */
  export function cell(
    law: string,
    row: string,
    stage: Stage,
    bodies: [motionHumanBody.Name, motionHumanBody.Name],
    seed: string,
    keep?: (film: motionHumanLaw.IFilm) => void,
    repeat: boolean = true,
  ): ICell {
    const started: number = Date.now();
    const head: string = `${law} | ${row} | ${bodies[0]}+${bodies[1]} | ${seed}`;
    const complaints: string[] = [];
    const say = (subject: string, what: string): void => {
      complaints.push(`${head} | ${subject} | ${what}`);
    };
    const measured = (
      subject: string,
      check: string,
      m: IAutoMovieMotionHumanAuditMeasure,
      limit: number,
    ): void => {
      if (m.value > limit)
        say(
          subject,
          `${check} ${m.value.toFixed(4)} over ${limit} at ${m.seconds.toFixed(2)} s (${m.where})`,
        );
    };
    try {
      const scene: IScene = staged(row, stage, bodies, (param: string): void =>
        say("a", `stage: the parameter ${param} is not staged`),
      );
      const film: motionHumanLaw.IFilm = perform(seed, scene);
      const airborne: boolean = AIRBORNE.includes(law);
      for (const one of scene.people) {
        const who: string = one.subject;
        for (const fault of AutoMovieMotionHumanAuditTiming.faults(
          film.performance.segments(who),
        ))
          say(who, `timing ${fault}`);
        const report: AutoMovieMotionHumanAudit.IReport =
          AutoMovieMotionHumanAudit.run(film, who, one.body, {
            limits: airborne
              ? { floor: null, slip: null, lift: null, balance: null }
              : {},
          });
        for (const finding of report.findings)
          measured(who, finding.check, finding, finding.limit);
        if (!airborne) {
          const contact: AutoMovieMotionHumanAuditContact.IResult =
            AutoMovieMotionHumanAuditContact.measure(film, who, one.body);
          for (const check of ["skate", "loose", "afloat"] as const)
            measured(
              who,
              check,
              contact[check],
              check === "afloat"
                ? AutoMovieMotionHumanAuditContact.HEIGHT
                : AutoMovieMotionHumanAuditContact.SPEED,
            );
        }
        measured(
          who,
          "range",
          AutoMovieMotionHumanAuditRange.measure(film.performance, who, 6)
            .overshoot,
          0.01,
        );
        measured(
          who,
          "turn",
          AutoMovieMotionHumanAuditSpin.measure(film, who).turn,
          5,
        );
      }
      for (let i: number = 0; i < scene.people.length; i++)
        for (let j: number = i + 1; j < scene.people.length; j++)
          measured(
            `${scene.people[i]!.subject}+${scene.people[j]!.subject}`,
            "partner",
            AutoMovieMotionHumanAuditPartner.measure(
              film,
              scene.people[i]!,
              scene.people[j]!,
            ).worst,
            SKIN,
          );
      if (repeat) {
        const again: motionHumanLaw.IFilm = perform(
          seed,
          staged(row, stage, bodies, (): void => {}),
        );
        for (const one of scene.people)
          measured(
            one.subject,
            "determinism",
            AutoMovieMotionHumanAuditDifference.measure(
              film,
              again,
              one.subject,
              { rate: 4 },
            ).distance,
            1e-9,
          );
      }
      keep?.(film);
    } catch (error) {
      say("a", `refused: ${(error as Error).message.split("\n")[0]}`);
    }
    return {
      law,
      row,
      bodies,
      seed,
      milliseconds: Date.now() - started,
      complaints,
    };
  }

  /**
   * The ledger rows a table cannot stage, without performing any.
   *
   * @param table Each law's stage.
   * @returns One line per ledger law without a stage, per row whose parameter
   *   its stage never asks for, and per row whose stage throws.
   */
  export function unstaged(table: Readonly<Record<string, Stage>>): string[] {
    const out: string[] = [];
    for (const { law, rows } of LEDGER.laws as {
      law: string;
      rows: { row: string }[];
    }[]) {
      const stage: Stage | undefined = table[law];
      if (stage === undefined) {
        out.push(`${law}: no stage`);
        continue;
      }
      for (const { row } of rows)
        try {
          staged(row, stage, ["f-small", "m-large"], (param: string): void => {
            out.push(`${law} | ${row}: the parameter ${param} is not staged`);
          });
        } catch (error) {
          out.push(
            `${law} | ${row}: ${(error as Error).message.split("\n")[0]}`,
          );
        }
    }
    return out;
  }

  /**
   * The mirror relation over every law of a table: each ledger row that
   * sets the performer's own side to `left` (`MIRRORED`) is performed and
   * compared with the mirror image of its `right` row (`mirror`), on one
   * body and one seed, since the relation holds whatever the body.
   *
   * @param table Each law's stage.
   * @param body The body of `a`; the partner is the next of the extremes.
   * @param seed The seed.
   * @returns Every complaint, a refusal of either row included.
   */
  export function mirrors(
    table: Readonly<Record<string, Stage>>,
    body: motionHumanBody.Name = "m-average",
    seed: string = SEEDS[0]!,
  ): string[] {
    const out: string[] = [];
    const pair: [motionHumanBody.Name, motionHumanBody.Name] = [
      body,
      "f-small",
    ];
    for (const [law, stage] of Object.entries(table)) {
      const own: Record<string, string[]> = factors(law);
      for (const param of Object.keys(own)) {
        if (!MIRRORED.includes(param) || !own[param]!.includes("left"))
          continue;
        const row: string = `${param}=left`;
        try {
          const left: motionHumanLaw.IFilm = perform(
            seed,
            staged(row, stage, pair, (): void => {}),
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
    ).find((l) => l.law === law);
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
        ...out.region.filter((r) => r !== "-").map((r) => `touchFace/${r}`),
      );
      delete out.region;
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
    table: Readonly<Record<string, Stage>>,
    bodies: readonly motionHumanBody.Name[] = motionHumanBody.EXTREMES,
    seeds: readonly string[] = SEEDS,
    report: (cell: ICell) => void = (): void => {},
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
        const pair: [motionHumanBody.Name, motionHumanBody.Name] = [
          body,
          bodies[(bodies.indexOf(body) + 1) % bodies.length]!,
        ];
        const read: ICell = cell(
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
    stage: Stage,
    bodies: [motionHumanBody.Name, motionHumanBody.Name],
    seed: string,
    left: motionHumanLaw.IFilm,
  ): string[] {
    const twin: string = `${row.slice(0, row.indexOf("="))}=right`;
    let scene: IScene;
    let right: motionHumanLaw.IFilm;
    try {
      scene = staged(twin, stage, bodies, (): void => {});
      right = perform(seed, scene);
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
      if (m.value > SKIN)
        out.push(
          `${law} | ${row} | ${bodies[0]}+${bodies[1]} | ${seed} | ${subject} | mirror ${m.value.toFixed(4)} over ${SKIN} at ${m.seconds.toFixed(2)} s (${m.where})`,
        );
    }
    return out;
  }
}
