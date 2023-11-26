import Phaser from "phaser";
import { SETTINGS } from "../settings";

// create a Card that can be used in a game
export class Card extends Phaser.GameObjects.Container {
    constructor(scene, x, y, initiallyVisibleSide = 'front', backsideColor, lighting) {
        super(scene, x, y);
        this.scene = scene;
        this.setPosition(x, y);

        // some physics settings
        this.lighting = lighting || { x: this.scene.cameras.main.width/2, y: 0 }
        this.raiseHeight = 5;
        this.shadowSize = 5;
        
        // some visual settings
        this.width = 70;
        this.height = this.width / SETTINGS.cards.aspectRatio;
        this.corners = 3;
        this.visibleSide = initiallyVisibleSide;
        this.border = this.width * 0.035;
        this.backsideColor = new Phaser.Display.Color.HexStringToColor(backsideColor ?? '#bada55');

        // misc
        this.debug = false;

        // render the card faces and decide which one to show intiially
        this.render();
        this.showCardSide(this.visibleSide);

        if (this.debug) {
            this.renderDebuggers();

            this.scene.input.on('update', this.updateDebuggers, this);
        }
    }
    
    destroy() {
        this.front.destroy();
        super.destroy(true);
    }

    setHeight(height) {
        this.height = height;
        this.width = this.height * SETTINGS.cards.aspectRatio;

        this.render();
    }

    /**
     * DEBUGGING & INTERNAL CRAP
    */

    renderTooltip() {

    }

    renderDebuggers() {
    }


    /**
     * DRAWING, RENDERING
     */
    render() {
        this.front = this.drawFront();
        this.back = this.drawBack();
        this.shadow = this.drawShadow();

        this.add([this.shadow, this.front, this.back]);
    }

    drawCardSide({ color, borderColor }) {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(color);
        graphics.fillRoundedRect(-this.width/2, -this.height/2, this.width, this.height, this.corners);
        graphics.lineStyle(this.border, borderColor);
        graphics.strokeRoundedRect(-this.width/2, -this.height/2, this.width, this.height, this.corners);


        return graphics;
    }

    drawFront() {
        const graphics = this.drawCardSide({ color: 0xeeeeee, borderColor: 0xffffff });

        graphics.setVisible(false);
        
        return graphics;
    }

    drawBack() {
        const graphics = this.drawCardSide({ color: this.backsideColor.color, borderColor: this.backsideColor.darken(25).color });

        graphics.setVisible(false);

        return graphics;
    }

    drawShadow() {
        const shadow = this.scene.add.graphics();
    
        // Draw a rounded rectangle for the shadow
        shadow.fillStyle(0x000000, 0.5); // Black with 50% transparency
        shadow.fillRoundedRect(
            -this.width / 2,
            -this.height / 2,
            this.width - this.shadowSize,
            this.height - this.shadowSize,
            this.corners
        );
        shadow.setDepth(-1);
    
        // Position and scale the shadow based on the lighting source
        const { x, y, rotation, scale, alpha } = this.calculateShadowPosition();
        shadow.setPosition(x, y);
        shadow.setRotation(rotation);
        shadow.setAlpha(alpha);
        shadow.setScale(scale);
    
        return shadow;
    }

    // TODO: change the shadow calculateion in such a way, that the shadow can be static, and that it pulls somewhat towards the middle, just like in balatro: https://store.steampowered.com/app/2379780/Balatro/
    calculateShadowPosition() {
        // If z is 0, don't render the shadow
        if (this.z === 0) {
            return {
                x: 0,
                y: 0,
                scale: 0,
                alpha: 0,
            };
        }

        // Calculate the vector from the card to the lighting source
        // dynamic lighting
        const toLightingX = this.x - this.lighting.x;
        const toLightingY = this.lighting.y - this.y;
        
        // static lighting
        //const toLightingX = this.width + this.x;
        //const toLightingY = this.height - this.y;
    
        // Calculate the distance between the container's position and the lighting source
        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.lighting.x, this.lighting.y);
    
        // Normalize the vector to get the direction
        const length = Math.sqrt(toLightingX * toLightingX + toLightingY * toLightingY);
        const directionX = toLightingX / length;
        const directionY = toLightingY / length;
    
        // Use a linear relationship to control the rate of shadow movement
        const distanceFactor = 0.00025; // Adjust this value to control the rate
        const scaleFactor = 1 + distanceFactor * distance;
    
        // Introduce a z value for the card's height
        const scaledZ = this.z * scaleFactor;
    
        // Calculate the scaled position based on the direction and distance
        const shadowX = -directionX * scaledZ;
        const shadowY = -directionY * scaledZ;
    
