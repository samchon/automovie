import {
  HUMAN_BODY_SKIN_SITES,
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanBodySkinSites,
  admitHumanBodyBasisDocument,
  createHumanBodyBasisBuilder,
  createHumanBodySkinColour,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

type Rgb = [number, number, number];

const CHEEK: Rgb = [0.463, 0.2714, 0.2091];
const fit = (
  site: keyof IAutoMovieHumanBodySkinSites["sites"],
  cheek = CHEEK,
) =>
  HUMAN_BODY_SKIN_SITES.sites[site].map(([a, b], k) =>
    Math.min(1, Math.exp(a) * cheek[k] ** b),
  ) as Rgb;
const unswept: IAutoMovieHumanBodySkinSites = {
  ...HUMAN_BODY_SKIN_SITES,
  sweeps: 0,
};

/**
 * A closed octahedron (vertices on ±X, ±Y, ±Z, so each vertex normal is its
 * own axis) bound whole to one bone of the analytic fixture renamed `bone`,
 * whose flexion reference is +Z.
 */
function octahedron(bone: string): IAutoMovieHumanBodyBasis {
  const { basis } = humanBodyBasisFixture();
  const positions = [1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1];
  const indices = [
    0, 2, 4, 4, 2, 1, 1, 2, 5, 5, 2, 0, 0, 4, 3, 4, 1, 3, 1, 5, 3, 5, 0, 3,
  ];
  return {
    ...basis,
    joints: [
      { ...basis.joints[0], bone: bone as "hips", reference: [0, 0, 1] },
    ],
    surfaces: [
      {
        ...basis.surfaces[0],
        positions,
        indices,
        skin: {
          joints: [bone as "hips"],
          boneIndices: Array.from({ length: 24 }, () => 0),
          weights: Array.from({ length: 6 }, () => [1, 0, 0, 0]).flat(),
        },
      },
    ],
  };
}

/** The albedo the multipliers give back at a vertex. */
const albedoAt = (
  result: { base: Rgb; colors: number[][] },
  vertex: number,
): Rgb =>
  [0, 1, 2].map(
    (k) => result.colors[0][vertex * 3 + k] * result.base[k],
  ) as Rgb;
const same = (a: Rgb, b: Rgb, eps = 1e-12) =>
  a.every((value, k) => nclose(value, b[k], eps));

/**
 * A body's skin is coloured by anatomical site from the cheek albedo the face
 * wears, and meets the face in that colour at the neck's cut.
 *
 * Scenarios:
 * 1. Each site's albedo is the table's power `exp(a) · cheek^b`, capped at
 *    1: a white cheek takes the neck's green, whose factor exceeds one, to 1,
 *    and leaves the palm's below it.
 * 2. On the octahedron, unswept: a hand vertex facing its flexion direction
 *    is palm and the one facing away the back of the hand, a side vertex
 *    part palm by the smoothstep; a foot's underside is sole (the palm's
 *    albedo) and its top half exposed, half protected; a forearm is exposed,
 *    a shank half exposed, the neck the neck's, a bone of none of these
 *    protected.
 * 3. The multipliers are the albedo over a base that is each channel's
 *    largest albedo, so every multiplier lies in (0, 1] and one reaches 1.
 * 4. The diffusion mixes sites: swept, the palm vertex is no longer pure
 *    palm, and every vertex stays a mixture of the sites' albedos.
 * 5. On an open tube, the collar: the boundary vertex wears the cheek, a
 *    vertex past the band the sites alone, one half way a smoothstep blend.
 * 6. Through the builder: a document naming a cheek colours the skin
 *    material's regions (the analytic box, every vertex protected: the base
 *    is the protected albedo and every multiplier 1), and one without keeps
 *    the material colour and no multipliers.
 * 7. Refusals: a cheek of 0 or above 1 in any channel, a cheek beside a
 *    colour override of the skin material, a cheek on a basis without the
 *    skin material, and a nonfinite cheek at admission; a roughness
 *    override beside the cheek, and a finite cheek at admission, are
 *    admitted.
 */
export const test_human_body_skin_sites = (): void => {
  const white: Rgb = [1, 1, 1];
  TestValidator.predicate(
    "a site's albedo is capped at one",
    Math.exp(HUMAN_BODY_SKIN_SITES.sites.neck[1][0]) > 1 &&
      fit("neck", white)[1] === 1 &&
      fit("palmar", white)[1] < 1 &&
      same(
        albedoAt(
          createHumanBodySkinColour(octahedron("neck"), unswept)(white),
          0,
        ),
        fit("neck", white),
      ),
  );

  const hand = createHumanBodySkinColour(
    octahedron("leftHand"),
    unswept,
  )(CHEEK);
  const side = (() => {
    const t = (0 + 0.1) / 0.5;
    return t * t * (3 - 2 * t);
  })();
  TestValidator.predicate(
    "the palm faces the flexion and the back of the hand away from it",
    same(albedoAt(hand, 4), fit("palmar")) &&
      same(albedoAt(hand, 5), fit("dorsal")) &&
      same(
        albedoAt(hand, 0),
        fit("palmar").map(
          (value, k) => side * value + (1 - side) * fit("dorsal")[k],
        ) as Rgb,
      ),
  );
  const foot = createHumanBodySkinColour(
    octahedron("leftFoot"),
    unswept,
  )(CHEEK);
  TestValidator.predicate(
    "the sole is the palm's and the top of the foot half exposed",
    same(albedoAt(foot, 3), fit("palmar")) &&
      same(
        albedoAt(foot, 2),
        fit("exposed").map(
          (value, k) => 0.5 * value + 0.5 * fit("protected")[k],
        ) as Rgb,
      ),
  );
  for (const [bone, expected] of [
    ["leftLowerArm", fit("exposed")],
    [
      "rightLowerLeg",
      fit("exposed").map((value, k) => 0.5 * value + 0.5 * fit("protected")[k]),
    ],
    ["neck", fit("neck")],
    ["head", fit("neck")],
    ["spine", fit("protected")],
  ] as const)
    TestValidator.predicate(
      `${bone} takes its site`,
      [0, 1, 2, 3, 4, 5].every((vertex) =>
        same(
          albedoAt(
            createHumanBodySkinColour(octahedron(bone), unswept)(CHEEK),
            vertex,
          ),
          expected as Rgb,
        ),
      ),
    );

  const multipliers = hand.colors[0];
  TestValidator.predicate(
    "the multipliers lie in (0, 1] and each channel reaches 1",
    multipliers.every((value) => value > 0 && value <= 1) &&
      [0, 1, 2].every((k) =>
        [0, 1, 2, 3, 4, 5].some((v) => multipliers[v * 3 + k] === 1),
      ),
  );

  const swept = createHumanBodySkinColour(octahedron("leftHand"))(CHEEK);
  const palm = albedoAt(swept, 4);
  TestValidator.predicate(
    "the sites meet softly",
    !same(palm, fit("palmar")) &&
      [0, 1, 2].every(
        (k) =>
          palm[k] <= Math.max(fit("palmar")[k], fit("dorsal")[k]) + 1e-12 &&
          palm[k] >= Math.min(fit("palmar")[k], fit("dorsal")[k]) - 1e-12,
      ),
  );

  // an open tube, 8 around, rings every centimetre over 10 cm, bound to the
  // spine (protected)
  const { basis, document } = humanBodyBasisFixture();
  const positions: number[] = [];
  for (let r = 0; r <= 10; r++)
    for (let s = 0; s < 8; s++)
      positions.push(
        0.1 * Math.cos((s * Math.PI) / 4),
        r / 100,
        0.1 * Math.sin((s * Math.PI) / 4),
      );
  const indices: number[] = [];
  for (let r = 0; r < 10; r++)
    for (let s = 0; s < 8; s++) {
      const a = r * 8 + s;
      const b = r * 8 + ((s + 1) % 8);
      indices.push(a, a + 8, b, b, a + 8, b + 8);
    }
  const tube: IAutoMovieHumanBodyBasis = {
    ...basis,
    surfaces: [
      {
        ...basis.surfaces[0],
        positions,
        indices,
        skin: {
          joints: ["spine"],
          boneIndices: positions.flatMap((_, i) =>
            i % 3 === 0 ? [0, 0, 0, 0] : [],
          ),
          weights: positions.flatMap((_, i) =>
            i % 3 === 0 ? [1, 0, 0, 0] : [],
          ),
        },
      },
    ],
  };
  const collared = createHumanBodySkinColour(tube)(CHEEK);
  const half = 1 - 0.5 * 0.5 * (3 - 2 * 0.5);
  TestValidator.predicate(
    "the cut wears the cheek, the band blends, past it the sites",
    same(albedoAt(collared, 0), CHEEK) &&
      same(albedoAt(collared, 5 * 8), fit("protected")) &&
      same(
        albedoAt(collared, 2 * 8),
        CHEEK.map(
          (value, k) => half * value + (1 - half) * fit("protected")[k],
        ) as Rgb,
        1e-9,
      ),
  );

  const build = createHumanBodyBasisBuilder(basis);
  const skinColour = { cheek: { r: CHEEK[0], g: CHEEK[1], b: CHEEK[2] } };
  const coloured = build({ ...document, skinColour });
  const material = coloured.model.materials.find((one) => one.id === "skin")!;
  const geometry = coloured.model.parts[0].geometry;
  TestValidator.predicate(
    "a cheek colours the skin material's regions",
    geometry.type === "mesh" &&
      geometry.mesh.colors !== undefined &&
      geometry.mesh.colors.length === geometry.mesh.positions.length &&
      geometry.mesh.colors.every((value) => nclose(value, 1, 1e-12)) &&
      same(
        [material.baseColor.r, material.baseColor.g, material.baseColor.b],
        fit("protected"),
      ),
  );
  // the second document reads the sites the first one computed
  const again = build({ ...document, skinColour }).model.parts[0].geometry;
  TestValidator.predicate(
    "the same cheek colours the same way again",
    again.type === "mesh" &&
      geometry.type === "mesh" &&
      again.mesh.colors!.every(
        (value, i) => value === geometry.mesh.colors![i],
      ),
  );
  const plain = build(document);
  const plainGeometry = plain.model.parts[0].geometry;
  TestValidator.predicate(
    "without a cheek the material keeps its colour",
    plainGeometry.type === "mesh" &&
      plainGeometry.mesh.colors === undefined &&
      plain.model.materials[0].baseColor.r === basis.materials[0].baseColor.r,
  );

  for (const [title, cheek] of [
    ["zero", { r: 0, g: 0.2, b: 0.2 }],
    ["above one", { r: 0.5, g: 1.01, b: 0.2 }],
  ] as const)
    TestValidator.predicate(
      `a cheek ${title} is refused`,
      throwsError(
        () => build({ ...document, skinColour: { cheek } }),
        "Body skin colour",
      ),
    );
  TestValidator.predicate(
    "a cheek beside a skin colour override is refused",
    throwsError(
      () =>
        build({
          ...document,
          skinColour,
          materials: { skin: { color: { r: 0.5, g: 0.3, b: 0.2 } } },
        }),
      "Body skin colour",
    ),
  );
  TestValidator.predicate(
    "a roughness override beside the cheek is admitted",
    !throwsError(() =>
      build({
        ...document,
        skinColour,
        materials: { skin: { roughness: 0.4 } },
      }),
    ),
  );
  const bare: IAutoMovieHumanBodyBasis = {
    ...basis,
    materials: basis.materials.map((one) => ({ ...one, id: "flesh" })),
    surfaces: basis.surfaces.map((surface) => ({
      ...surface,
      regions: surface.regions.map((region) => ({
        ...region,
        material: "flesh",
      })),
    })),
  };
  TestValidator.predicate(
    "a cheek on a basis without the skin material is refused",
    throwsError(
      () => createHumanBodyBasisBuilder(bare)({ ...document, skinColour }),
      "Body skin colour",
    ),
  );
  TestValidator.predicate(
    "a nonfinite cheek is refused at admission and a finite one admitted",
    throwsError(() =>
      admitHumanBodyBasisDocument({
        ...document,
        skinColour: { cheek: { r: Number.NaN, g: 0.2, b: 0.2 } },
      }),
    ) &&
      !throwsError(() =>
        admitHumanBodyBasisDocument({ ...document, skinColour }),
      ),
  );
};
