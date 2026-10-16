import {
  IAutoMovieSweep,
  IAutoMovieSweepSurface,
  locateAutoMovieSweepPoint,
} from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AUTOMOVIE_HUMAN_TRUNK_FEATURES } from "./AUTOMOVIE_HUMAN_TRUNK_FEATURES";
import { IAutoMovieHumanTrunkFeatures } from "./IAutoMovieHumanTrunkFeatures";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";
import { profileAutoMovieHumanTrunk } from "./profileAutoMovieHumanTrunk";

/**
 * The trunk's anatomical feature curves, laid on its own sweep: the inferior borders of the pectorals, the iliac crests, the inguinal lines and the natal cleft.
 *
 * Each curve is drawn in the model frame through bony landmarks of the skeleton (iliospinale, iliocristale) and through points the level profile places on the surface (the sternum at the inframammary fold, the anterior axillary fold, the posterior superior iliac spines, the pubic tubercles, the sacrum's apex), then located on the compiled sweep point by point (`locateAutoMovieSweepPoint`), so it follows the surface whatever the sweep's stations. Each carries the offset and width of its form record; the curves lie on the trunk sweep only, from the crotch up, so the gluteal folds, which run under the buttocks on the thigh tubes, are drawn there by their own tubes.
 *
 * @param props.frame The side's trunk frame
 * @param props.profile The trunk's level sections
 * @param props.surface The trunk's sweep compiled without features
 * @returns The features, in the sweep's own parameters and metres
 */
export function featureAutoMovieHumanTrunk(props: {
  frame: IAutoMovieHumanTrunkFrame;
  profile: profileAutoMovieHumanTrunk.IProfile;
  surface: IAutoMovieSweepSurface;
}): IAutoMovieSweep.IFeature[] {
  const { frame, profile, surface }: typeof props = props;
  const L: IAutoMovieHumanTrunkFrame.ILevels = frame.levels;
  const F: IAutoMovieHumanTrunkFeatures = AUTOMOVIE_HUMAN_TRUNK_FEATURES;
  // a point on the front or back of the level section at `x` across, estimated on the ellipse through the midline and the side
  const on: (side: "front" | "back", x: number, y: number) => IAutoMovieVector3 = (
    side: "front" | "back",
    x: number,
    y: number,
  ): IAutoMovieVector3 => {
    const widest: number = profile.widest(y);
    const reach: number =
      (side === "front" ? profile.front(y) : profile.back(y)) - widest;
    const share: number = Math.min(0.98, Math.abs(x) / profile.half(y));
    return AutoMovieHumanVector.of(
      x,
      y,
      widest + reach * Math.sqrt(1 - share * share),
    );
  };
  const left: (p: IAutoMovieVector3) => IAutoMovieVector3 = (p: IAutoMovieVector3): IAutoMovieVector3 => p;
  const right: (p: IAutoMovieVector3) => IAutoMovieVector3 = (p: IAutoMovieVector3): IAutoMovieVector3 =>
    AutoMovieHumanVector.of(-p.x, p.y, p.z);
  const curves: Array<{
    points: IAutoMovieVector3[];
    form: IAutoMovieHumanTrunkFeatures.ICurve;
  }> = [];
  for (const mirror of [left, right]) {
    curves.push({
      points: [
        mirror(on("front", F.pectoral.medial, L.fold)),
        mirror(on("front", F.pectoral.middle * profile.half(L.fold), L.fold)),
        mirror(
          on(
            "front",
            F.pectoral.lateral * profile.half(L.axilla),
            L.axilla - F.pectoral.below,
          ),
        ),
      ],
      form: F.pectoral,
    });
    const spine: IAutoMovieVector3 = mirror(frame.iliospinale);
    curves.push({
      points: [
        spine,
        mirror(frame.iliocristale),
        mirror(on("back", F.iliac.dimple, frame.iliospinale.y)),
      ],
      form: F.iliac,
    });
    const tubercle: number =
      L.crotch + F.inguinal.tubercle * (frame.iliospinale.y - L.crotch);
    curves.push({
      points: [spine, mirror(on("front", F.inguinal.medial, tubercle))],
      form: F.inguinal,
    });
  }
  const apex: number =
    L.buttock + F.cleft.apex * (frame.iliospinale.y - L.buttock);
  curves.push({
    points: [on("back", 0, apex), on("back", 0, L.crotch)],
    form: F.cleft,
  });
  return curves.map(
    ({ points, form }: { points: IAutoMovieVector3[]; form: IAutoMovieHumanTrunkFeatures.ICurve }): IAutoMovieSweep.IFeature => ({
      width: form.width / 1000,
      points: points.map(
        (p: IAutoMovieVector3): IAutoMovieSweep.IFeaturePoint => {
          const found: { u: number; v: number; offset: number } =
            locateAutoMovieSweepPoint({
              surface,
              point: { x: p.x / 1000, y: p.y / 1000, z: p.z / 1000 },
            });
          return {
            at: found.u,
            angle: 2 * Math.PI * found.v,
            offset: form.offset / 1000,
          };
        },
      ),
    }),
  );
}
