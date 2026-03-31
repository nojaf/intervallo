/**
 * Functions with a `void` or `Promise<void>` return type must contain
 * an explicit `return` statement at every branch exit.
 * Treats void as a pseudo unit type.
 */

import type { Context, ESTree, Rule } from "@oxlint/plugins";

/** Check if the return type annotation is `void` or `Promise<void>`. */
function isVoidReturn(returnType: ESTree.TSTypeAnnotation | null | undefined): boolean {
  if (returnType == null) return false;
  const typeAnnotation: ESTree.TSType = returnType.typeAnnotation;

  // Direct: `: void`
  if (typeAnnotation.type === "TSVoidKeyword") return true;

  // Promise<void>
  if (typeAnnotation.type === "TSTypeReference") {
    if (typeAnnotation.typeName.type !== "Identifier") return false;
    if (typeAnnotation.typeName.name !== "Promise") return false;
    const args: ESTree.TSTypeParameterInstantiation | null = typeAnnotation.typeArguments;
    if (args == null) return false;
    if (args.params.length !== 1) return false;
    // Non-null assertion: safe because we checked length === 1 above
    if (args.params[0]!.type === "TSVoidKeyword") return true;
  }

  return false;
}

/**
 * Check if a statement list ends with a return on every execution path.
 * Recurses into block-like structures (if/else, try/catch, switch)
 * but stops at nested function boundaries.
 */
function endsWithReturn(statements: ReadonlyArray<ESTree.Statement | ESTree.Directive>): boolean {
  if (statements.length === 0) return false;
  // Non-null assertion: safe because we checked length > 0 above
  const last: ESTree.Statement | ESTree.Directive = statements[statements.length - 1]!;

  if (last.type === "ReturnStatement") return true;

  if (last.type === "BlockStatement") return endsWithReturn(last.body);

  // if/else: both branches must end with return (if no else, it doesn't end with return)
  if (last.type === "IfStatement") {
    if (last.alternate == null) return false;
    const consequentEnds: boolean =
      last.consequent.type === "BlockStatement"
        ? endsWithReturn(last.consequent.body)
        : last.consequent.type === "ReturnStatement";
    const alternateEnds: boolean =
      last.alternate.type === "BlockStatement"
        ? endsWithReturn(last.alternate.body)
        : last.alternate.type === "IfStatement"
          ? endsWithReturn([last.alternate])
          : last.alternate.type === "ReturnStatement";
    return consequentEnds && alternateEnds;
  }

  // try/catch: both try and catch must end with return
  if (last.type === "TryStatement") {
    const tryEnds: boolean = endsWithReturn(last.block.body);
    if (last.handler == null) return tryEnds;
    const catchEnds: boolean = endsWithReturn(last.handler.body.body);
    return tryEnds && catchEnds;
  }

  // switch: every case must end with return
  if (last.type === "SwitchStatement") {
    if (last.cases.length === 0) return false;
    for (const c of last.cases) {
      if (!endsWithReturn(c.consequent)) return false;
    }
    return true;
  }

  return false;
}

export const explicitVoidReturn: Rule = {
  create(context: Context) {
    return {
      FunctionDeclaration(node: ESTree.Function): void {
        if (!isVoidReturn(node.returnType)) return;
        if (node.body == null) return;
        if (!endsWithReturn(node.body.body)) {
          context.report({
            node: node.id ?? node,
            message:
              "Functions with void return type must end with an explicit `return` on every branch.",
          });
        }
      },
      ArrowFunctionExpression(node: ESTree.ArrowFunctionExpression): void {
        if (!isVoidReturn(node.returnType)) return;
        // Arrow with expression body (e.g. `() => expr`) is fine
        if (node.expression) return;
        if (node.body.type !== "BlockStatement") return;
        if (!endsWithReturn(node.body.body)) {
          context.report({
            node,
            message:
              "Arrow functions with void return type must end with an explicit `return` on every branch.",
          });
        }
      },
    };
  },
};
