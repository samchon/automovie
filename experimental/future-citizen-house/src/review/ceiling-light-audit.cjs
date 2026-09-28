// Census gate for the household's ceiling fixtures. Each point must retain a
// trim body and an emissive diffuser, so a counted but dark fixture fails.
const assert = require("node:assert/strict");
const { buildHouse } = require("../house/build.ts");

const house = buildHouse();
const trims = house.elements.filter((element) => /-light-trim-\d+$/.test(element.id));
const diffusers = house.elements.filter((element) => /-light-\d+$/.test(element.id));
assert.equal(trims.length, 29, "household ceiling light count");
assert.equal(diffusers.length, 29, "one luminous diffuser per ceiling light");
for (const [room, expected] of [
  ["powder-utility", 2],
  ["upper-corridor", 5],
  ["upper-bathroom", 3],
]) {
  assert.equal(trims.filter((element) => element.space === room).length, expected, `${room} trim census`);
  assert.equal(diffusers.filter((element) => element.space === room).length, expected, `${room} emitter census`);
}
for (const diffuser of diffusers) {
  const trimId = diffuser.id.replace(/-light-(\d+)$/, "-light-trim-$1");
  const trim = trims.find((element) => element.id === trimId);
  assert(trim, `${diffuser.id}: missing housing`);
  assert.equal(trim.space, diffuser.space);
  assert.equal(trim.transform.translation.x, diffuser.transform.translation.x);
  assert.equal(trim.transform.translation.z, diffuser.transform.translation.z);
  assert(Math.abs(trim.transform.translation.y - diffuser.transform.translation.y - 0.013) < 1e-9);
  const model = house.models.find((candidate) => candidate.id === diffuser.model);
  assert(model?.materials.some((material) => material.emissive), `${diffuser.id}: no emitter material`);
}
console.log("PASS 29 ceiling fixtures with paired body and emissive face");
