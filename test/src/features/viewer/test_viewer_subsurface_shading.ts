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
 * A material's subsurface radius turns its direct diffuse response into the
 * pre-integrated response of a translucent surface, and nothing else.
 *
 * Scenarios:
 * 1. The table's first row, no blur, is the clamped cosine at every
 *    tabulated cosine.
 * 2. Blur carries light past the terminator and off the lit peak: at a
 *    blur of half a radian a surface facing away at 100 degrees receives
 *    light and a surface facing the light receives less than one; at the
 *    widest blur every angle receives about the Lambertian mean, 1/π.
 * 3. The blur conserves light: integrated over the circle's angle, each
 *    row keeps the clamped cosine's mean, 1/π.
 * 4. The fragment shader loses the Lambertian direct diffuse line and gains
 *    the table read and the curvature estimate; specular stays.
 * 5. A material with a radius builds a physical material that carries it
 *    and compiles under its own program key; one without is untouched.
 * 6. Validation refuses a negative or nonfinite radius and admits a
 *    nonnegative one.
 */
export const test_viewer_subsurface_shading = (): void => {
  const table = subsurfaceTable();
  const cosines = table[0].length;
  const cosineAt = (i: number) => (i / (cosines - 1)) * 2 - 1;
  TestValidator.predicate(
    "no blur is the clamped cosine",
    table[0].every((value, i) =>
      nclose(value, Math.max(0, cosineAt(i)), 1e-12),
    ),
  );

  const blurs = table.length;
  const rowAt = (s: number) => table[Math.round((s / Math.PI) * (blurs - 1))];
  const lookup = (row: number[], cosine: number) =>
    row[Math.round(((cosine + 1) / 2) * (cosines - 1))];
  const half = rowAt(0.5);
  TestValidator.predicate(
    "blur carries light past the terminator and off the peak",
    lookup(half, Math.cos((100 * Math.PI) / 180)) > 0.01 &&
      lookup(half, 1) < 1 &&
      table[blurs - 1].every((value) => nclose(value, 1 / Math.PI, 0.02)),
  );

  // integrate each row over the angle θ, whose cosine the table is indexed by
  const angleMean = (row: number[]) => {
    const steps = 2000;
    let sum = 0;
    for (let k = 0; k < steps; k++) {
      const theta = ((k + 0.5) / steps) * Math.PI;
      const u = ((Math.cos(theta) + 1) / 2) * (cosines - 1);
      const i = Math.min(cosines - 2, Math.floor(u));
      const t = u - i;
      sum += row[i] * (1 - t) + row[i + 1] * t;
    }
    return sum / steps;
  };
  TestValidator.predicate(
    "each row keeps the Lambertian mean",
    table.every((row) => nclose(angleMean(row), 1 / Math.PI, 0.01)),
  );

  const fragment = subsurfaceFragment(THREE.ShaderLib.physical.fragmentShader);
  const expanded = fragment.replace(
    /#include <(\w+)>/g,
    (_, name: string) =>
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

  const base = createModel().materials[0]!;
  const radius = { r: 0.00367, g: 0.00137, b: 0.00068 };
  const translucent = buildMaterial({ ...base, subsurfaceRadius: radius });
  const opaque = buildMaterial(base);
  TestValidator.predicate(
    "a radius builds a translucent material under its own program key",
    translucent.userData.subsurfaceRadius.r === radius.r &&
      translucent.customProgramCacheKey() === "automovie-subsurface" &&
      opaque.userData.subsurfaceRadius === undefined &&
      opaque.customProgramCacheKey() !== "automovie-subsurface",
  );

  const model = createModel();
  const validate = (patch: Partial<IAutoMovieMaterial>) =>
    validateModel({
      model: {
        ...model,
        materials: [{ ...model.materials[0]!, ...patch } as IAutoMovieMaterial],
      },
    });
  const refusedAt = (patch: Partial<IAutoMovieMaterial>, path: string) => {
    const result = validate(patch);
    return (
      result.success === false &&
      result.violations.some((one) => one.path.includes(path))
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
};
