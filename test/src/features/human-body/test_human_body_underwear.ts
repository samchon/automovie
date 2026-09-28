import { createHumanBodyUnderwear } from "@automovie/human";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanBodyUnderwearFixture } from "../internal/humanBodyUnderwearFixture";
import { nclose } from "../internal/predicates";

/**
 * The underwear is the posed skin cut by landmark rules read at rest and
 * lifted along the posed normals.
 *
 * The fixture's panels and table place every cut strictly between two grid
 * lines, so each crossing lands on the exact zero of the rule (see
 * `humanBodyUnderwearFixture` for the hand-derived heights).
 *
 * Scenarios:
 * 1. Boxer briefs on the front panel span exactly y = -0.622 (the hem, 0.305
 *    of the 0.4 m thigh below the hip joints) to -0.45 (half way to the
 *    lumbar landmark) across the whole 0.4 m width, every vertex lifted to
 *    z = 0.104, with area 0.4 x 0.172; the crown above the waistband emits
 *    no part, and the parts are named by surface.
 * 2. The posed surfaces, not the rest ones, carry the garment: moved 1 m in
 *    X, the garment moves with them while its cut stays where the rest body
 *    put it.
 * 3. Briefs: the leg line stands at the crotch, -0.624, within the gusset,
 *    at -0.568667 a third of the way out (x = 0.1), and at the outer depth
 *    beyond 0.2: -0.458 in front and -0.582 on the back panel, whose normal
 *    lifts it to z = -0.104; the waistband is at -0.41.
 * 4. The bra's band runs from -0.29 to -0.11 in front and to -0.15 behind;
 *    above it only the straps (0.07 to 0.17 from the midline) remain, up to
 *    the panel's top; the boxer style has no bra.
 * 5. Skin bound to a descendant of an uncovered bone is outside: bound from
 *    x = 0.16 on, the boxer briefs end between the last free column (0.14)
 *    and it.
 * 6. The material carries the table's colour and roughness, or the
 *    document's colour, and is double sided.
 */
