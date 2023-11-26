import { Scene } from "phaser";
import { Card } from "../objects/Card";
import { isValidDestination } from "../utils/isValidDestination";

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
        
        // add a little button
        const dealButton = this.renderDebugButton('Deal 5', () => {
            if (this.gameLocked) {
                console.warn("Game is locked. Can't deal cards right now.");
                return;
            }

            //this.dealCard();

            this.dealCards(5).then(cards => {
                cards.forEach(card => {
                    card.setInteractive({
                        draggable: true,
                        useHandCursor: true,
                    });

                    // render a tooltip for each card, that shows its x, y and angle
                    if (this.debug && card.tooltip === undefined ) {
                        card.tooltip = this.renderCardToolTip(card);
                        card.tooltip.setAlpha(0);
                    }

                    // hovering
                    // --------------------
                    card.on('pointerover', () => {
                        this.debug && card.tooltip.setAlpha(1);
                    });

                    card.on('pointerout', () => {
                        this.debug && card.tooltip.setAlpha(0);
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
                        const pointerThreshold = 30; // allows for a bit of a wiggle room, so that the snapping animation isn't basically always playing
            
                        card.on('drag', pointer => {
                            if (pointer.getDistance() > dragThreshold) {
                                this.gameLocked = true;

                                // visualize the threshold
                                if (Math.abs(card.x - pointer.x) > pointerThreshold && Math.abs(card.y - pointer.y) > pointerThreshold) {
                                    card.snapToPointer().then(() => doDrag = true);
                                }

                                if (doDrag) {
                                    // drag the card (updates its position)
                                    this.dragCard(card, pointer).then(() => doDrag = false);
                                }
                                
                                // update the position of the tooltip
                                this.debug && this.updateToolTipPosition(card, card.tooltip);

                                // update the shadow
                                card.updateShadow();

                            } else {
                                this.gameLocked = false;
                            }
                        })
                    });

                    card.on('dragend', () => {
                        if (card.isDragging) {
                            console.log('dragend detected');
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
        dealButton.setPosition(this.centerX - dealButton.getBounds().width/2, this.centerY - dealButton.getBounds().height/2);
        this.add.existing(dealButton);

        // add a button that will delete all cards
        const deleteButton = this.renderDebugButton('Delete All', () => {
            this.cards.forEach(card => card.destroy());
            // FIXME: this is not updating the log, but it's fine for now
            this.cards = [];
        });
        deleteButton.setPosition(this.centerX - deleteButton.getBounds().width/2, this.centerY - deleteButton.getBounds().height/2 + dealButton.getBounds().height + 10);

        // change the background
        this.cameras.main.setBackgroundColor('#d3d3d3');

        // display a little debug log window
        this.debug && this.renderCardsLog();

        // add a little text to the screen, that shows that the game is currently locked.
        this.gameLockedText = this.add.text(0, 0, 'Game is locked.', { fill: '#000' });
        this.gameLockedText.setPosition(this.cameras.main.width - this.gameLockedText.width - 20, 0 + 20);
        this.gameLockedText.setDepth(1);
        this.gameLockedText.setVisible(false);
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

        const label = this.add.text(0, 0, text, { fill: '#fff' });
        label.setFontSize(14);


        const background = this.add.graphics();
        background.fillStyle(0x000000);
        background.fillRoundedRect(0, 0, label.getBounds().width + 15, label.getBounds().height + 15, 5);
        label.setPadding(7.5);
        button.add(background);
        button.add(label);

        label.setInteractive({
            useHandCursor: true,
        });
        label.on('pointerup', onClick);
        
        button.setDepth(1);
        
        return button;
    }
    
    renderCardsLog() {
        // add a container, in which elements will be positioned relative to
        const container = this.add.container(10, 10);
        
        // add a background
        const background = this.add.graphics();
        const renderBackground = (width, height) => {
            background.clear();
            background.fillStyle(0x000000);
            background.fillRoundedRect(0, 0, width, height, 2);
            background.setAlpha(0.25);
            background.setDepth(0);
        }
        renderBackground(0, 0);
        container.add(background);

        // add the actual text
        const text = this.add.text(10, 0, '', { fill: '#000' });
        text.setFontSize(12);
        text.setDepth(1);
        container.add(text);

        this.events.on('update', () => {

            const cards = this.cards.map(card => {
                return `
Card ${card.id}
  visible side: ${card.visibleSide}
  is being dragged: ${card.isDragging}
`
            }).join('\n');
            text.setText(cards);
            renderBackground(cards ? text.width + 20 : 0, cards ? text.height : 0);
        });
    }

    // render a little tooltip for each card, that shows some of its card data
    renderCardToolTip(card) {
        const container = this.add.container(card.x + card.width / 2 + 20, card.y - card.height / 2);
        container.setDepth(1);

        const background = this.add.graphics();
        const renderBackground = (width, height) => {
            background.clear();
            background.fillStyle(0x000000);
            background.fillRoundedRect(0, 0, width, height, 2);
            background.setAlpha(0.25);
            background.setDepth(0);
        }
        renderBackground(0, 0);
        container.add(background);

        const text = this.add.text(10, 0, '', { fill: '#000' });
        text.setFontSize(12);
        text.setDepth(1);
        container.add(text);

        this.events.on('update', () => {
            text.setText(`
id: ${card.id}
x: ${card.x}
y: ${card.y}
visible side: ${card.visibleSide}
shadow position: ${Math.floor(card.shadow.x)}, ${Math.floor(card.shadow.y)}
            `);
            renderBackground(text.width + 20, text.height);
        });

        return container;
    }

    updateToolTipPosition(card, toolTip) {
        toolTip.x = card.x + card.width / 2 + 20;
        toolTip.y = card.y - card.height / 2;
    }

    update() {
        if (this.gameLocked) {
            this.gameLockedText.setVisible(true);
        } else {
            this.gameLockedText.setVisible(false);
        }
    }
}