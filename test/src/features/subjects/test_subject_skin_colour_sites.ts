import { createPortraitSkinColour } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceFixture } from "../internal/humanFaceFixture";
import { nclose } from "../internal/predicates";

/**
 * A named skin site paints its own landmark, with an extent that follows the
 * face and never the caller.
 *
 * Scenarios:
 * 1. At a site's landmark the colour is the kernel's centre value, one minus
 *    strength times one minus gain, and at exactly one fifth of the
 *    bizygomatic breadth away it is the identity (the kernel vanishes there).
 * 2. A face twice as broad paints twice as far: an offset of one fifth of the
 *    small face's breadth is exterior on it and interior on the broad face, so
 *    the extent is not a fixed number of millimetres.
 * 3. Two sites compose by name, so their declaration order is irrelevant, and
 *    each site paints at its own landmark and not at another's.
 */
export const test_subject_skin_colour_sites = (): void => {
  const host = humanFaceFixture().basis.host;
  const at = (id: number) => host.positions[id];
  const breadth = Math.abs(at(454)[0] - at(234)[0]);
  const gain: [number, number, number] = [0.8, 0.6, 0.4];
  const sample = createPortraitSkinColour(host, [
    { site: "forehead", gain, strength: 0.5 },
  ]);
  TestValidator.predicate(
    "centre value at the forehead landmark",
    sample([...at(151)]).every((v, i) => nclose(v, 1 - 0.5 * (1 - gain[i]), 1e-9)),
  );
  const edge = [at(151)[0] + 0.2 * breadth, at(151)[1], at(151)[2]];
  TestValidator.equals("identity at one fifth of the breadth", sample(edge), [
    1, 1, 1,
  ]);
  const inside = [at(151)[0] + 0.1 * breadth, at(151)[1], at(151)[2]];
  TestValidator.predicate(
    "colour inside the support",
    sample(inside).every((v) => v < 1),
  );

  const scaled = structuredClone(host);
  scaled.positions = scaled.positions.map((p) => p.map((v) => v * 2));
  const wide = createPortraitSkinColour(scaled, [
    { site: "forehead", gain, strength: 0.5 },
  ]);
  const twice = scaled.positions[151];
  const sameOffset = [twice[0] + 0.2 * breadth, twice[1], twice[2]];
  TestValidator.predicate(
    "the extent scales with the face",
    wide(sameOffset).every((v) => v < 1) &&
      sample([at(151)[0] + 0.2 * breadth, at(151)[1], at(151)[2]]).every(
        (v) => v === 1,
      ),
  );

  const chin = { site: "chin" as const, gain: [0.2, 0.3, 0.4] as [number, number, number], strength: 1 };
  const forehead = { site: "forehead" as const, gain, strength: 0.5 };
  TestValidator.equals(
    "order independent",
    createPortraitSkinColour(host, [chin, forehead])([...at(199)]),
    createPortraitSkinColour(host, [forehead, chin])([...at(199)]),
  );
  TestValidator.predicate(
    "the chin site paints at the chin and not at the forehead",
    createPortraitSkinColour(host, [chin])([...at(199)]).every((v) => v < 1) &&
      createPortraitSkinColour(host, [chin])([...at(151)]).every((v) => v === 1),
  );
};
