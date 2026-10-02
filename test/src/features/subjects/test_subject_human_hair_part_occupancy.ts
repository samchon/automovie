import {
  type IAutoMovieHumanFaceHair,
  createHumanFaceScalpTint,
  humanFaceHairPartOccupancy,
  humanFaceHairPartSide,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { numericalHairBasisFixture } from "../internal/numericalHairBasisFixture";
import { nclose } from "../internal/predicates";

type Part = NonNullable<IAutoMovieHumanFaceHair.Layer["part"]>;

/**
 * A parting leaves the scalp bare along its plane, and the scalp tint follows
 * that line instead of painting hair colour over fibres the parting removed.
 * Scenarios:
 * 1. The side is tanh of the signed distance to the plane over the transition
 *    width: zero on the plane, tanh(1) one width away, odd about the plane and
 *    saturating beyond it; the plane normal is normalized and the offset moves
 *    the plane.
 * 2. The occupancy is one on the plane inside the region, one half where the
 *    side's magnitude is one half, near zero beyond the transition, and zero
 *    outside the Gaussian region; an absent region leaves the plane alone
 *    deciding.
 * 3. On the analytic ball the vertices on the plane inside the region keep
 *    their skin, a vertex off the plane takes the hair colour by the remaining
 *    share, a vertex outside the region takes the full hair colour, and a layer
 *    without a parting tints exactly as before.
 */
export const test_subject_human_hair_part_occupancy = (): void => {
  const part: Part = {
    normal: [2, 0, 0],
    offset: 0.01,
    transitionWidth: 0.02,
    bias: [0, 0, 0],
    strength: 1,
    reach: 0.01,
  };
  const at = (x: number, y = 0, z = 0) => ({ x, y, z });
  TestValidator.predicate(
    "the side is zero on the offset plane and odd about it",
    nclose(humanFaceHairPartSide(at(0.01), part), 0) &&
      nclose(humanFaceHairPartSide(at(0.03), part), Math.tanh(1)) &&
      nclose(humanFaceHairPartSide(at(-0.01), part), -Math.tanh(1)) &&
      nclose(humanFaceHairPartSide(at(5, 3, 2), part), 1),
  );
  TestValidator.predicate(
    "the side ignores the in-plane coordinates",
    nclose(
      humanFaceHairPartSide(at(0.03, 7, -4), part),
      humanFaceHairPartSide(at(0.03), part),
    ),
  );
  const half = 0.01 + 0.02 * Math.atanh(0.5);
  TestValidator.predicate(
    "the occupancy is one on the plane, one half at half side, and gone beyond",
    nclose(humanFaceHairPartOccupancy(at(0.01), part), 1) &&
      nclose(humanFaceHairPartOccupancy(at(half), part), 0.5) &&
      nclose(humanFaceHairPartOccupancy(at(0.01 + 0.2), part), 0, 1e-6),
  );
  const regional: Part = {
    ...part,
    region: { center: [0.01, 0.1, 0], spread: [0.01, 0.01, 0.01] },
  };
  TestValidator.predicate(
    "the region limits the occupancy to where the parting acts",
    nclose(humanFaceHairPartOccupancy(at(0.01, 0.1, 0), regional), 1) &&
      nclose(
        humanFaceHairPartOccupancy(at(0.01, 0.1 + 0.01, 0), regional),
        Math.exp(-0.5),
      ) &&
      humanFaceHairPartOccupancy(at(0.01, 0, 0), regional) < 1e-12,
  );
  const { basis, document } = numericalHairBasisFixture();
  const tint = createHumanFaceScalpTint(basis);
  const skin = basis.materials[0].baseColor;
  const finish = document.hair!.layers[0].finish;
  const hair = finish.color.map(
    (value) => value + (1 - value) * (finish.grey ?? 0),
  );
  const full = [skin.r, skin.g, skin.b].map((value, channel) =>
    Math.min(1, hair[channel] / value),
  );
  const plain = tint(document.hair, basis.materials).get("head")!;
  const parted = structuredClone(document.hair!);
  // Plane x = 0 with a 50 mm transition, acting only around the crown vertex.
  parted.layers[0].part = {
    normal: [1, 0, 0],
    offset: 0,
    transitionWidth: 0.05,
    bias: [0, 0, 0],
    strength: 1,
    reach: 0.01,
    region: { center: [0, 0.1, 0], spread: [0.05, 0.05, 0.05] },
  };
  const gains = tint(parted, basis.materials).get("head")!;
  const vertex = (values: readonly number[], index: number) =>
    values.slice(3 * index, 3 * index + 3);
  TestValidator.predicate(
    "the crown vertex on the plane keeps its skin",
    vertex(gains, 2).every((value) => nclose(value, 1)) &&
      !vertex(plain, 2).every((value) => nclose(value, 1)),
  );
  // Vertex 0 stands 100 mm off the plane and 141 mm from the region centre.
  const bare =
    (1 - Math.tanh(2)) * Math.exp(-0.5 * (0.1 ** 2 + 0.1 ** 2) / 0.05 ** 2);
  TestValidator.predicate(
    "a vertex off the plane keeps the share the occupancy leaves",
    vertex(gains, 0).every((value, channel) =>
      nclose(value, 1 + (full[channel] - 1) * (1 - bare)),
    ),
  );
  // A region 20 mm wide around the crown puts vertex 4 at 5 spreads from it.
  const narrow = structuredClone(parted);
  narrow.layers[0].part!.region!.spread = [0.02, 0.02, 0.02];
  TestValidator.predicate(
    "a vertex far from the region takes the full hair colour",
    vertex(tint(narrow, basis.materials).get("head")!, 4).every(
      (value, channel) => nclose(value, full[channel]),
    ),
  );
  const unparted = structuredClone(parted);
  delete unparted.layers[0].part;
  TestValidator.predicate(
    "a layer without a parting tints exactly as before",
    tint(unparted, basis.materials)
      .get("head")!
      .every((value, index) => value === plain[index]),
  );
};
