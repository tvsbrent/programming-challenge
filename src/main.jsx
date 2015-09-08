//all import statements must go at the top of the file.
import events from 'events';
import React from 'react';
import THREE from 'three';

import Controls from './game-controls';
import GameWorld from './game-world';
import CheckerPath from './util/checker-path';
import SoundManager from './audio/sound-manager';
import * as AudioData from './audio/audio-data';

let gameWorld = new GameWorld( 40 /* square size */ );

//***************************************************
// MAIN REACT CLASS
//***************************************************
let Main = React.createClass( {
  getInitialState() {
    return {
      size: this.props.size
    };
  },
  render() {
    return <div>
            <Controls ref='controls' control={this} />
          </div>;
  },
  new() {
    gameWorld.startNewSimulation();
  },
  setSize( boardSize ) {
    //we update our internal state.
    this.state.size = +boardSize; // Coerce to a number!
    //setting our state forces a rerender, which in turn will call the render() method
    //of this class. This is how everything gets redrawn and how you 'react' to user input
    //to change the state of the DOM.
    this.setState( this.state );

    gameWorld.createNewBoard( this.state.size );
  },
  fastBackward() {
    gameWorld.jumpSimulation( false /* jump to beginning */ );
  },
  stepBackward() {
    gameWorld.stepSimulation( true /* is backward */);
  },
  play() {
    this.refs.controls.setState( { isPlaying : true } );
    let func = ( function() {
      this.refs.controls.setState( { isPlaying : false } );
      gameWorld.emitter.removeListener( 'playSimulationComplete', func );
    } ).bind( this );
    gameWorld.emitter.on( 'playSimulationComplete', func );
    gameWorld.playSimulation();
  },
  stop() {
    gameWorld.stopSimulation();
  },
  stepForward() {
    gameWorld.stepSimulation( false /* is not backward */);
  },
  fastForward() {
    gameWorld.jumpSimulation( true /* jump to end */ );
  },
  debug() {
    this.refs.controls.setState( { isPlaying : true } );
    gameWorld.toggleDebug();
  },
  componentDidMount() {
    gameWorld.createNewBoard( this.state.size );
  },
  componentDidUpdate() {

  }
} );


//***************************************************
// AUDIO
//***************************************************
var audioContext = new window.AudioContext();
if( !audioContext.createGain ) {
  audioContext.createGain = audioContext.createGainNode;
}
if (!audioContext.createDelay) {
  audioContext.createDelay = audioContext.createDelayNode;
}
if( !audioContext.createScriptProcessor ) {
  audioContext.createScriptProcessor = audioContext.createJavaScriptNode;
}

SoundManager.init( audioContext );
SoundManager.loadSounds( AudioData.assets, onAudioReady );

function onAudioReady() {
  console.log( "onAudioReady: buffers: " + SoundManager.buffers );
}

//***************************************************
// MAIN PROGRAM
//***************************************************
let content = document.getElementById( 'content' );
React.render( <Main size={5}/>, content, () => {
} );