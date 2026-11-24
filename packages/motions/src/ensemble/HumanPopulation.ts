import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieFormationBlock,
  IAutoMovieFormationDesign,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEnsemble,
  IAutoMovieMotionHumanFormation,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPopulation,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanSupportFrame } from "../carrier/HumanSupportFrame";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanFormation } from "./HumanFormation";

/** The record of `ICycleNextS`'s site. */
type ICycleNextS = { seconds: number; side: string };

/** The record of `ICycleNext`'s site. */
type ICycleNext = { seconds: number; side: string };

/** The record of `ICycleStart`'s site. */
type ICycleStart = { seconds: number; side: string };

/** The record of `ICycleStrikesB`'s site. */
type ICycleStrikesB = { seconds: number };

/** The record of `ICycleStrikesA`'s site. */
type ICycleStrikesA = { seconds: number };

/** The record of `ICycleStrikesS`'s site. */
type ICycleStrikesS = { seconds: number };

/** The record of `ICycleStrikesResult`'s site. */
type ICycleStrikesResult = { seconds: number; side: string };

/** The record of `ICycleStrikesItem`'s site. */
type ICycleStrikesItem = { seconds: number; side: string };

/** The record of `IDesignResult`'s site. */
type IDesignResult = { slot: number; actor: string };

/** The record of `IDesignOrigin`'s site. */
type IDesignOrigin = { at: IAutoMovieVector3; heading: number };

/**
 * Background members handed to the instanced population layer: their places as
 * one formation design, and their motion as a cycle of a performed template
 * member's own displayed poses, so a background soldier marches the march the
 * foreground marches.
 *
 * A population is a detail the author declares (`IHumanEnsemble.detail`), never
 * a camera's choice. A population uses steady motion because a population
 * member cannot be synced, cut or reached, so `cycle` refuses a template whose
 * window is not inside one stepping action. `standing` holds the pose of one
 * settled stand at every phase. The design lays the formation's blocks for the
 * engine's own `formationSlotPosition`, whose placement with the facing turned
 * about is the formation's (`HumanFormation`), so a population member stands on
 * the slot it would have had as a performer; the performed members are its hero
 * overrides.
 */
