import test from "node:test";
import assert from "node:assert/strict";
import { witness } from "./model-face-witness.cjs";

void test("a placed measured face has one candidate sentence", () => {
  const found = witness("`rail`은 X=[0,1] m의 판이다.", "rail");
  assert.equal(found.named, 1);
  assert.equal(found.sentence, "`rail`은 X=[0,1] m의 판이다.");
});

void test("a list and another part's measurement cannot make the named face", () => {
  const body = "재질 경계는 `rail`이다. `panel`은 X=[0,1] m의 판이다.";
  assert.equal(witness(body, "rail").sentence, null);
  assert.equal(witness(body, "panel").sentence, "`panel`은 X=[0,1] m의 판이다.");
});

void test("a face name with no placement or dimension remains unverified", () => {
  assert.equal(witness("`rail`은 이 원형이 만든다.", "rail").sentence, null);
  assert.equal(witness("다른 판은 X=[0,1] m다.", "rail").named, 0);
});
