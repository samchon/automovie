import type {
  IAutoMovieMotionHumanCoupled,
  IAutoMovieMotionHumanMutual,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPerformer,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanCarryPerson,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";

/**
 * The instant a throw's thrower has closed its grips: the `ready` of its
 * clinch, the thrower's own act of the throw, over the thrown body
 * standing. A pull acts through the grips, so a scene's pull begins here:
 * the grip (kumikata) comes before the unbalancing, the fitting-in and the
 * execution (kuzushi, tsukuri, kake; Kano, Kodokan Judo, Kodansha 1986).
 *
 * The thrower's clinch reads the thrown body where it stands at its start,
 * so the instant is the one the same thrower takes in the full throw.
 *
 * @param seed The performance's seed, the full throw's.
 * @param performers The thrower `a` and the thrown `b`, placed.
 * @param kind The throw.
 * @param outcome The thrown body's outcome.
 * @param start When both stop standing and the throw begins, seconds.
 * @param seconds How long the thrown body stands on past `start` while the thrower grips.
 * @returns Film seconds.
 */
export function motionThrowGrip(
  seed: string,
  performers: readonly IAutoMovieMotionHumanPerformer[],
  kind: IAutoMovieMotionHumanCoupled.Throw,
  outcome: "thrown" | "resist" | "yield",
  start: number,
  seconds: number,
): number {
  const act: IAutoMovieMotionHumanMutual.IAct =
    AutoMovieMotionHumanCarryPerson.HumanCoupled.throwing.act(
    "thrower",
    { kind, outcome },
    { thrower: "a", thrown: "b" },
  );
  const film: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed,
    performers: [...performers],
    composition: HumanChain.subject("b")
      .stand({ hold: start + seconds })
      .with(
        HumanChain.subject("a")
          .stand({ hold: start })
          .registered(act.name, act.params),
      ).node,
  });
  const clinch = film
    .segments("a")
    .find((s) => s.plan.events.some((e) => e.name === "ready"));
  const ready = clinch?.plan.events.find((e) => e.name === "ready");
  if (clinch === undefined || ready === undefined)
    throw new Error("the thrower's clinch has no ready event");
  return clinch.start + ready.share * clinch.plan.duration;
}
