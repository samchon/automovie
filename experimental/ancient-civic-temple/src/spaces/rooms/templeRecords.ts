/** Middle records room and direct threshold */
import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import { thresholdCells } from "../../geometry/thresholdCells";
import { levelCell } from "../../geometry/levelCell";
import { templeDoorPassages } from "../templeDoorPassages";
import { templeLevels as y } from "../templeLevels";
import { templeRecordsPlan } from "./templeRecordsPlan";
export const templeRecords = (): IAutoMovieBuiltSpace => ({
  id: "records", kind: "records", parent: y.storey, fidelity: "exact",
  cells: [
    levelCell("records.body", templeRecordsPlan, y.floor, y.lowCeiling),
    ...thresholdCells("records", templeDoorPassages, y.floor),
  ],
});

