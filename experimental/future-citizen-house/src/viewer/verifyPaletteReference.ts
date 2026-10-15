import assert from "node:assert/strict";
import { materialFinish } from "../materials/materialFinish";
import { instancePaletteReference } from "./instancePaletteReference";

/** Declared reference uses the selected recipe; malformed declarations refuse. */

export function verifyPaletteReference(): void {
  const finishes = [
    materialFinish("wood", "#c7a571", 0.5),
    materialFinish("fabric", "#eeeae1", 0.8),
  ];
  assert.equal(
    instancePaletteReference(finishes, {}, "member/model"),
    undefined
  );
  assert.equal(
    instancePaletteReference(
      finishes,
      { "palette-material-index": 1 },
      "member/model"
    ),
    finishes[1].baseColor
  );
  for (const index of [-1, 0.5, Number.NaN, 2])
    assert.throws(
      () => instancePaletteReference(
        finishes,
        { "palette-material-index": index },
        "member/model"
      ),
      /member\/model: invalid palette material index/
    );
  for (const r of [0, Number.NaN, 1.01])
    assert.throws(
      () => instancePaletteReference(
        [{ ...finishes[0], baseColor: { ...finishes[0].baseColor, r } }],
        { "palette-material-index": 0 },
        "member/model"
      ),
      /reference RGB/
    );
}
