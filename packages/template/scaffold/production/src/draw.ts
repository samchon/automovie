import { installAutoMovieDraw } from "@automovie/render";

import { subjects } from "./subjects";

// The draw-only page has no interface: it installs the draw function every host calls for the production's films, and the delivery render opens it at `/render/index.html`.
installAutoMovieDraw(subjects);
