import { TestValidator } from "@nestia/e2e";

import {
  isSidedBodyCorrective,
  mirrorBodyCorrective,
  mirrorBodyVertices,
  swapBodySide,
  symmetrizeBodyRows,
} from "../../../scripts/body-basis/mirrorBodyCorrective";
import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

const close = (found: number[], expected: number[], eps = 1e-12): boolean =>
  found.length === expected.length &&
  found.every((value, at) => nclose(value, expected[at], eps));

/**
 * The bilateral symmetry of pose correctives: the vertex mirror, the side
 * swap of a name, the sided test, the exact mirror of a corrective and the
 * symmetrized field of a midline one.
 *
 * The vertices are the analytic box (see `humanBodyBasisFixture`), whose
 * eight corners come in mirror pairs across `x = 0`, and small hand-made
 * clouds for the tolerance and the midline. The channels are the box's
 * `sideLeft` and `sideRight`, a mirror pair, and `width`, a midline channel.
 *
 * Scenarios:
 * 1. The box's corners pair as 0-1, 2-3, 4-5 and 6-7; a midline vertex is its
 *    own mirror; a vertex with no partner is `-1`; a partner 10 micrometres
 *    off counts and one 30 micrometres off does not; of two candidates the
 *    nearer wins.
 * 2. A side swap turns `left` into `right` and `Left` into `Right` both ways,
 *    wherever they occur, and leaves a name with no side alone.
 * 3. A channel driver on `sideLeft`, a joint driver on a left bone and a
 *    shoulder kernel on a left arm are sided; a midline channel, the spine
 *    and a bilateral corrective whose left and right drivers swap into each
 *    other are not.
 * 4. The mirror of a sided corrective has the swapped id as its target,
 *    mirrored drivers (the channel to its mirror, the bone and the shoulder
 *    to the other side, the kernel's orientation kept), and its rows on the
 *    partner vertices with x negated, sorted by vertex.
 * 5. Mirroring a midline corrective, a sided corrective whose id names no
 *    side, or a row whose vertex has no partner, is refused.
 * 6. Symmetrizing a field gives a vertex and its partner mirrored
 *    displacements, the mean of the field and its mirror; a midline vertex
 *    loses its x displacement; a vertex with no partner is refused.
 */
