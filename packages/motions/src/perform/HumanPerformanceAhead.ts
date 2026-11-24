import type {
  IAutoMovieIntent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanPerformanceAim,
  IAutoMovieMotionHumanPerformanceState,
} from "@automovie/interface";

import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanPerformanceAim } from "./HumanPerformanceAim";

/** The alternatives of `ReaderContext`'s site. */
type ReaderContext = "subject" | "body" | "skill" | "prop" | "start";

/**
 * What a performer's next action on a prop demands of a grip an earlier action
 * of theirs is still choosing (`IHumanActionContext.demands`): the goal poses
 * that action will hold the prop in, asked of it before it is planned
 * (`IHumanActionLaw.demands`), so the grip is chosen for them (goal postures
 * planned first, Rosenbaum, Meulenbroek, Vaughan and Jansen 2001).
 *
 * The action asked is the first of the performer's later ones, in the
 * composition's walk order, that names the prop: one of its parameters is the
 * prop's subject id. An action between them that names it not (a walk with the
 * prop in hand) leaves the grip as it is; the first one that names it decides,
 * and one that asks nothing (a free put down) ends the question.
 */
export namespace HumanPerformanceAhead {
  /**
   * The demands reader of an action, the one at `ordinal` in its performer's
   * chain.
   *
   * Each grip is asked of the action found for its prop with what is known
   * before that action is planned (`IHumanActionLaw.IAhead`): its resolved
   * parameters, the performer's body and skill, the props, and its aiming from
   * the posture the grip leaves the body in, read at the earlier action's
   * start. The caller keeps the body and candidate posture unchanged during
   * this synchronous demand call; retained aiming callbacks may read later
   * changes.
   *
   * @param self The performance being placed.
   * @param context The earlier action's context.
   * @param ordinal Its place among its performer's actions that carry the body.
   * @returns The reader.
   */
  export function reader(
    self: IAutoMovieMotionHumanPerformanceState,
    context: Pick<IAutoMovieMotionHumanActionContext, ReaderContext>,
    ordinal: number,
  ): (
    grip: IAutoMovieMotionHumanActionLaw.IGrip,
  ) => readonly IAutoMovieMotionHumanActionLaw.IDemand[] {
    const found: Map<string, INext | null> = new Map();
    const next: (prop: string) => INext | null = (
      prop: string,
    ): INext | null => {
      if (!found.has(prop))
        found.set(prop, find(self, context.subject, ordinal, prop));
      return found.get(prop)!;
    };
    return (
      grip: IAutoMovieMotionHumanActionLaw.IGrip,
    ): readonly IAutoMovieMotionHumanActionLaw.IDemand[] => {
      const asked: INext | null = next(grip.prop);
      if (asked === null || asked.law.demands === undefined) return [];

      // Every aim in this demand reads the same candidate posture. Resolve
      // its bones lazily here, so another grip question starts independently.
      let querying: boolean = true;
      let bones: ReturnType<typeof poseBones> | undefined;
      let frame: IAutoMovieMotionHumanPerformanceAim.IFrame | undefined;
      const freshBones: () => ReturnType<typeof poseBones> = (): ReturnType<
        typeof poseBones
      > =>
        poseBones(
          context.body,
          resolveHumanPosture(context.body, grip.posture),
        );
      const ownBones: IAutoMovieMotionHumanPerformanceAim.IFrame["bones"] =
        (): ReturnType<typeof poseBones> =>
          querying ? (bones ??= freshBones()) : freshBones();
      try {
        return asked.law.demands({
          subject: context.subject,
          body: context.body,
          params: asked.params as never,
          skill: context.skill,
          prop: context.prop,
          aim: (
            target: Parameters<IAutoMovieMotionHumanActionContext["aim"]>[0],
            seconds: number,
          ): ReturnType<IAutoMovieMotionHumanActionContext["aim"]> => {
            const current: IAutoMovieMotionHumanPerformanceAim.IFrame =
              querying && frame !== undefined
                ? frame
                : HumanPerformanceAim.frame(
                    context.body,
                    grip.posture,
                    ownBones,
                    context.subject,
                  );
            if (querying) frame = current;
            return HumanPerformanceAim.aim(self, target, seconds, current);
          },
          start: context.start,
          grip,
        });
      } finally {
        // A law may retain its existing aim callback. Outside this query
        // it must keep the original fresh-read behavior and retain no FK.
        querying = false;
        bones = undefined;
        frame = undefined;
      }
    };
  }

  /**
   * How an action is cut into its performer's next one
   * (`IHumanActionContext.cut`): the composition's cut at one of the action's
   * own events or shares, with what the next action in walk order plants
   * (`IHumanActionLaw.plants`), read from its resolved parameters.
   *
   * @param self The performance being placed.
   * @param intent The action's intent.
   * @param ordinal Its place among its performer's actions that carry the body.
   * @returns The cut; undefined when the action is not cut at its own event or
   *   share.
   */
  export function cut(
    self: IAutoMovieMotionHumanPerformanceState,
    intent: IAutoMovieIntent,
    ordinal: number,
  ): IAutoMovieMotionHumanActionContext.ICut | undefined {
    const until: IAutoMovieIntent["until"] = intent.until;
    if (until === undefined || "of" in until || "proximity" in until)
      return undefined;
    const next: IAutoMovieIntent | undefined = (self.intended.get(
      intent.subject,
    ) ?? [])[ordinal + 1];
    const law: IAutoMovieMotionHumanActionLaw<never> | undefined =
      next === undefined ? undefined : self.laws.get(next.capability);
    const given: object = next === undefined ? {} : params(next);
    const plant: IAutoMovieMotionHumanActionLaw.IPlant | undefined =
      law?.plants?.((law.resolve?.(given) ?? given) as never);
    return {
      ...("event" in until ? { event: until.event } : { share: until.share }),
      ...(plant === undefined ? {} : { plant }),
    };
  }

  /** An action asked for its demands: its law and its resolved parameters. */
  interface INext {
    /** Its law. */
    law: IAutoMovieMotionHumanActionLaw<never>;

    /** Its parameters, as its law resolves them. */
    params: object;
  }

  /**
   * The first of a performer's actions after `ordinal` that names a prop, or
   * null.
   */
  function find(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
    ordinal: number,
    prop: string,
  ): INext | null {
    for (const intent of (self.intended.get(subject) ?? []).slice(
      ordinal + 1,
    )) {
      const law: IAutoMovieMotionHumanActionLaw<never> | undefined =
        self.laws.get(intent.capability);
      // An action the vocabulary lacks is refused where it is placed.
      if (law === undefined) return null;
      const given: object = params(intent);
      const resolved: object = law.resolve?.(given) ?? given;
      if (Object.values(resolved).includes(prop))
        return { law, params: resolved };
    }
    return null;
  }

  /** The parameters an intent gives its action. */
  function params(intent: IAutoMovieIntent): object {
    return (intent.parameters?.params as object | undefined) ?? {};
  }
}
