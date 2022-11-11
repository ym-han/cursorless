import { TextEditor } from "vscode";
import { SyntaxNode } from "web-tree-sitter";
import { SimpleScopeTypeType } from "../typings/targetDescriptor.types";
import { NodeMatcherAlternative, SelectionWithContext } from "../typings/Types";
import { patternFinder } from "../util/nodeFinders";
import {
	ancestorChainNodeMatcher,
	argumentMatcher,
	cascadingMatcher,
	createPatternMatchers,
	leadingMatcher,
	matcher,
	patternMatcher,
	trailingMatcher,
} from "../util/nodeMatchers";
import {
	makeNodePairSelection,
	makeRangeFromPositions,
} from "../util/nodeSelectors";

// Generated by the following command:
// `curl https://raw.githubusercontent.com/tree-sitter/tree-sitter-rust/36ae187ed6dd3803a8a89dbb54f3124c8ee74662/src/node-types.STATEMENT_TYPES | jq '[.[] | select(.type == "_declaration_statement") | .subtypes[].type, "expression_statement"]'`
const STATEMENT_TYPES = [
	"associated_type",
	"attribute_item",
	"const_item",
	"empty_statement",
	"enum_item",
	"extern_crate_declaration",
	"foreign_mod_item",
	"impl_item",
	"inner_attribute_item",
	"let_declaration",
	"macro_definition",
	"macro_invocation",
	"function_item",
	"function_signature_item",
	"mod_item",
	"static_item",
	"struct_item",
	"trait_item",
	"type_item",
	"union_item",
	"use_declaration",
	"expression_statement",
];

/**
 * Scope types allowed to be parents of a statement
 */
const STATEMENT_PARENT_TYPES = ["source_file", "block", "declaration_list"];

/**
 * Returns "impl_item[type]" node higher in the chain
 * @param node The node which we will start our search from
 * @returns node or null
 */
function implItemTypeFinder(node: SyntaxNode) {
	if (
		node.parent?.type === "impl_item" &&
		node.parent?.childForFieldName("type")?.equals(node)
	) {
		return node;
	}
	return null;
}

function traitBoundExtractor(
	editor: TextEditor,
	node: SyntaxNode,
): SelectionWithContext {
	return {
		selection: makeNodePairSelection(node.children[1], node.lastNamedChild!),
		context: {
			leadingDelimiterRange: makeRangeFromPositions(
				node.children[0].startPosition,
				node.children[1].startPosition,
			),
		},
	};
}

/**
 * Returns the return value node for a given block if we are in a block that has
 * a return value. If the return value expression uses the return keyword then
 * we return the value itself otherwise we just return the expression
 * @param node The node which we might match
 * @returns The return value node
 */
function returnValueFinder(node: SyntaxNode) {
	if (node.type !== "block") {
		return null;
	}

	const { lastNamedChild } = node;

	// The return expression will always be the last statement or expression in
	// the block
	if (lastNamedChild == null) {
		return null;
	}

	// If the final name child is an expression statement not a raw expression
	// then we only treat it as a return value if it is a return expression.
	// Otherwise it is just a normal statement that doesn't return anything
	if (lastNamedChild.type === "expression_statement") {
		const expression = lastNamedChild.child(0)!;

		if (expression.type === "return_expression") {
			return expression.child(1);
		}

		return null;
	}

	// Any other type of statement is not a return statement so we should not
	// match it
	if (STATEMENT_TYPES.includes(lastNamedChild.type)) {
		return null;
	}

	// NB: At this point we have now excluded all statement types of the only other
	// possible node is an expression node

	// If it is a return expression then we zoom down to the actual value of the
	// return expression. This happens when they say `return foo` with no
	// trailing semicolon
	if (lastNamedChild.type === "return_expression") {
		return lastNamedChild.child(1);
	}

	// At this point it is an expression which is not a return expression so we
	// just return it as the return value of the block
	return lastNamedChild;
}

const nodeMatchers: Partial<
	Record<SimpleScopeTypeType, NodeMatcherAlternative>
> = {
	statement: ancestorChainNodeMatcher(
		[
			patternFinder(...STATEMENT_PARENT_TYPES),
			patternFinder(...STATEMENT_TYPES),
		],
		1,
	),
	string: ["raw_string_literal", "string_literal"],
	ifStatement: ["if_expression", "if_let_expression"],
	functionCall: ["call_expression", "macro_invocation", "struct_expression"],
	functionCallee: "call_expression[function]",
	comment: ["line_comment", "block_comment"],
	list: ["array_expression", "tuple_expression"],
	collectionItem: argumentMatcher("array_expression", "tuple_expression"),
	namedFunction: "function_item",
	type: cascadingMatcher(
		leadingMatcher(
			[
				"let_declaration[type]",
				"parameter[type]",
				"field_declaration[type]",
				"const_item[type]",
			],
			[":"],
		),
		matcher(
			patternFinder(
				"constrained_type_parameter[bounds]",
				"where_predicate[bounds]",
			),
			traitBoundExtractor,
		),
		leadingMatcher(["function_item[return_type]"], ["->"]),
		matcher(implItemTypeFinder),
		patternMatcher(
			"struct_item",
			"trait_item",
			"impl_item",
			"array_type[element]",
		),
	),
	functionName: ["function_item[name]"],
	anonymousFunction: "closure_expression",
	argumentOrParameter: argumentMatcher(
		"arguments",
		"parameters",
		"meta_arguments",
		"type_parameters",
	),
	collectionKey: cascadingMatcher(
		trailingMatcher(["field_initializer[name]", "field_pattern[name]"], [":"]),
	),
	name: cascadingMatcher(
		patternMatcher(
			"let_declaration.identifier!",
			"parameter.identifier!",
			"function_item[name]",
			"struct_item[name]",
			"enum_item[name]",
			"trait_item[name]",
			"const_item[name]",
			"meta_item.identifier!",
			"let_declaration[pattern]",
			"constrained_type_parameter[left]",
			"where_predicate[left]",
			"field_declaration[name]",
		),
		trailingMatcher(["field_initializer[name]", "field_pattern[name]"], [":"]),
	),
	class: ["struct_item", "struct_expression", "enum_item"],
	className: ["struct_item[name]", "enum_item[name]", "trait_item[name]"],
	value: cascadingMatcher(
		leadingMatcher(["let_declaration[value]"], ["="]),
		leadingMatcher(
			["field_initializer[value]", "field_pattern[pattern]"],
			[":"],
		),
		patternMatcher("meta_item[value]", "const_item[value]"),
		matcher(returnValueFinder),
	),
	attribute: trailingMatcher(["mutable_specifier", "attribute_item"]),
};

export default createPatternMatchers(nodeMatchers);
