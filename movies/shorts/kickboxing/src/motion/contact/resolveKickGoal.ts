import type { preparePhysicalGeometry as Geometry } from "@automovie/engine";

import { BoutScript } from "../../shots/kickboxing/ring-bout/BoutScript";
import type { FighterBody } from "../fighter/FighterBody";
import type { FilmBodyRig as Rig } from "../rig/FilmBodyRig";
import { FilmVector as V } from "../rig/FilmVector";
import { Foot } from "../rig/Foot";
import { Strike } from "../striking/Strike";
import { filmKickGeometry } from "./filmKickGeometry";

/** Resolve the same shin/receiver declaration used by contact fitting. Provider FK supplies limb offsets; the existing screenplay phase supplies timing. No fixed leg length, world strike coordinate or selected successful angle is stored here. */
export function resolveKickGoal(
  source: resolveKickGoal.IContext,
  receiver: resolveKickGoal.IContext,
  leg: Extract<FighterBody.Leg, { kind: "kick" }>,
  queries?: Geometry.IQueries,
): Rig.Goal {
  const delivery: filmKickGeometry.IDelivery = filmKickGeometry(
    source,
    receiver,
    leg.action,
    queries,
  );
  const offset: V.Value = V.sub(delivery.chamber.knee, delivery.chamber.ankle);

  /** The scheduled ankle and this body's actual knee-to-ankle offset define each supported endpoint. */
  const standing: (placement: Foot.Placement) => Strike.Leg = (
    placement: Foot.Placement,
  ): Strike.Leg => {
    const ankle: V.Value = Foot.goals(placement, source.rig.footVector).ankle;
    return { ankle, knee: V.add(ankle, offset) };
  };
  const goals: Strike.Leg = Strike.kick(leg.action, source.frame.time, {
    chamber: delivery.chamber,
    impact: delivery.impact,
    ...(delivery.over ? { over: delivery.over } : {}),
    start: standing(leg.from),
    land: standing(leg.to),
  });
  return {
    point: goals.ankle,
    aim: {
      bone: "knee",
      point: goals.knee,
      // The turned-over knee is the question-mark kick's defining shape.
      weight:
        BoutScript.specs[leg.action.technique].shape === "question-mark"
          ? 1
          : BoutScript.specs[leg.action.technique].target === "head"
            ? 0.5
            : 0.85,
    },
  };
}

/** Borrowed scene frames retain the actual actor identity and provider geometry. */
export namespace resolveKickGoal {
  /** Current source and receiver snapshots, with optional un-evaded aiming geometry. */
  export type IContext = filmKickGeometry.IContext;
}
