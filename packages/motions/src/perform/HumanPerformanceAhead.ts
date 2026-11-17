import type {
  IAutoMovieIntent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanPerformanceAim,
  IAutoMovieMotionHumanPerformanceState,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanPerformanceAim } from "./HumanPerformanceAim";
import { HumanPerformanceParams } from "./HumanPerformanceParams";

/**
 * What a performer's next action on a prop demands of a grip an earlier
 * action of theirs is still choosing (`IHumanActionContext.demands`): the
 * goal poses that action will hold the prop in, asked of it before it is
 * planned (`IHumanActionLaw.demands`), so the grip is chosen for them
 * (goal postures planned first, Rosenbaum, Meulenbroek, Vaughan and Jansen
 * 2001).
 *
 * The action asked is the first of the performer's later ones, in the
 * composition's walk order, that names the prop: one of its parameters is
 * the prop's subject id. An action between them that names it not (a walk
 * with the prop in hand) leaves the grip as it is; the first one that names
 * it decides, and one that asks nothing (a free put down) ends the question.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which action is asked, from which posture and at which second.
 * @evidence contracts/development/design.md#principled-representation The composition's own order of a performer's actions and the parameters their laws resolve, read as data.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One reader, the context's `demands`, built by `HumanPerformancePlace`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No action or prop is named: the action asked is found by the prop's id among its parameters.
 */
export namespace HumanPerformanceAhead {
  /**
   * The demands reader of an action, the one at `ordinal` in its
   * performer's chain.
   *
   * Each grip is asked of the action found for its prop with what is known
   * before that action is planned (`IHumanActionLaw.IAhead`): its resolved
   * parameters, the performer's body and skill, the props, and its aiming
   * from the posture the grip leaves the body in, read at the earlier
   * action's start. An action whose parameters its schema refuses asks
   * nothing here; it is refused where it is placed.
   * The caller keeps the body and candidate posture unchanged during this
   * synchronous demand call; retained aiming callbacks may read later changes.
   *
   * @param self The performance being placed.
   * @param context The earlier action's context.
   * @param ordinal Its place among its performer's actions that carry the body.
   * @returns The reader.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each grip is asked with and the refused case.
   * @evidence contracts/development/implementation.md#principled-implementation The action asked reads its own resolved parameters, and aims from the posture the grip leaves, so a target placed by the performer's frame is placed where they will stand. Sharing successful FK requires the body and candidate posture to remain unchanged during the synchronous demand call; their types do not enforce that premise.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The action found once per prop, then asked per grip with a lazy aiming frame and lazy candidate bones.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only a `HumanRefusal` of the parameters is taken as asking nothing; any other error propagates.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the performer's later actions, once per prop; each demands query constructs at most one successful scalar aiming frame and shares one successful candidate resolve and FK when own bones are requested. Failed constructions are not memoized. Query-local closures add constant allocation even when no own-body target is read; speed improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each prop's action is kept for every grip of it; repeated aiming reads within one candidate query share the body's unchanged measures, candidate root and heading, and resolved bones. Target- and second-dependent aiming still runs on every call and its return ownership is unchanged.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The kept actions, one per prop asked, live as long as the context. A finally block releases candidate bones and the scalar frame on return or throw; an aim callback retained by a law reads both fresh after that invocation, so neither memo persists on the reader, grip or performance.
   */
  export function reader(
    self: IAutoMovieMotionHumanPerformanceState,
    context: Pick<
      IAutoMovieMotionHumanActionContext,
      "subject" | "body" | "skill" | "prop" | "start"
    >,
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
      const ownBones: IAutoMovieMotionHumanPerformanceAim.IFrame["bones"] = (): ReturnType<
        typeof poseBones
      > => (querying ? (bones ??= freshBones()) : freshBones());
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

  /** An action asked for its demands: its law and its resolved parameters. */
  interface INext {
    /** Its law. */
    law: IAutoMovieMotionHumanActionLaw<never>;

    /** Its parameters, as its law resolves them. */
    params: object;
  }

  /** The first of a performer's actions after `ordinal` that names a prop, or null. */
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
      try {
        HumanPerformanceParams.check(intent.capability, given, law);
      } catch (error) {
        if (error instanceof HumanRefusal) return null;
        throw error;
      }
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
