import Phaser, { CANVAS } from "phaser"
import { GameScene } from "./scenes/GameScene";
import { BootScene } from "./scenes/BootScene";

import './style.css';

//const canvas = document.getElementById("game") as HTMLCanvasElement;

const phaserConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  scene: [ BootScene, GameScene ],
}

new Phaser.Game(phaserConfig)