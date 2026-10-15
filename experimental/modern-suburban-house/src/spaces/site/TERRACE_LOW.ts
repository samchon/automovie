import { TERRACE_RISE } from "./TERRACE_RISE";
import { TERRACE_RISERS } from "./TERRACE_RISERS";
import { TERRACE_TOP } from "./TERRACE_TOP";


/** Lower landing height, three risers below the ground floor. */
export const TERRACE_LOW = TERRACE_TOP - TERRACE_RISERS * TERRACE_RISE;
