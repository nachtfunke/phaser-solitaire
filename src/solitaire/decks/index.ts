import { Card, JokerCard } from "../cards/helpers";
import type { CardModel } from "../models/card";
import type { DeckModel } from "../models/deck";
import type { SuitType, SuitModel } from "../models/suit";
import { heartsSuit, spadesSuit, clubsSuit, diamondsSuit } from "../suits";

export const DEFAULT_SUITS = [heartsSuit, spadesSuit, clubsSuit, diamondsSuit];
export const DEFAULT_RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
export const DEFAULT_JOKERS = 2;

// a deck implements four suites of cards and jokers.
// This is a static collection of playing cards. It does not know, which cards may or may not be used, it just determines which cards are part of such a deck.
// A deck also has no information about its suits rank, so suites are not being provided by the deck. What constitutes a suite is subject to the game.
export class Deck implements DeckModel {
    public id: string;
    public name: string;
    public group: string;
    public description?: string;
    public documentationUrl?: string;
    public cards?: CardModel<SuitType | SuitModel>[];
    public suits?: SuitType[] | SuitModel[];

    constructor(id: string, name: string, group: string, suits?:SuitType[] | SuitModel[] , cards?: CardModel<SuitType | SuitModel>[], meta?: {}) {
        this.id = id;
        this.name = name;
        this.group = group;

        // neither cards nor suits were provided, fallback on the default suits and create cards from them
        if (!cards && !suits) {
            this.suits = DEFAULT_SUITS;

            // create cards from suits
            this.cards = DEFAULT_SUITS.flatMap((suit) => {
                return DEFAULT_RANKS.map((rank) => {
                    return new Card(suit, rank);
                });
            });

            // add jokers
            for (let i = 1; i <= DEFAULT_JOKERS; i++) {
                this.cards.push(new JokerCard(i % 2 === 0 ? "red" : "black"));
            };

        }

        // suits were provided, but no cards, create cards from suits
        if (!cards && suits) {
            this.suits = suits;

            // create cards from suits
            this.cards = suits.flatMap((suit) => {
                return DEFAULT_RANKS.map((rank) => {
                    return new Card(suit, rank);
                });
            });

            // add jokers; 2 for every 2 colors in the suits
            for (let i = 1; i <= Math.floor(suits.length / 2); i++) {
                this.cards.push(new JokerCard(i % 2 === 0 ? "red" : "black"));
            };
        }

        // cards were provided, but no suits, create suits from cards
        if (cards && !suits) {
            // create suits from cards
            this.suits = cards.flatMap((card) => {
                return card.suit;
            });

            this.cards = cards;
        }

        // both cards and suits were provided, use them
        if (cards && suits) {
            this.cards = cards;
            this.suits = suits;
        }
    }
}

const fullFrenchDeck = new Deck('full-french', 'Full French Deck', 'french');

const doubleFrenchDeck = new Deck('double-french', 'Double Full French Deck', 'french', [...DEFAULT_SUITS, ...DEFAULT_SUITS]);

const tripleFrenchDeck = new Deck('triple-french', 'Triple Full French Deck', 'french', [...DEFAULT_SUITS, ...DEFAULT_SUITS, ...DEFAULT_SUITS]);

const strippedFrenchDeck = new Deck('stripped-french', 'Stripped French Deck', 'french', DEFAULT_SUITS, DEFAULT_SUITS.flatMap((suit) => {
    const ranks = [1, 9, 10, 11, 12, 13]
    return ranks.map((rank) => {
        return new Card(suit, rank);
    });
}));

const piquetDeck = new Deck('piquet', 'Piquet Deck', 'french', DEFAULT_SUITS, DEFAULT_SUITS.flatMap((suit) => {
    const ranks = [1, 7, 8, 9, 10, 11, 12, 13]
    return ranks.map((rank) => {
        return new Card(suit, rank);
    });
}));

const doublePiquetDeck = new Deck('piquet', 'Piquet Deck', 'french', [...DEFAULT_SUITS, ...DEFAULT_SUITS], [...DEFAULT_SUITS, ...DEFAULT_SUITS].flatMap((suit) => {
    const ranks = [1, 7, 8, 9, 10, 11, 12, 13]
    return ranks.map((rank) => {
        return new Card(suit, rank);
    });
}));

export const decks = {
    french: {
        full: fullFrenchDeck,
        double: doubleFrenchDeck,
        triple: tripleFrenchDeck,
        stripped: strippedFrenchDeck,
        piquet: piquetDeck,
        doublePiquet: doublePiquetDeck,
    },
}