import type { IAutoMovieModel, IAutoMovieMaterial as IAutoMovieMaterialImported, IAutoMovieModelPart as IAutoMovieModelPartImported } from "@automovie/interface";

import { buildPortraitHairGroom } from "../anatomy/hair/buildPortraitHairGroom";
import { resolveHumanFaceGroom } from "../document/resolveHumanFaceGroom";
import type { IAutoMovieHumanFaceGroom } from "../structures/IAutoMovieHumanFaceGroom";



/**
 * Give a built connected face the hair authored against its own surfaces.
 *
 * A separately authored groom is licensed independently of the facial basis and must be seated on that face's actual surfaces. A face may have alternative grooms; resident hair identities cannot collide with the newly generated parts.
 *
 * The result is a new model. Neither input is mutated, the resident parts keep
 * their order and identity, and the hair follows as additional parts with their
 * own generated finish, so an export that ignored hair before still finds the
 * same face in the same place.
 *
 * Composition preserves actual source seats and rejects identity collisions; it establishes no anatomical or likeness judgment. A groom seated on another face is an approximation whose appearance needs its own observation.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Source-seated groom locks are resolved on resident live triangles, converted to the procedural hair profile and built by the existing card/material owners before appending under noncolliding part/material identities.
 * @evidence contracts/common.md#clear-and-simple-design This composition boundary joins separately licensed face and groom resources; resident part references/order remain shared unchanged and the returned model owns its new part array and cloned material palette.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Resident/generated finish or part identity collisions refuse; the resolver restores local Float32/ordinary TRS while preserving source seat weights under reflection. Declared groom basis identity and inside-triangle weights remain independently unchecked, and composition certifies no collision, likeness or GPU acceptance.
 * @evidence contracts/common.md#meaningful-documentation Prose explains resource independence, new model, input preservation and geometric-versus-likeness limits; source parts remain the caller's unchanged references.
 * @evidence contracts/performance.md#efficient-algorithms Work includes resident part/material lookup, G groom station transforms and card tessellation, followed by one combined part-array copy and material clone; no face geometry is rebuilt.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing face parts are reused by reference and the shared groom resolver/tessellator owns production; changed live seats or groom need new hair rather than a stale result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned model retains original part references plus new hair/material buffers; temporary profile data is call-local, and failure mutates neither input nor retains external tasks.
 */
export function appendHumanFaceGroom(props: {
  model: IAutoMovieModel;
  groom: IAutoMovieHumanFaceGroom;
}): IAutoMovieModel {
  if (props.model.materials.some((item: IAutoMovieMaterialImported): boolean  => item.id === props.groom.finish.id))
    throw new Error(
      "A groom finish collides with a finish this face already carries: " +
        props.groom.finish.id,
    );
  const { parts, materials }: { parts: IAutoMovieModelPartImported[]; materials: IAutoMovieMaterialImported[]; } = buildPortraitHairGroom({
    hair: resolveHumanFaceGroom({ groom: props.groom, model: props.model }),
    materials: [...props.model.materials, props.groom.finish],
  });
  const identities: Set<string> = new Set(props.model.parts.map((part: IAutoMovieModelPartImported): string => part.id));
  for (const part of parts) {
    if (identities.has(part.id))
      throw new Error("A groom part collides with resident or generated geometry: " + part.id);
    identities.add(part.id);
  }
  return {
    ...props.model,
    parts: [...props.model.parts, ...parts],
    materials,
  };
}
