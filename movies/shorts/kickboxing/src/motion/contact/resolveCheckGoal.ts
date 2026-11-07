import { AutoMovieEnvelope as Ease } from "@automovie/engine";

import type { FighterBody } from "../fighter/FighterBody";
import type { FilmBodyRig as Rig } from "../rig/FilmBodyRig";
import { FilmVector as V } from "../rig/FilmVector";
import { Foot } from "../rig/Foot";

/** Retained authored low-kick check: lift the scheduled ankle while presenting the checking knee. Collider-relative binding independently owns achieved shin contact. */
export function resolveCheckGoal(
  context: { rig: Rig; trunk: Rig.Trunk; forward: V.Value; left: V.Value },
  side: Rig.Side,
  leg: Extract<FighterBody.Leg, { kind: "check" }>,
): Rig.Goal {
  const from: Foot.Goals = Foot.goals(leg.from, context.rig.footVector);
  const to: Foot.Goals = Foot.goals(leg.to, context.rig.footVector);
  const amount: number = leg.amount;
  // The checking knee turns out toward its own side.
  const outward: V.Value = V.scale(context.left, side === "left" ? 1 : -1);
  const ground: V.Value = V.lerp(
    from.ankle,
    to.ankle,
    Ease.smoother(leg.progress),
  );
  const ankle: V.Value = V.add(
    ground,
    V.add(
      V.add([0, 0.3 * amount, 0], V.scale(context.forward, 0.06 * amount)),
      V.scale(outward, 0.04 * amount),
    ),
  );
  const knee: V.Value = V.add(
    context.trunk.hipJoints[side],
    V.add(
      V.add(V.scale(context.forward, 0.34), [0, -0.2, 0]),
      V.scale(outward, 0.1),
    ),
  );
  return {
    point: ankle,
    aim: { bone: "knee", point: knee, weight: 0.7 * amount },
  };
}
