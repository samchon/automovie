import {
  type IAutoMovieHumanBodyBasisDocument,
  type IAutoMovieHumanBodySimpleShape,
  type IAutoMovieHumanPersonBodyView,
  type IAutoMovieHumanPersonHeadView,
  compileHumanPersonGeneration,
  createHumanPersonSimpleWhole,
  evaluateHumanBodyShape,
  expandHumanBodySimpleShape,
  humanBodyBasisWeights,
  joinHumanPersonGeneration,
  measureHumanBodySimpleShape,
} from "@automovie/human";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { ANSUR_BODY_MEASURES } from "./ANSUR_BODY_MEASURES";
import type { IAnsurCensusRefusal } from "./IAnsurCensusRefusal";
import type { IAnsurCensusSubject } from "./IAnsurCensusSubject";
import type { IAnsurCensusUnread } from "./IAnsurCensusUnread";
import {
  type IAnsurCensusRow,
  formatAnsurCensusTable,
} from "./formatAnsurCensusTable";
import { parseAnsurCsv } from "./parseAnsurCsv";
import { pickAnsurStrata } from "./pickAnsurStrata";
import { summariseAnsurResiduals } from "./summariseAnsurResiduals";

/**
 * Census how the body reproduces the proportions of measured people when the
 * simple tier is given only the identity card (sex, age, stature, mass,
 * muscle 0), the way the editor is used.
 *
 * Usage, from `test/`:
 * `pnpm exec ttsx -P tsconfig.scripts.json scripts/body-ansur/ansur-proportion-census.ts <label> [peoplePerSex=12] [generationDirectory] [outputDirectory]`.
 * For each sex of the ANSUR II public CSVs under `.references/anthropometry`
 * it takes `peoplePerSex` real adults spread over the 1st to 99th BMI
 * percentile, expands each one's identity card through
 * `expandHumanBodySimpleShape` on the published one-skin generation's body
 * view, with stature and mass read on the whole person (the standard face,
 * `createHumanPersonSimpleWhole`), reads the body at rest and writes, per
 * `ANSUR_BODY_MEASURES` row, the signed residual (body minus person, mm) by
 * thin-to-heavy band. A person the simple tier refuses is listed with its
 * reason and its card instead of being dropped. The people are probes of the
 * measured population's spread and never a fitting target: no constant is
 * taken from any of them. Output defaults to the campaign's ignored wiki
 * artifact directory. `<label>.documents.json` holds each expanded body as a
 * viewer document; a consumer must supply its matching source generation.
 * The optional generation directory reads a candidate's head/body files before
 * publication; omission reads the shipped generation. Exact input-file digests
 * and actual subject IDs bind both outcomes, including refusals. Input drift
 * during the run refuses publication instead of joining two generations.
 * An explicit output directory keeps new receipts in the caller's declared
 * artifact storage. Startup records the actual executing Node process and
 * immutable ttsx dependency emits, not the host shell's Node or current source
 * index alone. Progress reports completed outcomes separately from the next
 * selected subject; partial runtime identity is not a completed census.
 */
const label = process.argv[2] ?? "census";
const perSex = Number(process.argv[3] ?? 12);
const root = path.resolve(__dirname, "../../..");
const generationDirectory = path.resolve(
  process.argv[4] ?? path.join(root, "test/studies/human-person/generation"),
);
const sourceFiles = [
  "test/studies/human-person/generation/head.json.gz",
  "test/studies/human-person/generation/body.json.gz",
  ".references/anthropometry/ANSUR_II_FEMALE_Public.csv",
  ".references/anthropometry/ANSUR_II_MALE_Public.csv",
];
const sourcePath = (file: string): string =>
  file.startsWith("test/studies/human-person/generation/")
    ? path.join(generationDirectory, path.basename(file))
    : path.join(root, file);
const sourceBytes = new Map(
  sourceFiles.map((file) => [file, fs.readFileSync(sourcePath(file))]),
);
const sourceDigests = Object.fromEntries(
  [...sourceBytes].map(([file, bytes]) => [
    file,
    createHash("sha256").update(bytes).digest("hex"),
  ]),
);
const directory = path.resolve(
  process.argv[5] ??
    path.join(root, ".wiki/08-campaigns/2707-human/artifacts/ansur-census"),
);
const manifestFile = process.env.TTSX_RUNTIME_MANIFEST;
if (manifestFile === undefined)
  throw new Error(
    "ANSUR census needs the owning ttsx runtime emission manifest.",
  );
const manifestBytes = fs.readFileSync(manifestFile);
const runtimeManifest = JSON.parse(manifestBytes.toString("utf8")) as Record<
  string,
  unknown
>;
for (const field of ["depCacheDir", "entryFile", "entrySource"])
  if (typeof runtimeManifest[field] !== "string")
    throw new Error("ANSUR runtime manifest lacks " + field);
