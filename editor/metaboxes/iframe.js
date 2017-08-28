/**
 * External dependencies
 */
import { isEqual } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { Panel } from '@wordpress/components';

/**
 * Internal dependencies.
 */
import MetaboxPanel from './panel.js';

// @TODO add error handling.
class MetaboxIframe extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			width: 0,
			height: 0,
			isOpen: false,
		};

		this.originalFormData = [];
		this.hasLoaded = false;
		this.formData = [];
		this.form = null;

		this.isSaving = this.isSaving.bind( this );
		this.checkMessageForResize = this.checkMessageForResize.bind( this );
		this.handleDoubleBuffering = this.handleDoubleBuffering.bind( this );
		this.handleMetaboxReload = this.handleMetaboxReload.bind( this );
		this.checkMetaboxState = this.checkMetaboxState.bind( this );
		this.observeChanges = this.observeChanges.bind( this );
		this.bindNode = this.bindNode.bind( this );
		this.toggle = this.toggle.bind( this );
	}

	toggle() {
		this.setState( {
			isOpen: ! this.state.isOpen,
		} );
	}

	bindNode( node ) {
		this.node = node;
	}

	componentDidMount() {
		/**
		 * Sets up an event listener for resizing. The resizing occurs inside
		 * the iframe, see gutenberg/assets/js/metabox.js
		 */
		window.addEventListener( 'message', this.checkMessageForResize, false );

		// Initially set node to not display anything so that when it loads, we can see it.
		this.node.style.display = 'none';
		this.node.addEventListener( 'load', this.observeChanges );
	}

	componentWillReceiveProps( nextProps ) {
		// Metabox updating.
		if ( nextProps.isUpdating === true ) {
			const iframe = this.node;

			this.clonedNode = iframe.cloneNode( true );
			this.clonedNode.classList.add( 'iframe--updating' );
			this.hideNode( this.clonedNode );
			const parent = iframe.parentNode;

			parent.appendChild( this.clonedNode );

			/**
			 * When the dom content has loaded for the cloned iframe handle the
			 * double buffering.
			 */
			this.clonedNode.addEventListener( 'load', this.handleDoubleBuffering );
		}
	}

	handleDoubleBuffering() {
		const { node, clonedNode } = this;

		// The standard post.php form ID post should probably be mimicked.
		const form = node.contentWindow.document.getElementById( 'post' );

		form.submit();

		const cloneForm = clonedNode.contentWindow.document.getElementById( 'post' );

		cloneForm.parentNode.replaceChild( form, cloneForm );

		this.showNode( clonedNode );
		this.hideNode( node );

		node.addEventListener( 'load', this.handleMetaboxReload );
	}

	hideNode( node ) {
		node.classList.add( 'iframe--hidden' );
	}

	showNode( node ) {
		node.classList.remove( 'iframe--hidden' );
	}

	componentWillUnmount() {
		const iframe = this.node;
		iframe.removeEventListener( 'message', this.checkMessageForResize );

		if ( this.dirtyObserver ) {
			this.dirtyObserver.disconnect();
		}

		if ( this.form !== null ) {
			this.form.removeEventListener( 'input', this.checkMetaboxState );
			this.form.removeEventListener( 'change', this.checkMetaboxState );
		}

		this.node.removeEventListener( 'load', this.observeChanges );
	}

	observeChanges() {
		const node = this.node;

		// If the iframe has not already loaded before.
		if ( this.hasLoaded === false ) {
			node.style.display = 'block';
			this.originalFormData = this.getFormData( node );
			this.hasLoaded = true;
		}

		this.form = node.contentWindow.document.getElementById( 'post' );

		// Add event listeners to handle dirty checking.
		this.dirtyObserver = new window.MutationObserver( this.checkMetaboxState );
		this.dirtyObserver.observe( this.form, {
			attributes: true,
			attributeOldValue: true,
			characterData: true,
			characterDataOldValue: true,
			childList: true,
			subtree: true,
		} );
		this.form.addEventListener( 'change', this.checkMetaboxState );
		this.form.addEventListener( 'input', this.checkMetaboxState );
	}

	getFormData( node ) {
		const form = node.contentWindow.document.getElementById( 'post' );

		const data = new window.FormData( form );
		const entries = Array.from( data.entries() );
		return entries;
	}

	checkMetaboxState() {
		const { isUpdating, isDirty, changedMetaboxState, location } = this.props;

		const isStateEqual = isEqual( this.originalFormData, this.getFormData( this.node ) );

		/**
		 * If we are not updating, then if dirty and equal to original, then set not dirty.
		 * If we are not updating, then if not dirty and not equal to original, set as dirty.
		 */
		if ( ! isUpdating && ( isDirty === isStateEqual ) ) {
			changedMetaboxState( location, ! isDirty );
		}
	}

	handleMetaboxReload( event ) {
		// Remove the reloading event listener once the metabox has loaded.
		event.target.removeEventListener( 'load', this.handleMetaboxReload );

		if ( this.clonedNode ) {
			this.showNode( this.node );
			this.hideNode( this.clonedNode );
			this.clonedNode.removeEventListener( 'load', this.handleDoubleBuffering );
			this.clonedNode.parentNode.removeChild( this.clonedNode );
			delete this.clonedNode;
		}

		this.originalFormData = this.getFormData( this.node );
		this.props.metaboxReloaded( this.props.location );
	}

	checkMessageForResize( event ) {
		const iframe = this.node;

		// Attempt to parse the message data as JSON if passed as string
		let data = event.data || {};
		if ( 'string' === typeof data ) {
			try {
				data = JSON.parse( data );
			} catch ( e ) {} // eslint-disable-line no-empty
		}

		if ( data.source !== 'metabox' || data.location !== this.props.location ) {
			return;
		}

		// Verify that the mounted element is the source of the message
		if ( ! iframe || iframe.contentWindow !== event.source ) {
			return;
		}

		// Update the state only if the message is formatted as we expect, i.e.
		// as an object with a 'resize' action, width, and height
		const { action, width, height } = data;
		const { width: oldWidth, height: oldHeight } = this.state;

		if ( 'resize' === action && ( oldWidth !== width || oldHeight !== height ) ) {
			this.setState( { width, height } );
		}
	}

	isSaving() {
		const { isUpdating, isDirty, isPostSaving } = this.props;
		return isUpdating || ( isDirty && isPostSaving );
	}

	render() {
		const { location, className, id } = this.props;
		const { isOpen } = this.state;
		const isSaving = this.isSaving();

		const classes = classnames(
			className,
			{ closed: ! isOpen }
		);

		const overlayClasses = classnames(
			'loading-overlay',
			{ visible: isSaving }
		);

		const iframeClasses = classnames( { 'iframe--updating': isSaving } );

		return (
			<Panel className="editor-meta-boxes">
				<MetaboxPanel
					title={ __( 'Extended Settings', 'gutenberg' ) }
					opened={ isOpen }
					onToggle={ this.toggle }>
					<div id="iframe-container" className={ classes }>
						<div className={ overlayClasses }>
							<p className="loading-overlay__text">{ __( 'Updating Settings', 'gutenberg' ) }</p>
						</div>
						<iframe
							className={ iframeClasses }
							ref={ this.bindNode }
							title={ __( 'Extended Settings', 'gutenberg' ) }
							key="metabox"
							id={ id }
							src={ `${ window._wpMetaboxUrl }&metabox=${ location }` }
							width={ Math.ceil( this.state.width ) }
							height={ Math.ceil( this.state.height ) } />
					</div>
				</MetaboxPanel>
			</Panel>
		);
	}
}

export default MetaboxIframe;
