import {
  type IAutoMovieHumanPersonDocument,
  createHumanPersonBuilder,
  createPortraitMaterials,
} from "@automovie/human";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanPersonBasisFixture } from "../internal/humanPersonBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * One person from an analytic face and body, every expectation by hand.
 *
 * The fixture's body is a tube of eight vertices per ring whose top three rings
 * (0.01, 0.03 and 0.05) lie above the face's cut at height 0, so the body gives
 * up 24 of its 73 vertices; the face is a tube of twelve vertices per ring, 49
 * in all. The retained collar has sixteen edge intersections at zero,
 * and the shared boundary is their union with twelve face corners,
 * four of which coincide with vertical-edge intersections. The head joint
 * stands at (0, 0.06, 0) with the twist axis +Y.
 *
 * Scenarios:
 * 1. Neutral: the parts are the face's skin and brow, the body's skin and the
 *    common boundary, under their prefixes, with the two skin materials; the
 *    body's part has 49 retained original vertices, sixteen cut crossings,
 *    eight face-corner insertions and eight incident-triangle centroids; no ribbon is emitted; the rig is the
 *    body's four bones; the collar moves only by the radial difference between the sampled
 *    body cut and face polygon.
 * 2. The retained collar lies on the face's loop: each of the twenty-four union
 *    body-loop points is within a nanometre of the face loop polygon, at the
 *    neutral and with the face widened by its shape channel (radius 0.06),
 *    where the body stays as it was and so has to move farther.
 * 3. A brow that no channel moves rides the head whole: at the neutral it
 *    stays; with the head twisted 30 degrees about the joint every point keeps
 *    its height and its distance from the axis and turns by 30 degrees; the
 *    face skin above the neck's reach turns the same.
 * 4. The person's skin colour is the face's: a lighter face override gives a
 *    lighter body skin material.
 * 5. Refusals: a body that states its own skin colour, a face or a body written
 *    for another basis, and a face basis whose surfaces draw no skin.
 */