const dependencyDirectory = runtimeManifest.depCacheDir as string;
const loadedSources = Object.keys(require.cache).map((file) =>
  fs.realpathSync(file),
);
const dependencyEmits = fs
  .readdirSync(dependencyDirectory)
  .filter((file) => /^[a-f0-9]{16}\.json$/.test(file))
  .map((file) => {
    const markerPath = path.join(dependencyDirectory, file);
    const markerBytes = fs.readFileSync(markerPath);
    const marker = JSON.parse(markerBytes.toString("utf8")) as Record<
      string,
      unknown
    >;
    if (
      typeof marker.rootDir !== "string" ||
      typeof marker.generation !== "string" ||
      !/^[a-f0-9]{32}$/.test(marker.generation)
    )
      throw new Error(
        "ANSUR runtime dependency has no immutable generation: " + file,
      );
    const sourceRoot = fs.realpathSync(marker.rootDir);
    const emitRoot = path.join(
      dependencyDirectory,
      path.basename(file, ".json"),
      "gen-" + marker.generation,
    );
    const files = loadedSources
      .filter((source) => {
        const relative = path.relative(sourceRoot, source);
        return (
          relative !== "" &&
          !relative.startsWith("..") &&
          !path.isAbsolute(relative)
        );
      })
      .map((source) => {
        const relative = path.relative(sourceRoot, source);
        const emitted = path.join(
          emitRoot,
          relative.replace(/\.(ts|tsx|mts|cts)$/, (extension) =>
            extension === ".mts"
              ? ".mjs"
              : extension === ".cts"
                ? ".cjs"
                : ".js",
          ),
        );
        const bytes = fs.readFileSync(emitted);
        return {
          source,
          emitted,
          bytes: bytes.length,
          sha256: createHash("sha256").update(bytes).digest("hex"),
        };
      });
    return {
      sourceRoot,
      emitRoot,
      generation: marker.generation,
      markerPath,
      markerSha256: createHash("sha256").update(markerBytes).digest("hex"),
      files,
    };
  })
  .filter((dependency) => dependency.files.length > 0);
if (
  !dependencyEmits.some(
    (dependency) =>
      path.relative(
        path.join(root, "packages/human/src"),
        dependency.sourceRoot,
      ) === "",
  )
)
  throw new Error(
    "ANSUR census has no loaded immutable human SDK emission identity.",
  );
const entryFile = runtimeManifest.entryFile as string;
const entryBytes = fs.readFileSync(entryFile);
const runtimeIdentity = {
  pid: process.pid,
  parentPid: process.ppid,
  node: process.version,
  execPath: process.execPath,
  manifestFile,
  manifestSha256: createHash("sha256").update(manifestBytes).digest("hex"),
  entrySource: runtimeManifest.entrySource,
  entryFile,
  entrySha256: createHash("sha256").update(entryBytes).digest("hex"),
  dependencyEmits,
};
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(
  path.join(directory, label + ".runtime.json"),
  JSON.stringify(
    { runtimeIdentity, sourceDigests, generationDirectory },
    null,
    1,
  ),
);
console.error(
  "ANSUR runtime",
  JSON.stringify({
    pid: process.pid,
    node: process.version,
    execPath: process.execPath,
    entrySha256: runtimeIdentity.entrySha256,
    loadedModules: dependencyEmits.reduce(
      (sum, dependency) => sum + dependency.files.length,
      0,
    ),
    sourceDigests,
  }),
);
const started = performance.now();
const view = <T>(file: string): T =>
  JSON.parse(
    zlib
      .gunzipSync(
        sourceBytes.get("test/studies/human-person/generation/" + file)!,
      )
      .toString("utf8"),
  ) as T;
const head = view<IAutoMovieHumanPersonHeadView>("head.json.gz");
const bodyView = view<IAutoMovieHumanPersonBodyView>("body.json.gz");
const basis = bodyView.body;
// stature and closed volume belong to the whole person: the standard face on
// the body shape being solved
/**
 * Where each subject's head comes from. ANSUR II states the subject's stature
 * but the census has no head shape for the subject, so the whole person's
 * head is the standard face: the head height inside each solved stature is
 * the standard face's, a convention, not the subject's measured head.
 */
const HEAD_CONVENTION = "whole person; head: standard face (convention)";
const whole = createHumanPersonSimpleWhole(
  compileHumanPersonGeneration(joinHumanPersonGeneration(head, bodyView)),
  {
    id: "census",
    name: "census",
    population: "linked",
    face: {
      id: "census-face",
      name: "standard face",
      basis: head.face.id,
      shape: {},
      expression: {},
    },
    body: {
      id: "census-body",
      name: "census body",
      basis: basis.id,
      shape: {},
    },
  },
);
const bmi = (row: Record<string, number>): number =>
  row.weightkg / 10 / (row.stature / 1000) ** 2;

