import { slots } from "./slots";

export type Axis = { path: string; model: string; part: string; slot: (typeof slots)[number]; axis: "u" | "v"; status: "checked" | "clamped" | "unverified"; reason: string; };
