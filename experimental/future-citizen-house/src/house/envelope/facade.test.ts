/** Fixed glazing occupies the clear region between its real frame members.
 * Native placed bounds, rather than a second bay formula, detect missing glass.
 * Scenarios: both facade axes and normals; clear, frosted and split panes;
 * the privacy-height boundary; negative twins with the former open gaps and
 * overdeep head. This checks geometry, not watertightness or optical quality. */
import assert from "node:assert/strict";
import { builtEnvironmentElementBounds } from "@automovie/engine";
import { Assembly, initialState } from "../assembly";
import type { Frame } from "../walls";
import { facade, type Glazing } from "./facade";

function assertGlazingFill(a: Assembly, f: Frame, w: Glazing): void {
  const tolerance = 1e-9;
  const along = f.along;
  const depth = along === "x" ? "z" : "x";
  const bounds = (id: string) => {
    const result = builtEnvironmentElementBounds(a.environment, id);
    assert.ok(result, id + ": missing placed geometry");
    return result;
  };
  const mullions = a.environment.elements
    .filter((element) => element.id.startsWith(w.id + "-mullion-"))
    .map((element) => bounds(element.id))
    .sort((left, right) => left.min[along] - right.min[along]);
  assert.ok(mullions.length > 2, "fixture must contain an internal mullion");
  for (const member of [...mullions, bounds(w.id + "-head"), bounds(w.id + "-sill")])
    assert.ok(Math.abs(member.max[depth] - member.min[depth] - 0.14) < tolerance, "frame depth");

  const panes = a.environment.elements
    .filter((element) => element.id.startsWith(w.id + "-pane-"))
    .map((element) => ({ id: element.id, box: bounds(element.id) }));
  const seen = new Set<string>();
  for (let bay = 0; bay < mullions.length - 1; bay++) {
    const left = mullions[bay].max[along];
    const right = mullions[bay + 1].min[along];
    const bands = panes.filter(({ box }) => {
      const centre = (box.min[along] + box.max[along]) / 2;
      return centre > left && centre < right;
    }).sort((a, b) => a.box.min.y - b.box.min.y);
    const expectedBands = w.privacy === "lower" && w.head - w.sill > 1.25 ? 2 : 1;
    assert.equal(bands.length, expectedBands, "nonempty optical bands");
    let bottom = w.sill;
    for (const { id, box } of bands) {
      assert.ok(Math.abs(box.min[along] - left) < tolerance, "pane span start");
      assert.ok(Math.abs(box.max[along] - right) < tolerance, "pane span end");
      assert.ok(Math.abs(box.min.y - bottom) < tolerance, "vertical glass continuity");
      assert.ok(box.max.y > box.min.y, "positive pane height");
      bottom = box.max.y;
      seen.add(id);
    }
    assert.ok(Math.abs(bottom - w.head) < tolerance, "glass reaches head");
  }
  assert.equal(seen.size, panes.length, "all panes belong to a real bay");
}

export function verifyFixedGlazingFill(): number {
  let checked = 0;
  const cases: Pick<Glazing, "privacy" | "head">[] = [
    { head: 2.6 }, { head: 2.6, privacy: "all" },
    { head: 2.6, privacy: "lower" },
    { head: 1.65, privacy: "lower" }, { head: 1.3, privacy: "lower" },
  ];
  for (const along of ["x", "z"] as const) for (const normal of [-1, 1] as const) {
    for (const state of cases) {
      const a = new Assembly(initialState);
      const f: Frame = {
        id: "test-facade", along, normal, plane: 0,
        a: -2, b: 2, floor: 0, top: 3, depth: 0.24, spaces: ["house"],
      };
      const w: Glazing = {
        id: "test-glazing", room: "house", a: -1.5, b: 1.5,
        sill: 0.4, breaks: [-0.26], ...state,
      };
      facade(a, f, [w]);
      assertGlazingFill(a, f, w);

      const head = a.environment.elements.find((element) => element.id === w.id + "-head")!;
      const headDepth = head.transform.scale.z;
      head.transform.scale.z = 0.16;
      assert.throws(() => assertGlazingFill(a, f, w), /frame depth/);
      head.transform.scale.z = headDepth;

      const pane = a.environment.elements.find((element) => element.id.startsWith(w.id + "-pane-"))!;
      const width = pane.transform.scale.x;
      pane.transform.scale.x = width - 0.005;
      assert.throws(() => assertGlazingFill(a, f, w), /pane span/);
      pane.transform.scale.x = width;
      const height = pane.transform.scale.y;
      pane.transform.scale.y = height - 0.01;
      assert.throws(() => assertGlazingFill(a, f, w), /vertical glass continuity/);
      pane.transform.scale.y = height;
      assertGlazingFill(a, f, w);
      checked++;
    }
  }
  return checked;
}
