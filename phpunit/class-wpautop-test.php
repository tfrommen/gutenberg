<?php
/**
 * Automatic paragraph applicatino tests
 *
 * @package Gutenberg
 */

class WPAutoP_Test extends WP_UnitTestCase {
	function test_wpautop_block_content() {
		$original = file_get_contents( dirname( __FILE__ ) . '/fixtures/wpautop-original.html' );
		$expected = file_get_contents( dirname( __FILE__ ) . '/fixtures/wpautop-expected.html' );

		$actual = wpautop_block_content( $original );

		$this->assertEquals( $expected, $actual );
	}
}
