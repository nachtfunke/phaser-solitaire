import { Scene } from "phaser";
import { Card } from "../objects/Card";
import { isValidDestination } from "../utils/isValidDestination";
import Tooltip from "../objects/utils/Tooltip";
import { STYLES } from "../settings/styles";

export class GameScene extends Scene {
    constructor() {
        super({ key: "GameScene" });

        this.cards = []; // keeps track of all the cards in game
        this.cardsBeingDragged = []; // keeps track of all the cards that are currently being dragged
        this.gameLocked = false; // should be set, if a process, like an animation, is currently running, and the game should not be interacted with
        this.debug = true; // if true, some debug information will be displayed on the screen
    }
    
    create() {
        this.centerX = this.cameras.main.width / 2;
        this.centerY = this.cameras.main.height / 2;

        // some pre-defined locations on the screen
        this.locations = {
            top: { x: this.centerX, y: 0 },
            topLeft: { x: 0, y: 0 },
            topRight: { x: this.cameras.main.width, y: 0 },
            bottom: { x: this.centerX, y: this.cameras.main.height },
            bottomLeft: { x: 0, y: this.cameras.main.height },
            bottomRight: { x: this.cameras.main.width, y: this.cameras.main.height },
            right: { x: this.cameras.main.width, y: this.centerY },
            left: { x: 0, y: this.centerY },
            center: { x: this.centerX, y: this.centerY },
        }

        // some temporary card backside colors
        this.backsideColors = {
            red: '#ed5c5c',
            blue: '#4273c2',
            green: '#5ced5c',
            yellow: '#edf55c',
            purple: '#d55ced',
            orange: '#ed9c5c',
            brown: '#edc55c',
            pink: '#ed5c9c',
        }

        // change the background
        this.cameras.main.setBackgroundColor('#d3d3d3');

        // add a container into the middle of the screen, that can hold UI Elements
        // TODO: find out how to dynamically adapt positioning of elements within containers after they have been added
        // will hold references to some containers that can be used to insert UI elements into
        this.containers = {};
        this.containers.center = this.add.container(this.centerX, this.centerY);
        this.containers.bottomLeft = this.add.container(0, this.cameras.main.height);
        
        // add a little button
        const dealButton = this.renderDebugButton('Deal 5', () => {
            if (this.gameLocked) {
                console.warn("Game is locked. Can't deal cards right now.");
                return;
            }

            //this.dealCard();

            this.dealCards(5).then(cards => {
                // create a single tooltip for the last card created
                this.renderCardToolTip(cards[cards.length - 1]);

                cards.forEach(card => {
                    card.setInteractive({
                        draggable: true,
                        useHandCursor: true,
                    });

                    // render a tooltip for each card, that shows its x, y and angle
                    if (this.debug && card.tooltip === undefined ) {
                        //card.enableDebug([], true);
                        //card.tooltip = this.renderCardToolTip(card);
                        //card.tooltip.setAlpha(0);
                    }

                    // hovering
                    // --------------------
                    card.on('pointerover', () => {
                        //this.debug && card.tooltip.setAlpha(1);
                    });

                    card.on('pointerout', () => {
                        //this.debug && card.disableDebug(['henny']);
                    });


                    // dragging
                    // --------------------
                    card.on('dragstart', pointer => { // this is called, when the card is being dragged, but also fires with 'pointerdown'
        
                        // make sure, only one card is being dragged at a time
                        this.cards.forEach(card => card.setDepth(0));
                        card.setDepth(2);

                        // only assume dragging, when the card has been dragged for at least 30px
                        const dragThreshold = card.width;

                        let doDrag = false;

                        // if the card is not below the pointer, snap it to it
                        const pointerThreshold = 15; // allows for a bit of a wiggle room, so that the snapping animation isn't basically always playing
            
                        card.on('drag', pointer => {

                            if (pointer.getDistance() > dragThreshold) {
                                this.gameLocked = true;
                                
                                const pointerOutOfRange = Math.abs(card.x - pointer.x) > pointerThreshold && Math.abs(card.y - pointer.y) > pointerThreshold;

                                // only snap to the pointer, if the card is not already below it, and dragging hasn't already started
                                if (!card.isDragging && pointerOutOfRange) {
                                    card.snapToPointer().then(() => doDrag = true);
                                } else {
                                    doDrag = true;
                                }

                                if (doDrag) {
                                    // drag the card (updates its position)
                                    this.dragCard(card, pointer).then(() => doDrag = false);

                                    // update the shadow
                                    card.updateShadow();
                                }

                            } else {
                                this.gameLocked = false;
                            }
                        })
                    });

                    card.on('dragend', () => {
                        if (card.isDragging) {
                            if (card.z !== 0) {
                                card.drop().then(() => this.gameLocked = false);
                            } else {
                                this.gameLocked = false;
                            }
                        }
                    });


                    // clicking
                    // --------------------
                    const cardClickThreshold = 225;

                    card.on('pointerdown', () => {
                        if (!card.isDragging & !this.gameLocked) {
                            this.gameLocked = true;

                            card.raise().then(() => {
                                card.off('pointerup');

                                card.on('pointerup', pointer => {
                                    // only assume a click, if the card was held for less than 225ms
                                    if (pointer.getDuration() < cardClickThreshold) {
                                        console.log('click detected');
                                        card.flip(() => card.drop().then(() => this.gameLocked = false));
                                    } else {
                                        card.drop().then(() => this.gameLocked = false);
                                    }
                                });
                            });
                        }
                    });
                });
            });
        });

        // TEMPORARY BUTTONS
        // --------------------
        dealButton.setPosition(this.centerX - dealButton.getBounds().width/2, this.centerY - dealButton.getBounds().height/2);
        this.add.existing(dealButton);

        // add a button that will delete all cards
        const deleteButton = this.renderDebugButton('Delete All', () => {
            this.cards.forEach(card => card.destroy());
            this.cards = [];
        });
        deleteButton.setPosition(this.centerX - deleteButton.getBounds().width/2, this.centerY - deleteButton.getBounds().height/2 + dealButton.getBounds().height + 10);
        this.add.existing(deleteButton);

        // DEBUGGING
        // --------------------

        if (this.debug) {
            // display a little debug log window
            this.renderCardsLog();

            // add a little text to the screen, that shows that the game is currently locked.
            this.gameLockedText = this.add.text(0, 0, 'Game is locked.', {
                fontFamily: STYLES.debugging.text.fontFamily,
                fontSize: STYLES.debugging.text.fontSize,
                color: '#000000',
            });
            this.gameLockedText.setPosition(this.cameras.main.width - this.gameLockedText.width - STYLES.spacing.l, STYLES.spacing.l);
            this.gameLockedText.setDepth(1);
            this.gameLockedText.setVisible(false);
        }
    }

