import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanStepVault,
  IAutoMovieMotionHumanSupport,
} from "@automovie/interface";

/*
 * Compose the supports for a grounded step vault through `HumanChain.support`.
 * The palm plants first. The opposite foot joins it on the obstacle, the other
 * foot passes between them, and the supporting foot follows to settle on the
 * exit before the hand lets go. London Parkour teaches the same crossing as a
 * ground step vault before introducing a raised obstacle. The base support
 * planner fits the contacts and supplies the ordinary swing over each step.
 * This draft is for a ground drill or low staging within that swing's available
 * clearance. Obstacle collision is outside this fit.
 * Parameter route: The side and the authored locations of the six foot and hand
 * contacts.
 * Returns: Four stances for the canonical support action.
 * ://londonparkour.com/tutorials/ground-step-vaults/
 * ://londonparkour.com/tutorials/step-vault-02/
 * @see https://londonparkour.com/tutorials/ground-step-vaults/
 * @see https://londonparkour.com/tutorials/step-vault-02/
 */
export function stepVaultSupport(
  route: IAutoMovieMotionHumanStepVault,
): IAutoMovieMotionHumanSupport.IParams {
  const through: AutoMovieHumanSide = route.hand;
  const step: AutoMovieHumanSide = through === "left" ? "right" : "left";
  /*
   * Build a bearing foot contact at the authored point.
   */
  const foot = (
    side: AutoMovieHumanSide,
    target: IAutoMovieMotionHumanStepVault.Target,
  ): IAutoMovieMotionHumanSupport.IContact => ({
    part: `${side}Foot`,
    kind: "bear",
    target,
  });
  const palm: IAutoMovieMotionHumanSupport.IContact = {
    part: `${through}Hand`,
    kind: "bear",
    target: route.palm,
  };
  const takeoff: IAutoMovieMotionHumanSupport.IContact = foot(
    through,
    route.entry[through],
  );
  const ledge: IAutoMovieMotionHumanSupport.IContact = foot(step, route.step);
  const landing: IAutoMovieMotionHumanSupport.IContact = foot(
    through,
    route.exit[through],
  );

  return {
    stances: [
      {
        contacts: [takeoff, foot(step, route.entry[step]), palm],
        event: "palmBearing",
      },
      { contacts: [takeoff, palm, ledge], event: "stepBearing" },
      { contacts: [landing, palm, ledge], event: "throughLanded" },
      {
        contacts: [landing, foot(step, route.exit[step])],
        event: "vaultStood",
      },
    ],
  };
}
