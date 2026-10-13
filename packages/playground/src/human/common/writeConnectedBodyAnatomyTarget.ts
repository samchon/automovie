import type {
  IAutoMovieHumanBodyAnatomicalMeasurements,
  IAutoMovieHumanBodyBasisDocument,
} from "@automovie/human";

/**
 * Return a copy of a body document whose `anatomy` states one surface target at a request path (`surface.rightUpperLimb.upperArm.midUpperArmGirth`), or no longer states it when `metres` is undefined.
 *
 * The target is the document's only record of that measurement; the builder solves it (`resolveHumanBodyAnatomy`). Emptied branches are removed, and a document left with no measurement drops `anatomy`, so clearing every row returns the document an editor that never set one would save. The caller's document is not changed.
 *
 * Paths come from the authored surface-target catalogue and values have already crossed the control's millimetre-to-metre boundary. This helper edits data without admitting arbitrary paths, finite ranges or numerical achievability; the following document transaction performs that admission.
 *
 * @evidence contracts/common.md#principled-implementation Cloning preserves the caller's document, a dotted catalogue path inserts or removes one target leaf, and bottom-up empty-branch pruning restores canonical omission after clearing the last target.
 * @evidence contracts/common.md#clear-and-simple-design One data-edit helper owns path replacement and pruning, while controls own unit conversion and the Human document transaction owns numerical admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The helper does not treat a stated target as an achieved observation and does not claim arbitrary path or range validation absent from this editing operation.
 * @evidence contracts/common.md#meaningful-documentation The comment documents cloning, metre target insertion, undefined clearing, empty anatomy omission and the authored-path and later-admission premises.
 * @evidence contracts/performance.md#efficient-algorithms Cloning d document values dominates O(d) time and storage; p path segments and branch references add O(p) storage, and pruning enumerates sibling keys at each affected branch to determine actual emptiness.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call returns independent editable document data; sharing a cached mutable clone would violate caller isolation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned clone transfers ordinary data to its caller, temporary path and trail arrays end with the call, and no external resource is acquired.
 */
export function writeConnectedBodyAnatomyTarget(
  document: IAutoMovieHumanBodyBasisDocument,
  path: string,
  metres: number | undefined,
): IAutoMovieHumanBodyBasisDocument {
  const next: IAutoMovieHumanBodyBasisDocument = structuredClone(document);
  const root: Record<string, unknown> =
    (next.anatomy as Record<string, unknown> | undefined) ?? {};
  const keys: string[] = path.split(".");
  const trail: Record<string, unknown>[] = [root];
  for (const key of keys.slice(0, -1)) {
    const parent: Record<string, unknown> = trail[trail.length - 1];
    const child: unknown = parent[key];
    const node: Record<string, unknown> =
      typeof child === "object" && child !== null
        ? (child as Record<string, unknown>)
        : {};
    parent[key] = node;
    trail.push(node);
  }
  const leaf: string = keys[keys.length - 1];
  if (metres === undefined) delete trail[trail.length - 1][leaf];
  else trail[trail.length - 1][leaf] = { kind: "target", metres };
  // remove the branches the clear left empty, innermost first
  for (let depth: number = trail.length - 1; depth > 0; depth--)
    if (Object.keys(trail[depth]).length === 0)
      delete trail[depth - 1][keys[depth - 1]];
  if (Object.keys(root).length === 0) delete next.anatomy;
  else next.anatomy = root as IAutoMovieHumanBodyAnatomicalMeasurements;
  return next;
}
