import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { motionHumanLaw } from "../internal/motionHumanLaw";
import { motionComplaints } from "../internal/motionComplaints";
import { motionPostureBranches } from "../internal/motionPostureBranches";

/**
 * Lying on the back, front or side changes support without skating or penetrating the floor.
 *
 * Scenarios:
 * 1. The default back-down and explicit front-down routes use different bearing sides.
 * 2. Left and right lateral routes enter on opposite limbs and retain distinct observed supports.
 * 3. The displayed shoulders and hips identify the side that faces the floor at rest. The exit declares the lying base.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law's distinguishing inputs and preserves their staged context.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the actual public law and applies the timing, contact, range, spin and display audits to its staged performances.
 * @evidence contracts/development/testing.md#independent-expectations The same floor, tangle and contact limits constrain every route. These limits are independent of the result the law returns.
 * @evidence contracts/development/testing.md#distinguishing-cases The default back-down and explicit front-down routes use different bearing sides. Left and right lateral routes enter on opposite limbs and retain distinct observed supports.
 * @evidence contracts/development/testing.md#execution-ownership The discovered test stages and audits the selected solo branches in memory.
 */
export function test_motion_posture_floor_support_entry(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const findings: string[] = motionPostureBranches(
    [
      ["lieDown", "default", "f-small"],
      ["lieDown", "position=prone", "m-large"],
      ["lieDown", "position=lateralLeft", "f-small"],
      ["lieDown", "position=lateralRight", "m-large"],
    ],
    (film, [, row, name]): void => {
      // Construct anatomical axes from displayed joint centres. A lying
      // side is the one facing the floor, independently of the plan's labels.
      const t: number = (motionHumanLaw.event(film, "settled") + film.duration) / 2;
      const bones: motionHumanLaw.Bones = film.bones("a", t);
      const left: IAutoMovieVector3 = bones.get("leftUpperArm")!.worldPosition;
      const right: IAutoMovieVector3 = bones.get("rightUpperArm")!.worldPosition;
      const lateral: IAutoMovieVector3 = Vector3.normalize(Vector3.subtract(left, right));
      const along: IAutoMovieVector3 = Vector3.normalize(Vector3.subtract(
        Vector3.lerp(left, right, 0.5), bones.get("hips")!.worldPosition,
      ));
      const front: IAutoMovieVector3 = Vector3.normalize(Vector3.cross(lateral, along));
      const onSide: boolean = row === "position=lateralLeft" || row === "position=lateralRight";
      const up: number = onSide
        ? (row === "position=lateralLeft" ? -lateral.y : lateral.y)
        : (row === "position=prone" ? -front.y : front.y);
      const competing: number = Math.max(Math.abs(along.y), Math.abs(onSide ? front.y : lateral.y));
      complaints.check(`lieDown ${row} ${name}: requested anatomical axis projects ${up} upward, other axes at most ${competing}`,
        up > competing);
      motionPostureBranches.checkBase(complaints.list, film.performance, `lieDown ${row} ${name}`, "lying");
    },
  );
  complaints.list.push(...findings);
  complaints.assert("Lying on either side changes support and leaves the lying base");
}
