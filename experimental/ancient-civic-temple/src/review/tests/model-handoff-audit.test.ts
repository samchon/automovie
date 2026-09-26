import assert from "node:assert/strict";
import test from "node:test";
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

void test("every object H2 requires its direct owner even when settings has no date", () => {
  const settings = { path: "settings/35-objects.md", source: "## 쟁반 {#tray}\n폭 0.4~0.6m, 깊이 0.2~0.4m다." };
  const source = "## 쟁반 {#tray}\n<!--\n@evidence settings/35-objects.md#tray 소유.\n-->\n[사물](../settings/35-objects.md#tray). 점유 상자는 0.52×0.05×0.34m다.";
  const portable = { path: "portable.md", source };
  assert.deepEqual(modelIdentityOwnerFailures(settings, [portable]), []);
  assert.match(modelIdentityOwnerFailures(settings, [{ ...portable, source: source + "\n## 새 사물 {#new-object}\n점유 상자는 0.3×0.2×0.3m다." }]).join(" "), /missing settings identity/);
  assert.match(modelIdentityOwnerFailures(settings, [{ ...portable, source: source.replace("@evidence settings/35-objects.md#tray ", "@evidence settings/35-objects.md#absent ") }]).join(" "), /missing direct settings identity/);
  assert.match(modelIdentityOwnerFailures(settings, [{ ...portable, source: source.replace("../settings/35-objects.md#tray", "../settings/35-objects.md#absent") }]).join(" "), /missing direct settings identity/);
  assert.match(modelIdentityOwnerFailures(settings, [{ ...portable, source: source.replace("0.52×", "0.70×") }]).join(" "), /폭 0.7m outside/);
  assert.match(modelIdentityOwnerFailures(settings, [{ ...portable, source: source.replace("×0.34m", "×0.45m") }]).join(" "), /깊이 0.45m outside/);
  assert.match(modelIdentityOwnerFailures(settings, [{ ...portable, source: source.replace("점유 상자는 0.52×0.05×0.34m다.", "") }]).join(" "), /no occupancy box/);
});

void test("all six settings size bands are compared with the model envelope", () => {
  const settings = { path: "settings/35-objects.md", source: "## 대상 {#thing}\n폭 0.4~0.6m, 깊이 0.2~0.4m, 높이 0.1~0.3m, 지름 0.4~0.6m, 길이 0.4~0.6m, 두께 0.1~0.3m다." };
  const source = "## 대상 {#thing}\n<!--\n@evidence settings/35-objects.md#thing 소유.\n-->\n[사물](../settings/35-objects.md#thing). 점유 상자는 0.50×0.20×0.30m다.";
  const portable = { path: "ritual.md", source };
  assert.deepEqual(modelIdentityOwnerFailures(settings, [portable]), []);
  const expected = ["폭", "깊이", "높이", "지름", "길이", "두께"];
  for (const label of expected) {
    const narrow = { ...settings, source: settings.source.replace(new RegExp(`${label} [\\d.]+~[\\d.]+m`), `${label} 0.01~0.02m`) };
    assert.match(modelIdentityOwnerFailures(narrow, [portable]).join(" "), new RegExp(label));
  }
  assert.deepEqual(modelIdentityOwnerFailures(settings, [{ path: "columns.md", source: "## 기둥 {#column}\n모델." }]), []);
  assert.match(modelIdentityOwnerFailures(settings, [{ path: "future-objects.md", source: "## 새 물체 {#new-object}\n점유 상자는 0.3×0.2×0.3m다." }]).join(" "), /missing settings identity/);
});

void test("variant parameters and a primary floor cannot hide behind the base box", () => {
  const settings = { path: "settings/35-objects.md",
    source: "## 천 {#textile}\n폭 0.4~0.6m, 깊이 0.2~0.4m, 두께 0.02~0.06m다.\n## 쟁반 {#tray}\n폭 0.4~0.6m다." };
  const source = "## 천 {#textile}\n<!--\n@evidence settings/35-objects.md#textile 천.\n-->\n[천](../settings/35-objects.md#textile) W=0.55m·D=0.40m·T=0.045m이고 작은 변형은 W=0.42m·D=0.36m·T=0.03m다. 점유 상자는 0.55×0.045×0.40m다.\n## 쟁반 {#tray}\n<!--\n@evidence settings/35-objects.md#tray 쟁반.\n-->\n[쟁반](../settings/35-objects.md#tray) 바닥은 폭 0.52m·깊이 0.34m다. 점유 상자는 0.52×0.05×0.34m다.";
  const portable = { path: "portable.md", source };
  assert.deepEqual(modelIdentityOwnerFailures(settings, [portable]), []);
  assert.match(modelIdentityOwnerFailures(settings, [{ ...portable, source: source.replace("T=0.03m", "T=0.08m") }]).join(" "), /두께 0.08m outside/);
  assert.match(modelIdentityOwnerFailures(settings, [{ ...portable, source: source.replace("W=0.42m", "W=0.80m") }]).join(" "), /폭 0.8m outside/);
  assert.match(modelIdentityOwnerFailures(settings, [{ ...portable, source: source.replace("바닥은 폭 0.52m", "바닥은 폭 0.70m") }]).join(" "), /primary part width exceeds/);
});
