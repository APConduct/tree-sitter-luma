
(let_declaration
  (identifier) @property)

(literal
  (number) @number)

(literal
  (string) @string)

(call_expression
  (identifier) @function)

(call_expression
  (argument_list
    (expression
      (identifier) @property)))

(call_expression
  (qualified_identifier
    (identifier) @type
    (identifier) @function))

(const_declaration
  (identifier) @function)

["fn"] @keyword
["let"] @keyword
["const"] @keyword
["defer"] @keyword
["as"] @keyword
["return"] @keyword

["int"] @type
["char"] @type
