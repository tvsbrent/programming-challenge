"use strict";

//all import statements must go at the top of the file.
import React from 'react';
import THREE from 'three';

import Board from './game-board';
import Controls from './game-controls';
import GameOverlay from './game-overlay';
import CheckerPath from './util/checker-path';
import Rectangle from './util/rectangle';

//get the content DOMElemet create in index.html
let content = document.getElementById( 'content' );
let gameOverlay = null;

//This is a React class. It's main methods are 'getInitialState', and 'render'.
let Main = React.createClass( {

  getInitialState() {
    return {
      size: this.props.size,
      squareSize: this.props.squareSize
    };
  },

  render() {
    return <div>
            <Controls control={this} squareSize={this.state.squareSize}/>
            <Board ref="board" size={this.state.size} squareSize={this.state.squareSize} />
          </div>;
  },

  new() {
    newSimulation( this );
  },

  setSize( boardSize ) {
    gameOverlay.resetSimulation();
    //we update our internal state.
    this.state.size = +boardSize; // Coerce to a number!
    //setting our state forces a rerender, which in turn will call the render() method
    //of this class. This is how everything gets redrawn and how you 'react' to user input
    //to change the state of the DOM.
    this.setState( this.state );
  },

  fastBackward() {
    console.log( "Fast Backward" );
  },

  stepBackward() {
    console.log( "Step Backward" );
  },

  play() {
    console.log( "Play" );
  },

  stop() {
    console.log( "Stop" );
  },

  stepForward() {
    gameOverlay.advanceSimulation();
  },

  fastForward() {
    console.log( "Fast Forward" );
  },

  debug() {
    gameOverlay.toggleDebug();
  },

  componentDidMount() {
    gameOverlay = new GameOverlay( this.refs.board.getBoardBackgroundRect(),
                                   this.refs.board.getBoardPlaySpaceRect(),
                                   this.state.squareSize );
  },

  componentDidUpdate() {
    gameOverlay.update( this.refs.board.getBoardBackgroundRect(),
                        this.refs.board.getBoardPlaySpaceRect() );
    newSimulation( this );
  }
} );

function newSimulation( mainComponent ) {
  gameOverlay.resetSimulation();

  let randomKey = Math.floor( Math.random() * ( mainComponent.state.size * mainComponent.state.size ) ) + 1;
  gameOverlay.initSimulation( mainComponent.refs.board.getCheckerPath( randomKey ) );
}

function stopVisualization() {

}

//this is the entry point into react. From here on out we deal almost exclusively with the
//virtual DOM. Here we tell React to attach everything to the content DOM element.
React.render( <Main squareSize={80} size={5}/>, content, () => {
  console.log("Rendered!");
} );