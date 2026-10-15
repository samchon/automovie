import { Point } from "./Point";


export const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y + a.z * b.z;
