import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { modelHandoffRows, modelIdentityOwnerFailures } from "../model-handoff-audit";

const parent = { path: "settings/room.md", source: "## 방 {#room}\n가구와 수반을 둔다.\n## 벽 {#wall}\n벽만 만든다." };
const model = { path: "fixture.md", source: "## 수반 {#basin}\n<!--\n@evidence settings/room.md#room 수반을 받는다.\n-->\n석재 수반." };

void test("reverse handoff cites the model H2 and leaves unrelated H2 out", () => {
  const rows = modelHandoffRows([parent], [model], ["가구", "수반"], {});
  assert.deepEqual(rows, [{ parent: "settings/room.md#room", terms: ["가구", "수반"], owners: ["models/fixture.md#basin"] }]);
});

void test("explicit owners are checked against real model anchors", () => {
  const rows = modelHandoffRows([parent], [model], ["가구"], {
    "settings/room.md#room": ["models/fixture.md#basin", "instances"],
  });
  assert.deepEqual(rows[0]!.owners, ["instances", "models/fixture.md#basin"]);
  assert.throws(() => modelHandoffRows([parent], [model], ["가구"], {
    "settings/room.md#room": ["models/missing.md#basin"],
  }), /missing owner/);
  assert.throws(() => modelHandoffRows([parent], [model], ["가구"], { "settings/room.md#stale": ["spaces"] }), /obsolete/);
  assert.deepEqual(modelHandoffRows([parent], [model], ["가구"], {
    "settings/room.md#room": ["models/*"],
  })[0]!.owners, ["models/fixture.md#basin"]);
});

void test("duplicate vocabulary and unanchored H2 fail rather than shrinking the population", () => {
  assert.throws(() => modelHandoffRows([parent], [model], ["가구", "가구"], {}), /duplicate/);
  assert.throws(() => modelHandoffRows([{ path: "settings/bad.md", source: "## no anchor\n가구" }], [model], ["가구"], {}), /no anchor/);
});

void test("matching model identities cite settings and stay inside its height band", () => {
  const settings = { path: "settings/35-objects.md", source: readFileSync(join(__dirname, "../../../docs/settings/35-objects.md"), "utf8") };
  const source = readFileSync(join(__dirname, "../../../docs/models/portable.md"), "utf8");
  const portable = { path: "portable.md", source };
  assert.deepEqual(modelIdentityOwnerFailures(settings, [portable]), []);
  assert.match(modelIdentityOwnerFailures(settings, [{ ...portable, source: source.replace("@evidence settings/35-objects.md#bench ", "@evidence settings/35-objects.md#absent ") }]).join(" "), /missing direct settings identity/);
  assert.match(modelIdentityOwnerFailures(settings, [{ ...portable, source: source.replace("점유 상자는 0.24×0.28×0.24m다.", "점유 상자는 0.24×1.85×0.24m다.") }]).join(" "), /portable-lamp: height/);
});
