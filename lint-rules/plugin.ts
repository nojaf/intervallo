import type { Plugin } from "@oxlint/plugins";
import { annotateNonPrimitives } from "./annotate-non-primitives.ts";
import { explicitVoidReturn } from "./explicit-void-return.ts";

const plugin: Plugin = {
  meta: {
    name: "intervallo",
  },
  rules: {
    "annotate-non-primitives": annotateNonPrimitives,
    "explicit-void-return": explicitVoidReturn,
  },
};

export default plugin;
