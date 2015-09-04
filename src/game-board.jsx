"use strict";

import React from 'react';
import THREE from 'three';

//notice we use the relative path syntax when loading local files
import Square from './game-board-square';
import CheckerPath from './util/checker-path';
import Rectangle from './util/rectangle';
import * as ArrowDirectionType from './util/arrow-direction-type';

export default React.createClass( {

  getInitialState() {
    return {};
  },

  render() {

    //this example just creates a row of squares. Use CSS styling to
    //get the checkers into a mxm size board

    //create a new array of squares
    let squares = [];
    let key = 0;

    let isEvenSize = this.props.size % 2 === 0;

    for( let y = 0; y < this.props.size; y++ ) {
      for( let x = 0; x < this.props.size; x++ ) {
        let styleClass = null;
        if( isEvenSize && Math.floor( key / this.props.size ) % 2 !== 0 ) {
          // odd row on an even size board.
          styleClass = key++ % 2 == 0 ? 'black' : 'white';
        } else {
          styleClass = key++ % 2 == 0 ? 'white' : 'black';
        }

        styleClass = `sq${key} ${styleClass}`;

        // get the index of the square the arrow points to.
        // null means we are pointing off the board.
        let direction = ArrowDirectionType.getRandom();
        let targetKey = -1;
        switch( direction ) {
          case ArrowDirectionType.up:
            targetKey = y === 0 ? null : targetKey = key - this.props.size;
            break;
          case ArrowDirectionType.right:
            targetKey = x + 1 >= this.props.size ? null : targetKey = key + 1;
            break;
          case ArrowDirectionType.down:
            targetKey = y + 1 >= this.props.size ? null : targetKey = key + this.props.size;
            break;
          case ArrowDirectionType.left:
            targetKey = x === 0 ? null : targetKey = key - 1;
            break;
        }

        squares.push( <Square ref={ 'square' + key } key={key} size={this.props.squareSize} styleClass={styleClass} direction={direction} targetKey={targetKey}/> )
      }
    }
    let size = this.props.squareSize  * this.props.size;
    let style = {
      width: size,
      height: size
    };
    let cornerStyle = {
      width: this.props.squareSize,
      height: this.props.squareSize
    };
    return  <div id="board-background" ref="boardbackground">
              <div id="board-corner-tl" className="board-corner" style={cornerStyle}></div>
              <div id="board-corner-tr" className="board-corner" style={cornerStyle}></div>
              <div id="board-corner-bl" className="board-corner" style={cornerStyle}></div>
              <div id="board-corner-br" className="board-corner" style={cornerStyle}></div>
              <div style={ { padding: this.props.squareSize } } id="board-gutter" ref="boardgutter">
                <div id="board-play-space" ref="playspace" style={style}>
                  {squares}
                </div>
              </div>
            </div>;
  },

  getBoardBackgroundRect() {
    let domElement = React.findDOMNode( this.refs.boardbackground );
    return new Rectangle( domElement.offsetTop, domElement.offsetLeft,
      domElement.offsetWidth, domElement.offsetHeight );
  },

  getBoardPlaySpaceRect() {
    let domElement = React.findDOMNode( this.refs.playspace );
    return new Rectangle( domElement.offsetTop, domElement.offsetLeft,
                          domElement.offsetWidth, domElement.offsetHeight );
  },

  // This builds up a path for the checker to follow and
  // returns a CheckerPath object.
  getCheckerPath( key ) {
    let currentKey = key;
    let path = new CheckerPath();
    while( true ) {
      let currentSquare = this.refs['square' + currentKey];
      if( currentSquare ) {
        if( path.hasPoint( currentSquare.state.center ) ) {
          path.isLoop = true;
          break;
        } else {
          path.addPoint( currentSquare.state.center, currentSquare.props.direction );
          currentKey = currentSquare.props.targetKey;
        }
      } else {
        break;
      }
    }

    if( path.points.current === null ) {
      throw "No current point for path!";
    }
    return path;
  }

} );