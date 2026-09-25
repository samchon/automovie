import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { modelSurfaceBindingCensus } from "../model-surface-binding.mjs";

const modelRoot = join(__dirname, "../../../docs/models");
const documents = readdirSync(modelRoot).filter((file) => file.endsWith(".md"))
  .map((path) => ({ path, source: readFileSync(join(modelRoot, path), "utf8") }));
const scale = documents.find(
  (document) => document.path === "scale.md",
)!.source;

void test("surface grammar covers every authored prototype and every part", () => {
  const result = modelSurfaceBindingCensus(documents, scale);
  assert.equal(result.prototypes, 49);
  assert.equal(result.parts, 134);
  assert.equal(result.bindingRows, 57);
  assert.deepEqual(result.failures, []);
});

void test("omitted binding, unknown part and duplicate assignment fail on the same grammar", () => {
  const omitted = scale.replace(
    "| `portable#stylus` | `shaft`, `tip` | `dark-metal` | 회전 |",
    "",
  );
  assert.match(
    modelSurfaceBindingCensus(documents, omitted).failures.join("\n"),
    /portable#stylus\|shaft: no surface/,
  );
  const unknown = scale.replace(
    "| `portable#stylus` | `shaft`, `tip`",
    "| `portable#stylus` | `shaft`, `tip`, `ghost`",
  );
  assert.match(
    modelSurfaceBindingCensus(documents, unknown).failures.join("\n"),
    /portable#stylus\|ghost: binding has no model part/,
  );
  const duplicated = scale.replace(
    "| `portable#stylus` | `shaft`, `tip` | `dark-metal` | 회전 |",
    (row) => `${row}\n${row}`,
  );
  assert.match(
    modelSurfaceBindingCensus(documents, duplicated).failures.join("\n"),
    /duplicate surface binding/,
  );
});

void test("repeat length, fallback, UV method and prototype declaration remain valid", () => {
  const badRepeat = scale.replace(
    "| `limestone` | 0.45·0.45",
    "| `limestone` | 0·0.45",
  );
  assert.match(
    modelSurfaceBindingCensus(documents, badRepeat).failures.join("\n"),
    /invalid or duplicate texture group/,
  );
  const badFallback = scale.replace("`#b8aa91`", "`#oops`");
  assert.match(
    modelSurfaceBindingCensus(documents, badFallback).failures.join("\n"),
    /invalid or duplicate texture group/,
  );
  const badUv = scale.replace(
    "| `portable#stylus` | `shaft`, `tip` | `dark-metal` | 회전 |",
    "| `portable#stylus` | `shaft`, `tip` | `dark-metal` | 없음 |",
  );
  assert.match(
    modelSurfaceBindingCensus(documents, badUv).failures.join("\n"),
    /invalid surface binding row/,
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
    modelSurfaceBindingCensus(noPart, scale).failures.join("\n"),
    /portable#stylus: no part declaration/,
  );
});

void test("empty populations cannot report success", () => {
  assert.match(
    modelSurfaceBindingCensus([], "").failures.join("\n"),
    /no model prototypes/,
  );
  assert.match(
    modelSurfaceBindingCensus(documents, "").failures.join("\n"),
    /no texture binding groups/,
  );
  assert.match(
    modelSurfaceBindingCensus(documents, "").failures.join("\n"),
    /no surface binding rows/,
  );
});
