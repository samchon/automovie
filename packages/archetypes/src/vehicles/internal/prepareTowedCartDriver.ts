import { RigidCarrierSample, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionPlayback,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieArchetype } from "../../core/AutoMovieArchetype";
import { AutoMovieArchetypeFrame } from "../../core/AutoMovieArchetypeFrame";
import { AutoMovieArchetypeRefusal } from "../../core/AutoMovieArchetypeRefusal";
import type { AutoMovieArchetypeRide } from "../../core/AutoMovieArchetypeRide";
import { AutoMovieArchetypeCart } from "../AutoMovieArchetypeCart";

/**
 * Bind a towed cart's driver to its placement, footboard, seat and driving
 * lines. The nominal hand stations project to the live final segments between
 * the horse's terrets and the cart's material ends. Each palm uses the current
 * line tangent, so steering does not pull the hand off the rein.
 */
export function prepareTowedCartDriver(
  cart: AutoMovieArchetype<AutoMovieArchetypeCart.Affordance, AutoMovieArchetypeCart.Dimension>,
  ride: AutoMovieArchetypeRide.ITowedRide<
    AutoMovieArchetypeCart.Affordance,
    AutoMovieArchetypeCart.Dimension
  >,
): RigidCarrierSample.IBinding {
  const playback: IAutoMovieMotionPlayback<RigidCarrierSample.IRead> = {
    sample: (seconds: number): RigidCarrierSample.IRead => {
      const current: AutoMovieArchetypeRide.ITowedSample<AutoMovieArchetypeCart.Affordance> =
        ride.geometry(seconds);
      const frame: IAutoMovieRigidTransform = {
        position: current.placement.translation,
        rotation: current.placement.rotation,
      };
      return {
        frame,
        point: (id: string): IAutoMovieTransform => {
          const affordance: AutoMovieArchetypeCart.Affordance | undefined =
            AutoMovieArchetypeCart.AFFORDANCES.find(
              (known: AutoMovieArchetypeCart.Affordance): boolean => known === id,
            );
          if (affordance === undefined)
            throw new RangeError(`A cart has no affordance "${id}".`);
          const nominal: IAutoMovieTransform = current.frame(affordance);
          if (id !== "leftLineGrip" && id !== "rightLineGrip") return nominal;
          const line: string =
            id === "leftLineGrip" ? "line-left" : "line-right";
          const segment: ReturnType<typeof current.tail> = current.tail(line);
          if (segment === undefined)
            throw new AutoMovieArchetypeRefusal({
              kind: "parameter",
              archetype: cart.archetype,
              axis: "lines",
              value: line,
              feasible: null,
              reason: "the towed cart does not lay its driving line",
              fix: "supply the cart's lines when authoring the tow",
            });
          const [to, from] = segment;
          const span: IAutoMovieVector3 = Vector3.subtract(to, from);
          const along: IAutoMovieVector3 = Vector3.normalize(span);
          const share: number = Math.min(
            1,
            Math.max(
              0,
              Vector3.dot(Vector3.subtract(nominal.translation, from), span) /
                Vector3.dot(span, span),
            ),
          );
          return AutoMovieArchetypeFrame.facing(
            Vector3.lerp(from, to, share),
            Vector3.addScaled({ x: 0, y: 1, z: 0 }, along, -along.y),
            along,
          );
        },
      };
    },
  };
  return RigidCarrierSample.bind(
    cart,
    (seconds: number): IAutoMovieRigidTransform =>
      playback.sample(seconds).frame,
    (id: string, seconds: number): IAutoMovieTransform =>
      playback.sample(seconds).point(id),
    [],
    playback,
  );
}
