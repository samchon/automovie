import {
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanBodyBasisDocument,
  type IAutoMovieHumanBodySkinDetail,
  createHumanBodyBasisBuilder,
  createHumanBodySkinDetailTexture,
} from "@automovie/human";
import type { IAutoMovieTextureReference } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { namedFacts, nclose, throwsError } from "../internal/predicates";

type Surface = IAutoMovieHumanBodyBasis["surfaces"][number];

const FLAT: IAutoMovieHumanBodySkinDetail = {
  seed: 1,
  pixels: 32,
  tileMillimetres: 10,
  lines: [],
  pores: {
    perSquareCentimetre: 1,
    radiusMicrometres: 300,
    depthMicrometres: 0,
  },
  age: [[0, 1]],
};

/** The analytic box's surface given a UV layout, as the relief test lays it. */
function textured(surface: Surface): Surface {
  const uvs = surface.regions[0].indices.flatMap((v) => [
    surface.positions[v * 3] / 2 + 0.5,
    surface.positions[v * 3 + 1] / 2,
  ]);
  return {
    ...surface,
    regions: [{ ...surface.regions[0], uvs }],
  };
}

/**
 * The veins show as far as the tissue over the lean body lets them.
 *
 * The box's lean body is the fixture's narrowest (`width` −1), and the veins
 * lie over its bottom ring.
 *
 * Scenarios:
 * 1. A document at the lean body shows the veins at its own strength, as a
 *    tint (`multiply`) with its normal map, clamped, under the nails listed
 *    after it.
 * 2. A wider body carries tissue over its lean self: its veins show at the
 *    strength times `exp(-attenuation · t)`, `t` the mean outward tissue at
 *    the veins' vertices read off the two built meshes, and a wider one
 *    still shows them less. A posed document reads its rest shape.
 * 3. Without `skinVeins` the veins are not bound, and a strength outside
 *    [0, 1] is refused.
 * 4. Each region's veins layer shows by the tissue over its own vertices,
 *    several veins layers and the nails composite in their listed order.
 * 5. Veins on a surface without a declared lean body, at a nonpositive or
 *    nonfinite attenuation, over no vertex or a vertex the surface lacks,
 *    and a fifth layer on one material are refused.
 */
