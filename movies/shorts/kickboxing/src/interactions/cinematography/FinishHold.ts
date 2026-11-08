import type { IAutoMovieVector3 } from "@automovie/interface";

import { CoverageLaw } from "../../laws/cinematography/CoverageLaw";
import { SightLaw } from "../../laws/cinematography/SightLaw";

/**
 * The finish view's choice and hold. Before the blow, the visibility law's
 * candidate views are tried nearest the open side's side-on view first.
 * After the blow, the view keeps that open side and turns from where it
 * stands by the least amount that keeps every framed man inside the
 * rope-held lens, so the fall, the count and the winner's walk to his corner
 * and his celebration all stay in the picture wherever they go.
 *
 * ```ts
 * for (const view of FinishHold.views(scene, lens, hold, overhead, step)) ...;
 * FinishHold.bearing({ open, current, frames: (b) => FinishHold.frames(lensAt(b), spheres, scene) });
 * ```
 *
 * @evidence docs/research/cinematography/fight-coverage.md#law Side-on first; the least turn or rise that clears the blow, no higher than an operator holds the camera; the open side held through the fall and the count.
 * @evidence docs/research/cinematography/fight-coverage.md#targets The wide view keeps both fighters' whole bodies in frame.
 */
export namespace FinishHold {
  /**
   * Spacing of the bearings tried after the blow, radians: fifteen degrees,
   * which the coverage orbit closes in under a third of a second (film
   * choice).
   */
  export const SPACING: number = Math.PI / 12;

  /** Bearings tried either side of the open bearing: the open half-plane, a quarter turn each way. */
  const REACH: number = Math.round(Math.PI / 2 / SPACING);

  /** A lens held inside the ropes. */
  export interface ILens {
    /** Lens position, world metres. */
    position: IAutoMovieVector3;

    /** Look-at point, world metres. */
    target: IAutoMovieVector3;

    /** Whether the ropes held it back from its framing distance. */
    clamped: boolean;
  }

  /**
   * The visibility law's candidate views whose own lens is clear: the open
   * side's views nearest the side-on view first, up to the lens height an
   * operator reaches with the camera overhead. A wide view holds all three
   * men only while its lens stands at its framing distance inside the ropes,
   * so the views whose lens has that room at every second of the hold come
   * first, then those with room at the contact, then the rest.
   *
   * @param scene The finish scene.
   * @param lens The rope-held lens of a view at a second.
   * @param hold The seconds of the hold.
   * @param overhead The highest lens an operator holds, metres.
   * @param step The smallest turn or rise, radians.
   * @returns Candidate views in order.
   */
  export function* views(
    scene: SightLaw.IScene,
    lens: (view: SightLaw.IView, seconds: number) => ILens,
    hold: readonly number[],
    overhead: number,
    step: number,
  ): Generator<SightLaw.IView> {
    const open: number = SightLaw.open(
      scene.attacker,
      scene.receiver,
      scene.contact,
    );
    const base: ILens = lens(
      { bearing: open, elevation: CoverageLaw.ELEVATION },
      scene.seconds,
    );
    const highest: number = Math.atan2(
      overhead - base.target.y,
      Math.hypot(
        base.position.x - base.target.x,
        base.position.z - base.target.z,
      ),
    );
    const views: SightLaw.IView[] = SightLaw.views(
      open,
      CoverageLaw.ELEVATION,
      step,
      highest,
    );
    const room = (view: SightLaw.IView): number =>
      hold.every((t) => !lens(view, t).clamped)
        ? 0
        : !lens(view, scene.seconds).clamped
          ? 1
          : 2;
    for (const level of [0, 1, 2])
      for (const view of views) {
        const placed: ILens = lens(view, scene.seconds);
        if (placed.position.y > overhead || room(view) !== level) continue;
        if (SightLaw.clearance(placed.position, scene) > 0) yield view;
      }
  }

  /**
   * Whether a lens frames every man whole: the top and bottom of each one's
   * bounding sphere inside the delivered frame.
   *
   * @param lens The lens.
   * @param spheres Each man's bounding sphere.
   * @param scene The finish scene the frame test reads.
   * @returns True when all are in frame.
   */
  export function frames(
    lens: Pick<ILens, "position" | "target">,
    spheres: readonly { center: IAutoMovieVector3; radius: number }[],
    scene: SightLaw.IScene,
  ): boolean {
    return (
      SightLaw.framed(
        lens.position,
        lens.target,
        {
          ...scene,
          watched: spheres.flatMap((s) =>
            [-1, 1].map((side) => ({
              point: { ...s.center, y: s.center.y + side * s.radius },
              seconds: scene.seconds,
              carriers: [],
            })),
          ),
        },
        CoverageLaw.FIELD_OF_VIEW,
        CoverageLaw.ASPECT,
      ) > 0
    );
  }

  /**
   * The wanted bearing at one instant after the blow.
   *
   * @param input The open side's bearing, the current bearing and whether a bearing's lens frames every man.
   * @returns The current bearing while it frames them inside the open half; else the framing bearing of the open half nearest it; else the open bearing.
   */
  export function bearing(input: {
    open: number;
    current: number;
    frames: (bearing: number) => boolean;
  }): number {
    if (
      turn(input.open, input.current) <= Math.PI / 2 + 1e-9 &&
      input.frames(input.current)
    )
      return input.current;
    const candidates: number[] = [];
    for (let k: number = -REACH; k <= REACH; k++)
      candidates.push(input.open + k * SPACING);
    candidates.sort(
      (p: number, q: number): number =>
        turn(input.current, p) - turn(input.current, q),
    );
    return candidates.find(input.frames) ?? input.open;
  }

  /** Unsigned turn between two bearings, radians. */
  function turn(a: number, b: number): number {
    return Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a)));
  }
}
