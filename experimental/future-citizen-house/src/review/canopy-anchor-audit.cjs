// Integration probe of the real roof solids and native placed bounds. Keep the
// former coplanar end as a negative case; display offsets cannot satisfy it.
const assert = require("node:assert/strict");
const { builtEnvironmentElementBounds } = require("@automovie/engine");
const { Assembly, initialState } = require("../house/assembly.ts");
const { roof } = require("../house/envelope/roof.ts");
const { auditCanopy } = require("../house/canopy-audit.ts");
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
/** @param {(a: import("../house/assembly").Assembly) => void} edit */
const changed = (edit) => {
  const a = new Assembly(initialState);
  a.environment.elements = structuredClone(source.environment.elements);
  a.environment.models = source.environment.models;
  edit(a);
  return auditCanopy(a).errors;
};
/** @param {import("../house/assembly").Assembly} a @param {number} bottom @param {number} top */
const resize = (a, bottom, top) => {
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
