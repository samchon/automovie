import {
  type IPortraitInterior,
  assertPortraitInteriorBindings,
  buildPortraitHead,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceFixture } from "../internal/humanFaceFixture";
import { throwsError } from "../internal/predicates";

/**
 * Native identity admission reads declared correspondence without joining nearby
 * geometry. A hand-authored centimetre triangle supplies exact mm coordinates.
 * The real head consumer must apply the same admission before model packing.
 *
 * Scenarios:
 * 1. Empty/omitted declarations, indexed and sequential triangles, a skin join
 *    and a join to a later interior pass without mutating caller-owned inputs.
 * 2. Reversing the part order retains valid resident identities and coordinates.
 * 3. A real head accepts an exact copied skin attachment and refuses the same
 *    component displaced by 1 mm, while retaining the original host in both.
 */
export const test_subject_native_bindings = (): void => {
  const skin = {
    positions: [
      [0, 0, 0],
      [10, 0, 0],
      [0, 10, 0],
    ],
  };
  const first: IPortraitInterior = {
    id: "first",
    material: "teeth",
    mesh: {
      positions: skin.positions.flat(),
      indices: [0, 1, 2],
      normals: null,
      uvs: null,
      skin: null,
    },
    loops: [{ name: "rim", vertices: [0, 1, 2] }],
    attachments: [
      { vertex: 0, target: { part: null, vertex: 0 } },
      { vertex: 1, target: { part: "later", vertex: 1 } },
    ],
  };
  const later = { ...structuredClone(first), id: "later", attachments: [] };
  later.mesh.indices = null;
  const parts = [first, later];
  const saved = structuredClone({ skin, parts });
  assertPortraitInteriorBindings(skin, []);
  assertPortraitInteriorBindings(skin, parts);
  assertPortraitInteriorBindings(skin, [...parts].reverse());
  assertPortraitInteriorBindings(skin, [
    { ...first, loops: [], attachments: [] },
  ]);
  assertPortraitInteriorBindings(skin, [
    { id: "undeclared", material: "teeth", mesh: first.mesh },
  ]);
  TestValidator.equals(
    "native admission owns no arrays",
    { skin, parts },
    saved,
  );

  const { host } = humanFaceFixture().basis;
  const before = structuredClone(host);
  const component = (offset: number) => ({
    id: "bound",
    fit: () => ({
      constraints: [],
      cutFaces: [],
      attach: () => ({
        openings: [],
        prepareInteriors: (surface: typeof skin): IPortraitInterior[] => [
          {
            id: "bound",
            material: "teeth",
            mesh: {
              ...first.mesh,
              positions: [
                surface.positions[0][0] + offset,
                ...surface.positions[0].slice(1),
                ...surface.positions[1],
                ...surface.positions[2],
              ],
            },
            attachments: [{ vertex: 0, target: { part: null, vertex: 0 } }],
          },
        ],
        finish: () => [],
      }),
    }),
  });
  const model = buildPortraitHead(host, [component(0)], 0);
  TestValidator.equals(
    "valid native interior reaches output",
    model.parts.at(-1)?.id,
    "bound",
  );
  TestValidator.predicate(
    "head refuses divergent declared attachment",
    throwsError(
      () => buildPortraitHead(host, [component(1)], 0),
      "agree exactly",
    ),
  );
  TestValidator.equals("head admission retains the host", host, before);
};
