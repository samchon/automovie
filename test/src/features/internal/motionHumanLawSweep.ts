import type {
  IAutoMovieComposition,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieVector3,
} from "@automovie/interface";

import { MotionHumanSweepChain } from "./MotionHumanSweepChain";
import { motionHumanBody } from "./motionHumanBody";
import { motionHumanLaw } from "./motionHumanLaw";
import { motionHumanLawSweepCell } from "./motionHumanLawSweepCell";
import { motionHumanLedger } from "./motionHumanLedger";

/**
 * The universal sweep of the action laws: every law is staged over a covering
 * array of its parameters, the bodies and the seeds (`motionHumanLawCovering`),
 * performed and read by every generic detector of the motion audit, and
 * whatever a detector finds is one line that names its cell. The mirror image
 * of a side is a metamorphic relation of its own
 * (`motionHumanLawCovering.mirrors`).
 *
 * A row is `default` (the law's required parameters only) or settings
 * `param=value` joined by commas. A stage builds the scene of a row: it asks
 * {@link Pick} for each parameter it can set, so a setting the stage never asked
 * for is reported as unstaged instead of passing as the default.
 *
 * Every cell is held to the same specification, none of it read off the law's
 * code: the film plans without refusal; every declared window and event is well
 * formed; no segment enters another deeper than 10 mm; nothing sinks under the
 * floor, slips or lifts in a plant, jumps, reverses or outruns a joint; the
 * mass stays over its support; a foot the motion shows on the floor does not
 * skate and a declared plant is neither loose nor afloat; every joint stays in
 * its range; no bone spins through a turn between frames; two people do not
 * enter each other deeper than 10 mm; the same seed gives the same film
 * (performed twice on each law's first cell, since a second film doubles a
 * cell's cost).
 */
export namespace motionHumanLawSweep {
  /**
   * One actual scene performer and their world placement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the actual scene body, stable subject and placement in world coordinates.
   * @evidence contracts/development/design.md#principled-representation Carries the production body and world XYZ placement and yaw through the builder to the real performer input.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The scene supplies identity and placement; performer planning and returned bones stay with the performance.
   */
  export interface IPerson {
    /** The subject. */
    subject: string;

    /** Their body. */
    body: IAutoMovieMotionHumanBody;

    /** Their floor point. */
    at: IAutoMovieVector3;

    /** Their heading, degrees about +Y from +Z. */
    yaw: number;
  }

  /**
   * A row's actual people, composition and props.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names actual people, composition and the props supplied by one staged row.
   * @evidence contracts/development/design.md#principled-representation Uses the public composition and prop records alongside concrete placed people for the real scene.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Carries only the fields needed to turn an authored row into a performance.
   */
  export interface IScene {
    /** The people. */
    people: IPerson[];

    /** What they do. */
    composition: IAutoMovieComposition;

    /** The props. */
    props: IAutoMovieMotionHumanProp[];
  }

  /**
   * A row's requested parameter value, absent when it leaves that parameter.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes the named setting lookup and undefined case for an omitted setting.
   * @evidence contracts/development/design.md#principled-representation The staging wrapper reads the named row value and separately records supplied keys actually queried.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A single lookup lets the stage choose its own settings; row storage and unused-key reporting belong to the wrapper.
   */
  export type Pick = (param: string) => string | undefined;

  /**
   * Build a row's scene from its requested values and two actual bodies.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the settings reader and two actual body inputs used to build a scene.
   * @evidence contracts/development/design.md#principled-representation The stage receives public bodies and produces the same IScene that will be passed to performance.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The type keeps parameter tracking outside the stage while giving the stage its actual physical inputs.
   */
  export type Stage = (
    pick: Pick,
    a: IAutoMovieMotionHumanBody,
    b: IAutoMovieMotionHumanBody,
  ) => IScene;