export const test_human_body_mirror_corrective = (): void => {
  const { basis } = humanBodyBasisFixture();
  const channels = new Map(basis.channels.map((c) => [c.id, c]));
  const box = basis.surfaces[0].positions;

  // 1. vertex mirror
  TestValidator.equals("the box's corners", mirrorBodyVertices(box), [
    1, 0, 3, 2, 5, 4, 7, 6,
  ]);
  TestValidator.equals(
    "midline, unpaired, tolerance",
    mirrorBodyVertices([
      0, 0.5, 0.2, //  midline
      0.3, 0, 0, //  no partner
      0.1, 0, 0, //  pair, 10 um off
      -0.10001, 0, 0, //  its partner
      0.2, 0, 0, //  pair, 30 um off
      -0.20003, 0, 0, //  not its partner
    ]),
    [0, -1, 3, 2, -1, -1],
  );
  const twin = mirrorBodyVertices([0.1, 0, 0, -0.1000002, 0, 0, -0.1000015, 0, 0]);
  TestValidator.equals("the nearer candidate wins", twin[0], 1);

  // 2. side swap
  TestValidator.equals("left to right", swapBodySide("leftUpperLeg"), "rightUpperLeg");
  TestValidator.equals("right to left", swapBodySide("state/joints:rightUpperLeg.flexion@125"), "state/joints:leftUpperLeg.flexion@125");
  TestValidator.equals("a capital", swapBodySide("upperarmMuscleLeft"), "upperarmMuscleRight");
  TestValidator.equals("a capital the other way", swapBodySide("sideRight"), "sideLeft");
  TestValidator.equals("both in one name", swapBodySide("leftToRightRight"), "rightToLeftLeft");
  TestValidator.equals("no side", swapBodySide("state/combos:both:UpperLeg.flexion@125"), "state/combos:both:UpperLeg.flexion@125");

  // 3. sided
  const bone = (name: string) => ({
    bone: name as "leftUpperLeg",
    axis: "flexion" as const,
    side: "positive" as const,
    onset: 30,
    full: 90,
  });
  const channel = (name: string) => ({
    channel: name,
    side: "positive" as const,
  });
  const kernel = (name: string) => ({
    shoulder: name as "leftUpperArm",
    orientation: { plane: 10, elevation: 20, axialRotation: 30 },
    innerDegrees: 0,
    outerDegrees: 30,
  });
  const corrective = (id: string, inputs: ReturnType<typeof bone>[] | (ReturnType<typeof channel> | ReturnType<typeof bone> | ReturnType<typeof kernel>)[]) => ({
    id,
    inputs,
    weight: 1,
    target: id,
  });
  for (const [title, inputs, sided] of [
    ["a sided channel", [channel("sideLeft")], true],
    ["a left bone", [bone("leftUpperLeg")], true],
    ["a shoulder kernel", [kernel("leftUpperArm")], true],
    ["a midline channel", [channel("width")], false],
    ["the spine", [bone("spine")], false],
    ["a bilateral pair", [bone("leftUpperLeg"), bone("rightUpperLeg")], false],
    ["a bilateral pair of channels", [channel("sideRight"), channel("sideLeft")], false],
  ] as const)
    TestValidator.equals(
      title,
      isSidedBodyCorrective(corrective("state/x", [...inputs]), channels),
      sided,
    );

  // 4. mirror of a sided corrective
  const source = corrective("state/shapes:sideLeft:leftUpperArm.flexion@90", [
    channel("sideLeft"),
    bone("leftUpperLeg"),
    kernel("leftUpperArm"),
  ]);
  const partner = mirrorBodyVertices(box);
  const mirror = mirrorBodyCorrective(
    source,
    [0, 0.01, 0.02, 0.03, 3, -0.005, 0, 0.001],
    partner,
    channels,
  );
  TestValidator.equals(
    "the swapped id is the target",
    [mirror.corrective.id, mirror.corrective.target],
    [
      "state/shapes:sideRight:rightUpperArm.flexion@90",
      "state/shapes:sideRight:rightUpperArm.flexion@90",
    ],
  );
  TestValidator.equals("mirrored drivers", mirror.corrective.inputs, [
    channel("sideRight"),
    bone("rightUpperLeg"),
    { ...kernel("rightUpperArm"), orientation: { plane: 10, elevation: 20, axialRotation: 30 } },
  ]);
  TestValidator.predicate(
    "rows on the partner vertices, x negated, sorted",
    close(mirror.rows, [1, -0.01, 0.02, 0.03, 2, 0.005, 0, 0.001]),
  );
  TestValidator.equals("the gain is kept", mirror.corrective.weight, 1);

  // 5. refusals
  TestValidator.predicate(
    "a midline corrective has no mirror",
    throwsError(
      () => mirrorBodyCorrective(corrective("state/left", [channel("width")]), [0, 0, 0, 0], partner, channels),
      "sided",
    ),
  );
  TestValidator.predicate(
    "a sided corrective whose id names no side would collide",
    throwsError(
      () => mirrorBodyCorrective(corrective("state/x", [bone("leftUpperLeg")]), [0, 0, 0, 0], partner, channels),
      "sided id",
    ),
  );
  TestValidator.predicate(
    "a row without a mirror vertex is refused",
    throwsError(
      () => mirrorBodyCorrective(corrective("state/left", [bone("leftUpperLeg")]), [3, 0, 0, 0], [1, 0, 3, -1], channels),
      "no mirror",
    ),
  );

  // 6. symmetrized field
  const cloud = [0, 0, 0, 1, 0, 0, -1, 0, 0];
  const mates = mirrorBodyVertices(cloud);
  TestValidator.equals("the cloud pairs", mates, [0, 2, 1]);
  const field = symmetrizeBodyRows([0, 0.02, 0.01, 0.03, 1, 0.04, 0, 0], mates);
  TestValidator.predicate(
    "the midline loses its x displacement",
    close(field.slice(0, 4), [0, 0, 0.01, 0.03]),
  );
  TestValidator.predicate(
    "a vertex and its partner take mirrored means",
    close(field.slice(4, 12), [1, 0.02, 0, 0, 2, -0.02, 0, 0]),
  );
  TestValidator.predicate(
    "a vertex with no partner is refused",
    throwsError(() => symmetrizeBodyRows([0, 0.01, 0, 0], [-1]), "no mirror"),
  );
};
