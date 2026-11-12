import type { AutoMovieHumanPolygon } from "@automovie/render";

/** Synthetic rest joints for portable polygon rendering tests; the polygon reads the skeleton alone. */
export function createHumanPolygonFixture(): AutoMovieHumanPolygon.IInput {
  const bones: AutoMovieHumanPolygon.IBone[] = [];
  const add: (
    bone: string,
    parent: string | null,
    position: [number, number, number],
    radius?: number,
    tip?: [number, number, number],
  ) => void = (
    bone: string,
    parent: string | null,
    position: [number, number, number],
    radius: number = 0.04,
    tip?: [number, number, number],
  ): void => {
    bones.push({ bone, parent, position, radius, tip: tip ?? null });
  };
  add("hips", null, [0, 0.9, 0], 0.08);
  add("spine", "hips", [0, 1.1, 0], 0.07);
  add("chest", "spine", [0, 1.3, 0], 0.08);
  add("neck", "chest", [0, 1.5, 0], 0.04);
  add("head", "neck", [0, 1.6, 0], 0.08, [0, 1.78, 0]);
  for (const side of ["left", "right"]) {
    const sign: number = side === "left" ? 1 : -1;
    add(`${side}UpperArm`, "chest", [0, 1.4, sign * 0.2]);
    add(`${side}LowerArm`, `${side}UpperArm`, [0.25, 1.35, sign * 0.3]);
    add(`${side}Hand`, `${side}LowerArm`, [0.45, 1.3, sign * 0.3]);
    for (const [index, digit] of [
      "Index",
      "Middle",
      "Ring",
      "Little",
    ].entries()) {
      const z: number = sign * (0.25 + index * 0.03);
      add(`${side}${digit}Proximal`, `${side}Hand`, [0.55, 1.3, z], 0.01, [
        0.65,
        1.3,
        z,
      ]);
    }
    add(`${side}UpperLeg`, "hips", [0, 0.9, sign * 0.1], 0.06);
    add(`${side}LowerLeg`, `${side}UpperLeg`, [0, 0.5, sign * 0.1], 0.05);
    add(`${side}Subtalar`, `${side}LowerLeg`, [0, 0.1, sign * 0.1]);
    add(`${side}Midfoot`, `${side}Subtalar`, [0.1, 0.07, sign * 0.1]);
    add(`${side}ToeA`, `${side}Midfoot`, [0.25, 0.05, sign * 0.08], 0.015, [
      0.3,
      0.05,
      sign * 0.08,
    ]);
    add(`${side}ToeB`, `${side}Midfoot`, [0.25, 0.05, sign * 0.12], 0.015, [
      0.3,
      0.05,
      sign * 0.12,
    ]);
  }
  return {
    bones,
    posed: bones.map(
      (
        bone: AutoMovieHumanPolygon.IBone,
      ): AutoMovieHumanPolygon.IPlacement => ({
        bone: bone.bone,
        position: [...bone.position],
        rotation: [0, 0, 0, 1],
      }),
    ),
  };
}
