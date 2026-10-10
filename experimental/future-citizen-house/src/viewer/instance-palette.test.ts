import { srgbHexToLinearColor } from "@automovie/engine";
import assert from "node:assert/strict";
import * as THREE from "three";

import { Assembly, initialState, v } from "../house/assembly";
import { materialFinish } from "../materials/001-binding-and-scale";
import { instancePaletteReference } from "./instance-palette";
import { uploadHouse } from "./scene";

/** Declared reference uses the selected recipe; malformed declarations refuse. */
export function verifyPaletteReference(): void {
  const finishes = [
    materialFinish("wood", "#c7a571", 0.5),
    materialFinish("fabric", "#eeeae1", 0.8),
  ];
  assert.equal(
    instancePaletteReference(finishes, {}, "member/model"),
    undefined,
  );
  assert.equal(
    instancePaletteReference(
      finishes,
      { "palette-material-index": 1 },
      "member/model",
    ),
    finishes[1].baseColor,
  );
  for (const index of [-1, 0.5, Number.NaN, 2])
    assert.throws(
      () =>
        instancePaletteReference(
          finishes,
          { "palette-material-index": index },
          "member/model",
        ),
      /member\/model: invalid palette material index/,
    );
  for (const r of [0, Number.NaN, 1.01])
    assert.throws(
      () =>
        instancePaletteReference(
          [{ ...finishes[0], baseColor: { ...finishes[0].baseColor, r } }],
          { "palette-material-index": 0 },
          "member/model",
        ),
      /reference RGB/,
    );
}

/** Actual batch upload preserves part colour ratios, including the old consumer. */
export function verifyPaletteUpload(): void {
  const finishes = [
    materialFinish("wood", "#c7a571", 0.5),
    materialFinish("fabric", "#eeeae1", 0.8),
  ];
  const reference = finishes[0].baseColor;
  const mesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    uvs: [0, 0, 1, 0, 0, 1],
    indices: [0, 1, 2],
    skin: null,
  };
  for (const mode of ["none", "absolute", "common", "variation"] as const) {
    const palette =
      mode === "absolute"
        ? srgbHexToLinearColor("#ffffff")
        : mode === "variation"
          ? srgbHexToLinearColor("#808080")
          : reference;
    const payload = {
      environment: new Assembly(initialState).environment,
      textures: [],
      models: [
        {
          id: "two-finishes",
          materials: finishes,
          parts: finishes.map((f) => ({
            id: f.id,
            material: f.id,
            transform: null,
            mesh,
          })),
        },
      ],
      placements: [
        {
          node: "member",
          model: "two-finishes",
          position: v(0, 0, 0),
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: v(1, 1, 1),
          ...(mode === "none" ? {} : { palette }),
          ...(mode === "common" || mode === "variation"
            ? { paletteReference: reference }
            : {}),
        },
      ],
    };
    const root = uploadHouse(payload);
    const batches = root.children.filter(
      (child): child is THREE.Mesh => child instanceof THREE.Mesh,
    );
    assert.equal(batches.length, 2);
    for (let i = 0; i < batches.length; i++) {
      const color = batches[i].geometry.getAttribute("color");
      if (mode === "none") assert.equal(color, undefined);
      else {
        const expected =
          mode === "absolute"
            ? 1 / finishes[i].baseColor.r
            : mode === "variation"
              ? palette.r / reference.r
              : 1;
        assert.ok(Math.abs(color.getX(0) - expected) < 1e-5);
      }
      batches[i].geometry.dispose();
    }
  }
}
