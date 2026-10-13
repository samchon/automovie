import fs from "node:fs";
import path from "node:path";
const root = path.resolve(__dirname, "../..");
const docs = path.join(root, "docs");
const read = (name: string) => fs.readFileSync(path.join(docs, name), "utf8");
const sections = (source: string) => [...source.split(/^## /m).slice(1)].map(
  (block) => {
    const end = block.indexOf("\n");
    const anchor = /\{#([^}]+)\}/.exec(block.slice(0, end))?.[1];
    if (!anchor) throw new Error(`unnamed H2: ${block.slice(0, end)}`);
    return {
      anchor,
      body: block.slice(end + 1).replace(/<!--[\s\S]*?-->/g, ""),
    };
  },
);
const files = (directory: string): string[] => fs.readdirSync(path.join(docs, directory), { withFileTypes: true }).flatMap(
  (entry) => {
    const relative = `${directory}/${entry.name}`;
    return entry.isDirectory()
      ? files(relative)
      : entry.name.endsWith(".md")
        ? [relative]
        : [];
  },
);
/** Each address is a physical maker H2 or a declared no-mesh mask. */
const owner: Record<string, string[]> = {
  "garage": ["spaces/rooms/garage-interior.md#garage-interior-plan"],
  "roof group": ["spaces/roof/00-junctions.md#roof-mass-allocation"],
  "mat": ["models/18-house-props.md#porch-mat-planter"],
  "floor": ["spaces/10-ground-floor.md#garage-ground-floor-base"],
  "hall": ["spaces/rooms/upper-hall.md#upper-hall-plan"],
  "threshold": ["spaces/10-ground-floor.md#ground-threshold-junctions"],
  "ceiling plate": ["spaces/09-ceiling-assembly.md#upper-ceiling-closure"],
  "panel door": ["models/02-exterior-doors.md#garage-sectional-door"],
  "exterior wall": ["spaces/envelope/front.md#front-roof-closures"],
  "entry": ["spaces/rooms/entry.md#entry-plan"],
  "roof": ["spaces/roof/00-junctions.md#roof-mass-allocation"],
  "eave": ["spaces/roof/00-junctions.md#roof-profile-datums"],
  "wardrobe": ["models/13-bedrooms.md#sliding-closet"],
  "dining table": ["models/10-kitchen-dining.md#dining-table"],
  "bench": ["models/12-service-rooms.md#mudroom-bench"],
  "fireplace": ["models/11-living.md#fireplace-insert-mantel"],
  "niche": ["spaces/rooms/shower-bath.md#shower-fixture-use"],
  "clothes": ["models/13-bedrooms.md#wardrobe-hanging"],
  "planter": ["models/18-house-props.md#porch-mat-planter"],
  "table": [
    "models/11-living.md#low-table",
    "models/10-kitchen-dining.md#dining-table",
  ],
  "props": [
    "models/18-house-props.md#kitchen-food-utensils",
    "models/19-room-accents.md#living-tabletop-props",
  ],
  "towel": ["models/18-house-props.md#linen-folded-towels"],
  "separation wall": ["spaces/02-stair.md#stair-boundary-heights"],
  "partition": ["spaces/rooms/common.md#common-room-plan"],
  "container": ["models/12-service-rooms.md#pantry-containers"],
  "back plate": ["spaces/rooms/shower-bath.md#shower-fixture-use"],
  "linen closet": ["models/05-closet-fittings.md#linen-closet-fittings"],
  "baseboard": ["models/06-interior-trim.md#wall-baseboard"],
  "stair skirt": ["models/04-stair-members.md#stair-side-skirt"],
  "casing": [
    "models/01-windows.md#window-sill-trim",
    "models/02-exterior-doors.md#front-entry-door",
    "models/02-exterior-doors.md#garden-door-pair",
    "models/03-interior-doors.md#interior-door-members",
  ],
  "door frame": [
    "models/02-exterior-doors.md#front-entry-door",
    "models/02-exterior-doors.md#garden-door-pair",
    "models/03-interior-doors.md#interior-door-members",
  ],
  "jamb": [
    "models/02-exterior-doors.md#front-entry-door",
    "models/02-exterior-doors.md#garden-door-pair",
    "models/03-interior-doors.md#interior-door-members",
  ],
  "leaf": [
    "models/02-exterior-doors.md#front-entry-door",
    "models/02-exterior-doors.md#garden-door-pair",
    "models/02-exterior-doors.md#garage-sectional-door",
    "models/02-exterior-doors.md#side-yard-gate",
    "models/03-interior-doors.md#interior-door-members",
    "models/05-closet-fittings.md#coat-closet-doors",
    "models/05-closet-fittings.md#linen-closet-fittings",
    "models/13-bedrooms.md#sliding-closet",
  ],
  "window frame": ["models/01-windows.md#window-member-sizes"],
  "sill": ["models/01-windows.md#window-sill-trim"],
  trim: [
    "models/01-windows.md#window-sill-trim",
    "models/02-exterior-doors.md#front-entry-door",
    "models/02-exterior-doors.md#garden-door-pair",
    "models/15-outdoor.md#exterior-corner-trim",
  ],
  "curtain": [
    "models/13-bedrooms.md#primary-window-curtains",
    "models/14-bathrooms.md#tub-curtain-rail",
  ],
  "flashing": ["models/15-outdoor.md#asphalt-shingle-strip"],
  "gutter": ["models/15-outdoor.md#eave-gutter-downspout"],
  "shingle": ["models/15-outdoor.md#asphalt-shingle-strip"],
  "tree": ["models/16-planting.md#site-tree-prototypes"],
  "planting": [
    "models/16-planting.md#site-tree-prototypes",
    "models/16-planting.md#site-shrub-prototype",
  ],
  "shrub": ["models/16-planting.md#site-shrub-prototype"],
  "firebox": ["models/11-living.md#fireplace-insert-mantel"],
  "towel bar": ["models/14-bathrooms.md#towel-bar"],
  "baluster": ["models/04-stair-members.md#stair-balusters"],
  "riser": [
    "spaces/02-stair.md#stair-boundary-heights",
    "spaces/site/terrace.md#garden-steps-plan",
  ],
  "tread": [
    "spaces/02-stair.md#stair-reservation",
    "spaces/porch.md#porch-platform-access",
    "spaces/site/terrace.md#garden-steps-plan",
  ],
  "railing": [
    "spaces/02-stair.md#stair-boundary-heights",
    "models/04-stair-members.md#stair-balusters",
  ],
  "column": [
    "spaces/porch.md#porch-roof-columns",
    "spaces/02-stair.md#stair-boundary-heights",
  ],
  "handle": [
    "models/02-exterior-doors.md#front-entry-door",
    "models/03-interior-doors.md#interior-door-members",
    "spaces/02-stair.md#stair-boundary-heights",
  ],
  "hinge": [
    "models/02-exterior-doors.md#front-entry-door",
    "models/03-interior-doors.md#interior-door-members",
  ],
  "rail": [
    "models/02-exterior-doors.md#garage-sectional-door",
    "models/05-closet-fittings.md#coat-closet-doors",
    "models/14-bathrooms.md#tub-curtain-rail",
  ],
  "rod": [
    "models/05-closet-fittings.md#coat-closet-rod-shelf",
    "models/13-bedrooms.md#wardrobe-hanging",
    "models/14-bathrooms.md#tub-curtain-rail",
  ],
  "shelf": [
    "models/05-closet-fittings.md#coat-closet-rod-shelf",
    "models/05-closet-fittings.md#linen-closet-fittings",
    "models/12-service-rooms.md#pantry-l-shelf",
    "models/12-service-rooms.md#garage-shelving",
  ],
  "hook": [
    "models/12-service-rooms.md#mudroom-coat-hooks",
    "models/13-bedrooms.md#wardrobe-hanging",
  ],
  "glass": [
    "models/01-windows.md#window-member-sizes",
    "models/02-exterior-doors.md#garden-door-pair",
    "models/14-bathrooms.md#sliding-shower-booth",
  ],
  "countertop": [
    "models/10-kitchen-dining.md#kitchen-island",
    "models/12-service-rooms.md#laundry-folding-top",
    "models/15-outdoor.md#terrace-table",
  ],
  "base": [
    "spaces/porch.md#porch-roof-columns",
    "models/11-living.md#fabric-sofa",
  ],
  "hardware": [
    "models/02-exterior-doors.md#side-yard-gate",
    "models/03-interior-doors.md#interior-door-members",
  ],
  "lighting": [
    "models/17-light-fixtures.md#flush-ceiling-fixture",
    "models/17-light-fixtures.md#pendant-fixtures",
    "models/17-light-fixtures.md#vanity-wall-fixture",
    "models/17-light-fixtures.md#porch-wall-sconce",
  ],
  "cap": [
    "models/14-bathrooms.md#shared-toilet",
    "spaces/envelope/left.md#chimney-roof-interface",
  ],
  "airtight": ["models/12-service-rooms.md#pantry-containers"],
  "joint": [
    "materials/02-interior-shell.md#tile-grout",
    "spaces/site/01-paving-support.md#paving-depth-reservation",
  ],
};
/** Audited non-prototype nouns from the reviewed parent corpus. They denote
 * routes, boundaries, measurements, states, or later map placement rather than
 * an independently fabricated model. New nouns are not auto-enrolled here. */
const nonPrototype = new Set([
  "identity",
  "return",
  "prototype",
  "reading",
  "state",
  "placement",
  "relation",
  "space",
  "use",
  "frame",
  "storage",
  "system",
  "observation",
  "function",
  "hierarchy",
  "bed",
  "scale",
  "certification",
  "value",
  "string",
  "evidence",
  "finish",
  "boundary",
  "check",
  "transition",
  "coordinator",
  "code",
  "route",
  "pass",
  "judgment",
  "approval",
  "outline",
  "result",
  "claim",
  "reservation",
  "decision",
  "hole",
  "arrival",
  "underside",
  "one",
  "order",
  "form",
  "member",
  "passage",
  "module",
  "responsibility",
  "waiting",
  "input",
  "owner",
  "zone",
  "interface",
  "question",
  "view",
  "case",
  "occupancy",
  "width",
  "whole",
  "contact",
  "section",
  "entrance",
  "support",
  "paving",
  "depth",
  "connection",
  "viewpoint",
  "readability",
  "closure",
  "site",
  "walk",
  "output",
  "segment",
  "plan",
  "junction",
  "rule",
  "cut",
  "role",
  "substrate",
  "authority",
  "body",
  "rest",
  "instruction",
  "assignment",
  "ceiling",
  "part",
  "height",
  "panel",
  "gap",
  "surface",
  "limit",
  "elevation",
  "intersection",
  "step",
  "corner",
  "thickness",
  "family",
  "choice",
  "top",
  "measurement",
  "silhouette",
  "opening",
  "completion",
  "interior",
  "verification",
  "union",
  "back",
  "target",
  "turn",
  "position",
  "clearance",
  "moment",
  "mudroom",
  "array",
  "declaration",
  "mismatch",
  "transform",
  "end",
  "formula",
  "bottom",
  "division",
  "distance",
  "garden",
  "exception",
]);
for (const nonObject of ["reference", "level", "sectional"]) nonPrototype.add(nonObject);
if (process.argv.includes(
  "--mutate-drop-baseboard-maker",
)) owner["baseboard"] = [];
/** Irregular plurals and synonyms that the plain singular-or-plural word form misses. */
const forms: Record<string, RegExp> = {
  "shelf": /\bshel(?:f|ves)\b/i,
  "clothes": /\bcloth(?:es|ing)\b/i,
  "props": /\bprops?\b/i,
  "leaf": /\blea(?:f|ves)\b/i,
  "cap": /\b(?:caps?|lids?)\b/i,
  "countertop": /\b(?:countertops?|tabletops?|folding tops?)\b/i,
  "column": /\b(?:columns?|posts?)\b/i,
  "lighting": /\b(?:lighting|light fixtures?|lamps?)\b/i,
};
const word = (term: string) => forms[term] ?? new RegExp(`\\b${term}(?:s|es)?\\b`, "i");
const witness: Record<string, RegExp> = {
  "table": /table/i,
  "props": /props?|utensils?|groceries|food/i,
  "panel door": /garage door|sectional panel|panel/i,
  "clothes": /hanger|clothes|garments?/i,
  "casing": /casing/i,
  "door frame": /jamb|door frame|frame/i,
  "trim": /trim/i,
  "tree": /tree/i,
  "rail": /rail|track/i,
  "hardware": /hardware|hinge|handle/i,
  "lighting": /light|fixture|lamp/i,
  "column": /column|post/i,
  "handle": /handle|handrail/i,
  "cap": /cap|lid/i,
  "joint": /joint|grout/i,
  "countertop": /top/i,
  "shelf": /shel(?:f|ves)/i,
  "leaf": /lea(?:f|ves)/i,
  "hook": /hook/i,
};
const source = files("settings").concat(files("spaces"));
const bodies = source.flatMap((file) =>
  sections(read(file)).map(({ anchor, body }) => ({
    id: `${file}#${anchor}`,
    body,
  })),
);
// A newly named wall or room object must enter the vocabulary before a
// candidate-maker census can claim coverage. This deliberately scans source
// prose independently from the hand-maintained owner dictionary.
// Select determiner-marked English noun candidates without conditioning on any
// verb, so an authoring change of the verb cannot make the same new object
// disappear from the owner census.
const attachment = /\b(?:the|a|an|each|every|its|their|this|that|these|those|both|own|same|other|another)\s+([a-z]{3,})(?=[\s.,;:])/g;
const singular = (term: string) => term.endsWith("ies")
  ? `${term.slice(0, -3)}y`
  : term.endsWith("s") && !term.endsWith("ss")
    ? term.slice(0, -1)
    : term;
const registered = (term: string) => Object.hasOwn(owner, term) || Object.hasOwn(owner, singular(term)) ||
  Object.values(forms).some((form) => form.test(term));
const unregisteredReferents = bodies.flatMap(({ id, body }) => [...body.matchAll(attachment)]
  .map((match) => ({ id, term: match[1].toLowerCase() }))
  .filter(({ term }) => !registered(term) && !nonPrototype.has(term) && !nonPrototype.has(singular(term))));
const unregisteredTerms = [
  ...new Set(unregisteredReferents.map(({ term }) => term)),
];
const all = new Map(
  [...files("models"), ...files("spaces"), ...files("materials")].flatMap(
    (file) =>
      sections(read(file)).map(({ anchor, body }) => [
        `${file}#${anchor}`,
        body,
      ]),
  ),
);
const rows = Object.entries(owner).map(([term, makers]) => {
  const references = bodies.filter(({ body }) => word(term).test(body)).map(
    ({ id }) => id,
  );
  const invalid = makers.filter(
    (maker) => !all.has(maker) || !(witness[term] ?? new RegExp(term, "i")).test(all.get(maker) ?? ""),
  );
  return { term, references, makers, invalid };
});
const absent = rows.filter(
  (row) => row.references.length && (!row.makers.length || row.invalid.length),
);
const link = (id: string) => `[${id}](../../${id})`;
const table = ["| Named member | Parent/sibling H2 references | Maker H2 candidates |", "|---|---|---|", ...rows.filter((row) => row.references.length).map((row) => `| ${row.term} | ${row.references.map(link).join(", ")} | ${row.makers.map(link).join(", ")} |`)].join(
  "\n",
);
const unknownTable = ["| Unclassified term | Occurrences | First reviewed H2 | Status |", "|---|---:|---|---|",
  ...unregisteredTerms.map((term) => {
    const refs = unregisteredReferents.filter((item) => item.term === term);
    return `| ${term} | ${refs.length} | ${link(refs[0].id)} | UNCLASSIFIED |`;
  }),
].join("\n");
const output = `# Maker Back-Check Starting from Member References in the Reviewed Layers\n\n## Named Members and Maker Candidates {#spaces-referent-ledger}\n<!--\n@evidence contracts/model-referent-audit.md#model-referent-audit Searches every H2 body of the reviewed settings and spaces with the member vocabulary below and reports the referencing H2s together with the maker H2 candidates whose bodies name that member. Unclassified noun candidates are kept in a separate table to show that it has not yet been judged whether they are physical make targets. This measurement is lexical, so the per-place match of each reference and maker needs a separate source comparison.\n-->\n\nThe producer \`node src/measurements/referent-owner-scan.cjs --check\` rereads the source H2s and the maker bodies below. The vocabulary is in the producer source. The right column lists maker **candidates** per term and does not mean that the exact maker of every place where the same word is used has been confirmed. Concrete per-place members must be compared against the sentences of the referencing H2 and the maker H2 together. English face tokens are checked by the separate [material face list](material-face-ledger.md#material-face-ledger). Determiner-marked noun candidates may not be real members, so zero missing owners is not claimed until the table below is classified.\n\n${table}\n\n### Unclassified Noun Candidates\n\n${unknownTable}\n`;
const destination = path.join(
  docs,
  "accounts/models/spaces-referent-ledger.md",
);
if (process.argv.includes("--write")) fs.writeFileSync(destination, output);
else if (process.argv.includes("--check")) {
  const ledgerDiff = read("accounts/models/spaces-referent-ledger.md").replace(/\r\n/g, "\n") !== output;
  console.log(
    JSON.stringify({
      sourceH2: bodies.length,
      terms: rows.length,
      presentTerms: rows.filter((r) => r.references.length).length,
      referencePairs: rows.reduce((n, r) => n + r.references.length, 0),
      ownerless: absent.length,
      unregisteredTerms: unregisteredTerms.length,
      unregisteredReferents: unregisteredReferents.length,
      ledgerDiff,
    }),
  );
  if (ledgerDiff) {
    console.error("referent ledger differs from current corpus");
    process.exitCode = 1;
  }
} else console.log(
  JSON.stringify({ sourceH2: bodies.length, rows, absent }, null, 2),
);
if (absent.length) {
  for (const row of absent) console.error(
    `MISSING MAKER ${row.term} ${row.invalid.join(",")}`,
  );
  process.exitCode = 1;
}
if (unregisteredReferents.length) {
  const visible = process.argv.includes("--verbose")
    ? unregisteredTerms
    : unregisteredTerms.slice(0, 25);
  for (const term of visible) console.error(
    `UNREGISTERED TERM ${term} :: ${unregisteredReferents.find((row) => row.term === term)?.id}`,
  );
  if (visible.length < unregisteredTerms.length) console.error(
    `... ${unregisteredTerms.length - visible.length} more terms; --verbose lists all`,
  );
}
