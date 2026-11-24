import { resolveAutoMovieMaterial } from "@automovie/engine";
import { IAutoMovieMaterial, IAutoMovieModel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/predicates";
import { boxModel, material } from "../../../internal/renderFixtures";

/**
 * A cross-model material id resolves to one definition, never to model order.
 *
 * Scenarios:
 *
 * 1. One declaration resolves directly, while an absent id is refused.
 * 2. Repeated complete records remain one definition even when model order and
 *    nested object property insertion differ.
 * 3. Any conflicting complete record is refused, and the diagnostic lists its
 *    model population in stable code-unit order under either input order.
 */
export function test_unit_render_scene_material_resolution(): void {
  const fabric: IAutoMovieMaterial = {
    ...material("fabric"),
    name: "woven fabric",
    baseColorTexture: {
      asset: "textures/fabric.png",
      texCoord: 0,
      colorSpace: "srgb",
      transform: {
        offset: { x: 0.25, y: 0.5 },
        scale: { x: 2, y: 3 },
        rotationDeg: 15,
      },
      sampler: {
        wrapS: "repeat",
        wrapT: "mirror",
        minFilter: "linearMipmapLinear",
        magFilter: "linear",
      },
    },
    doubleSided: true,
  };
  const reordered: IAutoMovieMaterial = {
    doubleSided: true,
    baseColorTexture: {
      sampler: {
        magFilter: "linear",
        minFilter: "linearMipmapLinear",
        wrapT: "mirror",
        wrapS: "repeat",
      },
      transform: {
        rotationDeg: 15,
        scale: { y: 3, x: 2 },
        offset: { y: 0.5, x: 0.25 },
      },
      colorSpace: "srgb",
      texCoord: 0,
      asset: "textures/fabric.png",
    },
    opacity: fabric.opacity,
    emissive: fabric.emissive,
    roughness: fabric.roughness,
    metallic: fabric.metallic,
    baseColor: fabric.baseColor,
    name: fabric.name,
    id: fabric.id,
  };
  const alpha: IAutoMovieModel = boxModel({
    id: "alpha",
    materials: [fabric, material("irrelevant")],
  });
  const zeta: IAutoMovieModel = boxModel({
    id: "zeta",
    materials: [reordered],
  });

  TestValidator.predicate(
    "one declaration and structurally equal repeats resolve identically",
    [
      resolveAutoMovieMaterial({ models: [alpha], material: "fabric" }),
      resolveAutoMovieMaterial({
        models: [alpha, zeta],
        material: "fabric",
      }),
      resolveAutoMovieMaterial({
        models: [zeta, alpha],
        material: "fabric",
      }),
    ].every((resolved: IAutoMovieMaterial): boolean => resolved === fabric),
  );
  TestValidator.equals(
    "absent ids are explicit refusals",
    [
      throwsError(
        (): IAutoMovieMaterial =>
          resolveAutoMovieMaterial({
            models: [alpha],
            material: "missing",
          }),
        ['material "missing"', "is absent"],
      ),
    ],
    [true],
  );

  const beta: IAutoMovieModel = boxModel({
    id: "beta",
    materials: [{ ...fabric, roughness: 0.25 }],
  });
  const conflict: (models: readonly IAutoMovieModel[]) => string | null = (
    models: Parameters<typeof resolveAutoMovieMaterial>[0]["models"],
  ): string | null => {
    try {
      resolveAutoMovieMaterial({ models, material: "fabric" });
      return null;
    } catch (error: unknown) {
      return (error as Error).message;
    }
  };
  TestValidator.equals(
    "conflict diagnostics are independent of candidate order",
    [conflict([zeta, beta, alpha]), conflict([alpha, beta, zeta])],
    [
      'material "fabric" has conflicting definitions in models: "alpha", "beta", "zeta".',
      'material "fabric" has conflicting definitions in models: "alpha", "beta", "zeta".',
    ],
  );
}
