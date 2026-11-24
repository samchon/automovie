import type {
  IAutoMovieColor,
  IAutoMovieMaterial,
  IAutoMovieModelPart,
  IAutoMovieProceduralSurface,
  IAutoMovieValidateMaterialProcedural,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { validateColor } from "./validateColor";

/** The kinds whose pattern runs along an axis. */
const DIRECTIONAL: readonly IAutoMovieProceduralSurface["kind"][] = [
  "wood",
  "fabric",
  "brushedMetal",
];

/**
 * Admit one material's procedural surface: a safe-integer seed within [0,
 * 2³² − 1], a positive scale, two linear colours, two roughness values within
 * [0, 1], a nonnegative relief, an axis exactly when the kind is directional,
 * and a pattern piece's positive tile lengths.
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
  const surface: IAutoMovieProceduralSurface | undefined = material.procedural;
  if (surface === undefined) return;
  const path: string = `${props.path}.procedural`;
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
  if (
    surface.seed < 0 ||
    surface.seed > 4294967295
  )
    collector.push(
      "range",
      `${path}.seed`,
      "procedural seed must be a safe integer within [0, 4294967295]",
      surface.seed,
    );
  collector.positive(`${path}.scale`, surface.scale, "procedural scale");
  surface.colors.forEach((color: IAutoMovieColor, index: number): void =>
    validateColor(color, `${path}.colors[${index}]`, collector),
  );
  surface.roughness.forEach((value: number, index: number): void =>
    collector.range(
      `${path}.roughness[${index}]`,
      value,
      0,
      1,
      "procedural roughness",
    ),
  );
  collector.range(
    `${path}.relief`,
    surface.relief,
    0,
    Infinity,
    "procedural relief",
  );
  const directional: boolean = DIRECTIONAL.includes(surface.kind);
  if (surface.axis === undefined) {
    if (directional)
      collector.push(
        "type",
        `${path}.axis`,
        `a ${surface.kind} surface needs an axis`,
        undefined,
      );
  } else if (!directional)
    collector.push(
      "type",
      `${path}.axis`,
      "only wood, fabric and brushedMetal surfaces take an axis",
      surface.axis,
    );
  else collector.direction(`${path}.axis`, surface.axis, "procedural axis");
  if (surface.piece !== undefined) validatePiece(surface.piece, path, props);
};

/** Admit a pattern piece and require UV0 on every part citing its material. */
function validatePiece(
  piece: IAutoMovieProceduralSurface.IPiece,
  path: string,
  props: IAutoMovieValidateMaterialProcedural.IProps,
): void {
  const collector: IAutoMovieViolationCollector = props.collector;
  const at: string = `${path}.piece`;
  collector.positive(`${at}.tile.u`, piece.tile.u, "piece tile u");
  collector.positive(`${at}.tile.v`, piece.tile.v, "piece tile v");

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