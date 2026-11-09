import { AutoMovieChain } from "@automovie/engine";
import * as THREE from "three";

import { StageAction } from "../../../laws/staging/StageAction";

/**
 * The films' one camera on the 9:16 frame: a 50° vertical lens and the
 * screenplay's camera decisions as shot intents. Each shot names who it
 * frames, the size, who must read screen left and right, the station or side
 * it shoots from, the lens height and how it moves; the camera track works
 * out where it stands every second. A shot lasts until the next shot.
 *
 * ```ts
 * camera.twoShot([harry, carina], { start: 15, from: "southEast", keep: "hands" })
 *   .next(camera.wide([carina], { start: 20, from: "eastEnd", cut: true }));
 * ```
 *
 * @evidence docs/body/settings/cinematography/vertical-look.md#normal 40–55° vertical lens on the tall frame; 55–70° in flight.
 * @evidence docs/body/settings/cinematography/vertical-look.md#two-people Two people in profile or on a diagonal; full two-shot fill 55–80%, wide 35–55%.
 * @evidence docs/body/settings/cinematography/vertical-look.md#operator Follows, arcs, pushes in and pulls back for a reason; never shakes.
 * @evidence docs/body/settings/cinematography/vertical-look.md#cutting Cuts at shot starts; screen direction kept.
 * @evidence contracts/development/entities.md#object-shape A camera entity whose capabilities return intent chains.
 * @evidence contracts/development/common.md#meaningful-documentation States what a shot names and how long it lasts.
 */
export class VerticalCamera {
  /** Stable subject id. */
  public readonly id: string = "camera";

  /** The rendered camera. */
  public readonly camera: THREE.PerspectiveCamera;

  /** Build the camera on the 720 × 1280 frame. */
  public constructor() {
    this.camera = new THREE.PerspectiveCamera(50, 9 / 16, 0.05, 1200);
  }

  /** A shot of any size. */
  public shot(subjects: VerticalCamera.Subject[], options: VerticalCamera.IShot & { size: StageAction.IShot["size"] }): AutoMovieChain {
    const shot: StageAction.IShot = {
      size: options.size,
      subjects: subjects.map(VerticalCamera.id),
      ...(options.screen === undefined ? {} : { screen: { left: VerticalCamera.id(options.screen[0]), right: VerticalCamera.id(options.screen[1]) } }),
      ...(options.from === undefined ? {} : { from: options.from }),
      height: options.height ?? "standing",
      motion: options.motion ?? "follow",
      ...(options.seconds === undefined ? {} : { seconds: options.seconds }),
      cut: options.cut ?? true,
      ...(options.alongside === undefined ? {} : { alongside: options.alongside }),
      ...(options.keep === undefined ? {} : { keep: options.keep }),
    };
    return AutoMovieChain.of(
      StageAction.intent(this.id, { kind: "shot", shot, ...(options.start === undefined ? {} : { start: options.start }) }, options.anchor),
    );
  }

  /** A wide shot holding everyone named and their landmark. */
  public wide(subjects: VerticalCamera.Subject[], options: VerticalCamera.IShot = {}): AutoMovieChain {
    return this.shot(subjects, { motion: "hold", ...options, size: "wide" });
  }

  /** A full two-shot; with `screen: [a, b]`, a reads screen left and b screen right. */
  public twoShot(subjects: [VerticalCamera.Subject, VerticalCamera.Subject], options: VerticalCamera.IShot = {}): AutoMovieChain {
    return this.shot(subjects, { screen: subjects, ...options, size: options.size === "medium" ? "medium" : "full" });
  }

  /** A medium shot, head to hips. */
  public medium(subjects: VerticalCamera.Subject[], options: VerticalCamera.IShot = {}): AutoMovieChain {
    return this.shot(subjects, { ...options, size: "medium" });
  }

  /** Push in from the current framing to a closer size on the subjects or their hands, without a cut. */
  public pushIn(subjects: VerticalCamera.Subject[], options: VerticalCamera.IShot = {}): AutoMovieChain {
    return this.shot(subjects, { cut: false, motion: "push", seconds: 1.5, keep: "hands", ...options, size: options.size === "close" ? "close" : "medium" });
  }

  /** Pull back from the current framing to a wider size, without a cut. */
  public pullBack(subjects: VerticalCamera.Subject[], options: VerticalCamera.IShot = {}): AutoMovieChain {
    return this.shot(subjects, { cut: false, motion: "pull", seconds: 1.5, ...options, size: options.size === "wide" ? "wide" : "full" });
  }

  /** Follow a moving subject at a size, panning and tracking with operator lag. */
  public follow(subject: VerticalCamera.Subject, options: VerticalCamera.IShot = {}): AutoMovieChain {
    return this.shot([subject], { motion: "follow", ...options, size: options.size ?? "full" } as VerticalCamera.IShot & { size: StageAction.IShot["size"] });
  }

  /** Ride beside a rider at a three-quarter or side view, matching speed; or ehind, straight behind the rider's heading and a little above, looking along it. */
  public alongside(
    subjects: VerticalCamera.Subject[],
    options: VerticalCamera.IShot & { side?: "left" | "right"; view?: "front" | "rear" | "side" | "behind"; distance?: number; above?: number } = {},
  ): AutoMovieChain {
    return this.shot(subjects, {
      ...options,
      size: options.size ?? "full",
      motion: "alongside",
      alongside: { side: options.side ?? "left", view: options.view ?? "front", distance: options.distance ?? 6, ...(options.above === undefined ? {} : { above: options.above }) },
    });
  }
}
export namespace VerticalCamera {
  /** A framed subject: an entity or its id. */
  export type Subject = string | { readonly id: string };

  /** Shot options. */
  export interface IShot {
    /** Absolute film second the shot starts. */
    start?: number;

    /** Anchor id. */
    anchor?: string;

    /** Size, for the generic shot or to choose a variant. */
    size?: StageAction.IShot["size"];

    /** Who reads screen left and screen right. */
    screen?: [Subject, Subject];

    /** A camera station of the set, or `"left"`/`"right"` of the subjects' line. */
    from?: string;

    /** Lens height. */
    height?: StageAction.IShot["height"];

    /** How the camera moves. */
    motion?: StageAction.IShot["motion"];

    /** Seconds of a push, pull or arc. */
    seconds?: number;

    /** Whether the shot starts with a cut. */
    cut?: boolean;

    /** Riding geometry for `alongside`. */
    alongside?: StageAction.IShot["alongside"];

    /** What must stay inside the margins. */
    keep?: StageAction.IShot["keep"];
  }

  /**
   * The id of a subject.
   *
   * @param subject An entity or an id.
   * @returns The id.
   */
  export function id(subject: Subject): string {
    return typeof subject === "string" ? subject : subject.id;
  }
}
