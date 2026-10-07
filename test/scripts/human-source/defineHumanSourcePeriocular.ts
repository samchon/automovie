import type { IAutoMovieHumanFacePeriocularSide } from "@automovie/human/face/structures/IAutoMovieHumanFacePeriocularSide";

import { HUMAN_SOURCE_EYE_CONVENTION } from "./HUMAN_SOURCE_EYE_CONVENTION.ts";
import { HUMAN_SOURCE_EYE_SIDES } from "./HUMAN_SOURCE_EYE_SIDES.ts";
import { HUMAN_SOURCE_READ_LASH_ROOTS } from "./HUMAN_SOURCE_READ_LASH_ROOTS.ts";
import { HUMAN_SOURCE_READ_MARGINS } from "./HUMAN_SOURCE_READ_MARGINS.ts";
import { defineHumanSourceBrowBand } from "./defineHumanSourceBrowBand.ts";
import { defineHumanSourcePeriocularCage } from "./defineHumanSourcePeriocularCage.ts";
import { splitHumanSourceSurfaceSides } from "./splitHumanSourceSurfaceSides.ts";
import type { IHumanSourcePeriocularInput } from "./structures/IHumanSourcePeriocularInput.ts";
import type { IHumanSourcePeriocularRegistration } from "./structures/IHumanSourcePeriocularRegistration.ts";

/** Face skin surface ID. */
const SKIN = "Human";
/** Brow surface ID of the CC0 proxy set. */
const BROW = "Human.eyebrow001";
/** Lash surface ID. */
const LASH_SURFACE = "Human.eyelashes01";
/** Lash region drawing the upper lashes. */
const LASH_UPPER = "Human.eyelashes01/Human.eyelashes01";
/** Lash region drawing the lower lashes. */
const LASH_LOWER = "Human.eyelashes01/Human.eyelashes01.lower";
/** Globe surface ID; its attachment owners are the articulation eyes. */
const GLOBE = "Human.low-poly";
/** What an extreme-type canthus cannot find. */
const CANTHUS_LIMIT =
  "The canthus is the x-axis extreme of the joined registered margin rows on the final skin, so it follows an edit that moves which row vertex is the corner; a corner moved beyond the registered rows is not found, and the head-frame x axis stands in for the palpebral fissure axis.";

/**
 * The periocular registration of the face.
 *
 * - Margins: the eye-region owner's left rows (`HUMAN_SOURCE_READ_MARGINS`),
 *   base mesh vertices, carried to face skin vertices through the skin's
 *   generation samples; the right rows are their mirror twins in the same
 *   order.
 * - Brows and lashes: the surface's vertices split by the sign of x; the lash
 *   surface's upper and lower regions are named as they are.
 * - Globe: the low-poly eye surface with the articulation eye as owner.
 * - Canthi: extreme-type definitions on the head-frame x axis (left eye:
 *   medial minimum, lateral maximum; right eye reversed). On the neutral skin
 *   each extreme must land on its row end, or the reading and the definition
 *   disagree and the registration refuses by name.
 */
