"use strict";

import React from 'react';
import THREE from 'three';

import * as ArrowDirectionType from './util/arrow-direction-type';

//this exports a reference to a React class as the default export
export default React.createClass( {

  /**
   * In React state is maintained by the component itself.
   * @returns {{}} The initial state
   */
  getInitialState() {
    return {};
  },

  /**
   * This must return a JSX element.
   * @returns {XML}
   */
  render() {
    //this will set the CSS style of the div we're returning.
    //this.props are injected by the entity that instantiated
    //this react class.
    let style = {
      width: this.props.size,
      height: this.props.size
      // lineHeight : this.props.size + 6 + 'px'
    };

    //To set a div's class in React you must use the 'className' attribute, instead of the
    //usual 'class' attribute. This is because 'class' is a reserved keyword in ECMAScript 6.
    return (
      <div className={ 'square ' + this.props.styleClass } style={style}>
        <i className={ arrowClassName(this.props.direction) }></i>
      </div>
    );
  },

  componentDidMount()  {
    this.state.center = getCenter( this );
  },

  componentDidUpdate() {
    this.state.center = getCenter( this );
  }

} );

function getCenter( reactComponent ) {
  let domElement = React.findDOMNode( reactComponent );
  // We subtract the top / left values of the parent from the position
  // to get a value that is local to the square's owner, not to the
  // document as a whole.
  return new THREE.Vector3( domElement.offsetLeft + ( domElement.offsetWidth / 2 ) - domElement.parentNode.offsetLeft,
                            domElement.offsetTop + ( domElement.offsetHeight / 2 ) - domElement.parentNode.offsetTop,
                            0 );
}

function arrowClassName( arrowDirection ) {
  switch( arrowDirection ) {
    case ArrowDirectionType.up:
      return 'icon-up-open';
    case ArrowDirectionType.right:
      return 'icon-right-open';
    case ArrowDirectionType.down:
      return 'icon-down-open';
    case ArrowDirectionType.left:
      return 'icon-left-open';
  }
};