/**
 * docs/models/columns.md의 주랑 원주와 포치 원주. 로컬 원점은 기단 바닥면 중심, 축은 +Y.
 * 여섯 단(기단·받침·몸통·목 띠·받침머리·주두 판)을 문서 치수로 쌓고 몸통 높이만 전체 높이에서
 * 유도한다. part는 plinth·base·shaft·capital이며 재료는 materials가 결속한다.
 */
import type { IAutoMovieModel } from "@automovie/interface";
import { box, frustum, merged, model, part, turned } from "./mesh-kit";

interface ColumnProfile {
  plinth: number; plinthHeight: number;
  baseRadius: number; baseHeight: number;
  shaftBottom: number; shaftTop: number;
  neckRadius: number; neckHeight: number;
  echinusTop: number; echinusHeight: number;
  abacus: number; abacusHeight: number;
}

const column = (id: string, name: string, height: number, c: ColumnProfile): IAutoMovieModel => {
  const shaftHeight = height - c.plinthHeight - c.baseHeight - c.neckHeight - c.echinusHeight - c.abacusHeight;
  if (!(shaftHeight > 0)) throw new Error(`${id}: 전체 높이 ${height}m가 몸통 없는 높이입니다.`);
  const h1 = c.plinthHeight;
  const h2 = h1 + c.baseHeight;
  const h3 = h2 + shaftHeight;
  const h4 = h3 + c.neckHeight;
  const h5 = h4 + c.echinusHeight;
  const half = c.plinth / 2;
  const abacus = c.abacus / 2;
  return model(id, name, [
    part(`surface.${name}.plinth`, box(-half, half, 0, h1, -half, half)),
    part(`surface.${name}.base`, frustum(c.baseRadius, c.baseRadius, h1, h2)),
    part(`surface.${name}.shaft`, frustum(c.shaftBottom, c.shaftTop, h2, h3)),
    part(`surface.${name}.capital`, merged([
      turned([{ x: c.neckRadius, y: h3 }, { x: c.neckRadius, y: h4 }, { x: c.echinusTop, y: h5 }]),
      box(-abacus, abacus, h5, height, -abacus, abacus),
    ])),
  ]);
};

/** 주랑 원주. 전체 높이는 주랑 보 아랫면까지(배치 쪽이 판정된 지붕에서 유도해 넘긴다). */
export const colonnadeColumnModel = (height: number): IAutoMovieModel => column(
  `model.column-colonnade.${Math.round(height * 1000)}`, "column-colonnade", height, {
    plinth: 0.34, plinthHeight: 0.08, baseRadius: 0.155, baseHeight: 0.10,
    shaftBottom: 0.135, shaftTop: 0.115, neckRadius: 0.125, neckHeight: 0.03,
    echinusTop: 0.155, echinusHeight: 0.10, abacus: 0.34, abacusHeight: 0.07,
  });

/** 포치 원주. 전체 높이 3.20m(포치 보 아랫면), 기단 0.50m. */
export const porchColumnModel = (): IAutoMovieModel => column("model.column-porch", "column-porch", 3.2, {
  plinth: 0.5, plinthHeight: 0.10, baseRadius: 0.21, baseHeight: 0.13,
  shaftBottom: 0.18, shaftTop: 0.155, neckRadius: 0.165, neckHeight: 0.04,
  echinusTop: 0.21, echinusHeight: 0.13, abacus: 0.46, abacusHeight: 0.09,
});
