import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { modelSections } from "../model-tessellation-census.mjs";
import { declaredBoundRows, dimensionalExpression, explicitEquationRows, explicitRangeRows } from "../model-prose-consistency.mjs";

const section = (file: string, id: string): string => {
  const source = readFileSync(join(__dirname, `../../../docs/models/${file}.md`), "utf8");
  const found = modelSections(source).find((row: { id: string }) => row.id === id);
  assert.ok(found, `${file}#${id}`);
  return found.body;
};

void test("dimensional expressions follow the authored arithmetic grammar", () => {
  assert.equal(dimensionalExpression("(1.80−2×0.04−3×0.03)/4"), 0.4075);
  assert.ok(Math.abs(dimensionalExpression("2×(0.175+√(0.02²−0.018²)+0.02)") - 0.4074355957741627) < 1e-12);
  assert.throws(() => dimensionalExpression("1.00+unreviewed"), /unsupported/);
  assert.equal(explicitEquationRows("sample", "칸은 (1.80−2×0.04−3×0.03)/4≈0.41m다.")[0]?.pass, true);
  assert.equal(explicitEquationRows("sample", "칸은 (1.80−2×0.04−3×0.03)/4≈0.40m다.")[0]?.pass, false);
  const column = section("columns", "colonnade-column");
  assert.ok(explicitEquationRows("column", column).every((row: { pass: boolean }) => row.pass));
  assert.ok(explicitEquationRows("column", column.replace("0.08+0.10+0.03+0.10+0.07=0.38m", "0.09+0.10+0.03+0.10+0.07=0.38m"))
    .some((row: { pass: boolean }) => !row.pass));
});

void test("directed ranges and box comparisons use the source values", () => {
  const reverse = explicitRangeRows("pin", "뒷핀은 Z=−0.056~−0.065m다.");
  assert.equal(reverse[0]?.pass, true);
  const display = section("fixtures", "display-shelf");
  assert.ok(declaredBoundRows("display", display).every((row: { pass: boolean }) => row.pass));
  assert.ok(declaredBoundRows("display", display.replace("점유 상자는 1.00×1.10×0.30m", "점유 상자는 1.00×1.10×0.31m"))
    .some((row: { pass: boolean }) => !row.pass));
  const shifted = declaredBoundRows("display", display.replace("X=−0.46~+0.46m", "X=−0.46~+0.47m"));
  assert.ok(shifted.some((row: { pass: boolean }) => !row.pass));
  const basket = section("wares", "basket");
  assert.ok(declaredBoundRows("basket", basket).every((row: { pass: boolean }) => row.pass));
  assert.ok(declaredBoundRows("basket", basket.replace("높이 0.32m의", "높이 0.33m의"))
    .some((row: { pass: boolean }) => !row.pass));
});
