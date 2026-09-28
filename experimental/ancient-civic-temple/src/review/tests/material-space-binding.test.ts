import assert from "node:assert/strict";
import test from "node:test";
import { materialSpaceBindingCensus } from "../material-space-binding.mjs";

const keys = [
  "| 결속 키 | 반복 길이 U·V (m) | 비트맵 부재 시 단색 fallback |",
  "| --- | --- | --- |",
  "| `plaster` | 1.50·1.50 | `#cdb68e` |",
  "| `limestone` | 1.00·1.00 | `#c9c0ad` |",
].join("\n");
const design = [
  "## 공간 표면 결속 {#space-binding-map}",
  "| 방출 공간 표면 ID | 결속 키 |",
  "| --- | --- |",
  "| `surface.wall.outer`, `surface.wall.inner` | `plaster` |",
  "| `surface.wall.coping` | `limestone` |",
].join("\n");
const emitted = ["surface.wall.outer", "surface.wall.inner", "surface.wall.coping"];

void test("a surface has one material key from the declared palette", () => {
  assert.deepEqual(materialSpaceBindingCensus(emitted, design, keys), {
    emitted: 3, assigned: 3, rows: 2, failures: [],
  });
});

void test("omission, extra surface, duplicate, and undeclared key all fail", () => {
  const check = (body: string) => materialSpaceBindingCensus(emitted, body, keys).failures.join("\n");
  assert.match(check(design.replace("`surface.wall.inner`", "`surface.wall.absent`")), /재료 결속 누락: surface.wall.inner/);
  assert.match(check(design.replace("`surface.wall.inner`", "`surface.wall.absent`")), /방출되지 않은 표면 결속: surface.wall.absent/);
  assert.match(check(design.replace("`surface.wall.coping` |", "`surface.wall.outer` |")), /중복 재료 결속/);
  assert.match(check(design.replace("`limestone` |", "`unknown` |")), /잘못된 공간 재료 행/);
});

void test("invalid and empty populations cannot pass", () => {
  const check = (ids: string[], body: string, palette = keys) => materialSpaceBindingCensus(ids, body, palette).failures.join("\n");
  assert.match(check(emitted, design.replace("`surface.wall.inner`", "`wall.inner`")), /공간 표면 주소가 아닙니다/);
  assert.match(check(emitted, design.replace("`surface.wall.inner`", "`surface.wall.inner`!")), /잘못된 공간 재료 행/);
  assert.match(check(emitted, design.replace("| `limestone` |", "| `limestone` | extra |")), /잘못된 공간 재료 행/);
  assert.match(check(emitted, "## 다른 본문"), /결속 표가 비었습니다/);
  assert.match(check(emitted, design.replace("| --- | --- |", "missing divider")), /결속 표가 비었습니다/);
  assert.match(check(emitted, design.split("\n").slice(0, 3).join("\n")), /결속 표가 비었습니다/);
  assert.match(check([], design), /방출 공간 표면이 비었습니다/);
  assert.match(check(emitted, design, ""), /결속 키 표가 비었습니다/);
});
