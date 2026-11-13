import {
  type IAutoMovieResolvedBone,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, type IHumanBody } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";

/**
 * The cheek regions lie on the zygomatic prominence over the buccal area:
 * the place a palm washing the face, cupping it or slapping it meets, beside
 * the nose and above the jaw, facing forward and out.
 *
 * Each body stands quietly heading +Z (its right toward -X); the regions are
 * placed on its displayed head at 0.25 s.
 *
 * Scenarios, on the average man and the small woman:
 * 1. Each cheek lies between the mouth's and the nose bridge's heights, the
 *    cheekbone's band of the face.
 * 2. Each cheek lies at least 25 mm out from the nose toward its own side,
 *    behind the nose's point and ahead of its side's ear.
 * 3. Each cheek lies above its side's jaw region.
 * 4. Each cheek's normal faces forward (its forward part over 0.6), out to
 *    its own side (over 0.4) and within 10 degrees of level.
 * 5. The left cheek is the right cheek mirrored in the head's median plane
 *    within 1 mm, and its normal the mirrored normal within 0.01.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places the shipped regions on a standing polygon man's displayed bones; a cheek on the jaw, the ear or the nose, or facing elsewhere, fails with its numbers.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are the face's landmarks on the same head (nose, nose bridge, mouth, jaw, ear) and the body's mirror symmetry, not the region's own definition.
 * @evidence contracts/development/testing.md#distinguishing-cases Both sides on two bodies of different size.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and reads one instant each; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the landmark, the stage and the 5 scenarios with their bounds.
 */
export function test_human_motion_region_cheek(): void {
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const film: motionHumanLaw.IFilm = motionHumanLaw.perform(
      "cheek",
      [{ subject: "a", body }],
      HumanChain.subject("a").stand({ seconds: 0.5 }),
    );
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      film.bones("a", 0.25);
    const place = (
      region: AutoMovieHumanoidRegion,
    ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } => {
      const frame: resolveAutoMovieHumanoidSurfaces.IFrame =
        body.surfaces.regions[region];
      return resolveAutoMovieHumanoidSurfaces.place(
        frame,
        bones.get(frame.bone)!,
      );
    };
    const nose: IAutoMovieVector3 = place("nose").point;
    const bridge: IAutoMovieVector3 = place("noseBridge").point;
    const mouth: IAutoMovieVector3 = place("mouth").point;
    const median: number = bones.get("head")!.worldPosition.x;
    for (const [side, sign] of [
      ["Right", -1],
      ["Left", 1],
    ] as const) {
      const cheek = place(`cheek${side}`);
      const at: IAutoMovieVector3 = cheek.point;
      const n: IAutoMovieVector3 = cheek.normal;
      const label: string = `${name} cheek${side}`;
      if (!(at.y > mouth.y && at.y < bridge.y))
        complaints.push(
          `${label}: height ${mm(at.y)} mm outside the mouth ${mm(mouth.y)} to the nose bridge ${mm(bridge.y)}`,
        );
      const out: number = sign * (at.x - nose.x);
      const ear: IAutoMovieVector3 = place(`ear${side}`).point;
      if (!(out >= 0.025 && at.z < nose.z && at.z > ear.z))
        complaints.push(
          `${label}: ${mm(out)} mm out from the nose (at least 25.0), depth ${mm(at.z)} mm against the nose ${mm(nose.z)} and the ear ${mm(ear.z)}`,
        );
      const jaw: IAutoMovieVector3 = place(`jaw${side}`).point;
      if (!(at.y > jaw.y))
        complaints.push(
          `${label}: height ${mm(at.y)} mm not above the jaw's ${mm(jaw.y)}`,
        );
      const tilt: number = (Math.asin(Math.abs(n.y)) * 180) / Math.PI;
      if (!(n.z > 0.6 && sign * n.x > 0.4 && tilt <= 10))
        complaints.push(
          `${label}: normal (${n.x.toFixed(2)}, ${n.y.toFixed(2)}, ${n.z.toFixed(2)}), ${tilt.toFixed(1)} deg off level`,
        );
    }
    const right = place("cheekRight");
    const left = place("cheekLeft");
    const mirror: number = Math.hypot(
      left.point.x - median - (median - right.point.x),
      left.point.y - right.point.y,
      left.point.z - right.point.z,
    );
    const turned: number = Math.hypot(
      left.normal.x + right.normal.x,
      left.normal.y - right.normal.y,
      left.normal.z - right.normal.z,
    );
    if (!(mirror <= 0.001 && turned <= 0.01))
      complaints.push(
        `${name}: the left cheek is ${mm(mirror)} mm and ${turned.toFixed(3)} in its normal off the right cheek's mirror`,
      );
  }
  TestValidator.equals("the cheeks lie on the cheekbones", complaints, []);
}
