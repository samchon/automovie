import { Vector3, physicalHullFaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { HumanTrunk } from "./HumanTrunk";
import { gestureSignal } from "./gestureSignal";
import type { gestureStroke } from "./gestureStroke";

/**
 * The hand goals of a gesture that need the posed trunk: pointing along the
 * eye's line and touching the body's own face.
 *
 * - `point`: the index fingertip on the line from the eye on the pointing
 *   side to the target, as people point (Henriques and Crawford 2002, J
 *   Neurophysiol 87:1677, found the fingertip placed on the line from the
 *   dominant eye; the side's eye is the provisional choice), at the distance
 *   where the arm reaches with `0.95` of its length, the fingers along the
 *   line and the palm down.
 * - `touchFace`: the index fingertip, hand flat, on a face region with the
 *   palm toward the face and the fingers up, held; `pushGlasses` slides it
 *   12 mm up the nose bridge; `scratchHead` rubs it 15 mm on the head's side
 *   four times a second (provisional).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both goals, the pointing source and the provisional values.
 * @evidence contracts/development/design.md#principled-representation Effector goals as a named hand surface, a world point in metres and a world rotation, read from the trunk's own forward kinematics.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two goals the gesture's hand stroke dispatches to.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the stroke's input and goal types and the body's surface regions; contact points do not scale with the extent.
 */
export namespace gestureTouch {
  /**
   * The pointing goal: the fingertip on the eye-to-target line at the arm's
   * reach.
   *
   * @param input The instant's inputs.
   * @param side The hand.
   * @returns The goal.
   * @throws {Error} Without a target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the goal and the refusal; the namespace states the source.
   * @evidence contracts/development/implementation.md#principled-implementation The reach is solved as a ray-sphere intersection from the shoulder along the eye's line, never past the target itself.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The line, the reach, the distance on the line, then the hand's turn.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The palm turns back or forward for a line near the vertical, where palm down has no meaning; the `0.95` reach share is a documented provisional value.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trunk forward-kinematics pass and constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure function of the instant's input, whose base posture changes each instant.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new goal and retains nothing.
   */
  export function point(
    input: gestureStroke.IInput,
    side: HumanHand.Side,
  ): gestureStroke.IHand {
    const { body } = input;
    if (input.target === undefined) throw new Error("Pointing needs a target");
    const bones = HumanTrunk.resolve(body, input.base);
    const eye: IAutoMovieVector3 = bones.get(`${side}Eye`)!.worldPosition;
    const shoulder: IAutoMovieVector3 = bones.get(
      `${side}UpperArm`,
    )!.worldPosition;
    const line: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(input.target, eye),
    );
    const tip: number = Vector3.length(
      HumanHand.offset(body, side, "indexTip", "point").point,
    );
    const reach: number =
      0.95 * (body.measure.upperArm + body.measure.forearm) + tip;

    // The point on the line at the reach from the shoulder: |eye + s d - shoulder| = reach.
    const w: IAutoMovieVector3 = Vector3.subtract(eye, shoulder);
    const b: number = Vector3.dot(w, line);
    const c: number = Vector3.dot(w, w) - reach * reach;
    const s: number = -b + Math.sqrt(Math.max(0, b * b - c));
    const distance: number = Math.min(
      s,
      Vector3.length(Vector3.subtract(input.target, eye)),
    );
    const palm: IAutoMovieVector3 =
      Math.abs(line.y) > 0.9
        ? HumanFrame.point(
            { origin: { x: 0, y: 0, z: 0 }, yaw: input.base.yaw },
            { x: 0, y: 0, z: -Math.sign(line.y) },
          )
        : { x: 0, y: -1, z: 0 };
    return {
      surface: "indexTip",
      shape: "point",
      point: Vector3.add(eye, Vector3.scale(line, distance)),
      rotation: HumanHand.rotation(side, { fingers: line, palm }),
      out: 0,
    };
  }

  /**
   * A self-touch goal: the fingertip on a face region, palm toward the face,
   * fingers up.
   *
   * @param kind The self-touch gesture.
   * @param input The instant's inputs.
   * @param side The hand.
   * @param u Stroke share in [0, 1].
   * @param cycles Stroke cycles.
   * @returns The goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the goal; the namespace gives each gesture's slide.
   * @evidence contracts/development/implementation.md#principled-implementation The fingertip's axis stands off the region's surface point by the finger's collider radius along the surface normal, and slides along the surface's upward tangent.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The region, its upward tangent, the slide, then the goal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The slide sizes are documented provisional values; no body is special-cased.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trunk forward-kinematics pass and a scan of one segment's shapes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure function of the instant's input, whose base posture changes each instant.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new goal and retains nothing.
   */
  export function touch(
    kind: "touchFace" | "pushGlasses" | "scratchHead",
    input: gestureStroke.IInput,
    side: HumanHand.Side,
    u: number,
    cycles: number,
  ): gestureStroke.IHand {
    const { body } = input;
    const region: AutoMovieHumanoidRegion =
      kind === "pushGlasses"
        ? "noseBridge"
        : kind === "scratchHead"
          ? side === "left"
            ? "templeLeft"
            : "templeRight"
          : input.region;
    const surface = HumanTrunk.region(body, input.base, region);
    const up: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(
        { x: 0, y: 1, z: 0 },
        Vector3.scale(surface.normal, surface.normal.y),
      ),
    );
    const slide: number =
      kind === "pushGlasses"
        ? 0.012 * gestureSignal.rise(u)
        : kind === "scratchHead"
          ? 0.015 * gestureSignal.oscillation(u, cycles)
          : 0;
    const pad: number = padding(body, side);
    return {
      surface: "indexTip",
      shape: "flat",
      point: Vector3.add(
        Vector3.add(surface.point, Vector3.scale(surface.normal, pad)),
        Vector3.scale(up, slide),
      ),
      rotation: HumanHand.rotation(side, {
        fingers: up,
        palm: Vector3.scale(surface.normal, -1),
      }),
      out: 0.15,
    };
  }

  /**
   * How far the finger's axis stands off the skin it touches: the distal
   * index phalanx's collider radius (the hand's thinnest half-extent on a
   * profile without finger colliders: a box's least half extent, or the
   * radius of the sphere a hull holds about its centre), so a fingertip laid
   * on a surface touches it rather than sinking its axis into it.
   */
  function padding(body: IHumanBody, side: HumanHand.Side): number {
    const segment =
      body.profile.segments.find((s) => s.bone === `${side}IndexDistal`) ??
      body.profile.segments.find((s) => s.bone === `${side}Hand`);
    let thin: number = 0;
    for (const shape of segment?.shapes ?? []) {
      const half: number = thickness(shape);
      thin = thin === 0 ? half : Math.min(thin, half);
    }
    return thin;
  }

  /** A shape's thinnest half extent, metres. */
  function thickness(
    shape: IHumanBody["profile"]["segments"][number]["shapes"][number],
  ): number {
    if (shape.kind === "sphere") return shape.radius;
    if (shape.kind === "capsule") return shape.radius;
    if (shape.kind === "box")
      return Math.min(
        shape.halfExtents.x,
        shape.halfExtents.y,
        shape.halfExtents.z,
      );
    if (shape.kind === "hull") return physicalHullFaces(shape.points).depth;
    shape satisfies never;
    throw new Error("Unknown physical shape kind");
  }
}
