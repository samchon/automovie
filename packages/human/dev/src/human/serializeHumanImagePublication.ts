import type { IAutoMovieHumanGenerated } from "../../../src/structures/IAutoMovieHumanGenerated";

/** Traversal contexts distinguish real mesh channels from equally named metadata. */
type Mode = "result" | "model" | "parts" | "part" | "geometry" | "mesh" | "skin" | "targets" | "target" | "plain";

/**
 * Publish the loaded result with the same Float32 mesh buffers the viewer draws.
 *
 * Only raw mesh attributes and morph deltas read by buildGeometry as Float32
 * receive shorter decimal candidates. Parameters, rig, transforms, materials,
 * images, integer indices and physical correspondence retain their JSON values.
 * Generated data is plain enumerable JSON data, without accessors or toJSON
 * hooks. The original result and all shared arrays remain unchanged.
 *
 * A candidate is admitted only after an exact Float32 equality check; otherwise
 * the source decimal remains. Nine significant digits are a candidate format,
 * not a globally shortest spelling claim. Selected negative zero retains its
 * sign. Non-finite or Float32-overflowing attributes refuse publication.
 *
 * Cost is O(N) scalar visits with one decimal candidate per selected number and
 * temporary text bounded by the result's channels and JSON output. No cache or
 * geometry survives the call. The frozen-workload target is 224 MiB for f1;
 * the independent 256 MiB admission cap remains unchanged and is never raised.
 */
export function serializeHumanImagePublication(result: IAutoMovieHumanGenerated): string {
  return write(result, "result");
}

/** Serialize plain generated data with ordinary JSON semantics outside mesh channels. */
function write(value: unknown, mode: Mode): string {
  if (value === undefined) return "null";
  if (mode === "plain" || value === null || typeof value !== "object") {
    const text: string | undefined = JSON.stringify(value);
    if (text === undefined) throw new TypeError("Human publication requires plain JSON data");
    return text;
  }
  if (Array.isArray(value)) {
    const item: Mode = mode === "parts" ? "part" : mode === "targets" ? "target" : "plain";
    return "[" + Array.from(value as unknown[], (entry: unknown): string => write(entry, item)).join(",") + "]";
  }
  const record: Record<string, unknown> = value as Record<string, unknown>;
  const members: string[] = [];
  for (const key of Object.keys(record)) {
    const child: unknown = record[key];
    if (child === undefined) continue;
    const selected: boolean = mode === "mesh" && ATTRIBUTES.has(key)
      || mode === "skin" && key === "weights"
      || mode === "target" && (key === "positions" || key === "normals");
    let text: string;
    if (selected && Array.isArray(child)) {
      text = "[" + Array.from(child as unknown[], (number: unknown): string => {
        if (typeof number !== "number") throw new TypeError("Human mesh channel requires numbers");
        return numberToken(number);
      }).join(",") + "]";
    } else {
      const next: Mode = mode === "result" && key === "model" ? "model"
        : mode === "model" && key === "parts" ? "parts"
        : mode === "part" && key === "geometry" && child !== null && typeof child === "object" && (child as { type?: unknown }).type === "mesh" ? "geometry"
        : mode === "geometry" && key === "mesh" ? "mesh"
        : mode === "mesh" && key === "skin" ? "skin"
        : mode === "mesh" && key === "targets" ? "targets"
        : "plain";
      text = write(child, next);
    }
    members.push(JSON.stringify(key) + ":" + text);
  }
  return "{" + members.join(",") + "}";
}

/** Keep a decimal only when parsing it yields the identical finite Float32. */
function numberToken(value: number): string {
  const target: number = Math.fround(value);
  if (!Number.isFinite(value) || !Number.isFinite(target))
    throw new RangeError("Human mesh attribute must be finite in Float32");
  if (Object.is(target, -0)) return "-0";
  const source: string = JSON.stringify(value);
  
  // Keep integer tokens directly, especially the zero and unit influence
  // slots. They need no decimal candidate allocation or precision change.
  if (Number.isInteger(value)) return source;
  const candidate: number = Number(target.toPrecision(9));
  if (!Object.is(Math.fround(candidate), target)) return source;
  const text: string = JSON.stringify(candidate);
  return text.length < source.length ? text : source;
}

/** Float32 attribute names at the raw mesh level, excluding integer indices. */
const ATTRIBUTES: ReadonlySet<string> = new Set(["positions", "normals", "uvs", "colors", "reliefWeights"]);
