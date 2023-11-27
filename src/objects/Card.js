import Phaser from "phaser";
import { SETTINGS } from "../settings";
import Tooltip from "./utils/Tooltip";

// create a Card that can be used in a game
export class Card extends Phaser.GameObjects.Container {
    static #debuggers = ['tooltip']; // these are all the possible debuggers that can be enabled
    #activeDebuggers = {}; // holds all debuggers that are currently active - not a list of reference for which debuggers to use.
    #isBeingDragged = false;
    #isMoving = false
    #isAnimating = false;
    #isFlipping = false;
    #isChangingAltitude = false; // whether or not the card is currently being raised or dropped
    #isElevated = false; // whether or not the card is currently elevated
    #enabledDrag = false;
    preventDragging = false; // set this true, if you want to prevent dragging from happening, e.g. when clicking on the card
    
    constructor(scene, x, y, initiallyVisibleSide = 'front', backsideColor, lighting) {
        super(scene, x, y);
        this.scene = scene;

        // some physics settings
        this.lighting = lighting || { x: this.scene.cameras.main.width/2, y: 0 }
        this.raiseHeight = 5;
        this.shadowSize = 5;
        
        // some visual settings
        this.width = 70;
        this.height = this.width / SETTINGS.cards.aspectRatio;
        this.corners = this.width * 0.04; // ~ 3px
        this.visibleSide = initiallyVisibleSide;
        this.border = this.width * 0.035;
        this.backsideColor = new Phaser.Display.Color.HexStringToColor(backsideColor ?? '#bada55');

        // misc
        this.debug = false;

        // render the card faces and decide which one to show intiially
        this.render();
        this.showCardSide(this.visibleSide);

        if (this.debug) {
            this.#renderDebuggers();

            //this.scene.input.on('update', this.updateDebuggers, this);
        }
    }
    /**
     * GETTERS
     */