  /**
   * One executed cell's identity, elapsed observation and complaints.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the executed row, body pair, seed, elapsed time and attributed complaints.
   * @evidence contracts/development/design.md#principled-representation The result records stage identity and observed complaints separately from elapsed milliseconds. Wall timing measures that execution.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The optional keep callback owns any retained film. The cell record carries only identity, elapsed timing and complaint strings.
   */
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
   * The parameters that name the performer's own acting side, whose left row is
   * the mirror image of its right row. A direction of travel or a partner's
   * hand is no such parameter.
   */
  export const MIRRORED: readonly string[] = [
    "side",
    "hand",
    "foot",
    "knee",
    "lead",
    "front",
  ];

  /**
   * An empty runtime-parameter chain; the subject defaults to a.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the empty parameterized chain and default subject a.
   * @evidence contracts/development/implementation.md#principled-implementation Calls the actual runtime chain builder with the requested subject so the staged composition retains its real binding.
   * @evidence contracts/development/implementation.md#efficient-algorithms Delegates one chain construction and leaves its ownership with the caller.
   */
  export function chain(subject: string = "a"): MotionHumanSweepChain {
    return MotionHumanSweepChain.subject(subject);
  }

  /**
   * A world target at x/y/z metres, retaining a supplied surface normal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the world target coordinate in metres and the optional surface normal.
   * @evidence contracts/development/implementation.md#principled-implementation Returns the requested world position unchanged and includes the authored normal when supplied.
   * @evidence contracts/development/implementation.md#efficient-algorithms Builds one constant-size target and borrows the optional normal for its lifetime.
   */
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

  /**
   * A subject and region named by a ledger stage as a person target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the target subject and region supplied by its stage.
   * @evidence contracts/development/implementation.md#principled-implementation Uses those exact semantic region and subject labels in an explicit person target.
   * @evidence contracts/development/implementation.md#efficient-algorithms Allocates one target and retains no records outside its return value.
   */
  export function person(subject: string, region: string): object {
    return { kind: "person", subject, region };
  }

  /**
   * The canonical lateral sign: left is +X; every other input uses right's -X.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the left +X convention and the other-input fallback.
   * @evidence contracts/development/implementation.md#principled-implementation The check selects +1 for the left literal and −1 for every remaining value, including the general default.
   * @evidence contracts/development/implementation.md#efficient-algorithms The function uses one comparison and retains no data.
   */
  export function sign(side: string | undefined): number {
    return side === "left" ? 1 : -1;
  }

  /**
   * Requested named parameters, omitting only values the row leaves undefined.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explains lookup by requested parameter and omission only on undefined.
   * @evidence contracts/development/implementation.md#principled-implementation Visits the supplied names and writes the actual lookup result for each present value, including an empty string.
   * @evidence contracts/development/implementation.md#efficient-algorithms Executes one lookup per requested name, with storage for present settings in the returned object only.
   */
  export function set(pick: Pick, ...params: string[]): Record<string, string> {
    const out: Record<string, string> = {};
    for (const param of params) {
      const value: string | undefined = pick(param);
      if (value !== undefined) out[param] = value;
    }
    return out;
  }

  /**
   * One actual body at the world origin facing +Z, on the given chain and
   * props.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the origin and +Z heading, actual body and borrowed props and composition.
   * @evidence contracts/development/implementation.md#principled-implementation Builds the public scene with subject a, zero position and zero yaw and the existing chain node.
   * @evidence contracts/development/implementation.md#efficient-algorithms Assembles a constant-size scene and forwards the props array directly; motion preparation stays with the later perform call.
   */
  export function solo(
    a: IAutoMovieMotionHumanBody,
    acts: IAutoMovieMotionHumanChain,
    props: IAutoMovieMotionHumanProp[] = [],
  ): IScene {
    return {
      people: [{ subject: "a", body: a, at: { x: 0, y: 0, z: 0 }, yaw: 0 }],
      composition: acts.node,
      props,
    };
  }

