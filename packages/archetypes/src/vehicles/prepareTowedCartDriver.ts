import { RigidCarrierSample, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionPlayback,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { Archetype } from "../core/Archetype";
import { ArchetypeFrame } from "../core/ArchetypeFrame";
import { ArchetypeRefusal } from "../core/ArchetypeRefusal";
import type { ArchetypeRide } from "../core/ArchetypeRide";
import type { createCart } from "./createCart";

/**
 * Bind a towed cart's driver to its actual placement, footboard, seat and
 * driving lines. The nominal hand stations project to the live final segments
 * between the horse's terrets and the cart's material ends. Each palm uses
 * the current line tangent, so steering does not pull the hand off the rein.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the exact cart and ride pair, world readers and current line projection.
 * @evidence contracts/development/implementation.md#principled-implementation The nearest point on the producer's current material segment is the clamped orthogonal projection from the nominal station. The segment tangent and projected up vector give the material frame.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One native tow read supplies a frame and named contacts. The special branch is only the two moving driving lines.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Each actual second reads the tow and every requested real endpoint. The complete renderer still emits its full original model and lines.
 * @evidence contracts/development/implementation.md#efficient-algorithms A paired read evaluates current tow sources once, then only the two endpoints for each demanded driving grip without drawing unrelated lines.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The standard prop adapter transfers the binding only for this exact cart and exact callback pair. Same-time queries share current transform closure, never another instant's answer.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The binding retains its tow for its own lifetime. A current geometry snapshot is held only by the synchronous query.
 */
export function prepareTowedCartDriver(
  cart: Archetype<createCart.Affordance, createCart.Dimension>,
  ride: ArchetypeRide.ITowedRide<createCart.Affordance, createCart.Dimension>,
): RigidCarrierSample.IBinding {
  const playback: IAutoMovieMotionPlayback<RigidCarrierSample.IRead> = {
    sample: (seconds: number): RigidCarrierSample.IRead => {
      const current: ArchetypeRide.ITowedSample<createCart.Affordance> =
        ride.geometry(seconds);
      const frame: IAutoMovieRigidTransform = {
        position: current.placement.translation,
        rotation: current.placement.rotation,
      };
      return {
        frame,
        point: (id: string): IAutoMovieTransform => {
          const nominal: IAutoMovieTransform = current.frame(
            id as createCart.Affordance,
          );
          if (id !== "leftLineGrip" && id !== "rightLineGrip") return nominal;
          const line: string =
            id === "leftLineGrip" ? "line-left" : "line-right";
          const segment: ReturnType<typeof current.tail> = current.tail(line);
          if (segment === undefined)
            throw new ArchetypeRefusal({
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
          return ArchetypeFrame.facing(
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
