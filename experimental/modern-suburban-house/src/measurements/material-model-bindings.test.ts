/** Model-qualified building finishes cover actual generated face partitions. */
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { buildingModelFinish } from "../materials/model-bindings";
import { Closet } from "../models/closet";
import { ExteriorDoor } from "../models/exterior-door";
import { AsphaltShingle } from "../models/exterior/shingle";
import { Siding } from "../models/exterior/siding";
import { ExteriorCornerTrim } from "../models/exterior/trim";
import { GarageDoor } from "../models/garage-door";
import { InteriorDoor } from "../models/interior-door";
import { Baseboard } from "../models/interior/baseboard";
import { StairBaluster } from "../models/stair-baluster";
import { StairSkirt } from "../models/stair-skirt";
import { Windows } from "../models/windows";

type Built = {
  model: { id: string; parts: readonly { id: string }[] };
  faceByPart: Readonly<Record<string, string>>;
};

const check = (built: Built): void => {
  assert.ok(built.model.parts.length > 0, `${built.model.id} empty`);
  assert.equal(Object.keys(built.faceByPart).length, built.model.parts.length);
  for (const part of built.model.parts) {
    const face = built.faceByPart[part.id];
    assert.ok(face, `${built.model.id}/${part.id} has no face id`);
    assert.ok(buildingModelFinish(built.model.id, face).material.id);
  }
};

void test("window and exterior door faces retain their different model-qualified finishes", () => {
  const windows = new Windows();
  check(
    windows.build({
      id: "living-front-window",
      kind: "double-hung",
      width: 2.8,
      height: 1.6,
      columns: 3,
    }),
  );
  check(
    windows.build({
      id: "tub-right-window",
      kind: "awning",
      width: 0.9,
      height: 0.75,
      columns: 1,
    }),
  );
  const entry = new ExteriorDoor().buildFront();
  const garden = new ExteriorDoor().buildGarden();
  const garage = new GarageDoor().build();
  for (const built of [entry, garden, garage]) check(built);
  assert.equal(
    buildingModelFinish(entry.model.id, "leaf-exterior").material.id,
    "front-door-wood",
  );
  assert.equal(
    buildingModelFinish(garden.model.id, "leaf-exterior").material.id,
    "charcoal-metal",
  );
  assert.equal(
    buildingModelFinish(garage.model.id, "leaf-exterior").material.id,
    "garage-door-charcoal",
  );
  assert.equal(
    buildingModelFinish(garage.model.id, "rail").material.metallic,
    1,
  );
  assert.equal(
    buildingModelFinish("gate:side-yard-gate", "leaf-panel").material.id,
    "fence-wood",
  );
  assert.throws(
    () => buildingModelFinish(entry.model.id, "unknown-face"),
    /found 0/,
  );
});

void test("exterior member prototypes cover every weather and flashing face", () => {
  check(new Siding().build({ id: "course", length: 2 }));
  check(new ExteriorCornerTrim().build({ id: "corner", height: 3 }));
  const shingle = new AsphaltShingle();
  check(shingle.buildStrip({ id: "strip" }));
  check(
    shingle.buildRidgeCap({ id: "ridge", leftPitch: 0.6, rightPitch: 0.6 }),
  );
  check(
    shingle.buildValleyFlashing({
      id: "valley",
      length: 2,
      leftPitch: 0.6,
      rightPitch: 0.6,
    }),
  );
  check(shingle.buildWallFlashing({ id: "wall", length: 2 }));
});

void test("collected exterior courses retain finish identity after instance assembly", () => {
  assert.equal(
    buildingModelFinish(
      "envelope/front.ts-siding-0-front-main-wall",
      "siding-face",
    ).material.id,
    "siding-warm-white",
  );
  assert.equal(
    buildingModelFinish("roof/main-front.ts-shingle-0", "shingle-face").material
      .id,
    "roof-shingle",
  );
  assert.equal(
    buildingModelFinish("porch.ts-shingle-0", "shingle-cut").material.id,
    "roof-shingle",
  );
  assert.equal(
    buildingModelFinish("main-shingle-ridge", "shingle-face").material.id,
    "roof-shingle",
  );
  assert.equal(
    buildingModelFinish("front-gable-shingle-ridge", "shingle-cut").material.id,
    "roof-shingle",
  );
  assert.equal(
    buildingModelFinish("exterior-corner-main-front-left", "exterior-trim")
      .material.id,
    "trim-white",
  );
});

void test("interior construction members cover trim and black steel without face-only collisions", () => {
  check(
    new InteriorDoor().build({
      id: "entry-living-door",
      width: 1,
      wallThickness: 0.15,
    }),
  );
  check(new Baseboard().build({ id: "run", length: 2 }));
  check(new StairSkirt().build());
  check(new StairBaluster().build());
  check(new Closet().coat());
  check(new Closet().linen());
  assert.equal(
    buildingModelFinish("interior-door:entry-living-door", "leaf-panel")
      .material.id,
    "interior-trim-white",
  );
  assert.equal(
    buildingModelFinish("closet:coat", "rod").material.id,
    "stainless-steel",
  );
});
