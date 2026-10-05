import type { IAutoMovieHumanBodyAnatomicalMeasurements, IAutoMovieHumanBodyBasisDocument } from "@automovie/human";

/**
 * Return a copy of a body document whose `anatomy` states one surface target
 * at a request path (`surface.rightUpperLimb.upperArm.midUpperArmGirth`), or
 * no longer states it when `metres` is undefined.
 *
 * The target is the document's only record of that measurement; the builder
 * solves it (`resolveHumanBodyAnatomy`). Emptied branches are removed, and a
 * document left with no measurement drops `anatomy`, so clearing every row
 * returns the document an editor that never set one would save. The caller's
 * document is not changed.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Writes an anatomical target into the body document the editor commits.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Stores the stated target at its request path and removes it when cleared, leaving no empty branch.
 * @author Samchon
 */
export function writeConnectedBodyAnatomyTarget(
  document: IAutoMovieHumanBodyBasisDocument,
  path: string,
  metres: number | undefined,
): IAutoMovieHumanBodyBasisDocument {
  const next = structuredClone(document);
  const root: Record<string, unknown> = (next.anatomy as Record<string, unknown> | undefined) ?? {};
  const keys = path.split(".");
  const trail: Record<string, unknown>[] = [root];
  for (const key of keys.slice(0, -1)) {
    const parent = trail[trail.length - 1];
    const child = parent[key];
    const node = typeof child === "object" && child !== null ? (child as Record<string, unknown>) : {};
    parent[key] = node;
    trail.push(node);
  }
  const leaf = keys[keys.length - 1];
  if (metres === undefined) delete trail[trail.length - 1][leaf];
  else trail[trail.length - 1][leaf] = { kind: "target", metres };
  // remove the branches the clear left empty, innermost first
  for (let depth = trail.length - 1; depth > 0; depth--)
    if (Object.keys(trail[depth]).length === 0) delete trail[depth - 1][keys[depth - 1]];
  if (Object.keys(root).length === 0) delete next.anatomy;
  else next.anatomy = root as IAutoMovieHumanBodyAnatomicalMeasurements;
  return next;
}
