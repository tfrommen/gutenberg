/**
 * External dependencies
 */
// when this CSS was imported dynamically
// it was causing major visual glitches to
// the editor which completely broke it
require( 'codemirror/lib/codemirror.css' );

/**
 * Internal dependencies
 */
import { __ } from 'i18n';
import InspectorControls from '../../inspector-controls';
import { registerBlockType, source } from '../../api';
const { prop } = source;

let initialized = false;
let CodeMirror; // loaded on-demand below

// there are more
// @see node_modules/codemirror/modes
const languages = {
	apl: { label: 'APL', slug: 'apl/apl' },
	clike: { label: 'C/C++/C#/Java', slug: 'clike/clike' },
	clojure: { label: 'Clojure', slug: 'clojure/clojure' },
	commonlisp: { label: 'Common Lisp', slug: 'commonlisp/commonlisp' },
	css: { label: 'CSS', slug: 'css/css' },
	diff: { label: 'diff', slug: 'diff/diff' },
	ebnf: { label: 'EBNF', slug: 'ebnf/ebnf' },
	elm: { label: 'Elm', slug: 'elm/elm' },
	erlang: { label: 'Erlang', slug: 'erlang/erlang' },
	gfm: { label: 'Markdown', slug: 'gfm/gfm' },
	go: { label: 'go', slug: 'go/go' },
	haskell: { label: 'Haskell', slug: 'haskell/haskell' },
	html: { label: 'HTML', slug: 'htmlmixed/htmlmixed' },
	http: { label: 'HTTP', slug: 'http/http' },
	javascript: { label: 'Javascript', slug: 'javascript/javascript' },
	pegjs: { label: 'PEGjs', slug: 'pegjs/pegjs' },
	php: { label: 'PHP', slug: 'php/php' },
	python: { label: 'Python', slug: 'python/python' },
	ruby: { label: 'Ruby', slug: 'ruby/ruby' },
	rust: { label: 'Rust', slug: 'rust/rust' },
	sass: { label: 'SASS', slug: 'sass/sass' },
	shell: { label: 'Shell', slug: 'shell/shell' },
	sql: { label: 'SQL', slug: 'sql/sql' },
	swift: { label: 'Swift', slug: 'swift/swift' },
	vue: { label: 'Vue', slug: 'vue/vue' },
	xml: { label: 'XML', slug: 'xml/xml' },
	yaml: { label: 'YAML', slug: 'yaml/yaml' },
};

// just a sorted list for the UI
const languageList = Object.keys( languages ).sort( ( a, b ) => languages[ a ].label.localeCompare( languages[ b ].label ) );

registerBlockType( 'core/code-mirror', {
	title: wp.i18n.__( 'Code Editor' ),
	icon: 'text',
	category: 'formatting',

	attributes: {
		content: { type: 'string', source: prop( 'code', 'textContent' ) },
		language: { type: 'string' },
	},

	edit( { attributes, focus, setAttributes, setFocus } ) {
		if ( ! initialized ) {
			require.ensure( [], require => {
				CodeMirror = require( 'react-codemirror' );
				initialized = true;
				setFocus();
			} );

			return <div style={ { fontFamily: 'monospace', whiteSpace: 'pre' } }>{ attributes.content }</div>;
		}

		const language = attributes.language || 'javascript';
		const { slug, hasLoaded } = languages[ language ];

		if ( ! hasLoaded ) {
			// right now there's an issue with webpack where
			// this import actually loads _all_ of the modes
			// instead of the single one. at least that's
			// what my devtools are telling me. according to
			// the internet this is probably the result of a
			// default RegExp for `require.context` loading
			// the entire directory into one chunk. we need
			// to try and split this into smaller chunks.
			require.ensure( [], require => {
				require( `codemirror/mode/${ slug }` );
				languages[ language ].hasLoaded = true;
				setFocus();
			} );
		}

		// we have to force a refresh of the editor, so
		// don't actually load the language setting until
		// the mode file has loaded
		const mode = languages[ language ].hasLoaded
			? language
			: undefined;

		return (
			<div>
				<CodeMirror
					value={ attributes.content }
					onChange={ value => setAttributes( { content: value } ) }
					options={ {
						lineNumbers: true,
						mode,
					} }
				/>
				{ focus && (
					<InspectorControls>
						<label className="blocks-text-control__label" htmlFor="blocks-codemirror-language-select">{ __( 'Language' ) }</label>
						<select // eslint-disable-line jsx-a11y/no-onchange
							id="blocks-codemirror-language-select"
							onChange={ ( { target: { value } } ) => setAttributes( { language: value } ) }
							value={ attributes.language }
						>
							{ languageList.map( key => (
								<option key={ key } value={ key }>
									{ languages[ key ].label }
								</option>
							) ) }
						</select>
					</InspectorControls>
				) }
			</div>
		);
	},

	save( { attributes } ) {
		return <pre><code>{ attributes.content }</code></pre>;
	},
} );
