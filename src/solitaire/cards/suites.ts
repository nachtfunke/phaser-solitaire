import type { CardModel } from "../models/card";
import type { SuiteModel } from "../models/suite";
import type { HeartsSuit, SuitModel, SuitType } from "../models/suit";
import { heartsSuit } from "../suits";
import { createAllSuiteCards } from "./helpers";

// A Suite is a complete collection of cards in the same suit, ordered by rank.
// What constitutes a complete suite is not known by the Suite itself, instead it depends on the context of the deck used and the type of solitaire game.
export class Suite<S extends SuitType | SuitModel> implements SuiteModel<S> {
    suit: S;
    cards: CardModel<S>[];

    constructor(suit: S, cards: CardModel<S>[]) {
        this.suit = suit;
        this.cards = cards;
    }

    public getCard(id: string): CardModel<S> | undefined {
        return this.cards.find((card) => card.id === id);
    }

    public getCardByName(name: string): CardModel<S> | undefined {
        return this.cards.find((card) => card.name === name);
    }

    public getCardByRank(rank: number): CardModel<S> | undefined {
        return this.cards.find((card) => card.rank === rank);
    }
}