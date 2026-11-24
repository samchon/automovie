import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieViewAxis,
} from "@automovie/interface";

import { AutoMovieHumanConicLoft as H } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanJoinLoop } from "../conic/AutoMovieHumanJoinLoop";
import { AutoMovieHumanSegmentFrame as F } from "../frame/AutoMovieHumanSegmentFrame";
import type { AutoMovieHumanF1Divide } from "./AutoMovieHumanF1Divide";

/**
 * Where f1's arm face ends along the arm's course. A leaf module, so the figure's tree (`AutoMovieHumanF1`) and the native root law
 * (`AutoMovieHumanF1NativeRoots`), which the tree reaches through its native law, read one number without importing each other.
 */
export namespace AutoMovieHumanF1ArmEnd {
  /**
   * Where the arm's face ends, mm along its course, and the hand's family (`AutoMovieHumanF1Hand`, from 448) takes over across the wrist's
   * band. The arm family's one knuckle turn (half 10) drew the hand's back as two flat-bottomed valleys and creased the palm; the hand's
   * own turn (half 22) is fitted from 448, past the forearm's last level that a single section turn still follows, and the arm stops 3 mm
   * before it so that the band starts on the arm's own surface, not on a ring the hand's fit also claims.
   */
  export const TO_MM: number = 445;

  /**
   * The wrist handoff plane on the unchanged hand reference course.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The two original courses share the forearm course through the handoff. The point and the distal unit normal come from that section in mm.
   * @evidence contracts/development/implementation.md#principled-implementation The independent hand course retains the physical wrist section when the arm's proximal run changes.
   */
  export function plane(hand: IAutoMovieViewAxis.IAxis): AutoMovieHumanF1Divide.IEnd {
    const frame = hand.at(TO_MM);
    return { point: frame.origin, normal: F.unit(F.cross(frame.v, frame.u)) };
  }

  /**
   * The arm-domain station of the same reference wrist section.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Inverts the arm chart at the handoff and admits only the same oriented section plane.
   * @evidence contracts/development/implementation.md#principled-implementation Both source and native length consumers convert the same world-plane datum to the submitted arm chart.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A noncoincident, reversed or out-of-domain section is refused before either caller truncates or protects it.
   */
  export function station(
    arm: IAutoMovieHumanConicLoft.IFamily,
    hand: IAutoMovieHumanConicLoft.IFamily,
  ): number {
    const wrist = plane(H.axis(hand));
    const axis: IAutoMovieViewAxis.IAxis = H.axis(arm);
    const domain: [number, number] = [arm.knots[0]!, arm.knots.at(-1)!];
    const [s] = AutoMovieHumanJoinLoop.address(
      { name: arm.name, axis },
      domain,
      wrist.point,
      TO_MM,
    );
    const section = axis.at(s);
    const normal = F.unit(F.cross(section.v, section.u));
    if (
      !(s > domain[0] && s <= domain[1]) ||
      Math.abs(F.dot(F.sub(section.origin, wrist.point), wrist.normal)) > 1e-9 ||
      Math.hypot(...F.sub(normal, wrist.normal)) > 1e-9
    )
      throw new Error("the arm's kept wall does not reach the reference wrist plane");
    return s;
  }
}
