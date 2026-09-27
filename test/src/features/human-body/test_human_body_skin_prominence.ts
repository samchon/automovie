import {
  HUMAN_BODY_SKIN_SITES,
  type IAutoMovieHumanBodyBasis,
  createHumanBodySkinColour,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose } from "../internal/predicates";

/**
 * The skin over a joint's extension side takes the joint's ratio, from
 * straight to folded as the joint flexes.
 *
 * The analytic box's upper joint is named as a left elbow: it runs up +Y
 * from its head at y = 1 and flexes toward +Z, so the top corners facing -Z
 * are its extension side and those facing +Z its flexion side. The table
 * keeps one prominence, a band wide enough to reach the top face, that
 * darkens to half straight and to nothing folded at 90 degrees, with no
 * diffusion and no collar.
 *
 * Scenarios:
 * 1. Unposed (the joint's rest of zero), the extension-side corner reads
 *    darker than the flexion side, by at most the half the ratio gives (its
 *    normal leans toward the wide side face, off the facing ramp's top).
 * 2. Flexed 45 degrees it has gone exactly half way back; flexed 90 and
 *    past, it reads as the flexion side.
 * 3. A table without prominences leaves both sides alike.
 */
export const test_human_body_skin_prominence = (): void => {
  const { basis } = humanBodyBasisFixture();
  const renamed: IAutoMovieHumanBodyBasis = {
    ...basis,
    joints: basis.joints.map((joint) =>
      joint.bone === "spine"
        ? { ...joint, bone: "leftLowerArm" as typeof joint.bone }
        : joint,
    ),
    surfaces: basis.surfaces.map((surface) => ({
      ...surface,
      skin: {
        ...surface.skin,
        joints: surface.skin.joints.map((bone) =>
          bone === "spine" ? ("leftLowerArm" as typeof bone) : bone,
        ),
      },
    })),
  };
  const table = {
    ...HUMAN_BODY_SKIN_SITES,
    sweeps: 0,
    collarMetres: 1e-9,
    prominences: [
      {
        bone: "LowerArm",
        sigmaMetres: 20,
        reachMetres: 2,
        extended: [0.5, 0.5, 0.5] as [number, number, number],
        folded: [1, 1, 1] as [number, number, number],
        foldedAtDegrees: 90,
      },
    ],
  };
  const surface = renamed.surfaces[0]!;
  const at = (side: number) =>
    [...new Array(surface.positions.length / 3).keys()].find(
      (v) =>
        Math.abs(surface.positions[v * 3 + 1]! - 2) < 1e-9 &&
        Math.sign(surface.positions[v * 3 + 2]!) === side,
    )!;
  const ratio = (subject: typeof table, flexion: number | null) => {
    const colors = createHumanBodySkinColour(renamed, subject)(
      [0.46, 0.27, 0.21],
      () => flexion,
    ).colors[0]!;
    return colors[at(-1) * 3 + 1]! / colors[at(1) * 3 + 1]!;
  };
  const straight = ratio(table, null);
  TestValidator.predicate(
    "straight, the extension side reads darker, by at most half",
    straight < 1 && straight >= 0.5,
  );
  TestValidator.predicate(
    "the skin lightens as the joint folds",
    nclose(ratio(table, 45), 1 + (straight - 1) / 2, 1e-9) &&
      nclose(ratio(table, 90), 1, 1e-9) &&
      nclose(ratio(table, 140), 1, 1e-9),
  );
  TestValidator.predicate(
    "without prominences both sides are alike",
    nclose(ratio({ ...table, prominences: [] }, null), 1, 1e-9),
  );
};
