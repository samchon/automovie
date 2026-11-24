import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanPropFrame } from "@automovie/motions/internal";

import { assertTakeClean } from "./assertTakeClean";

/**
 * Shared staging of the everyday prop takes (#3982, #3992, #3996, #4005,
 * #4013): one performer at the origin facing `+Z`, props placed by their
 * affordances, and the reads every spec of them makes, a prop's drift in its
 * holding hand, an affordance's world point and a refusal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staging and the shared reads.
 * @evidence contracts/development/testing.md#behavioral-verification Every read is taken from the displayed performance.
 * @evidence contracts/development/testing.md#independent-expectations The reads compute geometry; no expected value is derived from the law under test.
 * @evidence contracts/development/testing.md#distinguishing-cases The helpers serve the specs' own cases.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances.
 */
export namespace everydayTake {
  /**
   * A hand's breadth as a share of its length: a 2016 adult hand survey gives
   * P50 breadths of 86 and 80 mm against lengths of 188 and 177 mm for men and
   * women (https://pmc.ncbi.nlm.nih.gov/articles/PMC9225906/, read through a
   * search summary).
   */
  export const BREADTH: number = 0.45;

  /**
   * A placed prop, its world frame from a point and a heading or a rotation.
   *
   * @param subject The prop's subject.
   * @param model The archetype.
   * @param position Where its origin stands, world metres.
   * @param rotation Its attitude; upright facing `+Z` when absent.
   * @param fixed Whether it is fixed in the scene.
   * @returns The prop.
   */
  export function prop(
    subject: string,
    model: IAutoMovieMotionHumanObject.IModel,
    position: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 },
    fixed: boolean = false,
  ): IAutoMovieMotionHumanProp {
    const placement: IAutoMovieMotionHumanObject.Placement = fixed
      ? { position, rotation, fixed: true }
      : { position, rotation };
    return HumanObject.prop(subject, model, placement);
  }

  /**
   * One performer's take.
   *
   * @param seed The take's seed.
   * @param body The performer's body.
   * @param props The props.
   * @param chain The performer's chain, subject `actor`.
   * @param laws The registered laws it uses.
   * @param others More performers and their chains, if any.
   * @returns The placed take.
   */
  export function perform(
    seed: string,
    body: IAutoMovieMotionHumanBody,
    props: readonly IAutoMovieMotionHumanProp[],
    chain: IAutoMovieMotionHumanChain,
    laws: IAutoMovieMotionHumanPerformance.IInput["laws"] = [],
    others: readonly IOther[] = [],
  ): HumanPerformance {
    let composition: IAutoMovieMotionHumanChain = chain;
    for (const other of others) composition = composition.with(other.chain);
    return new HumanPerformance({
      seed,
      performers: [
        {
          subject: "actor",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        ...others.map(
          (other: IOther): IPerformer => ({
            subject: other.subject,
            body: other.body,
            at: other.at,
            yaw: other.yaw,
            proficiency: { level: "trained" },
          }),
        ),
      ],
      laws,
      props: [...props],
      composition: composition.node,
    });
  }

  /**
   * The largest drift of a prop in its holding hand's frame over a span.
   *
   * @param take The take.
   * @param side The holding hand.
   * @param subject The prop.
   * @param from First film second.
   * @param to Last film second.
   * @param performer The holder; `actor` when absent.
   * @returns Metres.
   */
  export function drift(
    take: HumanPerformance,
    side: AutoMovieHumanSide,
    subject: string,
    from: number,
    to: number,
    performer: string = "actor",
  ): number {
    const read: (t: number) => IAutoMovieRigidTransform = (
      t: number,
    ): IAutoMovieRigidTransform => {
      const hand: IAutoMovieResolvedBone = take
        .bones(performer, t)
        .get(`${side}Hand`)!;
      return HumanPropFrame.relative(
        HumanPropFrame.bone(hand),
        take.prop(subject, t),
      );
    };
    const rest: IAutoMovieRigidTransform = read(from);
    let most: number = 0;
    for (let i: number = 1; i <= 24; ++i) {
      const t: number = from + ((to - from) * i) / 24;
      most = Math.max(most, Vector3.distance(read(t).position, rest.position));
    }
    return most;
  }

  /**
   * An affordance's world point on a prop at a second.
   *
   * @param take The take.
   * @param model The prop's archetype, posed at the take's articulation state.
   * @param subject The prop.
   * @param id The affordance.
   * @param t Film seconds.
   * @returns World metres.
   */
  export function point(
    take: HumanPerformance,
    model: IPosable,
    subject: string,
    id: string,
    t: number,
  ): IAutoMovieVector3 {
    // The contact where the prop's articulations put it at that second: a
    // contact that rides none stays at its declared place.
    const rest: IAutoMovieAffordance = (model.affordances ?? []).find(
      (a: IAutoMovieAffordance): boolean => a.id === id,
    )!;
    const site: IAutoMovieAffordance =
      rest.rides === undefined || model.articulate === undefined
        ? rest
        : posedSite(model, take.state(subject, t), id);
    const frame: IAutoMovieRigidTransform = take.prop(subject, t);
    return Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, site.frame.translation),
    );
  }

  /**
   * A contact of a model posed at an articulation state.
   *
   * @param model The model.
   * @param state The articulation state.
   * @param id The contact.
   * @returns The posed contact.
   */
  function posedSite(
    model: IPosable,
    state: Record<string, number>,
    id: string,
  ): IAutoMovieAffordance {
    const posed: IAutoMovieMotionHumanObject.IModel = model.articulate!(state);
    return (posed.affordances ?? []).find(
      (a: IAutoMovieAffordance): boolean => a.id === id,
    )!;
  }

  /**
   * The refusal a build throws, if any.
   *
   * @param build The build.
   * @returns The refusal, or undefined when it built.
   */
  export function refusal(build: () => unknown): HumanRefusal | undefined {
    try {
      build();
    } catch (error: unknown) {
      if (error instanceof HumanRefusal) return error;
      throw error;
    }
    return undefined;
  }

  /**
   * Assert the take passes the shipped verdicts; a failure names every
   * performer's actions with their spans and events, so a fault's time reads
   * against the phase it falls in.
   *
   * @param label What the take is.
   * @param take The placed take.
   */
  export function clean(label: string, take: HumanPerformance): void {
    try {
      assertTakeClean(label, take);
    } catch (error: unknown) {
      const phases: string = take.performers
        .flatMap((performer: IAutoMovieMotionHumanPerformer): string[] =>
          take
            .segments(performer.subject)
            .map(
              (s: IAutoMovieMotionHumanSegment): string =>
                `${performer.subject}.${s.law.name} ${s.start.toFixed(2)}-${s.end.toFixed(2)}` +
                (s.plan.events ?? [])
                  .map(
                    (e: IAutoMovieMotionEvent): string =>
                      ` ${e.name}@${(s.start + e.share * s.plan.duration).toFixed(2)}`,
                  )
                  .join(""),
            ),
        )
        .join("; ");
      throw new Error(`${String(error)} [phases: ${phases}]`);
    }
  }

  /**
   * A failure's text for a check: a refusal's message, or any other error's
   * message with the top of its stack, where the fault lies.
   *
   * @param error The thrown value.
   * @returns The text.
   */
  export function describe(error: unknown): string {
    if (error instanceof HumanRefusal || !(error instanceof Error))
      return String(error);
    return [String(error), ...(error.stack ?? "").split("\n").slice(1, 9)].join(
      " | ",
    );
  }

  /** A prop model, posable at an articulation state when it articulates. */
  export interface IPosable extends IAutoMovieMotionHumanObject.IModel {
    /** The model at a state of its articulations. */
    articulate?(
      state: Record<string, number>,
    ): IAutoMovieMotionHumanObject.IModel;
  }

  /** A performer of the take, as the performance takes it. */
  export type IPerformer =
    IAutoMovieMotionHumanPerformance.IInput["performers"][number];

  /** Another performer. */
  export interface IOther {
    /** Its subject. */
    subject: string;

    /** Its body. */
    body: IAutoMovieMotionHumanBody;

    /** Where it stands. */
    at: IAutoMovieVector3;

    /** Its heading, degrees. */
    yaw: number;

    /** Its chain. */
    chain: IAutoMovieMotionHumanChain;
  }
}
