import { AutoMovieEngineScheduleCut } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieIntent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanPerformanceAim,
  IAutoMovieMotionHumanPerformanceState,
} from "@automovie/interface";

import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { HumanPerformanceAim } from "./HumanPerformanceAim";

/*
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
  /*
   * The demands reader of an action, the one at `ordinal` in its performer's
   * chain.
   *
   * Each grip is asked of the action found for its prop with what is known
   * before that action is planned (`IHumanActionLaw.IAhead`): its resolved
   * parameters, the performer's body and skill, the props, and its aiming from
   * the posture the grip leaves the body in, read at the earlier action's
   * start. Candidate-dependent bones are resolved when the target needs them.
   * Parameter self: The performance being placed.
   * Parameter context: The earlier action's context.
   * Parameter ordinal: Its place among its performer's actions that carry the body.
   * Returns: The reader.
   */
  export function reader(
    self: IAutoMovieMotionHumanPerformanceState,
    context: Pick<IAutoMovieMotionHumanActionContext, ReaderContext>,
    ordinal: number,
  ): (
    grip: IAutoMovieMotionHumanActionLaw.IGrip,
  ) => readonly IAutoMovieMotionHumanActionLaw.IDemand[] {
    return (
      grip: IAutoMovieMotionHumanActionLaw.IGrip,
    ): readonly IAutoMovieMotionHumanActionLaw.IDemand[] => {
      const asked: INext | null = find(
        self,
        context.subject,
        ordinal,
        grip.prop,
      );
      if (asked === null || asked.law.demands === undefined) return [];

      const ownBones: IAutoMovieMotionHumanPerformanceAim.IFrame["bones"] =
        (requested?: ReadonlySet<AutoMovieHumanoidBone>): ReturnType<typeof poseBones> =>
          poseBones(
            context.body,
            resolveHumanPosture(context.body, grip.posture),
            undefined,
            requested,
          );
      return asked.law.demands({
        subject: context.subject,
        body: context.body,
        params: asked.params,
        skill: context.skill,
        prop: context.prop,
        aim: (
          target: Parameters<IAutoMovieMotionHumanActionContext["aim"]>[0],
          seconds: number,
        ): ReturnType<IAutoMovieMotionHumanActionContext["aim"]> =>
          HumanPerformanceAim.aim(
            self,
            target,
            seconds,
            HumanPerformanceAim.frame(
              context.body,
              grip.posture,
              ownBones,
              context.subject,
            ),
          ),
        start: context.start,
        grip,
      });
    };
  }

  /*
   * How an action is cut into its performer's next one
   * (`IHumanActionContext.cut`): the composition's cut at one of the action's
   * own events or shares, with what the next action in walk order plants
   * (`IHumanActionLaw.plants`), read from its resolved parameters.
   * Parameter self: The performance being placed.
   * Parameter intent: The action's intent.
   * Parameter ordinal: Its place among its performer's actions that carry the body.
   * Returns: The cut; undefined when the action is not cut at its own event or
   * share.
   */
  export function cut(
    self: IAutoMovieMotionHumanPerformanceState,
    intent: IAutoMovieIntent,
    ordinal: number,
  ): IAutoMovieMotionHumanActionContext.ICut | undefined {
    const until =
      intent.until === undefined
        ? undefined
        : AutoMovieEngineScheduleCut.normalize(intent.until);
    if (until === undefined || (until.type !== "share" && until.type !== "event"))
      return undefined;
    const next: IAutoMovieIntent | undefined = (self.intended.get(
      intent.subject,
    ) ?? [])[ordinal + 1];
    const law: ILookAheadLaw | undefined =
      next === undefined ? undefined : self.laws.get(next.capability);
    const given: ParametersValue = next?.parameters?.params ?? {};
    const plant: IAutoMovieMotionHumanActionLaw.IPlant | undefined =
      law?.plants?.(law.resolve?.(given) ?? given);
    return {
      ...(until.type === "event"
        ? { event: until.event }
        : { share: until.share }),
      ...(plant === undefined ? {} : { plant }),
    };
  }

  /*
   * An action asked for its demands: its law and its resolved parameters.
   */
  interface INext {
    /*
     * Its law.
     */
    law: ILookAheadLaw;

    /*
     * Its parameters, as its law resolves them.
     */
    params: ParametersValue;
  }

  /*
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
      const law: ILookAheadLaw | undefined =
        self.laws.get(intent.capability);
      // An action the vocabulary lacks is refused where it is placed.
      if (law === undefined) return null;
      const given: ParametersValue = intent.parameters?.params ?? {};
      const resolved: ParametersValue = law.resolve?.(given) ?? given;
      if (Object.values(resolved).includes(prop))
        return { law, params: resolved };
    }
    return null;
  }

}

/*
 * The alternatives of `ReaderContext`'s site.
 */
type ReaderContext = "subject" | "body" | "skill" | "prop" | "start";

/*
 * An authored parameter payload after defaulting a missing value.
 */
type ParametersValue = NonNullable<unknown>;

/*
 * The methods selected by an authored action's vocabulary key.
 */
interface ILookAheadLaw
  extends Pick<IAutoMovieMotionHumanActionLaw<ParametersValue>, "demands" | "plants"> {
  /*
   * Resolve the composition's payload according to the selected law.
   */
  resolve?(given: ParametersValue): object;
}
