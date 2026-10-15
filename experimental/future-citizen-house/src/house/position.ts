import { Frame } from "./Frame";
import { v } from "./v";

export const position = (f: Frame, u: number, y: number, offset = 0) => f.along === "x" ? v(u, y, f.plane + offset) : v(f.plane + offset, y, u);
