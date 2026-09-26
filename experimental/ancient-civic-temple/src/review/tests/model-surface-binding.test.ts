import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { modelSurfaceBindingCensus } from "../model-surface-binding.mjs";
import { modelSections } from "../model-tessellation-census.mjs";
import { modelParts } from "../model-occupancy-union.mjs";

const modelRoot = join(__dirname, "../../../docs/models");
const documents = readdirSync(modelRoot).filter((file) => file.endsWith(".md"))
  .map((path) => ({ path, source: readFileSync(join(modelRoot, path), "utf8") }));
const scale = documents.find(
  (document) => document.path === "scale.md",
)!.source;
const material = readFileSync(join(__dirname, "../../../docs/materials/10-model-bindings.md"), "utf8");

void test("surface grammar covers every authored prototype and every part", () => {
  const result = modelSurfaceBindingCensus(documents, material, scale);
  const sections = documents.filter((document) => document.path !== "scale.md")
    .flatMap((document) => modelSections(document.source));
  const bindingTable = material.split("| 모델 H2 | part 표면 | 결속 키 |")[1]?.split(/\n\s*\n/)[0] ?? "";
  assert.equal(result.prototypes, sections.length);
  assert.equal(result.parts, sections.reduce((count, section) => count + modelParts(section.body).length, 0));
  assert.equal(result.bindingRows, bindingTable.split("\n").filter((line) => /^\| `[^|]+` \|/.test(line)).length);
  assert.deepEqual(result.failures, []);
});

void test("omitted binding, unknown part and duplicate assignment fail on the same grammar", () => {
  const omitted = material.replace(
    "| `portable#stylus` | `shaft`, `tip` | `dark-metal` |",
    "",
  );
  assert.match(
    modelSurfaceBindingCensus(documents, omitted, scale).failures.join("\n"),
    /portable#stylus\|shaft: no surface/,
  );
  const unknown = material.replace(
    "| `portable#stylus` | `shaft`, `tip`",
    "| `portable#stylus` | `shaft`, `tip`, `ghost`",
  );
  assert.match(
    modelSurfaceBindingCensus(documents, unknown, scale).failures.join("\n"),
    /portable#stylus\|ghost: binding has no model part/,
  );
  const duplicated = material.replace(
    "| `portable#stylus` | `shaft`, `tip` | `dark-metal` |",
    (row) => `${row}\n${row}`,
  );
  assert.match(
    modelSurfaceBindingCensus(documents, duplicated, scale).failures.join("\n"),
    /duplicate surface binding/,
  );
});

void test("repeat length, fallback, model UV design and prototype declaration remain valid", () => {
  const badRepeat = material.replace(
    "| `limestone` | 1.00·1.00",
    "| `limestone` | 0·1.00",
  );
  assert.match(
    modelSurfaceBindingCensus(documents, badRepeat, scale).failures.join("\n"),
    /invalid or duplicate texture group/,
  );
  const badFallback = material.replace("`#c9c0ad`", "`#oops`");
  assert.match(
    modelSurfaceBindingCensus(documents, badFallback, scale).failures.join("\n"),
    /invalid or duplicate texture group/,
  );
  const badUv = scale.replace("| H2 | part·면 | UV0 투영과 이음 |", "| absent | absent | absent |");
  assert.match(
    modelSurfaceBindingCensus(documents, material, badUv).failures.join("\n"),
    /no model UV0 design rows/,
  );
  const noPart = documents.map((document) =>
    document.path !== "portable.md"
      ? document
      : {
          ...document,
          source: document.source.replace(
            "part와 표면은 `shaft`, `tip`이다.",
            "첨필 표면은 축과 끝이다.",
          ),
        },
  );
  assert.match(
    modelSurfaceBindingCensus(noPart, material, scale).failures.join("\n"),
    /portable#stylus: no part declaration/,
  );
});

void test("empty populations cannot report success", () => {
  assert.match(
    modelSurfaceBindingCensus([], "", "").failures.join("\n"),
    /no model prototypes/,
  );
  assert.match(
    modelSurfaceBindingCensus(documents, "", scale).failures.join("\n"),
    /no texture binding groups/,
  );
  assert.match(
    modelSurfaceBindingCensus(documents, "", scale).failures.join("\n"),
    /no surface binding rows/,
  );
});
