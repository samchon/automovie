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
  // Intersect the compiled generating family at the named physical X. If an anatomical hint
  // lies outside this section's lateral support, project it to that support;
  // unlike the old ellipse guess, the returned point remains on the source.
  const on: (side: "front" | "back", x: number, y: number) => ISourcePoint = (
    side: "front" | "back", x: number, y: number,
  ): ISourcePoint => {
    const u: number = heightParameter(y);
    const sign: number = x < 0 ? -1 : 1;
    const lateral: ISourcePoint = sourcePoint(u, sign * Math.PI / 2);
    if (Math.abs(x) >= Math.abs(lateral.x)) return lateral;
    let low: number = 0;
    let high: number = Math.PI / 2;
    for (let step: number = 0; step < 48; ++step) {
      const middle: number = (low + high) / 2;
      const angle: number = sign * (side === "front" ? middle : Math.PI - middle);
      if (Math.abs(sourcePoint(u, angle).x) < Math.abs(x)) low = middle;
      else high = middle;
    }
    const angle: number = sign * (side === "front" ? (low + high) / 2 : Math.PI - (low + high) / 2);
    return sourcePoint(u, angle);
  };
  // The lower trunk's stations remain horizontal and its spine rises. This
  // physical-height inverse is shared by all feature hints, not re-fitted per guide.
  function heightParameter(y: number): number {
    let low: number = 0;
    let high: number = 1;
    for (let step: number = 0; step < 48; ++step) {
      const middle: number = (low + high) / 2;
      if (surface.frame(middle).origin.y * 1000 < y) low = middle;
      else high = middle;
    }
    return (low + high) / 2;
  }
  function sourcePoint(u: number, angle: number): ISourcePoint {
    const point: IAutoMovieVector3 = surface.point(u, angle / (2 * Math.PI));
    return {x:point.x*1000,y:point.y*1000,z:point.z*1000,source:{at:u,angle}};
  }
  const left: (p: ISourcePoint) => ISourcePoint = (p: ISourcePoint): ISourcePoint => p;
  const right: (p: ISourcePoint) => ISourcePoint = (p: ISourcePoint): ISourcePoint => ({
    ...AutoMovieHumanVector.of(-p.x,p.y,p.z),
    source:p.source===undefined?undefined:{at:p.source.at,angle:-p.source.angle},
  });
  const curves: Array<{
    points: ISourcePoint[];
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
    const spine: ISourcePoint = mirror(frame.iliospinale);
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
    ({ points, form }: { points: ISourcePoint[]; form: IAutoMovieHumanTrunkFeatures.ICurve }): IAutoMovieSweep.IFeature => ({
      width: form.width / 1000,
      points: points.map(
        (p: ISourcePoint): IAutoMovieSweep.IFeaturePoint => {
          // A generated source point already owns its exact chart address.
          // Only independent bone-landmark hints require inverse projection.
          if(p.source!==undefined)return {...p.source,offset:form.offset/1000};
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

/** A generated point retains its source address through bilateral mirroring. */
interface ISourcePoint extends IAutoMovieVector3 {
  source?: {at:number;angle:number};
}
