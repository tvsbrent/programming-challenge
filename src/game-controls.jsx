import React from 'react';
//this syntax is called object destructing.
import {Button, ButtonGroup, ButtonToolbar, DropdownButton, Glyphicon, MenuItem, Well} from 'react-bootstrap'

import SoundManager from './audio/sound-manager';
import * as AudioData from './audio/audio-data';

export default React.createClass( {
  getInitialState() {
    return {
      playControlsDisabled: true,
      isPlaying: false
    };
  },

  render() {
    return <div id="buttonWrapper">
    <Well>
    <ButtonToolbar>
      <ButtonGroup>
        <DropdownButton bsStyle="primary" title="New Board" id='newBoard' onClick={this.onOpenBoardSize} onSelect={this.onSelectBoardSize} onToggle={this.onToggle}>
          <MenuItem eventKey="3">3 x 3</MenuItem>
          <MenuItem eventKey="4">4 x 4</MenuItem>
          <MenuItem eventKey="5">5 x 5</MenuItem>
          <MenuItem eventKey="6">6 x 6</MenuItem>
          <MenuItem eventKey="7">7 x 7</MenuItem>
          <MenuItem eventKey="8">8 x 8</MenuItem>
          <MenuItem eventKey="9">9 x 9</MenuItem>
        </DropdownButton>
        <Button bsStyle="primary" onClick={this.onNewLayout}>New Layout</Button>
        <Button bsStyle="primary" onClick={this.onNewSimulation}>New Simulation</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button bsStyle="primary" onClick={this.onFastBackward} disabled={this.state.playControlsDisabled}><Glyphicon glyph='fast-backward' /></Button>
        <Button bsStyle="primary" onClick={this.onPlay} disabled={this.state.playControlsDisabled || this.state.isPlaying}><Glyphicon glyph='play' /></Button>
        <Button bsStyle="primary" onClick={this.onStop} disabled={this.state.playControlsDisabled}><Glyphicon glyph='stop' /></Button>
        <Button bsStyle="primary" onClick={this.onFastForward} disabled={this.state.playControlsDisabled}><Glyphicon glyph='fast-forward' /></Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button onClick={this.onDebug}>Debug</Button>
      </ButtonGroup>
    </ButtonToolbar>
    </Well>
  </div>
  },
  onNewSimulation() {
    SoundManager.playSoundWithIdAndTime( 'guiTick02', 0, 0.25 );
    this.setState( { playControlsDisabled: false } );
    this.props.control.newSimulation();
  },
  onNewLayout() {
    SoundManager.playSoundWithIdAndTime( 'guiTick02', 0, 0.25 );
    this.setState( { playControlsDisabled: true } );
    this.props.control.newLayout();
  },
  onOpenBoardSize() {
    SoundManager.playSoundWithIdAndTime( 'guiTick01', 0, 0.25 );
  },
  onSelectBoardSize( eventKey ) {
    SoundManager.playSoundWithIdAndTime( 'guiTick02', 0, 0.25 );
    this.setState( { playControlsDisabled: true } );
    this.playButtonTickSound();
    this.props.control.setSize( eventKey );
  },
  onFastBackward() {
    this.playButtonTickSound();
    this.props.control.fastBackward();
  },
  onPlay() {
    this.playButtonTickSound();
    this.props.control.play();
  },
  onStop() {
    this.playButtonTickSound();
    this.props.control.stop();
  },
  onFastForward() {
    this.playButtonTickSound();
    this.props.control.fastForward();
  },
  onDebug() {
    this.playButtonTickSound();
    this.props.control.debug();
  },
  playButtonTickSound() {
    SoundManager.playSoundWithIdAndTime( 'guiTick03', 0, 0.75 );
  }
});