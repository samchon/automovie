import { validateModel } from "@automovie/engine";
import type { IAutoMovieMaterial } from "@automovie/interface";
import {
  SUBSURFACE_TARGET,
  buildMaterial,
  subsurfaceFragment,
  subsurfaceTable,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createModel } from "../internal/fixtures";
import { hasViolation, nclose } from "../internal/predicates";

/**
 * Exercises the numerical lookup approximation, returned shader transformation and radius metadata/admission boundary.
 *
 * Scenarios:
 * 1. The no-blur table row matches clamped cosine at every tabulated coordinate.
 * 2. Intermediate blur crosses the terminator and lowers the peak; the widest row approaches the Lambertian mean.
 * 3. Independent angular integration bounds every row's Lambertian mean.
 * 4. Returned shader source replaces the supported direct diffuse response while retaining specular operations.
 * 5. All authored radius channels remain exact CPU material metadata under the subsurface hook; opaque material omits it.
 * 6. Negative/nonfinite radii refuse while the authored nonnegative radius is admitted, then locally owned materials are disposed.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual lookup/fragment/material/validation owners; judges clamped cosine, terminator transport and integrated mean with independent numeric predicates.
 * @evidence contracts/testing.md#independent-expectations An independently integrated clamped-cosine mean and authored radius values define expectations; quadrature error is bounded by stated tolerances rather than a copied table or clinical tissue model.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts no/wide/intermediate blur, translucent/opaque metadata and negative/nonfinite/admitted radii; returned source/key checks do not prove successful GPU compilation or rendered translucency.
 * @evidence contracts/testing.md#execution-ownership The named entry uses existing model records and CPU Three shader strings/materials, mutates no SDK registry and leaves shared lookup lifetime with its actual product owner.
 */
export function test_viewer_subsurface_shading(): void {
  const table: number[][] = subsurfaceTable();
  const cosines: number = table[0].length;
  const cosineAt: (i: number) => number = (i: number): number => (i / (cosines - 1)) * 2 - 1;
  TestValidator.predicate(
    "no blur is the clamped cosine",
    table[0].every((value: number, i: number): boolean =>
      nclose(value, Math.max(0, cosineAt(i)), 1e-12),
    ),
  );

  const blurs: number = table.length;
  const rowAt: (s: number) => number[] = (s: number): number[] => table[Math.round((s / Math.PI) * (blurs - 1))];
  const lookup: (row: number[], cosine: number) => number = (row: number[], cosine: number): number =>
    row[Math.round(((cosine + 1) / 2) * (cosines - 1))];
  const half: number[] = rowAt(0.5);
  TestValidator.predicate(
    "blur carries light past the terminator and off the peak",
    lookup(half, Math.cos((100 * Math.PI) / 180)) > 0.01 &&
      lookup(half, 1) < 1 &&
      table[blurs - 1].every((value: number): boolean => nclose(value, 1 / Math.PI, 0.02)),
  );

  // Integrate each row over theta, whose cosine indexes the table.
  const angleMean: (row: number[]) => number = (row: number[]): number => {
    const steps: number = 2000;
    let sum: number = 0;
    for (let k: number = 0; k < steps; k++) {
      const theta: number = ((k + 0.5) / steps) * Math.PI;
      const u: number = ((Math.cos(theta) + 1) / 2) * (cosines - 1);
      const i: number = Math.min(cosines - 2, Math.floor(u));
      const t: number = u - i;
      sum += row[i] * (1 - t) + row[i + 1] * t;
    }
    return sum / steps;
  };
  TestValidator.predicate(
    "each row keeps the Lambertian mean",
    table.every((row: number[]): boolean => nclose(angleMean(row), 1 / Math.PI, 0.01)),
  );

  const fragment: string = subsurfaceFragment(THREE.ShaderLib.physical.fragmentShader);
  const expanded: string = fragment.replace(
    /#include <(\w+)>/g,
    (_: string, name: string): string =>
      (THREE.ShaderChunk as unknown as Record<string, string>)[name] ?? "",
  );
  TestValidator.predicate(
    "the shader swaps the Lambertian direct diffuse for the table",
    !expanded.includes(SUBSURFACE_TARGET) &&
      expanded.includes(
        "subsurfaceDiffuse( dot( geometryNormal, directLight.direction ) )",
      ) &&
      expanded.includes(
        "subsurfaceCurvature = length( fwidth( normalize( vNormal ) ) )",
      ) &&
      expanded.includes("reflectedLight.directSpecular +="),
  );

  const base: IAutoMovieMaterial = createModel().materials[0]!;
  const radius: { r: number; g: number; b: number; } = { r: 0.00367, g: 0.00137, b: 0.00068 };
  const translucent: THREE.MeshPhysicalMaterial = buildMaterial({ ...base, subsurfaceRadius: radius });
  const opaque: THREE.MeshPhysicalMaterial = buildMaterial(base);
  const radiusMetadata: unknown = translucent.userData.subsurfaceRadius;
  TestValidator.predicate(
    "all supplied radius channels are retained under the subsurface hook key",
    typeof radiusMetadata === "object" && radiusMetadata !== null &&
      "r" in radiusMetadata && typeof radiusMetadata.r === "number" && nclose(radiusMetadata.r, radius.r, 0) &&
      "g" in radiusMetadata && typeof radiusMetadata.g === "number" && nclose(radiusMetadata.g, radius.g, 0) &&
      "b" in radiusMetadata && typeof radiusMetadata.b === "number" && nclose(radiusMetadata.b, radius.b, 0) &&
      translucent.customProgramCacheKey() === "automovie-subsurface" &&
      opaque.userData.subsurfaceRadius === undefined &&
      opaque.customProgramCacheKey() !== "automovie-subsurface",
  );

  const model: import("@automovie/interface").IAutoMovieModel = createModel();
  const validate: (patch: Partial<IAutoMovieMaterial>) => import("@automovie/interface").IAutoMovieValidation = (patch: Partial<IAutoMovieMaterial>): import("@automovie/interface").IAutoMovieValidation =>
    validateModel({
      model: {
        ...model,
        materials: [{ ...model.materials[0]!, ...patch } as IAutoMovieMaterial],
      },
    });
  const refusedAt: (patch: Partial<IAutoMovieMaterial>, path: string) => boolean = (patch: Partial<IAutoMovieMaterial>, path: string): boolean => {
    const result: import("@automovie/interface").IAutoMovieValidation = validate(patch);
    return (
      result.success === false &&
      result.violations.some((one: import("@automovie/interface").IAutoMovieConstraintViolation): boolean => one.path.includes(path))
    );
  };
  TestValidator.predicate(
    "a negative or nonfinite radius is refused and a nonnegative one admitted",
    hasViolation(
      validate({ subsurfaceRadius: { r: -0.001, g: 0.001, b: 0.001 } }),
      "range",
      ".subsurfaceRadius.r",
    ) &&
      refusedAt(
        { subsurfaceRadius: { r: 0.001, g: Number.NaN, b: 0.001 } },
        ".subsurfaceRadius.g",
      ) &&
      !refusedAt({ subsurfaceRadius: radius }, "subsurfaceRadius"),
  );
  translucent.dispose();
  opaque.dispose();
}
