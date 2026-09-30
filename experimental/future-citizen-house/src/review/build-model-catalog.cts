/**
 * Copy reviewed model coordinate rows to static TypeScript records.
 *
 * This authoring helper is kept beside the production's audits. Runtime code
 * never reads Markdown or guesses extents from a prose label. Run from this
 * production root as `tsx src/review/build-model-catalog.cts` to write the
 * catalogs under `src/models`, or with `--check` to refuse a catalog that no
 * longer equals what the reviewed docs generate.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

/** A coordinate read from the docs. It prints as the docs' number with a decimal point, as the catalogs were first generated. */
class Decimal {
  public constructor(public readonly value: number) {}
}

type Interval = [Decimal, Decimal];
interface IPart {
  id: string;
  shape: string;
  x: Interval;
  y: Interval;
  z: Interval;
}
interface IState {
  state: string;
  parts: IPart[];
  inventory?: string[];
  envelope?: { x: Interval; y: Interval; z: Interval };
  plantSpec?: unknown;
  [field: string]: unknown;
}

const root = resolve(__dirname, "../..");
const docs = resolve(root, "docs/models");
const output = resolve(root, "src/models");

const decimal = (text: string): Decimal => new Decimal(Number(text));
const interval = (token: string): Interval => {
  const [a, b] = token.replace("−", "-").split("..");
  return [decimal(a!), decimal(b!)];
};
const expand = (token: string): string[] => {
  const range = /^(.+)-(\d+)\.\.(\d+)$/.exec(token);
  if (range === null) return [token];
  const first = Number(range[2]);
  return Array.from(
    { length: Number(range[3]) - first + 1 },
    (_, index) => `${range[1]}-${first + index}`,
  );
};
const split = (text: string): string[] => text.split(",").map((token) => token.trim());

/** The shortest round-trip form of a number, with `.0` on a whole one. */
const printDecimal = (value: number): string =>
  Object.is(value, -0)
    ? "-0.0"
    : Number.isInteger(value) && Math.abs(value) < 1e16
      ? value.toFixed(1)
      : String(value);

const compact = (value: unknown): string => {
  if (value instanceof Decimal) return printDecimal(value.value);
  if (Array.isArray(value)) return `[${value.map(compact).join(",")}]`;
  if (typeof value === "object" && value !== null)
    return `{${Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => `${JSON.stringify(key)}:${compact(entry)}`)
      .join(",")}}`;
  return JSON.stringify(value);
};

const ensure = (states: Map<string, IState>, name: string): IState => {
  const found = states.get(name);
  if (found === undefined) throw new Error(`unknown state ${name}`);
  return found;
};
const table = (state: IState, field: string): Record<string, unknown> =>
  ((state[field] as Record<string, unknown> | undefined) ??= {}) as Record<string, unknown>;

