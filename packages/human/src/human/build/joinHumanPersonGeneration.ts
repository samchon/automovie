import type { IAutoMovieHumanPersonBodyView } from "../structures/IAutoMovieHumanPersonBodyView";
import type { IAutoMovieHumanPersonGeneration } from "../structures/IAutoMovieHumanPersonGeneration";
import type { IAutoMovieHumanPersonHeadView } from "../structures/IAutoMovieHumanPersonHeadView";
import type { IAutoMovieHumanPersonSourceSurface } from "../structures/IAutoMovieHumanPersonSourceSurface";

/**
 * Compose published head/body generation descriptors into the one-skin evaluator input.
 *
 * Refuse differing generation IDs or a view with no registered source surface. The check accepts any matching registered surface; full skin/source-tree/weight admission belongs to compilation. A new shallow descriptor borrows head/body members unchanged and keeps the head's headShapeSource. This addressing check supplies no anatomical or physical validation.
 *
 * @evidence contracts/common.md#principled-implementation Equal generation IDs and actual registered surface presence join the published member records for downstream full source admission.
 * @evidence contracts/common.md#clear-and-simple-design One shallow composition selects head-owned face/weights/drivers/traits and body-owned body/band without duplicating compilation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or differing registrations refuse; any-surface presence is not advertised as complete skin-tree compatibility or clinical identity proof.
 * @evidence contracts/common.md#meaningful-documentation Prose states actual registration scope, member provenance and new-wrapper versus borrowed-record ownership.
 * @evidence contracts/performance.md#efficient-algorithms Two short-circuit surface scans precede a fixed descriptor allocation, without walking mesh buffers.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This composition owns no generation cache or shared compilation coordinator; downstream builders compile their own admitted invariants.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned descriptor retains borrowed generation members; temporary predicates retain no task or external resource.
 */
export function joinHumanPersonGeneration(
  head: IAutoMovieHumanPersonHeadView,
  body: IAutoMovieHumanPersonBodyView,
): IAutoMovieHumanPersonGeneration {
  if (head.id !== body.id)
    throw new Error(
      "The person head file (" +
        head.id +
        ") and body file (" +
        body.id +
        ") are different generations.",
    );
  const registered: (surfaces: readonly IAutoMovieHumanPersonSourceSurface[]) => boolean = (
    surfaces: readonly IAutoMovieHumanPersonSourceSurface[],
  ): boolean =>
    surfaces.some((surface: IAutoMovieHumanPersonSourceSurface): boolean => surface.sourcePartition?.generation === head.id);
  if (!registered(head.face.surfaces))
    throw new Error(
      "The person head file's face view is not registered on generation " +
        head.id +
        ".",
    );
  if (!registered(body.body.surfaces))
    throw new Error(
      "The person body file's body view is not registered on generation " +
        head.id +
        ".",
    );
  return {
    id: head.id,
    face: head.face,
    body: body.body,
    headSkin: head.headSkin,
    band: body.band,
    aliases: head.aliases,
    drivers: head.drivers,
    headShapeSource: head.headShapeSource,
  };
}
