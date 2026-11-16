import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieFormationBlock,
  IAutoMovieFormationDesign,
  IAutoMovieMotionEvent,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanPerformance } from "../perform/HumanPerformance";
import type { HumanSegment } from "../perform/HumanSegment";
import type { HumanEnsemble } from "./HumanEnsemble";
import { HumanFormation } from "./HumanFormation";
import type { IHumanFormation } from "./IHumanFormation";

/**
 * Background members handed to the instanced population layer: their
 * places as one formation design, and their motion as a cycle of a
 * performed template member's own displayed poses, so a background soldier
 * marches the march the foreground marches.
 *
 * A population is a detail the author declares (`IHumanEnsemble.detail`),
 * never a camera's choice. Only steady cyclic motion becomes one: a
 * population member cannot be synced, cut or reached, so `cycle` refuses a
 * template whose window is not inside one stepping action. The design lays
 * the formation's blocks for the engine's own `formationSlotPosition`, whose
 * placement with the facing turned about is the formation's
 * (`HumanFormation`), so a population member stands on the slot it would
 * have had as a performer; the performed members are its hero overrides.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is handed over, who declares it, what may become a population and why the slots agree.
 * @evidence contracts/development/design.md#principled-representation The interface's formation design and a cycle of canonical poses with its period and stride.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `design`, `cycle` and the cycle's record; the render bakes the poses (`IAutoMovieFormationPoseTake`).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No generic gait stands in for the template's poses.
 */
export namespace HumanPopulation {
  /** A template's cycle, the record the render's pose take reads. */
  export interface ICycle {
    /** The take's name. */
    gait: string;

    /** Seconds of one cycle: from a heel strike to the same foot's next. */
    periodSeconds: number;

    /** Metres the template's root travels in one cycle. */
    strideMeters: number;

    /** The template's canonical poses at phases `i / poses.length`, moved to stand at the origin facing +Z with the travel taken out. */
    poses: IAutoMoviePose[];
  }