    /**
     * CREATING GAME ELEMENTS
     */

    createCard({ x = this.centerX, y = this.centerY, visibleSide = 'front', backsideColor = '#ed5c5c' }) {
        const card = new Card(this, x, y, visibleSide, backsideColor);
        card.id = this.cards.length;
        this.add.existing(card);

        this.cards.push(card);

        return card;
    }

    /**
     * GETTERS
     */

    getLocation(location) {
        if (!this.isValidLocation(location)) {
            console.warn(`Location ${location} does not exist. Using center instead.`);
            return this.locations.center;
        }
        return this.locations[location];
    }

    /**
     * VALITATION & CHECKSA
     */

    isValidLocation(location) {
        return location && this.locations[location] !== undefined;
    }

    /**
     * CARD INTERACTION
     */
    dragCard(card, pointer) {
        card.isDragging = true;
        this.cardsBeingDragged.push(card);

        // get the cursor offset from the center of the card
        const offsetX = pointer.x - card.x;
        const offsetY = pointer.y - card.y;

        // update the position of the card
        card.x = pointer.x;
        card.y = pointer.y;

        // TODO: alow the card to emit an effect, like a shadow or a glowing outline, when it is being dragged
        // TODO: emit an event when a card is being dragged

        return new Promise(resolve => {
            this.input.on('pointerup', () => {
                this.input.removeAllListeners('pointermove');

                card.setDepth(0);
    
                card.isDragging = false;
                this.cardsBeingDragged = this.cardsBeingDragged.filter(c => c !== card);

                resolve();
            });
        });
    }