    getIsBeingDragged() {
        return this.#isBeingDragged;
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
    enableDebug(debuggers = [], listenToSceneUpdates = false) {
        this.debug = true;

        debuggers.some(debuggerName => !Card.#isDebugger(debuggerName)) && console.warn(
            `Card: one or more of the debuggers you specified are not valid. Valid debuggers are: ${Card.#debuggers.join(', ')}.\nYou can also leave the array empty to enable all debuggers.`);

        // only enable the specified debuggers, if they are valid
        const validDebuggers = debuggers.filter(debuggerName => Card.#isDebugger(debuggerName));
        validDebuggers && this.#renderDebuggers(validDebuggers);

        if (listenToSceneUpdates) {
            this.scene.events.on('update', this.updateDebuggers, this);
        }
    }

    disableDebug(debuggers = []) {
        this.debug = false;
        
        if (debuggers.length) {

            debuggers.some(debuggerName => !Card.#isDebugger(debuggerName)) && console.warn(`Card: one or more of the debuggers you specified are not valid. Valid debuggers are: ${Card.#debuggers.join(', ')}\nYou can also leave the array empty to disable all debuggers.`);

            const validDebuggers = debuggers.filter(debuggerName => Card.#isDebugger(debuggerName));
            validDebuggers.forEach(debuggerName => this.#activeDebuggers[debuggerName].destroy());
        } else {
            Object.keys(this.#activeDebuggers).forEach(debuggerName => this.#activeDebuggers[debuggerName].destroy());
        }

        this.scene.events.off('update', this.updateDebuggers, this);
    }

    static #isDebugger(debuggerName) {
        return this.#debuggers.includes(debuggerName);
    }

    getTooltipText() {
        return [
            `id: ${this.id}`,
            `x: ${Math.round(this.x)}`,
            `y: ${Math.round(this.y)}`,
            `z: ${Math.round(this.z)}`,
            `rotation: ${Math.round(this.rotation)}`,
            `visible side: ${this.visibleSide}`,
            `is being dragged: ${this.#isBeingDragged}`,
            `is moving: ${this.#isMoving}`,
            `is animating: ${this.#isAnimating}`,
            `is flipping: ${this.#isFlipping}`,
            `is changing altitude: ${this.#isChangingAltitude}`,
            `is elevated: ${this.#isElevated}`,
            `enabled drag: ${this.#enabledDrag}`,
            `prevent dragging: ${this.preventDragging}`,
        ].join('\n');
    }

    #renderTooltip() {
        this.#activeDebuggers['tooltip'] = new Tooltip(this.scene, this, this.getTooltipText());

        this.add(this.#activeDebuggers['tooltip']);

    }

    #updateTooltip() {
        this.#activeDebuggers['tooltip'].update(this, this.getTooltipText());
    }

    #renderDebuggers(debuggers = []) {
        // only render & handle the specified debuggers
        if (debuggers.length) {
            debuggers.forEach(debuggerName => {
                switch (debuggerName) {
                    case 'tooltip':
                        this.#renderTooltip();
                        break;
                }
            });
        // if nothing else was specified, render them all
        } else {
            this.#renderTooltip();
        }
    }

    // update all the currently active debuggers
    updateDebuggers() {
        // only update the specified debuggers
        if (this.#activeDebuggers.length) {
            debuggers.forEach(debuggerName => {
                switch (debuggerName) {
                    case 'tooltip':
                        this.#updateTooltip();
                        break;
                }
            });
        // if nothing else was specified, update them all
        } else {
            this.#updateTooltip();
        }
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

        const onCompleteCallback = () => {
            this.#isChangingAltitude = false;
            this.#isElevated = true;
            this.#isAnimating = false;
            
            onComplete && onComplete();
        }

        const tweenData = {
            targets: this,
            //scale: 1.1, FIXME: for some unknown reason, as soon as scale is on there, the tween value will not return the correct values for y anymore. Instead, it seems to tween somewhere from 1 to 1.5..
            y: this.y - this.raiseHeight,
            ease: 'Linear',
            duration: animationDuration,
            delay: animationDelay,
            onStart: () => {
                this.#isChangingAltitude = true;
                this.#isAnimating = true;
            
            },
            onUpdate: tween => {
                this.z = Math.floor(currentY - tween.getValue());
                this.updateShadow();
            },
            onComplete: () => onCompleteCallback()
        };

        if (returnTweenData) {
            return tweenData;
        }

        return new Promise( resolve => {
            this.scene.tweens.add({...tweenData, onComplete: () => {
                onCompleteCallback();
                resolve();
            }})
        });
    }

    drop(onComplete, returnTweenData = false) {
        const animationDuration = 100;
        const animationDelay = 0;
        const currentY = this.y - this.raiseHeight; // TODO: figure out, why this was necessary. Debugging showed, that the actual drop was always 10px, so this is a quick fix for now. this.y never contained the new y value, after the raise. Even the card was held for long and definitely had finished the raise animation, this.y would still return the old value. This is probably due to the fact, that the tween is still running, but the value is already updated. So, this is a quick fix for now, but it should be fixed properly.

        const onCompleteCallback = () => {
            this.#isChangingAltitude = false;
            this.#isElevated = false;
            this.#isAnimating = false;
            
            onComplete && onComplete();
        }

        const tweenData = {
            targets: this,
            y: currentY + this.raiseHeight,
            //scale: 1,
            ease: 'Power2',
            duration: animationDuration,
            delay: animationDelay,
            onStart: () => {
                this.#isChangingAltitude = true;
                this.#isAnimating = true;
            },
            onUpdate: tween => {
                const delta = tween.getValue() - currentY;
                this.z = Math.floor(this.raiseHeight - delta);
                this.updateShadow();
            },
            onComplete: () => onCompleteCallback()
        };

        if (returnTweenData) {
            return tweenData;
        }

        return new Promise( resolve => {
            this.scene.tweens.add({...tweenData, onComplete: () => {
                onCompleteCallback();
                resolve();
            }})
        });
    }

    snapTo({ x, y, rotation, onComplete, duration = 125, delay = 0 }, returnTweenData = false) {
        const onCompleteCallback = () => {
            this.#isMoving = false;
            this.#isAnimating = false;
            
            onComplete && onComplete();
        }

        const tweenData = {
            targets: this,
            rotation: rotation,
            x,
            y,
            ease: Phaser.Math.Easing.Expo.InOut,
            duration,
            delay,
            onStart: () => {
                this.#isMoving = true;
                this.#isAnimating = true;
            },
            onComplete: () => onCompleteCallback()
        };

        if (returnTweenData) {
            return tweenData;
        }

        return new Promise( resolve => this.scene.tweens.add({...tweenData, onComplete: () => {
            onCompleteCallback();
            resolve();
        }}));
    }

    snapToPointer({ resetRotation = true, duration, delay, onComplete } = {}, returnTweenData = false) {
        const onCompleteCallback = () => {
            this.#isMoving = false;
            this.#isAnimating = false;
            
            onComplete && onComplete();
        }

        const tweenData = this.snapTo(
            { 
                x: this.scene.input.activePointer.x, 
                y: this.scene.input.activePointer.y, 
                rotation: resetRotation ? 0 : this.rotation,
                duration,
                delay,
                onStart: () => {
                    this.#isMoving = true;
                    this.#isAnimating = true;
                },
                onComplete: () => onCompleteCallback()
            }, true);

        if (returnTweenData) {
            return tweenData;
        }

        return new Promise( resolve => {
            // find out, if there is already a tween going on - which is relevant, because this thing is snapping to the mouse pointer, which is constantly moving.
            // TODO: there may be a better way to do this, but for now, this works.
            const existingTween = this.scene.tweens.getTweensOf(this);
            if (existingTween.length) {
                // if there is, add the new tween to the existing one
                existingTween[0].add(tweenData);
            } else {
                // if there isn't, create a new tween
                this.scene.tweens.add({...tweenData, onComplete: () => {
                    onCompleteCallback();
                    resolve();
                }})
            }
        });
    }

    flip(onComplete) {
        const animationDuration = 175;

        if (this.visibleSide === 'front') {
            this.visibleSide = 'back';
        } else {
            this.visibleSide = 'front';
        }

        this.scene.tweens.add({
            targets: this,
            scaleX: 0,
            ease: 'Linear',
            duration: animationDuration/2,
            onStart: () => {
                this.#isAnimating = true;
                this.#isFlipping = true;
            },
            onComplete: () => {
                this.showCardSide(this.visibleSide);

                this.scene.tweens.add({
                    targets: this,
                    scaleX: 1,
                    ease: 'Linear',
                    duration: animationDuration/2,
                    onComplete: () => {
                        this.#isAnimating = false;
                        this.#isFlipping = false;
                        
                        onComplete && onComplete();
                    }
                });
            }
        });
    }

    throwTo({ x, y, angle = 0, ease, duration = 350, onComplete } = {}, returnTweenData = false) {
        const onCompleteCallback = () => {
            this.#isMoving = false;
            this.#isAnimating = false;
            
            onComplete && onComplete();
        }

        const tweenData = {
            targets: this,
            x,
            y,
            angle: angle,
            ease: 'Power2',
            duration: duration,
            onStart: () => {
                this.#isMoving = true;
                this.#isAnimating = true;
            
            },
            onComplete: () => onCompleteCallback()
        };

        if (returnTweenData) {
            return tweenData;
        }
        
        return new Promise( resolve => {
            this.scene.tweens.add({...tweenData, onComplete: () => {
                onCompleteCallback();
                resolve();
            }})
        });
    }

    /**
     * INTERACTION
     */
    // allow the card to be dragged around
    enableDrag({resetRotation = false} = {}, onDragStart, onDragEnd) {
        this.#enabledDrag = true;

        this.setInteractive({
            draggable: true,
            useHandCursor: true,
            alphaTolerance: 1
        });

        const dragThreshold = this.width;
        const pointerThreshold = 15;
        const pointerTooFarThreshold = this.width * 2;
        const pointerClickThreshold = 125;

        const isPointerOutOfRange = pointer => {
            return Math.abs(this.x - pointer.x) > pointerThreshold && Math.abs(this.y - pointer.y) > pointerThreshold;
        }

        const isPointerTooFarAway = pointer => {
            return Math.abs(this.x - pointer.x) > pointerTooFarThreshold && Math.abs(this.y - pointer.y) > pointerTooFarThreshold;
        }

        // keeps track of whether or not the actual dragging is allowed to happen
        let allowDragging;
        let originCardState;
        let wasSnappedToPointer = false;
        
        this.on('dragstart', pointer => {
            if (this.preventDragging) {
                return false;
            }

            // save the original state of the card, so that it can be reset to it, if the drag is cancelled
            originCardState = {
                x: this.x,
                y: this.y,
                rotation: this.rotation,
            };

            onDragStart && onDragStart(pointer);

            if (!this.#isElevated && !this.#isChangingAltitude) {
                this.raise();
            }
        });

        this.on('drag', pointer => {
            if (this.preventDragging) {
                return false;
            }

            // if there are any animations going on, don't do anything
            if (this.#isAnimating && !this.#isChangingAltitude && !this.#isElevated) {
                return false;
            }

            // only consider this interation a dragging intention, if the pointer has moved far enough away from the card
            if (pointer.getDistance() < dragThreshold) {
                return false;
            }

            // reset drag allowance, we need to check conditions first.
            allowDragging = false;

            // only snap to the pointer, it isn't already within the defined, allowed range and if the card isn't already being dragged right now
            if (!this.#isBeingDragged && isPointerOutOfRange(pointer)) {
                this.snapToPointer({ resetRotation }).then(() => {
                    wasSnappedToPointer = true;
                    allowDragging = true
                });
            } else {
                allowDragging = true;
            }

            // if the drag was enabled, do the thing.™️
            if (allowDragging) {
                this.#isBeingDragged = true;
                
                // reset the rotation if the card wasn't snapped but it is still being dragged
                if (resetRotation && !wasSnappedToPointer && this.rotation !== 0) this.rotation = 0;
                
                this.#handleDragging(pointer);
            }
        });

        this.on('dragend', pointer => {
            if (this.preventDragging) {
                return false;
            }

            // this check for whether this is truly a dragend is necessary, because the dragend event will also fire for a pointerup event...
            if (this.#isBeingDragged && this.#isElevated && !this.#isChangingAltitude) {
                this.#isBeingDragged = false;
                
                // drop the card again
                this.drop().then(() => {
                    allowDragging = false;
                    wasSnappedToPointer = false;

                    onDragEnd && onDragEnd(pointer);
                });
            } else {
                // reset it back to its original position & state
                this.snapTo(originCardState).then(() => {
                    this.#isBeingDragged = false;
                    
                    if (this.#isElevated) {
                        // we're reading elevated here, but this could execute without the raise animation having finished. Dropping it by the fixed amount of raiseHeight will make sure, that the card is dropped to the correct position.
                        this.drop();
                    }
                    
                    allowDragging = false;
                    wasSnappedToPointer = false;
                });

            }
        });
    }

    disableDrag() {
        this.#enabledDrag = false;
        this.disableInteractive();
    }

    onClick(callback) {
        if (this.#enabledDrag) {
            this.on('pointerup', pointer => {

                // determine, if this was a click or a drag
                if (pointer.getDuration() < 125) {
                    this.preventDragging = true;
                    callback(pointer);
                    this.preventDragging = false;
                }
            });
        }
    }

    #handleDragging(pointer) {
        this.x = pointer.x;
        this.y = pointer.y;
    }
}