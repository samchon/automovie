import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * One field gun's crew serving one load and fire: the duties of the National
 * Park Service's drill for the 12-pounder Napoleon, each role's rows
 * (`HumanGunDrill`) in its own chain, every duty synced to the end of the one
 * before it in the drill's order, so the crew interlocks as the drill says: the
 * vent covered before the sponge goes in, the charge passed, placed and rammed,
 * the vent pricked, the gun laid, the primer hooked, the crew clear of the
 * wheels and the muzzle, and the lanyard pulled on the gunner's command, a cue
 * track instant and no motion.
 *
 * Roles are performers with their own bodies and seeds; nothing here is written
 * for a body. Each duty's duration is its law's, provisional, so the cycle's
 * rate (3 to 4 rounds a minute for a well-drilled crew, NPS) is a measurement
 * of the composed crew, not an input. The NPS page says its drill was altered
 * for the crew's safety; the 1864 Instruction for Field Artillery is located
 * but not read.
 */
export namespace IAutoMovieMotionHumanGunCrew {
  /**
   * The crew's composition for one load and fire. The crew's performers by
   * role.
   */
  export interface IRoles {
    /** The gunner, who lays the gun and commands the fire. */
    gunner: string;

    /** No. 1, who sponges and rams. */
    n1: string;

    /** No. 2, who places the charge. */
    n2: string;

    /** No. 3, who covers and pricks the vent. */
    n3: string;

    /** No. 4, who hooks the primer and pulls the lanyard. */
    n4: string;

    /** No. 5, who brings the charge from the limber. */
    n5: string;
  }

  /** The gun, its implements and the places the scene gives. */
  export interface IScene {
    /** The gun's prop: its `muzzle`, `vent` and independently driven `screw`. */
    gun: string;

    /**
     * The sponge and rammer: a held implement whose `sponge` and `rammer` heads
     * go into the bore.
     */
    rammer: string;

    /** The cartridge No. 5 brings. */
    charge: string;

    /** The priming wire No. 3 holds. */
    wire: string;

    /** The primer No. 4 hooks into the vent. */
    primer: string;

    /** The lanyard's prop, its `handle` a slider. */
    lanyard: string;

    /** How deep the bore runs from the muzzle to the breech, metres. */
    bore: number;

    /** How deep the priming wire goes down the vent to the charge, metres. */
    vent: number;

    /** How far the gunner turns the elevating screw to lay the gun, degrees. */
    lay: number;

    /** How far No. 4 draws the lanyard to fire, metres. */
    pull: number;

    /** Where Nos. 1 to 3 stand clear of the wheels' line, by role. */
    clear: Readonly<Record<"n1" | "n2" | "n3", IAutoMovieVector3>>;

    /** The cue track and instant of the gunner's command to fire. */
    command: {
      /** Performance cue-track id containing the gunner's command. */
      of: string;
      /** Cue event name giving the gunner's firing command. */
      event: string;
    };
  }
}