    /**
     * CARD ANIMATIONS
     */

    dealCard({ from = "bottom", to = "centerish" } = {}, { backsideColor = this.backsideColors.blue, visibleSide = "back" } = {}, returnTweenData = false) {
        const origin = { x: null, y: null };
        const destination = { x: null, y: null };

        // don't deal cards, if the game is locked.
        if (this.gameLocked) {
            console.warn("Game is locked. Can't deal cards right now.");
            return;
        }

        // determine where cards are flying from
        if (from && this.isValidLocation(from)) {
            origin.x = this.getLocation(from).x;
            origin.y = this.getLocation(from).y;
        } else if (isValidDestination(from)) {
            origin.x = from.x;
            origin.y = from.y;
        } else {
            console.warn("Invalid origin for card deal. Using top right corner of screen.")
            origin.x = 0;
            origin.y = 0;
        }

        // create the new card
        const card = this.createCard({x: origin.x, y: origin.y, visibleSide, backsideColor}); // Start position at the bottom center

        // determine where cards are flying to
        if (to === "centerish") {
            destination.x = Phaser.Math.Between(this.centerX - 15, this.centerX + 15);
            destination.y = Phaser.Math.Between(this.centerY - 15, this.centerY + 15);
        } else if (isValidDestination(to)) {
            destination.x = to.x;
            destination.y = to.y;
        } else {
            console.warn("Invalid destination for card deal. Using center of screen.")
            destination.x = this.centerX;
            destination.y = this.centerY;
        }
        
        const tweenData = card.throwTo({ 
            x: destination.x,
            y: destination.y,
            angle: Phaser.Math.Between(-22.5, 22.5),
            duration: 350,
         }, true);

        if (!returnTweenData) {
            const tween = this.tweens.add(tweenData);
            this.gameLocked = true;
            tween.play();
            
            return new Promise(resolve => tween.on('complete', () => {
                this.gameLocked = false;
                resolve(card)
            }));
        }

        return {tweenData, card};
    }

    dealCards(numberOfCards, { from = "bottom", to = "centerish" } = {}, { visibleSide, backsideColor = "random" } = {}, returnTweenData = false) {
        const redOrBlue = () => Math.floor(Phaser.Math.Between(0, 1)) === 0 ? this.backsideColors.red : this.backsideColors.blue;
        const tweens = [];
        const newCards = [];

        if (this.gameLocked) {
            console.warn("Game is locked. Can't deal cards right now.");
            return;
        }

        for (let i = 0; i < numberOfCards; i++) {
            const { tweenData, card } = this.dealCard({ from, to }, { visibleSide, backsideColor: backsideColor === "random" ? redOrBlue() : backsideColor }, true);
            const tween = this.tweens.add({
                ...tweenData,
                delay: i * 125
            });
            newCards.push(card);
            
            tween.pause();
            tweens.push(tween);
        }

        if (!returnTweenData) {
            this.gameLocked = true;
            const tweenPromises = tweens.map(tween => new Promise(resolve => tween.on('complete', () => {
                this.gameLocked = false;
                resolve()
            })));
            tweens.forEach(tween => tween.play());
            
            return Promise.all(tweenPromises).then(() => newCards);
        }

        return tweens;
    }

    /**
     * LOGGING & MISC
     */
    // render a little field that keeps track of the cards that exist on the field currently, and their flip state
    renderDebugButton(text, onClick, x, y) {
        const button = this.add.container(x, y);

        // the text
        const label = this.add.text(0, 0, text, {
            fontFamily: STYLES.buttons.debugging.text.fontFamily,
            fontSize: STYLES.buttons.debugging.text.fontSize,
            color: STYLES.buttons.debugging.text.color,
        });
        label.setPadding(STYLES.buttons.debugging.padding);

        // the background
        const background = this.add.graphics();
        background.fillStyle(STYLES.buttons.debugging.background.color);
        background.fillRoundedRect(0, 0, label.getBounds().width, label.getBounds().height, STYLES.buttons.debugging.background.borderRadius);

        // the shadow
        const shadow = this.add.graphics();
        shadow.fillStyle(0x000000, 0.25);
        shadow.fillRoundedRect(STYLES.buttons.debugging.shadow.size, STYLES.buttons.debugging.shadow.size, label.getBounds().width - (STYLES.buttons.debugging.shadow.size*2), label.getBounds().height, STYLES.buttons.debugging.background.borderRadius);

        button.add([shadow, background, label ]);

        label.setInteractive({
            useHandCursor: true,
        });

        // hovering
        label.on('pointerover', () => {
            button.y = button.y + 2;
            shadow.y = shadow.y - 2;
        });
        label.on('pointerout', () => {
            button.y = button.y - 2;
            shadow.y = shadow.y + 2;
        });


        label.on('pointerup', onClick);
        
        button.setDepth(1);
        
        return button;
    }
    
