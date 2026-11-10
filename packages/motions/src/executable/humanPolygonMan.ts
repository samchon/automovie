import { measureAutoMovieHumanoidBody } from "@automovie/engine";
import {
  AutoMovieHumanCanonicalBody,
  type IAutoMovieHumanParameters,
} from "@automovie/human";
import type { IAutoMovieBodyMeasure } from "@automovie/interface";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

/**
 * A polygon man of any Human parameters on the canonical rig, for local
 * motion checks and captures.
 *
 * The body is prepared by Human at the skeleton level
 * (`AutoMovieHumanCanonicalBody.prepare`: joints, girth radii from the
 * person's measures, the T-pose and a contact profile from the polygon's own
 * primitives), about 2 s a body with no skin or head surface built; its
 * measure is read by the engine's `measureAutoMovieHumanoidBody`. Prepared
 * bodies are shared through the ignored `packages/motions/.cache/polygon/`,
 * keyed by the SHA-256 of the parameters, the mass and the contents of
 * Human's source tree, so every test, capture and agent reuses one
 * preparation per person, and a change to Human prepares again.
 *
 * @param id Stable body id, used as the skeleton id.
 * @param params Human's parameters.
 * @param mass Body mass, kilograms.
 * @returns The canonical body and its measure.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the preparation, its cost and the cache key and location.
 * @evidence contracts/development/implementation.md#principled-implementation Human's skeleton-level canonical preparation, then the engine measurer; the cache key covers every input that decides the body.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Load or prepare, then measure.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A key covering Human's source keeps a stale body from standing in for the current Human.
 * @evidence contracts/development/implementation.md#efficient-algorithms A hit reads one JSON file; a miss costs Human's source preparation.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Equal parameters, mass and Human source share one cached body across processes.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One file per distinct body accumulates under the ignored cache; nothing is held in memory between calls.
 */
export function humanPolygonMan(
  id: string,
  params: IAutoMovieHumanParameters,
  mass: number,
): humanPolygonMan.IPolygonMan {
  const key: string = createHash("sha256")
    .update(JSON.stringify({ id, params, mass }))
    .update(humanSourceDigest())
    .digest("hex")
    .slice(0, 24);
  const directory: string = path.join(
    __dirname,
    "..",
    "..",
    ".cache",
    "polygon",
  );
  const file: string = path.join(directory, `${id}-${key}.json`);
  let body: AutoMovieHumanCanonicalBody.IBody;
  if (existsSync(file))
    body = JSON.parse(
      readFileSync(file, "utf8"),
    ) as AutoMovieHumanCanonicalBody.IBody;
  else {
    body = AutoMovieHumanCanonicalBody.prepare(params, { mass, id });
    mkdirSync(directory, { recursive: true });
    writeFileSync(file, JSON.stringify(body), "utf8");
  }
  return {
    id,
    body,
    measure: measureAutoMovieHumanoidBody(body.skeleton, body.profile),
  };
}

/**
 * Companion types of {@link humanPolygonMan}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member.
 * @evidence contracts/development/design.md#principled-representation Human's canonical body with the engine measure.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the harness and the local motion tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses Human's canonical body and the interface measure.
 */
export namespace humanPolygonMan {
  /** A prepared polygon man. */
  export interface IPolygonMan {
    /** Stable id. */
    id: string;

    /** The canonical body. */
    body: AutoMovieHumanCanonicalBody.IBody;

    /** Its measure. */
    measure: IAutoMovieBodyMeasure;
  }
}

/** SHA-256 of every source file under Human's `src`, in sorted path order, computed once per process. */
function humanSourceDigest(): string {
  if (DIGEST !== undefined) return DIGEST;
  const hash = createHash("sha256");
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir).sort((a: string, b: string): number =>
      a < b ? -1 : a > b ? 1 : 0,
    )) {
      const full: string = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith(".ts"))
        hash.update(name).update(readFileSync(full));
    }
  };
  walk(
    path.join(
      path.dirname(require.resolve("@automovie/human/package.json")),
      "src",
    ),
  );
  DIGEST = hash.digest("hex");
  return DIGEST;
}

/** The process's Human source digest. */
let DIGEST: string | undefined;
