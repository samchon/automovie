import { IAutoMoviePanelValue } from "./IAutoMoviePanelValue";

/**
 * One named operating state and the travel it gives each panel.
 *
 * @evidence requirements/interior/doors-windows-and-openings.md#interior-opening-operable-state Exposes `IAutoMovieOperationState` as the portable data boundary for the interior opening operable state requirement.
 * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-host-opening-operation Types `IAutoMovieOperationState` for the interior space host opening operation system contract.
 */
export interface IAutoMovieOperationState {
  /**
   * Stable state name such as `closed`, `open`, or a production term.
   *
   * @evidence requirements/interior/doors-windows-and-openings.md#interior-opening-operable-state Exposes `id` as the portable data boundary for the interior opening operable state requirement.
   * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-host-opening-operation Types `id` for the interior space host opening operation system contract.
   */
  id: string;

  /**
   * One value per panel; every panel of the operation must appear exactly once.
   *
   * @evidence requirements/interior/doors-windows-and-openings.md#interior-opening-operable-state Exposes `panels` as the portable data boundary for the interior opening operable state requirement.
   * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-host-opening-operation Types `panels` for the interior space host opening operation system contract.
   */
  panels: IAutoMoviePanelValue[];
}
