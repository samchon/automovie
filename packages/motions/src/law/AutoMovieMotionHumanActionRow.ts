import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
} from "@automovie/interface";

/** Derive named authoring rows from existing action laws. */
export namespace AutoMovieMotionHumanActionRow {
  /**
   * Name a row of an action.
   *
   * @param name The row's name, as the composition will call it.
   * @param law The action it is a row of.
   * @param fixed The parameters the row fixes; the composition gives the rest.
   * @returns The row's law, to register with a performance and a chain.
   */
  export function of<P extends object, Fixed extends keyof P>(
    name: string,
    law: IAutoMovieMotionHumanActionLaw<P>,
    fixed: Pick<P, Fixed>,
  ): IAutoMovieMotionHumanActionLaw<Omit<P, Fixed>> {
    const resolve = (given: object): object => {
      const merged: object = { ...given, ...fixed };
      return law.resolve?.(merged) ?? merged;
    };
    return {
      name,
      family: law.family ?? law.name,
      resolve,
      interrupts: law.interrupts,
      ...(law.accepts === undefined ? {} : { accepts: law.accepts }),
      ...(law.yields === undefined ? {} : { yields: law.yields }),
      ...(law.overlay === undefined ? {} : { overlay: law.overlay }),
      ...(law.physical === undefined ? {} : { physical: law.physical }),
      ...(law.balance === undefined ? {} : { balance: law.balance }),
      plan: (
        context: IAutoMovieMotionHumanActionContext<Omit<P, Fixed>>,
      ): IAutoMovieMotionHumanActionPlan =>
        law.plan(context as unknown as IAutoMovieMotionHumanActionContext<P>),
      // The owner's demands, read from the resolved parameters as its plan
      // reads them.
      ...(law.demands === undefined
        ? {}
        : {
            demands: (
              ahead: IAutoMovieMotionHumanActionLaw.IAhead<Omit<P, Fixed>>,
            ): readonly IAutoMovieMotionHumanActionLaw.IDemand[] =>
              law.demands!(
                ahead as unknown as IAutoMovieMotionHumanActionLaw.IAhead<P>,
              ),
          }),
      // The owner's plant, read from the resolved parameters as its plan
      // reads them.
      ...(law.plants === undefined
        ? {}
        : {
            plants: (
              params: Omit<P, Fixed>,
            ): IAutoMovieMotionHumanActionLaw.IPlant | undefined =>
              law.plants!(params as unknown as P),
          }),
    };
  }
}
