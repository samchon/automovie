import { Vector3, resolveHydrodynamicForce } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
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

import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanWater } from "../perform/HumanWater";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { SwimStroke } from "./SwimStroke";

/**
 * Register a passive immersed action with `HumanChain.extend` and
 * `HumanPerformance`'s `laws`. The existing supine swim key supplies the
 * body shape. Archimedes' balance chooses its height and the existing
 * segment drag chooses its travel. The action starts already in the water
 * and holds its orientation. Strokes, water entry and free roll need other
 * plans.
 *
 * Nakashima, Satou and Miura (2007), section 2, uses posed segments for
 * buoyancy and drag. Here the shape is held and the water is still, so the
 * engine's quasi-steady segment model reduces to a constant quadratic drag
 * coefficient over the span. Integrating `dv/dt = -k v²` gives
 * `distance = log(1 + k v0 t) / k`.
 *
 * @see https://doi.org/10.1299/jfst.2.56
 * @evidence contracts/development/common.md#meaningful-documentation States the registration route, held posture, initial condition, force model, closed form and scope.
 * @evidence contracts/development/design.md#principled-representation Speed zero and positive speed describe the same immersed shape under Archimedes' balance and a signed drag opposite its travel.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only this registered water action reads the new parameter contract. The staged stroke laws retain their own timing and joint motion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the existing stroke key, posture resolution and force owner. A body without enough displacement is refused.
 */
export const swimImmersed: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSwimImmersed> =
  {
    name: "swimImmersed",
    interrupts: {},
    plan: (
      context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSwimImmersed>,
    ): IAutoMovieMotionHumanActionPlan => {
      const body: IAutoMovieMotionHumanBody = context.body;
      const params: IAutoMovieMotionHumanSwimImmersed = context.params;
      const duration: number = HumanBound.above(
        "seconds",
        params.seconds,
        0,
        "s",
      );
      const speed: number = HumanBound.least(
        "speed",
        params.speed ?? 0,
        0,
        "m/s",
      );
      const water: IAutoMovieMotionHumanWater = params.water;
      if (!Number.isFinite(water?.surface))
        throw new HumanRefusal({
          kind: "parameter",
          axis: "water.surface",
          value: water?.surface,
          reason: "the surface must give a finite world height",
          fix: "set water.surface in metres",
        });
      const density: number = HumanBound.above(
        "water.density",
        water.density ?? resolveHydrodynamicForce.WATER,
        0,
        "kg/m³",
      );

      // Only the existing float key's shape is authored. Its later height
      // is determined from the displacement of that shape.
      const shape: IAutoMovieMotionHumanPosture = SwimStroke.plan({
        body,
        entry: context.entry.posture,
        stroke: "float",
        water: water.surface,
        cycles: 1,
        tempo: 1,
      }).posture(0);
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
        -1,
      );
      // The same relative depths can be evaluated on the original bones by
      // shifting the plane down instead of moving every bone up.
      const waterAtShape: IAutoMovieMotionHumanWater = {
        surface: water.surface - lift,
        density,
      };
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
      /** Integrate the scalar coast from its prescribed initial speed. */
      const distanceAt = (seconds: number): number => {
        const t: number = Math.max(0, Math.min(duration, seconds));
        return k === 0 ? speed * t : Math.log1p(k * speed * t) / k;
      };
      if (!Number.isFinite(distanceAt(duration)))
        throw new HumanRefusal({
          kind: "parameter",
          axis: "speed",
          value: speed,
          reason: "the coast has no finite endpoint at this speed and duration",
          fix: "reduce the speed or the duration",
        });
      return {
        duration,
        events: [{ name: "afloat", share: 0 }],
        contacts: [],
        posture: (seconds: number): IAutoMovieMotionHumanPosture => ({
          ...shape,
          root: Vector3.add(
            afloat,
            Vector3.scale(direction, distanceAt(seconds)),
          ),
        }),
      };
    },
  };