export namespace HumanPopulation {
  /**
   * An ensemble's formation as one formation design: its blocks as the design's
   * blocks (`IAutoMovieFormationBlock`), its frame at a film second as the
   * design's anchor and facing turned about (the engine lays a layout's depth
   * ahead, the formation behind), and every member that is performed as a hero
   * override, so the population layer draws the others.
   *
   * @param ensemble The ensemble, standing in a formation.
   * @param props The design's id and model group, and the film second its frame
   *   is read at.
   * @returns The design.
   * @throws {HumanRefusal} When the ensemble has no formation or no population
   *   member.
   */
  export function design(
    ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble,
    props: IAutoMovieMotionHumanPopulation.IDesignProps,
  ): IAutoMovieFormationDesign {
    const formation: IAutoMovieMotionHumanFormation | undefined =
      ensemble.input.formation;
    const population: number = ensemble.members.filter(
      (m: IAutoMovieMotionHumanEnsemble.IMember): boolean =>
        m.detail === "population",
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
    const origin: IDesignOrigin = HumanFormation.prepare(formation).frame(
      props.seconds ?? 0,
    );
    return {
      id: props.id,
      model: props.model,
      count: HumanFormation.count(formation),
      layout: formation.blocks[0]!.layout,
      blocks: formation.blocks.map(
        (
          block: IAutoMovieMotionHumanFormation.IBlock,
        ): IAutoMovieFormationBlock => ({
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
          (m: IAutoMovieMotionHumanEnsemble.IMember): boolean =>
            m.detail !== "population",
        )
        .map(
          (m: IAutoMovieMotionHumanEnsemble.IMember): IDesignResult => ({
            slot: m.index,
            actor: m.subject,
          }),
        ),
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
   * @throws {HumanRefusal} When no stepping action of the template holds a
   *   whole stride from `from`.
   */
  export function cycle(
    performance: IAutoMovieMotionHumanPerformance,
    template: string,
    from: number,
    samples: number,
  ): IAutoMovieMotionHumanPopulation.ICycle {
    const segment: IAutoMovieMotionHumanSegment | undefined = performance
      .segments(template)
      .find(
        (s: IAutoMovieMotionHumanSegment): boolean =>
          s.entryTime <= from && from < s.end,
      );
    const strikes: ICycleStrikesItem[] = (segment?.plan.events ?? [])
      .filter((e: IAutoMovieMotionEvent): boolean =>
        /^(left|right)HeelStrike\d+$/.test(e.name),
      )
      .map(
        (e: IAutoMovieMotionEvent): ICycleStrikesResult => ({
          seconds: segment!.start + e.share * segment!.plan.duration,
          side: e.name.startsWith("left") ? "left" : "right",
        }),
      )
      .filter(
        (s: ICycleStrikesS): boolean =>
          s.seconds >= from && s.seconds <= segment!.end,
      )
      .sort(
        (a: ICycleStrikesA, b: ICycleStrikesB): number => a.seconds - b.seconds,
      );
    const start: ICycleStart | undefined = strikes[0];
    const next: ICycleNext | undefined = strikes.find(
      (s: ICycleNextS): boolean =>
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

  /**
   * Hold the displayed pose at the chosen stand's `settled` event. Every phase
   * uses that pose with zero stride, expressed at the slot origin facing +Z
   * with the root height measured above the stand's floor. The segment's placed
   * duration gives the period of the pose take. The take may use a settled
   * event at the end when the performance still displays that stand at the
   * event.
   *
   * @param performance The performance containing the template stand.
   * @param template The template's subject id.
   * @param from Film second used to select the template's active stand.
   * @param samples Positive integral phase count below 2^32, matching other
   *   takes baked with this one.
   * @returns A held `stand` take.
   * @throws {HumanRefusal} When the selected action has no settled stand on
   *   ground within its placed span or the sample count is invalid.
   */
  export function standing(
    performance: IAutoMovieMotionHumanPerformance,
    template: string,
    from: number,
    samples: number,
  ): IAutoMovieMotionHumanPopulation.ICycle {
    if (!Number.isInteger(samples) || samples <= 0 || samples >= 2 ** 32)
      throw new HumanRefusal({
        kind: "parameter",
        performer: template,
        axis: "samples",
        value: samples,
        reason: "a standing take needs a positive whole phase count",
        fix: "give the same positive phase count as the other pose takes",
      });
    const segments: readonly IAutoMovieMotionHumanSegment[] =
      performance.segments(template);
    const segment: IAutoMovieMotionHumanSegment | undefined = segments.find(
      (s: IAutoMovieMotionHumanSegment): boolean =>
        s.entryTime <= from && from < s.end,
    );
    const settled: IAutoMovieMotionEvent | undefined =
      segment?.plan.events.find(
        (event: IAutoMovieMotionEvent): boolean => event.name === "settled",
      );
    const at: number =
      segment === undefined || settled === undefined
        ? Number.NaN
        : segment.start + settled.share * segment.plan.duration;
    // Display treats a successor at the settled instant as the active action,
    // within the same placement tolerance used by HumanSegmentPose.displayed.
    if (
      segment?.name !== "stand" ||
      !(segment.entryTime <= at && at <= segment.end) ||
      segments.some(
        (next: IAutoMovieMotionHumanSegment): boolean =>
          next.index > segment.index && next.entryTime <= at + 1e-12,
      ) ||
      segment.plan.contacts.some(
        (contact: IAutoMovieMotionHumanContactWindow): boolean =>
          contact.support.kind !== "ground",
      )
    )
      throw new HumanRefusal({
        kind: "participant",
        performer: template,
        axis: "standing",
        value: segment?.name ?? null,
        reason: `${template} has no settled stand on ground to hold at ${from.toFixed(3)} s`,
        fix: "select a stand whose settled pose is displayed on ground",
      });

    const pose: IAutoMoviePose = performance.pose(template, at);
    const floor: number = HumanSupportFrame.floor(
      segment.context.body,
      segment.context.entry,
    );
    const held: IAutoMoviePose =
      pose.root === null
        ? pose
        : {
            ...pose,
            root: {
              ...pose.root,
              translation: { x: 0, y: pose.root.translation.y - floor, z: 0 },
              rotation: Quaternion.multiply(
                HumanFrame.turn(-HumanFrame.heading(pose.root.rotation)),
                pose.root.rotation,
              ),
            },
          };
    return {
      gait: "stand",
      periodSeconds: segment.end - segment.entryTime,
      strideMeters: 0,
      poses: new Array<IAutoMoviePose>(samples).fill(held),
    };
  }
}