const rows: IAnsurCensusRow[] = [];
const documents: IAutoMovieHumanBodyBasisDocument[] = [];
const refused: IAnsurCensusRefusal[] = [];
const unread: IAnsurCensusUnread[] = [];
const subjects: IAnsurCensusSubject[] = [];
for (const [sex, file, code] of [
  ["female", "ANSUR_II_FEMALE_Public.csv", -1],
  ["male", "ANSUR_II_MALE_Public.csv", 1],
] as const) {
  const people = pickAnsurStrata(
    parseAnsurCsv(
      sourceBytes.get(".references/anthropometry/" + file)!.toString("utf8"),
    ),
    bmi,
    perSex,
  );
  const residuals = ANSUR_BODY_MEASURES.map(() => [] as number[]);
  for (const person of people) {
    if (subjects.length % 10 === 0)
      console.error(
        "ANSUR subject",
        JSON.stringify({
          sex,
          subjectId: person.subjectid,
          completed: subjects.length,
          built: documents.length,
          refused: refused.length,
          elapsedMilliseconds: performance.now() - started,
        }),
      );
    if (!Number.isSafeInteger(person.subjectid))
      throw new Error(
        `ANSUR ${sex} selected row has no safe numeric subjectid.`,
      );
    const card: IAutoMovieHumanBodySimpleShape = {
      sex: code,
      ageYears: person.age,
      statureMetres: person.stature / 1000,
      massKilograms: person.weightkg / 10,
      muscle: 0,
    };
    try {
      const shape = expandHumanBodySimpleShape(basis, whole, card);
      const expandedDocument: IAutoMovieHumanBodyBasisDocument = {
        id: `${label}-${sex}-${person.subjectid}`,
        name: `${sex} BMI ${bmi(person).toFixed(1)}, ${card.statureMetres.toFixed(3)} m, ${card.massKilograms.toFixed(1)} kg`,
        basis: basis.id,
        shape,
      };
      const shaped = evaluateHumanBodyShape(
        basis,
        humanBodyBasisWeights(basis, { shape }),
      );
      const floor = Math.min(
        ...shaped.surfaces.map((positions) => {
          let low = Infinity;
          for (let v = 1; v < positions.length; v += 3)
            low = Math.min(low, positions[v]);
          return low;
        }),
      );
      const readings = ANSUR_BODY_MEASURES.map((measure) => {
        const metres =
          measure.read.kind === "channel"
            ? measureHumanBodySimpleShape.channel(basis, shape, measure.read.id)
            : shaped.landmarks[measure.read.landmark].y - floor;
        return metres;
      });
      readings.forEach((metres, index) => {
        const measure = ANSUR_BODY_MEASURES[index];
        // a reading the body cannot take is listed by name, never dropped
        if (metres === null) {
          unread.push({
            sex,
            measure: measure.name,
            reason: `the body cannot measure ${measure.name} on ${basis.id}`,
          });
          return;
        }
        if (person[measure.column] === undefined) return;
        residuals[index].push(metres * 1000 - person[measure.column]);
      });
      documents.push(expandedDocument);
      subjects.push({ sex, subjectId: person.subjectid, outcome: "built" });
    } catch (error) {
      subjects.push({ sex, subjectId: person.subjectid, outcome: "refused" });
      refused.push({
        sex,
        subjectId: person.subjectid,
        card,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }
  ANSUR_BODY_MEASURES.forEach((measure, index) => {
    const bands = Math.min(3, residuals[index].length);
    if (bands === 0) return;
    rows.push({
      sex,
      measure: measure.name,
      sameDefinition: measure.sameDefinition,
      count: residuals[index].length,
      bands: summariseAnsurResiduals(residuals[index], bands),
    });
  });
  console.error(
    "ANSUR sex complete",
    JSON.stringify({
      sex,
      completed: subjects.length,
      built: documents.length,
      refused: refused.length,
      elapsedMilliseconds: performance.now() - started,
    }),
  );
}
for (const [file, digest] of Object.entries(sourceDigests))
  if (
    createHash("sha256")
      .update(fs.readFileSync(sourcePath(file)))
      .digest("hex") !== digest
  )
    throw new Error("ANSUR census input changed during measurement: " + file);
for (const dependency of dependencyEmits)
  for (const file of dependency.files)
    if (
      createHash("sha256")
        .update(fs.readFileSync(file.emitted))
        .digest("hex") !== file.sha256
    )
      throw new Error(
        "ANSUR loaded SDK emission changed during measurement: " + file.emitted,
      );
if (
  createHash("sha256").update(fs.readFileSync(entryFile)).digest("hex") !==
  runtimeIdentity.entrySha256
)
  throw new Error("ANSUR actual entry emission changed during measurement.");
const table = formatAnsurCensusTable(rows);
fs.writeFileSync(
  path.join(directory, label + ".md"),
  `Head: ${HEAD_CONVENTION}. Unread readings: ${unread.length}; refused subjects: ${refused.length}.

` + table,
);
fs.writeFileSync(
  path.join(directory, label + ".json"),
  JSON.stringify(
    {
      basis: basis.id,
      generation: head.id,
      generationDirectory,
      sourceDigests,
      runtimeIdentity,
      convention: HEAD_CONVENTION,
      perSex,
      selected: subjects.length,
      subjects,
      rows,
      refused,
      unread,
    },
    null,
    1,
  ),
);
fs.writeFileSync(
  path.join(directory, label + ".documents.json"),
  JSON.stringify(documents),
);
console.log(table);
console.log("refused", refused.length);
