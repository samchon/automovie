import { AutoMovieComposition } from "@automovie/engine";
import type {
  IAutoMovieComposition,
  IAutoMovieMotionHumanGunCrew,
} from "@automovie/interface";

import { HumanChain } from "../HumanChain";
import { HumanGunDrill } from "./HumanGunDrill";

/**
 * One field gun's crew serving one load and fire (#3489): the duties of the
 * National Park Service's drill for the 12-pounder Napoleon, each role's
 * rows (`HumanGunDrill`) in its own chain, every duty synced to the end of
 * the one before it in the drill's order (#3340), so the crew interlocks as
 * the drill says: the vent covered before the sponge goes in, the charge
 * passed, placed and rammed, the vent pricked, the gun laid, the primer
 * hooked, the crew clear of the wheels and the muzzle, and the lanyard
 * pulled on the gunner's command, a cue track instant and no motion.
 *
 * Roles are performers with their own bodies and seeds; nothing here is
 * written for a body. Each duty's duration is its law's, provisional, so the
 * cycle's rate (3 to 4 rounds a minute for a well-drilled crew, NPS) is a
 * measurement of the composed crew, not an input. The NPS page says its
 * drill was altered for the crew's safety; the 1864 Instruction for Field
 * Artillery is located but not read, and where it departs is recorded on
 * #3489.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the duties in order, how they are synchronised, what is provisional and what source is still unread.
 * @evidence contracts/development/design.md#principled-representation A composition of the roles' chains, each duty a row of a shipped law synced to its predecessor's end.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The roles, the props and places the scene gives, and the one function that composes the drill.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No duty writes motion; every place and prop is the scene's.
 */
export namespace HumanGunCrew {
  /**
   * The crew's composition for one load and fire.
   *
   * @param roles The performers by role.
   * @param scene The gun, the implements and the places.
   * @returns The composition, every role's chain in one parallel group.
   */
  export function drill(
    roles: IAutoMovieMotionHumanGunCrew.IRoles,
    scene: IAutoMovieMotionHumanGunCrew.IScene,
  ): IAutoMovieComposition {
    const muzzle = {
      kind: "prop",
      subject: scene.gun,
      point: "muzzle",
    } as const;
    const vent = { kind: "prop", subject: scene.gun, point: "vent" } as const;
    return AutoMovieComposition.parallel(
      HumanChain.subject(roles.n3).registered(
        HumanGunDrill.coverVent.name,
        { target: vent },
        "coverVent",
      ).node,
      HumanChain.subject(roles.n1)
        .registered(
          HumanGunDrill.spongeBore.name,
          {
            mechanism: {
              kind: "insert",
              prop: scene.rammer,
              tip: "sponge",
              into: muzzle,
              depth: scene.bore,
              withdraw: true,
            },
          },
          "spongeBore",
        )
        .sync({ of: "coverVent", event: "start" }).node,
      HumanChain.subject(roles.n5)
        .registered(
          HumanGunDrill.passCharge.name,
          { prop: scene.charge, to: roles.n2, handle: "body" },
          "passCharge",
        )
        .sync({ of: "spongeBore", event: "end" }).node,
      HumanChain.subject(roles.n2)
        .registered(
          HumanGunDrill.loadCharge.name,
          { prop: scene.charge, at: muzzle },
          "loadCharge",
        )
        .sync({ of: "passCharge", event: "end" }).node,
      HumanChain.subject(roles.n1)
        .registered(
          HumanGunDrill.ramCharge.name,
          {
            mechanism: {
              kind: "insert",
              prop: scene.rammer,
              tip: "rammer",
              into: muzzle,
              depth: scene.bore,
              withdraw: true,
            },
          },
          "ramCharge",
        )
        .sync({ of: "loadCharge", event: "end" }).node,
      HumanChain.subject(roles.n3)
        .registered(
          HumanGunDrill.prickVent.name,
          {
            mechanism: {
              kind: "insert",
              prop: scene.wire,
              into: vent,
              depth: scene.vent,
              withdraw: true,
            },
          },
          "prickVent",
        )
        .sync({ of: "ramCharge", event: "end" }).node,
      HumanChain.subject(roles.gunner)
        .registered(
          HumanGunDrill.layGun.name,
          {
            mechanism: {
              kind: "knob",
              at: { kind: "prop", subject: scene.gun, point: "screw" },
              turn: scene.lay,
            },
          },
          "layGun",
        )
        .sync({ of: "prickVent", event: "end" }).node,
      HumanChain.subject(roles.n4)
        .registered(
          HumanGunDrill.hookPrimer.name,
          { prop: scene.primer, at: vent },
          "hookPrimer",
        )
        .sync({ of: "layGun", event: "end" }).node,
      ...(["n1", "n2", "n3"] as const).map(
        (role) =>
          HumanChain.subject(roles[role])
            .registered(HumanGunDrill.standClear.name, {
              to: scene.clear[role],
            })
            .sync({ of: "hookPrimer", event: "end" }).node,
      ),
      HumanChain.subject(roles.n4)
        .registered(HumanGunDrill.pullLanyard.name, {
          mechanism: {
            kind: "slider",
            at: { kind: "prop", subject: scene.lanyard, point: "handle" },
            travel: scene.pull,
          },
        })
        .sync({ of: scene.command.of, event: scene.command.event }).node,
    );
  }
}
