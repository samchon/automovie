import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanFrame,
  IAutoMovieVector3,
} from "@automovie/interface";
import { Vector3 } from "@automovie/engine";

import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";

/**
 * The set's hands on the bridge of the thumb and index finger: in the set a
 * sprinter supports the hands on the thumb and index finger spread along the
 * start line, just behind it and shoulder-width apart, the palm raised off
 * the track (the "high bridge" of the thumb and fingers: Harland and Steele
 * 1997, Sports Med 23:11, "Biomechanics of the sprint start"; World
 * Athletics' "Run! Jump! Throw!" start technique, hands "behind the line,
 * thumb and fingers forming a bridge").
 *
 * Each hand's index and thumb pads (`HumanHand.offset`, the flat hand) lie on
 * the track at the line, the pair centred a shoulder's half-width out of the
 * midline, the index outward, as far apart as the flat hand holds the pads.
 * The wrist's place is the fit's; the seed stands it over the pads' middle.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the contact, its source, the placement and the seed.
 * @evidence contracts/development/design.md#principled-representation Pad contacts are hand-frame points of the flat hand brought to world floor points, metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function gives a hand's two contact targets and its seed wrist.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The pads' spread is the body's own flat hand's; no spread or height is laid down.
 */
export namespace sprintStartSetHands {
  /**
   * The set's frame: the entry stand's own, the floor point its feet stand
   * around (their ankles less the rest feet's offset from the body's origin,
   * as `stand.stance` places them), turned to its heading. The line lies a
   * foot's length ahead of it.
   *
   * @param body The body.
   * @param feet The entry's feet.
   * @param yaw The heading, degrees.
   * @returns The frame.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Inverts the stand's own placement of its feet from its floor point.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One midpoint less one turned rest offset.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The frame follows the entry's displayed feet, not its root.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the entry's feet and the body's rest once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh frame.
   * @evidence contracts/development/common.md#meaningful-documentation States the construction and the line's place.
   */
  export function frame(
    body: IAutoMovieMotionHumanBody,
    feet: Record<"left" | "right", { ankle: IAutoMovieVector3 }>,
    yaw: number,
  ): IAutoMovieMotionHumanFrame {
    const rest: IAutoMovieVector3 = Vector3.lerp(
      body.rest.get("leftFoot")!,
      body.rest.get("rightFoot")!,
      0.5,
    );
    const ankles: IAutoMovieVector3 = Vector3.lerp(feet.left.ankle, feet.right.ankle, 0.5);
    const offset: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: rest.x, y: 0, z: rest.z },
    );
    return {
      origin: { x: ankles.x - offset.x, y: 0, z: ankles.z - offset.z },
      yaw,
    };
  }

  /**
   * A hand's bridge.
   *
   * @evidence contracts/development/design.md#principled-representation Two fit targets on the hand bone and a world seed wrist.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The targets the fit holds and the wrist the seed reaches.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The palm carries no target: it rises where the fit leaves it.
   * @evidence contracts/development/common.md#meaningful-documentation States both members.
   */
  export interface IBridge {
    /** The index pad's and the thumb pad's targets on the track. */
    targets: IAutoMovieMotionHumanBodyFitTypes.ITarget[];

    /** The seed's wrist, over the pads' middle by the pads' reach from the wrist, world metres. */
    wrist: IAutoMovieVector3;
  }

  /**
   * A hand's bridge at the line.
   *
   * @param body The body.
   * @param frame The set's frame, its origin the entry's root on the floor; the line lies a foot's length ahead.
   * @param side The hand.
   * @returns Its two pad targets and the seed's wrist.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reads the flat hand's own pad offsets and lays them on the floor along the line.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two offsets, two floor points and one seed point.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No palm target and no rotation: the bridge's tilt is the fit's.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the hand's offsets once per hand.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh records.
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, the result and its units.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    frame: IAutoMovieMotionHumanFrame,
    side: "left" | "right",
  ): IBridge {
    const index: IAutoMovieVector3 = HumanHand.offset(body, side, "indexPad", "flat").point;
    const thumb: IAutoMovieVector3 = HumanHand.offset(body, side, "thumbPad", "flat").point;
    const spread: number = Vector3.distance(index, thumb);
    const out: number = side === "left" ? 1 : -1;
    const at: (lateral: number) => IAutoMovieVector3 = (lateral: number): IAutoMovieVector3 =>
      HumanFrame.point(frame, {
        x: out * (body.measure.shoulderHalfWidth + lateral),
        y: 0,
        z: body.measure.footLength,
      });
    const reach: number = Vector3.length(Vector3.lerp(index, thumb, 0.5));
    return {
      targets: [
        { bone: `${side}Hand`, point: index, goal: at(spread / 2), axes: ["x", "z"] },
        { bone: `${side}Hand`, point: thumb, goal: at(-spread / 2), axes: ["x", "z"] },
      ],
      wrist: { ...at(0), y: reach },
    };
  }
}