  /**
   * An ensemble's formation as one formation design: its blocks as the
   * design's blocks (`IAutoMovieFormationBlock`), its frame at a film second
   * as the design's anchor and facing turned about (the engine lays a
   * layout's depth ahead, the formation behind), and every member that is
   * performed as a hero override, so the population layer draws the others.
   *
   * @param ensemble The ensemble, standing in a formation.
   * @param props The design's id and model group, and the film second its frame is read at.
   * @returns The design.
   * @throws {HumanRefusal} When the ensemble has no formation or no population member.
   */
  export function design(
    ensemble: HumanEnsemble.IEnsemble,
    props: { id: string; model: string; seconds?: number },
  ): IAutoMovieFormationDesign {
    const formation: IHumanFormation | undefined = ensemble.input.formation;
    const population: number = ensemble.members.filter(
      (m: HumanEnsemble.IMember): boolean => m.detail === "population",
    ).length;
    if (formation === undefined || population === 0)
      throw new HumanRefusal({
        kind: "parameter",
        axis: `${ensemble.input.id}.detail`,
        value: population,
        reason:
          formation === undefined
            ? "a population is laid by the ensemble's formation, and it has none"
            : "the ensemble has no population member",
        fix: "give the ensemble a formation and declare its background members `population`",
      });
    const origin: { at: IAutoMovieVector3; heading: number } =
      HumanFormation.frame(formation, props.seconds ?? 0);
    return {
      id: props.id,
      model: props.model,
      count: HumanFormation.count(formation),
      layout: formation.blocks[0]!.layout,
      blocks: formation.blocks.map(
        (block: IHumanFormation.IBlock): IAutoMovieFormationBlock => ({
          layout: block.layout,
          count: block.count,
          ...(block.offset === undefined ? {} : { offset: block.offset }),
          ...(block.facing === undefined ? {} : { facing: block.facing }),
          seed: block.seed ?? 0,
        }),
      ),
      anchor: origin.at,
      facingDeg: origin.heading + 180,
      seed: formation.blocks[0]!.seed ?? 0,
      capabilities: [],
      heroOverrides: ensemble.members
        .filter(
          (m: HumanEnsemble.IMember): boolean => m.detail !== "population",
        )
        .map((m: HumanEnsemble.IMember): { slot: number; actor: string } => ({
          slot: m.index,
          actor: m.subject,
        })),
    };
  }
  /**
   * A template member's cycle: its displayed poses over one stride from the
   * first heel strike at or after `from`, at `samples` even phases.
   *
   * @param performance The performance the template is performed in.
   * @param template The template's subject.
   * @param from The film second the cycle is sought from.
   * @param samples How many phases; positive.
   * @returns The cycle.
   * @throws {HumanRefusal} When no stepping action of the template holds a whole stride from `from`.
   */
  export function cycle(
    performance: HumanPerformance,
    template: string,
    from: number,
    samples: number,
  ): ICycle {
    const segment: HumanSegment.ISegment | undefined = performance
      .segments(template)
      .find(
        (s: HumanSegment.ISegment): boolean =>
          s.entryTime <= from && from < s.end,
      );
    const strikes: { seconds: number; side: string }[] = (
      segment?.plan.events ?? []
    )
      .filter((e: IAutoMovieMotionEvent): boolean =>
        /^(left|right)HeelStrike\d+$/.test(e.name),
      )
      .map((e: IAutoMovieMotionEvent): { seconds: number; side: string } => ({
        seconds: segment!.start + e.share * segment!.plan.duration,
        side: e.name.startsWith("left") ? "left" : "right",
      }))
      .filter(
        (s: { seconds: number }): boolean =>
          s.seconds >= from && s.seconds <= segment!.end,
      )
      .sort(
        (a: { seconds: number }, b: { seconds: number }): number =>
          a.seconds - b.seconds,
      );
    const start: { seconds: number; side: string } | undefined = strikes[0];
    const next: { seconds: number; side: string } | undefined = strikes.find(
      (s: { seconds: number; side: string }): boolean =>
        start !== undefined &&
        s.side === start.side &&
        s.seconds > start.seconds,
    );
    if (
      segment === undefined ||
      start === undefined ||
      next === undefined ||
      !(samples > 0)
    )
      throw new HumanRefusal({
        kind: "participant",
        performer: template,
        axis: "cycle",
        value: segment?.name ?? null,
        reason:
          segment === undefined
            ? `${template} performs nothing at ${from.toFixed(3)} s`
            : `${template}'s ${segment.name} holds no whole stride from ${from.toFixed(3)} s, so it is no steady cycle`,
        fix: "take the cycle from a template stepping steadily through a whole stride",
      });

    // The poses over the stride, moved to the origin facing +Z with the travel taken out.
    const period: number = next.seconds - start.seconds;
    const first: IAutoMoviePose = performance.pose(template, start.seconds);
    const last: IAutoMoviePose = performance.pose(template, next.seconds);
    const origin: IAutoMovieVector3 = first.root?.translation ?? {
      x: 0,
      y: 0,
      z: 0,
    };
    const end: IAutoMovieVector3 = last.root?.translation ?? origin;
    const stride: number = Math.hypot(end.x - origin.x, end.z - origin.z);
    const heading: number =
      stride > 1e-9 ? Math.atan2(end.x - origin.x, end.z - origin.z) : 0;
    const back: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 0, y: 1, z: 0 },
      (-heading * 180) / Math.PI,
    );
    const poses: IAutoMoviePose[] = [];
    for (let i: number = 0; i < samples; ++i) {
      const u: number = i / samples;
      const pose: IAutoMoviePose = performance.pose(
        template,
        start.seconds + u * period,
      );
      if (pose.root === null) {
        poses.push(pose);
        continue;
      }
      const moved: IAutoMovieVector3 = Quaternion.rotateVector(back, {
        x: pose.root.translation.x - origin.x,
        y: pose.root.translation.y,
        z: pose.root.translation.z - origin.z,
      });
      poses.push({
        ...pose,
        root: {
          ...pose.root,
          translation: { x: moved.x, y: moved.y, z: moved.z - u * stride },
          rotation: Quaternion.multiply(back, pose.root.rotation),
        },
      });
    }
    return {
      gait: segment.name,
      periodSeconds: period,
      strideMeters: stride,
      poses,
    };
  }
}
