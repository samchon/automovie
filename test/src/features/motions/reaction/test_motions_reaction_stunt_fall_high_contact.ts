import { Quaternion, physicalShapeFaceContact } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanContactWindow,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanMaterialContact } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * A ballistic exterior contacts a named finite face at its own height.
 *
 * Scenarios:
 *
 * 1. The sphere's centre begins at 1.3 m, the pad at 0.2 m, and free fall follows
 *    y = 1.3 - 5t². Its 0.1 m radius first reaches at sqrt(0.2) s.
 * 2. A pad raised to the same height but translated beyond the sphere's path
 *    cannot receive it.
 * 3. Repeating the reads after a later flight query keeps the first witness.
 */
export function test_motions_reaction_stunt_fall_high_contact(): void {
  const neutral: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: Quaternion.identity(),
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
      const found: ReturnType<typeof physicalShapeFaceContact> =
        physicalShapeFaceContact(
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
