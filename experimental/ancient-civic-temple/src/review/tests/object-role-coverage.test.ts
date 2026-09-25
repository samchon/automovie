import assert from "node:assert/strict";
import test from "node:test";
import { TempleObjectInstances } from "../../instances/objects";
import { createViewerPayload } from "../../viewer/payload";

/** The 76 original room roles; later support and shelf contents may add to them. */
const requiredRoles = [
  "entrance.waiting-bench",
  "entrance.portable-lamp",
  "entrance.water-vessel",
  "entrance.washing-bowl",
  "entrance.carrying-basket",
  "courtyard.fountain",
  "courtyard.waterside-bench",
  "courtyard.planter",
  "courtyard.portable-lamp",
  "courtyard.bucket",
  "colonnade.wall-bench",
  "colonnade.lampstand",
  "colonnade.basket",
  "colonnade.small-vessel",
  "colonnade.stool",
  "colonnade.votive-plaque",
  "sanctuary.altar",
  "sanctuary.niche",
  "sanctuary.left-lampstand",
  "sanctuary.right-lampstand",
  "sanctuary.offering-bowl",
  "sanctuary.niche-vessel",
  "sanctuary.censer",
  "sanctuary.altar-cloth",
  "sanctuary.floor-cushion",
  "sanctuary.votive-plaque",
  "offering.offering-table",
  "offering.display-shelf",
  "offering.offering-bowl",
  "offering.small-vessel",
  "offering.carry-jar",
  "offering.offering-tray",
  "offering.votive-plaque",
  "offering.textile",
  "offering.basket",
  "offering.portable-lamp",
  "administration.desk",
  "administration.stool",
  "administration.working-scroll",
  "administration.tool-vessel",
  "administration.wall-shelf",
  "administration.stylus",
  "administration.writing-tablet",
  "administration.document-chest",
  "administration.portable-lamp",
  "administration.textile",
  "records.scroll-shelf",
  "records.reading-desk",
  "records.stool",
  "records.stored-scroll",
  "records.chest",
  "records.document-chest",
  "records.rope-coil",
  "records.portable-lamp",
  "records.dust-cover",
  "storage.storage-jar",
  "storage.carry-jar",
  "storage.basket",
  "storage.chest",
  "storage.jar-stand",
  "storage.cover-cloth",
  "storage.rope-coil",
  "storage.bucket",
  "service-yard.storage-jar",
  "service-yard.carry-jar",
  "service-yard.basket",
  "service-yard.work-bench",
  "service-yard.bucket",
  "service-yard.carrying-yoke",
  "service-yard.rope-coil",
  "service-yard.handcart",
  "temple-site.path-lamp",
  "temple-site.porch-planter",
  "temple-site.path-bucket",
  "temple-site.path-handcart",
  "temple-site.path-basket",
] as const;

void test("all 76 original object roles remain separately placed in the compiled scene", () => {
  assert.equal(new Set(requiredRoles).size, 76);
  const placements = new Set(TempleObjectInstances.placements().map(({ space, role }) => `${space}.${role}`));
  const compiled = new Set(createViewerPayload().placements.map(({ node }) => node));
  for (const role of requiredRoles) {
    assert.ok(placements.has(role), `${role}: source placement absent`);
    assert.ok(compiled.has(`temple/temple.object.${role}`), `${role}: compiled element absent`);
  }
});