export const test_human_body_skin_veins = (): void => {
  const { basis, document } = humanBodyBasisFixture();
  const png = createHumanBodySkinDetailTexture(FLAT);
  const box: Surface = {
    ...textured(basis.surfaces[0]),
    sag: {
      lean: { width: -1 },
      gain: 0,
      sweeps: 0,
      softness: { base: 0, channels: {}, range: [0, 1] },
    },
  };
  const veins = {
    kind: "veins" as const,
    material: "skin",
    color: png,
    normal: png,
    vertices: [0, 1, 2, 3],
    attenuation: 20,
  };
  const nails = {
    kind: "nails" as const,
    material: "skin",
    color: png,
    roughness: 0.25,
  };
  const withOverlays = (
    overlays: unknown[],
    surface: Surface = box,
  ): IAutoMovieHumanBodyBasis => ({
    ...basis,
    surfaces: [{ ...surface, overlays } as Surface],
  });
  const build = createHumanBodyBasisBuilder(withOverlays([veins, nails]));
  const at = (
    width: number,
    extra: Partial<IAutoMovieHumanBodyBasisDocument> = {},
  ) =>
    build({
      ...document,
      shape: { width },
      skinDetail: { strength: 0.5 },
      skinVeins: { strength: 0.8 },
      ...extra,
    });
  const skinOf = (built: ReturnType<typeof build>) =>
    built.model.materials.find((one) => one.id === "skin")!;

  const lean = skinOf(at(-1));
  const tint = lean.overlays?.[0];
  TestValidator.predicate(
    "at the lean body the veins show at their strength, under the nails",
    lean.overlays?.length === 2 &&
      tint!.blend === "multiply" &&
      nclose(tint!.strength, 0.8, 1e-12) &&
      (tint!.baseColorTexture as IAutoMovieTextureReference).sampler!.wrapS ===
        "clamp" &&
      (tint!.normalTexture as IAutoMovieTextureReference).colorSpace ===
        "linear" &&
      lean.overlays![1]!.blend === "replace",
  );

  // the tissue the wider body carries, read off the built meshes: the
  // built vertices follow the region's corners in first-occurrence order
  const order: number[] = [];
  for (const source of box.regions[0].indices)
    if (!order.includes(source)) order.push(source);
  const meshOf = (built: ReturnType<typeof build>) => {
    const geometry = built.model.parts[0].geometry;
    if (geometry.type !== "mesh") throw new Error("expected a mesh");
    return geometry.mesh;
  };
  const tissue = (width: number): number => {
    const body = meshOf(at(width));
    const thin = meshOf(at(-1));
    let total = 0;
    for (const v of veins.vertices) {
      const k = order.indexOf(v);
      let along = 0;
      for (let c = 0; c < 3; c++)
        along +=
          (body.positions[k * 3 + c] - thin.positions[k * 3 + c]) *
          body.normals![k * 3 + c];
      total += Math.max(0, along);
    }
    return total / veins.vertices.length;
  };
  const wide = skinOf(at(0)).overlays![0]!.strength;
  const wider = skinOf(at(1)).overlays![0]!.strength;
  const posed = skinOf(
    at(0, {
      pose: [{ bone: "spine", flexion: 20, abduction: null, twist: null }],
    }),
  ).overlays![0]!.strength;
  TestValidator.predicate(
    "tissue over the lean body hides the veins",
    tissue(0) > 0 &&
      nclose(wide, 0.8 * Math.exp(-20 * tissue(0)), 1e-9) &&
      wider < wide &&
      nclose(posed, wide, 1e-12),
  );

  const regions = skinOf(
    createHumanBodyBasisBuilder(
      withOverlays([veins, { ...veins, vertices: [4, 5, 6, 7] }, nails]),
    )({
      ...document,
      shape: { width: 0, tall: 1 },
      skinDetail: { strength: 0.5 },
      skinVeins: { strength: 0.8 },
    }),
  ).overlays!;
  TestValidator.predicate(
    "each region's veins show by the tissue over their own vertices",
    regions.length === 3 &&
      regions[0]!.blend === "multiply" &&
      regions[1]!.blend === "multiply" &&
      regions[2]!.blend === "replace" &&
      regions[0]!.strength !== regions[1]!.strength,
  );

  TestValidator.predicate(
    "without skinVeins no veins are bound, and a bad strength is refused",
    skinOf(at(0, { skinVeins: undefined })).overlays?.length === 1 &&
      throwsError(
        () => at(0, { skinVeins: { strength: 1.5 } }),
        "Body skin veins",
      ),
  );

  const refused = (overlays: unknown[], surface: Surface = box): boolean =>
    throwsError(
      () => createHumanBodyBasisBuilder(withOverlays(overlays, surface)),
      "Body surface overlays",
    );
  TestValidator.equals(
    "malformed veins are refused",
    namedFacts([
      ["noLean", () => refused([veins], { ...box, sag: undefined })],
      ["attenuation", () => refused([{ ...veins, attenuation: 0 }])],
      ["infinite", () => refused([{ ...veins, attenuation: Infinity }])],
      ["empty", () => refused([{ ...veins, vertices: [] }])],
      ["missing", () => refused([{ ...veins, vertices: [0, 8] }])],
      ["fraction", () => refused([{ ...veins, vertices: [0.5] }])],
      ["five", () => refused([veins, veins, veins, veins, nails])],
    ]),
    {
      noLean: true,
      attenuation: true,
      infinite: true,
      empty: true,
      missing: true,
      fraction: true,
      five: true,
    },
  );
};
