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

void test("a curved part cannot borrow another part's segment count", () => {
  const cart = model("portable", "handcart");
  const censer = model("ritual", "censer");
  assert.deepEqual(tessellationFailures("cart", cart), []);
  assert.deepEqual(tessellationFailures("censer", censer), []);
  assert.match(tessellationFailures("cart", cart.replace("X축 회전 원통 16분할이다", "X축 회전 원통이다")).join(" "), /curved part wheel/);
  assert.match(tessellationFailures("censer", censer.replace("발·줄기·컵은 회전체 20분할, 향은 팔각기둥이다.", "")).join(" "), /curved part foot/);
});

void test("circular repeats require a first centre, compatible pitch and face-based offset", () => {
  const basket = model("wares", "basket");
  assert.deepEqual(tessellationFailures("basket", basket), []);
  assert.match(tessellationFailures("basket", basket.replace("시작각은 θ₀=7.5°", "시작각은 미정")).join(" "), /first centre/);
  assert.match(tessellationFailures("basket", basket.replace("θ(k)=7.5°+15°k", "θ(k)=7.5°+14°k")).join(" "), /count, pitch/);
  assert.match(tessellationFailures("basket", basket.replace("θ₀=7.5°", "θ₀=0°").replace("θ(k)=7.5°", "θ(k)=0°")).join(" "), /half-pitch/);
  assert.match(tessellationFailures("basket", basket.replace("바깥 법선 방향으로 0.004m", "반지름 기준으로 0.004m")).join(" "), /host face datum/);
});

void test("a pinned polygon plate requires its pin-facing vertex and valid phase", () => {
  const plate = model("openings", "double-door-leaf");
  assert.deepEqual(tessellationFailures("plate", plate), []);
  assert.match(tessellationFailures("plate", plate.replace("0번 꼭짓점이 +X이고 4번 꼭짓점이 +Y", "위상은 미정")).join(" "), /polygon phase/);
  assert.match(tessellationFailures("plate", plate.replace("4번 꼭짓점이 +Y", "3번 꼭짓점이 +Y")).join(" "), /polygon phase/);
});
