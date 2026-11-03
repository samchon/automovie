import { HumanAnatomy } from "./HumanAnatomy";

type V3 = HumanAnatomy.V3;
const A: typeof HumanAnatomy = HumanAnatomy;

/** The knee's anterior profile, from which the mid-patella level of the knee girth is found. */
export namespace HumanAnatomyLegPatella {
  /**
   * Mid-patella height: the most forward-convex point of the knee's anterior
   * profile in the sagittal plane through the knee joint, the patella standing
   * proud between the quadriceps tendon above and the patellar tendon below.
   * Sought from 20 mm above the joint centre, which stands at the femoral
   * epicondyles, to 60 mm below it: ANSUR II puts mid-patella 16.9 mm (women)
   * and 3.3 mm (men) below the lateral femoral epicondyle and 11.2 and 20.2 mm
   * above tibiale on average. Convexity is the profile's sagitta over a 12 mm
   * chord, read every 2 mm.
   */
  export function patellaHeight(skin: HumanAnatomy.ISkin, knee: V3): number {
    const lines: { points: V3[]; closed: boolean }[] = A.polylines(
      skin,
      knee,
      [0, 0, 1],
      A.near(skin, A.add(knee, [0, 100, 0]), A.add(knee, [0, -100, 0]), 120),
    );

    // The profile's most forward point at a height, in front of the joint axis.
    const front: (y: number) => number = (y: number): number => {
      let x: number = -Infinity;
      for (const l of lines)
        for (let i: number = 0; i + 1 < l.points.length; i++) {
          const a: V3 = l.points[i]!;
          const b: V3 = l.points[i + 1]!;
          if ((a[1] - y) * (b[1] - y) > 0 || a[1] === b[1]) continue;

          const at: number = a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]);
          if (at > knee[0]) x = Math.max(x, at);
        }
      return x;
    };

    // The most negative second difference is the sharpest forward bulge.
    let best: number = knee[1];
    let sharpest: number = Infinity;
    for (let y: number = knee[1] + 20; y >= knee[1] - 60; y -= 2) {
      const bend: number = front(y + 6) + front(y - 6) - 2 * front(y);
      if (Number.isFinite(bend) && bend < sharpest) {
        sharpest = bend;
        best = y;
      }
    }
    return best;
  }
}
