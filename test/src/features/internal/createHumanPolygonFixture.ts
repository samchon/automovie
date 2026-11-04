import type { AutoMovieHumanPolygon } from "@automovie/viewer/human-polygon";

/** Synthetic rest joints and source courses for portable polygon rendering tests. */
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
  add("head", "neck", [0, 1.6, 0], 0.08);
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
  const phases: number[] = Array.from(
    { length: 8 },
    (_: unknown, i: number): number => (i * Math.PI) / 4,
  );
  const section: (
    y: number,
    radius: number,
  ) => AutoMovieHumanPolygon.IExteriorSection = (
    y: number,
    radius: number,
  ): AutoMovieHumanPolygon.IExteriorSection => ({
    centre: [0, y, 0],
    breadth: radius * 2,
    depth: radius * 2,
    points: phases.map((phase: number): [number, number, number] => [
      radius * Math.cos(phase),
      y,
      radius * Math.sin(phase),
    ]),
    sourcePhases: phases.slice(),
    displayCoordinates: phases.slice(),
  });
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
    neckSurface: {
      units: "metres",
      phases,
      sections: [1.45, 1.48, 1.51, 1.55].map(
        (y: number): AutoMovieHumanPolygon.IExteriorSection => section(y, 0.04),
      ),
      headSections: [section(1.62, 0.1), section(1.7, 0.1)],
      crown: { end: "top", point: [0, 1.78, 0] },
    },
  };
}
