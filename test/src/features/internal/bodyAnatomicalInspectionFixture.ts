import type { IAutoMovieHumanBodyAnatomicalDocument } from "@automovie/human/body/structures/IAutoMovieHumanBodyAnatomicalDocument";

import { humanBodyPelvisFixture } from "./humanBodyPelvisFixture";
import { humanBodyShoulderFixture } from "./humanBodyShoulderFixture";

/** Independent mirrored reference joints; requested context is deliberately different from the analytic box. */
export function bodyAnatomicalInspectionFixture() {
  const { basis } = humanBodyShoulderFixture();
  const pelvis = humanBodyPelvisFixture().basis;
  for (let index = 3; index < pelvis.landmarks.ids.length; index++) {
    basis.landmarks.ids.push(pelvis.landmarks.ids[index]);
    basis.landmarks.positions.push(...pelvis.landmarks.positions.slice(index * 3, index * 3 + 3));
  }
  basis.joints.push(...pelvis.joints.slice(2));
  const document: IAutoMovieHumanBodyAnatomicalDocument = {
    id: "analytic-inspection",
    name: "Independent target radii",
    basis: basis.id,
    generatorRevision: "articular-head-inspection/1",
    tier: "detailed",
    targets: {
      age: { kind: "target", years: 30 },
      surface: {
        stature: { kind: "target", metres: 1.7 },
        mass: { kind: "target", kilograms: 65 },
      },
      leftUpperLimb: { upperArm: { humerus: { sphereFittedHeadRadius: { kind: "target", millimetres: 24 } } } },
      leftLowerLimb: { thigh: { femur: { sphereFittedHeadRadius: { kind: "target", millimetres: 25 } } } },
    },
  };
  return { basis, document };
}
