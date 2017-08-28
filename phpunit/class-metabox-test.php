<?php
/**
 * Test for Metabox integration.
 *
 * @package Gutenberg
 */

/**
 * Tests metabox integration.
 *
 * Most of the PHP portion of the metabox integration is not testeable due to
 * WordPress's architecture. These tests cover the portions that are testable.
 */
class Metabox_Test extends WP_UnitTestCase {

	public function setUp() {
		parent::setUp();

		$this->metaboxes = array(
			'post'         => array(
				'normal'   => array(
					'core' => array(
						'revisionsdiv' => array(
							'id'       => 'revisionsdiv',
							'title'    => 'Revisions',
							'callback' => 'post_revisions_meta_box',
							'args'     => null,
						),
						'postexcerpt' => array(
							'id'       => 'postexcerpt',
							'title'    => 'Excerpt',
							'callback' => 'post_excerpt_meta_box',
							'args'     => null,
						),
						'trackbacksdiv' => array(
							'id'       => 'trackbacksdiv',
							'title'    => 'Send Trackbacks',
							'callback' => 'post_trackback_meta_box',
							'args'     => null,
						),
						'postcustom' => array(
							'id'       => 'postcustom',
							'title'    => 'Custom Fields',
							'callback' => 'post_custom_meta_box',
							'args'     => null,
						),
						'commentstatusdiv' => array(
							'id'       => 'commentstatusdiv',
							'title'    => 'Discussion',
							'callback' => 'post_comment_status_meta_box',
							'args'     => null,
						),
						'commentsdiv' => array(
							'id'       => 'commentsdiv',
							'title'    => 'Comments',
							'callback' => 'post_comment_meta_box',
							'args'     => null,
						),
						'slugdiv' => array(
							'id'       => 'slugdiv',
							'title'    => 'Slug',
							'callback' => 'post_slug_meta_box',
							'args'     => null,
						),
						'authordiv' => array(
							'id'       => 'authordiv',
							'title'    => 'Author',
							'callback' => 'post_author_meta_box',
							'args'     => null,
						),
					),
					'low'  => array(),
					'high' => array(),
				),
				'side'     => array(
					'core' => array(
						'submitdiv'    => array(
							'id'       => 'submitdiv',
							'title'    => 'Submit',
							'callback' => 'post_submit_meta_box',
							'args'     => null,
						),
						'formatdiv'    => array(
							'id'       => 'formatdiv',
							'title'    => 'Format',
							'callback' => 'post_format_meta_box',
							'args'     => null,
						),
						'categorydiv'  => array(
							'id'       => 'categorydiv',
							'title'    => 'Categories',
							'callback' => 'post_categories_meta_box',
							'args'     => null,
						),
						'tagsdiv-post_tag' => array(
							'id'       => 'tagsdiv-post_tag',
							'title'    => 'Tags',
							'callback' => 'post_tags_meta_box',
							'args'     => null,
						),
						'postimagediv' => array(
							'id'       => 'postimagediv',
							'title'    => 'Featured Image',
							'callback' => 'post_image_meta_box',
							'args'     => null,
						),
					),
					'low'  => array(),
				),
			),
		);
	}

	/**
	 * Tests for empty meta box.
	 */
	public function test_gutenberg_is_metabox_empty_with_empty_metabox() {
		$context = 'side';
		$post_type = 'post';
		$metaboxes = $this->metaboxes;
		$metaboxes[ $post_type ][ $context ] = array();

		$is_empty = gutenberg_is_metabox_empty( $metaboxes, $context, $post_type );
		$this->assertTrue( $is_empty );
	}

	/**
	 * Tests for non empty metabox area.
	 */
	public function test_gutenberg_is_metabox_empty_with_non_empty_metabox() {
		$context = 'normal';
		$post_type = 'post';
		$metaboxes = $this->metaboxes;

		$is_empty = gutenberg_is_metabox_empty( $metaboxes, $context, $post_type );
		$this->assertFalse( $is_empty );
	}

	/**
	 * Tests for non existant location.
	 */
	public function test_gutenberg_is_metabox_empty_with_non_existant_location() {
		$context = 'test';
		$post_type = 'post';
		$metaboxes = $this->metaboxes;

		$is_empty = gutenberg_is_metabox_empty( $metaboxes, $context, $post_type );
		$this->assertTrue( $is_empty );
	}

	/**
	 * Tests for non existant page.
	 */
	public function test_gutenberg_is_metabox_empty_with_non_existant_page() {
		$context = 'normal';
		$post_type = 'test';
		$metaboxes = $this->metaboxes;

		$is_empty = gutenberg_is_metabox_empty( $metaboxes, $context, $post_type );
		$this->assertTrue( $is_empty );
	}

	/**
	 * Test filtering of metabox data.
	 */
	public function test_gutenberg_filter_metaboxes() {
		$metaboxes = $this->metaboxes;
		// Add in a metabox.
		$metaboxes['post']['normal']['high']['somemetabox'] = array( 'metabox-stuff' );

		$expected_metaboxes = $this->metaboxes;
		// We expect to remove only core metaboxes.
		$expected_metaboxes['post']['normal']['core'] = array();
		$expected_metaboxes['post']['side']['core'] = array();
		$expected_metaboxes['post']['normal']['high']['somemetabox'] = array( 'metabox-stuff' );

		$actual = gutenberg_filter_metaboxes( $metaboxes );
		$expected = $expected_metaboxes;

		$this->assertEquals( $expected, $actual );
	}

	/**
	 * Test filtering of metabox data with taxonomy metaboxes.
	 *
	 * By default Gutenberg will provide a much enhanced JavaScript alternative
	 * to the metaboxes using the standard category and tags metabox callbacks.
	 */
	public function test_gutenberg_filter_metaboxes_for_taxonomies() {
		$metaboxes = $this->metaboxes;
		// Add in a metabox.
		$expected_metaboxes['post']['normal']['high']['my-cool-tax'] = array( 'callback' => 'post_tags_meta_box' );
		$expected_metaboxes['post']['normal']['high']['my-cool-hierarchical-tax'] = array( 'callback' => 'post_categories_meta_box' );

		$expected_metaboxes = $this->metaboxes;
		// We expect to remove only core metaboxes.
		$expected_metaboxes['post']['normal']['core'] = array();
		$expected_metaboxes['post']['side']['core'] = array();
		// We expect the high location to be empty even though we have registered metaboxes.
		$expected_metaboxes['post']['normal']['high'] = array();

		$actual = gutenberg_filter_metaboxes( $metaboxes );
		$expected = $expected_metaboxes;

		$this->assertEquals( $expected, $actual );
	}
}
