import { Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMinimumJerk,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { StaggerPendulum } from "./StaggerPendulum";
import { staggerBounds } from "./staggerBounds";
import { staggerNearest } from "./staggerNearest";
import type { staggerRecover } from "./staggerRecover";

/**
 * Close and settle a caught order.
 *
 * The closing foot is itself a capture step (Hof 2008: a foot placed at the
 * extrapolated centre of mass at its contact holds it): over its swing the
 * stepping foot alone bears the body, its centre of pressure held at the point
 * of its outline nearest the extrapolated centre of mass, so the extrapolated
 * centre of mass runs away from that point as `e^(omega t)`. The foot closes
 * where that course puts it at the landing: at least the entry's stance width
 * from the stepping foot, wider where the extrapolated centre of mass will lie
 * further out on its side, and as far ahead or behind as puts the middle of the
 * two ankles where the body stood over them at the entry, under that point. The
 * swing's time is its direction's measured step time, read once for the closing
 * the caught point gives and once for the closing that prediction gives; the
 * pendulum then bears the stepping foot for the latter's time, and the close is
 * kept only where the extrapolated centre of mass then lies inside the two
 * feet's base and comes to rest inside the settling's span. The closing foot is
 * loaded as every landed foot is, over the measured weight shift, so the centre
 * of pressure runs on from the swing's into the settling's without a jump.
 *
 * @param pendulum The pendulum the catching steps left, advanced through the
 *   close.
 * @param stepped The foot that stepped last.
 * @param righting How long the centre of pressure takes to carry the
 *   extrapolated centre of mass to rest, seconds.
 * @returns The recovery, or null when the closing landing leaves the
 *   extrapolated centre of mass outside the base or the settling does not bring
 *   it to rest.
 */
export function staggerClose(
  pendulum: StaggerPendulum,
  stepped: AutoMovieHumanSide,
  righting: number,
): staggerRecover.IRecovery | null {
  const { STEP, STEP_TIME, TRANSFER, SETTLED, TRACKING }: typeof staggerBounds =
    staggerBounds;
  const flat: typeof StaggerPendulum.flat = StaggerPendulum.flat;
  const { centre, across, forward, entered, w }: StaggerPendulum = pendulum;
  const feet: StaggerPendulum["feet"] = pendulum.feet;
  const steps: StaggerPendulum["steps"] = pendulum.steps;
  const anchor: AutoMovieHumanSide = stepped;
  const closer: AutoMovieHumanSide = anchor === "left" ? "right" : "left";
  const middle: (
    staggerClose: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    >,
  ) => IAutoMovieVector3 = (
    staggerClose: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    >,
  ): IAutoMovieVector3 =>
    flat(
      Vector3.scale(
        Vector3.add(staggerClose.left.ankle, staggerClose.right.ankle),
        0.5,
      ),
    );
  const stance: number = Vector3.dot(
    Vector3.subtract(entered[closer].ankle, entered[anchor].ankle),
    across,
  );
  const caughtAt: IAutoMovieVector3 = pendulum.xi();
  pendulum.transfer(anchor, AutoMovieMotionHumanTiming.seconds(TRANSFER));
  const start: number = pendulum.t;

  // The closing foot for an extrapolated centre of mass at its landing:
  // the middle of the ankles under it as the entry stood over its own,
  // never narrower than the entry's stance.
  const placed: IAutoMovieVector3 = feet[anchor].ankle;
  const closingFor: (
    xi: IAutoMovieVector3,
  ) => IAutoMovieMotionHumanFoot.IPlacement = (
    xi: IAutoMovieVector3,
  ): IAutoMovieMotionHumanFoot.IPlacement => {
    const under: IAutoMovieVector3 = Vector3.subtract(
      Vector3.add(centre, xi),
      Vector3.subtract(flat(centre), middle(entered)),
    );
    const toward: IAutoMovieVector3 = Vector3.subtract(under, flat(placed));
    const side: number = stance >= 0 ? 1 : -1;
    const wide: number =
      side * Math.max(Math.abs(stance), 2 * side * Vector3.dot(toward, across));
    return {
      ankle: {
        ...Vector3.add(
          Vector3.add(placed, Vector3.scale(across, wide)),
          Vector3.scale(forward, 2 * Vector3.dot(toward, forward)),
        ),
        y: entered[closer].ankle.y,
      },
      rotation: entered[closer].rotation,
    };
  };
  const swingFor: (closing: IAutoMovieMotionHumanFoot.IPlacement) => number = (
    closing: IAutoMovieMotionHumanFoot.IPlacement,
  ): number =>
    pendulum.bound(
      flat(Vector3.subtract(closing.ankle, feet[closer].ankle)),
      STEP_TIME,
    );

  // Over the swing the stepping foot alone bears, its centre of pressure
  // held where the weight shift left it (`StaggerPendulum.hold`), so xi -
  // p grows as e^(omega t).
  const xi0: IAutoMovieVector3 = pendulum.xi();
  const held: IAutoMovieVector3 = pendulum.pressure();
  const predicted: (seconds: number) => IAutoMovieVector3 = (
    seconds: number,
  ): IAutoMovieVector3 =>
    Vector3.add(
      held,
      Vector3.scale(Vector3.subtract(xi0, held), Math.exp(w * seconds)),
    );
  const closing: IAutoMovieMotionHumanFoot.IPlacement = closingFor(
    predicted(swingFor(closingFor(xi0))),
  );
  pendulum.hold(swingFor(closing));
  steps.push({
    side: closer,
    from: feet[closer],
    to: closing,
    start,
    land: pendulum.t,
  });
  feet[closer] = closing;

  // Hof: the body is held only with its extrapolated centre of mass inside
  // the base the two feet now make.
  if (!pendulum.captured()) return null;

  // Then the centre of pressure carries the extrapolated centre of mass
  // over the righting to where the body stood over its feet: the
  // extrapolated centre of mass tracks a minimum-jerk course there from
  // where the close left it, the centre of pressure placed by the
  // divergent component's tracking law, p = xi - xi_ref' / omega +
  // `TRACKING` (xi - xi_ref) (Englsberger, Ott and Albu-Schaffer 2015,
  // IEEE Trans Robot 31:355), as near that as the base holds it; xi' =
  // omega (xi - p), and the centre of mass follows, x' = omega (xi - x),
  // until both rest there.
  //
  // The closing foot takes no weight as it touches down: over the measured
  // weight shift (`TRANSFER`, the loading every landed foot gets) the
  // centre of pressure runs on a minimum-jerk share from where the swing
  // held it to where the tracking law puts it, so it never jumps.
  const rest: IAutoMovieVector3 = Vector3.subtract(
    middle(feet),
    middle(entered),
  );
  const landed: IAutoMovieVector3 = pendulum.pressure();
  const loading: number = AutoMovieMotionHumanTiming.seconds(TRANSFER);
  const begin: IAutoMovieVector3 = pendulum.xi();
  const last: number = pendulum.t;
  const base: IAutoMovieVector3[] = pendulum.bearing(["left", "right"]);
  const nearest: ReturnType<typeof staggerNearest.prepare> =
    staggerNearest.prepare(base);
  const settle: IAutoMovieVector3[] = [pendulum.s];
  const drifting: IAutoMovieVector3[] = [begin];
  const pressing: IAutoMovieVector3[] = [];
  let x: IAutoMovieVector3 = pendulum.s;
  let e: IAutoMovieVector3 = begin;
  let rested: boolean = false;
  const longest: number = righting + 20 / w;
  const grow: number = Math.exp(w * STEP);
  const halfGrowth: number = grow / 2;
  const decay: number = 1 / grow;
  const rate: number = righting * w;
  const travel: IAutoMovieVector3 = Vector3.subtract(rest, begin);
  // The landing's offset from the first aimed point, which the loading
  // carries off: the first step's aim, from the drift's start, where it
  // tracks nothing yet.
  const jump: IAutoMovieVector3 = Vector3.subtract(
    landed,
    nearest(
      Vector3.subtract(begin, Vector3.scale(travel, AutoMovieEngineMotionSampling.minimumJerk(0).ds / rate)),
    ),
  );
  for (let i: number = 1; i * STEP <= longest; i++) {
    const reference: IAutoMovieMinimumJerk.IProfile = AutoMovieEngineMotionSampling.minimumJerk(
      ((i - 1) * STEP) / righting,
    );
    const towards: IAutoMovieVector3 = Vector3.lerp(begin, rest, reference.s);
    const aimed: IAutoMovieVector3 = nearest(
      Vector3.add(
        Vector3.subtract(e, Vector3.scale(travel, reference.ds / rate)),
        Vector3.scale(Vector3.subtract(e, towards), TRACKING),
      ),
    );
    const p: IAutoMovieVector3 = nearest(
      Vector3.add(
        aimed,
        Vector3.scale(
          jump,
          1 - AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, ((i - 1) * STEP) / loading)),
        ),
      ),
    );
    pressing.push(p);

    // The exact step with the centre of pressure held: xi - p grows as
    // e^(omega t), and x - p is half of it plus a part that decays.
    const z: IAutoMovieVector3 = Vector3.subtract(e, p);
    const y: IAutoMovieVector3 = Vector3.subtract(x, p);
    x = Vector3.add(
      p,
      Vector3.add(
        Vector3.scale(z, halfGrowth),
        Vector3.scale(Vector3.subtract(y, Vector3.scale(z, 0.5)), decay),
      ),
    );
    e = Vector3.add(p, Vector3.scale(z, grow));
    settle.push(x);
    drifting.push(e);
    if (
      i * STEP >= righting &&
      Vector3.distance(x, rest) <= SETTLED &&
      Vector3.distance(e, rest) <= SETTLED
    ) {
      rested = true;
      break;
    }
  }
  if (!rested) return null;
  const settled: number = last + (settle.length - 1) * STEP;
  const swung: staggerRecover.ICourses = pendulum.courses();
  const recovery: staggerRecover.IRecovery = {
    steps,
    caught: caughtAt,
    settled,
    centre,
    course: (seconds: number): IAutoMovieVector3 => {
      if (seconds >= last) {
        const at: number = Math.min(settle.length - 1, (seconds - last) / STEP);
        const i: number = Math.floor(at);
        return Vector3.lerp(
          settle[i]!,
          settle[Math.min(settle.length - 1, i + 1)]!,
          at - i,
        );
      }
      return swung.course(seconds);
    },
    pressure: (seconds: number): IAutoMovieVector3 => {
      if (seconds >= last)
        return flat(
          Vector3.add(
            centre,
            pressing[
              Math.min(pressing.length - 1, Math.floor((seconds - last) / STEP))
            ]!,
          ),
        );
      return swung.pressure(seconds);
    },
    extrapolated: (seconds: number): IAutoMovieVector3 => {
      if (seconds >= last) {
        const at: number = Math.min(
          drifting.length - 1,
          (seconds - last) / STEP,
        );
        const i: number = Math.floor(at);
        return flat(
          Vector3.add(
            centre,
            Vector3.lerp(
              drifting[i]!,
              drifting[Math.min(drifting.length - 1, i + 1)]!,
              at - i,
            ),
          ),
        );
      }
      return swung.extrapolated(seconds);
    },
  };
  return recovery;
}
