import { IAutoMoviePropBox, IAutoMovieServiceNode } from "@automovie/interface";
/**
 * The world keep-out volume a node needs to be serviced, or `null`.
 *
 * The authored box is node-local so that moving the equipment moves the space
 * it is opened in; a world box authored beside a world position would let the
 * two drift apart with no way to tell which one was meant.
 * No rotation or scale is applied; the source node has only world position.
 *
 * @evidence contracts/common.md#principled-implementation Translating both corners of the node-local access box by node.position preserves its metre extents and carries maintenance space with equipment movement.
 * @evidence contracts/common.md#clear-and-simple-design Validation and obstruction queries share this local-to-world access conversion while node configuration owns its extents.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null remains no declared access volume; no equipment-kind default or invented clearance is substituted.
 * @evidence contracts/common.md#meaningful-documentation States local versus world coordinates, null absence and translation-only composition without implicit rotation or scaling.
 * @evidence contracts/performance.md#efficient-algorithms Six corner additions and two new corner records require constant time and storage for any node.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work An envelope depends on current node position and local bounds; no prior equipment-placement result is cached.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A present envelope owns new min/max coordinates and retains neither source box nor node record.
 *
 * @author Samchon
 */
export const serviceMaintenanceBounds: (node: IAutoMovieServiceNode) => IAutoMoviePropBox | null = (
  node: IAutoMovieServiceNode,
): IAutoMoviePropBox | null =>
  node.maintenance === null
    ? null
    : {
        min: {
          x: node.position.x + node.maintenance.min.x,
          y: node.position.y + node.maintenance.min.y,
          z: node.position.z + node.maintenance.min.z,
        },
        max: {
          x: node.position.x + node.maintenance.max.x,
          y: node.position.y + node.maintenance.max.y,
          z: node.position.z + node.maintenance.max.z,
        },
      };
