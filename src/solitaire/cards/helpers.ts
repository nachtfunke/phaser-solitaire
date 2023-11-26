import type { CardModel } from "../models/card";
import type { ClubsSuit, DiamondsSuit, HeartsSuit, JokerSuit, SpadesSuit, SuitModel, SuitRank, SuitType } from "../models/suit";
import type { SuiteType } from "../models/suite";

export const getCardType = <S extends SuitType | SuitModel>(rank: number): CardModel<S>["type"] => {
    if (rank === 0) {
        return "joker";
    } else if (rank > 10) {
        return "face";
    } else {
        return "number";
    }
};

export const createCardName = <S extends SuitType | SuitModel>(suit: S, rank: number): string => {
    if (rank === 0) {
        return "Joker";
    } else if (rank === 1) {
        return `Ace of ${suit.name}`;
    } else if (rank >= 11) {
        switch (rank) {
            case 11:
                return `Jack of ${suit.name}`;
            case 12:
                return `Queen of ${suit.name}`;
            case 13:
                return `King of ${suit.name}`;
            default:
                return "Unknown";
        }
    } else {
        return `${rank} of ${suit.name}`;
    }
}


export class Card<S extends SuitType | SuitModel> implements CardModel<S> {
    public id: string;
    public suit: S;
    public type: CardModel<S>["type"];
    public rank: CardModel<S>["rank"];
    public name: string;

    constructor(suit: S, rank: CardModel<S>["rank"], id?: string) {
        this.id = id ?? `${suit.id}-${rank}`;
        this.suit = suit;
        this.rank = rank;
        this.type = this.setType();
        this.name = this.setName();
    }

    private setType(): CardModel<S>["type"] {
        return getCardType(this.rank);
    }

    private setName(): string {
        return createCardName(this.suit, this.rank);
    }
}

export class SpadesCard extends Card<SpadesSuit> {
    constructor(rank: SuitRank) {
        super({
            id: "spades",
            name: "Spades",
            color: "black",
        }, rank);
    }
}

export class ClubsCard extends Card<ClubsSuit> {
    constructor(rank: SuitRank) {
        super({
            id: "clubs",
            color: "black",
            name: "Clubs",
        }, rank);
    }
}

export class HeartsCard extends Card<HeartsSuit> {
    constructor(rank: SuitRank) {
        super({
            id: "hearts",
            name: "Hearts",
            color: "red",
        }, rank);
    }
}

export class DiamondsCard extends Card<DiamondsSuit> {
    constructor(rank: SuitRank) {
        super({
            id: "diamonds",
            name: "Diamonds",
            color: "red",
        }, rank);
    }
}

export class JokerCard extends Card<JokerSuit> {
    constructor(color: "red" | "black") {
        super({
            id: "joker",
            name: "Joker",
            color: color,
        }, 0, `joker-${color}`);
    }
}

export const createSuitCard = <S extends SuitType | SuitModel>(suit: S, rank: CardModel<S>["rank"] ): CardModel<S> => {
    return new Card(suit, rank);
}

export const createAllSuiteCards = (suite: SuiteType): CardModel<SuiteType['suit']>[] => {
    const cards: CardModel<SuiteType['suit']>[] = [];
    for (let i = 1; i <= suite.cards.length; i++) {
        cards.push(createSuitCard(suite.suit, i as SuitRank));
    }
    
    return cards;
}