  /**
   * Two actual bodies gap metres apart on +Z; b faces a by default, else +Z. A
   * pair of chains becomes parallel in its given order; a node is kept as is.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the absolute placements, b's default orientation and the two accepted composition forms.
   * @evidence contracts/development/implementation.md#principled-implementation Places a at the origin and b at the authored +Z gap, with b at 180-degree yaw when facing. A pair of chain nodes maps to parallel composition in input order.
   * @evidence contracts/development/implementation.md#efficient-algorithms Allocates two performer records and at most one parallel node. Existing composition and props remain borrowed in the returned scene.
   */
  export function duo(
    a: IAutoMovieMotionHumanBody,
    b: IAutoMovieMotionHumanBody,
    gap: number,
    composition:
      | IAutoMovieComposition
      | [IAutoMovieMotionHumanChain, IAutoMovieMotionHumanChain],
    props: IAutoMovieMotionHumanProp[] = [],
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
            type: "parallel",
            parts: [composition[0].node, composition[1].node],
          }
        : composition,
      props,
    };
  }

  /**
   * The scene of a row.
   *
   * @param row The row.
   * @param stage The law's stage.
   * @param bodies The bodies of `a` and of the partner.
   * @param unstaged Hears a parameter the stage never asked for.
   * @returns The scene.
   * @evidence contracts/development/common.md#meaningful-documentation Describes row-setting syntax, the two body roles and untouched-key reporting.
   * @evidence contracts/development/implementation.md#principled-implementation Parses default or comma-delimited name/value entries, tracks supplied entries queried by the real stage, and reports every supplied key that the stage skipped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Aside from fixture and stage costs, bookkeeping is linear in row text and parameter queries. Its map and set are local and only the stage's scene escapes.
   */
  export function staged(
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

  /**
   * The film of a scene on a seed.
   *
   * @param seed The seed.
   * @param scene The scene.
   * @returns The film.
   * @evidence contracts/development/common.md#meaningful-documentation States the seed, actual scene and returned film.
   * @evidence contracts/development/implementation.md#principled-implementation Passes the scene's bodies, positions, composition and props to motionHumanLaw.perform under the supplied seed.
   * @evidence contracts/development/implementation.md#efficient-algorithms Reuses the existing performance setup and per-film cache. This wrapper retains no second scene or frame state.
   */
  export function perform(seed: string, scene: IScene): motionHumanLaw.IFilm {
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
   * @evidence contracts/development/common.md#meaningful-documentation Names the cell attribution, default repeat, optional film keeper and elapsed measurement.
   * @evidence contracts/development/implementation.md#principled-implementation Runs the real stage and physical verifier with the configured law settings, retains unused parameters as complaints and records Error messages as attributed refusals. Repeat builds a second scene for independent comparison.
   * @evidence contracts/development/implementation.md#efficient-algorithms Shares one first film across all checks and sends that film to the optional owner. Repeat adds an independent staged performance. Only the returned complaint list and timing survive by default.
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
    const say: (subject: string, what: string) => void = (
      subject: string,
      what: string,
    ): void => {
      complaints.push(`${head} | ${subject} | ${what}`);
    };
    try {
      const scene: IScene = staged(row, stage, bodies, (param: string): void =>
        say("a", `stage: the parameter ${param} is not staged`),
      );
      const film: motionHumanLaw.IFilm = motionHumanLawSweepCell(
        scene,
        (input: IScene): motionHumanLaw.IFilm => perform(seed, input),
        AIRBORNE.includes(law),
        SKIN,
        say,
        repeat
          ? (): IScene => staged(row, stage, bodies, (): void => {})
          : undefined,
      );
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
   * @evidence contracts/development/common.md#meaningful-documentation States that the result covers absent stages, unread settings and stage errors without film execution.
   * @evidence contracts/development/implementation.md#principled-implementation Walks the authored ledger and runs each available stage with f-small and m-large. Missing stages and untouched settings remain explicit; a stage error keeps its first line.
   * @evidence contracts/development/implementation.md#efficient-algorithms Reads the ledger once for this pass and reuses staged's consumption checking. Cost follows rows and stage work; no film runs or surviving scene cache.
   */
  export async function unstaged(
    table: Readonly<Record<string, Stage>>,
  ): Promise<string[]> {
    const out: string[] = [];
    const ledger: motionHumanLedger.ILedger = await motionHumanLedger();
    for (const { law, rows } of ledger.laws) {
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
}
