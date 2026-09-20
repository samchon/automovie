import { IAutoMoviePropBox, IAutoMovieServiceNode } from "@automovie/interface";

/**
 * The world keep-out volume a node needs to be serviced, or `null`.
 *
 * The authored box is node-local so that moving the equipment moves the space
 * it is opened in; a world box authored beside a world position would let the
 * two drift apart with no way to tell which one was meant.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-routing `serviceMaintenanceBounds` locates the world-space keep-out volume that must remain open around serviceable equipment.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `serviceMaintenanceBounds` translates a node-local maintenance box by the node position and returns `null` when none was declared.
 * @evidence requirements/interior/construction-maintenance-and-safety.md#interior-maintenance-access `serviceMaintenanceBounds` materializes the declared equipment-maintenance clearance as an exact world-space access envelope.
 * @evidence specifications/interior-space/construction-phases-and-alternatives.md#interior-space-installation-maintenance-safety The world maintenance box supplies the measurable access envelope consumed by obstruction and safety checks.
 * @author Samchon
 */
export const serviceMaintenanceBounds = (
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
