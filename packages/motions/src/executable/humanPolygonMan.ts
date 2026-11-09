import { measureAutoMovieHumanoidBody } from "@automovie/engine";
import {
  AutoMovieHumanCanonicalBody,
  AutoMovieHumanPhysicalProfile,
  AutoMovieHumanSkeleton,
  type IAutoMovieHumanParameters,
} from "@automovie/human";
import type { IAutoMovieBodyMeasure, IAutoMoviePhysicalProfile } from "@automovie/interface";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Polygon men of any Human parameters, on the canonical rig, for local
 * motion checks and captures.
 *
 * A body is prepared by Human (`AutoMovieHumanSkeleton.prepare`, about 90 s),
 * evaluated at neutral, given Human's physical profile on the same evaluator
 * and moved onto the canonical rig by `AutoMovieHumanCanonicalBody.adapt`;
 * its measure is read by the engine's `measureAutoMovieHumanoidBody`. Human's
 * raw outputs are cached under the ignored `packages/motions/.cache/human/`,
 * keyed by the SHA-256 of the parameters, the mass and the contents of
 * Human's source tree, so a change to Human or to the inputs prepares again
 * and a cached body is never stale. Nothing is committed.
 *
 * The controller gains the profile provider requires are unused by kinematic
 * motion: 20 rad/s, critical damping and 50 N m per downstream kilogram, the
 * values the kickboxing performance used for the same purpose.
 *
 * @param id Stable body id, used as the skeleton id.
 * @param params Human's parameters.
 * @param mass Body mass, kilograms.
 * @returns The canonical body and its measure.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the preparation chain, the cache key and location, and the unused gains.
 * @evidence contracts/development/implementation.md#principled-implementation Human's public preparation, profile provider and canonical adapter, then the engine measurer; the cache is keyed by every input that decides the output.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Load or prepare the raw outputs, then adapt and measure.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A key covering Human's source keeps a stale cache from standing in for the current Human.
 * @evidence contracts/development/implementation.md#efficient-algorithms Dominated by Human's preparation on a cache miss; a hit reads one JSON file. Hashing Human's source tree is linear in its bytes.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Equal parameters, mass and Human source share one cached preparation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One file per distinct body accumulates under the ignored cache; nothing is held in memory between calls.
 */
export function humanPolygonMan(
  id: string,
  params: IAutoMovieHumanParameters,
  mass: number,
): humanPolygonMan.IPolygonMan {
  const key: string = createHash("sha256")
    .update(JSON.stringify({ params, mass }))
    .update(humanSourceDigest())
    .digest("hex")
    .slice(0, 24);
  const directory: string = path.join(__dirname, "..", "..", ".cache", "human");
  const file: string = path.join(directory, `${key}.json`);
  let raw: { neutral: AutoMovieHumanSkeleton.IOutput; profile: IAutoMoviePhysicalProfile };
  if (existsSync(file)) raw = JSON.parse(readFileSync(file, "utf8"));
  else {
    const evaluate: AutoMovieHumanSkeleton.PoseEvaluator = AutoMovieHumanSkeleton.prepare(params);
    raw = {
      neutral: evaluate({}),
      profile: AutoMovieHumanPhysicalProfile.prepare(
        params,
        {
          mass,
          frequency: 20,
          dampingRatio: 1,
          torquePerKg: 50,
          equipment: [],
          skin: "skin",
          materials: [{ id: "skin", friction: 0.7, restitution: 0, compliance: 0, damping: 0 }],
        },
        evaluate,
      ).profile,
    };
    mkdirSync(directory, { recursive: true });
    writeFileSync(file, JSON.stringify(raw), "utf8");
  }
  const body: AutoMovieHumanCanonicalBody.IBody = AutoMovieHumanCanonicalBody.adapt(raw.neutral, raw.profile, id);
  return { id, body, measure: measureAutoMovieHumanoidBody(body.skeleton, body.profile) };
}

/**
 * Companion types of {@link humanPolygonMan}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member.
 * @evidence contracts/development/design.md#principled-representation The Human adapter's canonical body with the engine measure.
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

/** SHA-256 of every file under Human's `src`, in sorted path order. */
function humanSourceDigest(): string {
  const root: string = path.join(__dirname, "..", "..", "..", "human", "src");
  const hash = createHash("sha256");
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir).sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))) {
      const full: string = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith(".ts")) hash.update(name).update(readFileSync(full));
    }
  };
  walk(root);
  return hash.digest("hex");
}
