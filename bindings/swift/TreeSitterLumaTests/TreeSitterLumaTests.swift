import XCTest
import SwiftTreeSitter
import TreeSitterLuma

final class TreeSitterLumaTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_luma())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Luma grammar")
    }
}