export function defineHumanSourcePeriocular(
  input: IHumanSourcePeriocularInput,
): IHumanSourcePeriocularRegistration {
  const { face, faceToG1, mirror } = input;
  const surface = (id: string) => {
    const found = face.surfaces.find((s) => s.id === id);
    if (found === undefined)
      throw new Error(`Periocular: the face has no ${id} surface.`);
    return found;
  };
  const skin = surface(SKIN);
  const lashes = surface(LASH_SURFACE);
  const globe = surface(GLOBE);
  for (const region of [LASH_UPPER, LASH_LOWER])
    if (!lashes.regions.some((r) => r.id === region))
      throw new Error(`Periocular: ${LASH_SURFACE} has no region ${region}.`);
  const faceOf = new Map<number, number>();
  faceToG1.forEach((sample, v) => {
    if (faceOf.has(sample))
      throw new Error(
        `Periocular: generation sample ${sample} maps to two face skin vertices.`,
      );
    faceOf.set(sample, v);
  });
  const toSource = (native: number): number => {
    if (input.nativeToSource === undefined) return native;
    const sample = input.nativeToSource[native];
    if (!Number.isSafeInteger(sample) || sample < 0)
      throw new Error(
        `Periocular: native vertex ${native} is absent or retired in the canonical root.`,
      );
    return sample;
  };
  const toFace = (base: number): number => {
    const v = faceOf.get(toSource(base));
    if (v === undefined)
      throw new Error(
        `Periocular: base vertex ${base} has no face skin vertex.`,
      );
    return v;
  };
  const brows = splitHumanSourceSurfaceSides(BROW, surface(BROW).positions);
  const lashSides = splitHumanSourceSurfaceSides(
    LASH_SURFACE,
    lashes.positions,
  );
  const x = (v: number): number => skin.positions[3 * v];
  const record: Record<string, unknown> = {
    convention: HUMAN_SOURCE_EYE_CONVENTION,
    margins: {
      source:
        "HUMAN_SOURCE_READ_MARGINS (left, base mesh vertices; right = mirror twins in the same order)",
      frames: HUMAN_SOURCE_READ_MARGINS.frames,
    },
    lashRoots: {
      source:
        "HUMAN_SOURCE_READ_LASH_ROOTS (anterior left rows, base mesh vertices; right = mirror twins in the same order)",
      frames: HUMAN_SOURCE_READ_LASH_ROOTS.frames,
      qualification:
        "source border correspondence, not clinical follicle population or tissue depth",
    },
    brows: {
      surface: BROW,
      rule: "split by the sign of x (+X left)",
      left: brows.left.length,
      right: brows.right.length,
    },
    lashes: {
      surface: LASH_SURFACE,
      upperRegion: LASH_UPPER,
      lowerRegion: LASH_LOWER,
      rule: "split by the sign of x (+X left)",
      left: lashSides.left.length,
      right: lashSides.right.length,
    },
    globe: {
      surface: GLOBE,
      owners: HUMAN_SOURCE_EYE_SIDES.map((s) => s.owner),
    },
    canthi: {
      rule: "extreme of the joined margin rows on the head-frame x axis; left eye medial minimum and lateral maximum, right eye reversed",
      limit: CANTHUS_LIMIT,
    },
  };
  const sides: Partial<
    Record<"left" | "right", IAutoMovieHumanFacePeriocularSide>
  > = {};
  for (const eye of HUMAN_SOURCE_EYE_SIDES) {
    if (!(globe.attachments ?? []).some((a) => a.owner === eye.owner))
      throw new Error(`Periocular: ${GLOBE} has no ${eye.owner} attachment.`);
    const base = (row: readonly number[]): number[] =>
      eye.side === "left" ? [...row] : row.map((v) => mirror.twin[v]);
    const upper = base(HUMAN_SOURCE_READ_MARGINS.upper).map(toFace);
    const lower = base(HUMAN_SOURCE_READ_MARGINS.lower).map(toFace);
    const lashRoots = {
      upper: base(HUMAN_SOURCE_READ_LASH_ROOTS.upper).map(toFace),
      lower: base(HUMAN_SOURCE_READ_LASH_ROOTS.lower).map(toFace),
    };
    if (
      upper[0] !== lower[0] ||
      upper[upper.length - 1] !== lower[lower.length - 1]
    )
      throw new Error(
        `Periocular: the ${eye.side} margins do not share both corners.`,
      );
    const joined = [...new Set([...upper, ...lower])];
    const extreme = (sense: 1 | -1): number => {
      const best = Math.max(...joined.map((v) => sense * x(v)));
      const at = joined.filter((v) => sense * x(v) === best);
      if (at.length !== 1)
        throw new Error(
          `Periocular: the ${eye.side} canthus extreme is tied between vertices ${at.join(", ")}.`,
        );
      return at[0];
    };
    const medial = extreme(eye.lateral === 1 ? -1 : 1);
    const lateral = extreme(eye.lateral);
    if (medial !== upper[0] || lateral !== upper[upper.length - 1])
      throw new Error(
        `Periocular: the ${eye.side} canthus extremes (${medial}, ${lateral}) are not the margin row ends (${upper[0]}, ${upper[upper.length - 1]}).`,
      );
    const finish = skin.regions.find((region) =>
      region.indices.includes(lashRoots.upper[0]),
    );
    if (finish === undefined)
      throw new Error(
        `Periocular: the ${eye.side} anterior anchor has no registered host finish.`,
      );
    const cage = defineHumanSourcePeriocularCage(
      eye.side,
      input.generation,
      mirror,
      toFace,
      toSource,
      finish.material,
      input.sourceSha256,
      skin.positions,
      skin.indices,
      Array.from(faceToG1),
    );
    const browFinish = surface(BROW).regions.find((region) =>
      region.indices.includes(brows[eye.side][0]),
    );
    if (browFinish === undefined)
      throw new Error(
        `Periocular: the ${eye.side} source card has no registered finish.`,
      );
    const browBand = defineHumanSourceBrowBand(
      eye.side,
      input.generation,
      mirror,
      toFace,
      brows[eye.side],
      browFinish.material,
      input.sourceSha256,
    );
    sides[eye.side] = {
      brow: { surface: BROW, vertices: brows[eye.side] },
      lashes: {
        surface: LASH_SURFACE,
        upperRegion: LASH_UPPER,
        lowerRegion: LASH_LOWER,
        vertices: lashSides[eye.side],
      },
      globe: { surface: GLOBE, owner: eye.owner },
      margins: { surface: SKIN, upper, lower, lashRoots },
      cage,
      browBand,
      canthi: {
        medial: {
          kind: "extreme",
          axis: [1, 0, 0],
          sense: eye.lateral === 1 ? "minimum" : "maximum",
        },
        lateral: {
          kind: "extreme",
          axis: [1, 0, 0],
          sense: eye.lateral === 1 ? "maximum" : "minimum",
        },
      },
    };
    record[eye.side] = {
      upper,
      lower,
      lashRoots,
      cage,
      browBand,
      neutralMedial: medial,
      neutralLateral: lateral,
    };
  }
  if (sides.left === undefined || sides.right === undefined)
    throw new Error("Periocular: an eye side was not registered.");
  return {
    periocular: {
      generation: input.generation,
      sourceSha256: input.sourceSha256,
      left: sides.left,
      right: sides.right,
    },
    record,
  };
}
