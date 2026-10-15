import { Point } from "./Point";


export const circle = (x: number, z: number, radius: number, count = 32): Point[] => Array.from({ length: count }, (_, i) => ({ x: x + radius * Math.cos(i * Math.PI * 2 / count), y: z + radius * Math.sin(i * Math.PI * 2 / count) }));
