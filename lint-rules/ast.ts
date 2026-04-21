import type { ParseResult } from "oxc-parser";
import { parseSync } from "oxc-parser";

const input: string = await Bun.stdin.text();
const result: ParseResult = parseSync("input.ts", input);
console.log(JSON.stringify(result.program, null, 2));
