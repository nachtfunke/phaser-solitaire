import { Scene } from 'phaser';

export class BootScene extends Scene {
    constructor() {
        super({ key: "BootScene" });
    }

    preload() {
        // load all the assets required for the Preloader
        this.load.image('card', 'images/card.png');
        this.load.image('card-back', 'images/card-back.png');
    }

    create() {
        // start the Preloader scene
        this.scene.start('GameScene');
    }
}