export const test_human_person_build = (): void => {
  const fixture = humanPersonBasisFixture();
  const build = createHumanPersonBuilder({
    face: fixture.face,
    body: fixture.body,
  });
  const person = (
    over: Partial<{
      face: Record<string, number>;
      pose: { twist: number };
      color: number;
    }> = {},
  ): IAutoMovieHumanPersonDocument => ({
    ...fixture.document,
    face: {
      ...fixture.document.face,
      shape: over.face ?? {},
      ...(over.color === undefined
        ? {}
        : {
            materials: {
              skin: { color: { r: over.color, g: over.color, b: over.color } },
            },
          }),
    },
    body: {
      ...fixture.document.body,
      ...(over.pose === undefined
        ? {}
        : {
            pose: [
              {
                bone: "head" as const,
                flexion: null,
                abduction: null,
                twist: over.pose.twist,
              },
            ],
          }),
    },
  });
  const meshOf = (
    built: ReturnType<typeof build>,
    id: string,
  ): IAutoMovieMesh => {
    const part = built.model.parts.find((one) => one.id === id)!;
    return (part.geometry as { mesh: IAutoMovieMesh }).mesh;
  };
  const neutral = build(person());

  TestValidator.equals(
    "the parts keep the face and body identities without a degenerate seam part",
    neutral.model.parts.map((part) => part.id),
    ["face:face/skin", "face:face/brow", "body:body/skin"],
  );
  TestValidator.equals(
    "each skin keeps its own material",
    neutral.model.materials.map((material) => material.id),
    ["face:skin", "body:skin"],
  );
  TestValidator.equals(
    "the body removes covered skin and subdivides its eight collar triangles",
    meshOf(neutral, "body:body/skin").positions.length / 3,
    6 * 8 + 1 + 16 + 8 + 8,
  );
  TestValidator.equals(
    "the shared boundary needs no joining ribbon triangle",
    neutral.seam.ribbonTriangles,
    0,
  );
  TestValidator.equals(
    "the rig is the body's",
    neutral.bones.map((one) => one.bone),
    ["hips", "spine", "neck", "head"],
  );
  TestValidator.predicate(
    "the collar moved by the gap and the polygon's sagitta",
    neutral.seam.collarShiftMetres > 0 &&
      neutral.seam.collarShiftMetres < 0.004,
  );

  const onLoop = (built: ReturnType<typeof build>, radius = 0.05): boolean => {
    const body = meshOf(built, "body:body/skin").positions;
    // Expected loop is the analytic fixture polygon, independent of render
    // first-appearance numbering and any inserted boundary residents.
    const point = (at: number): number[] => [radius * Math.sin(2 * Math.PI * at / 12), 0, radius * Math.cos(2 * Math.PI * at / 12)];
    const collar = Array.from({ length: body.length / 3 }, (_, k) => body.slice(k * 3, k * 3 + 3)).filter((p) => nclose(p[1], 0, 1e-12));
    return collar.length === 24 && collar.every((p) =>
      Array.from({ length: 12 }, (__, edge) => {
        const a = point(edge);
        const b = point((edge + 1) % 12);
        const ab = [0, 1, 2].map((axis) => b[axis] - a[axis]);
        const along =
          [0, 1, 2].reduce((s, axis) => s + (p[axis] - a[axis]) * ab[axis], 0) /
          [0, 1, 2].reduce((s, axis) => s + ab[axis] * ab[axis], 0);
        const t = Math.min(1, Math.max(0, along));
        return Math.hypot(
          ...[0, 1, 2].map((axis) => p[axis] - (a[axis] + ab[axis] * t)),
        );
      }).some((distance) => distance < 1e-9),
    );
  };
  TestValidator.predicate("the collar lies on the face loop", onLoop(neutral));
  const wide = build(person({ face: { headWidth: 1 } }));
  TestValidator.predicate(
    "the collar follows a wider face neck",
    onLoop(wide, 0.06) &&
      wide.seam.collarShiftMetres > neutral.seam.collarShiftMetres,
  );

  const brow = meshOf(neutral, "face:face/brow").positions;
  TestValidator.predicate(
    "a rigid part stays at the neutral",
    [0.02, 0.25, 0.06, 0.04, 0.25, 0.06, 0.03, 0.27, 0.06].every((value, at) =>
      nclose(brow[at], value, 1e-12),
    ),
  );
  const twisted = build(person({ pose: { twist: 30 } }));
  const turn = (
    before: number[],
    after: number[],
    vertex: number,
  ): number | null => {
    const rel = (list: number[]) => [
      list[vertex * 3],
      list[vertex * 3 + 1] - 0.06,
      list[vertex * 3 + 2],
    ];
    const [a, b] = [rel(before), rel(after)];
    if (
      !nclose(a[1], b[1], 1e-9) ||
      !nclose(Math.hypot(a[0], a[2]), Math.hypot(b[0], b[2]), 1e-9)
    )
      return null;
    let delta = Math.atan2(b[0], b[2]) - Math.atan2(a[0], a[2]);
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;
    return Math.abs((delta * 180) / Math.PI);
  };
  const browAfter = meshOf(twisted, "face:face/brow").positions;
  TestValidator.predicate(
    "a rigid part turns with the head about its joint",
    [0, 1, 2].every((v) => nclose(turn(brow, browAfter, v) ?? -1, 30, 1e-6)),
  );
  const skinBefore = meshOf(neutral, "face:face/skin").positions;
  const skinAfter = meshOf(twisted, "face:face/skin").positions;
  const high = Array.from({ length: skinBefore.length / 3 }, (_, v) => v).filter(
    (v) => skinBefore[v * 3 + 1] >= 0.1 - 1e-12,
  );
  TestValidator.predicate(
    "the face skin above the neck turns with the head",
    high.length > 0 &&
      high.every((v) => {
        // The top cap's centre lies on the rotation axis and stays fixed.
        // A position oracle covers it without assigning an undefined azimuth.
        const x = skinBefore[v * 3];
        const y = skinBefore[v * 3 + 1];
        const z = skinBefore[v * 3 + 2];
        const cosine = Math.cos(Math.PI / 6);
        const sine = Math.sin(Math.PI / 6);
        return nclose(skinAfter[v * 3], cosine * x + sine * z, 1e-9) &&
          nclose(skinAfter[v * 3 + 1], y, 1e-9) &&
          nclose(skinAfter[v * 3 + 2], cosine * z - sine * x, 1e-9);
      }),
  );

  const skinG = (built: ReturnType<typeof build>): number =>
    built.model.materials.find((one) => one.id === "body:skin")!.baseColor.g;
  TestValidator.predicate(
    "a lighter face gives a lighter body",
    skinG(build(person({ color: 0.9 }))) > skinG(neutral),
  );

  TestValidator.predicate(
    "a body with its own skin colour refuses",
    throwsError(
      () =>
        build({
          ...fixture.document,
          body: {
            ...fixture.document.body,
            skinColour: { cheek: { r: 0.5, g: 0.4, b: 0.3 } },
          },
        }),
      "must not state its own skinColour",
    ),
  );
  TestValidator.predicate(
    "a face for another basis refuses",
    throwsError(
      () =>
        build({
          ...fixture.document,
          face: { ...fixture.document.face, basis: "another/1" },
        }),
      "exact compiled basis",
    ),
  );
  TestValidator.predicate(
    "a body for another basis refuses",
    throwsError(
      () =>
        build({
          ...fixture.document,
          body: { ...fixture.document.body, basis: "another/1" },
        }),
      "exact compiled basis",
    ),
  );
  const lips = createPortraitMaterials().filter(
    (material) => material.id === "lips",
  );
  TestValidator.predicate(
    "a face whose surfaces draw no skin refuses",
    throwsError(
      () =>
        createHumanPersonBuilder({
          face: {
            ...fixture.face,
            materials: lips,
            surfaces: fixture.face.surfaces.map((surface) => ({
              ...surface,
              regions: surface.regions.map((region) => ({
                ...region,
                material: "lips",
              })),
            })),
          },
          body: fixture.body,
        }),
      "draws the 'skin' material",
    ),
  );
};
