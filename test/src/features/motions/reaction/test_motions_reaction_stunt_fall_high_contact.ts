import { AutoMovieEngineQuaternion, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanContactWindow,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanMaterialContact
} from "../../../../../packages/motions/src/posture/internal/HumanMaterialContact";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * Check the first contact of a falling exterior with a finite, elevated face.
 *
 * Scenarios:
 *
 * 1. A 0.1 m radius sphere falls from 1.3 m toward a pad at 0.2 m. Observe
 *    contact at sqrt(0.2) s and pad-local x equal to half that time.
 * 2. Move the same pad beyond the path and receive no contact. Query the
 *    aligned pad again and recover the first second.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios specify the material dimensions, ballistic root and translated-face control.
 * @evidence contracts/development/testing.md#behavioral-verification The arrival search distinguishes finite overlapping geometry from a same-height face outside the path.
 * @evidence contracts/development/testing.md#independent-expectations Solving `1.3 - 5 * t ** 2 - 0.1 = 0.2` gives the expected arrival, and the fixture's horizontal speed gives the contact point.
 */
export function test_motions_reaction_stunt_fall_high_contact(): void {
  const neutral: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: AutoMovieEngineQuaternion.identity(),
  };
  const ball: IAutoMoviePhysicalShape = {
    id: "exterior",
    material: "test",
    kind: "sphere",
    radius: 0.1,
    transform: neutral,
  };
  const outline: readonly IAutoMovieVector3[] = [
    { x: -0.5, y: 0, z: -0.5 },
    { x: 0.5, y: 0, z: -0.5 },
    { x: 0.5, y: 0, z: 0.5 },
    { x: -0.5, y: 0, z: 0.5 },
  ];
  const read =
    (offset: number) =>
    (
      seconds: number,
    ): IAutoMovieMotionHumanContactWindow.IMaterial | undefined => {
      const found: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeFaceContact> =
        AutoMovieEnginePhysics.physicalShapeFaceContact(
          {
            ...neutral,
            position: { x: seconds / 2, y: 1.3 - 5 * seconds ** 2, z: 0 },
          },
          ball,
          { ...neutral, position: { x: offset, y: 0.2, z: 0 } },
          outline,
        );
      return found === undefined
        ? undefined
        : { ...found, bone: "hips", normal: HumanMaterialContact.NORMAL };
    };
  const contact: ReturnType<typeof HumanMaterialContact.arrival> =
    HumanMaterialContact.arrival(0.65, read(0));
  const known: number = Math.sqrt(0.2);
  TestValidator.predicate(
    "first exterior touch follows the ballistic root",
    contact !== undefined &&
      nclose(contact.seconds, known, 1e-6) &&
      vclose(contact.material.point, { x: known / 2, y: 0, z: 0 }, 1e-6),
  );
  TestValidator.predicate(
    "the same-height pad beyond the footprint is refused deterministically",
    HumanMaterialContact.arrival(0.65, read(1)) === undefined &&
      HumanMaterialContact.arrival(0.65, read(0))?.seconds === contact?.seconds,
  );
}
