import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";

/** The record of `IFrameFeetEntry`'s site. */
type IFrameFeetEntry = { ankle: IAutoMovieVector3 };

/**
 * The set's hands on the bridge of the thumb and index finger: in the set a
 * sprinter supports the hands on the fingertips, the forefinger and thumb
 * against the start line, the palm raised off the track (Davidson 2013,
 * "Teaching athletes to use the sprinter's block", Coach and Athletic Director:
 * "Pyramid the hands as to be on the fingertips with thumbs pointing in toward
 * the body", "The forefinger and thumb are against the starting line"; Badon
 * 2015, "Acceleration mechanics, drills, synthesis", Techniques (USTFCCCA):
 * "The hands form a bridge, maximizing the distance of the shoulders off the
 * track").
 *
 * Each hand's index and thumb pads (`HumanHand.offset`, the bridge hand,
 * `HumanHand.Shape`) lie on the track at the line, the pair centred a
 * shoulder's half-width out of the midline, the index outward, as far apart as
 * the bridge hand holds the pads. The wrist's place is the fit's; the seed
 * stands it over the pads' middle.
 */
export namespace sprintStartSetHands {
  /**
   * The set's frame: the entry stand's own, the floor point its feet stand
   * around (their ankles less the rest feet's offset from the body's origin, as
   * `stand.stance` places them), turned to its heading. The line lies a foot's
   * length ahead of it.
   *
   * @param body The body.
   * @param feet The entry's feet.
   * @param yaw The heading, degrees.
   * @returns The frame.
   */
  export function frame(
    body: IAutoMovieMotionHumanBody,
    feet: Record<AutoMovieHumanSide, IFrameFeetEntry>,
    yaw: number,
  ): IAutoMovieMotionHumanFrame {
    const rest: IAutoMovieVector3 = Vector3.lerp(
      body.rest.get("leftFoot")!,
      body.rest.get("rightFoot")!,
      0.5,
    );
    const ankles: IAutoMovieVector3 = Vector3.lerp(
      feet.left.ankle,
      feet.right.ankle,
      0.5,
    );
    const offset: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: rest.x, y: 0, z: rest.z },
    );
    return {
      origin: { x: ankles.x - offset.x, y: 0, z: ankles.z - offset.z },
      yaw,
    };
  }

  /** A hand's bridge. */
  export interface IBridge {
    /** The index pad's and the thumb pad's targets on the track. */
    targets: IAutoMovieMotionHumanBodyFitTypes.ITarget[];

    /**
     * The seed's wrist, over the pads' middle by the pads' reach from the
     * wrist, world metres.
     */
    wrist: IAutoMovieVector3;
  }

  /**
   * A hand's bridge at the line.
   *
   * @param body The body.
   * @param frame The set's frame, its origin the entry's root on the floor; the
   *   line lies a foot's length ahead.
   * @param side The hand.
   * @returns Its two pad targets and the seed's wrist.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    frame: IAutoMovieMotionHumanFrame,
    side: AutoMovieHumanSide,
  ): IBridge {
    const index: IAutoMovieVector3 = HumanHand.offset(
      body,
      side,
      "indexPad",
      "bridge",
    ).point;
    const thumb: IAutoMovieVector3 = HumanHand.offset(
      body,
      side,
      "thumbPad",
      "bridge",
    ).point;
    const spread: number = Vector3.distance(index, thumb);
    const out: number = side === "left" ? 1 : -1;
    const at: (lateral: number) => IAutoMovieVector3 = (
      lateral: number,
    ): IAutoMovieVector3 =>
      HumanFrame.point(frame, {
        x: out * (body.measure.shoulderHalfWidth + lateral),
        y: 0,
        z: body.measure.footLength,
      });
    const reach: number = Vector3.length(Vector3.lerp(index, thumb, 0.5));
    return {
      targets: [
        {
          bone: `${side}Hand`,
          point: index,
          goal: at(spread / 2),
          axes: ["x", "z"],
        },
        {
          bone: `${side}Hand`,
          point: thumb,
          goal: at(-spread / 2),
          axes: ["x", "z"],
        },
      ],
      wrist: { ...at(0), y: reach },
    };
  }
}
