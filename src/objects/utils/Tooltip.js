import Phaser from 'phaser';
import { STYLES } from '../../settings/styles';

export default class Tooltip extends Phaser.GameObjects.Container {
    #container;
    #background;
    #objectAttachedTo;
    #width;
    #padding;
    text;

    constructor(scene, objectAttachedTo, text, { width, padding } = {}) {
        super(scene, 0, 0);
        this.scene = scene;
        this.#objectAttachedTo = objectAttachedTo;

        this.#width = width || 100;
        this.#padding = padding || 10;

        // set its origin points to the right upper corner, with a bit of spacing
        this.x = this.#objectAttachedTo.x + this.#objectAttachedTo.width / 2 + 10;
        this.y = this.#objectAttachedTo.y - this.#objectAttachedTo.height / 2;
        this.text = text;

        // will hold the background and the text
        this.#container = this.scene.add.container(this.x, this.y);

        this.#render();

        this.#container.setDepth(this.#objectAttachedTo.depth + 1);

        this.scene.add.existing(this);
    }

    #renderBackground() {
        if (this.#background) {
            this.#background.clear();
        } else {
            this.#background = this.scene.add.graphics();
            this.#background.setDepth(0);
            this.#container.add(this.#background);
        }

        const { width, height } = this.text.getBounds();
        this.#background.fillStyle(STYLES.debugging.background.color, STYLES.debugging.background.alpha);
        this.#background.fillRoundedRect(0, 0, width, height, STYLES.debugging.background.borderRadius);
    }

    #renderText(update = false) {
        if (update) {
            // Update the existing text
            this.text.setText(this.text);
        } else {
            this.text = this.scene.add.text(0, 0, this.text, {
                fontFamily: STYLES.debugging.text.fontFamily,
                fontSize: STYLES.debugging.text.fontSize,
                color: STYLES.debugging.text.color,
                wordWrap: { width: this.#width, useAdvancedWrap: true },
            });
            this.text.setPadding(this.#padding);
            this.#container.add(this.text);
            this.text.setDepth(2);
        }
    }

    #resetContainerPosition() {
        this.x = this.#objectAttachedTo.x + this.#objectAttachedTo.width / 2 + 10;
        this.y = this.#objectAttachedTo.y - this.#objectAttachedTo.height / 2;

        this.#container.setPosition(this.x, this.y);
    }

    #render() {
        this.#renderText();
        this.#renderBackground();

        this.#container.sendToBack(this.#background);
    }

    setAlpha(alpha) {
        this.#container.alpha = alpha;
    }

    update(objectAttachedTo, newText) {
        // Update the reference to the attached object
        this.#objectAttachedTo = objectAttachedTo;

        this.#container.setDepth(this.#objectAttachedTo.depth + 1);

        // Update the position of the container
        this.#resetContainerPosition();

        // Optionally, you can also update the text content or other properties here if needed
        if (newText) {
            this.text.setText(newText);
        }

        // Update the background to fit the new text
        this.#renderBackground();
    }

    destroy() {
        this.#container.destroy();
        super.destroy();
    }
}
