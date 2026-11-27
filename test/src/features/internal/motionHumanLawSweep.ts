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
   * @evidence contracts/development/common.md#meaningful-documentation Members name the performer, actual body, floor position and heading units.
   * @evidence contracts/development/design.md#principled-representation Keeps canonical IHumanBody and world placement together for both performance construction and independent audit ownership.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Contains only the public performer facts the stage and audit read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The body remains the actual polygon fixture, never a test geometry proxy.
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
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs a row performs.
   * @evidence contracts/development/design.md#principled-representation A scene contains the same public composition and prop inputs passed to AutoMovieMotionHumanPerformance.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Groups the three values every staged cell supplies.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Carries no expected pose or scene-specific exception.
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
   * @evidence contracts/development/common.md#meaningful-documentation States what undefined means.
   * @evidence contracts/development/design.md#principled-representation A named lookup preserves omitted parameters apart from explicit ledger values.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One argument and the optional ledger string the stage consumes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No default pose or expected result is supplied by the lookup.
   */
  export type Pick = (param: string) => string | undefined;

  /**
   * Build a row's scene from its requested values and two actual bodies.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the requested values, body roles and resulting scene.
   * @evidence contracts/development/design.md#principled-representation The stage selects public composition inputs while the performance remains the motion producer.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Its three inputs are the facts all stage tables require.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No frame-producing callback or expected result enters the stage signature.
   */
  export type Stage = (
    pick: Pick,
    a: IAutoMovieMotionHumanBody,
    b: IAutoMovieMotionHumanBody,
  ) => IScene;

  /**
   * One executed cell's identity, elapsed observation and complaints.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Every field names the row, bodies, seed, elapsed units or findings.
   * @evidence contracts/development/design.md#principled-representation Keeps failure identity beside observations so a refused or invalid cell remains attributable.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the ledger coordinates, timing observation and complaint lines are returned.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Elapsed milliseconds are a report field, never a physical correctness threshold or proof of optimization.
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
   * @evidence contracts/development/common.md#meaningful-documentation States the empty chain and default performer id.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates construction to the sweep chain that appends ordinary public intents.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One constructor call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Creates no pose or law-specific motion.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant-size chain construction.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses MotionHumanSweepChain.subject's intent representation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The returned chain is caller-owned; this helper stores nothing.
   */
  export function chain(subject: string = "a"): MotionHumanSweepChain {
    return MotionHumanSweepChain.subject(subject);
  }

  /**
   * A world target at x/y/z metres, retaining a supplied surface normal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the point frame, units and optional normal.
   * @evidence contracts/development/implementation.md#principled-implementation Builds the public point-target record with frame world.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record with an optional normal member.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Passes coordinates and normal unchanged; the actual target resolver owns admission and normalization.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant record construction.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work No repeated computation or request coordination occurs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the caller's returned target retains the supplied normal.
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
   * @evidence contracts/development/common.md#meaningful-documentation States the target identity and runtime region input.
   * @evidence contracts/development/implementation.md#principled-implementation Builds the public person-target shape for the actual law to resolve.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not invent a region coordinate or silently repair an unknown name.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant record construction.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work No completed computation is repeated here.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing outside the returned record.
   */
  export function person(subject: string, region: string): object {
    return { kind: "person", subject, region };
  }

  /**
   * The canonical lateral sign: left is +X; every other input uses right's -X.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the axis convention and undefined/non-left default.
   * @evidence contracts/development/implementation.md#principled-implementation One comparison implements the stage's left/right coordinate convention.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One conditional expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the existing right-side default without claiming to validate ledger values.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant scalar work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work There is no reusable computation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a scalar and retains nothing.
   */
  export function sign(side: string | undefined): number {
    return side === "left" ? 1 : -1;
  }

  /**
   * Requested named parameters, omitting only values the row leaves undefined.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which values are copied and the omitted-value rule.
   * @evidence contracts/development/implementation.md#principled-implementation Queries the stage's Pick once per supplied name and copies explicit values under that same key.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One traversal into a new record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not replace omitted values with defaults or discard an explicitly empty string.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the requested names and retained string values.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads through Pick's existing row lookup without another parser.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The returned record owns copied entries; the callback is not retained.
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
   * @evidence contracts/development/common.md#meaningful-documentation States placement and that an omitted prop list is empty.
   * @evidence contracts/development/implementation.md#principled-implementation Assembles public performer, composition and prop inputs without producing motion.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One performer record and scene record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the actual supplied body, chain node and props rather than expected frames.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant-size assembly; the input prop list is not traversed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the chain's existing node and supplied prop list directly.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The returned scene retains its inputs; no scene is kept globally.
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
   * @evidence contracts/development/common.md#meaningful-documentation States placement, heading default and the two composition inputs.
   * @evidence contracts/development/implementation.md#principled-implementation Builds public scene records and a parallel node only for a chain pair.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two performer records and one tuple-or-node branch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not change the supplied gap to avoid collision or manufacture a partner's pose.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant-size scene construction.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Retains the supplied bodies, prop list and existing composition nodes.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources References transfer with the returned scene; the helper keeps no cache.
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
   * @evidence contracts/development/common.md#meaningful-documentation States the row syntax, body roles and unconsumed-parameter observer.
   * @evidence contracts/development/implementation.md#principled-implementation Parses comma-separated settings into a Map and records each explicitly supplied value the stage queries; remaining keys are reported after construction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Parse, call one stage with canonical bodies, then report untouched keys.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An ignored row setting remains observable rather than silently passing as the default; stage errors propagate.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear row parsing and parameter bookkeeping, plus the stage and body-fixture owners' construction costs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses motionHumanBody fixtures and one Map lookup per Pick call.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The Map and consumed-key Set are call-local; the returned scene retains its actual inputs and no staging state is stored globally.
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
   * @evidence contracts/development/common.md#meaningful-documentation States the seed, scene and actual-film result.
   * @evidence contracts/development/implementation.md#principled-implementation Passes the scene's people, public composition and props unchanged to the real performance owner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call to motionHumanLaw.perform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No frame producer, replacement pose or correctness expectation is supplied.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is the actual performance construction; delegation removes none of its scheduling or IK work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the existing film owner and its per-film displayed-frame cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns film ownership to the caller and adds no separate retained state.
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
   * @evidence contracts/development/common.md#meaningful-documentation States cell coordinates, optional kept film, repeat default and elapsed wall-time observation.
   * @evidence contracts/development/implementation.md#principled-implementation Stages real inputs and delegates unchanged physical checks and the independent 4 Hz finite-position/orientation repeat to motionHumanLawSweepCell; Error messages become cell-attributed first-line complaints.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Record identity, stage and verify, transfer the first film, then return elapsed time and findings.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps refusals and unused parameters as findings, calls keep even for measured complaints, and introduces no result-specific threshold or skip.
   * @evidence contracts/development/implementation.md#efficient-algorithms One first film serves all detectors; repeat adds one independently staged performance and sampled comparison. Elapsed milliseconds are observational and prove no speedup.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The verification helper calls this namespace's existing perform owner; the kept film is the exact first film every detector read.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Complaint text has no added cap and is returned; the optional keeper owns any retained film, while the cell stores neither film nor callbacks globally on return or error.
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
   * @evidence contracts/development/common.md#meaningful-documentation States that this reads ledger-stage coverage without performing films.
   * @evidence contracts/development/implementation.md#principled-implementation Scans each ledger law and row, using the same staging reader on f-small and m-large and collecting missing stages, untouched settings and stage errors.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A law loop with a missing-stage branch and per-row construction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing and failed stages remain explicit complaints; no physical verdict is inferred from staging alone.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in ledger rows plus each stage's construction cost, with no performance or audit execution.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses staged and the canonical body-fixture owner rather than duplicating parameter-consumption logic.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns complaint strings without an added cap; row bookkeeping stays call-local and no scene or film is retained here.
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
