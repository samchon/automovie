import type { IAutoMovieActionCall, IAutoMovieBeatEndState, IAutoMovieMotion, IAutoMovieShotProgram, IAutoMovieSkeleton } from "@automovie/interface";
import { compileDefinedShot } from "../../../../packages/engine/src/film/compileDefinedShot";
import { defineShot } from "../../../../packages/engine/src/film/defineShot";
import { DOOR_CONTRACT } from "./DOOR_CONTRACT";
import { IDoorShotProps } from "./IDoorShotProps";
import { doorProgram } from "./doorProgram";
import { createDoorPropSpec } from "./createDoorPropSpec";
import { createSkeleton } from "./fixtures";
import { validSynthesizer } from "./filmFixtures";

/** Compile the door fixture under one variation. */
export function compileDoorShot (
  props: IDoorShotProps = {},
): ReturnType<typeof compileDefinedShot> { return compileDefinedShot({
    shot: defineShot("SB-door", {
      scene: "scene-duel",
      contract: DOOR_CONTRACT,
      build: () : IAutoMovieShotProgram => doorProgram(props.extraSet ?? []),
    }),
    context: undefined,
    runtime: {
      // A coupling animates an object, never a rig, so it synthesizes nothing:
      // the torch has to stay off `performances` for the baked follow to be the
      // only authority over it.
      synthesize: (action: IAutoMovieActionCall, actor: string, previous: IAutoMovieBeatEndState | null | undefined) : IAutoMovieMotion | null =>
        action.verb === "attachTo"
          ? null
          : validSynthesizer(action, actor, previous),
      skeleton: () : IAutoMovieSkeleton => createSkeleton(),
      frameFormat: { width: 1920, height: 1080 },
      props: "props" in props ? props.props : [createDoorPropSpec()],
      objectMotions: props.objectMotions,
    },
  }); }
