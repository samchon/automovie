import type { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";

import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import type { IAutoMovieHumanScalpHair } from "../structures/appearance/IAutoMovieHumanScalpHair";
import { AutoMovieHumanHairCard } from "./AutoMovieHumanHairCard";
import { AutoMovieHumanHairGuide } from "./AutoMovieHumanHairGuide";
import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import { AutoMovieHumanShoulderField } from "./AutoMovieHumanShoulderField";
import type { IAutoMovieHumanAppearanceBody } from "./IAutoMovieHumanAppearanceBody";

/**
 * Scalp hair geometry with its work reused across generations.
 *
 * Dependencies, each stage keyed by exactly the inputs it reads:
 *
 * - chart (`AutoMovieHumanHeadField`, `AutoMovieHumanShoulderField`): the
 *   positions and indices of every `human.skin.` part with its id, the eye
 *   centres' height and `head.height`;
 * - guides (`AutoMovieHumanHairGuide`): the chart and `hair.style`,
 *   `hair.length` and `hair.hairline`;
 * - cards and undercoat (`AutoMovieHumanHairCard`): the guides, the chart
 *   and `hair.style`, `hair.curl` and `hair.hairline`.
 *
 * `hair.color` reaches only the materials, which the caller builds every
 * time, so a colour edit reuses every stage; a curl edit reuses the chart
 * and guides; a shape edit that moves no head or body skin vertex reuses
 * all of them. Equivalence is decided by comparing the inputs themselves,
 * element by element, not by a hash: a hit proves the stage would compute
 * the same result. The comparison is linear in the skin's vertices and
 * indices, a few milliseconds against the chart's ray casting and the
 * guides' integration, which take seconds.
 *
 * Retention: the last {@link KEEP} haircuts, most recent first, each
 * holding references to the skin arrays it was computed from (no copy) and
 * its chart, guides and meshes. Callers own nothing here and must not
 * mutate the returned meshes, which later generations share.
 */
export namespace AutoMovieHumanHairStage {
  /** Realised scalp hair. */
  export interface IOutput {
    /** Card and undercoat meshes in model metres. */
    mesh: AutoMovieHumanHairCard.IOutput;

    /** Guides the cards realise. */
    guides: AutoMovieHumanHairGuide.IGuide[];
  }

  /**
   * Realise scalp hair, reusing every stage whose inputs are unchanged.
   *
   * @param params Complete public input
   * @param body Frames the body generator publishes for appearance
   * @param hair Scalp hair input
   * @returns The meshes and guides, or null when no guide is solved
   */
  export function realise(
    params: IAutoMovieHumanParameters,
    body: IAutoMovieHumanAppearanceBody,
    hair: IAutoMovieHumanScalpHair,
  ): IOutput | null {
    const skin: IAutoMovieModelPart[] = body.parts.filter(
      (part: IAutoMovieModelPart): boolean =>
        part.id.startsWith("human.skin.") && part.geometry.type === "mesh",
    );
    const eyeLevel: number =
      body.eyePair.left.centre[1] + body.eyePair.right.centre[1];
    let chart: IChart | undefined = CHARTS.find(
      (entry: IChart): boolean =>
        entry.eyeLevel === eyeLevel &&
        entry.height === params.head.height &&
        same(entry.skin, skin),
    );
    if (chart === undefined) {
      const field: AutoMovieHumanHeadField.IField =
        AutoMovieHumanHeadField.create(params, body);
      chart = {
        skin,
        eyeLevel,
        height: params.head.height,
        field,
        shoulders: AutoMovieHumanShoulderField.create(body.parts, field),
        cuts: [],
      };
    }
    touch(CHARTS, chart);

    const guideKey: string = [hair.style, hair.length, hair.hairline].join("|");
    let cut: ICut | undefined = chart.cuts.find(
      (entry: ICut): boolean => entry.key === guideKey,
    );
    if (cut === undefined)
      cut = {
        key: guideKey,
        guides: AutoMovieHumanHairGuide.generate(
          chart.field,
          chart.shoulders,
          hair,
        ),
        meshes: new Map(),
      };
    touch(chart.cuts, cut);
    if (cut.guides.length === 0) return null;

    const meshKey: string = [hair.curl, hair.hairline].join("|");
    let mesh: AutoMovieHumanHairCard.IOutput | undefined =
      cut.meshes.get(meshKey);
    if (mesh === undefined) {
      mesh = AutoMovieHumanHairCard.generate(chart.field, hair, cut.guides);
      cut.meshes.set(meshKey, mesh);
    }
    return { mesh, guides: cut.guides };
  }
}

/** Charts kept, and haircuts kept per chart. */
const KEEP: number = 2;

/** One measured chart and the haircuts solved on it. */
interface IChart {
  skin: IAutoMovieModelPart[];
  eyeLevel: number;
  height: number;
  field: AutoMovieHumanHeadField.IField;
  shoulders: AutoMovieHumanShoulderField.IField;
  cuts: ICut[];
}

/** One haircut's guides and the meshes realised from them. */
interface ICut {
  key: string;
  guides: AutoMovieHumanHairGuide.IGuide[];
  meshes: Map<string, AutoMovieHumanHairCard.IOutput>;
}

/** Charts, most recently used first. */
const CHARTS: IChart[] = [];

/**
 * Move an entry to the front of a most-recent-first list, dropping entries
 * beyond {@link KEEP}.
 */
function touch<T>(list: T[], entry: T): void {
  const at: number = list.indexOf(entry);
  if (at >= 0) list.splice(at, 1);
  list.unshift(entry);
  list.length = Math.min(list.length, KEEP);
}

/** Whether two skin part lists carry the same ids, positions and indices. */
function same(a: IAutoMovieModelPart[], b: IAutoMovieModelPart[]): boolean {
  if (a.length !== b.length) return false;
  for (let k: number = 0; k < a.length; ++k) {
    const x: IAutoMovieModelPart = a[k]!;
    const y: IAutoMovieModelPart = b[k]!;
    if (x.id !== y.id) return false;
    if (x.geometry.type !== "mesh" || y.geometry.type !== "mesh") return false;
    const p: IAutoMovieMesh = x.geometry.mesh;
    const q: IAutoMovieMesh = y.geometry.mesh;
    if (!equal(p.positions, q.positions)) return false;
    if (!equal(p.indices ?? [], q.indices ?? [])) return false;
  }
  return true;
}

/** Element-wise equality of two numeric arrays; identical arrays return at once. */
function equal(a: readonly number[], b: readonly number[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let k: number = 0; k < a.length; ++k) if (a[k] !== b[k]) return false;
  return true;
}