    // TODO: this has stopped becoming that useful, because there is now a tooltip for each card
    renderCardsLog() {
        // add a container, in which elements will be positioned relative to
        const container = this.add.container(10, 10);

        // add a little label to the top
        const label = this.add.text(0, 0, 'Game Cards log', {
            fontFamily: STYLES.debugging.text.fontFamily,
            fontSize: STYLES.debugging.text.fontSize,
            color: STYLES.debugging.text.color,
        });
        label.setPadding(
            STYLES.debugging.padding,
            STYLES.debugging.padding,
            STYLES.debugging.padding,
            0,
        );

        const spacingBetween = STYLES.debugging.padding;

        // add the actual text
        const text = this.add.text(0, label.height + spacingBetween, null, { 
            color: STYLES.debugging.text.color,
            fontFamily: STYLES.debugging.text.fontFamily,
            fontSize: STYLES.debugging.text.fontSize,
        });
        text.setPadding(
            STYLES.debugging.padding,
            0,
            STYLES.debugging.padding,
            STYLES.debugging.padding,
        );
        text.setDepth(10);

        // add a background
        const backgroundWidth = () => Math.max(label.getBounds().width, text.getBounds().width);
        const backgroundHeight = () => label.getBounds().height + spacingBetween + text.getBounds().height;
        const background = this.add.graphics();
        const renderBackground = (width, height) => {
            background.clear();
            background.fillStyle(STYLES.debugging.background.color, STYLES.debugging.background.alpha);
            background.fillRoundedRect(0, 0, width, height, STYLES.debugging.background.borderRadius);
            background.setDepth(0);
        }
        
        container.add([background, label, text]);

        this.events.on('update', () => {

            const cards = this.cards.map(card => {
                return `[Card ${card.id}]:
 ∙ visible side: ${card.visibleSide}
 ∙ is being dragged: ${card.isDragging}
`
            }).join('\n');
            cards.length ? text.setText(cards) : text.setText('No cards in game yet.');
            renderBackground(backgroundWidth(), backgroundHeight());
        });
    }

    // render a little tooltip for a given card, that shows some of its card data
    renderCardToolTip(card) {
        this.cardTooltip = new Tooltip(this, card, 'empty', {
            padding: 15,
            width: 250,
        });
        this.cardTooltip.setAlpha(0);

        this.add.existing(this.cardTooltip);
    }

    // update the tooltip for a given card
    updateCardToolTip(card) {
        const newText = `id: ${card.id}
x: ${Math.floor(card.x)}
y: ${Math.floor(card.y)}
visible side: ${card.visibleSide}
shadow position: ${Math.floor(card.shadow.x)}, ${Math.floor(card.shadow.y)}
            `;
            
        this.cardTooltip.update(card, newText);

    }

    update() {
        if (this.debug) {
            if (this.gameLocked) {
                this.gameLockedText.setVisible(true);
            } else {
                this.gameLockedText.setVisible(false);
            }

            this.cards.forEach(card => {
                // show a tooltip, when hovering a card
                card.on('pointerover', () => {
                    this.updateCardToolTip(card);
                    this.cardTooltip.setAlpha(1);
                });
                // also needs to update on pointermove, because pointerover does not trigger during 'drag'
                card.on('pointermove', () => {
                    this.updateCardToolTip(card);
                });
                card.on('pointerout', () => {
                    this.cardTooltip.setAlpha(0);
                });
            });
        }
    }
}