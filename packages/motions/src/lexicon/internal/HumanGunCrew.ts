import { AutoMovieComposition } from "@automovie/engine";
import type {
  IAutoMovieComposition,
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanGunCrew,
  IAutoMovieMotionHumanLook,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../chain/HumanChain";
import { HumanGunDrill } from "./HumanGunDrill";

/*
 * One field gun's crew serving one load and fire: the duties of the National
 * Park Service's drill for the 12-pounder Napoleon, each role's rows
 * (`HumanGunDrill`) in its own chain, every duty synced to the end of the one
 * before it in the drill's order, so the crew interlocks as the drill says: the
 * vent covered before the sponge goes in, the charge passed (No. 5 handing it
 * over as No. 2 receives it), placed and rammed, the vent pricked, the gun
 * laid, the primer hooked, the crew clear of the wheels and the muzzle, and the
 * lanyard pulled on the gunner's command, a cue track instant and no motion.
 * The charge and the primer are set on the gun's own sockets (`muzzle`,
 * `vent`), so they ride the tube as the gun is laid.
 *
 * Roles are performers with their own bodies and seeds; nothing here is written
 * for a body. Each duty's duration is its law's, provisional, so the cycle's
 * rate (3 to 4 rounds a minute for a well-drilled crew, NPS) is a measurement
 * of the composed crew, not an input. The NPS page says its drill was altered
 * for the crew's safety; the 1864 Instruction for Field Artillery is located
 * but not read.
 *
 * The film blocking entry point composes crew arrival and gaze on an authored
 * cue. It uses the scene's marks and performers' ordinary walking and gaze.
 */
export namespace HumanGunCrew {
  /*
   * One performer and their blocking for a digital crew scene.
   */
  export interface IStageStation {
    /*
     * The staged performer subject id.
     */
    subject: string;

    /*
     * Destination mark on the staged walking surface, in world metres.
     */
    mark: IAutoMovieVector3;

    /*
     * Arrival in seconds relative to the cue, defaulting to zero.
     */
    offset?: number;

    /*
     * Gaze after reaching the mark, such as toward a performer or inert prop.
     */
    gaze: IAutoMovieMotionHumanLook.IParams;
  }

  /*
   * Compose a cue-timed arrival and gaze for each performer in a digital crew
   * scene. The walk ends on the named event plus the role's offset. Gaze starts
   * at arrival. The scene separately authors any held prop or effect.
   * Parameter cue: The performance cue-track id, event and optional zero-based
   * occurrence.
   * Parameter stations: The staged performers and their authored station marks.
   * Returns: Parallel performer chains in station order. An empty cast yields
   * an empty parallel composition.
   */
  export function stage(
    cue: Required<Pick<IAutoMovieMotionHumanChainCore.ISync, StageCue>> &
      Pick<IAutoMovieMotionHumanChainCore.ISync, "index">,
    stations: readonly IStageStation[],
  ): IAutoMovieComposition {
    return AutoMovieComposition.parallel(
      ...stations.map(
        (station: IStageStation): IAutoMovieComposition =>
          HumanChain.subject(station.subject)
            .walk({ to: station.mark })
            .sync({ ...cue, align: "end", offset: station.offset ?? 0 })
            .look(station.gaze).node,
      ),
    );
  }

  /*
   * The crew's composition for one load and fire.
   * Parameter roles: The performers by role.
   * Parameter scene: The gun, the implements and the places.
   * Returns: The composition, every role's chain in one parallel group.
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
            kind: {
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
      // No. 2 takes the charge No. 5 holds out (the handover's receiving
      // half, `HumanMutual.handOver`), then places it once the receiving
      // grip has settled, after the giver's hand has let go.
      HumanChain.subject(roles.n2)
        .registered(
          "receive",
          { prop: scene.charge, partner: roles.n5, handle: "body" },
          "receiveCharge",
        )
        .sync({ of: "passCharge", event: "start" })
        .registered(
          HumanGunDrill.loadCharge.name,
          { prop: scene.charge, onto: { prop: scene.gun, point: "muzzle" } },
          "loadCharge",
        ).node,
      HumanChain.subject(roles.n1)
        .registered(
          HumanGunDrill.ramCharge.name,
          {
            kind: {
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
            kind: {
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
            kind: {
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
          { prop: scene.primer, onto: { prop: scene.gun, point: "vent" } },
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
          kind: {
            kind: "slider",
            at: { kind: "prop", subject: scene.lanyard, point: "handle" },
            travel: scene.pull,
          },
        })
        .sync({ of: scene.command.of, event: scene.command.event }).node,
    );
  }
}

/*
 * The alternatives of `StageCue`'s site.
 */
type StageCue = "of" | "event";
