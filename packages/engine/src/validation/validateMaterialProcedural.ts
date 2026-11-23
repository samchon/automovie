import type {
  IAutoMovieMaterial,
  IAutoMovieModelPart,
  IAutoMovieValidateMaterialProcedural,
  IAutoMovieVector3,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { finiteMinimum } from "./finiteMinimum";
import { finiteNumber } from "./finiteNumber";
import { isRecord } from "./isRecord";
import { validateColor } from "./validateColor";

/** The kinds a procedural surface generates. */
const KINDS: readonly string[] = [
  "wood",
  "stone",
  "plaster",
  "clay",
  "fabric",
  "brushedMetal",
];

/** The kinds whose pattern runs along an axis. */
const DIRECTIONAL: readonly string[] = ["wood", "fabric", "brushedMetal"];

/**
 * Admit one material's procedural surface: its record shape, a known kind, a
 * safe-integer seed within [0, 2³² − 1], a finite positive scale, two linear
 * colours, two roughness values within [0, 1], a finite nonnegative relief, an
 * axis exactly when the kind is directional, and a pattern piece's sheet,
 * positive tile lengths and finite transform.
 *
 * A material that also binds `baseColorTexture` or `metallicRoughnessTexture`
 * is refused at `procedural`, since both would state its colour and roughness.
 * A piece samples its sheet through UV0, so every part citing a material whose
 * surface has a piece must be a mesh with UV0. An absent surface is left
 * alone.
 */
export const validateMaterialProcedural: (
  props: IAutoMovieValidateMaterialProcedural.IProps,
) => void = (props: IAutoMovieValidateMaterialProcedural.IProps): void => {
  const material: IAutoMovieMaterial = props.material;
  const collector: IAutoMovieViolationCollector = props.collector;
  const surface: unknown = material.procedural;
  if (surface === undefined) return;
  const path: string = `${props.path}.procedural`;
  if (!isRecord(surface)) {
    collector.push("type", path, "procedural must be a record", surface);
    return;
  }
  if (
    (material.baseColorTexture ?? null) !== null ||
    (material.metallicRoughnessTexture ?? null) !== null
  )
    collector.push(
      "type",
      path,
      "a procedural surface states base colour and roughness, so the material may not also bind baseColorTexture or metallicRoughnessTexture",
      surface.kind,
    );
  const kind: unknown = surface.kind;
  if (typeof kind !== "string" || !KINDS.includes(kind))
    collector.push(
      "type",
      `${path}.kind`,
      `procedural kind must be one of ${KINDS.join(", ")}`,
      kind,
    );
  if (
    !Number.isSafeInteger(surface.seed) ||
    (surface.seed as number) < 0 ||
    (surface.seed as number) > 4294967295
  )
    collector.push(
      "range",
      `${path}.seed`,
      "procedural seed must be a safe integer within [0, 4294967295]",
      surface.seed,
    );
  collector.positive(
    `${path}.scale`,
    surface.scale as number | undefined,
    "procedural scale",
  );
  const colors: unknown = surface.colors;
  if (!Array.isArray(colors) || colors.length !== 2)
    collector.push(
      "type",
      `${path}.colors`,
      "procedural colors must be a pair",
      colors,
    );
  else
    colors.forEach((color: unknown, index: number): void =>
      validateColor(color, `${path}.colors[${index}]`, collector),
    );
  const roughness: unknown = surface.roughness;
  if (!Array.isArray(roughness) || roughness.length !== 2)
    collector.push(
      "type",
      `${path}.roughness`,
      "procedural roughness must be a pair",
      roughness,
    );
  else
    roughness.forEach((value: unknown, index: number): void =>
      collector.range(
        `${path}.roughness[${index}]`,
        value,
        0,
        1,
        "procedural roughness",
      ),
    );
  finiteMinimum(
    surface.relief as number,
    0,
    `${path}.relief`,
    "procedural relief",
    collector,
  );
  const directional: boolean =
    typeof kind === "string" && DIRECTIONAL.includes(kind);
  if (surface.axis === undefined) {
    if (directional)
      collector.push(
        "type",
        `${path}.axis`,
        `a ${String(kind)} surface needs an axis`,
        undefined,
      );
  } else if (!directional)
    collector.push(
      "type",
      `${path}.axis`,
      "only wood, fabric and brushedMetal surfaces take an axis",
      surface.axis,
    );
  else if (!isRecord(surface.axis))
    collector.push(
      "type",
      `${path}.axis`,
      "procedural axis must be a vector",
      surface.axis,
    );
  else
    collector.direction(
      `${path}.axis`,
      surface.axis as unknown as IAutoMovieVector3,
      "procedural axis",
    );
  if (surface.piece !== undefined) validatePiece(surface.piece, path, props);
};

/** Admit a pattern piece and require UV0 on every part citing its material. */
function validatePiece(
  piece: unknown,
  path: string,
  props: IAutoMovieValidateMaterialProcedural.IProps,
): void {
  const collector: IAutoMovieViolationCollector = props.collector;
  const at: string = `${path}.piece`;
  if (!isRecord(piece)) {
    collector.push("type", at, "procedural piece must be a record", piece);
    return;
  }
  if (piece.sheet !== "module" && piece.sheet !== "face")
    collector.push(
      "type",
      `${at}.sheet`,
      'procedural piece sheet must be "module" or "face"',
      piece.sheet,
    );
  const tile: unknown = piece.tile;
  if (!isRecord(tile))
    collector.push("type", `${at}.tile`, "piece tile must be a record", tile);
  else {
    collector.positive(`${at}.tile.u`, tile.u as number, "piece tile u");
    collector.positive(`${at}.tile.v`, tile.v as number, "piece tile v");
  }
  const transform: unknown = piece.transform;
  if (
    !isRecord(transform) ||
    typeof transform.id !== "string" ||
    !isRecord(transform.offset) ||
    !isRecord(transform.scale)
  )
    collector.push(
      "type",
      `${at}.transform`,
      "piece transform must be an occurrence id with an offset, a scale and a rotation",
      transform,
    );
  else {
    const offset: Record<string, unknown> = transform.offset;
    const scale: Record<string, unknown> = transform.scale;
    finiteNumber(
      offset.x as number,
      `${at}.transform.offset.x`,
      "piece offset",
      collector,
    );
    finiteNumber(
      offset.y as number,
      `${at}.transform.offset.y`,
      "piece offset",
      collector,
    );
    finiteNumber(
      scale.x as number,
      `${at}.transform.scale.x`,
      "piece scale",
      collector,
    );
    finiteNumber(
      scale.y as number,
      `${at}.transform.scale.y`,
      "piece scale",
      collector,
    );
    finiteNumber(
      transform.rotationDeg as number,
      `${at}.transform.rotationDeg`,
      "piece rotation",
      collector,
    );
  }

  // The sheet is reached through the piece mesh's UV0.
  props.parts.forEach((part: IAutoMovieModelPart, index: number): void => {
    if (
      part.material === props.material.id &&
      (part.geometry.type !== "mesh" || part.geometry.mesh.uvs === null)
    )
      collector.push(
        "type",
        part.geometry.type === "mesh"
          ? `${props.partsPath}[${index}].geometry.mesh.uvs`
          : `${props.partsPath}[${index}].geometry`,
        `material "${props.material.id}" samples a pattern piece's sheet, so a part citing it needs a mesh with UV0`,
        part.geometry.type === "mesh" ? null : part.geometry.type,
      );
  });
}