export const test_human_body_underwear = (): void => {
  const { basis, table, rest, posed } = humanBodyUnderwearFixture();
  const dress = createHumanBodyUnderwear(basis, table);
  const mesh = (
    result: ReturnType<typeof dress>,
    id: string,
  ): IAutoMovieMesh => {
    const part = result.parts.find((one) => one.id === id + "/underwear")!;
    return (part.geometry as { mesh: IAutoMovieMesh }).mesh;
  };
  const axis = (m: IAutoMovieMesh, k: number) =>
    m.positions.filter((_, i) => i % 3 === k);
  const area = (m: IAutoMovieMesh) => {
    let sum = 0;
    const p = m.positions;
    const f = m.indices!;
    for (let i = 0; i < f.length; i += 3) {
      const [a, b, c] = [f[i]! * 3, f[i + 1]! * 3, f[i + 2]! * 3];
      const u = [0, 1, 2].map((k) => p[b + k]! - p[a + k]!);
      const v = [0, 1, 2].map((k) => p[c + k]! - p[a + k]!);
      sum +=
        Math.hypot(
          u[1]! * v[2]! - u[2]! * v[1]!,
          u[2]! * v[0]! - u[0]! * v[2]!,
          u[0]! * v[1]! - u[1]! * v[0]!,
        ) / 2;
    }
    return sum;
  };

  // 1. boxer briefs
  const boxer = dress({ underwear: { style: "boxer-briefs" }, rest, posed });
  const front = mesh(boxer, "front");
  TestValidator.equals(
    "one part per covered surface, none for the crown",
    boxer.parts.map((part) => part.id),
    ["front/underwear", "back/underwear"],
  );
  TestValidator.predicate(
    "the boxer's hem and waistband are the rules' exact heights",
    nclose(Math.min(...axis(front, 1)), -0.622, 1e-9) &&
      nclose(Math.max(...axis(front, 1)), -0.45, 1e-9) &&
      nclose(Math.min(...axis(front, 0)), -0.2, 1e-9) &&
      nclose(Math.max(...axis(front, 0)), 0.2, 1e-9),
  );
  TestValidator.predicate(
    "the garment is lifted by the offset along the normal",
    axis(front, 2).every((z) => nclose(z, 0.104, 1e-12)) &&
      front.normals!.every((n, i) => nclose(n, i % 3 === 2 ? 1 : 0, 1e-9)),
  );
  TestValidator.predicate(
    "the kept skin is exactly the band",
    nclose(area(front), 0.4 * 0.172, 1e-9),
  );

  // 2. posed surfaces carry it
  const moved = dress({
    underwear: { style: "boxer-briefs" },
    rest,
    posed: posed.map((surface) => ({
      ...surface,
      positions: surface.positions.map((value, i) =>
        i % 3 === 0 ? value + 1 : value,
      ),
    })),
  });
  TestValidator.predicate(
    "the garment follows the posed skin and keeps the rest cut",
    nclose(Math.min(...axis(mesh(moved, "front"), 0)), 0.8, 1e-9) &&
      nclose(Math.max(...axis(mesh(moved, "front"), 0)), 1.2, 1e-9) &&
      nclose(Math.min(...axis(mesh(moved, "front"), 1)), -0.622, 1e-9),
  );

  // 3. briefs
  const both = dress({ underwear: { style: "bra-and-briefs" }, rest, posed });
  const lowest = (m: IAutoMovieMesh, x: number) =>
    Math.min(
      ...axis(m, 1).filter((_, v) => Math.abs(m.positions[v * 3]! - x) < 1e-9),
    );
  const briefsFront = mesh(both, "front");
  const briefsBack = mesh(both, "back");
  TestValidator.predicate(
    "the leg line runs from the crotch to the outer hip",
    nclose(lowest(briefsFront, 0), -0.624, 1e-9) &&
      nclose(lowest(briefsFront, 0.1), -0.5 - 0.4 * (0.31 - 0.415 / 3), 1e-9) &&
      nclose(lowest(briefsFront, -0.2), -0.458, 1e-9) &&
      nclose(lowest(briefsBack, 0.2), -0.582, 1e-9) &&
      axis(briefsBack, 2).every((z) => nclose(z, -0.104, 1e-12)),
  );
  const lower = (m: IAutoMovieMesh) => axis(m, 1).filter((y) => y < -0.35);
  TestValidator.predicate(
    "the briefs' waistband",
    nclose(Math.max(...lower(briefsFront)), -0.41, 1e-9),
  );

  // 4. the bra
  const upper = (m: IAutoMovieMesh) =>
    [...new Array(m.positions.length / 3).keys()].filter(
      (v) => m.positions[v * 3 + 1]! > -0.35,
    );
  const ys = (m: IAutoMovieMesh) =>
    upper(m).map((v) => m.positions[v * 3 + 1]!);
  TestValidator.predicate(
    "the band's lower edge and the straps' reach",
    nclose(Math.min(...ys(briefsFront)), -0.29, 1e-9) &&
      nclose(Math.max(...ys(briefsFront)), 0, 1e-9),
  );
  const above = (m: IAutoMovieMesh, y: number) =>
    upper(m)
      .filter((v) => m.positions[v * 3 + 1]! > y + 1e-9)
      .map((v) => Math.abs(m.positions[v * 3]!));
  const centre = (m: IAutoMovieMesh) =>
    Math.max(
      ...upper(m)
        .filter((v) => Math.abs(m.positions[v * 3]!) <= 0.05 + 1e-9)
        .map((v) => m.positions[v * 3 + 1]!),
    );
  TestValidator.predicate(
    "above the band only the straps remain, the band higher in front",
    above(briefsFront, -0.11).every(
      (x) => x >= 0.07 - 1e-9 && x <= 0.17 + 1e-9,
    ) &&
      above(briefsFront, -0.11).some((x) => nclose(x, 0.07, 1e-9)) &&
      above(briefsFront, -0.11).some((x) => nclose(x, 0.17, 1e-9)) &&
      above(briefsBack, -0.15).every(
        (x) => x >= 0.07 - 1e-9 && x <= 0.17 + 1e-9,
      ) &&
      nclose(centre(briefsFront), -0.11, 1e-9) &&
      nclose(centre(briefsBack), -0.15, 1e-9),
  );
  TestValidator.equals("the boxer style wears no bra", upper(front).length, 0);

  // 5. uncovered skin
  const armed = humanBodyUnderwearFixture(0.16);
  const bare = mesh(
    createHumanBodyUnderwear(
      armed.basis,
      armed.table,
    )({
      underwear: { style: "boxer-briefs" },
      rest: armed.rest,
      posed: armed.posed,
    }),
    "front",
  );
  TestValidator.predicate(
    "the arm's skin is left bare",
    Math.max(...axis(bare, 0)) > 0.14 &&
      Math.max(...axis(bare, 0)) < 0.16 &&
      nclose(Math.min(...axis(bare, 0)), -0.2, 1e-9),
  );

  // 6. material
  TestValidator.equals("the table's fabric", boxer.material, {
    id: "underwear",
    name: "underwear",
    baseColor: { r: 0.5, g: 0.4, b: 0.3, a: 1, hex: null },
    metallic: 0,
    roughness: 0.8,
    emissive: null,
    opacity: 1,
    baseColorTexture: null,
    doubleSided: true,
  });
  TestValidator.equals(
    "the document's colour",
    dress({
      underwear: { style: "boxer-briefs", color: { r: 0, g: 1, b: 0.25 } },
      rest,
      posed,
    }).material.baseColor,
    { r: 0, g: 1, b: 0.25, a: 1, hex: null },
  );
};
