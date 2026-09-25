import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { modelSections, tessellationFailures } from "../model-tessellation-census.mjs";

const model = (file: string, anchor: string): string => {
  const source = readFileSync(join(__dirname, "../../../docs/models", `${file}.md`), "utf8");
  const section = modelSections(source).find((row: { id: string }) => row.id === anchor);
  assert.ok(section, `${file}#${anchor}`);
  return section.body;
};

void test("all three missing tessellation families are caught when their own rule is removed", () => {
  const double = model("openings", "double-door-leaf");
  const single = model("openings", "single-door-leaf");
  const basket = model("wares", "basket");
  assert.deepEqual(tessellationFailures("double", double), []);
  assert.deepEqual(tessellationFailures("single", single), []);
  assert.deepEqual(tessellationFailures("basket", basket), []);
  assert.match(tessellationFailures("double", double.replace("둘레 16분할 원판", "원판")).join(" "), /round plate/);
  assert.match(tessellationFailures("double", double.replace("연결 핀 두 개는 둘레 12분할 원통", "연결 핀 두 개는 원통")).join(" "), /connecting pin/);
  assert.match(tessellationFailures("single", single.replace("둘레 12분할 원통", "원통")).join(" "), /connecting pin/);
  assert.match(tessellationFailures("basket", basket.replace("벽의 안팎은 같은 둘레 24분할", "벽의 안팎은 같은 둘레")).join(" "), /tapered shell/);
  assert.match(tessellationFailures("basket", basket.replace("각각 둘레 24분할·중심 부채꼴 24삼각형", "각각 둥글게")).join(" "), /circular floor/);
  assert.match(tessellationFailures("basket", basket.replace("가로 띠도 벽과 정렬한 둘레 24분할", "가로 띠도 벽과 정렬한 둘레")).join(" "), /horizontal bands/);
  assert.match(tessellationFailures("basket", basket.replace("높이 범위는 Y=0.02~0.305m", "높이 범위는 열 칸이다")).join(" "), /vertical slats/);
});

void test("a newly authored curved H2 without a division is red", () => {
  assert.match(tessellationFailures("new", "반지름 0.2m인 원통을 만든다.").join(" "), /curved construction/);
  assert.deepEqual(tessellationFailures("rectangular", "폭 0.2m인 직육면체를 만든다."), []);
});
