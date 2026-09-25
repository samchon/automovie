/** Inverse owner inventory for physical referents in reviewed settings/spaces.
 * The named vocabulary is intentionally stored here with its maker witnesses;
 * adding a referent without a maker fails instead of disappearing from grep. */
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const docs = path.join(root, "docs");
/** @param {string} name */
const read = (name) => fs.readFileSync(path.join(docs, name), "utf8");
/** @param {string} source */
const sections = (source) => [...source.split(/^## /m).slice(1)].map((block) => {
  const end = block.indexOf("\n");
  const anchor = /\{#([^}]+)\}/.exec(block.slice(0, end))?.[1];
  if (!anchor) throw new Error(`unnamed H2: ${block.slice(0, end)}`);
  return { anchor, body: block.slice(end + 1).replace(/<!--[\s\S]*?-->/g, "") };
});
/** @param {string} directory @returns {string[]} */
const files = (directory) => fs.readdirSync(path.join(docs, directory), { withFileTypes: true }).flatMap((entry) => {
  const relative = `${directory}/${entry.name}`;
  return entry.isDirectory() ? files(relative) : entry.name.endsWith(".md") ? [relative] : [];
});
/** Each address is a physical maker H2 or a declared no-mesh mask. */
const owner = {
  "차고": ["spaces/rooms/garage-interior.md#garage-interior-plan"],
  "지붕군": ["spaces/roof/00-junctions.md#roof-mass-allocation"],
  "매트": ["models/18-house-props.md#porch-mat-planter"],
  "바닥": ["spaces/10-ground-floor.md#garage-ground-floor-base"],
  "복도": ["spaces/rooms/upper-hall.md#upper-hall-plan"],
  "문턱": ["spaces/10-ground-floor.md#ground-threshold-junctions"],
  "천장판": ["spaces/09-ceiling-assembly.md#upper-ceiling-closure"],
  "패널문": ["models/02-exterior-doors.md#garage-sectional-door"],
  "외벽": ["spaces/envelope/front.md#front-roof-closures"],
  "현관": ["spaces/rooms/entry.md#entry-plan"],
  "지붕": ["spaces/roof/00-junctions.md#roof-mass-allocation"],
  "처마": ["spaces/roof/00-junctions.md#roof-profile-datums"],
  "옷장": ["models/13-bedrooms.md#sliding-closet"],
  "식탁": ["models/10-kitchen-dining.md#dining-table"],
  "벤치": ["models/12-service-rooms.md#mudroom-bench"],
  "벽난로": ["models/11-living.md#fireplace-insert-mantel"],
  "벽감": ["spaces/rooms/shower-bath.md#shower-fixture-use"],
  "의류": ["models/13-bedrooms.md#wardrobe-hanging"],
  "화분": ["models/18-house-props.md#porch-mat-planter"],
  "테이블": ["models/11-living.md#low-table", "models/10-kitchen-dining.md#dining-table"],
  "소품": ["models/18-house-props.md#kitchen-food-utensils", "models/19-room-accents.md#living-tabletop-props"],
  "수건": ["models/18-house-props.md#linen-folded-towels"],
  "분리벽": ["spaces/02-stair.md#stair-boundary-heights"],
  "칸막이": ["spaces/rooms/common.md#common-room-plan"],
  "용기": ["models/12-service-rooms.md#pantry-containers"],
  "뒤판": ["spaces/rooms/shower-bath.md#shower-fixture-use"],
  "린넨장": ["models/05-closet-fittings.md#linen-closet-fittings"],
  "걸레받이": ["models/06-interior-trim.md#wall-baseboard"],
  "계단 측판": ["models/04-stair-members.md#stair-side-skirt"],
  "문선": ["models/01-windows.md#window-sill-trim", "models/02-exterior-doors.md#front-entry-door", "models/02-exterior-doors.md#garden-door-pair", "models/03-interior-doors.md#interior-door-members"],
  "문틀": ["models/02-exterior-doors.md#front-entry-door", "models/02-exterior-doors.md#garden-door-pair", "models/03-interior-doors.md#interior-door-members"],
  "문설주": ["models/02-exterior-doors.md#front-entry-door", "models/02-exterior-doors.md#garden-door-pair", "models/03-interior-doors.md#interior-door-members"],
  "문짝": ["models/02-exterior-doors.md#front-entry-door", "models/02-exterior-doors.md#garden-door-pair", "models/02-exterior-doors.md#garage-sectional-door", "models/02-exterior-doors.md#side-yard-gate", "models/03-interior-doors.md#interior-door-members", "models/05-closet-fittings.md#coat-closet-doors", "models/05-closet-fittings.md#linen-closet-fittings", "models/13-bedrooms.md#sliding-closet"],
  "창틀": ["models/01-windows.md#window-member-sizes"],
  "창대": ["models/01-windows.md#window-sill-trim"],
  "trim": ["models/01-windows.md#window-sill-trim", "models/02-exterior-doors.md#front-entry-door", "models/02-exterior-doors.md#garden-door-pair", "models/15-outdoor.md#exterior-corner-trim"],
  "트림": ["models/15-outdoor.md#exterior-corner-trim", "models/01-windows.md#window-sill-trim"],
  "커튼": ["models/13-bedrooms.md#primary-window-curtains", "models/14-bathrooms.md#tub-curtain-rail"],
  "후레싱": ["models/15-outdoor.md#asphalt-shingle-strip"],
  "홈통": ["models/15-outdoor.md#eave-gutter-downspout"],
  "지붕널": ["models/15-outdoor.md#asphalt-shingle-strip"],
  "수목": ["models/16-planting.md#site-tree-prototypes"],
  "식재": ["models/16-planting.md#site-tree-prototypes", "models/16-planting.md#site-shrub-prototype"],
  "관목": ["models/16-planting.md#site-shrub-prototype"],
  "화구": ["models/11-living.md#fireplace-insert-mantel"],
  "수건걸이": ["models/14-bathrooms.md#towel-bar"],
  "난간살": ["models/04-stair-members.md#stair-balusters"],
  "챌판": ["spaces/02-stair.md#stair-boundary-heights", "spaces/site/terrace.md#garden-steps-plan"],
  "디딤": ["spaces/02-stair.md#stair-reservation", "spaces/porch.md#porch-platform-access", "spaces/site/terrace.md#garden-steps-plan"],
  "난간": ["spaces/02-stair.md#stair-boundary-heights", "models/04-stair-members.md#stair-balusters"],
  "기둥": ["spaces/porch.md#porch-roof-columns", "spaces/02-stair.md#stair-boundary-heights"],
  "손잡이": ["models/02-exterior-doors.md#front-entry-door", "models/03-interior-doors.md#interior-door-members", "spaces/02-stair.md#stair-boundary-heights"],
  "경첩": ["models/02-exterior-doors.md#front-entry-door", "models/03-interior-doors.md#interior-door-members"],
  "레일": ["models/02-exterior-doors.md#garage-sectional-door", "models/05-closet-fittings.md#coat-closet-doors", "models/14-bathrooms.md#tub-curtain-rail"],
  "봉": ["models/05-closet-fittings.md#coat-closet-rod-shelf", "models/13-bedrooms.md#wardrobe-hanging", "models/14-bathrooms.md#tub-curtain-rail"],
  "선반": ["models/05-closet-fittings.md#coat-closet-rod-shelf", "models/05-closet-fittings.md#linen-closet-fittings", "models/12-service-rooms.md#pantry-l-shelf", "models/12-service-rooms.md#garage-shelving"],
  "걸이": ["models/12-service-rooms.md#mudroom-coat-hooks", "models/13-bedrooms.md#wardrobe-hanging"],
  "유리": ["models/01-windows.md#window-member-sizes", "models/02-exterior-doors.md#garden-door-pair", "models/14-bathrooms.md#sliding-shower-booth"],
  "상판": ["models/10-kitchen-dining.md#kitchen-island", "models/12-service-rooms.md#laundry-folding-top", "models/15-outdoor.md#terrace-table"],
  "받침": ["spaces/porch.md#porch-roof-columns", "models/11-living.md#fabric-sofa"],
  "철물": ["models/02-exterior-doors.md#side-yard-gate", "models/03-interior-doors.md#interior-door-members"],
  "조명": ["models/17-light-fixtures.md#flush-ceiling-fixture", "models/17-light-fixtures.md#pendant-fixtures", "models/17-light-fixtures.md#vanity-wall-fixture", "models/17-light-fixtures.md#porch-wall-sconce"],
  "덮개": ["models/14-bathrooms.md#shared-toilet", "spaces/envelope/left.md#chimney-roof-interface"],
  "밀폐": ["models/12-service-rooms.md#pantry-containers"],
  "줄눈": ["materials/02-interior-shell.md#tile-grout", "spaces/site/01-paving-support.md#paving-depth-reservation"],
};
/** Audited non-prototype nouns from the reviewed parent corpus. They denote
 * routes, boundaries, measurements, states, or later map placement rather than
 * an independently fabricated model. New nouns are not auto-enrolled here. */
const nonPrototype = new Set(["정체성","복귀","원형","읽기","상태","배치","관계","공간","용도","프레임","수납","체계","관찰","기능","위계","화단","규모","인증","계산값","문자열","증거","마감","경계","검사","전이","조정자","코드","경로","합격","판정","승인","외곽","결과","주장","예약","결정","구멍","도착","아래면","하나","순서","형태","합격값","부재","통로","모듈","책임","대기","입력","소유자","구역","접면","질문","시야","경우","점유","순폭","전체","접점","단면","출입","지지","포장","통행","깊이","연결","시점","읽히는지","폐쇄","대지","보행길","관계없","산출물","구간","평면","접합","규칙","절단","역할","바탕","권한","몸체","나머지","윤곽","외곽선","지시","배정","천장","부분","높이","패널","빈틈","평탄면","한계","돌아","입면","교차선","단차","모서리","두께","가족실","선택","상단","측정값","실루엣","개구부","완료","내부","수치","검증","합집합","뒤쪽","목표","회전","읽힘","접촉","위치","접속","여유","계측값","사이","순간","코너","머드룸","일부","배열","선언","불일치","변환","끝선","높이식","하단","분할","검증값","거리","정원","예외"]);
for (const nonObject of ["기준", "대기면", "분절"]) nonPrototype.add(nonObject);
if (process.argv.includes("--mutate-drop-baseboard-maker")) owner["걸레받이"] = [];
/** @type {Record<string, RegExp>} */
const witness = {
  "테이블": /테이블|식탁/,
  "소품": /소품|조리도구|식료품/,
  "패널문": /차고문|분절 패널/,
  "의류": /옷걸이|옷 18벌/,
  "문선": /문선|casing/,
  "문틀": /문설주|jamb/,
  "트림": /트림|trim/,
  "수목": /수목|나무|tree/,
  "레일": /레일|트랙|rail/,
  "철물": /철물|경첩|손잡이|hinge|handle/,
  "조명": /조명|기구|fixture/,
};
const source = files("settings").concat(files("spaces"));
const bodies = source.flatMap((file) => sections(read(file)).map(({ anchor, body }) => ({ id: `${file}#${anchor}`, body })));
// A newly named wall or room object must enter the vocabulary before a
// candidate-maker census can claim coverage. This deliberately scans source
// prose independently from the hand-maintained owner dictionary.
// Select particle-marked Korean noun candidates without conditioning on any
// verb. The previous six-verb matcher let an authoring change from "붙인다"
// to "둔다" make the same new object disappear from the owner census.
const attachment = /(?:^|[\s.,;:])([가-힣]{2,12})(?:에서|에게|으로|까지|부터|은|는|이|가|을|를|도|과|와|에|의)(?=[\s.,;:])/gm;
const unregisteredReferents = bodies.flatMap(({ id, body }) => [...body.matchAll(attachment)]
  .map((match) => ({ id, term: match[1] }))
  .filter(({ term }) => !Object.hasOwn(owner, term) && !nonPrototype.has(term)));
const unregisteredTerms = [...new Set(unregisteredReferents.map(({ term }) => term))];
const all = new Map([...files("models"), ...files("spaces"), ...files("materials")].flatMap((file) => sections(read(file)).map(({ anchor, body }) => [`${file}#${anchor}`, body])));
const rows = Object.entries(owner).map(([term, makers]) => {
  const references = bodies.filter(({ body }) => body.includes(term)).map(({ id }) => id);
  const invalid = makers.filter((maker) => !all.has(maker) || !(witness[term] ?? new RegExp(term)).test(all.get(maker) ?? ""));
  return { term, references, makers, invalid };
});
const absent = rows.filter((row) => row.references.length && (!row.makers.length || row.invalid.length));
/** @param {string} id */
const link = (id) => `[${id}](../../${id})`;
const table = ["| 명명 부재 | 부모·형제 H2 참조 | 제작 H2 후보 |", "|---|---|---|", ...rows.filter((row) => row.references.length).map((row) => `| ${row.term} | ${row.references.map(link).join(", ")} | ${row.makers.map(link).join(", ")} |`)].join("\n");
const unknownTable = ["| 미분류 어휘 | 등장 횟수 | 첫 reviewed H2 | 상태 |", "|---|---:|---|---|",
  ...unregisteredTerms.map((term) => {
    const refs = unregisteredReferents.filter((item) => item.term === term);
    return `| ${term} | ${refs.length} | ${link(refs[0].id)} | UNCLASSIFIED |`;
  }),
].join("\n");
const output = `# reviewed 층의 부재 참조에서 출발한 제작자 역대조\n\n## 명명 부재와 제작자 후보 {#spaces-referent-ledger}\n<!--\n@evidence contracts/model-referent-audit.md#model-referent-audit reviewed settings·spaces의 모든 H2 본문을 아래 부재 어휘로 조사하고 참조 H2와 본문에 해당 부재를 명명한 제작 H2 후보를 함께 낸다. 미분류 명사 후보는 별도 표에 남겨 물리 제작 대상인지 아직 판정되지 않았음을 드러낸다. 이 계측은 어휘 수준이므로 개별 참조와 제작자의 장소별 일치는 별도 원문 대조가 필요하다.\n-->\n\n생산자 \`node src/measurements/referent-owner-scan.cjs --check\`가 원본 H2와 아래 제작자 본문을 다시 읽는다. 어휘는 생산자 source에 있다. 오른쪽 열은 어휘별 제작자 **후보**이며 같은 단어가 쓰인 각 장소의 정확한 제작자가 모두 확인됐다는 뜻이 아니다. 구체 장소별 부재는 해당 참조 H2와 제작 H2의 문장을 함께 대조해야 한다. 영어 면 토큰은 별도 [재료 면 목록](material-face-ledger.md#material-face-ledger)이 검사한다. 조사 결합 명사 후보는 실제 부재가 아닐 수도 있으므로 아래 표를 분류하기 전까지 owner 누락 0을 주장하지 않는다.\n\n${table}\n\n### 미분류 명사 후보\n\n${unknownTable}\n`;
const destination = path.join(docs, "accounts/models/spaces-referent-ledger.md");
if (process.argv.includes("--write")) fs.writeFileSync(destination, output);
else if (process.argv.includes("--check")) {
  const ledgerDiff = read("accounts/models/spaces-referent-ledger.md").replace(/\r\n/g, "\n") !== output;
  console.log(JSON.stringify({ sourceH2: bodies.length, terms: rows.length, presentTerms: rows.filter((r) => r.references.length).length, referencePairs: rows.reduce((n, r) => n + r.references.length, 0), ownerless: absent.length, unregisteredTerms: unregisteredTerms.length, unregisteredReferents: unregisteredReferents.length, ledgerDiff }));
  if (ledgerDiff) { console.error("referent ledger differs from current corpus"); process.exitCode = 1; }
} else console.log(JSON.stringify({ sourceH2: bodies.length, rows, absent }, null, 2));
if (absent.length) { for (const row of absent) console.error(`MISSING MAKER ${row.term} ${row.invalid.join(",")}`); process.exitCode = 1; }
if (unregisteredReferents.length) {
  const visible = process.argv.includes("--verbose") ? unregisteredTerms : unregisteredTerms.slice(0, 25);
  for (const term of visible) console.error(`UNREGISTERED TERM ${term} :: ${unregisteredReferents.find((row) => row.term === term)?.id}`);
  if (visible.length < unregisteredTerms.length) console.error(`... ${unregisteredTerms.length - visible.length} more terms; --verbose lists all`);
  process.exitCode = 1;
}
