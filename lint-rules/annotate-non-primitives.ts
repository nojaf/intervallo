/**
 * Require type annotations on variable declarations when the initializer
 * is not a simple primitive literal.
 *
 * Allowed without annotation:
 *   const x = 42;
 *   const name = "hello";
 *   const ok = true;
 *   const tpl = `hello ${name}`;
 *   const s = totalSec % 60;
 *   const sStr = s < 10 ? "0" : "1";
 *   const top = expr as Pixels;
 *
 * Requires annotation:
 *   const rect: DOMRect = el.getBoundingClientRect();
 *   const acc: NodeRect[] = [];
 *   const node: ChildNode = nodes[i]!;
 */

import type { Context, ESTree, Rule } from "@oxlint/plugins";

/** Returns true when the expression is a `z.object(...)` call. */
function isZodObject(node: ESTree.CallExpression): boolean {
  const callee: ESTree.Expression = node.callee;
  return (
    callee.type === "MemberExpression" &&
    callee.object.type === "Identifier" &&
    callee.object.name === "z" &&
    callee.property.type === "Identifier" &&
    callee.property.name === "object"
  );
}

/** Returns true when the expression's type is obvious without an annotation. */
function isObvious(node: ESTree.Expression): boolean {
  switch (node.type) {
    case "Literal":
    case "TemplateLiteral":
      return true;

    case "UnaryExpression":
      return isObvious(node.argument);

    case "BinaryExpression":
      return true;

    case "ConditionalExpression":
      return isObvious(node.consequent) && isObvious(node.alternate);

    case "TSAsExpression":
      return true;

    case "TSNonNullExpression":
      return false;

    case "CallExpression":
      return isZodObject(node);

    default:
      return false;
  }
}

export const annotateNonPrimitives: Rule = {
  create(context: Context) {
    return {
      ArrowFunctionExpression(node: ESTree.ArrowFunctionExpression): void {
        for (const param of node.params) {
          if (param.type !== "Identifier") continue;
          if (param.typeAnnotation != null) continue;

          context.report({
            node: param,
            message: `Parameter '${param.name}' requires a type annotation.`,
          });
        }
      },

      VariableDeclaration(node: ESTree.VariableDeclaration): void {
        if (node.kind !== "const" && node.kind !== "let") return;

        for (const decl of node.declarations) {
          // Skip if already annotated
          if (decl.id.typeAnnotation != null) continue;

          // Skip destructuring patterns
          if (decl.id.type !== "Identifier") continue;

          // Skip declarations without initializer (e.g. `let x;`)
          if (decl.init === null) continue;

          // Allow expressions whose type is obvious
          if (isObvious(decl.init)) continue;

          context.report({
            node: decl.id,
            message: `Variable '${decl.id.name}' requires a type annotation because its type is not obvious from the initializer.`,
          });
        }
      },
    };
  },
};
