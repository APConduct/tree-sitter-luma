package tree_sitter_luma_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_luma "github.com/tree-sitter/tree-sitter-luma/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_luma.Language())
	if language == nil {
		t.Errorf("Error loading Luma grammar")
	}
}