/** One section's lines into its states. */
function readSection(anchor: string, section: string): IState[] {
  // A Map keeps insertion order for numeric-looking state names such as `1800`.
  const states = new Map<string, IState>();
  let plantSpec: unknown = null;
  const lines = section.split(/\r?\n/);
  for (const line of lines) {
    const spec = /^@plant-spec:\s*(\{.+\})/.exec(line);
    if (spec !== null) plantSpec = JSON.parse(spec[1]!);
    const inventory = /^@inventory\s+([^:]+):\s*(.+)$/.exec(line);
    if (inventory !== null) {
      const state = inventory[1]!.trim();
      states.set(state, {
        state,
        parts: [],
        inventory: split(inventory[2]!).flatMap(expand),
      });
    }
  }
  for (const line of lines) {
    if (line.startsWith("| @envelope |")) {
      const cells = line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
      const [, state, , , x, y, z] = cells;
      ensure(states, state!).envelope = {
        x: interval(x!),
        y: interval(y!),
        z: interval(z!),
      };
    }
    if (line.startsWith("| @part |")) {
      const cells = line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
      const [, state, id, shape, x, y, z] = cells;
      ensure(states, state!).parts.push({
        id: id!,
        shape: shape!,
        x: interval(x!),
        y: interval(y!),
        z: interval(z!),
      });
    }
    for (const [marker, field] of [
      ["@void", "voids"],
      ["@piece", "pieces"],
    ] as const) {
      const match = new RegExp(
        `^${marker}\\s+([^:]+):\\s*([^,]+),\\s*([^,]+),\\s*([^,]+),\\s*([^,]+)$`,
      ).exec(line);
      if (match !== null) {
        const bag = table(ensure(states, match[1]!.trim()), field);
        const id = match[2]!.trim();
        ((bag[id] as unknown[] | undefined) ??= []).push({
          x: interval(match[3]!),
          y: interval(match[4]!),
          z: interval(match[5]!),
        });
      }
    }
    let match = /^@radial(?:-at)?\s+([^:]+):\s*(.+)$/.exec(line);
    if (match !== null) {
      const values = split(match[2]!);
      const [id, cx, cz, inner, outer] =
        values.length === 3
          ? [values[0], "0", "0", values[1], values[2]]
          : values;
      table(ensure(states, match[1]!.trim()), "radial")[id!] = [cx, cz, inner, outer].map((token) => decimal(token!));
    }
    match = /^@ellipse\s+([^:]+):\s*(.+)$/.exec(line);
    if (match !== null) {
      const values = split(match[2]!);
      const [id, ix, iz, ox, oz] = values;
      const [cx, cz] = values.length > 5 ? [values[5], values[6]] : ["0", "0"];
      table(ensure(states, match[1]!.trim()), "ellipse")[id!] = [cx, cz, ix, iz, ox, oz].map((token) => decimal(token!));
    }
    match = /^@bore(-z|-x)?\s+([^:]+):\s*(.+)$/.exec(line);
    if (match !== null) {
      const values = split(match[3]!);
      table(ensure(states, match[2]!.trim()), "bores")[values[0]!] = {
        axis: match[1] ?? "-y",
        args: values.slice(1),
      };
    }
    match = /^@cavity-profile\s+([^:]+):\s*(.+)$/.exec(line);
    if (match !== null) {
      const values = split(match[2]!);
      table(ensure(states, match[1]!.trim()), "profiles")[values[0]!] = values.slice(1);
    }
    match = /^@plant-join\s+([^:]+):\s*(.+)$/.exec(line);
    if (match !== null) {
      const values = split(match[2]!);
      table(ensure(states, match[1]!.trim()), "joins")[values[0]!] = values.slice(1).map(decimal);
    }
    match = /^@plant-apex\s+([^:]+):\s*(.+)$/.exec(line);
    if (match !== null) {
      const values = split(match[2]!);
      table(ensure(states, match[1]!.trim()), "apices")[values[0]!] = values.slice(1).map(decimal);
    }
    match = /^@compose\s+([^:]+):\s*(.+)$/.exec(line);
    if (match !== null) {
      const state = match[1]!.trim();
      const values = split(match[2]!);
      if (values.length !== 5) throw new Error(`${anchor}/${state}: invalid @compose`);
      ensure(states, state).compose = {
        anchor: values[0],
        state: values[1],
        offset: values.slice(2).map(decimal),
      };
    }
    match = /^@grid\s+([^:]+):\s*(.+)$/.exec(line);
    if (match !== null) {
      const state = ensure(states, match[1]!.trim());
      const [prefix, columns, rows, pitchX, pitchZ, width, depth, ys] = split(match[2]!);
      const cols = Number(columns);
      const rowCount = Number(rows);
      const half = Number(width) / 2;
      for (let row = 0; row < rowCount; ++row)
        for (let col = 0; col < cols; ++col) {
          const cx = (col - (cols - 1) / 2) * Number(pitchX);
          const cz = (row - (rowCount - 1) / 2) * Number(pitchZ);
          state.parts.push({
            id: `${prefix}-${row * cols + col}`,
            shape: "box",
            x: [new Decimal(cx - half), new Decimal(cx + half)],
            y: interval(ys!),
            z: [
              new Decimal(cz - Number(depth) / 2),
              new Decimal(cz + Number(depth) / 2),
            ],
          });
        }
    }
  }
  for (const state of states.values()) {
    if (state.envelope === undefined)
      throw new Error(`${anchor}/${state.state} lacks reviewed @envelope`);
    if (plantSpec !== null) state.plantSpec = plantSpec;
    const actual = new Set(state.parts.map((part) => part.id));
    const expected = new Set(state.inventory);
    delete state.inventory;
    const missing = [...expected].filter((id) => !actual.has(id));
    const extra = [...actual].filter((id) => !expected.has(id));
    if (missing.length !== 0 || extra.length !== 0)
      throw new Error(
        `${anchor}/${state.state} inventory mismatch missing=${missing.join(",")} extra=${extra.join(",")}`,
      );
  }
  return [...states.values()];
}

