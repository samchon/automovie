import { AutoMovieFaceParameterName, IAutoMovieFace } from "@automovie/interface";
import { IAutoMovieFaceTrait } from "./IAutoMovieFaceTrait";

/**
 * Project an {@link IAutoMovieFace} onto its morph targets: the nested,
 * anatomy-shaped document flattened to `(parameter, weight)` pairs in
 * declaration order, omitted leaves and groups skipped.
 *
 * Paired features follow the side rule: a lone `left`/`right` sources BOTH side
 * targets (the symmetric shorthand), two defined sides each source their own.
 * The eye pair's `spacing` scalar adds onto each side's `offset` for the
 * spacing targets. The reported `path` names the field the document actually
 * spells (the mirrored source when only one side exists), so a violation is
 * always actionable.
 *
 * Both engine consumers go through this single mapping, so validation paths and
 * morph application can never disagree about what a field means: `validateFace`
 * range-checks each trait at its document `path`, `morphFace` applies each
 * trait's `parameter` target.
 *
 * @evidence requirements/asset-authoring/rig-and-state.md#asset-deformable-surface Converts the anatomy-shaped face input into the named controls that deform the base surface.
 * @evidence specifications/asset-and-representation/rig-deformation-and-state.md#asset-spec-skin-morph-facts Emits deterministic morph names and weights while retaining each authored source path.
 * @author Samchon
 */
export const flattenFace = (face: IAutoMovieFace): IAutoMovieFaceTrait[] => {
  const out: IAutoMovieFaceTrait[] = [];
  for (const { parameter, path, read } of SINGLE) {
    const weight = read(face);
    if (weight !== undefined) out.push({ parameter, path, weight });
  }
  for (const { base, group, leaf, read } of PAIRED) {
    const set = read(face);
    if (set === undefined) continue;
    const pairScalar =
      base === "eyeSpacing" ? (set.spacing as number | undefined) : undefined;
    for (const [suffix, side, other] of [
      ["R", "right", "left"],
      ["L", "left", "right"],
    ] as const) {
      // the side rule: a lone side sources both targets
      const srcSide = set[side] !== undefined ? side : other;
      const value = set[srcSide]?.[leaf];
      if (value === undefined && pairScalar === undefined) continue;
      out.push({
        parameter: `${base}${suffix}` as AutoMovieFaceParameterName,
        path:
          value !== undefined
            ? `${group}.${srcSide}.${leaf}`
            : `${group}.spacing`,
        weight: (value ?? 0) + (pairScalar ?? 0),
      });
    }
  }
  return out;
};
