import { Vector3, AutoMovieEngineMotionHydrodynamics } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSwimImmersed,
  IAutoMovieMotionHumanWater,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../../law/HumanBound";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanWater } from "../../perform/HumanWater";
import { HumanFrame } from "../../posture/HumanFrame";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { SwimStroke } from "../SwimStroke";
import { swimImmersedCoast } from "./swimImmersedCoast";

/**
 * Register this immersed action with `HumanChain.extend` and
 * `HumanPerformance`'s `laws`. The passive case holds the existing supine key.
 * The opt-in breaststroke uses the existing prone keys and starts at rest. Both
 * start in the water at their first shape's buoyant trim.
 *
 * Nakashima, Satou and Miura (2007), section 2, uses posed segments for
 * buoyancy and drag. Here the shape is held and the water is still, so the
 * engine's quasi-steady segment model reduces to a constant quadratic drag
 * coefficient over the span. Integrating `dv/dt = -k v²` gives `distance =
 * log(1 + k v0 t) / k`. The breaststroke instead integrates the heading
 * component of drag at every moving segment. Its trim and heading are
 * prescribed. The sphere approximation gives quasi-steady isotropic drag and
 * omits added mass, free heave, rotation and water entry.
 *
 * @see https://doi.org/10.1299/jfst.2.56
 */
export const swimImmersed: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSwimImmersed> =
  {
    name: "swimImmersed",
    interrupts: {},
    plan: planSwimImmersed,
  };

/**
 * Register this immersed action with `HumanChain.extend` and
 * `HumanPerformance`'s `laws`. The passive case holds the existing supine key.
 * The opt-in breaststroke uses the existing prone keys and starts at rest. Both
 * start in the water at their first shape's buoyant trim.
 *
 * Nakashima, Satou and Miura (2007), section 2, uses posed segments for
 * buoyancy and drag. Here the shape is held and the water is still, so the
 * engine's quasi-steady segment model reduces to a constant quadratic drag
 * coefficient over the span. Integrating `dv/dt = -k v²` gives `distance =
 * log(1 + k v0 t) / k`. The breaststroke instead integrates the heading
 * component of drag at every moving segment. Its trim and heading are
 * prescribed. The sphere approximation gives quasi-steady isotropic drag and
 * omits added mass, free heave, rotation and water entry.
 *
 * @see https://doi.org/10.1299/jfst.2.56
 */
function planSwimImmersed(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSwimImmersed>,
): IAutoMovieMotionHumanActionPlan {
  const body: IAutoMovieMotionHumanBody = context.body;
  const params: IAutoMovieMotionHumanSwimImmersed = context.params;
  const duration: number = HumanBound.above(
    "duration",
    params.duration,
    0,
    "s",
  );
  const speed: number = HumanBound.least("speed", params.speed ?? 0, 0, "m/s");
  const water: IAutoMovieMotionHumanWater = params.water;
  const density: number = HumanBound.above(
    "water.density",
    water.density ?? AutoMovieEngineMotionHydrodynamics.WATER,
    0,
    "kg/m³",
  );

  const stroke: "breaststroke" | undefined = params.stroke;
  if (stroke !== undefined && speed !== 0)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "speed",
      value: speed,
      reason: "the immersed stroke starts from rest",
      fix: "omit speed or set it to zero",
    });

  const keys: IAutoMovieMotionHumanActionPlan = SwimStroke.plan({
    body,
    entry: context.entry.posture,
    stroke: stroke ?? "float",
    water: water.surface,
    cycles: 1,
    stationary: true,
    tempo: 1,
  });
  const shape: IAutoMovieMotionHumanPosture = keys.posture(0);
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(body, resolveHumanPosture(body, shape));
  const lift: number | null = HumanWater.float(body, bones, water);
  if (lift === null)
    throw new HumanRefusal({
      kind: "base",
      axis: "water.density",
      value: density,
      reason: `the fully submerged profile cannot displace its ${body.profile.mass} kg at this density`,
      fix: "use a buoyant profile or a medium that can support it",
    });

  const direction: IAutoMovieVector3 = Vector3.scale(
    HumanFrame.forward(shape.yaw),
    stroke === undefined ? -1 : 1,
  );
  // The same relative depths can be evaluated on the original bones by
  // shifting the plane down instead of moving every bone up.
  const waterAtShape: IAutoMovieMotionHumanWater = {
    surface: water.surface - lift,
    density,
  };
  if (stroke !== undefined) {
    const trajectory: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
      HumanWater.stroke(
        body,
        (
          phase: number,
        ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
          phase === 0
            ? bones
            : poseBones(
                body,
                resolveHumanPosture(body, keys.posture(phase * keys.duration)),
              ),
        direction,
        waterAtShape,
      );
    return {
      duration,
      events: keys.events,
      contacts: keys.contacts,
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const phase: number = Math.max(0, Math.min(1, seconds / duration));
        const key: IAutoMovieMotionHumanPosture = keys.posture(
          phase * keys.duration,
        );
        return {
          ...key,
          root: Vector3.add(
            { ...key.root, y: key.root.y + lift },
            Vector3.scale(direction, trajectory.at(phase).x[0]!),
          ),
        };
      },
    };
  }
  const k: number =
    speed === 0
      ? 0
      : -Vector3.dot(
          HumanWater.sum(body, bones, direction, waterAtShape).drag,
          direction,
        ) / body.profile.mass;
  const afloat: IAutoMovieVector3 = {
    ...shape.root,
    y: shape.root.y + lift,
  };
  // Integrate the scalar coast from its prescribed initial speed.
  const distanceAt: (seconds: number) => number = swimImmersedCoast(
    k,
    speed,
    duration,
  );
  return {
    duration,
    events: [{ name: "afloat", share: 0 }],
    contacts: [],
    posture: (seconds: number): IAutoMovieMotionHumanPosture => ({
      ...shape,
      root: Vector3.add(afloat, Vector3.scale(direction, distanceAt(seconds))),
    }),
  };
}