const check = process.argv.includes("--check");
mkdirSync(output, { recursive: true });
for (const name of readdirSync(docs)
  .filter((file) => /^[0-9][0-9][1-9]-.*\.md$/.test(file))
  .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
  const source = readFileSync(resolve(docs, name), "utf8");
  const prototypes = source
    .split(/(?=^## .*\{#[^}]+\})/m)
    .flatMap((section) => {
      const heading = /^## (.*) \{#([^}]+)\}/.exec(section);
      return heading === null
        ? []
        : [{ anchor: heading[2]!, name: heading[1]!, states: readSection(heading[2]!, section) }];
    });
  const base = name.replace(/\.md$/, "");
  const className = "Models" + base.split("-")[0];
  const rendered = ["["];
  for (const prototype of prototypes) {
    rendered.push(
      `  { "anchor": ${compact(prototype.anchor)}, "name": ${compact(prototype.name)}, "states": [`,
    );
    for (const state of prototype.states) {
      rendered.push(`    { "state": ${compact(state.state)}, "parts": [`);
      rendered.push(...state.parts.map((part) => `      ${compact(part)},`));
      rendered.push("    ],");
      rendered.push(
        ...Object.entries(state)
          .filter(([key]) => key !== "state" && key !== "parts")
          .map(([key, value]) => `      "${key}": ${compact(value)},`),
      );
      rendered.push("    },");
    }
    rendered.push("  ] },");
  }
  rendered.push("]");
  const text =
    `/** Static coordinates copied from reviewed docs/models/${name} @part and @inventory. */\n` +
    `import { ModelRepresentation, ModelPrototype } from "./representation";\n` +
    `import { IAutoMovieMaterial, IAutoMovieModel } from "@automovie/interface";\n` +
    `const prototypes: ModelPrototype[] = ${rendered.join("\n")};\n` +
    `/** Reviewed model owners in ${name}. */\n` +
    `export class ${className} {\n` +
    `  static catalog(): readonly ModelPrototype[] { return prototypes; }\n` +
    `  static build(anchor: string, state: string, materialFor: (anchor: string, state: string, part: string) => IAutoMovieMaterial): IAutoMovieModel {\n` +
    `    const prototype = prototypes.find(item => item.anchor === anchor);\n` +
    "    if (!prototype) throw Error(`unknown model ${anchor} in " + className + "`);\n" +
    `    return ModelRepresentation.build(prototype, state, materialFor);\n` +
    `  }\n` +
    `}\n`;
  const destination = resolve(output, base + ".ts");
  if (check) {
    if (!existsSync(destination) || readFileSync(destination, "utf8") !== text)
      throw new Error(`stale generated model catalog ${destination}`);
  } else writeFileSync(destination, text, "utf8");
  console.log(
    name,
    prototypes.length,
    prototypes.reduce(
      (total, prototype) =>
        total + prototype.states.reduce((sum, state) => sum + state.parts.length, 0),
      0,
    ),
  );
}
