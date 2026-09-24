import assert from "node:assert/strict";
import test from "node:test";
import { replaceMeasuredTable } from "../account-sync";

void test("measured table replacement preserves adjacent account and is idempotent", () => {
  const source = "before\n| a | b |\n| --- | --- |\n| old | 1 |\nafter\n";
  const replaced = replaceMeasuredTable(source, "| a | b |", ["| new | 2 |", "| next | 3 |"]);
  assert.equal(replaced, "before\n| a | b |\n| --- | --- |\n| new | 2 |\n| next | 3 |\nafter\n");
  assert.equal(replaceMeasuredTable(replaced, "| a | b |", ["| new | 2 |", "| next | 3 |"]), replaced);
});

void test("CRLF, missing and duplicate table headers are handled without guessing", () => {
  const source = "| a | b |\r\n| --- | --- |\r\n| old | 1 |\r\n";
  assert.equal(replaceMeasuredTable(source, "| a | b |", ["| new | 2 |"]), source.replace("old | 1", "new | 2"));
  assert.throws(() => replaceMeasuredTable("no header", "| a | b |", []));
  assert.throws(() => replaceMeasuredTable(source + source, "| a | b |", []));
  assert.throws(() => replaceMeasuredTable("| a | b |\nno ruler", "| a | b |", []));
  assert.throws(() => replaceMeasuredTable("| a | b |\n| --- | --- |\nno rows", "| a | b |", []));
});
