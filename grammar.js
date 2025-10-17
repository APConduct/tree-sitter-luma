/**
 * @file Luma grammar for tree-sitter
 * @author Perry <aidanpj18@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  CALL: 10,
  MEMBER: 9,
  UNARY: 8,
  MULT: 7,
  ADD: 6,
  COMPARE: 5,
  AND: 4,
  OR: 3,
  ASSIGN: 2,
  LOWEST: 1,
};

const commaSep = (rule) => seq(rule, repeat(seq(",", rule)));
const commaSep1 = (rule) => seq(rule, repeat(seq(",", rule)));
const optionalCommaSep = (rule) => optional(commaSep(rule));

module.exports = grammar({
  name: "luma",

  conflicts: ($) => [
    [$.type, $.cast_expression],
    [$.type],
    [$.expression, $.call_expression],
  ],

  extras: ($) => [/\s/, $.comment],

  rules: {
    source_file: ($) => repeat($.statement),

    statement: ($) =>
      choice(
        $.attribute_statement,
        $.const_declaration,
        $.let_declaration,
        $.function_declaration,
        $.type_declaration,
        $.struct_declaration,
        $.enum_declaration,
        $.import_statement,
        $.export_statement,
        $.expression_statement,
        $.control_statement,
        $.switch_statement,
        $.module_declaration,
        $.namespace_declaration,
        $.defer_statement,
        $.comment,
      ),

    // Attribute/directive statements (e.g. @use "terminal" as term)
    attribute_statement: ($) =>
      seq(
        "@",
        $.identifier,
        $.attribute_args,
        optional(seq("as", $.identifier)),
        optional(";"),
      ),
    attribute_args: ($) =>
      choice(
        $.string,
        $.identifier,
        seq("(", optional(commaSep($.expression)), ")"),
      ),

    // Let variable declaration
    let_declaration: ($) =>
      seq(
        "let",
        $.identifier,
        optional(seq(":", $.type)),
        "=",
        $.expression,
        ";",
      ),

    // Defer statement
    defer_statement: ($) => seq("defer", $.expression, ";"),

    // Qualified identifier (static access, e.g. term::getch)
    qualified_identifier: ($) => seq($.identifier, "::", $.identifier),

    // Top-level const
    const_declaration: ($) =>
      seq(
        "const",
        $.identifier,
        optional(seq(":", $.type)),
        "=",
        $.expression,
        optional(";"),
      ),

    // Function declaration
    function_declaration: ($) =>
      seq(
        "fn",
        $.identifier,
        $.parameter_list,
        optional(seq(":", $.type)),
        $.block,
      ),

    parameter_list: ($) => seq("(", optional(commaSep($.parameter)), ")"),
    parameter: ($) => seq($.identifier, ":", $.type),

    // Type declaration
    type_declaration: ($) => seq("type", $.identifier, "=", $.type, ";"),

    // Struct declaration
    struct_declaration: ($) => seq("struct", $.identifier, $.struct_body),
    struct_body: ($) => seq("{", optional(commaSep($.struct_field)), "}"),
    struct_field: ($) => seq($.identifier, ":", $.type),

    // Enum declaration
    enum_declaration: ($) => seq("enum", $.identifier, $.enum_body),
    enum_body: ($) => seq("{", optional(commaSep($.enum_variant)), "}"),
    enum_variant: ($) => $.identifier,

    // Import/export
    import_statement: ($) =>
      seq("import", $.identifier, optional(seq("from", $.string)), ";"),
    export_statement: ($) => seq("export", $.identifier, ";"),

    // Expression statement
    expression_statement: ($) => seq($.expression, ";"),

    // Control statements (if, while, for, etc.)
    control_statement: ($) =>
      choice(
        $.if_statement,
        $.while_statement,
        $.for_statement,
        $.loop_statement,
        $.return_statement,
        $.break_statement,
        $.continue_statement,
      ),

    if_statement: ($) =>
      seq("if", $.expression, $.block, optional(seq("else", $.block))),
    while_statement: ($) => seq("while", $.expression, $.block),
    for_statement: ($) => seq("for", $.identifier, "in", $.expression, $.block),
    loop_statement: ($) => seq("loop", $.block),
    return_statement: ($) => seq("return", optional($.expression), ";"),
    break_statement: ($) => seq("break", ";"),
    continue_statement: ($) => seq("continue", ";"),

    // Switch statement
    switch_statement: ($) =>
      seq(
        "switch",
        $.expression,
        "{",
        repeat($.switch_case),
        optional($.switch_default),
        "}",
      ),
    switch_case: ($) => seq("case", $.expression, ":", $.block),
    switch_default: ($) => seq("default", ":", $.block),

    // Module/namespace
    module_declaration: ($) => seq("module", $.identifier, $.block),
    namespace_declaration: ($) => seq("namespace", $.identifier, $.block),

    // Block
    block: ($) => seq("{", repeat($.statement), "}"),

    // Types
    type: ($) =>
      choice(
        $.primitive_type,
        $.identifier,
        seq($.type, "[", $.expression, "]"), // array type
        seq($.type, "<", commaSep1($.type), ">"), // generic type
        seq("*", $.type), // pointer type (right-recursive)
      ),
    primitive_type: ($) =>
      choice("int", "float", "bool", "char", "string", "void"),

    // Expressions
    // Function expression (fn (...) [type] { ... }) or (fn (...) : type { ... })
    function_expression: ($) =>
      seq(
        "fn",
        $.parameter_list,
        optional(choice(seq(":", $.type), $.type)),
        $.block,
      ),

    expression: ($) =>
      choice(
        $.identifier,
        $.literal,
        $.call_expression,
        $.member_expression,
        $.binary_expression,
        $.unary_expression,
        $.parenthesized_expression,
        $.cast_expression,
        $.function_expression,
      ),

    call_expression: ($) =>
      seq(choice($.qualified_identifier, $.identifier), $.argument_list),
    argument_list: ($) => seq("(", optional(commaSep($.expression)), ")"),

    member_expression: ($) => seq($.expression, ".", $.identifier),

    binary_expression: ($) =>
      prec.left(
        PREC.ADD,
        seq(
          $.expression,
          choice(
            "+",
            "-",
            "*",
            "/",
            "%",
            "==",
            "!=",
            "<",
            ">",
            "<=",
            ">=",
            "&&",
            "||",
            "=",
            "+=",
            "-=",
            "*=",
            "/=",
            "%=",
          ),
          $.expression,
        ),
      ),

    unary_expression: ($) =>
      prec.left(PREC.UNARY, seq(choice("!", "-", "*", "&"), $.expression)),

    parenthesized_expression: ($) => seq("(", $.expression, ")"),

    cast_expression: ($) => seq($.expression, "as", $.type),

    // Literals
    literal: ($) =>
      choice($.number, $.string, $.char, $.boolean, $.array_literal),
    number: ($) => /\d+(\.\d+)?/,
    string: ($) => seq('"', repeat(choice(/[^"\\]+/, $.escape_sequence)), '"'),
    char: ($) => seq("'", choice(/[^'\\]/, $.escape_sequence), "'"),
    escape_sequence: ($) =>
      seq("\\", choice(/n/, /r/, /t/, /\\/, /"/, /'/, /./)),
    boolean: ($) => choice("true", "false"),
    array_literal: ($) => seq("[", optional(commaSep($.expression)), "]"),

    // Identifiers
    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    // Comments
    comment: ($) =>
      token(
        choice(seq("//", /.*/), seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),
      ),
  },
});