        return {
            x: shadowX,
            y: shadowY,
            rotation: this.rotation,
            scale: scaleFactor,
            //alpha: 0.05 + 0.3 * (1 - distance / 500), // Adjust alpha based on distance
            alpha: 0.25,
        };
    }
    

    updateShadow({ x, y, angle, scale, alpha} = this.calculateShadowPosition()) {

        this.shadow.setPosition(x, y);
        this.shadow.setRotation(angle);
        this.shadow.setScale(scale);
        this.shadow.setAlpha(alpha);
    }

    showCardSide(side) {
        if (side === 'front') {
            this.front.setVisible(true);
            this.back.setVisible(false);
            this.visibleSide = 'front';
        } else {
            this.front.setVisible(false);
            this.back.setVisible(true);
            this.visibleSide = 'back';
        }
    }

    /**
     * ANIMATIONS
     */

    raise(onComplete, returnTweenData = false) {
        const animationDuration = 75;
        const animationDelay = 0;
        const currentY = this.y;

        //this.updateShadow();

        const tweenData = {
            targets: this,
            //scale: 1.1, FIXME: for some unknown reason, as soon as scale is on there, the tween value will not return the correct values for y anymore. Instead, it seems to tween somewhere from 1 to 1.5..
            y: this.y - this.raiseHeight,
            ease: 'Linear',
            duration: animationDuration,
            delay: animationDelay,
            onUpdate: tween => {
                this.z = Math.floor(currentY - tween.getValue());
                this.updateShadow();
            },
            onComplete
        };

        if (returnTweenData) {
            return tweenData;
        }

        return new Promise( resolve => this.scene.tweens.add({...tweenData, onComplete: () => {
            onComplete && onComplete();
            resolve();
        }}));
    }

    snapTo({ x, y, rotation, onComplete, duration = 150, delay = 0 }, returnTweenData = false) {
        const tweenData = {
            targets: this,
            rotation: rotation,
            x,
            y,
            ease: Phaser.Math.Easing.Expo.InOut,
            duration,
            delay,
            onComplete
        };

        if (returnTweenData) {
            return tweenData;
        }

        return new Promise( resolve => this.scene.tweens.add({...tweenData, onComplete: () => {
            onComplete && onComplete();
            resolve();
        }}));
    }

    snapToPointer({ resetRotation = true, duration, delay, onComplete } = {}, returnTweenData = false) {
        const tweenData = this.snapTo(
            { 
                x: this.scene.input.activePointer.x, 
                y: this.scene.input.activePointer.y, 
                rotation: resetRotation ? 0 : this.rotation,
                onComplete,
                duration,
                delay
            }, true);

        if (returnTweenData) {
            return tweenData;
        }

        return new Promise( resolve => this.scene.tweens.add({...tweenData, onComplete: () => {
            onComplete && onComplete();
            resolve();
        }}));
    }

    drop(onComplete, returnTweenData = false) {
        const animationDuration = 100;
        const animationDelay = 0;
        const currentY = this.y;

        const tweenData = {
            targets: this,
            y: this.y + this.raiseHeight,
            //scale: 1,
            ease: 'Power2',
            duration: animationDuration,
            delay: animationDelay,
            onUpdate: tween => {
                const delta = tween.getValue() - currentY;
                this.z = Math.floor(this.raiseHeight - delta);
                this.updateShadow();
            },
            onComplete
        };

        if (returnTweenData) {
            return tweenData;
        }

        return new Promise( resolve => this.scene.tweens.add({...tweenData, onComplete: () => {
            onComplete && onComplete();
            resolve();
        }}));
    }

    flip(onComplete) {
        const animationDuration = 175;

        //console.log('currently visible side', this.visibleSide);
        if (this.visibleSide === 'front') {
            this.visibleSide = 'back';
        } else {
            this.visibleSide = 'front';
        }
        //console.log('flipping to', this.visibleSide);

        this.scene.tweens.add({
            targets: this,
            scaleX: 0,
            ease: 'Linear',
            duration: animationDuration/2,
            onComplete: () => {
                this.showCardSide(this.visibleSide);

                this.scene.tweens.add({
                    targets: this,
                    scaleX: 1,
                    ease: 'Linear',
                    duration: animationDuration/2,
                    onComplete
                });
            }
        });
    }

    throwTo({ x, y, angle, ease, duration, onComplete }, returnTweenData = false) {

        const tweenData = {
            targets: this,
            x,
            y,
            angle: angle ?? 0,
            ease: ease ?? 'Power2',
            duration: duration ?? 350,
            onComplete
        };

        if (returnTweenData) {
            return tweenData;
        }
        
        return this.scene.tweens.add({
            targets: this,
            x,
            y,
            angle: angle ?? 0,
            ease: ease ?? 'Power2',
            duration: duration ?? 350,
            onComplete,
        });
    }

}