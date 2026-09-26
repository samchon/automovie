// Snapshot the compiled identity surface, including compact population members.
// Run: node -r tsx/cjs src/review/space-element-baseline.cjs --write
// Regeneration never silently accepts deletion. If removals are intentional,
// inspect the printed IDs, rerun with --accept-deletions, and list every
// removal with its design reason in the updating commit body.
const fs = require("node:fs");
const path = require("node:path");
const { buildHouse } = require("../house/build.ts");

const file = path.join(__dirname, "element-id-baseline.txt");
const environment = buildHouse();
const identities = [
  ...environment.elements.map((element) => element.id),
  ...(environment.populations ?? []).flatMap(({ set }) => {
    if (set.layout.kind !== "explicit") throw Error(`${set.id}: unsupported baseline layout`);
    return set.layout.transforms.map((transform) => `population:${set.id}:${transform.id}`);
  }),
];
if (new Set(identities).size !== identities.length)
  throw Error("duplicate compiled element or population identity");
const current = identities.sort((a, b) => a.localeCompare(b));
const previous = fs.existsSync(file)
  ? fs.readFileSync(file, "utf8").split(/\r?\n/).filter(
      (line) => line && !line.startsWith("#"),
    )
  : [];
const currentSet = new Set(current);
const removed = previous.filter((id) => !currentSet.has(id));
for (const id of removed) console.error(`removed ${id}`);
if (!process.argv.includes("--write")) {
  console.log(
    `baseline preview: ${current.length} current, ${removed.length} removed`,
  );
  if (removed.length) process.exitCode = 1;
} else {
  if (removed.length && !process.argv.includes("--accept-deletions"))
    throw Error(
      "deletions require --accept-deletions and a commit body listing each ID and its design reason",
    );
  fs.writeFileSync(file,
    "# Compiled house element IDs and population:set.id:transform.id members.\n" +
    current.join("\n") + "\n");
  console.log(
    `baseline written: ${current.length} IDs, ${removed.length} accepted deletions`,
  );
}
