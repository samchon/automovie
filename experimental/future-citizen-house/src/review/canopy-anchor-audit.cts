// Integration probe of the real roof solids and native placed bounds. Keep the
// former coplanar end as a negative case; display offsets cannot satisfy it.
import assert from "node:assert/strict";
import { builtEnvironmentElementBounds } from "@automovie/engine";
import { Assembly, initialState } from "../house/assembly";
import { roof } from "../house/envelope/roof";
import { auditCanopy } from "../house/canopy-audit";
const source = new Assembly(initialState);
roof(source);
const anchors = source.environment.elements.filter((p) =>
  /^canopy-support-.*-anchor-/.test(p.id),
);
assert.equal(anchors.length, 36);
assert.deepEqual(auditCanopy(source).errors, []);
const anchor = anchors[0];
const baseId = anchor.id.replace(/-anchor-.*$/, "-base");
const base = builtEnvironmentElementBounds(source.environment, baseId);
const bound = builtEnvironmentElementBounds(source.environment, anchor.id);
assert.ok(base && bound);
const changed = (edit: (a: import("../house/assembly").Assembly) => void) => {
  const a = new Assembly(initialState);
  a.environment.elements = structuredClone(source.environment.elements);
  a.environment.models = source.environment.models;
  edit(a);
  return auditCanopy(a).errors;
};
const resize = (a: import("../house/assembly").Assembly, bottom: number, top: number) => {
  const element = a.environment.elements.find((p) => p.id === anchor.id);
  assert.ok(element);
  element.transform.translation.y = (bottom + top) / 2;
  element.transform.scale.y = top - bottom;
};
assert.ok(
  changed((a) => resize(a, bound.min.y, base.max.y)).some((e) =>
    e.includes("threaded end"),
  ),
  "former coplanar cap must fail",
);
assert.ok(
  changed((a) => resize(a, base.min.y + 0.001, bound.max.y)).some((e) =>
    e.includes("embedded below"),
  ),
  "floating shaft must fail",
);
assert.ok(
  changed((a) => {
    a.environment.elements = a.environment.elements.filter(
      (p) => p.id !== anchor.id,
    );
  }).some((e) => e.includes("four embedded anchors")),
  "missing anchor must fail",
);
console.log(
  "canopy-anchor-audit: 9 bases / 36 native anchors; coplanar, floating and missing counterexamples caught",
);
